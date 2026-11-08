import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const ownerEmail = 'owner@example.test';
const ownerPassword = 'Local-Only-Owner-Password-2026!';
const reviewerEmail = 'reviewer@example.test';
const reviewerPassword = 'Local-Only-Reviewer-Password-2026!';

test('authenticated Studio UI saves, reviews, publishes, withdraws, and restores one exact server revision', async ({ page, diagnostics }) => {
  test.skip(process.env.PLAYWRIGHT_SERVER_PUBLISHING_E2E !== 'true', 'Run via npm run test:e2e:publishing with its isolated SQLite configuration.');

  await page.goto('/articles/new');

  const title = 'Local publishing workflow integration fixture';
  const slug = 'local-publishing-workflow-integration-fixture';
  await page.getByLabel('Article Title (H1)').fill(title);
  await page.getByLabel('Scientific Abstract / Standfirst Summary').fill('Synthetic local integration content used to verify authenticated persistence and publication controls.');
  await page.getByRole('textbox', { name: 'Article body editor' }).fill('This local fixture verifies the Studio publishing workflow.');

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
  await page.goto(`/articles/${encodeURIComponent(articleId!)}/edit`);
  await expect(page.getByLabel('Article Title (H1)')).toHaveValue(title);
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
    return await response.json() as Array<{ slug: string; status: string }>;
  });
  expect(published).toContainEqual(expect.objectContaining({ slug, status: 'published' }));

  await afterPublishReload.getByLabel('Correction or takedown reason').fill('Local integration withdrawal check.');
  await afterPublishReload.getByRole('button', { name: 'Withdraw publication' }).click();
  await expect(afterPublishReload.getByRole('status')).toContainText('Server withdrew exact revision');
  const withdrawn = await page.evaluate(async () => await (await fetch('/api/publications')).json() as Array<{ slug: string }>);
  expect(withdrawn.some((item) => item.slug === slug)).toBe(false);

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

  await page.reload();
  const afterRestoreReload = page.getByRole('region', { name: 'Server publishing workflow' });
  await page.getByLabel('Publishing email').fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await afterRestoreReload.getByRole('button', { name: 'Sign in' }).click();
  await expect(afterRestoreReload.getByText(/Server publishing · published/)).toBeVisible();
  await expect(afterRestoreReload.getByRole('button', { name: 'Withdraw publication' })).toBeVisible();

  await expectNoFatalBrowserFailures(diagnostics);
});
