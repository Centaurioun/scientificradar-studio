import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeArticleEditorialMetadata } from './article-editorial-metadata';
import { SEED_ARTICLES } from './seed-data';

describe('article scientific metadata persistence merge', () => {
  it('retains editorial fields through partial save/reload updates and allows explicit removal', () => {
    const existing = {
      ...SEED_ARTICLES[0],
      relatedIds: ['related-en'],
      keyConcepts: [{ title: 'Photon', definition: 'A quantum of electromagnetic radiation.', headingId: 'photon' }],
      editorialNotices: [{ id: 'notice-1', type: 'correction' as const, title: 'Correction', body: 'Publisher correction.', recordedAt: '2026-11-08T00:00:00.000Z' }],
    };
    const next = mergeArticleEditorialMetadata({ summary: 'Updated summary' }, existing);
    assert.deepEqual(next.relatedIds, existing.relatedIds);
    assert.deepEqual(next.keyConcepts, existing.keyConcepts);
    assert.deepEqual(next.editorialNotices, existing.editorialNotices);
    assert.deepEqual(mergeArticleEditorialMetadata({ relatedIds: [], keyConcepts: [], editorialNotices: [] }, existing), { relatedIds: [], keyConcepts: [], editorialNotices: [] });
  });
});
