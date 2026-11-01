import { test, expect } from '@playwright/test';

// Additional behavior-oriented coverage of historical UI, clipboard and undo
// contracts, against the CKEditor 49 real editor instead of CKEditor 43 mocks.
async function ready(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/sample/index.html');
  await expect.poll(() => page.evaluate(() => window.mathEditorError || (window.editor?.execute ? 'READY' : 'PENDING'))).toBe('READY');
  return errors;
}
async function paste(page, html, text) {
  await page.evaluate(({ html, text }) => {
    const editor = window.editor;
    editor.ui.getEditableElement().focus();
    const transfer = new DataTransfer();
    transfer.setData('text/html', html);
    transfer.setData('text/plain', text);
    editor.ui.getEditableElement().dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true, cancelable: true, clipboardData: transfer
    }));
  }, { html, text });
}
async function selectEquation(page) {
  return page.evaluate(() => {
    const e = window.editor;
    const root = e.model.document.getRoot();
    for (const top of root.getChildren()) {
      if (top.name.startsWith('mathtex-')) {
        e.model.change(w => w.setSelection(top, 'on'));
        e.commands.get('math').refresh();
        return top.name;
      }
      if (top.getChildren) {
        for (const child of top.getChildren()) {
          if (child.name?.startsWith('mathtex-')) {
            e.model.change(w => w.setSelection(child, 'on'));
            e.commands.get('math').refresh();
            return child.name;
          }
        }
      }
    }
    return null;
  });
}

test('toolbar math button opens exactly one visible balloon', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  await expect(page.locator('.ck-math-form')).toHaveCount(1);
  await expect(page.locator('.ck-math-form')).toBeVisible();
});

test('Ctrl+M shortcut opens math form from focused editable', async ({ page }) => {
  await ready(page);
  await page.locator('.ck-editor__editable').focus();
  await page.keyboard.press('Control+m');
  await expect(page.locator('.ck-math-form')).toBeVisible();
});

test('Escape from active editor closes an existing math balloon', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  await expect(page.locator('.ck-math-form')).toBeVisible();
  await page.locator('.ck-editor__editable').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ck-math-form')).not.toBeVisible();
});

test('selecting an existing inline equation hydrates its edit form', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'z^7', false, 'span', true);
  });
  expect(await selectEquation(page)).toBe('mathtex-inline');
  await page.evaluate(() => window.editor.plugins.get('MathUI')._showUI());
  await expect(page.locator('.ck-math-form input').first()).toHaveValue('z^7');
});

test('selecting an existing display equation switches form into display mode', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'z^7', true, 'span', true);
  });
  expect(await selectEquation(page)).toBe('mathtex-display');
  const result = await page.evaluate(() => {
    const ui = window.editor.plugins.get('MathUI');
    ui._showUI();
    return ui.formView.displayButtonView.isOn;
  });
  expect(result).toBe(true);
});

test('cancelling edit of an existing equation preserves original raw TeX', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'saved^2', false, 'span', true);
  });
  expect(await selectEquation(page)).toBe('mathtex-inline');
  const before = await page.evaluate(() => window.editor.getData());
  await page.evaluate(() => window.editor.plugins.get('MathUI')._showUI());
  await page.locator('.ck-math-form input').first().fill('discarded^3');
  await page.getByRole('button', { name: /Cancel/i }).last().click();
  expect(await page.evaluate(() => window.editor.getData())).toBe(before);
});

test('saving edit of existing widget updates only that math content', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Start</p>');
    e.execute('math', 'old^2', false, 'span', true);
  });
  expect(await selectEquation(page)).toBe('mathtex-inline');
  await page.evaluate(() => window.editor.plugins.get('MathUI')._showUI());
  await page.locator('.ck-math-form input').first().fill('new^3');
  await page.getByRole('button', { name: /Save/i }).last().click();
  const result = await page.evaluate(() => window.editor.getData());
  expect(result).toContain('new^3');
  expect(result).not.toContain('old^2');
  expect(result).toContain('Start');
});

