import {
  ArticleHeadingOutlineItem,
  PUBLICATION_CONTRACT_VERSION,
  PublicArticle,
  PublicAuthor,
  PublicMedia,
  PublicSource,
  PublicationStatus,
  PublishedSnapshotRecordV1,
  SupportedLocale,
} from "./types";
import {
  prepareCanonicalBodyHtml,
  resolveArticleHeadings,
} from "./sanitizer";

export interface SnapshotValidationIssue {
  code:
    | "INVALID_CONTRACT_VERSION"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_REVISION"
    | "INVALID_LOCALE"
    | "NON_PUBLIC_STATUS"
    | "WITHDRAWN_ARTICLE"
    | "UNSAFE_MEDIA_URL"
    | "INCOMPLETE_MEDIA_METADATA"
    | "SYNTHETIC_DEMO_DOI_FORBIDDEN"
    | "INVALID_DOI_FORMAT"
    | "BROKEN_CITATION_REFERENCE"
    | "UNSUPPORTED_STUDIO_NODE"
    | "EMPTY_ARTICLE_BODY";
  field: string;
  message: string;
}

export interface SnapshotValidationResult {
  valid: boolean;
  isPubliclyRenderable: boolean;
  isIndexableCandidate: boolean;
  issues: SnapshotValidationIssue[];
  headings: ArticleHeadingOutlineItem[];
}

const VALID_LOCALES: ReadonlySet<SupportedLocale> = new Set(["en", "tr"]);
const PUBLIC_STATUSES: ReadonlySet<PublicationStatus> = new Set([
  "published",
  "demo",
]);
const NON_PUBLIC_STATUSES: ReadonlySet<PublicationStatus> = new Set([
  "draft",
  "in_review",
  "scheduled",
  "archived",
]);
const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

/**
 * Tags or Studio editor artifacts that must never be silently dropped or
 * accepted into a published snapshot without explicit rejection.
 */
const UNSUPPORTED_RAW_HTML_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern: /<\s*(script|iframe|object|embed|applet|form|input|button|select|textarea)\b/i,
    reason: "Interactive or executable HTML tag is forbidden in published snapshots",
  },
  {
    pattern: /\bsrc\s*=\s*["']\s*(blob:|data:|file:|javascript:)/i,
    reason: "Ephemeral or unsafe media scheme (blob:/data:/file:/javascript:) is forbidden",
  },
  {
    pattern: /\bdata-studio-(draft|unsaved|local-blob|editor-only)\b/i,
    reason: "Unresolved Studio authoring node attribute cannot be published to Web",
  },
];

export function isSafePublishedMediaUrl(
  urlValue: string,
  trustedMediaOrigins: ReadonlySet<string> = new Set()
): boolean {
  if (typeof urlValue !== "string") return false;
  const trimmed = urlValue.trim();
  if (!trimmed) return false;

  // Reject protocol-relative, backslash, or ephemeral browser URLs
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /^(blob|data|file|javascript|vbscript):/i.test(trimmed)
  ) {
    return false;
  }

  // Same-origin root-relative paths are valid
  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return trustedMediaOrigins.has(parsed.origin);
  } catch {
    return false;
  }
}

function validateMediaRecord(
  media: PublicMedia,
  fieldPrefix: string,
  trustedMediaOrigins: ReadonlySet<string>,
  issues: SnapshotValidationIssue[]
): void {
  if (!isSafePublishedMediaUrl(media.src, trustedMediaOrigins)) {
    issues.push({
      code: "UNSAFE_MEDIA_URL",
      field: `${fieldPrefix}.src`,
      message: `Media URL "${media.src}" is not an approved same-origin path or trusted HTTPS origin (blob:/data: URLs are forbidden).`,
    });
  }

  if (!media.alt || !media.alt.trim()) {
    issues.push({
      code: "INCOMPLETE_MEDIA_METADATA",
      field: `${fieldPrefix}.alt`,
      message: "Scientific figure/media requires non-empty accessible alt text.",
    });
  }

  if (!media.caption || !media.caption.trim()) {
    issues.push({
      code: "INCOMPLETE_MEDIA_METADATA",
      field: `${fieldPrefix}.caption`,
      message: "Scientific figure/media requires a descriptive caption.",
    });
  }

  if (!media.credit || !media.credit.trim() || !media.license || !media.license.trim()) {
    issues.push({
      code: "INCOMPLETE_MEDIA_METADATA",
      field: `${fieldPrefix}.credit`,
      message: "Scientific figure/media requires explicit credit and license provenance.",
    });
  }

  if (
    typeof media.width !== "number" ||
    media.width <= 0 ||
    typeof media.height !== "number" ||
    media.height <= 0
  ) {
    issues.push({
      code: "INCOMPLETE_MEDIA_METADATA",
      field: `${fieldPrefix}.dimensions`,
      message: "Media width and height must be positive numbers to prevent layout shift.",
    });
  }
}

