import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

const articleId = 'art-quantum-repeater';

test('audit findings navigate to the matching SEO and figure controls', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/seo`);

  const seoFinding = page.getByTestId('audit-finding-metadata.seo_title.present');
  await expect(seoFinding).toBeVisible();
  await seoFinding.getByRole('link', { name: 'Go to Field' }).click();
  await expect(page).toHaveURL(/focus=seo-title-input/);
  const seoTitle = page.locator('#seo-title-input');
  await expect(seoTitle).toBeVisible();
  await expect(seoTitle).toBeFocused();

  await page.goto(`/articles/${articleId}/seo`);
  const rightsFinding = page.getByTestId('audit-finding-images.rights.verified');
  await expect(rightsFinding).toBeVisible();
  await rightsFinding.getByRole('link', { name: 'Go to Field' }).click();
  await expect(page).toHaveURL(/focus=featured-media-select/);
  const featuredFigure = page.locator('#featured-media-select');
  await expect(featuredFigure).toBeVisible();
  await expect(featuredFigure).toBeFocused();

  await expectNoFatalBrowserFailures(diagnostics);
});

test('taxonomy and source audit links land on their actual editor controls', async ({ page, diagnostics }) => {
  await page.goto(`/articles/${articleId}/seo`);

  const tagsFinding = page.getByTestId('audit-finding-taxonomy.tags.count');
  await expect(tagsFinding).toBeVisible();
  await tagsFinding.getByRole('link', { name: 'Go to Field' }).click();
  await expect(page).toHaveURL(/focus=new-tag-input/);
  await expect(page.locator('#new-tag-input')).toBeFocused();

  await page.goto(`/articles/${articleId}/seo`);
  const sourcesFinding = page.getByTestId('audit-finding-integrity.sources.present');
  await expect(sourcesFinding).toBeVisible();
  await sourcesFinding.getByRole('link', { name: 'Go to Field' }).click();
  await expect(page).toHaveURL(/focus=attached-sources-fieldset/);
  await expect(page.locator('#attached-sources-fieldset')).toBeFocused();

  await expectNoFatalBrowserFailures(diagnostics);
});
