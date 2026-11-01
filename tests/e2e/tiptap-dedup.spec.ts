import { expect, test } from './fixtures';

test('Tiptap mounts without duplicate Link or Underline warnings and keeps both marks usable', async ({ page, diagnostics }) => {
  await page.goto('/articles/new');
  const editor = page.getByRole('textbox', { name: 'Article body editor' });
  await expect(editor).toBeVisible();

  const duplicateWarnings = () => diagnostics.consoleWarnings.filter((warning) =>
    /Duplicate extension names found:.*\b(link|underline)\b/i.test(warning)
  );
  expect(duplicateWarnings()).toEqual([]);

  await editor.fill('Unicode Δβ and DOI evidence');
  await editor.press('End');
  await page.getByRole('button', { name: 'Underline' }).click();
  await editor.pressSequentially(' underlined');
  await expect(editor.locator('u')).toContainText('underlined');

  await editor.press('End');
  await editor.pressSequentially(' linked DOI');
  await editor.press('Control+Shift+ArrowLeft');
  await editor.press('Control+Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Insert or edit safe link' }).click();
  await page.getByLabel('Destination URL:').fill('https://doi.org/10.1038/example');
  await page.getByRole('button', { name: 'Apply Link' }).click();
  await expect(editor.locator('a')).toHaveAttribute('href', 'https://doi.org/10.1038/example');
  await expect(editor.locator('a')).toHaveAttribute('rel', /noopener/);

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Article body editor' })).toBeVisible();
  expect(duplicateWarnings()).toEqual([]);
});