test('click outside closes math balloon without content changes', async ({ page }) => {
  await ready(page);
  const before = await page.evaluate(() => window.editor.getData());
  await page.getByRole('button', { name: /Insert math/i }).click();
  await page.locator('h1').first().click();
  await expect(page.locator('.ck-math-form')).not.toBeVisible();
  expect(await page.evaluate(() => window.editor.getData())).toBe(before);
});

test('click inside math input does not close the form', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  await page.locator('.ck-math-form input').first().click();
  await expect(page.locator('.ck-math-form')).toBeVisible();
});

test('cancel returns keyboard focus to the editor', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  await page.getByRole('button', { name: /Cancel/i }).last().click();
  const focused = await page.evaluate(() => {
    const target = window.editor.ui.getEditableElement();
    return document.activeElement === target || target.contains(document.activeElement);
  });
  expect(focused).toBe(true);
});

test('switching display mode while typing does not clear equation source', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  const input = page.locator('.ck-math-form input').first();
  await input.fill('\\sqrt{x+2}');
  const ui = await page.evaluate(() => {
    const view = window.editor.plugins.get('MathUI').formView;
    view.displayButtonView.fire('execute');
    return { equation: view.equation, display: view.displayButtonView.isOn };
  });
  expect(ui.equation).toBe('\\sqrt{x+2}');
  expect(ui.display).toBe(true);
});

test('AutoMath converts pasted display TeX into a display math widget', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.editor.setData('<p></p>'));
  await paste(page, '<p>\\[x^2\\]</p>', '\\[x^2\\]');
  await expect.poll(() => page.evaluate(() => window.editor.getData()), { timeout: 3500 }).toContain('x^2');
  await expect.poll(() => page.evaluate(() => {
    const root = window.editor.model.document.getRoot();
    return Array.from(root.getChildren()).some(node => node.name === 'mathtex-display');
  }), { timeout: 3500 }).toBe(true);
});

test('AutoMath undo restores original pasted inline TeX as plain text', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.editor.setData('<p></p>'));
  await paste(page, '<p>\\(x^2\\)</p>', '\\(x^2\\)');
  await expect.poll(() => page.evaluate(() => window.editor.getData()), { timeout: 3500 }).toMatch(/math-tex/);
  await page.evaluate(() => window.editor.execute('undo'));
  const data = await page.evaluate(() => window.editor.getData());
  expect(data).toContain('\\(x^2\\)');
  expect(data).not.toContain('math-tex');
});

test('AutoMath leaves two pasted equations unchanged instead of dropping either', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.editor.setData('<p></p>'));
  await paste(page, '<p>\\(x^2\\) \\(y^2\\)</p>', '\\(x^2\\) \\(y^2\\)');
  await page.waitForTimeout(200);
  const data = await page.evaluate(() => window.editor.getData());
  expect(data).toContain('\\(x^2\\)');
  expect(data).toContain('\\(y^2\\)');
});

test('AutoMath does not alter ordinary scientific text paste', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.editor.setData('<p></p>'));
  await paste(page, '<p>µ ≤ α, p = 0.003</p>', 'µ ≤ α, p = 0.003');
  await page.waitForTimeout(200);
  const data = await page.evaluate(() => window.editor.getData());
  expect(data).toContain('p = 0.003');
  expect(data).not.toContain('math-tex');
});

test('AutoMath inserts an inline equation without losing surrounding manuscript text', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>Clinical text</p>');
    const para = e.model.document.getRoot().getChild(0);
    e.model.change(w => w.setSelection(para, 'end'));
  });
  await paste(page, '\\(x^2\\)', '\\(x^2\\)');
  await expect.poll(() => page.evaluate(() => window.editor.getData()), { timeout: 3500 }).toMatch(/math-tex/);
  const data = await page.evaluate(() => window.editor.getData());
  expect(data).toContain('Clinical text');
  expect(data).toContain('x^2');
});

test('the extra legacy regressions leave no uncaught page errors', async ({ page }) => {
  const errors = await ready(page);
  await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p>TeX</p>');
    e.execute('math', '\\alpha + \\beta', false, 'span', true);
    e.execute('undo');
    e.execute('redo');
  });
  expect(errors).toEqual([]);
});
