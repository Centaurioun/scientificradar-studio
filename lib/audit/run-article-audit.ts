import {
  Article,
  Category,
  MediaAsset,
  ScientificSource,
  Tag,
} from '../types';
import {
  MAX_EDITORIAL_TAGS,
  sanitizeAndDemoteBodyH1,
  slugify,
  validateDoiSyntax,
  validateSafeUrl,
} from '../editorial-rules';
import { AuditFinding, AuditReport, FindingStatus, FixProposal } from './types';

/**
 * Computes a deterministic fingerprint for an article and its linked media/sources
 * so stale audit reports are immediately detected after any edit.
 */
export function computeArticleFingerprint(
  article: Article,
  articleMedia: MediaAsset[] = [],
  articleSources: ScientificSource[] = []
): string {
  const payload = JSON.stringify({
    id: article.id,
    version: article.version,
    locale: article.locale,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    bodyHtml: article.bodyHtml,
    primaryCategoryId: article.primaryCategoryId || '',
    categoryIds: [...article.categoryIds].sort(),
    tagIds: [...article.tagIds],
    authorId: article.authorId || '',
    featuredMediaId: article.featuredMediaId || '',
    seo: {
      title: article.seo.title || '',
      description: article.seo.description || '',
      canonical: article.seo.canonical || '',
      noindex: article.seo.noindex ?? true,
    },
    scheduledAt: article.scheduledAt || '',
    publishedAt: article.publishedAt || '',
    media: [...articleMedia]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((m) => ({
        id: m.id,
        filename: m.filename,
        title: m.title,
        altText: m.altText,
        caption: m.caption || '',
        credit: m.credit,
        licence: m.licence,
        humanReviewedAlt: Boolean(m.humanReviewedAlt),
      })),
    sources: [...articleSources]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => ({
        id: s.id,
        title: s.title,
        doi: s.doi || '',
        url: s.url,
        verificationStatus: s.verificationStatus,
        humanClaimVerified: Boolean(s.humanClaimVerified),
      })),
  });

  // Simple deterministic FNV-1a 32-bit hash encoded as hex + length
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fp-${(hash >>> 0).toString(16)}-${payload.length}`;
}

export interface RunArticleAuditParams {
  article: Article;
  allArticles: Article[];
  categories: Category[];
  tags: Tag[];
  media: MediaAsset[];
  sources: ScientificSource[];
  knowledgeLinks?: unknown[];
  integrations?: unknown[];
  aiConnected?: boolean;
  executedAt?: string;
}

type RawAuditFinding = Omit<
  AuditFinding,
  | 'ruleId'
  | 'origin'
  | 'blocksPublish'
  | 'quickFixAvailable'
  | 'aiFixEligible'
  | 'targetField'
>;

/**
 * Single canonical SEO + scientific editorial quality audit engine (Spec v5 §4).
 * Never fabricates external checks or treats field presence as unconditional "Complete".
 */
export function runArticleAudit(params: RunArticleAuditParams): AuditReport {
  const {
    article,
    allArticles,
    categories,
    tags,
    media,
    sources,
    aiConnected = false,
    executedAt = article.updatedAt || '2026-10-31T00:00:00.000Z',
  } = params;

  const articleMedia = media.filter((m) => m.id === article.featuredMediaId);
  const articleSources = sources.filter((s) => article.sourceIds.includes(s.id));
  const fingerprint = computeArticleFingerprint(article, articleMedia, articleSources);

  const findings: RawAuditFinding[] = [];

  // 1. content.title.present
  const trimmedTitle = (article.title || '').trim();
  const isUntitled =
    !trimmedTitle ||
    trimmedTitle.toLowerCase() === 'untitled scientific article' ||
    trimmedTitle.toLowerCase() === 'untitled article';
  findings.push({
    id: 'content.title.present',
    category: 'content',
    status: !isUntitled && trimmedTitle.length >= 8 ? 'pass' : 'error',
    title: 'Article Title (Sole Rendered H1)',
    description: 'Article must have a non-empty, meaningful headline that serves as the single page H1.',
    observed: trimmedTitle ? `"${trimmedTitle}" (${trimmedTitle.length} chars)` : '(Empty title)',
    recommendation:
      !isUntitled && trimmedTitle.length >= 8
        ? undefined
        : 'Enter a specific scientific headline (at least 8 characters).',
    fieldPath: 'title',
    focusElementId: 'article-title-h1-input',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: aiConnected,
    isPublicationBlocker: true,
  });

  // 2. content.h1.single
  const bodyH1Matches = article.bodyHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];
  findings.push({
    id: 'content.h1.single',
    category: 'content',
    status: bodyH1Matches.length === 0 ? 'pass' : 'error',
    title: 'Single H1 Heading Hierarchy Invariant',
    description:
      'Only the Article Title renders as <h1>. Manuscript body sections must use <h2> and <h3>.',
    observed:
      bodyH1Matches.length === 0
        ? '0 body <h1> tags found; Title is the sole H1'
        : `${bodyH1Matches.length} forbidden <h1> tag(s) detected inside body HTML`,
    recommendation:
      bodyH1Matches.length === 0
        ? undefined
        : 'Demote body <h1> headings to <h2> so the document outline has a single H1.',
    fieldPath: 'bodyHtml',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: bodyH1Matches.length > 0,
    quickFixLabel: 'Demote body H1 to H2',
    canSuggestWithAI: false,
    isPublicationBlocker: true,
  });

  // 3. content.headings.order
  const headingTagRegex = /<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch: RegExpExecArray | null;
  const levels: number[] = [];
  let emptyHeadings = 0;
  while ((headingMatch = headingTagRegex.exec(article.bodyHtml)) !== null) {
    levels.push(Number.parseInt(headingMatch[1], 10));
    const innerPlain = headingMatch[2].replace(/<[^>]+>/g, '').trim();
    if (!innerPlain) emptyHeadings += 1;
  }
  const startsWithH3BeforeH2 = levels.length > 0 && levels[0] === 3;
  const headingOrderOk = !startsWithH3BeforeH2 && emptyHeadings === 0;
  findings.push({
    id: 'content.headings.order',
    category: 'content',
    status: headingOrderOk ? 'pass' : 'warning',
    title: 'Body Section Heading Nesting (H2 / H3)',
    description: 'Subsections (H3) should nest under primary sections (H2), with no empty heading tags.',
    observed:
      levels.length === 0
        ? 'No H2/H3 subheadings in body'
        : `Heading sequence: ${levels.map((l) => `H${l}`).join(' → ')}${
            emptyHeadings > 0 ? ` (${emptyHeadings} empty)` : ''
          }`,
    recommendation: headingOrderOk
      ? undefined
      : 'Ensure the first body section uses H2 before introducing H3 subsections, and remove empty headings.',
    fieldPath: 'bodyHtml',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: aiConnected,
    isPublicationBlocker: false,
  });

  // 4. content.body.present
  const plainBody = article.bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isPlaceholderBody =
    plainBody ===
    'Enter or paste your scientific article manuscript here. Use H2 and H3 for section headings.';
  const bodyPresent = plainBody.length >= 40 && !isPlaceholderBody;
  findings.push({
    id: 'content.body.present',
    category: 'content',
    status: bodyPresent ? 'pass' : 'error',
    title: 'Manuscript Body Content Present',
    description: 'Article body must contain substantive non-whitespace scientific text before publishing.',
    observed: bodyPresent
      ? `${plainBody.length} characters of body text`
      : `Insufficient or placeholder body text (${plainBody.length} chars)`,
    recommendation: bodyPresent
      ? undefined
      : 'Write or paste the scientific article body into the editor canvas.',
    fieldPath: 'bodyHtml',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: true,
  });

  // 5. metadata.seo_title.present & 6. metadata.seo_title.length & 7. metadata.seo_title.duplicate
  const seoTitle = (article.seo?.title || '').trim();
  findings.push({
    id: 'metadata.seo_title.present',
    category: 'metadata',
    status: seoTitle.length > 0 ? 'pass' : 'warning',
    title: 'Explicit SEO Title Present',
    description: 'An explicit SEO title is recommended (otherwise falls back to Article Title template).',
    observed: seoTitle ? `"${seoTitle}"` : '(Empty — using fallback template)',
    recommendation:
      seoTitle.length > 0
        ? undefined
        : 'Populate an explicit SEO title (~50–65 characters advisory).',
    fieldPath: 'seo.title',
    inspectorTab: 'seo',
    focusElementId: 'inspector-seo-title',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: seoTitle.length === 0 && !isUntitled,
    quickFixLabel: 'Populate concise SEO title from headline',
    canSuggestWithAI: aiConnected,
    isPublicationBlocker: false,
  });

  if (seoTitle.length > 0) {
    const len = seoTitle.length;
    const lengthOk = len >= 30 && len <= 65;
    findings.push({
      id: 'metadata.seo_title.length',
      category: 'metadata',
      status: lengthOk ? 'pass' : 'warning',
      title: 'SEO Title Length (50–65 Chars Advisory)',
      description:
        len > 65
          ? 'May be truncated in search results. 50–65 characters is an editorial display guideline, not a hard Google ranking limit.'
          : len < 30
          ? 'SEO title is shorter than the 50–65 character editorial guideline.'
          : 'Within the 50–65 character editorial display window.',
      observed: `${len} / 65 advisory characters: "${seoTitle}"`,
      recommendation:
        len > 65
          ? 'Shorten the SEO title to ≤ 65 characters if you want to avoid ellipsis truncation in narrow SERP viewports, or retain if scientifically necessary.'
          : len < 30
          ? 'Consider adding key scientific context or "| ScientificRadar" suffix.'
          : undefined,
      fieldPath: 'seo.title',
      inspectorTab: 'seo',
      focusElementId: 'inspector-seo-title',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: len > 65,
      quickFixLabel: 'Trim "| ScientificRadar" suffix or condense to ≤ 65 chars',
      canSuggestWithAI: aiConnected,
      isPublicationBlocker: false,
    });

    const duplicateSeoTitleArt = allArticles.find(
      (a) =>
        a.id !== article.id &&
        (a.seo?.title || '').trim().toLowerCase() === seoTitle.toLowerCase()
    );
    findings.push({
      id: 'metadata.seo_title.duplicate',
      category: 'metadata',
      status: duplicateSeoTitleArt ? 'warning' : 'pass',
      title: 'Unique SEO Title Across Repository',
      description: 'Distinct articles should avoid identical SEO titles.',
      observed: duplicateSeoTitleArt
        ? `Duplicates SEO title of "${duplicateSeoTitleArt.title}" (${duplicateSeoTitleArt.locale.toUpperCase()})`
        : 'Unique across all local repository articles',
      recommendation: duplicateSeoTitleArt
        ? 'Differentiate the SEO title so each article has a distinct search snippet.'
        : undefined,
      fieldPath: 'seo.title',
      inspectorTab: 'seo',
      focusElementId: 'inspector-seo-title',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: false,
      canSuggestWithAI: aiConnected,
      isPublicationBlocker: false,
    });
  }

  // 8. metadata.description.present & 9. metadata.description.length & 10. metadata.description.duplicate
  const seoDesc = (article.seo?.description || '').trim();
  findings.push({
    id: 'metadata.description.present',
    category: 'metadata',
    status: seoDesc.length > 0 ? 'pass' : 'warning',
    title: 'Meta Description Present',
    description: 'Summarizes key research findings for search result snippets and social cards.',
    observed: seoDesc ? `"${seoDesc}"` : '(Empty meta description)',
    recommendation:
      seoDesc.length > 0
        ? undefined
        : 'Add a concise meta description (approx. 110–160 characters advisory) summarizing the study.',
    fieldPath: 'seo.description',
    inspectorTab: 'seo',
    focusElementId: 'inspector-seo-desc',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: seoDesc.length === 0 && article.summary.trim().length > 0,
    quickFixLabel: 'Copy from article summary/dek (trimmed to ≤155 chars)',
    canSuggestWithAI: aiConnected,
    isPublicationBlocker: false,
  });

  if (seoDesc.length > 0) {
    const descLen = seoDesc.length;
    // Per Spec v5 §4.3 & Scenario A: 116 / 160 advisory is acceptable and passes if descriptive and not duplicated!
    const descLengthOk = descLen >= 70 && descLen <= 160;
    findings.push({
      id: 'metadata.description.length',
      category: 'metadata',
      status: descLengthOk ? 'pass' : 'warning',
      title: 'Meta Description Length (Up to 160 Chars Advisory)',
      description:
        'Editorial guidance recommends a descriptive summary up to ~160 characters (not a forced character fill).',
      observed: `${descLen} / 160 advisory characters`,
      recommendation:
        descLen > 160
          ? 'Condense meta description to ≤ 160 characters to reduce snippet truncation risk.'
          : descLen < 70
          ? 'Expand meta description to at least 70 characters to provide meaningful scientific context.'
          : undefined,
      fieldPath: 'seo.description',
      inspectorTab: 'seo',
      focusElementId: 'inspector-seo-desc',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: descLen > 160,
      quickFixLabel: 'Trim meta description to ≤ 155 characters',
      canSuggestWithAI: aiConnected,
      isPublicationBlocker: false,
    });

    const duplicateDescArt = allArticles.find(
      (a) =>
        a.id !== article.id &&
        (a.seo?.description || '').trim().toLowerCase() === seoDesc.toLowerCase()
    );
    findings.push({
      id: 'metadata.description.duplicate',
      category: 'metadata',
      status: duplicateDescArt ? 'warning' : 'pass',
      title: 'Unique Meta Description',
      description: 'Meta description should not be duplicated across multiple articles.',
      observed: duplicateDescArt
        ? `Duplicates description of "${duplicateDescArt.title}"`
        : 'Unique across all local repository articles',
      recommendation: duplicateDescArt
        ? 'Write a distinct summary tailored to this manuscript.'
        : undefined,
      fieldPath: 'seo.description',
      inspectorTab: 'seo',
      focusElementId: 'inspector-seo-desc',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: false,
      canSuggestWithAI: aiConnected,
      isPublicationBlocker: false,
    });
  }

  // 11. metadata.slug.valid
  const rawSlug = (article.slug || '').trim();
  const normalizedSlug = slugify(rawSlug);
  const slugCollision = allArticles.find(
    (a) => a.id !== article.id && a.locale === article.locale && a.slug === rawSlug
  );
  const slugValid =
    rawSlug.length > 0 &&
    rawSlug === normalizedSlug &&
    rawSlug !== 'untitled-article' &&
    !slugCollision;
  findings.push({
    id: 'metadata.slug.valid',
    category: 'metadata',
    status: slugValid ? 'pass' : 'error',
    title: 'Localized URL Slug Validity & Uniqueness',
    description: 'Slug must be non-empty, URL-safe, and unique within its content locale.',
    observed: slugCollision
      ? `Collision: "/${rawSlug}" already used by "${slugCollision.title}" (${article.locale.toUpperCase()})`
      : `/${rawSlug} (${article.locale.toUpperCase()})`,
    recommendation: slugValid
      ? undefined
      : 'Normalize slug to lowercase alphanumeric hyphens and resolve any locale collision.',
    fieldPath: 'slug',
    focusElementId: 'article-slug-input',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: !slugValid && !isUntitled,
    quickFixLabel: 'Generate unique URL-safe slug',
    canSuggestWithAI: false,
    isPublicationBlocker: true,
  });

  // 12. taxonomy.primary_category.present
  const primaryCat = categories.find(
    (c) => c.id === article.primaryCategoryId && !c.parentId
  );
  findings.push({
    id: 'taxonomy.primary_category.present',
    category: 'taxonomy',
    status: primaryCat ? 'pass' : 'error',
    title: 'Primary Scientific Discipline Category',
    description: 'One valid top-level scientific discipline is required for publication.',
    observed: primaryCat
      ? `${primaryCat.name} (${primaryCat.id})`
      : `Invalid or missing primary category (${article.primaryCategoryId || 'none'})`,
    recommendation: primaryCat
      ? undefined
      : 'Select a valid top-level primary discipline in the Taxonomy inspector.',
    fieldPath: 'primaryCategoryId',
    inspectorTab: 'metadata',
    focusElementId: 'inspector-primary-cat',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: true,
  });

  // 13. taxonomy.subcategory.valid
  const selectedSubcats = article.categoryIds
    .filter((id) => id !== article.primaryCategoryId)
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => Boolean(c));
  const orphanedIds = article.categoryIds.filter(
    (id) => !categories.some((c) => c.id === id)
  );
  const mismatchedSubcats = selectedSubcats.filter(
    (c) => c.parentId !== article.primaryCategoryId
  );
  const subcatStatus: FindingStatus =
    orphanedIds.length > 0 || mismatchedSubcats.length > 0
      ? 'error'
      : selectedSubcats.length === 0
      ? 'warning'
      : 'pass';
  findings.push({
    id: 'taxonomy.subcategory.valid',
    category: 'taxonomy',
    status: subcatStatus,
    title: 'Subcategory Alignment with Primary Discipline',
    description:
      'Selected subcategories must belong to the chosen primary discipline. Missing subcategory is an optional advisory.',
    observed:
      mismatchedSubcats.length > 0
        ? `Mismatched subcategory: ${mismatchedSubcats.map((c) => c.name).join(', ')} does not belong to ${primaryCat?.name || 'primary category'}`
        : orphanedIds.length > 0
        ? `Orphaned category ID(s): ${orphanedIds.join(', ')}`
        : selectedSubcats.length === 0
        ? '0 subcategories selected (optional)'
        : `Valid children of ${primaryCat?.name}: ${selectedSubcats.map((c) => c.name).join(', ')}`,
    recommendation:
      mismatchedSubcats.length > 0 || orphanedIds.length > 0
        ? 'Remove subcategories that belong to a different parent discipline.'
        : selectedSubcats.length === 0
        ? 'Consider selecting 1–2 relevant subcategories under the primary discipline.'
        : undefined,
    fieldPath: 'categoryIds',
    inspectorTab: 'metadata',
    focusElementId: 'inspector-primary-cat',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: mismatchedSubcats.length > 0 || orphanedIds.length > 0,
    quickFixLabel: 'Remove unrelated/orphaned subcategories',
    canSuggestWithAI: false,
    isPublicationBlocker: mismatchedSubcats.length > 0 || orphanedIds.length > 0,
  });

  // 14. taxonomy.tags.count & 15. taxonomy.tags.duplicate
  const resolvedTags = article.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => Boolean(t));
  const tagCount = article.tagIds.length;
  const tagStatus: FindingStatus =
    tagCount > MAX_EDITORIAL_TAGS
      ? 'error'
      : tagCount >= 3 && tagCount <= MAX_EDITORIAL_TAGS
      ? 'pass'
      : 'warning';
  findings.push({
    id: 'taxonomy.tags.count',
    category: 'taxonomy',
    status: tagStatus,
    title: 'Editorial Tag Count Policy (3–6 Recommended, Max 6)',
    description:
      tagCount === 0
        ? 'No tags selected. 3–6 tags is a ScientificRadar house taxonomy guideline (not a Google ranking rule).'
        : tagCount < 3
        ? 'Consider additional relevant tags (3–6 house guideline; draft & publish still permitted).'
        : tagCount > MAX_EDITORIAL_TAGS
        ? `Exceeds maximum of ${MAX_EDITORIAL_TAGS} tags allowed by ScientificRadar editorial policy.`
        : 'Within the 3–6 tag ScientificRadar editorial guideline.',
    observed: `${tagCount} tag(s) selected${
      resolvedTags.length > 0 ? `: ${resolvedTags.map((t) => t.name).join(', ')}` : ''
    }`,
    recommendation:
      tagCount > MAX_EDITORIAL_TAGS
        ? `Remove ${tagCount - MAX_EDITORIAL_TAGS} tag(s) to comply with the 6-tag maximum.`
        : tagCount < 3
        ? 'Select or suggest up to 3–6 relevant topic tags.'
        : undefined,
    fieldPath: 'tagIds',
    inspectorTab: 'metadata',
    focusElementId: 'inspector-new-tag-input',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: tagCount > MAX_EDITORIAL_TAGS || tagCount < 3,
    quickFixLabel:
      tagCount > MAX_EDITORIAL_TAGS
        ? `Trim to first ${MAX_EDITORIAL_TAGS} tags`
        : 'Add matched taxonomy tags from manuscript text (up to 4)',
    canSuggestWithAI: aiConnected,
    isPublicationBlocker: tagCount > MAX_EDITORIAL_TAGS,
  });

  const uniqueTagIds = new Set(article.tagIds);
  const normalizedTagNames = new Set(resolvedTags.map((t) => t.name.toLowerCase()));
  const hasDuplicateTags =
    uniqueTagIds.size !== article.tagIds.length ||
    normalizedTagNames.size !== resolvedTags.length;
  findings.push({
    id: 'taxonomy.tags.duplicate',
    category: 'taxonomy',
    status: hasDuplicateTags ? 'warning' : 'pass',
    title: 'Tag Deduplication & Alias Check',
    description: 'Duplicate tag IDs or case-insensitive collisions should be normalized.',
    observed: hasDuplicateTags
      ? 'Duplicate tag references detected'
      : 'No duplicate or case-colliding tags on article',
    recommendation: hasDuplicateTags ? 'Deduplicate article tag list.' : undefined,
    fieldPath: 'tagIds',
    inspectorTab: 'metadata',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: hasDuplicateTags,
    quickFixLabel: 'Deduplicate tags',
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  // 16. links.internal.target & 17. links.external.syntax & 18. links.external.http
  const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  const internalHrefs: string[] = [];
  const externalHrefs: string[] = [];
  const unsafeHrefs: string[] = [];
  while ((linkMatch = hrefRegex.exec(article.bodyHtml)) !== null) {
    const href = linkMatch[1].trim();
    const safety = validateSafeUrl(href);
    if (!safety.valid) {
      unsafeHrefs.push(href);
    } else if (href.startsWith('/')) {
      internalHrefs.push(href);
    } else {
      externalHrefs.push(href);
    }
  }
  // Also check source URLs for unsafe schemes
  for (const src of articleSources) {
    const check = validateSafeUrl(src.url);
    if (!check.valid) {
      unsafeHrefs.push(src.url);
    } else {
      externalHrefs.push(src.url);
    }
  }

  const brokenInternalHrefs = internalHrefs.filter((href) => {
    const previewMatch = /^\/preview\/articles\/([^/?#]+)/.exec(href);
    if (previewMatch) {
      const targetArt = allArticles.find((a) => a.id === previewMatch[1]);
      return !targetArt;
    }
    return false;
  });

  findings.push({
    id: 'links.internal.target',
    category: 'links',
    status: brokenInternalHrefs.length === 0 ? 'pass' : 'error',
    title: 'Internal ScientificRadar Link Targets',
    description: 'Internal article links must resolve to existing records in the repository.',
    observed:
      brokenInternalHrefs.length > 0
        ? `Dangling internal link(s): ${brokenInternalHrefs.join(', ')}`
        : `${internalHrefs.length} internal link(s) verified in local store`,
    recommendation:
      brokenInternalHrefs.length > 0
        ? 'Update or remove broken internal article links.'
        : undefined,
    fieldPath: 'bodyHtml',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: brokenInternalHrefs.length > 0,
  });

  findings.push({
    id: 'links.external.syntax',
    category: 'links',
    status: unsafeHrefs.length === 0 ? 'pass' : 'error',
    title: 'External URL Protocol & Syntax Safety',
    description: 'Links must use safe HTTPS/HTTP schemes; javascript: and data: URLs are prohibited.',
    observed:
      unsafeHrefs.length > 0
        ? `Unsafe/malformed URL(s): ${unsafeHrefs.join(', ')}`
        : `${externalHrefs.length} external link(s) passed local syntax check`,
    recommendation:
      unsafeHrefs.length > 0
        ? 'Replace unsafe or malformed URLs with valid https:// destinations.'
        : undefined,
    fieldPath: 'bodyHtml',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: unsafeHrefs.length > 0,
  });

  findings.push({
    id: 'links.external.http',
    category: 'links',
    status: 'unverified',
    title: 'Remote HTTP Reachability & Redirect Chain Check',
    description:
      'Live network crawling of external URLs is disabled in the isolated offline prototype.',
    observed: `${externalHrefs.length} external URL(s) queued — network check not executed`,
    recommendation: 'External HTTP status verification will run when server outbound crawler is enabled in P1.',
    checkOrigin: 'external',
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  // 19. images.featured.present, 20. images.alt.present, 21. images.alt.human_review
  const featuredAsset = articleMedia[0];
  findings.push({
    id: 'images.featured.present',
    category: 'images',
    status: featuredAsset ? 'pass' : 'warning',
    title: 'Featured Scientific Figure or Lead Image',
    description: 'Attaching a primary figure or lead visual improves article presentation and social cards.',
    observed: featuredAsset
      ? `${featuredAsset.title} (${featuredAsset.filename})`
      : 'No featured figure selected',
    recommendation: featuredAsset
      ? undefined
      : 'Select a featured scientific figure or photograph in the Figure tab.',
    fieldPath: 'featuredMediaId',
    inspectorTab: 'media',
    focusElementId: 'inspector-featured-media',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  if (featuredAsset) {
    const altText = (featuredAsset.altText || '').trim();
    const altPresent = altText.length >= 10;
    findings.push({
      id: 'images.alt.present',
      category: 'images',
      status: altPresent ? 'pass' : 'warning',
      title: 'Featured Figure Alt Text Present',
      description: 'Alt text is present and meets minimum descriptive length (distinct from human scientific review).',
      observed: altPresent
        ? `"${altText.slice(0, 90)}${altText.length > 90 ? '…' : ''}" (${altText.length} chars)`
        : '(Empty or < 10 chars alt text)',
      recommendation: altPresent
        ? undefined
        : 'Provide descriptive alt text explaining axes, variables, and visible trends.',
      fieldPath: 'media.altText',
      inspectorTab: 'media',
      focusElementId: 'inspector-media-alt',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: !altPresent,
      quickFixLabel: 'Populate descriptive draft alt text from figure caption/title',
      canSuggestWithAI: aiConnected,
      isPublicationBlocker: false,
    });

    const isHumanReviewed = Boolean(featuredAsset.humanReviewedAlt) && altPresent;
    findings.push({
      id: 'images.alt.human_review',
      category: 'images',
      status: isHumanReviewed ? 'pass' : 'unverified',
      title: 'Scientific Figure Alt Text & Axes Human Review',
      description:
        'Alt Text Present ≠ Scientifically Accurate. Requires an explicit human editor sign-off that axes, units, and labels are accurately described.',
      observed: isHumanReviewed
        ? 'Human editor confirmed scientific accuracy of figure alt text'
        : 'Awaiting explicit human editor sign-off in Figure inspector',
      recommendation: isHumanReviewed
        ? undefined
        : 'Review the figure axes/units in the Figure inspector and check "Mark Alt Text Human-Verified".',
      fieldPath: 'media.humanReviewedAlt',
      inspectorTab: 'media',
      focusElementId: 'inspector-media-alt',
      checkOrigin: 'local',
      verifiedAt: isHumanReviewed ? executedAt : undefined,
      canQuickFix: false,
      canSuggestWithAI: false,
      isPublicationBlocker: false,
    });
  }

  // 22. integrity.sources.present, 23. integrity.doi.syntax, 24. integrity.doi.registered, 25. integrity.claim_supported
  findings.push({
    id: 'integrity.sources.present',
    category: 'scientific_integrity',
    status: articleSources.length > 0 ? 'pass' : 'warning',
    title: 'Primary Scientific Sources Linked',
    description: 'Research reporting should reference at least one peer-reviewed citation or primary dataset.',
    observed: `${articleSources.length} source record(s) linked`,
    recommendation:
      articleSources.length > 0
        ? undefined
        : 'Link an existing source or add a primary citation with DOI in the Sources inspector.',
    fieldPath: 'sourceIds',
    inspectorTab: 'sources',
    focusElementId: 'attach-existing-source',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  if (articleSources.length > 0) {
    const invalidDoiSources = articleSources.filter(
      (s) => !s.doi || !validateDoiSyntax(s.doi).validSyntax
    );
    findings.push({
      id: 'integrity.doi.syntax',
      category: 'scientific_integrity',
      status: invalidDoiSources.length === 0 ? 'pass' : 'warning',
      title: 'Citation DOI Syntax Format (10.xxxx/...)',
      description:
        'Local syntax validation of attached DOIs. Note: DOI Syntax Valid ≠ DOI Registered in Crossref.',
      observed:
        invalidDoiSources.length === 0
          ? `All ${articleSources.length} linked citation(s) have valid 10.xxxx/... DOI syntax`
          : `Invalid or missing DOI syntax on: ${invalidDoiSources
              .map((s) => `${s.title.slice(0, 32)}… (${s.doi || 'no DOI'})`)
              .join('; ')}`,
      recommendation:
        invalidDoiSources.length === 0
          ? undefined
          : 'Correct malformed DOI strings in the Sources tab (expected 10.xxxx/suffix).',
      fieldPath: 'sourceIds',
      inspectorTab: 'sources',
      focusElementId: 'attach-existing-source',
      checkOrigin: 'local',
      verifiedAt: executedAt,
      canQuickFix: false,
      canSuggestWithAI: false,
      isPublicationBlocker: false,
    });

    findings.push({
      id: 'integrity.doi.registered',
      category: 'scientific_integrity',
      status: 'unverified',
      title: 'External Crossref / DOI Registry Resolution',
      description:
        'Verifying that a DOI resolves in Crossref/DataCite and matches article metadata requires external network access.',
      observed: 'External DOI registry check not executed in offline demo',
      recommendation: 'Will verify against Crossref API when P1 server integration is enabled.',
      checkOrigin: 'external',
      canQuickFix: false,
      canSuggestWithAI: false,
      isPublicationBlocker: false,
    });

    const allClaimsHumanVerified = articleSources.every((s) => Boolean(s.humanClaimVerified));
    findings.push({
      id: 'integrity.claim_supported',
      category: 'scientific_integrity',
      status: allClaimsHumanVerified ? 'pass' : 'unverified',
      title: 'Claim-to-Source Scientific Support Sign-Off',
      description:
        'Only a human editor or peer reviewer can certify that the cited paper supports the manuscript’s quantitative claims. AI never self-certifies.',
      observed: allClaimsHumanVerified
        ? 'Human reviewer verified claim-to-source alignment for all linked citations'
        : 'Awaiting human editor/reviewer claim verification sign-off',
      recommendation: allClaimsHumanVerified
        ? undefined
        : 'Verify quantitative claims against the primary paper and mark source as Human-Verified in the Sources tab.',
      fieldPath: 'sourceIds',
      inspectorTab: 'sources',
      checkOrigin: 'local',
      verifiedAt: allClaimsHumanVerified ? executedAt : undefined,
      canQuickFix: false,
      canSuggestWithAI: false,
      isPublicationBlocker: false,
    });
  }

  // 26. structured_data.dates & 27. metadata.robots.indexing & 28. search_console.indexed
  const createdValid = !Number.isNaN(new Date(article.createdAt).getTime());
  const updatedValid = !Number.isNaN(new Date(article.updatedAt).getTime());
  const pubDateFutureError =
    article.status === 'published' &&
    article.publishedAt &&
    new Date(article.publishedAt).getTime() > Date.now() + 60_000;
  findings.push({
    id: 'structured_data.dates',
    category: 'structured_data',
    status: createdValid && updatedValid && !pubDateFutureError ? 'pass' : 'error',
    title: 'ISO 8601 Publication & Modification Timestamps',
    description:
      'Timestamps must be valid UTC ISO 8601 instants, and historical publishedAt dates cannot be set in the future.',
    observed: pubDateFutureError
      ? `Published timestamp (${article.publishedAt}) is in the future`
      : `updatedAt: ${article.updatedAt}${
          article.publishedAt ? ` · publishedAt: ${article.publishedAt}` : ''
        }`,
    recommendation:
      createdValid && updatedValid && !pubDateFutureError
        ? undefined
        : 'Ensure timestamps are valid UTC ISO strings and use Scheduled status for future dates.',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: Boolean(pubDateFutureError) || !createdValid || !updatedValid,
  });

  findings.push({
    id: 'metadata.robots.indexing',
    category: 'technical',
    status: article.seo.noindex !== false ? 'pass' : 'error',
    title: 'Isolated Prototype Noindex Safety Guard',
    description:
      'In this isolated prototype, all preview and demo routes must remain noindex so test records are never indexed as live scientificradar.com pages.',
    observed:
      article.seo.noindex !== false
        ? 'noindex=true enforced (Isolated Demo Safety Guard active)'
        : 'Unexpected indexable flag in demo mode',
    checkOrigin: 'local',
    verifiedAt: executedAt,
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  findings.push({
    id: 'search_console.indexed',
    category: 'technical',
    status: 'unverified',
    title: 'Google Search Console Live Indexing & Canonical Status',
    description:
      'SEO Local Passed ≠ Google Indexed. Live URL Inspection requires a connected Google Search Console property and public site deployment.',
    observed: 'Google Search Console not connected; live site untouched',
    recommendation: 'Connect Google Search Console in a future authorized production phase.',
    checkOrigin: 'external',
    canQuickFix: false,
    canSuggestWithAI: false,
    isPublicationBlocker: false,
  });

  const normalizedFindings: AuditFinding[] = findings.map((f) => {
    const mappedTab =
      f.inspectorTab === 'metadata'
        ? 'taxonomy'
        : f.inspectorTab === 'media'
        ? 'figures'
        : f.inspectorTab === 'versions'
        ? 'revisions'
        : f.inspectorTab;
    const isHumanSignOff =
      f.id === 'images.alt.quality' || f.id === 'integrity.claim_supported';
    const origin: AuditFinding['origin'] =
      f.checkOrigin === 'external'
        ? 'external_unverified'
        : isHumanSignOff && f.status === 'unverified'
        ? 'human_required'
        : 'local_deterministic';

    return {
      ...f,
      ruleId: f.id,
      inspectorTab: mappedTab,
      targetField: f.focusElementId || f.fieldPath,
      origin,
      quickFixAvailable: f.canQuickFix,
      aiFixEligible: f.canSuggestWithAI,
      blocksPublish: f.isPublicationBlocker,
    };
  });

  const counts: Record<FindingStatus, number> = {
    pass: 0,
    warning: 0,
    error: 0,
    unverified: 0,
  };
  let blockerCount = 0;

  for (const f of normalizedFindings) {
    counts[f.status] += 1;
    if (f.isPublicationBlocker && (f.status === 'error' || f.status === 'warning')) {
      blockerCount += 1;
    }
  }

  let overallLabel = 'Local checks passed · external verification pending';
  let overallTone: AuditReport['overallTone'] = 'emerald';

  if (counts.error > 0) {
    overallLabel = `${counts.error} error${counts.error > 1 ? 's' : ''}${
      counts.warning > 0 ? ` · ${counts.warning} warning${counts.warning > 1 ? 's' : ''}` : ''
    }`;
    overallTone = 'red';
  } else if (counts.warning > 0) {
    overallLabel = `${counts.warning} advisory warning${counts.warning > 1 ? 's' : ''} · ${
      counts.unverified
    } unverified`;
    overallTone = 'amber';
  } else if (counts.unverified > 0) {
    overallLabel = `Local checks passed (${counts.pass}) · ${counts.unverified} external/human unverified`;
    overallTone = 'emerald';
  }

  return {
    articleId: article.id,
    articleFingerprint: fingerprint,
    executedAt,
    generatedAt: executedAt,
    findings: normalizedFindings,
    counts,
    blockerCount,
    checkedScope: ['local'],
    overallLabel,
    overallTone,
  };
}

function finalizeProposal(
  raw: Omit<FixProposal, 'ruleId' | 'baseFingerprint' | 'targetPath' | 'rationale'> | null
): FixProposal | null {
  if (!raw) return null;
  return {
    ...raw,
    ruleId: raw.findingId,
    baseFingerprint: raw.baselineFingerprint,
    targetPath: raw.path,
    rationale: raw.explanation,
  };
}

/**
 * Generates a deterministic local FixProposal for a specific finding ID when canQuickFix is true.
 * Never fabricates scientific facts or claims AI generation.
 */
export function buildQuickFixProposal(
  paramsOrArticle:
    | {
        findingId: string;
        article: Article;
        allArticles?: Article[];
        categories?: Category[];
        tags?: Tag[];
        media?: MediaAsset[];
        sources?: ScientificSource[];
      }
    | Article,
  findingIdArg?: string,
  categoriesArg?: Category[]
): FixProposal | null {
  const isDirectArticle = 'title' in paramsOrArticle && 'slug' in paramsOrArticle;
  const findingId = isDirectArticle ? findingIdArg || '' : paramsOrArticle.findingId;
  const article = isDirectArticle ? paramsOrArticle : paramsOrArticle.article;
  const allArticles = isDirectArticle ? [article] : paramsOrArticle.allArticles || [article];
  const categories = isDirectArticle ? categoriesArg || [] : paramsOrArticle.categories || [];
  const tags = isDirectArticle ? [] : paramsOrArticle.tags || [];
  const media = isDirectArticle ? [] : paramsOrArticle.media || [];
  const sources = isDirectArticle ? [] : paramsOrArticle.sources || [];

  const articleMedia = media.filter((m) => m.id === article.featuredMediaId);
  const articleSources = sources.filter((s) => article.sourceIds.includes(s.id));
  const fingerprint = computeArticleFingerprint(article, articleMedia, articleSources);

  if (findingId === 'content.h1.single' || findingId === 'heading.body_no_h1') {
    const sanitized = sanitizeAndDemoteBodyH1(article.bodyHtml);
    if (sanitized.demotedH1Count === 0) return null;
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'bodyHtml',
      label: 'Demote body <h1> tags to <h2>',
      before: 'Contains <h1> in body HTML',
      after: sanitized.sanitizedHtml,
      explanation:
        'Converts body <h1> elements into <h2> section headings so the Article Title remains the single rendered H1.',
      risk: 'mechanical',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (
    findingId === 'metadata.seo_title.present' ||
    findingId === 'metadata.seo_title.length' ||
    findingId === 'seo.title.length'
  ) {
    const current = (article.seo?.title || '').trim();
    const baseHeadline = article.title.trim();
    const withSuffix = `${baseHeadline} | ScientificRadar`;
    let candidate = withSuffix;
    if (candidate.length > 65) {
      if (baseHeadline.length <= 65) {
        candidate = baseHeadline;
      } else {
        candidate = `${baseHeadline.slice(0, 62).trim()}...`;
      }
    }
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'seo.title',
      label:
        findingId === 'metadata.seo_title.length' || findingId === 'seo.title.length'
          ? `Shorten SEO title to ${candidate.length}/65 chars`
          : 'Populate concise SEO title',
      before: current || '(Empty)',
      after: candidate,
      explanation:
        'Adjusts the search snippet title to fit within the 50–65 character advisory window without altering the article H1.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (
    findingId === 'metadata.description.present' ||
    findingId === 'metadata.description.length' ||
    findingId === 'seo.description.length'
  ) {
    const current = (article.seo?.description || '').trim();
    const sourceText = current.length > 160 ? current : article.summary.trim();
    if (!sourceText) return null;
    const candidate =
      sourceText.length > 155 ? `${sourceText.slice(0, 152).trim()}...` : sourceText;
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'seo.description',
      label: 'Set meta description within ≤160 char advisory window',
      before: current || '(Empty)',
      after: candidate,
      explanation: 'Uses the author’s summary/dek trimmed cleanly to ≤155 characters.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (findingId === 'metadata.slug.valid') {
    const current = article.slug;
    const base = slugify(article.slug || article.title) || 'scientific-article';
    const sameLocale = allArticles.filter(
      (a) => a.locale === article.locale && a.id !== article.id
    );
    const used = new Set(sameLocale.map((a) => a.slug));
    let candidate = base;
    let counter = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'slug',
      label: 'Normalize unique URL slug',
      before: current || '(Empty)',
      after: candidate,
      explanation: 'Normalizes slug characters and resolves any same-locale URL collision.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (findingId === 'taxonomy.subcategory.valid') {
    const validIds = article.categoryIds.filter((id) => {
      if (id === article.primaryCategoryId) return true;
      const cat = categories.find((c) => c.id === id);
      return Boolean(cat && cat.parentId === article.primaryCategoryId);
    });
    const nextIds = Array.from(
      new Set(article.primaryCategoryId ? [article.primaryCategoryId, ...validIds] : validIds)
    );
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'categoryIds',
      label: 'Reconcile subcategories with primary discipline',
      before: article.categoryIds.join(', '),
      after: nextIds.join(', '),
      explanation:
        'Removes subcategory selections that belong to a different parent discipline category.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (findingId === 'taxonomy.tags.count' || findingId === 'taxonomy.tags.duplicate') {
    const uniqueCurrent = Array.from(new Set(article.tagIds));
    if (uniqueCurrent.length > MAX_EDITORIAL_TAGS) {
      const trimmed = uniqueCurrent.slice(0, MAX_EDITORIAL_TAGS);
      return finalizeProposal({
        findingId,
        articleId: article.id,
        baselineFingerprint: fingerprint,
        path: 'tagIds',
        label: `Trim tags to ${MAX_EDITORIAL_TAGS} maximum`,
        before: uniqueCurrent.join(', '),
        after: trimmed.join(', '),
        explanation: `Enforces the maximum of ${MAX_EDITORIAL_TAGS} taxonomy tags per article.`,
        risk: 'metadata',
        source: 'local_rule',
        requiresHumanApproval: true,
      });
    }

    if (findingId === 'taxonomy.tags.duplicate') {
      return finalizeProposal({
        findingId,
        articleId: article.id,
        baselineFingerprint: fingerprint,
        path: 'tagIds',
        label: 'Remove duplicate tag references',
        before: article.tagIds.join(', '),
        after: uniqueCurrent.join(', '),
        explanation: 'Normalizes duplicate tag IDs.',
        risk: 'mechanical',
        source: 'local_rule',
        requiresHumanApproval: true,
      });
    }

    const haystack = `${article.title} ${article.summary} ${article.bodyHtml}`.toLowerCase();
    const matched = tags
      .filter(
        (t) =>
          !uniqueCurrent.includes(t.id) &&
          haystack.includes(t.name.toLowerCase().split(' ')[0])
      )
      .map((t) => t.id);
    const combined = Array.from(new Set([...uniqueCurrent, ...matched])).slice(
      0,
      Math.min(4, MAX_EDITORIAL_TAGS)
    );
    if (combined.length <= uniqueCurrent.length) {
      const fallback = Array.from(
        new Set([...uniqueCurrent, ...tags.slice(0, 3).map((t) => t.id)])
      ).slice(0, 3);
      return finalizeProposal({
        findingId,
        articleId: article.id,
        baselineFingerprint: fingerprint,
        path: 'tagIds',
        label: 'Assign 3 relevant house taxonomy tags',
        before: uniqueCurrent.join(', ') || '(0 tags)',
        after: fallback.join(', '),
        explanation: 'Adds initial taxonomy tags within the 3–6 ScientificRadar guideline.',
        risk: 'metadata',
        source: 'local_rule',
        requiresHumanApproval: true,
      });
    }
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'tagIds',
      label: 'Add matched taxonomy tags (3–6 house guideline)',
      before: uniqueCurrent.join(', ') || '(0 tags)',
      after: combined.join(', '),
      explanation: 'Matches relevant topic tags from the manuscript text without exceeding 6 tags.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  if (findingId === 'images.alt.present' && articleMedia[0]) {
    const fig = articleMedia[0];
    const candidate = `${fig.title} — ${
      fig.caption || 'Scientific figure illustrating experimental findings in this manuscript.'
    }`;
    return finalizeProposal({
      findingId,
      articleId: article.id,
      baselineFingerprint: fingerprint,
      path: 'media.altText',
      label: `Populate draft alt text for ${fig.filename}`,
      before: fig.altText || '(Empty)',
      after: candidate,
      explanation:
        'Populates descriptive alt text from the figure title and caption. Human editor sign-off remains separate.',
      risk: 'metadata',
      source: 'local_rule',
      requiresHumanApproval: true,
    });
  }

  return null;
}
