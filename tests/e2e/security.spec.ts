import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

type ExportedSnapshot = {
  articles: Array<Record<string, unknown> & { id: string; bodyHtml: string }>;
  pages: Array<Record<string, unknown> & { id: string; bodyHtml: string }>;
  knowledgeLinks?: Array<{ term: string }>;
  [key: string]: unknown;
};

async function readPersistedSnapshot(page: import('@playwright/test').Page): Promise<ExportedSnapshot | undefined> {
  return page.evaluate(
    () =>
      new Promise<ExportedSnapshot | undefined>((resolve, reject) => {
        const request = indexedDB.open('scientificradar-studio-p0-db', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const read = db.transaction('studio_state', 'readonly').objectStore('studio_state').get('root_snapshot_v1');
          read.onerror = () => reject(read.error);
          read.onsuccess = () => {
            db.close();
            resolve(read.result as ExportedSnapshot | undefined);
          };
        };
      }),
  );
}

async function writePersistedSnapshot(page: import('@playwright/test').Page, snapshot: ExportedSnapshot): Promise<void> {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('scientificradar-studio-p0-db', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('studio_state', 'readwrite');
          transaction.objectStore('studio_state').put(value, 'root_snapshot_v1');
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error || new Error('fixture transaction aborted'));
        };
      }),
    snapshot,
  );
}

async function instrumentRootSnapshotWrites(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    (window as Window & { __SRS_ROOT_SNAPSHOT_PUTS?: number }).__SRS_ROOT_SNAPSHOT_PUTS = 0;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'studio_state' && args[1] === 'root_snapshot_v1') {
        const scope = window as Window & { __SRS_ROOT_SNAPSHOT_PUTS?: number };
        scope.__SRS_ROOT_SNAPSHOT_PUTS = (scope.__SRS_ROOT_SNAPSHOT_PUTS ?? 0) + 1;
      }
      return put.apply(this, args);
    };
  });
}

