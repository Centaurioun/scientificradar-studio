import {
  PUBLICATION_CONTRACT_VERSION,
  PublishedSnapshotRecordV1,
  serializeStudioArticleToSnapshotV1,
} from './web-contract-v1';
import {
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
  SEED_MEDIA,
  SEED_SOURCES,
  SEED_TAGS,
} from '../seed-data';

/**
 * M7 — Deterministic Studio Export Fixtures
 * Produces deterministic `PublishedSnapshotRecordV1` payloads from Studio's seed
 * repository for cross-repository contract testing with ScientificRadar Web.
 */
export function buildDeterministicStudioExportFixtures(): {
  publishedEnglishHtmlFixture: PublishedSnapshotRecordV1;
  publishedTurkishHtmlFixture: PublishedSnapshotRecordV1;
  nonPublicDraftFixture: PublishedSnapshotRecordV1;
} {
  const enArticle =
    SEED_ARTICLES.find((a) => a.id === 'art-1') || SEED_ARTICLES[0];
  const trArticle =
    SEED_ARTICLES.find((a) => a.locale === 'tr') || SEED_ARTICLES[2];
  const draftArticle =
    SEED_ARTICLES.find(
      (a) => a.status === 'draft' || a.status === 'in_review'
    ) || SEED_ARTICLES[1];

  // Synthetic consumer-only fixtures: no real publication permission.
  const fixtureSources = SEED_SOURCES.map((src) => ({
    ...src,
    doi: undefined,
    url: '',
  }));

  const fixtureMedia = SEED_MEDIA.map((m) => ({
    ...m,
    src: m.src.startsWith('data:')
      ? `/images/figures/${m.filename.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      : m.src,
    credit: m.credit?.trim() || 'Synthetic fixture credit — no real licence claim',
    licence: m.licence?.trim() || 'Synthetic test licence — not authorized for publication',
    rightsApproval: {
      approved: true,
      approvedBy: 'synthetic-fixture-reviewer',
      approvedAt: '2026-11-03T00:00:00.000Z',
      evidenceRef: 'synthetic:contract-fixture-not-a-real-licence',
    },
  }));

  const sanitizeInlineDataImgSrc = (html: string) =>
    html.replace(
      /<img\b([^>]*?)\bsrc=["']data:[^"']+["']([^>]*)>/gi,
      '<img$1src="/images/figures/studio-inline-figure.svg"$2>'
    );

  const enSerialized = serializeStudioArticleToSnapshotV1({
    article: {
      ...enArticle,
      bodyHtml: sanitizeInlineDataImgSrc(enArticle.bodyHtml),
      status: 'published',
      seo: {
        ...enArticle.seo,
        noindex: false,
      },
    },
    categories: SEED_CATEGORIES,
    tags: SEED_TAGS,
    authors: SEED_AUTHORS,
    sources: fixtureSources,
    media: fixtureMedia,
  });

  const trSerialized = serializeStudioArticleToSnapshotV1({
    article: {
      ...trArticle,
      bodyHtml: sanitizeInlineDataImgSrc(trArticle.bodyHtml),
      status: 'published',
      seo: {
        ...trArticle.seo,
        noindex: false,
      },
    },
    categories: SEED_CATEGORIES,
    tags: SEED_TAGS,
    authors: SEED_AUTHORS,
    sources: fixtureSources,
    media: fixtureMedia,
  });

  // Draft fixture without authorizationReceipt must remain non-public and noindex: true
  const draftSerialized = serializeStudioArticleToSnapshotV1({
    article: {
      ...draftArticle,
      bodyHtml: sanitizeInlineDataImgSrc(draftArticle.bodyHtml),
      status: 'draft',
    },
    categories: SEED_CATEGORIES,
    tags: SEED_TAGS,
    authors: SEED_AUTHORS,
    sources: fixtureSources,
    media: fixtureMedia,
  });

  return {
    // Public status here exercises the Web consumer only; the local Studio
    // serializer above remains non-public. These remain noindex fixtures.
    publishedEnglishHtmlFixture: {
      ...enSerialized.snapshot,
      status: 'published',
      seo: { ...enSerialized.snapshot.seo, noindex: true },
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
    publishedTurkishHtmlFixture: {
      ...trSerialized.snapshot,
      status: 'published',
      seo: { ...trSerialized.snapshot.seo, noindex: true },
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
    nonPublicDraftFixture: {
      ...draftSerialized.snapshot,
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
  };
}
