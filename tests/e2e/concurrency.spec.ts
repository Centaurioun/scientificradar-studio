import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const articleId = 'art-quantum-repeater';

async function installStudioWriteGate(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    const win = window as typeof window & {
      __holdStudioWrite?: boolean;
      __releaseStudioWrite?: boolean;
      __abortHeldStudioWrite?: boolean;
    };
    win.__holdStudioWrite = false;
    win.__releaseStudioWrite = false;
    win.__abortHeldStudioWrite = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args);
      if (win.__holdStudioWrite && this.name === 'studio_state' && args[1] === 'root_snapshot_v1') {
        win.__holdStudioWrite = false;
        const keepAlive = () => {
          if (win.__releaseStudioWrite) {
            if (win.__abortHeldStudioWrite) this.transaction.abort();
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

async function setWriteGate(page: import('@playwright/test').Page, values: { hold?: boolean; release?: boolean; abort?: boolean }) {
  await page.evaluate((gate) => {
    const win = window as typeof window & {
      __holdStudioWrite?: boolean;
      __releaseStudioWrite?: boolean;
      __abortHeldStudioWrite?: boolean;
    };
    if (gate.hold !== undefined) win.__holdStudioWrite = gate.hold;
    if (gate.release !== undefined) win.__releaseStudioWrite = gate.release;
    if (gate.abort !== undefined) win.__abortHeldStudioWrite = gate.abort;
  }, values);
}

async function readPersistedArticle(page: import('@playwright/test').Page) {
  return page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<{ articles: Array<{ id: string; title: string; version: number; seo: { title?: string } }> }>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readonly');
      const request = tx.objectStore('studio_state').get('root_snapshot_v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return snapshot.articles.find((article) => article.id === id);
  }, articleId);
}

async function readPersistedRevisionCount(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<{ revisions: unknown[] }>((resolve, reject) => {
      const tx = db.transaction('studio_state', 'readonly');
      const request = tx.objectStore('studio_state').get('root_snapshot_v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return snapshot.revisions.length;
  });
}

test('two tabs reject a stale article draft and retain the committed IndexedDB revision', async ({ page, diagnostics }) => {
  const staleTab = await page.context().newPage();
  await page.goto(`/articles/${articleId}/edit`);
  await staleTab.goto(`/articles/${articleId}/edit`);
  const titleA = page.getByRole('textbox', { name: 'Article Title (H1)' });
  const titleB = staleTab.getByRole('textbox', { name: 'Article Title (H1)' });
  await expect(titleA).toBeVisible();
  await expect(titleB).toBeVisible();

  const committedTitle = `Cross-tab committed ${Date.now()}`;
  await titleA.fill(committedTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saved (Local)', { timeout: 10_000 });
  const durableVersion = (await readPersistedArticle(page))?.version;

  await titleB.fill(`Stale tab attempt ${Date.now()}`);
  await expect(staleTab.getByTestId('editor-save-indicator')).toContainText('Save failed', { timeout: 10_000 });
  expect((await readPersistedArticle(page))?.title).toBe(committedTitle);
  expect((await readPersistedArticle(page))?.version).toBe(durableVersion);

  await page.reload();
  await staleTab.reload();
  await expect(page.getByRole('textbox', { name: 'Article Title (H1)' })).toHaveValue(committedTitle);
  await expect(staleTab.getByRole('textbox', { name: 'Article Title (H1)' })).toHaveValue(committedTitle);
  await expectNoFatalBrowserFailures(diagnostics);
  await staleTab.close();
});

test('an older in-flight receipt preserves a newer dirty draft until its IndexedDB save commits', async ({ page, diagnostics }) => {
  await installStudioWriteGate(page);
  await page.goto(`/articles/${articleId}/edit`);
  const title = page.getByRole('textbox', { name: 'Article Title (H1)' });
  await expect(title).toBeVisible();
  const before = await readPersistedArticle(page);

  const firstTitle = `First held draft ${Date.now()}`;
  await setWriteGate(page, { hold: true });
  await title.fill(firstTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saving to local store…', { timeout: 10_000 });
  const finalTitle = `Final held draft ${Date.now()}`;
  await title.fill(finalTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes', { timeout: 10_000 });
  await setWriteGate(page, { release: true });
  await expect.poll(async () => (await readPersistedArticle(page))?.title, { timeout: 10_000 }).toBe(firstTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes', { timeout: 10_000 });
  const unloadGuard = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(unloadGuard).toBe(true);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saved (Local)', { timeout: 10_000 });
  const after = await readPersistedArticle(page);
  expect(after?.title).toBe(finalTitle);
  expect(after?.version).toBeGreaterThan(before?.version || 0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Article Title (H1)' })).toHaveValue(finalTitle);
  expect((await readPersistedArticle(page))?.title).toBe(finalTitle);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('a failed older receipt keeps a newer draft dirty and lets its scheduled retry commit', async ({ page, diagnostics }) => {
  await installStudioWriteGate(page);
  await page.goto(`/articles/${articleId}/edit`);
  const title = page.getByRole('textbox', { name: 'Article Title (H1)' });
  await expect(title).toBeVisible();
  const before = await readPersistedArticle(page);
  const firstTitle = `Aborted older draft ${Date.now()}`;
  await setWriteGate(page, { hold: true });
  await title.fill(firstTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saving to local store…', { timeout: 10_000 });
  const finalTitle = `Final after abort ${Date.now()}`;
  await title.fill(finalTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes', { timeout: 10_000 });
  await setWriteGate(page, { abort: true, release: true });
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Unsaved changes', { timeout: 10_000 });
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saved (Local)', { timeout: 10_000 });
  const after = await readPersistedArticle(page);
  expect(after?.title).toBe(finalTitle);
  expect(after?.version).toBeGreaterThan(before?.version || 0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Article Title (H1)' })).toHaveValue(finalTitle);
  expect((await readPersistedArticle(page))?.title).toBe(finalTitle);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('an outdated SEO Quick Fix is rejected against the latest persisted article', async ({ page, diagnostics }) => {
  const editorTab = await page.context().newPage();
  await page.goto(`/articles/${articleId}/seo`);
  await editorTab.goto(`/articles/${articleId}/edit`);

  const quickFixButton = page.locator('[data-testid^="audit-finding-"] button').filter({ hasNotText: 'Go to Field' }).first();
  await expect(quickFixButton).toBeVisible();
  const finding = quickFixButton.locator('xpath=ancestor::*[@data-testid]');
  const before = await readPersistedArticle(page);
  const changedTitle = `Quick Fix concurrency ${Date.now()}`;
  await editorTab.getByRole('textbox', { name: 'Article Title (H1)' }).fill(changedTitle);
  await expect(editorTab.getByTestId('editor-save-indicator')).toContainText('Saved (Local)', { timeout: 10_000 });

  await quickFixButton.click();
  await finding.getByRole('button', { name: 'Apply Fix & Save Revision' }).click();
  await expect(page.getByText(/Quick Fix error: Article changed/)).toBeVisible();
  const after = await readPersistedArticle(page);
  expect(after?.title).toBe(changedTitle);
  expect(after?.seo.title).toBe(before?.seo.title);
  await expectNoFatalBrowserFailures(diagnostics);
  await editorTab.close();
});

test('a fresh Quick Fix commits durably and adds one editorial revision', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/seo`);
  const quickFixButton = page.locator('[data-testid^="audit-finding-"] button').filter({ hasNotText: 'Go to Field' }).first();
  await expect(quickFixButton).toBeVisible();
  const finding = quickFixButton.locator('xpath=ancestor::*[@data-testid]');
  const before = await readPersistedArticle(page);
  const revisionCount = await readPersistedRevisionCount(page);
  await quickFixButton.click();
  await finding.getByRole('button', { name: 'Apply Fix & Save Revision' }).click();
  await expect(page.getByText(/Applied deterministic Quick Fix .* saved revision v/)).toBeVisible();
  const after = await readPersistedArticle(page);
  expect(after?.version).toBe((before?.version || 0) + 1);
  expect(await readPersistedRevisionCount(page)).toBe(revisionCount + 1);
  await expectNoFatalBrowserFailures(diagnostics);
});

test('an aborted IndexedDB transaction reports failure and keeps the unsaved editor draft', async ({ page, diagnostics }) => {
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    Object.defineProperty(window, '__abortNextStudioWrite', { configurable: true, writable: true, value: false });
    IDBObjectStore.prototype.put = function (...args) {
      const shouldAbort = (window as typeof window & { __abortNextStudioWrite?: boolean }).__abortNextStudioWrite;
      if (shouldAbort && this.name === 'studio_state' && args[1] === 'root_snapshot_v1') {
        (window as typeof window & { __abortNextStudioWrite?: boolean }).__abortNextStudioWrite = false;
        this.transaction.abort();
        throw new DOMException('Controlled transaction abort for regression test', 'AbortError');
      }
      return originalPut.apply(this, args);
    };
  });
  await page.goto(`/articles/${articleId}/edit`);
  const title = page.getByRole('textbox', { name: 'Article Title (H1)' });
  await expect(title).toBeVisible();
  const before = await readPersistedArticle(page);
  const unsavedTitle = `Aborted draft ${Date.now()}`;
  await page.evaluate(() => {
    (window as typeof window & { __abortNextStudioWrite?: boolean }).__abortNextStudioWrite = true;
  });
  await title.fill(unsavedTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Save failed', { timeout: 10_000 });
  await expect(title).toHaveValue(unsavedTitle);
  expect((await readPersistedArticle(page))?.title).toBe(before?.title);
  const recoveredTitle = `Recovered after abort ${Date.now()}`;
  await title.fill(recoveredTitle);
  await expect(page.getByTestId('editor-save-indicator')).toContainText('Saved (Local)', { timeout: 10_000 });
  expect((await readPersistedArticle(page))?.title).toBe(recoveredTitle);
  await expectNoFatalBrowserFailures(diagnostics);
});
