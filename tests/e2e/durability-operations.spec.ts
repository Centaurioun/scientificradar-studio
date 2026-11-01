import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const articleId = 'art-quantum-repeater';
type StoredSnapshot = {
  storageRevision?: number;
  articles: Array<{ id: string; title: string; slug: string; version: number; bodyHtml?: string }>;
  revisions: Array<{ id: string; articleId: string; version: number; source: string; snapshot: { title: string; bodyHtml: string } }>;
  auditReportsByArticleId: Record<string, unknown>;
};

async function readSnapshot(page: import('@playwright/test').Page): Promise<StoredSnapshot> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db');
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('studio_state')) request.result.createObjectStore('studio_state');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<StoredSnapshot>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readonly');
      const request = tx.objectStore('studio_state').get('root_snapshot_v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return snapshot;
  });
}

async function installWriteGate(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    const win = window as typeof window & { __hold?: boolean; __release?: boolean; __abort?: boolean; __heldStudioWrite?: boolean };
    win.__hold = false;
    win.__release = false;
    win.__abort = false;
    win.__heldStudioWrite = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args);
      if (win.__hold && this.name === 'studio_state' && args[1] === 'root_snapshot_v1') {
        win.__hold = false;
        win.__heldStudioWrite = true;
        const keepAlive = () => {
          if (win.__release) {
            if (win.__abort) this.transaction.abort();
            return;
          }
          const next = this.get('root_snapshot_v1');
          next.onsuccess = keepAlive;
        };
        const next = this.get('root_snapshot_v1');
        next.onsuccess = keepAlive;
      }
      return request;
    };
  });
}

async function gate(page: import('@playwright/test').Page, values: { hold?: boolean; release?: boolean; abort?: boolean }) {
  await page.evaluate((state) => {
    const win = window as typeof window & { __hold?: boolean; __release?: boolean; __abort?: boolean };
    if (state.hold !== undefined) win.__hold = state.hold;
    if (state.release !== undefined) win.__release = state.release;
    if (state.abort !== undefined) win.__abort = state.abort;
  }, values);
}

function revisionRow(page: import('@playwright/test').Page) {
  return page.locator(`a[href="/articles/${articleId}/edit"]`).first()
    .locator('xpath=ancestor::div[contains(@class,"p-4")]');
}

