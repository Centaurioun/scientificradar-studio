import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const articleId = 'art-quantum-repeater';

async function followFinding(page: import('@playwright/test').Page, ruleId: string, targetId: string, label = 'Go to Field') {
  await page.goto(`/articles/${articleId}/seo`);
  const finding = page.getByTestId(`audit-finding-${ruleId}`);
  await expect(finding).toBeVisible();
  await finding.getByRole('link', { name: label }).click();
  await expect(page).toHaveURL(new RegExp(`focus=${targetId}`));
  const target = page.locator(`#${targetId}`);
  await expect(target).toBeVisible();
  await expect(target).toBeFocused();
}

test('audit findings navigate to the matching SEO, taxonomy, figure, and source controls', async ({ page, diagnostics }) => {
  await followFinding(page, 'content.title.present', 'article-title-input');
  await followFinding(page, 'metadata.slug.valid', 'article-slug-input');
  await followFinding(page, 'taxonomy.primary_category.present', 'primary-category-select');
  await followFinding(page, 'taxonomy.tags.count', 'tags-fieldset');
  await followFinding(page, 'metadata.seo_title.present', 'seo-title-input');
  await followFinding(page, 'metadata.description.present', 'seo-description-input');
  await followFinding(page, 'images.alt.present', 'figure-alt-text-input');
  await followFinding(page, 'images.rights.verified', 'featured-media-select', 'Inspect Figure');

  await page.getByLabel('Figure alt text & axes human-verified').check();
  await page.goto(`/articles/${articleId}/seo`);
  const rightsFinding = page.getByTestId('audit-finding-images.rights.verified');
  await expect(rightsFinding.getByText('Blocks Publish')).toBeVisible();

  await followFinding(page, 'integrity.sources.present', 'attached-sources-fieldset');

  await expectNoFatalBrowserFailures(diagnostics);
});

test('direct links accept legacy inspector tab aliases and give a visible fallback for missing targets', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/edit?tab=media&focus=featured-media-select`);
  await expect(page.locator('#featured-media-select')).toBeFocused();

  await page.goto(`/articles/${articleId}/edit?tab=metadata&focus=primary-category-select`);
  await expect(page.locator('#primary-category-select')).toBeFocused();

  await page.goto(`/articles/${articleId}/edit?tab=versions&focus=article-title-input`);
  await expect(page.locator('#article-title-input')).toBeFocused();
  await expect(page.getByText('Restoring an earlier snapshot creates a new version so history is never lost.')).toBeVisible();

  await page.goto(`/articles/${articleId}/edit?tab=seo&focus=missing-audit-control`);
  await expect(page.locator('#article-metadata-inspector')).toBeFocused();
  await expect(page.getByRole('status')).toContainText(/could not focus.*metadata inspector instead/i);

  await expectNoFatalBrowserFailures(diagnostics);
});

test('tag-count audit navigation remains focusable when the new-tag input is disabled at the maximum', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/edit?tab=taxonomy`);
  const tagButtons = page.locator('#tags-fieldset button');
  const initialCount = await page.locator('#tags-fieldset [data-testid="tag-counter-badge"]').innerText();
  let added = 0;

  for (const button of await tagButtons.all()) {
    if (added === 4) break;
    const className = (await button.getAttribute('class')) || '';
    const name = await button.innerText();
    if (!name.startsWith('#') || className.includes('border-indigo-600') || !(await button.isEnabled())) {
      continue;
    }
    await button.click();
    added += 1;
  }

  expect(added).toBe(4);
  await expect(page.locator('#tags-fieldset [data-testid="tag-counter-badge"]')).toHaveText('6 / 6 tags');
  await expect(page.locator('#new-tag-input')).toBeDisabled();
  await expect(page.getByText(/Saved \(Local\)/)).toBeVisible();

  await followFinding(page, 'taxonomy.tags.count', 'tags-fieldset');
  await expect(page.locator('#new-tag-input')).toBeDisabled();
  await expect(page.locator('#tags-fieldset')).toBeFocused();

  expect(initialCount).toMatch(/2 \/ 6 tags/);
  await expectNoFatalBrowserFailures(diagnostics);
});
