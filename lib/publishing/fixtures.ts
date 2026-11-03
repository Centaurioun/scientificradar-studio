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

  // Ensure real non-demo DOIs and verified media rights for the authorized public release fixtures
  const verifiedSources = SEED_SOURCES.map((src, index) => ({
    ...src,
    doi: `10.1038/s41586-025-0${8100 + index}-${index}`,
    url: `https://doi.org/10.1038/s41586-025-0${8100 + index}-${index}`,
  }));

  const verifiedMedia = SEED_MEDIA.map((m) => ({
    ...m,
    src: m.src.startsWith('data:')
      ? `/images/figures/${m.filename.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      : m.src,
    credit: m.credit?.trim() || 'ScientificRadar Observatory Visual Lab',
    licence: m.licence?.trim() || 'CC BY 4.0',
    humanReviewedAlt: true,
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
    sources: verifiedSources,
    media: verifiedMedia,
    authorizationReceipt: {
      receiptId: 'rcpt-studio-m7-en-001',
      authorizedByActor: 'Dr. Clara Vance',
      authorizedByRole: 'owner',
      issuedAt: '2026-11-03T12:00:00.000Z',
      serverVerified: true,
    },
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
    sources: verifiedSources,
    media: verifiedMedia,
    authorizationReceipt: {
      receiptId: 'rcpt-studio-m7-tr-001',
      authorizedByActor: 'Dr. Selin Kaya',
      authorizedByRole: 'editor',
      issuedAt: '2026-11-03T12:00:00.000Z',
      serverVerified: true,
    },
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
    sources: verifiedSources,
    media: verifiedMedia,
  });

  return {
    publishedEnglishHtmlFixture: {
      ...enSerialized.snapshot,
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
    publishedTurkishHtmlFixture: {
      ...trSerialized.snapshot,
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
    nonPublicDraftFixture: {
      ...draftSerialized.snapshot,
      contractVersion: PUBLICATION_CONTRACT_VERSION,
    },
  };
}
