import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

test('focused writing keeps the scientific editor mounted and metadata tabs work by keyboard', async ({ page, diagnostics }) => {
  await page.goto('/articles/new');

  const articleBody = page.getByRole('textbox', { name: 'Article body editor' });
  await expect(articleBody).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Article Metadata Inspector' })).toBeVisible();

  const focusButton = page.getByRole('button', { name: 'Focus writing' });
  await focusButton.click();
  await expect(page.getByRole('button', { name: 'Exit focus' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('complementary', { name: 'Article Metadata Inspector' })).toHaveCount(0);
  await expect(articleBody).toBeVisible();

  await page.getByRole('button', { name: 'Exit focus' }).click();
  const tablist = page.getByRole('tablist', { name: 'Article metadata sections' });
  const taxonomyTab = tablist.getByRole('tab', { name: 'Taxonomy' });
  const sourcesTab = tablist.getByRole('tab', { name: /Sources/ });
  await taxonomyTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(sourcesTab).toBeFocused();
  await expect(sourcesTab).toHaveAttribute('aria-selected', 'true');

  await expect(articleBody).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});
