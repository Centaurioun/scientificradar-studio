import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const isolatedDir = mkdtempSync(join(tmpdir(), 'scientificradar-publishing-e2e-'));
const env = {
  ...process.env,
  PLAYWRIGHT_SERVER_PUBLISHING_E2E: 'true',
  NEXT_PUBLIC_SERVER_PUBLISHING_ENABLED: 'true',
  NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL: 'http://127.0.0.1:4175',
  SCIENTIFICRADAR_STUDIO_PUBLISHING_URL: 'http://127.0.0.1:4175',
  PUBLICATION_DATABASE_PATH: resolve(isolatedDir, 'publishing.sqlite'),
  STUDIO_SESSION_SECRET: randomBytes(40).toString('hex'),
  STUDIO_BOOTSTRAP_EMAIL: 'owner@example.test',
  STUDIO_BOOTSTRAP_PASSWORD: 'Local-Only-Owner-Password-2026!',
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  return result.status === 0;
}

try {
  const success = run('npm', ['run', 'build'])
    && run('npx', ['playwright', 'test', 'tests/e2e/server-publishing-ui.spec.ts']);
  if (!success && process.exitCode === undefined) process.exitCode = 1;
} finally {
  rmSync(isolatedDir, { recursive: true, force: true });
}
