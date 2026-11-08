import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const ownerEmail = 'owner@example.test';
const ownerPassword = 'Local-Only-Owner-Password-2026!';
const reviewerEmail = 'reviewer@example.test';
const reviewerPassword = 'Local-Only-Reviewer-Password-2026!';

async function expectPublicWebVisibility(page: import('@playwright/test').Page, slug: string, visible: boolean, title?: string, relatedTitle?: string, relatedSlug?: string, relatedArticleId?: string): Promise<string | null> {
  const configuredBase = process.env.SCIENTIFICRADAR_PUBLIC_WEB_BASE_URL;
  if (!configuredBase) return null;
  const base = new URL(configuredBase);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    throw new Error('SCIENTIFICRADAR_PUBLIC_WEB_BASE_URL must point to a local loopback Web server.');
  }
  const articleResponse = await page.request.get(new URL(`/article/${encodeURIComponent(slug)}`, base).toString(), { timeout: 15_000 });
  const relatedResponse = relatedSlug ? await page.request.get(new URL(`/article/${encodeURIComponent(relatedSlug)}`, base).toString(), { timeout: 15_000 }) : null;
  const homepageResponse = await page.request.get(new URL('/', base).toString(), { timeout: 15_000 });
  const topicsResponse = await page.request.get(new URL('/topics', base).toString(), { timeout: 15_000 });
  const topicResponse = await page.request.get(new URL('/topics/physics', base).toString(), { timeout: 15_000 });
  const searchQuery = title || slug;
  const searchResponse = await page.request.get(new URL(`/search?q=${encodeURIComponent(searchQuery)}`, base).toString(), { timeout: 15_000 });
  const sitemapResponse = await page.request.get(new URL('/sitemap.xml', base).toString(), { timeout: 15_000 });
  expect(searchResponse.status()).toBe(200);
  expect(homepageResponse.status()).toBe(200);
  expect(topicsResponse.status()).toBe(200);
  expect(topicResponse.status()).toBe(200);
  expect(sitemapResponse.status()).toBe(200);
  const searchHtml = await searchResponse.text();
  const searchResultIndex = searchHtml.indexOf(`/article/${slug}`);
  const searchHasArticleLink = searchResultIndex >= 0;
  const searchResultExcerpt = searchHasArticleLink
    ? searchHtml.slice(Math.max(0, searchResultIndex - 300), searchResultIndex + 500)
    : '';
  const sitemap = await sitemapResponse.text();
  const routeIsListed = sitemap.includes(`/article/${slug}`);
  const homepageHtml = await homepageResponse.text();
  const topicsHtml = await topicsResponse.text();
  const topicHtml = await topicResponse.text();
  if (visible) {
    expect(articleResponse.status()).toBe(200);
    const articleHtml = await articleResponse.text();
    expect(articleHtml).toContain(title || slug);
    if (relatedTitle) {
      expect(relatedResponse?.status(), `Expected active related article route ${relatedSlug}.`).toBe(200);
      expect(await relatedResponse!.text()).toContain(relatedTitle);
      expect(articleHtml).toContain(relatedArticleId || '');
      expect(articleHtml).toContain('Related Reading');
      expect(articleHtml).toContain(relatedTitle);
    }
    expect(searchHasArticleLink, `Expected public search to return ${slug}; search query: ${searchQuery}; article link excerpt: ${searchResultExcerpt}`).toBe(true);
  } else {
    expect(articleResponse.status()).toBe(404);
    expect(searchHasArticleLink, `Expected public search to exclude withdrawn ${slug}.`).toBe(false);
    expect(homepageHtml).not.toContain(title || slug);
    expect(topicsHtml).not.toContain(title || slug);
    expect(topicHtml).not.toContain(title || slug);
  }
  expect(routeIsListed, `Local unverified test publications must remain noindex and absent from sitemap: ${slug}; received: ${sitemap.slice(0, 800)}`).toBe(false);
  return searchResultExcerpt || null;
}

