import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEED_ARTICLES, SEED_AUTHORS, SEED_CATEGORIES, SEED_MEDIA, SEED_SOURCES, SEED_TAGS } from '../seed-data';
import { serializeStudioArticleToSnapshotV1 } from './web-contract-v1';

describe('Studio publication serializer public metadata', () => {
  it('preserves series identity, serializes structured media, and filters unreviewed/demo knowledge links', () => {
    const source = SEED_ARTICLES[0];
    const asset = { ...SEED_MEDIA[0], src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Z6YcAAAAASUVORK5CYII=', credit: 'Reviewed fixture credit', licence: 'CC BY 4.0', rightsApproval: { approved: true, approvedBy: 'fixture-reviewer', approvedAt: '2026-11-03T00:00:00.000Z', evidenceRef: 'fixture-rights-evidence' } };
    const article = {
      ...source,
      seriesId: 'series-related-studies',
      status: 'draft' as const,
      bodyHtml: `${source.bodyHtml}<figure data-media-id="${asset.id}" data-layout="wide"><img src="${asset.src}" alt="Fixture figure"><figcaption>Fixture caption</figcaption></figure>`,
    };
    const knowledgeLinks = [
      { id: 'knowledge-reviewed', term: 'quantum coherence', targetType: 'wikipedia' as const, targetUrl: 'https://en.wikipedia.org/wiki/Quantum_coherence', locale: 'en' as const, previewTitle: 'Quantum coherence', previewExcerpt: 'Reviewed excerpt', sourceAttribution: 'Wikipedia', reviewStatus: 'approved' as const, isSampleDemoData: false },
      { id: 'knowledge-unreviewed', term: 'unreviewed concept', targetType: 'wikipedia' as const, targetUrl: 'https://en.wikipedia.org/wiki/Example', locale: 'en' as const, previewTitle: 'Unreviewed', previewExcerpt: '', sourceAttribution: 'Wikipedia', reviewStatus: 'suggested' as const, isSampleDemoData: false },
      { id: 'knowledge-demo', term: 'demo concept', targetType: 'wikipedia' as const, targetUrl: 'https://en.wikipedia.org/wiki/Example', locale: 'en' as const, previewTitle: 'Demo', previewExcerpt: '', sourceAttribution: 'Wikipedia', reviewStatus: 'approved' as const, isSampleDemoData: true },
    ];
    const output = serializeStudioArticleToSnapshotV1({ article, categories: SEED_CATEGORIES, tags: SEED_TAGS, authors: SEED_AUTHORS, sources: SEED_SOURCES, media: [asset], knowledgeLinks });
    assert.equal(output.snapshot.seriesId, 'series-related-studies');
    const figure = output.snapshot.blocks.find((block) => block.type === 'figure');
    assert.ok(figure && figure.type === 'figure');
    assert.equal(figure.media.id, asset.id);
    assert.equal(figure.layout, 'wide');
    assert.equal(figure.media.caption, 'Fixture caption');
    assert.equal(figure.media.rightsVerified, true);
    assert.deepEqual(output.snapshot.knowledgeLinks?.map((link) => link.id), ['knowledge-reviewed']);
    assert.match(output.snapshot.bodyHtml ?? '', new RegExp(`data-media-id="${asset.id}"`));
  });
});
