import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const staticAssets = resolve(root, '.next/static');
const standaloneRoot = resolve(root, '.next/standalone');
const standaloneNext = resolve(standaloneRoot, '.next');
const publicAssets = resolve(root, 'public');
const standalonePublic = resolve(standaloneRoot, 'public');
const databaseCli = resolve(root, 'scripts/publication-db.mjs');
const databaseOperations = resolve(root, 'lib/publishing/sqlite-operations.mjs');

if (!existsSync(resolve(standaloneRoot, 'server.js')) || !existsSync(staticAssets) || !existsSync(publicAssets)) {
  throw new Error('Build the application before preparing the standalone runtime.');
}

mkdirSync(standaloneNext, { recursive: true });
cpSync(staticAssets, resolve(standaloneNext, 'static'), { recursive: true, force: true });
cpSync(publicAssets, standalonePublic, { recursive: true, force: true });

const standaloneScripts = resolve(standaloneRoot, 'scripts');
const standalonePublishingLib = resolve(standaloneRoot, 'lib/publishing');
mkdirSync(standaloneScripts, { recursive: true });
mkdirSync(standalonePublishingLib, { recursive: true });
cpSync(databaseCli, resolve(standaloneScripts, 'publication-db.mjs'));
cpSync(databaseOperations, resolve(standalonePublishingLib, 'sqlite-operations.mjs'));