test('fresh revision restoration commits a new sanitized version before success feedback', async ({ page, diagnostics }) => {
  await page.goto('/dashboard');
  await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db');
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('studio_state')) request.result.createObjectStore('studio_state');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<StoredSnapshot>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readonly');
      const request = tx.objectStore('studio_state').get('root_snapshot_v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const revision = snapshot.revisions.find((item) => item.articleId === id);
    if (!revision) throw new Error('Expected a seeded article revision.');
    revision.snapshot.bodyHtml = '<h1>Restored heading</h1><script>window.__restoreCanary = true</script><p>Safe text</p>';
    snapshot.storageRevision = (snapshot.storageRevision || 0) + 1;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readwrite');
      tx.objectStore('studio_state').put(snapshot, 'root_snapshot_v1');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, articleId);
  await page.reload();
  await page.goto('/revisions');
  const before = await readSnapshot(page);
  const targetRevision = before.revisions.find((revision) => revision.articleId === articleId);
  expect(targetRevision).toBeTruthy();
  const row = revisionRow(page);
  await row.getByRole('button', { name: 'Restore Snapshot' }).first().click();
  await expect(page.getByRole('status')).toContainText(/restored/i);
  const after = await readSnapshot(page);
  const article = after.articles.find((item) => item.id === articleId);
  expect(article?.title).toBe(targetRevision?.snapshot.title);
  expect(article?.bodyHtml).not.toMatch(/<script|<h1\b/i);
  expect(article?.bodyHtml).toContain('Safe text');
  expect(article?.version).toBeGreaterThan(before.articles.find((item) => item.id === articleId)?.version || 0);
  expect(after.revisions.filter((revision) => revision.articleId === articleId && revision.source === 'restore')).toHaveLength(
    before.revisions.filter((revision) => revision.articleId === articleId && revision.source === 'restore').length + 1
  );
  await page.reload();
  expect((await readSnapshot(page)).articles.find((item) => item.id === articleId)?.title).toBe(targetRevision?.snapshot.title);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('aborted revision restoration leaves the stored article and editor draft unchanged', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  await page.goto(`/articles/${articleId}/edit`);
  const original = (await readSnapshot(page)).articles.find((item) => item.id === articleId);
  const draftTitle = `Unsaved before restore abort ${Date.now()}`;
  const restoreCount = (await readSnapshot(page)).revisions.filter((revision) => revision.articleId === articleId && revision.source === 'restore').length;
  const title = page.getByRole('textbox', { name: 'Article Title (H1)' });
  await title.fill(draftTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes');
  await page.getByRole('button', { name: /History/ }).click();
  await gate(page, { hold: true });
  await page.getByRole('button', { name: 'Restore as New Version' }).first().click();
  await expect(page.getByRole('button', { name: 'Restoring…' })).toBeVisible();
  await expect(page.getByRole('status')).toBeHidden();
  await gate(page, { abort: true, release: true });
  await expect(page.getByRole('status')).toContainText(/failed|not saved|abort/i);
  await expect(title).toHaveValue(draftTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes');
  const after = await readSnapshot(page);
  expect(after.articles.find((item) => item.id === articleId)?.title).toBe(original?.title);
  expect(after.revisions.filter((revision) => revision.articleId === articleId && revision.source === 'restore')).toHaveLength(restoreCount);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('duplicate success returns the same stable ID and unique slug persisted across reload', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  const concurrentTab = await page.context().newPage();
  await page.goto('/articles');
  await concurrentTab.goto('/dashboard');
  const original = (await readSnapshot(page)).articles.find((item) => item.id === articleId);
  expect(original).toBeTruthy();
  await gate(page, { hold: true });
  await page.getByRole('button', { name: `Duplicate ${original?.title}` }).click();
  await expect(page.getByRole('status')).toBeHidden();
  await page.waitForFunction(() => (window as typeof window & { __heldStudioWrite?: boolean }).__heldStudioWrite === true);
  const unrelatedWrite = concurrentTab.evaluate(async () => {
    const win = window as typeof window & { __concurrentMutationQueued?: boolean };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db');
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('studio_state')) request.result.createObjectStore('studio_state');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readwrite');
      win.__concurrentMutationQueued = true;
      const store = tx.objectStore('studio_state');
      const request = store.get('root_snapshot_v1');
      request.onsuccess = () => {
        const snapshot = request.result;
        snapshot.theme = 'dark';
        snapshot.storageRevision = (snapshot.storageRevision || 0) + 1;
        store.put(snapshot, 'root_snapshot_v1');
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await concurrentTab.waitForFunction(() => (window as typeof window & { __concurrentMutationQueued?: boolean }).__concurrentMutationQueued === true);
  await gate(page, { release: true });
  await unrelatedWrite;
  await expect(page.getByRole('status')).toContainText(/duplicated/i);
  const after = await readSnapshot(page);
  expect((after as StoredSnapshot & { theme?: string }).theme).toBe('dark');
  const copies = after.articles.filter((item) => item.title === `${original?.title} (Copy)`);
  expect(copies).toHaveLength(1);
  expect(copies[0].id).toMatch(/^art-/);
  expect(copies[0].slug).toContain('-copy');
  await expect(page.getByRole('status')).toContainText(`/${copies[0].slug}`);
  await page.reload();
  expect((await readSnapshot(page)).articles.find((item) => item.id === copies[0].id)).toMatchObject(copies[0]);
  await concurrentTab.close();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('failed duplication is not acknowledged and creates no persisted copy', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  await page.goto('/articles');
  const original = (await readSnapshot(page)).articles.find((item) => item.id === articleId);
  const beforeCount = (await readSnapshot(page)).articles.length;
  await gate(page, { hold: true });
  await page.getByRole('button', { name: `Duplicate ${original?.title}` }).click();
  await expect(page.getByRole('status')).toBeHidden();
  await gate(page, { abort: true, release: true });
  await expect(page.getByRole('status')).toContainText(/duplicate failed|could not duplicate/i);
  expect((await readSnapshot(page)).articles).toHaveLength(beforeCount);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('deletion is acknowledged only after commit and remains deleted after reload', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  await page.goto('/articles');
  const original = (await readSnapshot(page)).articles.find((item) => item.id === articleId);
  await gate(page, { hold: true });
  await page.getByRole('button', { name: `Delete ${original?.title}` }).click();
  await page.getByRole('dialog', { name: 'Confirm article deletion' }).getByRole('button', { name: 'Delete Permanently' }).click();
  await expect(page.getByRole('status')).toBeHidden();
  await expect(page.getByRole('button', { name: `Delete ${original?.title}` })).toBeVisible();
  await gate(page, { release: true });
  await expect(page.getByRole('status')).toContainText(/deleted/i);
  expect((await readSnapshot(page)).articles.some((item) => item.id === articleId)).toBe(false);
  await page.reload();
  expect((await readSnapshot(page)).articles.some((item) => item.id === articleId)).toBe(false);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('aborted deletion reports failure and keeps the article persisted', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  await page.goto('/articles');
  const original = (await readSnapshot(page)).articles.find((item) => item.id === articleId);
  await gate(page, { hold: true });
  await page.getByRole('button', { name: `Delete ${original?.title}` }).click();
  await page.getByRole('dialog', { name: 'Confirm article deletion' }).getByRole('button', { name: 'Delete Permanently' }).click();
  await gate(page, { abort: true, release: true });
  await expect(page.getByRole('status')).toContainText(/delete failed|not deleted/i);
  expect((await readSnapshot(page)).articles.some((item) => item.id === articleId)).toBe(true);
  await page.reload();
  expect((await readSnapshot(page)).articles.some((item) => item.id === articleId)).toBe(true);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('an aborted SEO audit is reported as computed in memory but not durably saved', async ({ page, diagnostics }) => {
  await installWriteGate(page);
  await page.goto(`/articles/${articleId}/seo`);
  const before = await readSnapshot(page);
  await gate(page, { hold: true });
  await page.getByRole('button', { name: 'Run SEO Audit' }).click();
  await expect(page.getByRole('status')).toBeHidden();
  await gate(page, { abort: true, release: true });
  await expect(page.getByRole('status')).toContainText(/calculated in memory.*not saved/i);
  expect((await readSnapshot(page)).auditReportsByArticleId[articleId]).toEqual(before.auditReportsByArticleId[articleId]);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('an SEO audit receipt reports persistence only after its report exists in IndexedDB', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/seo`);
  await page.getByRole('button', { name: 'Run SEO Audit' }).click();
  await expect(page.getByRole('status')).toContainText(/audit saved/i);
  const stored = (await readSnapshot(page)).auditReportsByArticleId[articleId];
  expect(stored).toBeTruthy();
  await page.reload();
  expect((await readSnapshot(page)).auditReportsByArticleId[articleId]).toEqual(stored);
  await expectNoFatalBrowserFailures(diagnostics);
});