test('SRS-RT-005 — imported static page event-handler canary remains inert after persisted reload', async ({ page, diagnostics }, testInfo) => {
  const marker = `srs-rt005-${testInfo.testId.replace(/[^a-z0-9-]/gi, '-')}`;
  const pageId = `test-${marker}`;
  const altText = `Disposable local canary ${marker}`;

  await page.addInitScript(() => {
    (window as Window & { __SRS_RT005_CANARY?: string[] }).__SRS_RT005_CANARY = [];
  });
  await page.goto('/settings');
  await expect(page.locator('#import-json-textarea')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Repository JSON' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('The local exported backup has no readable temporary path.');

  const snapshot = JSON.parse(await readFile(downloadPath, 'utf8')) as ExportedSnapshot;
  const existingPage = snapshot.pages[0];
  expect(existingPage, 'seeded backup should include a static page template').toBeDefined();
  const imageUrl = `/__srs_rt005_missing_image__.png?marker=${encodeURIComponent(marker)}`;
  const pageHtml = `<h2>Disposable security regression ${marker}</h2><p>Safe scientific text Ω β ∑ remains visible.</p><figure><img src="${imageUrl}" alt="${altText}" onerror="window.__SRS_RT005_CANARY.push('${marker}')"><figcaption>Local test figure caption ${marker}</figcaption></figure><svg onload="window.__SRS_RT005_CANARY.push('svg-${marker}')"><foreignObject><p>active foreign content</p></foreignObject></svg>`;

  snapshot.pages.push({
    ...existingPage,
    id: pageId,
    title: `Disposable security page ${marker}`,
    slug: `disposable-security-page-${marker}`,
    summary: 'Local-only Playwright security regression fixture.',
    bodyHtml: pageHtml,
    updatedAt: new Date().toISOString(),
  });
  const article = snapshot.articles[0];
  let knowledgeTerm = 'scientific concept';
  expect(article, 'seeded backup should include an article template').toBeDefined();
  if (article) {
    const knowledge = snapshot.knowledgeLinks?.[0];
    knowledgeTerm = knowledge?.term || knowledgeTerm;
    article.bodyHtml = `<h2>Imported article security regression ${marker}</h2><p>Article-safe text Γ Δ remains visible.</p><p><a href="/articles/${article.id}" data-knowledge-term="${knowledgeTerm}" onclick="window.__SRS_RT005_CANARY.push('knowledge-${marker}')">${knowledgeTerm}</a></p><img src="${imageUrl}" alt="Article local canary ${marker}" onerror="window.__SRS_RT005_CANARY.push('article-${marker}')">`;
  }

  await page.locator('#import-json-textarea').fill(JSON.stringify(snapshot));
  await page.getByRole('button', { name: 'Import Snapshot' }).click();
  await expect(page.getByText('Successfully restored repository snapshot from JSON.')).toBeVisible();

  await expect.poll(async () => {
    const persisted = await readPersistedSnapshot(page);
    return persisted?.pages.find((item) => item.id === pageId)?.bodyHtml;
  }).toContain(marker);

  const persisted = await readPersistedSnapshot(page);
  const persistedPage = persisted?.pages.find((item) => item.id === pageId);
  await testInfo.attach('srs-rt005-imported-application-state.json', {
    body: JSON.stringify({ importedPage: persistedPage }, null, 2),
    contentType: 'application/json',
  });

  await page.goto(`/pages/${pageId}/preview`);
  await expect(page.getByRole('heading', { name: `Disposable security page ${marker}` })).toBeVisible();
  await expect(page.getByText('Safe scientific text Ω β ∑ remains visible.')).toBeVisible();
  const image = page.getByRole('img', { name: altText });
  await expect(image).toBeAttached();
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete)).toBe(true);

  const dom = await page.locator('article').evaluate((article) => article.innerHTML);
  const canaryState = await page.evaluate(
    () => (window as Window & { __SRS_RT005_CANARY?: string[] }).__SRS_RT005_CANARY ?? [],
  );
  await testInfo.attach('srs-rt005-static-preview-dom.html', {
    body: dom,
    contentType: 'text/html',
  });
  await testInfo.attach('srs-rt005-canary-state.json', {
    body: JSON.stringify({ marker, executedMarkers: canaryState, failedLocalRequests: diagnostics.failedLocalRequests }, null, 2),
    contentType: 'application/json',
  });

  expect(canaryState, 'imported inline event handlers must never run in static preview').not.toContain(marker);
  await expect(image).not.toHaveAttribute('onerror');

  await page.goto(`/articles/${article!.id}/preview`);
  await expect(page.getByRole('heading', { name: `Imported article security regression ${marker}` })).toBeVisible();
  await expect(page.getByText('Article-safe text Γ Δ remains visible.')).toBeVisible();
  const knowledgeButton = page.getByRole('button', { name: knowledgeTerm, exact: true });
  await expect(knowledgeButton).toBeVisible();
  await knowledgeButton.hover();
  await expect(page.getByRole('dialog', { name: /Concept summary:/ })).toBeVisible();
  const articleDom = await page.locator('article').evaluate((element) => element.innerHTML);
  await testInfo.attach('srs-rt005-article-preview-dom.html', {
    body: articleDom,
    contentType: 'text/html',
  });
  const finalCanaryState = await page.evaluate(
    () => (window as Window & { __SRS_RT005_CANARY?: string[] }).__SRS_RT005_CANARY ?? [],
  );
  expect(finalCanaryState, 'no imported static or article HTML canary may execute').toEqual([]);
});

test('opening and refreshing a second tab does not rewrite a newer saved article snapshot', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('#import-json-textarea')).toBeVisible();
  const initial = await readPersistedSnapshot(page);
  expect(initial?.articles[0]).toBeDefined();
  if (!initial?.articles[0]) throw new Error('The seeded snapshot must contain an article for this test.');

  const safeBody = '<h2>Newer tab save remains readable</h2><p>Saved scientific text Ω β and DOI 10.1038/s41586-026-01492-x.</p>';
  initial.articles[0].title = 'Newer tab save remains readable';
  initial.articles[0].bodyHtml = safeBody;
  await writePersistedSnapshot(page, initial);

  const secondTab = await page.context().newPage();
  await instrumentRootSnapshotWrites(secondTab);
  await secondTab.goto(`/articles/${initial.articles[0].id}/preview`);
  await expect(secondTab.getByRole('heading', { name: 'Newer tab save remains readable', exact: true, level: 1 })).toBeVisible();
  await expect(secondTab.getByText(/Saved scientific text Ω β and DOI 10\.1038/)).toBeVisible();

  const afterSecondTabHydration = await readPersistedSnapshot(secondTab);
  expect(afterSecondTabHydration).toEqual(initial);
  expect(await secondTab.evaluate(() => (window as Window & { __SRS_ROOT_SNAPSHOT_PUTS?: number }).__SRS_ROOT_SNAPSHOT_PUTS)).toBe(0);

  await secondTab.reload();
  await expect(secondTab.getByRole('heading', { name: 'Newer tab save remains readable', exact: true, level: 1 })).toBeVisible();
  await expect(secondTab.getByText(/Saved scientific text Ω β and DOI 10\.1038/)).toBeVisible();
  expect(await secondTab.evaluate(() => (window as Window & { __SRS_ROOT_SNAPSHOT_PUTS?: number }).__SRS_ROOT_SNAPSHOT_PUTS)).toBe(0);
  expect(await readPersistedSnapshot(secondTab)).toEqual(initial);
  await secondTab.close();
});

