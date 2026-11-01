export interface RevisionedSnapshot {
  storageRevision?: number;
}

export interface EntityWriteIntent {
  id: string;
  timestamp: string;
  auditId: string;
}

export function createEntityWriteIntent(
  prefix: string,
  existingId?: string,
  now = new Date()
): EntityWriteIntent {
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  const auditSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  const iso = now.toISOString();
  return {
    id: existingId || `${prefix}-${randomSuffix}`,
    timestamp: iso,
    auditId: `aud-${now.getTime()}-${auditSuffix}`,
  };
}

export interface SnapshotCommit<T, R = unknown> {
  snapshot: T;
  storageRevision: number;
  result: R;
}

/** Apply a synchronous mutation to the authoritative root record and acknowledge
 * only after IndexedDB reports transaction completion. The mutator must not await.
 */
export async function commitSnapshotMutation<T extends RevisionedSnapshot, R>(
  db: { transaction(storeName: string, mode: 'readwrite'): any },
  storeName: string,
  key: string,
  fallback: T,
  mutate: (latest: T) => { snapshot: T; result: R }
): Promise<SnapshotCommit<T, R>> {
  const tx = db.transaction(storeName, 'readwrite');
  try {
    const current = (await tx.store.get(key)) || fallback;
    const mutation = mutate(current);
    if (mutation.snapshot === current) {
      await tx.done;
      return { snapshot: current, storageRevision: current.storageRevision || 0, result: mutation.result };
    }
    const storageRevision = (current.storageRevision || 0) + 1;
    const snapshot = { ...mutation.snapshot, storageRevision };
    await tx.store.put(snapshot, key);
    await tx.done;
    return { snapshot, storageRevision, result: mutation.result };
  } catch (error) {
    try {
      await tx.done;
    } catch {
      // Preserve the original mutation or abort error.
    }
    throw error;
  }
}