/**
 * Validates a Versioned Public Snapshot (v1.0.0) deterministically before
 * rendering or caching in ScientificRadar Web.
 */
export function validatePublicationSnapshotV1(
  snapshot: PublishedSnapshotRecordV1,
  options?: {
    trustedMediaOrigins?: string[];
  }
): SnapshotValidationResult {
  const issues: SnapshotValidationIssue[] = [];
  const trustedOrigins = new Set(options?.trustedMediaOrigins ?? []);

  if (snapshot.contractVersion !== PUBLICATION_CONTRACT_VERSION) {
    issues.push({
      code: "INVALID_CONTRACT_VERSION",
      field: "contractVersion",
      message: `Expected contractVersion "${PUBLICATION_CONTRACT_VERSION}", received "${String(snapshot.contractVersion)}".`,
    });
  }

  const requiredStrings: Array<[keyof PublishedSnapshotRecordV1, string]> = [
    ["articleId", snapshot.articleId],
    ["revisionId", snapshot.revisionId],
    ["slug", snapshot.slug],
    ["title", snapshot.title],
    ["dek", snapshot.dek],
    ["summary", snapshot.summary],
    ["categorySlug", snapshot.categorySlug],
    ["publishedAt", snapshot.publishedAt],
  ];

  for (const [field, value] of requiredStrings) {
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        field: String(field),
        message: `Required snapshot field "${String(field)}" must be a non-empty string.`,
      });
    }
  }

  if (
    typeof snapshot.revisionNumber !== "number" ||
    !Number.isInteger(snapshot.revisionNumber) ||
    snapshot.revisionNumber < 1
  ) {
    issues.push({
      code: "INVALID_REVISION",
      field: "revisionNumber",
      message: "revisionNumber must be a positive integer >= 1.",
    });
  }

  if (!VALID_LOCALES.has(snapshot.locale)) {
    issues.push({
      code: "INVALID_LOCALE",
      field: "locale",
      message: `Unsupported locale "${String(snapshot.locale)}". Supported locales are "en" and "tr".`,
    });
  }

  if (snapshot.status === "withdrawn") {
    issues.push({
      code: "WITHDRAWN_ARTICLE",
      field: "status",
      message: `Article "${snapshot.slug}" has status "withdrawn" and must not be rendered as active public content.`,
    });
  } else if (NON_PUBLIC_STATUSES.has(snapshot.status)) {
    issues.push({
      code: "NON_PUBLIC_STATUS",
      field: "status",
      message: `Article "${snapshot.slug}" has non-public status "${snapshot.status}" and is excluded from public rendering.`,
    });
  }

  const hasBlocks = Array.isArray(snapshot.blocks) && snapshot.blocks.length > 0;
  const hasBodyHtml =
    typeof snapshot.bodyHtml === "string" && snapshot.bodyHtml.trim().length > 0;

  if (!hasBlocks && !hasBodyHtml) {
    issues.push({
      code: "EMPTY_ARTICLE_BODY",
      field: "blocks",
      message: "Published snapshot must contain either structured blocks or canonical bodyHtml.",
    });
  }

  if (snapshot.hero) {
    validateMediaRecord(snapshot.hero, "hero", trustedOrigins, issues);
  }

  const sourceIds = new Set<string>();
  for (const [idx, source] of (snapshot.sources ?? []).entries()) {
    sourceIds.add(source.id);
    if (source.isIllustrativeDemo && source.doi !== undefined) {
      issues.push({
        code: "SYNTHETIC_DEMO_DOI_FORBIDDEN",
        field: `sources[${idx}].doi`,
        message: `Illustrative demo source "${source.id}" must not fabricate a DOI.`,
      });
    }
    if (!source.isIllustrativeDemo && source.doi !== undefined) {
      if (!DOI_REGEX.test(source.doi.trim())) {
        issues.push({
          code: "INVALID_DOI_FORMAT",
          field: `sources[${idx}].doi`,
          message: `Source "${source.id}" has malformed DOI "${source.doi}".`,
        });
      }
    }
  }

  for (const [idx, block] of (snapshot.blocks ?? []).entries()) {
    if (block.type === "figure") {
      validateMediaRecord(
        block.media,
        `blocks[${idx}].media`,
        trustedOrigins,
        issues
      );
    }
    if (block.type === "paragraph" && block.citations) {
      for (const citeId of block.citations) {
        if (!sourceIds.has(citeId)) {
          issues.push({
            code: "BROKEN_CITATION_REFERENCE",
            field: `blocks[${idx}].citations`,
            message: `Paragraph "${block.id}" cites unknown source ID "${citeId}".`,
          });
        }
      }
    }
  }

  if (hasBodyHtml && snapshot.bodyHtml) {
    for (const rule of UNSUPPORTED_RAW_HTML_PATTERNS) {
      if (rule.pattern.test(snapshot.bodyHtml)) {
        issues.push({
          code: "UNSUPPORTED_STUDIO_NODE",
          field: "bodyHtml",
          message: rule.reason,
        });
      }
    }

    // Verify all inline data-citation-source-id attributes in bodyHtml match declared sources
    const citationMatches = snapshot.bodyHtml.matchAll(
      /data-citation-source-id\s*=\s*["']([^"']+)["']/gi
    );
    for (const match of citationMatches) {
      const citedId = match[1];
      if (!sourceIds.has(citedId)) {
        issues.push({
          code: "BROKEN_CITATION_REFERENCE",
          field: "bodyHtml",
          message: `Canonical bodyHtml cites unknown source ID "${citedId}".`,
        });
      }
    }
  }

  const headings =
    snapshot.headings && snapshot.headings.length > 0
      ? snapshot.headings
      : hasBodyHtml && snapshot.bodyHtml
        ? prepareCanonicalBodyHtml(snapshot.bodyHtml, {
            sources: snapshot.sources,
          }).headings
        : resolveArticleHeadings({
            blocks: snapshot.blocks ?? [],
            bodyHtml: snapshot.bodyHtml,
            sources: snapshot.sources ?? [],
          });

  const isPublicStatus = PUBLIC_STATUSES.has(snapshot.status);
  const hasBlockingIssues = issues.length > 0;

  return {
    valid: !hasBlockingIssues,
    isPubliclyRenderable: isPublicStatus && !hasBlockingIssues,
    isIndexableCandidate:
      snapshot.status === "published" &&
      !snapshot.seo?.noindex &&
      !hasBlockingIssues,
    issues,
    headings,
  };
}

