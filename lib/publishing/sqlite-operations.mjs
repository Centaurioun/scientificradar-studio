import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, openSync, closeSync, statSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function ensurePrivateDirectory(path) {
  const directory = resolve(path);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = statSync(directory);
  if (!stat.isDirectory() || (stat.mode & 0o077) !== 0) throw new Error('PUBLICATION_DATABASE_DIRECTORY_NOT_PRIVATE');
  return directory;
}

export function verifyDatabase(databasePath) {
  const path = resolve(databasePath);
  if (!existsSync(path) || !lstatSync(path).isFile()) throw new Error('PUBLICATION_DATABASE_FILE_INVALID');
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const result = db.prepare('PRAGMA integrity_check').all();
    if (result.length !== 1 || result[0].integrity_check !== 'ok') throw new Error('PUBLICATION_DATABASE_INTEGRITY_FAILED');
    return true;
  } finally { db.close(); }
}

export function backupDatabase(sourcePath, destinationPath) {
  const source = resolve(sourcePath);
  const destination = resolve(destinationPath);
  if (source === destination || !existsSync(source) || !lstatSync(source).isFile()) throw new Error('PUBLICATION_DATABASE_FILE_INVALID');
  ensurePrivateDirectory(dirname(destination));
  if (existsSync(destination)) throw new Error('PUBLICATION_DATABASE_DESTINATION_EXISTS');
  verifyDatabase(source);
  const db = new DatabaseSync(source);
  try {
    const escaped = destination.replaceAll("'", "''");
    db.exec(`VACUUM INTO '${escaped}'`);
  } finally { db.close(); }
  chmodSync(destination, 0o600);
  verifyDatabase(destination);
  return destination;
}

export function restoreDatabase(backupPath, destinationPath) {
  const backup = resolve(backupPath);
  const destination = resolve(destinationPath);
  if (backup === destination) throw new Error('PUBLICATION_DATABASE_FILE_INVALID');
  verifyDatabase(backup);
  ensurePrivateDirectory(dirname(destination));
  if (existsSync(destination)) throw new Error('PUBLICATION_DATABASE_DESTINATION_EXISTS');
  closeSync(openSync(destination, 'wx', 0o600));
  try {
    copyFileSync(backup, destination);
    chmodSync(destination, 0o600);
    verifyDatabase(destination);
    return destination;
  } catch (error) {
    try { unlinkSync(destination); } catch { /* preserve original failure */ }
    throw error;
  }
}
