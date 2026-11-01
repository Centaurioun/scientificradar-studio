import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.mjs',
  retries: 0,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4179', browserName: 'chromium', viewport: { width: 1280, height: 800 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev:sample', url: 'http://127.0.0.1:4179/sample/index.html', reuseExistingServer: false, timeout: 120_000 }
});
