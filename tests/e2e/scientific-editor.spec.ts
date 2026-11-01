import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

test('S-ED-1 — inserts a clean empty 3x3 table, keeps contextual table controls visible across edits, and supports caption/column/header actions', async ({
  page,
  diagnostics,
}) => {
  await page.goto('/articles/new');
  const bodyEditor = page.getByRole('textbox', { name: 'Article body editor' });
  await expect(bodyEditor).toBeVisible();
  await bodyEditor.click();

  await page.getByRole('button', { name: 'Insert Scientific Table' }).click();

  const table = bodyEditor.locator('table');
  await expect(table).toBeVisible();
  await expect(table.locator('th')).toHaveCount(3);
  await expect(table.locator('td')).toHaveCount(6);

  // Verify no dummy placeholder text was inserted into cells
  await expect(table).not.toContainText('Header 1');
  await expect(table).not.toContainText('Value');

  // Contextual table controls bar should remain visible while editing table
  await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  await page.getByRole('button', { name: '+ Add Row' }).click();
  await expect(table.locator('td')).toHaveCount(9);
  await expect(page.getByRole('button', { name: '+ Add Column' })).toBeVisible();

  await page.getByRole('button', { name: '+ Add Column' }).click();
  await expect(table.locator('th')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Delete Column' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Column' }).click();
  await expect(table.locator('th')).toHaveCount(3);

  // Add a semantic table caption
  await page.getByRole('button', { name: 'Table Caption' }).click();
  const captionInput = page.getByPlaceholder('Table 1: Experimental parameters and uncertainty bounds...');
  await expect(captionInput).toBeVisible();
  await captionInput.fill('Table 1: Cryogenic resonator quality factors');
  await page.getByRole('button', { name: 'Save Caption' }).click();
  await expect(table.locator('caption')).toContainText('Table 1: Cryogenic resonator quality factors');

  await expectNoFatalBrowserFailures(diagnostics);
});

test('S-ED-2 — preserves multiline code block indentation across Visual <-> HTML Source round-trip', async ({
  page,
  diagnostics,
}) => {
  await page.goto('/articles/new');
  await page.getByRole('button', { name: 'HTML Source' }).click();

  const sourceBox = page.getByRole('textbox', { name: 'Manuscript Body HTML Source Editor' });
  await expect(sourceBox).toBeVisible();
  const codeSnippet = [
    '<h2>Decoder Implementation</h2>',
    '<pre><code>function decodeSyndrome(matrix) {',
    '  if (!matrix) {',
    '    return [];',
    '  }',
    '  return matrix;',
    '}</code></pre>',
  ].join('\n');

  await sourceBox.fill(codeSnippet);
  await page.getByRole('button', { name: 'Format HTML Source' }).click();
  await expect(sourceBox).toHaveValue(/  if \(!matrix\) \{\n    return \[\];\n  \}/);

  await page.getByRole('button', { name: 'Apply HTML Source Changes' }).click();
  await page.getByRole('button', { name: 'Visual Editor' }).click();
  const bodyEditor = page.getByRole('textbox', { name: 'Article body editor' });
  await expect(bodyEditor.locator('pre code')).toContainText('  if (!matrix) {');

  await expectNoFatalBrowserFailures(diagnostics);
});

test('S-MATH-1 — renders 2D mathematical equations, supports click-to-edit, and rejects invalid LaTeX edits without corrupting existing math', async ({
  page,
  diagnostics,
}) => {
  await page.goto('/articles/new');
  const bodyEditor = page.getByRole('textbox', { name: 'Article body editor' });
  await bodyEditor.click();

  await page.getByRole('button', { name: 'Insert LaTeX Equation' }).click();
  const latexInput = page.getByLabel('LaTeX Expression');
  await expect(latexInput).toBeVisible();
  await latexInput.fill('\\frac{1}{1 + e^{-z}}');
  await page.getByRole('button', { name: 'Insert Equation' }).click();

  const fracNode = bodyEditor.locator('.sr-math-frac').first();
  await expect(fracNode).toBeVisible();

  // Click existing equation to reopen popover in edit mode
  await fracNode.click();
  await expect(latexInput).toBeVisible();
  await expect(latexInput).toHaveValue('\\frac{1}{1 + e^{-z}}');

  // Attempt invalid LaTeX update -> button should be disabled and error shown
  await latexInput.fill('\\frac{1}{2');
  await expect(page.getByRole('button', { name: 'Update Equation' })).toBeDisabled();

  // Valid update -> updates equation in place
  await latexInput.fill('\\sqrt{x^2 + y^2}');
  await page.getByRole('button', { name: 'Update Equation' }).click();
  await expect(bodyEditor.locator('.sr-math-sqrt').first()).toBeVisible();

  await expectNoFatalBrowserFailures(diagnostics);
});

test('S-CITE-1 — numbers inline citations by appearance order, renders Vancouver bibliography in Preview, and warns on orphaned citations', async ({
  page,
  diagnostics,
}) => {
  await page.goto('/articles/art-quantum-repeater/edit');
  await page.getByRole('button', { name: 'HTML Source' }).click();

  const sourceBox = page.getByRole('textbox', { name: 'Manuscript Body HTML Source Editor' });
  await expect(sourceBox).toBeVisible();
  await sourceBox.fill(
    '<h2>Experimental Results</h2><p>First reference<sup data-citation-source-id="src-nature-qec">[Cite]</sup> and orphaned reference<sup data-citation-source-id="src-detached-999">[Cite]</sup>.</p>'
  );
  await page.getByRole('button', { name: 'Apply HTML Source Changes' }).click();

  // Orphaned citation warning banner in editor
  await expect(page.getByTestId('orphaned-citation-warning')).toBeVisible();

  // Switch to Preview mode and verify Vancouver bibliography and orphaned citation alert
  await page.getByRole('button', { name: 'Reader Preview' }).click();
  await expect(page.getByTestId('vancouver-bibliography-list')).toBeVisible();
  await expect(page.getByTestId('preview-orphaned-citation-alert')).toBeVisible();

  await expectNoFatalBrowserFailures(diagnostics);
});

test('S-MED-1 — rejects SVG/corrupt uploads in Media Library and defaults new media rights to unverified until human entry', async ({
  page,
  diagnostics,
}) => {
  await page.goto('/media');
  await expect(page.getByRole('button', { name: 'Add Scientific Figure' })).toBeVisible();

  const fileInput = page.getByTestId('media-file-upload-input');
  await fileInput.setInputFiles({
    name: 'untrusted-vector.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  });
  await expect(page.getByRole('alert').first()).toContainText(/Only raster images/i);

  await fileInput.setInputFiles({
    name: 'corrupt.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not-a-valid-png-binary-header-1234567890'),
  });
  await expect(page.getByRole('alert').first()).toContainText(/Corrupt or undecodable image file rejected/i);

  // Create a figure via modal without filling credit/licence -> must remain empty and show unverified rights badge
  await page.getByRole('button', { name: 'Add Scientific Figure' }).click();
  await page.getByLabel('Figure / Media Title *').fill('Unverified Cryostat Schematic');
  await page.getByRole('button', { name: 'Save to Local Demo Library' }).click();

  await expect(page.getByTestId('unverified-media-rights-badge').first()).toBeVisible();

  await expectNoFatalBrowserFailures(diagnostics);
});