test('unsafe HTML in a persisted historical page stays inert without hydration rewriting storage', async ({ page }) => {
  const marker = 'srs-historical-page-canary';
  await page.addInitScript(() => {
    (window as Window & { __SRS_HISTORICAL_CANARY?: string[] }).__SRS_HISTORICAL_CANARY = [];
  });
  await page.goto('/settings');
  await expect(page.locator('#import-json-textarea')).toBeVisible();
  const snapshot = await readPersistedSnapshot(page);
  expect(snapshot?.pages[0]).toBeDefined();
  if (!snapshot?.pages[0]) throw new Error('The seeded snapshot must contain a page for this test.');

  const historicalHtml = `<h2>Legacy scientific page Ω</h2><p>Historic safe text remains visible.</p><img src="/__missing_historical_canary__.png" alt="historical fixture" onerror="window.__SRS_HISTORICAL_CANARY.push('${marker}')">`;
  const pageId = snapshot.pages[0].id;
  snapshot.pages[0].bodyHtml = historicalHtml;
  snapshot.pages[0].title = 'Legacy scientific page';
  await writePersistedSnapshot(page, snapshot);
  await instrumentRootSnapshotWrites(page);

  await page.goto(`/pages/${pageId}/preview`);
  await expect(page.getByRole('heading', { name: 'Legacy scientific page', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByText('Historic safe text remains visible.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { __SRS_HISTORICAL_CANARY?: string[] }).__SRS_HISTORICAL_CANARY ?? [])).toEqual([]);
  await expect(page.getByRole('img', { name: 'historical fixture' })).not.toHaveAttribute('onerror');
  expect(await page.evaluate(() => (window as Window & { __SRS_ROOT_SNAPSHOT_PUTS?: number }).__SRS_ROOT_SNAPSHOT_PUTS)).toBe(0);

  const afterHydration = await readPersistedSnapshot(page);
  expect(afterHydration?.pages.find((item) => item.id === pageId)?.bodyHtml).toBe(historicalHtml);
});

test('invalid backup import leaves the previously persisted snapshot unchanged', async ({ page }) => {
  await page.goto('/settings');
  await expect.poll(async () => {
    const snapshot = await readPersistedSnapshot(page);
    return Boolean(snapshot && snapshot.articles.length > 0 && snapshot.pages.length > 0);
  }).toBe(true);
  const before = await readPersistedSnapshot(page);
  expect(before).toBeDefined();
  await page.locator('#import-json-textarea').fill(JSON.stringify({ articles: [] }));
  await page.getByRole('button', { name: 'Import Snapshot' }).click();
  await expect(page.getByText(/Import failed: Invalid backup schema/)).toBeVisible();
  const after = await readPersistedSnapshot(page);
  expect(after?.articles).toEqual(before?.articles);
  expect(after?.pages).toEqual(before?.pages);

  await page.locator('input[type="checkbox"]').check();
  const candidate = JSON.parse(JSON.stringify(before)) as ExportedSnapshot;
  candidate.pages[0].title = 'This import must not replace the saved state';
  await page.locator('#import-json-textarea').fill(JSON.stringify(candidate));
  await page.getByRole('button', { name: 'Import Snapshot' }).click();
  await expect(page.getByText(/Import failed: Persistence failure is enabled/)).toBeVisible();
  const afterSimulatedWriteFailure = await readPersistedSnapshot(page);
  expect(afterSimulatedWriteFailure?.pages).toEqual(before?.pages);
});
