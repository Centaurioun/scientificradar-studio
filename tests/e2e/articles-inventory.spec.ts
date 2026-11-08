import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

test('article inventory searches categories and exposes the active status filter', async ({ page, diagnostics }) => {
  await page.goto('/articles');

  const filterGroup = page.getByRole('group', { name: 'Filter articles by workflow status' });
  await expect(filterGroup.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('textbox', { name: 'Search articles by title, slug, author, tag, or DOI' }).fill('Chemistry & Materials');
  const chemistryArticle = page.getByRole('link', {
    name: 'Halide-Sulfide Dual-Layer Electrolytes Suppress Dendrite Propagation at High Current Densities',
    exact: true,
  });
  await expect(chemistryArticle).toBeVisible();
  const matchingRow = page.locator('tbody tr').filter({ has: chemistryArticle });
  await expect(matchingRow.locator('td').nth(2)).toHaveText('Chemistry & Materials');

  await page.getByRole('textbox', { name: 'Search articles by title, slug, author, tag, or DOI' }).clear();
  await filterGroup.getByRole('button', { name: 'Published', exact: true }).click();
  await expect(filterGroup.getByRole('button', { name: 'Published', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const row of await page.locator('tbody tr').all()) {
    await expect(row.locator('td').nth(5)).toContainText('published');
  }

  await expectNoFatalBrowserFailures(diagnostics);
});
