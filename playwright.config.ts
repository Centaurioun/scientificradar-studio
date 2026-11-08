import { accessSync, constants, existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4175';
const configuredChromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const defaultBravePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

function isExecutable(path: string) {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

if (configuredChromiumPath !== undefined && (!configuredChromiumPath || !existsSync(configuredChromiumPath) || !isExecutable(configuredChromiumPath))) {
  throw new Error(
    `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH must name an existing executable browser binary; received: ${configuredChromiumPath || '<empty>'}`,
  );
}

const braveIsAvailable = process.platform === 'darwin' && existsSync(defaultBravePath) && isExecutable(defaultBravePath);
const chromiumExecutablePath = configuredChromiumPath ?? (braveIsAvailable ? defaultBravePath : undefined);
const publishingE2eEnabled = process.env.PLAYWRIGHT_SERVER_PUBLISHING_E2E === 'true';
const serverPublishingEnv: Record<string, string> = publishingE2eEnabled ? {
  PLAYWRIGHT_SERVER_PUBLISHING_E2E: 'true',
  NEXT_PUBLIC_SERVER_PUBLISHING_ENABLED: 'true',
  NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL: process.env.NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL || 'http://127.0.0.1:4175',
  SCIENTIFICRADAR_STUDIO_PUBLISHING_URL: process.env.SCIENTIFICRADAR_STUDIO_PUBLISHING_URL || 'http://127.0.0.1:4175',
  PUBLICATION_DATABASE_PATH: process.env.PUBLICATION_DATABASE_PATH || '',
  STUDIO_SESSION_SECRET: process.env.STUDIO_SESSION_SECRET || '',
  STUDIO_BOOTSTRAP_EMAIL: process.env.STUDIO_BOOTSTRAP_EMAIL || '',
  STUDIO_BOOTSTRAP_PASSWORD: process.env.STUDIO_BOOTSTRAP_PASSWORD || '',
} : {};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {},
  },
  webServer: {
    command: 'node .next/standalone/server.js',
    url: `${baseURL}/dashboard`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { HOSTNAME: '127.0.0.1', PORT: '4175', NEXT_TELEMETRY_DISABLED: '1', ...serverPublishingEnv },
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
