import { test, expect } from '@playwright/test';

async function ready(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/sample/index.html');
  await expect.poll(() => page.evaluate(() => window.mathEditorError || (window.editor?.execute ? 'READY' : 'PENDING'))).toBe('READY');
  return errors;
}

test('Math UI plugin provides a form and proper CKEditor 49 plugin name', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const ui = window.editor.plugins.get('MathUI');
    return { name: ui.constructor.pluginName, form: Boolean(ui.formView) };
  });
  expect(r).toEqual({ name: 'MathUI', form: true });
});

test('Math toolbar component is a toggleable ButtonView', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const ui = window.editor.ui.componentFactory.create('math');
    const result = { toggles: ui.isToggleable, label: ui.label };
    ui.destroy();
    return result;
  });
  expect(r.toggles).toBe(true);
  expect(r.label).toMatch(/Insert math/i);
});

test('Math command disabled prevents UI opening and disables the toolbar component', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    const cmd = e.commands.get('math');
    const component = e.ui.componentFactory.create('math');
    cmd.isEnabled = false;
    ui._showUI();
    const result = { open: Boolean(ui._isFormInPanel), componentEnabled: component.isEnabled };
    component.destroy();
    return result;
  });
  expect(r).toEqual({ open: false, componentEnabled: false });
});

test('Showing math UI twice does not add a duplicate balloon view', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    const balloon = e.plugins.get('ContextualBalloon');
    ui._showUI();
    ui._showUI();
    return { contains: balloon.hasView(ui.formView), visible: balloon.visibleView === ui.formView, forms: document.querySelectorAll('.ck-math-form').length };
  });
  expect(r).toEqual({ contains: true, visible: true, forms: 1 });
});

test('Hide closes visible math UI without deleting editor content', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    const before = e.getData();
    ui._showUI();
    ui._hideUI();
    return { open: Boolean(ui._isFormInPanel), unchanged: before === e.getData() };
  });
  expect(r).toEqual({ open: false, unchanged: true });
});

test('Hiding an already hidden UI is safe', async ({ page }) => {
  const errors = await ready(page);
  const r = await page.evaluate(() => {
    const ui = window.editor.plugins.get('MathUI');
    ui._hideUI();
    ui._hideUI();
    return Boolean(ui._isFormInPanel);
  });
  expect(r).toBe(false);
  expect(errors).toEqual([]);
});

test('Command equation is bound into the math form input model', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    ui._showUI();
    e.commands.get('math').value = 'z^2';
    return ui.formView.mathInputView.value;
  });
  expect(r).toBe('z^2');
});

test('Command display setting propagates to the form switch', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    ui._showUI();
    e.commands.get('math').display = true;
    return ui.formView.displayButtonView.isOn;
  });
  expect(r).toBe(true);
});

test('Read-only input and disabled Save follow a disabled command', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    ui._showUI();
    e.commands.get('math').isEnabled = false;
    return { readOnly: ui.formView.mathInputView.isReadOnly, save: ui.formView.saveButtonView.isEnabled, cancel: ui.formView.cancelButtonView.isEnabled };
  });
  expect(r.readOnly).toBe(true);
  expect(r.save).toBe(false);
  expect(r.cancel).toBe(true);
});

test('Form display button toggles inline/display state', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    ui._showUI();
    const btn = ui.formView.displayButtonView;
    const before = btn.isOn;
    btn.fire('execute');
    const after = btn.isOn;
    return { before, after };
  });
  expect(r.before).not.toBe(r.after);
});

test('Form cancel event never inserts an equation', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    const ui = e.plugins.get('MathUI');
    const before = e.getData();
    ui._showUI();
    ui.formView.equation = 'test-uncommitted-equation';
    ui.formView.fire('cancel');
    return { changed: e.getData() !== before, visible: Boolean(ui._isFormInPanel) };
  });
  expect(r).toEqual({ changed: false, visible: false });
});

test('Escape from math form closes the balloon with no content mutation', async ({ page }) => {
  const errors = await ready(page);
  await page.getByRole('button', { name: /Insert math/i }).click();
  await expect(page.locator('.ck-math-form')).toBeVisible();
  const before = await page.evaluate(() => window.editor.getData());
  await page.locator('.ck-math-form input').first().focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ck-math-form')).not.toBeVisible();
  expect(await page.evaluate(() => window.editor.getData())).toEqual(before);
  expect(errors).toEqual([]);
});

test('Pasting TeX with inline delimiters is transformed by AutoMath in real browser', async ({ page }) => {
  await ready(page);
  const r = await page.evaluate(() => {
    const e = window.editor;
    e.setData('<p></p>');
    const editable = e.ui.getEditableElement();
    editable.focus();
    const dt = new DataTransfer();
    dt.setData('text/html', '<p>\\(x^2\\)</p>');
    dt.setData('text/plain', '\\(x^2\\)');
    const accepted = editable.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
    return { accepted };
  });
  expect(typeof r.accepted).toBe('boolean');
  await expect.poll(() => page.evaluate(() => window.editor.getData()), { timeout: 4000 }).toMatch(/math-tex|math\/tex/);
});
