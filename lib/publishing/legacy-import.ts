import type {
  Article,
  Category,
  LegacyArticleProvenance,
  Locale,
  Tag,
} from '../types';
import { sanitizeAndDemoteBodyH1, slugify } from '../editorial-rules';
import { sanitizeCanonicalBodyHtml, stripHtmlTags } from './web-contract-v1';

/**
 * M3 — Legacy Content Migration Preparation Module
 * Accepts verified legacy article exports (when supplied by an operator) and performs
 * a deterministic, reversible dry-run or staged draft import into Studio without
 * touching any live external website, database, or DNS.
 */

export interface LegacyExportArticleRecord {
  legacyId: string;
  legacyUrlPath: string;
  sourceSystem: string;
  locale: Locale;
  title: string;
  slug?: string;
  dek?: string;
  summary?: string;
  bodyHtml: string;
  categorySlug?: string;
  categoryName?: string;
  tagNames?: string[];
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface LegacyImportConflict {
  legacyId: string;
  code:
    | 'DUPLICATE_LEGACY_ID'
    | 'SLUG_COLLISION_IN_LOCALE'
    | 'MISSING_TITLE_OR_BODY'
    | 'UNMAPPED_CATEGORY';
  severity: 'error' | 'warning';
  message: string;
  existingArticleId?: string;
}

export interface LegacyRedirectMapping {
  legacyId: string;
  fromLegacyPath: string;
  toCanonicalWebPath: string;
  locale: Locale;
  statusCode: 301 | 308;
}

export interface LegacyImportDryRunResult {
  executedAt: string;
  sourceBatchCount: number;
  importableCount: number;
  blockedCount: number;
  warningCount: number;
  stagedArticles: Article[];
  redirectMappings: LegacyRedirectMapping[];
  conflicts: LegacyImportConflict[];
}

export function prepareLegacyArticlesImportDryRun(params: {
  legacyRecords: LegacyExportArticleRecord[];
  existingArticles: Article[];
  categories: Category[];
  tags: Tag[];
  executedAt?: string;
}): LegacyImportDryRunResult {
  const {
    legacyRecords,
    existingArticles,
    categories,
    tags,
    executedAt = '2026-11-03T12:00:00.000Z',
  } = params;

  const stagedArticles: Article[] = [];
  const redirectMappings: LegacyRedirectMapping[] = [];
  const conflicts: LegacyImportConflict[] = [];

  const existingLegacyIds = new Map<string, string>();
  const usedLocaleSlugs = new Map<string, string>();

  for (const existing of existingArticles) {
    usedLocaleSlugs.set(`${existing.locale}:${existing.slug}`, existing.id);
    if (existing.legacyProvenance?.legacyId) {
      existingLegacyIds.set(existing.legacyProvenance.legacyId, existing.id);
    }
  }

  for (const record of legacyRecords) {
    const cleanTitle = stripHtmlTags(record.title || '');
    const sanitizedBody = sanitizeCanonicalBodyHtml(
      sanitizeAndDemoteBodyH1(record.bodyHtml || '').sanitizedHtml
    );
    const plainBody = stripHtmlTags(sanitizedBody);

    if (!cleanTitle || !plainBody) {
      conflicts.push({
        legacyId: record.legacyId,
        code: 'MISSING_TITLE_OR_BODY',
        severity: 'error',
        message: `Legacy record "${record.legacyId}" is missing a valid title or readable body text.`,
      });
      continue;
    }

    const existingByLegacyId = existingLegacyIds.get(record.legacyId);
    if (existingByLegacyId) {
      conflicts.push({
        legacyId: record.legacyId,
        code: 'DUPLICATE_LEGACY_ID',
        severity: 'error',
        message: `Legacy record "${record.legacyId}" was already imported into Studio article "${existingByLegacyId}".`,
        existingArticleId: existingByLegacyId,
      });
      continue;
    }

    const candidateSlug = slugify(record.slug || cleanTitle) || `legacy-${slugify(record.legacyId)}`;
    const localeSlugKey = `${record.locale}:${candidateSlug}`;
    const collidingArticleId = usedLocaleSlugs.get(localeSlugKey);
    if (collidingArticleId) {
      conflicts.push({
        legacyId: record.legacyId,
        code: 'SLUG_COLLISION_IN_LOCALE',
        severity: 'error',
        message: `Slug "/${candidateSlug}" in locale "${record.locale}" collides with existing article "${collidingArticleId}".`,
        existingArticleId: collidingArticleId,
      });
      continue;
    }

    const matchedCategory =
      categories.find(
        (c) =>
          c.locale === record.locale &&
          !c.parentId &&
          (c.slug === record.categorySlug ||
            c.name.toLowerCase() === (record.categoryName || '').toLowerCase())
      ) ||
      categories.find((c) => !c.parentId && c.slug === record.categorySlug) ||
      categories.find((c) => !c.parentId);

    if (!record.categorySlug || !matchedCategory || matchedCategory.slug !== record.categorySlug) {
      conflicts.push({
        legacyId: record.legacyId,
        code: 'UNMAPPED_CATEGORY',
        severity: 'warning',
        message: `Legacy category "${record.categorySlug || 'unspecified'}" mapped to fallback Studio category "${matchedCategory?.name || 'Science'}".`,
      });
    }

    const matchedTagIds = (record.tagNames || [])
      .map((name) =>
        tags.find(
          (t) =>
            t.name.toLowerCase() === name.trim().toLowerCase() ||
            t.slug === slugify(name)
        )?.id
      )
      .filter((id): id is string => Boolean(id));

    const cleanSummary =
      stripHtmlTags(record.summary || record.dek || '') ||
      plainBody.slice(0, 180).trim();
    const cleanDek = stripHtmlTags(record.dek || cleanSummary);

    const provenance: LegacyArticleProvenance = {
      legacyId: record.legacyId,
      legacyUrlPath: record.legacyUrlPath,
      importedAt: executedAt,
      sourceSystem: record.sourceSystem,
      redirectRequired: true,
    };

    const targetCategorySlug = matchedCategory?.slug || 'science';
    const canonicalWebPath = `/${record.locale}/${targetCategorySlug}/${candidateSlug}`;

    const staged: Article = {
      id: `art-legacy-${slugify(record.legacyId)}`,
      locale: record.locale,
      title: cleanTitle,
      slug: candidateSlug,
      dek: cleanDek,
      summary: cleanSummary,
      editorialType: 'research-digest',
      translationGroupId: `tg-legacy-${slugify(record.legacyId)}`,
      legacyProvenance: provenance,
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: plainBody }],
          },
        ],
      },
      bodyHtml: sanitizedBody,
      status: 'draft', // Always imported as non-public draft requiring human review
      primaryCategoryId: matchedCategory?.id,
      categoryIds: matchedCategory ? [matchedCategory.id] : [],
      tagIds: matchedTagIds,
      sourceIds: [],
      seo: {
        title: stripHtmlTags(record.seoTitle || cleanTitle),
        description: stripHtmlTags(record.seoDescription || cleanSummary),
        canonical: `https://scientificradar.com${canonicalWebPath}`,
        noindex: true,
      },
      publishedAt: record.publishedAt,
      createdAt: record.publishedAt || executedAt,
      updatedAt: record.updatedAt || executedAt,
      version: 1,
    };

    usedLocaleSlugs.set(localeSlugKey, staged.id);
    existingLegacyIds.set(record.legacyId, staged.id);
    stagedArticles.push(staged);

    if (record.legacyUrlPath && record.legacyUrlPath !== canonicalWebPath) {
      redirectMappings.push({
        legacyId: record.legacyId,
        fromLegacyPath: record.legacyUrlPath,
        toCanonicalWebPath: canonicalWebPath,
        locale: record.locale,
        statusCode: 301,
      });
    }
  }

  return {
    executedAt,
    sourceBatchCount: legacyRecords.length,
    importableCount: stagedArticles.length,
    blockedCount: conflicts.filter((c) => c.severity === 'error').length,
    warningCount: conflicts.filter((c) => c.severity === 'warning').length,
    stagedArticles,
    redirectMappings,
    conflicts,
  };
}
