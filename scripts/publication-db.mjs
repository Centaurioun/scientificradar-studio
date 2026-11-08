#!/usr/bin/env node
import { backupDatabase, restoreDatabase, verifyDatabase } from '../lib/publishing/sqlite-operations.mjs';

const [command, source, destination] = process.argv.slice(2);
try {
  if (command === 'backup' && source && destination) {
    console.log(`Backup created and verified: ${backupDatabase(source, destination)}`);
  } else if (command === 'restore' && source && destination) {
    console.log(`Restore created and verified: ${restoreDatabase(source, destination)}`);
  } else if (command === 'verify' && source && !destination) {
    verifyDatabase(source);
    console.log(`Database integrity check passed: ${source}`);
  } else {
    console.error('Usage: node scripts/publication-db.mjs <backup|restore|verify> <database-or-backup> [destination]');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'PUBLICATION_DATABASE_OPERATION_FAILED');
  process.exitCode = 1;
}
