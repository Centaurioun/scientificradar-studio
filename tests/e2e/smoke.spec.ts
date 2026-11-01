import { expect, expectNoFatalBrowserFailures, test } from './fixtures';

test('A — application starts locally without a fatal browser error', async ({ page, diagnostics }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'ScientificRadar Editorial Workspace' })).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('B — dashboard renders its navigation and principal content', async ({ page, diagnostics }) => {
  await page.goto('/dashboard');
  await expect(page.getByLabel('Primary Editorial Navigation')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Editorial Status Metrics' })).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('C — article editor exposes the manuscript and writing controls', async ({ page, diagnostics }) => {
  await page.goto('/articles/new');
  await expect(page.getByRole('textbox', { name: 'Article Title (H1)' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Article body editor' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: /Manuscript formatting toolbar/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bold' })).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('D — article listing opens an existing article editor route', async ({ page, diagnostics }) => {
  await page.goto('/articles');
  await expect(page.getByRole('heading', { name: /^Scientific Articles/ })).toBeVisible();
  const firstEditLink = page.getByRole('link', { name: /^Edit / }).first();
  await expect(firstEditLink).toBeVisible();
  await firstEditLink.click();
  await expect(page).toHaveURL(/\/articles\/[^/]+\/edit$/);
  await expect(page.getByRole('toolbar', { name: /Manuscript formatting toolbar/ })).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('E — SEO Center displays its local editorial audit interface', async ({ page, diagnostics }) => {
  await page.goto('/seo');
  await expect(page.getByRole('heading', { name: 'Centralized SEO & Editorial Quality Audit' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run SEO Audit on All Articles' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Filter articles in SEO center' })).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('F — Publishing Calendar exposes its local scheduling interface', async ({ page, diagnostics }) => {
  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Editorial Publishing Calendar' })).toBeVisible();
  await expect(page.getByLabel('Select Manuscript to Schedule')).toBeVisible();
  await expect(page.getByLabel(/Target Publication Date & Time/)).toBeVisible();
  await expectNoFatalBrowserFailures(diagnostics);
});

test('G — browser applies and reports the three required CSS viewport dimensions', async ({ page, diagnostics }) => {
  await page.goto('/dashboard');
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const measured = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      mediaQueryMatches: window.matchMedia(`(width: ${window.innerWidth}px) and (height: ${window.innerHeight}px)`).matches,
    }));
    expect(measured).toEqual({ ...viewport, mediaQueryMatches: true });
  }
  await expectNoFatalBrowserFailures(diagnostics);
});

test('H — browser diagnostics capture marked console events and a controlled local request failure', async ({ page, diagnostics }, testInfo) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'ScientificRadar Editorial Workspace' })).toBeVisible();

  const marker = `pw-diagnostics-${testInfo.testId}`;
  const warningMarker = `${marker}-warning`;
  const errorMarker = `${marker}-error`;
  const requestMarker = `${marker}-request`;
  const requestUrl = `/__playwright_diagnostics_failure__?marker=${requestMarker}`;

  await page.route(`**/__playwright_diagnostics_failure__?marker=${requestMarker}`, (route) => route.abort('failed'));
  await page.evaluate(({ warningMarker, errorMarker, requestUrl }) => {
    console.warn(warningMarker);
    console.error(errorMarker);
    return fetch(requestUrl).catch(() => undefined);
  }, { warningMarker, errorMarker, requestUrl });

  await expect.poll(() => diagnostics.consoleWarnings.some((entry) => entry.includes(warningMarker))).toBe(true);
  await expect.poll(() => diagnostics.consoleErrors.some((entry) => entry.includes(errorMarker))).toBe(true);
  await expect.poll(() => diagnostics.failedLocalRequests.some((entry) => entry.includes(requestMarker))).toBe(true);

  expect(diagnostics.consoleWarnings.find((entry) => entry.includes(warningMarker))).toContain(warningMarker);
  expect(diagnostics.consoleErrors.find((entry) => entry.includes(errorMarker))).toContain(errorMarker);
  expect(diagnostics.failedLocalRequests.find((entry) => entry.includes(requestMarker))).toContain(requestMarker);
});
