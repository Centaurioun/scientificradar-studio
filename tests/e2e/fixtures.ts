import { expect, test as base } from '@playwright/test';

type BrowserDiagnostics = {
  consoleWarnings: string[];
  consoleErrors: string[];
  pageErrors: string[];
  failedLocalRequests: string[];
  canceledLocalRequests: string[];
  blockedExternalRequests: string[];
};

export const test = base.extend<{ diagnostics: BrowserDiagnostics }>({
  diagnostics: async ({ page, baseURL }, use, testInfo) => {
    const diagnostics: BrowserDiagnostics = {
      consoleWarnings: [],
      consoleErrors: [],
      pageErrors: [],
      failedLocalRequests: [],
      canceledLocalRequests: [],
      blockedExternalRequests: [],
    };
    const localOrigin = new URL(baseURL ?? 'http://127.0.0.1:4175').origin;

    await page.context().route('**/*', async (route) => {
      const requestUrl = route.request().url();
      const parsedUrl = new URL(requestUrl);
      if (parsedUrl.origin === localOrigin || parsedUrl.protocol === 'data:' || parsedUrl.protocol === 'blob:') {
        await route.continue();
        return;
      }

      diagnostics.blockedExternalRequests.push(requestUrl);
      await route.abort('blockedbyclient');
    });

    page.on('console', (message) => {
      const entry = `${message.type()}: ${message.text()}`;
      if (message.type() === 'warning') diagnostics.consoleWarnings.push(entry);
      if (message.type() === 'error') diagnostics.consoleErrors.push(entry);
    });
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.stack ?? error.message));
    page.on('requestfailed', (request) => {
      if (new URL(request.url()).origin === localOrigin) {
        const detail = `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`;
        if (request.failure()?.errorText === 'net::ERR_ABORTED') {
          diagnostics.canceledLocalRequests.push(detail);
        } else {
          diagnostics.failedLocalRequests.push(detail);
        }
      }
    });

    // Playwright fixture lifecycle callback; this is not a React Hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(diagnostics);

    await testInfo.attach('browser-diagnostics.json', {
      body: JSON.stringify(diagnostics, null, 2),
      contentType: 'application/json',
    });

    if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
      await testInfo.attach('failure-screenshot.png', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  },
});

export { expect };

export async function expectNoFatalBrowserFailures(diagnostics: BrowserDiagnostics) {
  expect(diagnostics.pageErrors, 'uncaught browser exceptions').toEqual([]);
  expect(diagnostics.failedLocalRequests, 'failed requests to the local application').toEqual([]);
}
