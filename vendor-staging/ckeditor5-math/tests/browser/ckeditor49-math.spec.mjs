import { test, expect } from '@playwright/test';

test('CKEditor 49 starts and registers our open-source math toolbar', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('/sample/index.html');
  await expect.poll(() => page.evaluate(() => window.mathEditorError || (typeof window.editor?.execute === 'function' ? 'READY' : 'PENDING')), { timeout: 12000 }).toBe('READY');
  await expect(page.getByRole('button', { name: /Insert math/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('inline and display math survive editor serialization with KaTeX', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('/sample/index.html');
  await expect.poll(() => page.evaluate(() => window.mathEditorError || (typeof window.editor?.execute === 'function' ? 'READY' : 'PENDING')), { timeout: 12000 }).toBe('READY');
  const results = await page.evaluate(() => {
    const editor = window.editor;
    editor.execute('math', String.raw`E=mc^2`, false, 'span', true);
    editor.execute('math', String.raw`\frac{a+b}{c}`, true, 'span', true);
    const first = editor.getData();
    editor.setData(first);
    const second = editor.getData();
    return { first, second };
  });
  expect(results.first).toContain('E=mc^2');
  expect(results.first).toContain('frac{a+b}{c}');
  expect(results.second).toContain('E=mc^2');
  expect(results.second).toContain('frac{a+b}{c}');
  await expect(page.locator('.ck-editor__editable .katex').first()).toBeVisible();
  expect(pageErrors).toEqual([]);
});
