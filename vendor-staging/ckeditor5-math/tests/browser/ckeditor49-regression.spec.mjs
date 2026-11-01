import { test, expect } from '@playwright/test';

// Browser-level port of meaningful historical CKEditor 43 Math test contracts.
// All tests run against the actual CKEditor 49 editor, model and KaTeX renderer.
async function ready(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/sample/index.html');
  await expect.poll(() => page.evaluate(() =>
    window.mathEditorError || (window.editor?.execute ? 'READY' : 'PENDING')
  ), { timeout: 15000 }).toBe('READY');
  return errors;
}

test('CKEditor 49 loads Math, MathEditing, MathUI, AutoMath and command', async ({ page }) => {
  const errors = await ready(page);
  const result = await page.evaluate(() => ({
    math: Boolean(window.editor.plugins.get('Math')),
    editing: Boolean(window.editor.plugins.get('MathEditing')),
    ui: Boolean(window.editor.plugins.get('MathUI')),
    automatic: Boolean(window.editor.plugins.get('AutoMath')),
    command: Boolean(window.editor.commands.get('math'))
  }));
  expect(result).toEqual({ math: true, editing: true, ui: true, automatic: true, command: true });
  expect(errors).toEqual([]);
});

test('default insertion serializes a safe span, not executable script markup', async ({ page }) => {
  await ready(page);
  const html = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Intro</p>');
    e.execute('math', 'a+b', false);
    return e.getData();
  });
  expect(html).toContain('a+b');
  expect(html).toMatch(/<span[^>]*math-tex/);
  expect(html).not.toContain('<script');
});

test('explicit legacy script output remains compatible', async ({ page }) => {
  await ready(page);
  const html = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Intro</p>');
    e.execute('math', 'x^2', false, 'script', true);
    return e.getData();
  });
  expect(html).toContain('math/tex');
  expect(html).toContain('x^2');
});

test('inline fraction preserves exact TeX across two getData and setData round-trips', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Before</p>');
    e.execute('math', '\\frac{a+b}{c}', false, 'span', true);
    const first = e.getData();
    e.setData(first);
    e.setData(e.getData());
    return { first, last: e.getData() };
  });
  expect(r.first).toContain('\\frac{a+b}{c}');
  expect(r.last).toContain('\\frac{a+b}{c}');
});

test('display equation preserves sum, mode delimiters and KaTeX display rendering', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Before</p>');
    e.execute('math', '\\sum_{i=1}^{n}x_i', true, 'span', true);
    const first = e.getData();
    e.setData(first);
    return { first, last: e.getData(), rendered: Boolean(document.querySelector('.ck-editor__editable .katex-display')) };
  });
  expect(r.first).toContain('\\sum_{i=1}^{n}x_i');
  expect(r.last).toContain('\\sum_{i=1}^{n}x_i');
  expect(r.first).toContain('\\[');
  expect(r.rendered).toBe(true);
});

test('selected inline math exposes value then replaces rather than duplicates equation', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'x^2', false, 'span', true);
    const para = e.model.document.getRoot().getChild(0);
    const node = Array.from(para.getChildren()).find(x => x.name === 'mathtex-inline');
    if (!node) return { found: false };
    e.model.change(w => w.setSelection(node, 'on'));
    e.commands.get('math').refresh();
    const previous = e.commands.get('math').value;
    e.execute('math', 'y^3', false, 'span', true);
    return { found: true, previous, html: e.getData() };
  });
  expect(r.found).toBe(true);
  expect(r.previous).toBe('x^2');
  expect(r.html).toContain('y^3');
  expect(r.html).not.toContain('x^2');
});

test('legacy MathJax inline script is imported into model', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p><script type="math/tex">x^2+1</script></p>');
    const node = e.model.document.getRoot().getChild(0).getChild(0);
    return { name: node.name, equation: node.getAttribute?.('equation') };
  });
  expect(r).toEqual({ name: 'mathtex-inline', equation: 'x^2+1' });
});

test('legacy MathJax display script is imported as a block equation', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Before</p><script type="math/tex; mode=display">x^2+2</script>');
    const node = Array.from(e.model.document.getRoot().getChildren()).find(x => x.name === 'mathtex-display');
    return { found: Boolean(node), equation: node?.getAttribute('equation') };
  });
  expect(r).toEqual({ found: true, equation: 'x^2+2' });
});