/**
 * Converts a validated PublishedSnapshotRecordV1 into the PublicArticle shape
 * consumed by ScientificRadar Web routes and components.
 */
export function adaptSnapshotV1ToPublicArticle(
  snapshot: PublishedSnapshotRecordV1
): PublicArticle {
  const authorIds =
    snapshot.authorIds && snapshot.authorIds.length > 0
      ? snapshot.authorIds
      : (snapshot.authors ?? []).map((a) => a.id);

  return {
    id: snapshot.articleId,
    slug: snapshot.slug,
    locale: snapshot.locale,
    editorialType: snapshot.editorialType,
    status: snapshot.status,
    title: snapshot.title,
    dek: snapshot.dek,
    summary: snapshot.summary,
    categorySlug: snapshot.categorySlug,
    subcategorySlugs: [...snapshot.subcategorySlugs],
    tagSlugs: [...snapshot.tagSlugs],
    authorIds,
    publishedAt: snapshot.publishedAt,
    updatedAt: snapshot.updatedAt,
    withdrawnAt: snapshot.withdrawnAt,
    withdrawalReason: snapshot.withdrawalReason,
    readingTimeMinutes: snapshot.readingTimeMinutes,
    featuredRank: snapshot.featuredRank,
    mostReadDemoRank: snapshot.mostReadDemoRank,
    hero: snapshot.hero,
    blocks: snapshot.blocks,
    bodyHtml: snapshot.bodyHtml,
    sources: snapshot.sources,
    relatedIds: snapshot.relatedIds,
    seo: snapshot.seo,
    revisionId: snapshot.revisionId,
    revisionNumber: snapshot.revisionNumber,
    translationGroupId: snapshot.translationGroupId,
  };
}

/**
 * Exports an existing PublicArticle record into the canonical v1 snapshot envelope.
 */
export function adaptPublicArticleToSnapshotV1(
  article: PublicArticle,
  authors?: PublicAuthor[]
): PublishedSnapshotRecordV1 {
  const headings = resolveArticleHeadings(article);
  return {
    contractVersion: PUBLICATION_CONTRACT_VERSION,
    articleId: article.id,
    revisionId: article.revisionId ?? `rev-${article.id}-v1`,
    revisionNumber: article.revisionNumber ?? 1,
    slug: article.slug,
    locale: article.locale,
    translationGroupId: article.translationGroupId ?? `tg-${article.id}`,
    editorialType: article.editorialType,
    status: article.status,
    title: article.title,
    dek: article.dek,
    summary: article.summary,
    categorySlug: article.categorySlug,
    subcategorySlugs: [...article.subcategorySlugs],
    tagSlugs: [...article.tagSlugs],
    authorIds: [...article.authorIds],
    authors,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    withdrawnAt: article.withdrawnAt,
    withdrawalReason: article.withdrawalReason,
    readingTimeMinutes: article.readingTimeMinutes,
    featuredRank: article.featuredRank,
    mostReadDemoRank: article.mostReadDemoRank,
    hero: article.hero,
    blocks: article.blocks,
    bodyHtml: article.bodyHtml,
    headings,
    sources: article.sources as PublicSource[],
    relatedIds: [...article.relatedIds],
    seo: article.seo,
  };
}
