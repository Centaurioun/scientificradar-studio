import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Article, MediaAsset, ScientificSource } from '../types';
import { computeArticleFingerprint } from './run-article-audit';

const article: Article = {
  id: 'article-1',
  locale: 'tr',
  title: 'Kuantum dolanıklığı ve ölçüm',
  slug: 'kuantum-dolanikligi',
  summary: 'Bilimsel bir özet Ω β ∑',
  body: {},
  bodyHtml: '<p>Bilimsel metin Ω β ∑</p>',
  status: 'draft',
  primaryCategoryId: 'category-1',
  categoryIds: ['category-1', 'category-2'],
  tagIds: ['tag-1', 'tag-2'],
  sourceIds: ['source-1', 'source-2'],
  featuredMediaId: 'media-1',
  seo: { title: 'SEO başlığı', description: 'Bilimsel açıklama', noindex: false },
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  version: 3,
};

const media: MediaAsset[] = [
  {
    id: 'media-1',
    filename: 'figure.png',
    title: 'Ölçüm grafiği',
    kind: 'scientific_figure',
    src: '/figure.png',
    mime: 'image/png',
    width: 640,
    height: 480,
    byteSize: 1024,
    altText: 'Ölçüm sonuçlarını gösteren grafik',
    humanReviewedAlt: true,
    caption: 'Şekil 1: Ölçüm sonuçları.',
    credit: 'Araştırma ekibi',
    licence: 'CC BY 4.0',
    layout: 'auto',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

const sources: ScientificSource[] = [
  {
    id: 'source-1',
    title: 'Kuantum ölçümü',
    authors: 'A. Araştırmacı',
    journal: 'Bilim Dergisi',
    year: 2025,
    doi: '10.1234/example.1',
    url: 'https://example.org/1',
    sourceType: 'peer_reviewed',
    accessDate: '2026-11-01',
    verificationStatus: 'verified_metadata',
    humanClaimVerified: true,
  },
  {
    id: 'source-2',
    title: 'Ölçüm verisi',
    authors: 'B. Araştırmacı',
    journal: 'Veri Deposu',
    year: 2024,
    doi: '10.5678/example.2',
    url: 'https://example.org/2',
    sourceType: 'dataset',
    accessDate: '2026-11-01',
    verificationStatus: 'url_checked',
    humanClaimVerified: false,
  },
];

const multipleMedia: MediaAsset[] = [
  ...media,
  { ...media[0], id: 'media-2', filename: 'figure-2.png', title: 'İkinci ölçüm grafiği' },
];

describe('computeArticleFingerprint', () => {
  it('is stable for identical inputs and retains article metadata changes including scientific Unicode', () => {
    const first = computeArticleFingerprint(article, media, sources);
    const second = computeArticleFingerprint(article, media, sources);

    assert.equal(first, second);
    assert.notEqual(
      computeArticleFingerprint({ ...article, summary: 'Bilimsel bir özet Ω β ∑ güncellendi' }, media, sources),
      first
    );
  });

  it('changes when a linked source DOI or verification status changes', () => {
    const baseline = computeArticleFingerprint(article, media, sources);

    assert.notEqual(computeArticleFingerprint(article, media, [
      { ...sources[0], doi: '10.1234/changed' }, sources[1],
    ]), baseline);
    assert.notEqual(computeArticleFingerprint(article, media, [
      { ...sources[0], verificationStatus: 'needs_review' }, sources[1],
    ]), baseline);
  });

  it('changes when featured figure alt text, caption, or rights metadata changes', () => {
    const baseline = computeArticleFingerprint(article, media, sources);

    assert.notEqual(computeArticleFingerprint(article, [{ ...media[0], altText: 'Başka bir şekli açıklayan metin' }], sources), baseline);
    assert.notEqual(computeArticleFingerprint(article, [{ ...media[0], caption: 'Şekil 1: Güncellenmiş sonuçlar.' }], sources), baseline);
    assert.notEqual(computeArticleFingerprint(article, [{ ...media[0], credit: 'Yeni kaynak' }], sources), baseline);
    assert.notEqual(computeArticleFingerprint(article, [{ ...media[0], licence: 'CC BY-SA 4.0' }], sources), baseline);
  });

  it('ignores ordering changes in linked category, source, and media ids', () => {
    const reorderedArticle = {
      ...article,
      categoryIds: [...article.categoryIds].reverse(),
      sourceIds: [...article.sourceIds].reverse(),
    };
    const reorderedMedia = [...multipleMedia].reverse();
    const reorderedSources = [...sources].reverse();

    assert.equal(
      computeArticleFingerprint(reorderedArticle, reorderedMedia, reorderedSources),
      computeArticleFingerprint(article, multipleMedia, sources)
    );
  });
});
