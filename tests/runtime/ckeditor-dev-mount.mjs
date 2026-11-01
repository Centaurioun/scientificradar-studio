import { chromium } from '@playwright/test';

const baseUrl = process.env.SR_DEV_URL || 'http://127.0.0.1:4186';
const browser = await chromium.launch({ headless: true });
const errors = [];
const allErrors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.protocol === 'data:') return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  page.on('console', m => {
    if (m.type() === 'error') {
      allErrors.push(m.text());
      if (m.text().includes('Maximum update depth exceeded')) errors.push(m.text());
    }
  });
  page.on('pageerror', e => {
    allErrors.push(e.message);
    if (e.message.includes('Maximum update depth exceeded')) errors.push(e.message);
  });
  const url = baseUrl + '/articles/art-quantum-repeater/edit?editor=ckeditor';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (response?.status() !== 200) throw new Error('HTTP ' + response?.status() + ' at ' + url);
  const editable = page.locator('.ck-editor__editable');
  await editable.waitFor({ state: 'visible', timeout: 60000 });
  await editable.getByText(/Distributing coherent quantum states/i).first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(5000);
  const textLength = await page.evaluate(() => document.querySelector('.ck-editor__editable')?.textContent?.length ?? 0);
  if (textLength < 120) throw new Error('CKEditor manuscript unexpectedly short: ' + textLength);
  if (errors.length) throw new Error('CKEditor mount React update-depth regression: ' + errors.length + ' errors\n' + errors.join('\n').slice(0,2500));
  console.log('CKEDITOR_DEV_MOUNT_PASS: textLength=' + textLength + ', consoleErrors=' + allErrors.length);
  await context.close();
} finally {
  await browser.close();
}
