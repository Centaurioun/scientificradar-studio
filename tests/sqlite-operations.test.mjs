import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { backupDatabase, restoreDatabase, verifyDatabase } from '../lib/publishing/sqlite-operations.mjs';

const root = mkdtempSync(join(tmpdir(), 'scientificradar-sqlite-ops-'));
chmodSync(root, 0o700);
try {
  const sourcePath = join(root, 'source.sqlite');
  const backupPath = join(root, 'backups', 'snapshot.sqlite');
  const restorePath = join(root, 'restore', 'restored.sqlite');
  const db = new DatabaseSync(sourcePath);
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE records(id TEXT PRIMARY KEY, value TEXT NOT NULL); INSERT INTO records VALUES('record-1', 'committed via WAL');");
  db.close();

  backupDatabase(sourcePath, backupPath);
  assert.equal(verifyDatabase(backupPath), true);
  assert.equal(statSync(backupPath).mode & 0o777, 0o600);
  const backup = new DatabaseSync(backupPath, { readOnly: true });
  assert.equal(backup.prepare('SELECT value FROM records WHERE id=?').get('record-1').value, 'committed via WAL');
  backup.close();

  restoreDatabase(backupPath, restorePath);
  assert.equal(verifyDatabase(restorePath), true);
  assert.equal(statSync(restorePath).mode & 0o777, 0o600);
  assert.throws(() => restoreDatabase(backupPath, restorePath), /PUBLICATION_DATABASE_DESTINATION_EXISTS/);
  assert.throws(() => backupDatabase(sourcePath, backupPath), /PUBLICATION_DATABASE_DESTINATION_EXISTS/);
} finally {
  rmSync(root, { recursive: true, force: true });
}
