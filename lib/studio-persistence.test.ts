import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { commitSnapshotMutation, createEntityWriteIntent } from './studio-persistence';

type Snapshot = { storageRevision?: number; values: string[] };

class SerializedMemoryDb {
  value: Snapshot | undefined;
  private tail: Promise<void> = Promise.resolve();
  completeAfterPut = 0;
  abortOnPut = false;

  transaction() {
    const prior = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    let staged: Snapshot | undefined;
    let putSeen!: () => void;
    const wasPut = new Promise<void>((resolve) => { putSeen = resolve; });
    const ready = prior.then(() => undefined);
    const done = (async () => {
      await ready;
      await Promise.race([wasPut, new Promise<void>((resolve) => setTimeout(resolve, 0))]);
      if (staged) {
        await new Promise((resolve) => setTimeout(resolve, this.completeAfterPut));
        this.value = staged;
      }
      release();
    })();
    return {
      store: {
        get: async () => { await ready; return this.value; },
        put: async (value: Snapshot) => {
          await ready;
          if (this.abortOnPut) throw new Error('Controlled transaction abort');
          staged = value;
          putSeen();
        },
      },
      done,
    };
  }
}

describe('commitSnapshotMutation', () => {
  it('serializes concurrent read-modify-write operations against the latest record', async () => {
    const db = new SerializedMemoryDb();
    db.value = { storageRevision: 4, values: [] };
    const mutate = (value: string) => commitSnapshotMutation<Snapshot, string>(db, 'studio_state', 'root', { values: [] }, (latest) => ({
      snapshot: { ...latest, values: [...latest.values, value] }, result: value,
    }));

    const results = await Promise.all([mutate('tab-a'), mutate('tab-b')]);
    assert.deepEqual(db.value?.values, ['tab-a', 'tab-b']);
    assert.deepEqual(results.map((item) => item.storageRevision), [5, 6]);
  });

  it('resolves only after transaction completion', async () => {
    const db = new SerializedMemoryDb();
    db.completeAfterPut = 30;
    let resolved = false;
    const result = commitSnapshotMutation<Snapshot, string>(db, 'studio_state', 'root', { values: [] }, () => ({
      snapshot: { values: ['durable'] }, result: 'receipt',
    })).then((receipt) => { resolved = true; return receipt; });

    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(resolved, false);
    assert.equal((await result).storageRevision, 1);
    assert.deepEqual(db.value?.values, ['durable']);
  });

  it('does not advance revisions for a rejected no-op mutation', async () => {
    const db = new SerializedMemoryDb();
    db.value = { storageRevision: 8, values: ['kept'] };
    const receipt = await commitSnapshotMutation<Snapshot, { conflict: boolean }>(db, 'studio_state', 'root', { values: [] }, (latest) => ({
      snapshot: latest, result: { conflict: true },
    }));
    assert.equal(receipt.storageRevision, 8);
    assert.equal(db.value?.storageRevision, 8);
  });

  it('rejects the receipt when the storage write aborts', async () => {
    const db = new SerializedMemoryDb();
    db.value = { storageRevision: 3, values: ['committed'] };
    db.abortOnPut = true;
    await assert.rejects(
      commitSnapshotMutation<Snapshot, string>(db, 'studio_state', 'root', { values: [] }, () => ({
        snapshot: { values: ['uncommitted'] }, result: 'receipt',
      })),
      /Controlled transaction abort/
    );
    assert.deepEqual(db.value?.values, ['committed']);
  });

  it('keeps pre-generated EntityWriteIntent IDs identical across optimistic and committed replays (SRS-DATA-003)', async () => {
    const db = new SerializedMemoryDb();
    db.value = { storageRevision: 1, values: [] };
    const intent = createEntityWriteIntent('cat', undefined, new Date('2026-11-01T12:00:00.000Z'));
    assert.match(intent.id, /^cat-[a-z0-9-]+$/i);
    assert.equal(intent.timestamp, '2026-11-01T12:00:00.000Z');

    const applyUpdate = (state: Snapshot): Snapshot => ({
      ...state,
      values: [...state.values, `${intent.id}@${intent.timestamp}`],
    });

    const optimistic = applyUpdate(db.value);
    const committed = await commitSnapshotMutation<Snapshot, string>(
      db,
      'studio_state',
      'root',
      { values: ['seed-should-not-be-used'] },
      (latest) => ({ snapshot: applyUpdate(latest), result: intent.id })
    );

    assert.deepEqual(optimistic.values, committed.snapshot.values);
    assert.equal(committed.result, intent.id);
  });

  it('preserves an intentionally empty persisted array rather than re-seeding fallback values (SRS-CODE-001)', async () => {
    const db = new SerializedMemoryDb();
    db.value = { storageRevision: 2, values: [] };
    const committed = await commitSnapshotMutation<Snapshot, number>(
      db,
      'studio_state',
      'root',
      { values: ['seed-article-1', 'seed-article-2'] },
      (latest) => ({ snapshot: latest, result: latest.values.length })
    );
    assert.equal(committed.result, 0);
    assert.deepEqual(committed.snapshot.values, []);
  });
});