test('CKEditor 4 inline math span parses delimiters without losing TeX', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Before <span class="math-tex">\\(a^2+b^2\\)</span></p>');
    const children = Array.from(e.model.document.getRoot().getChild(0).getChildren());
    const node = children.find(x => x.name === 'mathtex-inline');
    return { found: Boolean(node), equation: node?.getAttribute('equation') };
  });
  expect(r).toEqual({ found: true, equation: 'a^2+b^2' });
});

test('Quill formula data-value remains a math model node', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p><span class="ql-formula" data-value="E=mc^2"></span></p>');
    const node = e.model.document.getRoot().getChild(0).getChild(0);
    return { equation: node.getAttribute?.('equation'), html: e.getData() };
  });
  expect(r.equation).toBe('E=mc^2');
  expect(r.html).toContain('E=mc^2');
});

test('Undo and redo restore a math insertion', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Safe prefix</p>');
    e.execute('math', 'x^2', false, 'span', true);
    const inserted = e.getData();
    e.execute('undo');
    const undone = e.getData();
    e.execute('redo');
    return { inserted, undone, redone: e.getData() };
  });
  expect(r.inserted).toContain('x^2');
  expect(r.undone).not.toContain('x^2');
  expect(r.redone).toContain('x^2');
});

test('Cancel closes math UI without changing original document', async ({ page }) => {
  const errors = await ready(page);
  const before = await page.evaluate(() => window.editor.getData());
  await page.getByRole('button', { name: /Insert math/i }).click();
  await expect(page.locator('.ck-math-form')).toBeVisible();
  await page.getByRole('button', { name: /Cancel/i }).last().click();
  await expect(page.locator('.ck-math-form')).not.toBeVisible();
  expect(await page.evaluate(() => window.editor.getData())).toEqual(before);
  expect(errors).toEqual([]);
});

test('Math UI Save inserts the submitted equation', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.editor.setData('<p>Before</p>'));
  await page.getByRole('button', { name: /Insert math/i }).click();
  await page.locator('.ck-math-form input').first().fill('x^2+1');
  await page.getByRole('button', { name: /Save/i }).last().click();
  expect(await page.evaluate(() => window.editor.getData())).toContain('x^2+1');
});

test('Untrusted KaTeX macros cannot create an executable link or HTML class', async ({ page }) => {
  const errors = await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Plain text</p>');
    e.execute('math', '\\href{javascript:alert(1)}{bad}', false, 'span', true);
    e.execute('math', '\\htmlClass{evil}{bad}', false, 'span', true);
    return {
      badLinks: Array.from(document.querySelectorAll('.ck-editor__editable a[href]')).filter(x => x.protocol === 'javascript:').length,
      badNodes: document.querySelectorAll('.ck-editor__editable .evil').length,
      html: e.getData()
    };
  });
  expect(r.badLinks).toBe(0);
  expect(r.badNodes).toBe(0);
  expect(r.html).toContain('htmlClass');
  expect(errors).toEqual([]);
});

test('Malformed fraction retains source safely without throwing page errors', async ({ page }) => {
  const errors = await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Plain text</p>');
    e.execute('math', '\\frac{a}{', false, 'span', true);
    return { html: e.getData(), script: document.querySelectorAll('.ck-editor__editable script').length };
  });
  expect(r.html).toContain('frac');
  expect(r.script).toBe(0);
  expect(errors).toEqual([]);
});

test('Real KaTeX produces visible fraction markup', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', '\\frac{a+b}{c}', false, 'span', true);
  });
  await expect(page.locator('.ck-editor__editable .katex .mfrac').first()).toBeVisible();
});

test('Reimporting output twice preserves one math widget', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'a+b', false, 'span', true);
    e.setData(e.getData());
    e.setData(e.getData());
    const nodes = Array.from(e.model.document.getRoot().getChild(0).getChildren());
    return { count: nodes.filter(x => x.name === 'mathtex-inline').length, html: e.getData() };
  });
  expect(r.count).toBe(1);
  expect(r.html).toContain('a+b');
});