test('authenticated Studio UI saves, reviews, publishes, withdraws, and restores one exact server revision', async ({ page, diagnostics }, testInfo) => {
  test.skip(process.env.PLAYWRIGHT_SERVER_PUBLISHING_E2E !== 'true', 'Run via npm run test:e2e:publishing with its isolated SQLite configuration.');

  await page.goto('/articles/new');

  const title = 'Local publishing workflow integration fixture';
  const slug = 'local-publishing-workflow-integration-fixture';
  await page.getByLabel('Article Title (H1)').fill(title);
  await page.getByLabel('Scientific Abstract / Standfirst Summary').fill('Synthetic local integration content used to verify authenticated persistence and publication controls.');
  await page.getByRole('tablist', { name: 'Article metadata sections' })
    .getByRole('tab', { name: /Sources/ }).click();
  const sourceTitle = 'Heralded entanglement between atomic ensembles';
  await page.getByRole('checkbox', { name: new RegExp(sourceTitle) }).check();
  await page.getByLabel(`volume for ${sourceTitle}`).fill('29');
  await page.getByLabel(`issue for ${sourceTitle}`).fill('4');
  await page.getByLabel(`pages for ${sourceTitle}`).fill('35–42');
  await page.getByLabel(`articleNumber for ${sourceTitle}`).fill('e12345');

  const relatedArticles = page.getByLabel('Approved related articles');
  const relatedArticleIds = await relatedArticles.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(relatedArticleIds.length, 'The seeded local library should provide a same-locale published related article').toBeGreaterThan(0);
  await relatedArticles.selectOption(relatedArticleIds[0]);

  await page.getByRole('button', { name: 'Add concept' }).click();
  await page.getByLabel('Concept 1 title').fill('Photon');
  await page.getByLabel('Concept 1 definition').fill('A quantum of electromagnetic radiation.');
  await page.getByLabel('Concept 1 heading anchor').fill('results');

  await page.getByRole('button', { name: 'Add editorial notice' }).click();
  await page.getByLabel('Notice type').selectOption('correction');
  await page.getByLabel('Notice title').fill('Correction: article metadata');
  await page.getByLabel('Notice text').fill('The volume and page range were corrected from the publisher record.');
  await page.getByLabel('Notice source URL').fill('https://publisher.example.test/records/local-correction-fixture');
  await page.getByLabel('Related original or notice article').selectOption(relatedArticleIds[0]);
  await page.getByRole('button', { name: 'HTML Source' }).click();
  await page.getByRole('textbox', { name: 'Manuscript Body HTML Source Editor' }).fill(
    '<h2 id="results">Results</h2><p>Recovery fixture body text.</p><p>Inline equation <span data-math-tex="E = \\hbar \\omega" data-math-display="inline">E = ħω</span> and citation <sup data-citation-source-id="src-quantum-1">[1]</sup>.</p>'
  );
  await page.getByRole('button', { name: 'Apply HTML Source Changes' }).click();
  await page.getByRole('button', { name: 'Visual Editor' }).click();

  const publishing = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await publishing.getByRole('button', { name: 'Sign in' }).click();
  await expect(publishing.getByText(`Signed in: ${ownerEmail} · owner`)).toBeVisible();

  const createReviewer = await page.evaluate(async ({ email, password }) => {
    const response = await fetch('/api/studio/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'reviewer' }),
    });
    return { status: response.status, body: await response.json() };
  }, { email: reviewerEmail, password: reviewerPassword });
  expect(createReviewer.status).toBe(201);

  const candidateButton = publishing.getByRole('button', { name: 'Save local recovery + server review revision' });
  await candidateButton.click();
  await expect(publishing.getByRole('status')).toContainText('Server saved revision');
  await expect(publishing.getByText(/Candidate article art-.* · revision rev-art-/)).toBeVisible();
  await expect(page.getByText(/Local draft · v\d+/)).toBeVisible();

  const candidateLabel = await publishing.getByText(/Candidate article art-/).textContent();
  const articleId = candidateLabel?.match(/Candidate article (.+?) · revision/)?.[1];
  expect(articleId).toBeTruthy();

  // Build a second active server revision from the same valid, sanitized
  // synthetic snapshot. This tests relation authorization without weakening
  // server media-rights checks or relying on a locally published seed record.
  const relatedTarget = await page.evaluate(async ({ sourceArticleId, ownerEmail, ownerPassword, reviewerEmail, reviewerPassword }) => {
    const articleId = 'art-quantum-repeater';
    const revisionId = 'rev-art-quantum-repeater-related-fixture';
    const request = async (path: string, init: RequestInit = {}) => {
      const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
      const body = await response.json();
      return { status: response.status, body };
    };
    const sourceCandidate = await request(`/api/studio/publications/${encodeURIComponent(sourceArticleId)}`);
    if (sourceCandidate.status !== 200 || !sourceCandidate.body.snapshot) return { step: 'source-candidate', ...sourceCandidate };
    const snapshot = structuredClone(sourceCandidate.body.snapshot) as Record<string, unknown>;
    const timestamp = new Date().toISOString();
    snapshot.articleId = articleId;
    snapshot.revisionId = revisionId;
    snapshot.revisionNumber = 1;
    snapshot.slug = 'temporary-related-integration-fixture';
    snapshot.title = 'Temporary related article integration fixture';
    snapshot.dek = 'Synthetic local test fixture; not scientific evidence.';
    snapshot.summary = 'Synthetic local test fixture; not scientific evidence.';
    snapshot.publishedAt = timestamp;
    snapshot.updatedAt = timestamp;
    snapshot.status = 'in_review';
    snapshot.relatedIds = [];
    snapshot.editorialNotices = [];
    snapshot.seo = { noindex: true };
    const candidate = await request(`/api/studio/publications/${articleId}`, { method: 'PUT', body: JSON.stringify({ snapshot }) });
    if (candidate.status !== 200) return { step: 'candidate', ...candidate };
    await request('/api/studio/auth/session', { method: 'DELETE' });
    const reviewerLogin = await request('/api/studio/auth/session', { method: 'POST', body: JSON.stringify({ email: reviewerEmail, password: reviewerPassword }) });
    if (reviewerLogin.status !== 200) return { step: 'reviewer-login', ...reviewerLogin };
    const review = await request(`/api/studio/publications/${articleId}/review`, { method: 'POST', body: JSON.stringify({ revisionId, decision: 'approve', note: 'Approved synthetic destination fixture.' }) });
    if (review.status !== 200) return { step: 'review', ...review };
    await request('/api/studio/auth/session', { method: 'DELETE' });
    const ownerLogin = await request('/api/studio/auth/session', { method: 'POST', body: JSON.stringify({ email: ownerEmail, password: ownerPassword }) });
    if (ownerLogin.status !== 200) return { step: 'owner-login', ...ownerLogin };
    const publication = await request(`/api/studio/publications/${articleId}/publish`, { method: 'POST', headers: { 'idempotency-key': 'related-target-publication-fixture' }, body: JSON.stringify({ revisionId }) });
    const publications = await request('/api/publications');
    return { step: 'complete', publicationStatus: publication.status, publicationsStatus: publications.status, publication, publications: publications.body };
  }, { sourceArticleId: articleId!, ownerEmail, ownerPassword, reviewerEmail, reviewerPassword });
  expect(relatedTarget.step, JSON.stringify(relatedTarget)).toBe('complete');
  expect(relatedTarget.publicationStatus, JSON.stringify(relatedTarget)).toBe(200);
  expect(relatedTarget.publicationsStatus, JSON.stringify(relatedTarget)).toBe(200);
  expect(JSON.stringify(relatedTarget.publications)).toContain('art-quantum-repeater');

  await page.goto(`/articles/${encodeURIComponent(articleId!)}/edit`);
  await expect(page.getByLabel('Article Title (H1)')).toHaveValue(title);

  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('scientificradar-studio-p0-db', 1);
      request.onerror = () => reject(request.error ?? new Error('Unable to open local Studio database'));
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('studio_state', 'readwrite');
        transaction.objectStore('studio_state').clear();
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Unable to clear local Studio data')); };
        transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Local Studio data clear aborted')); };
      };
    });
  });
  await page.reload();
  const recovery = page.getByRole('region', { name: 'Recover server draft' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await recovery.getByRole('button', { name: 'Sign in and recover draft' }).click();
  await expect(page.getByTestId('server-draft-recovered')).toBeAttached();
  await expect(page.getByLabel('Article Title (H1)')).toHaveValue(title);
  const recoveredBody = page.getByRole('textbox', { name: 'Article body editor' });
  await expect(recoveredBody).toContainText('Recovery fixture body text.');
  await expect(recoveredBody.locator('[data-math-tex]').first()).toHaveAttribute('data-math-tex', 'E = \\hbar \\omega');
  await expect(recoveredBody.locator('[data-citation-source-id="src-quantum-1"]')).toBeVisible();
  const metadataTabs = page.getByRole('tablist', { name: 'Article metadata sections' });
  await metadataTabs.getByRole('tab', { name: /Sources/ }).click();
  expect(await relatedArticles.locator('option:checked').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual([relatedArticleIds[0]]);
  await expect(page.getByLabel('Concept 1 title')).toHaveValue('Photon');
  await expect(page.getByLabel('Concept 1 heading anchor')).toHaveValue('results');
  await expect(page.getByLabel('Notice title')).toHaveValue('Correction: article metadata');
  await expect(page.getByLabel(`volume for ${sourceTitle}`)).toHaveValue('29');
  await expect(page.getByLabel(`issue for ${sourceTitle}`)).toHaveValue('4');
  await expect(page.getByLabel(`pages for ${sourceTitle}`)).toHaveValue('35–42');
  await expect(page.getByLabel(`articleNumber for ${sourceTitle}`)).toHaveValue('e12345');

  const reopenedPublishing = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await reopenedPublishing.getByRole('button', { name: 'Sign in' }).click();
  await expect(reopenedPublishing.getByRole('status')).toContainText('Loaded server revision');
  await expect(reopenedPublishing.getByText(/Server publishing · in_review/)).toBeVisible();

  await reopenedPublishing.getByRole('button', { name: 'Approve exact revision' }).click();
  await expect(reopenedPublishing.getByRole('alert')).toContainText('SELF_REVIEW_FORBIDDEN');

  await reopenedPublishing.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Publishing email').fill(reviewerEmail);
  await page.getByLabel('Password', { exact: true }).fill(reviewerPassword);
  await reopenedPublishing.getByRole('button', { name: 'Sign in' }).click();
  await expect(reopenedPublishing.getByText(`Signed in: ${reviewerEmail} · reviewer`)).toBeVisible();
  await reopenedPublishing.getByRole('button', { name: 'Approve exact revision' }).click();
  await expect(reopenedPublishing.getByRole('status')).toContainText('Server recorded approval for exact revision');

  await reopenedPublishing.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await reopenedPublishing.getByRole('button', { name: 'Sign in' }).click();
  await expect(reopenedPublishing.getByRole('button', { name: 'Publish approved revision' })).toBeEnabled();
  await reopenedPublishing.getByRole('button', { name: 'Publish approved revision' }).click();
  await expect(reopenedPublishing.getByRole('status')).toContainText('Server published exact revision');
  await expect(reopenedPublishing.getByText(/Server publishing · published/)).toBeVisible();

  await page.reload();
  const afterPublishReload = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await afterPublishReload.getByRole('button', { name: 'Sign in' }).click();
  await expect(afterPublishReload.getByRole('status')).toContainText('Loaded server revision');
  await expect(afterPublishReload.getByText(/Server publishing · published/)).toBeVisible();
  await expect(afterPublishReload.getByRole('button', { name: 'Withdraw publication' })).toBeVisible();
  await expect(afterPublishReload.getByRole('button', { name: 'Publish approved revision' })).toHaveCount(0);

  const published = await page.evaluate(async () => {
    const response = await fetch('/api/publications');
    return await response.json() as Array<{ slug: string; status: string; relatedIds?: string[]; keyConcepts?: { title: string; headingId: string }[]; editorialNotices?: { type: string; title: string }[]; sources?: { volume?: string; issue?: string; pages?: string; articleNumber?: string }[] }>;
  });
  expect(published).toContainEqual(expect.objectContaining({ slug, status: 'published' }));
  const publishedFixture = published.find((item) => item.slug === slug);
  // The destination has an exact active server revision, so the relation is
  // eligible for the public snapshot.
  expect(publishedFixture?.relatedIds).toContain(relatedArticleIds[0]);
  expect(publishedFixture?.keyConcepts).toContainEqual(expect.objectContaining({ title: 'Photon', headingId: 'results' }));
  expect(publishedFixture?.editorialNotices).toContainEqual(expect.objectContaining({ type: 'correction', title: 'Correction: article metadata' }));
  expect(publishedFixture?.sources).toContainEqual(expect.objectContaining({ volume: '29', issue: '4', pages: '35–42', articleNumber: 'e12345' }));
  const relatedTitle = 'Temporary related article integration fixture';
  const publishedSearchResult = await expectPublicWebVisibility(page, slug, true, title, relatedTitle, 'temporary-related-integration-fixture', relatedArticleIds[0]);
  if (publishedSearchResult) {
    await testInfo.attach('local-web-published-search-result.html', {
      body: publishedSearchResult,
      contentType: 'text/html',
    });
  }

  await afterPublishReload.getByLabel('Correction or takedown reason').fill('Local integration withdrawal check.');
  await afterPublishReload.getByRole('button', { name: 'Withdraw publication' }).click();
  await expect(afterPublishReload.getByRole('status')).toContainText('Server withdrew exact revision');
  const withdrawn = await page.evaluate(async () => await (await fetch('/api/publications')).json() as Array<{ slug: string }>);
  expect(withdrawn.some((item) => item.slug === slug)).toBe(false);
  await expectPublicWebVisibility(page, slug, false, title);

  await page.reload();
  const afterWithdrawReload = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await afterWithdrawReload.getByRole('button', { name: 'Sign in' }).click();
  await expect(afterWithdrawReload.getByText(/Server publishing · withdrawn/)).toBeVisible();
  await expect(afterWithdrawReload.getByRole('button', { name: 'Restore withdrawn revision' })).toBeVisible();
  await expect(afterWithdrawReload.getByRole('button', { name: 'Withdraw publication' })).toHaveCount(0);

  await afterWithdrawReload.getByRole('button', { name: 'Restore withdrawn revision' }).click();
  await expect(afterWithdrawReload.getByRole('status')).toContainText('Server restored exact revision');
  const restored = await page.evaluate(async () => await (await fetch('/api/publications')).json() as Array<{ slug: string; status: string }>);
  expect(restored).toContainEqual(expect.objectContaining({ slug, status: 'published' }));
  await expectPublicWebVisibility(page, slug, true, title, relatedTitle, 'temporary-related-integration-fixture', relatedArticleIds[0]);

  await page.reload();
  const afterRestoreReload = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await afterRestoreReload.getByRole('button', { name: 'Sign in' }).click();
  await expect(afterRestoreReload.getByText(/Server publishing · published/)).toBeVisible();
  await expect(afterRestoreReload.getByRole('button', { name: 'Withdraw publication' })).toBeVisible();

  await expectNoFatalBrowserFailures(diagnostics);
});
