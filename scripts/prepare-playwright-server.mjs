import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const staticAssets = resolve(root, '.next/static');
const standaloneNext = resolve(root, '.next/standalone/.next');
const publicAssets = resolve(root, 'public');
const standalonePublic = resolve(root, '.next/standalone/public');

if (!existsSync(resolve(root, '.next/standalone/server.js')) || !existsSync(staticAssets)) {
  throw new Error('Build the application with `bun run build` before starting Playwright.');
}

mkdirSync(standaloneNext, { recursive: true });
cpSync(staticAssets, resolve(standaloneNext, 'static'), { recursive: true, force: true });

if (existsSync(publicAssets)) {
  cpSync(publicAssets, standalonePublic, { recursive: true, force: true });
}
