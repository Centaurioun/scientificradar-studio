import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEED_ARTICLES, SEED_AUTHORS, SEED_CATEGORIES, SEED_MEDIA, SEED_SOURCES, SEED_TAGS } from '../seed-data';
import { serializeStudioArticleToSnapshotV1 } from './web-contract-v1';

describe('Studio publication serializer public metadata', () => {
  it('round-trips reviewed concepts, notices, related articles, and bibliographic fields compatibly in v1.0.0', () => {
    const source = SEED_ARTICLES[0];
    const article = {
      ...source,
      bodyHtml: '<h2 id="photon">Photon</h2><p>Reviewed manuscript text.</p>',
      relatedIds: ['related-en-article'],
      sourceIds: [SEED_SOURCES[0].id],
      keyConcepts: [{ title: 'Photon', definition: 'A quantum of electromagnetic radiation.', headingId: 'photon' }],
      editorialNotices: [{ id: 'notice-1', type: 'correction' as const, title: 'Publisher correction', body: 'The publisher issued a correction.', relatedArticleId: 'original-record', sourceUrl: 'https://publisher.example/correction', recordedAt: '2026-11-08T00:00:00.000Z' }],
    };
    const sources = [{ ...SEED_SOURCES[0], volume: '12', issue: '3', pages: '100-108', articleNumber: 'e1234' }];
    const output = serializeStudioArticleToSnapshotV1({ article, categories: SEED_CATEGORIES, tags: SEED_TAGS, authors: SEED_AUTHORS, sources, media: [] });
    assert.equal(output.snapshot.contractVersion, '1.0.0');
    assert.deepEqual(output.snapshot.relatedIds, ['related-en-article']);
    assert.deepEqual(output.snapshot.keyConcepts, article.keyConcepts);
    assert.deepEqual(output.snapshot.editorialNotices, article.editorialNotices);
    assert.deepEqual(output.snapshot.sources[0] && { volume: output.snapshot.sources[0].volume, issue: output.snapshot.sources[0].issue, pages: output.snapshot.sources[0].pages, articleNumber: output.snapshot.sources[0].articleNumber }, { volume: '12', issue: '3', pages: '100-108', articleNumber: 'e1234' });
    assert.equal(output.validation.issues.some(issue => issue.code === 'INVALID_EDITORIAL_METADATA'), false, JSON.stringify(output.validation.issues));
  });

  it('blocks duplicate/self related IDs and missing or reused concept heading anchors', () => {
    const article = { ...SEED_ARTICLES[0], bodyHtml: '<h2 id="topic">Topic</h2><p>Body</p>', relatedIds: [SEED_ARTICLES[0].id, 'other', 'other'], keyConcepts: [
      { title: 'A', definition: 'Reviewed definition A.', headingId: 'missing' },
      { title: 'B', definition: 'Reviewed definition B.', headingId: 'topic' },
      { title: 'C', definition: 'Reviewed definition C.', headingId: 'topic' },
    ], editorialNotices: [{ id: '', type: 'retraction' as const, title: '', body: '', sourceUrl: 'javascript:alert(1)', recordedAt: 'bad-date' }] };
    const output = serializeStudioArticleToSnapshotV1({ article, categories: SEED_CATEGORIES, tags: SEED_TAGS, authors: SEED_AUTHORS, sources: SEED_SOURCES, media: [] });
    assert.equal(output.validation.issues.filter(issue => issue.code === 'INVALID_EDITORIAL_METADATA').length >= 4, true);
  });

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
