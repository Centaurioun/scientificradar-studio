import {
  Article,
  ArticleStatus,
  AssistantTask,
  EditorialChange,
  KnowledgeLink,
  MediaAsset,
  NavItemId,
  NavigationPreference,
  NavPreset,
  ScientificSource,
  Tag,
  UserRole,
} from './types';
import { sanitizeEditorialHtml } from './html-security';

/**
 * Normalizes a string into a URL-safe slug.
 * Handles Turkish characters (ş, ı, ğ, ü, ö, ç) cleanly.
 */
export function slugify(input: string): string {
  const trMap: Record<string, string> = {
    ş: 's',
    Ş: 's',
    ı: 'i',
    İ: 'i',
    ğ: 'g',
    Ğ: 'g',
    ü: 'u',
    Ü: 'u',
    ö: 'o',
    Ö: 'o',
    ç: 'c',
    Ç: 'c',
  };

  const mapped = input
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('');

  return mapped
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensures unique slug per locale by appending a numeric suffix when a collision occurs.
 */
export function ensureUniqueSlug(
  desiredSlug: string,
  locale: 'en' | 'tr',
  existingArticles: Pick<Article, 'id' | 'slug' | 'locale'>[],
  currentArticleId?: string
): string {
  const base = slugify(desiredSlug) || 'untitled-article';
  const sameLocale = existingArticles.filter(
    (a) => a.locale === locale && a.id !== currentArticleId
  );
  const existingSlugs = new Set(sameLocale.map((a) => a.slug));

  if (!existingSlugs.has(base)) {
    return base;
  }

  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

/**
 * Validates URL safety. Rejects javascript:, data:, vbscript:, file: protocols.
 */
export function validateSafeUrl(url: string): {
  valid: boolean;
  reason?: string;
  isHttps?: boolean;
} {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, reason: 'URL is empty' };
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && trimmed[1] !== '\\') {
    return { valid: true, isHttps: true };
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      valid: false,
      reason: 'Unsafe URL protocol detected (javascript/data/file prohibited)',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}` };
    }
    return {
      valid: true,
      isHttps: parsed.protocol === 'https:',
    };
  } catch {
    return { valid: false, reason: 'Malformed URL syntax' };
  }
}

/**
 * Validates DOI syntax (e.g., 10.1038/s41586-026-01234-x).
 * Note: Syntax check only; never claims external Crossref/DOI registration verification.
 */
export function validateDoiSyntax(doi?: string): {
  validSyntax: boolean;
  normalized?: string;
  note: string;
} {
  if (!doi || !doi.trim()) {
    return {
      validSyntax: false,
      note: 'No DOI provided',
    };
  }

  const cleaned = doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');

  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  if (!doiRegex.test(cleaned)) {
    return {
      validSyntax: false,
      note: 'Invalid DOI syntax (expected 10.xxxx/...)',
    };
  }

  return {
    validSyntax: true,
    normalized: cleaned,
    note: 'DOI syntax valid (external registration verification not run in offline P0 demo)',
  };
}

/**
 * Sanitizes rich HTML content and converts any body <h1> tags into <h2>
 * so that the article Title remains the single rendered H1.
 */
export function sanitizeAndDemoteBodyH1(rawHtml: string, trustedImageSources?: ReadonlySet<string>): {
  sanitizedHtml: string;
  demotedH1Count: number;
  removedUnsafeCount: number;
} {
  const result = sanitizeEditorialHtml(rawHtml, { demoteBodyH1: true, trustedImageSources });
  return {
    sanitizedHtml: result.html,
    demotedH1Count: result.demotedH1Count,
    removedUnsafeCount: result.removedUnsafeCount,
  };
}

/**
 * Converts pasted Markdown text into clean HTML for the Tiptap body editor,
 * demoting top-level `# Heading` (H1) to `<h2>` with a warning count.
 */
export function convertMarkdownPasteToSafeHtml(markdown: string): {
  html: string;
  demotedH1Count: number;
} {
  const lines = markdown.split(/\r?\n/);
  let demotedH1Count = 0;
  const htmlLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      demotedH1Count += 1;
      htmlLines.push(`<h2>${escapeHtml(line.slice(2).trim())}</h2>`);
    } else if (line.startsWith('## ')) {
      htmlLines.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlLines.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
    } else if (line.startsWith('#### ')) {
      htmlLines.push(`<h3>${escapeHtml(line.slice(5).trim())}</h3>`);
    } else if (line.startsWith('> ')) {
      htmlLines.push(`<blockquote><p>${formatInlineMarkdown(line.slice(2).trim())}</p></blockquote>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      htmlLines.push(`<ul><li>${formatInlineMarkdown(line.slice(2).trim())}</li></ul>`);
    } else {
      htmlLines.push(`<p>${formatInlineMarkdown(line)}</p>`);
    }
  }

  return {
    html: htmlLines.join('\n'),
    demotedH1Count,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInlineMarkdown(text: string): string {
  let safe = escapeHtml(text);
  // Bold **text**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Inline links [label](url)
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const check = validateSafeUrl(url);
    if (!check.valid) return label;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return safe;
}

export const MAX_EDITORIAL_TAGS = 6;

export function tagCountIsValid(ids: string[]): boolean {
  return new Set(ids).size <= MAX_EDITORIAL_TAGS;
}

/**
 * Deduplicates tag IDs (including case/alias collisions when tags list is provided)
 * and enforces MAX_EDITORIAL_TAGS (6).
 */
export function normalizeArticleTagIds(
  tagIds: string[],
  allTags?: Tag[]
): {
  tagIds: string[];
  normalizedIds: string[];
  rejectedOverflowCount: number;
  dedupedCount: number;
} {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const unique: string[] = [];
  let dedupedCount = 0;

  for (const rawId of tagIds) {
    const id = rawId.trim();
    if (!id) continue;
    if (seenIds.has(id)) {
      dedupedCount += 1;
      continue;
    }
    if (allTags) {
      const tagObj = allTags.find((t) => t.id === id);
      if (tagObj) {
        const canonicalKey = tagObj.name.trim().toLowerCase();
        if (seenNames.has(canonicalKey)) {
          dedupedCount += 1;
          continue;
        }
        seenNames.add(canonicalKey);
        for (const alias of tagObj.aliases || []) {
          seenNames.add(alias.trim().toLowerCase());
        }
      }
    }
    seenIds.add(id);
    unique.push(id);
  }

  const normalizedIds = unique.slice(0, MAX_EDITORIAL_TAGS);
  const rejectedOverflowCount = Math.max(0, unique.length - MAX_EDITORIAL_TAGS);

  return {
    tagIds: normalizedIds,
    normalizedIds,
    rejectedOverflowCount,
    dedupedCount,
  };
}

/**
 * Explicit state transition table per Spec v5 §10.1.
 */
const ALLOWED_STATE_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  idea: ['draft', 'archived'],
  draft: ['in_review', 'archived'],
  in_review: ['approved', 'revision_requested', 'draft'],
  revision_requested: ['draft', 'in_review', 'archived'],
  approved: ['scheduled', 'published', 'in_review', 'draft'],
  scheduled: ['published', 'approved', 'draft'],
  published: ['archived'],
  archived: ['draft'],
};

/**
 * Validates editorial workflow transition based on current state AND user role (Spec v5 §10.1).
 * Notice: An already `approved` article cannot be transitioned to `approved` again as a meaningful review action.
 */
export function canTransitionStatus(
  from: ArticleStatus,
  to: ArticleStatus,
  role: UserRole
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return {
      allowed: false,
      reason: `Article is already in ${from.replace('_', ' ')} state.`,
    };
  }

  const validNextStates = ALLOWED_STATE_TRANSITIONS[from] || [];
  if (!validNextStates.includes(to)) {
    return {
      allowed: false,
      reason: `Transition from "${from.replace('_', ' ')}" directly to "${to.replace('_', ' ')}" is not permitted by editorial workflow policy.`,
    };
  }

  // Authors can create ideas/drafts and submit to in_review, but cannot approve, schedule, or publish
  if (role === 'author') {
    const allowedTargets: ArticleStatus[] = ['idea', 'draft', 'in_review'];
    if (!allowedTargets.includes(to)) {
      return {
        allowed: false,
        reason: 'Authors can submit drafts for review, but only Reviewers/Editors/Owners can approve or publish.',
      };
    }
    return { allowed: true };
  }

  // Reviewers can move in_review -> approved, revision_requested, or draft, but cannot schedule or publish
  if (role === 'reviewer') {
    const reviewerTargets: ArticleStatus[] = ['approved', 'revision_requested', 'draft'];
    if (!reviewerTargets.includes(to)) {
      return {
        allowed: false,
        reason: 'Reviewers can approve or request revisions on manuscripts in review, but only Editors/Owners can schedule or publish.',
      };
    }
    return { allowed: true };
  }

  // Editors and Owners can execute any valid state transition in the transition table
  return { allowed: true };
}

/**
 * Returns the list of allowed next statuses for a given current status and role.
 */
export function getAllowedNextStatuses(
  from: ArticleStatus,
  role: UserRole
): ArticleStatus[] {
  const candidates = ALLOWED_STATE_TRANSITIONS[from] || [];
  return candidates.filter((target) => canTransitionStatus(from, target, role).allowed);
}

/**
 * Deduplicates and normalizes tag names (case-insensitive).
 */
export function normalizeAndDedupeTags(tagNames: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tagNames) {
    const cleaned = raw.trim().replace(/\s+/g, ' ');
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result.slice(0, MAX_EDITORIAL_TAGS);
}

/**
 * Media layout policy helper: ensures scientific figures/charts default to non-destructive contain
 * and respects Lock Position.
 */
export function getMediaDisplayPolicy(asset: Pick<MediaAsset, 'kind' | 'layout'>): {
  objectFit: 'contain' | 'cover';
  allowAssistantReflow: boolean;
  policyLabel: string;
} {
  const isScientific =
    asset.kind === 'scientific_figure' ||
    asset.kind === 'chart' ||
    asset.kind === 'diagram';

  return {
    objectFit: isScientific ? 'contain' : 'cover',
    allowAssistantReflow: asset.layout !== 'locked',
    policyLabel: isScientific
      ? 'Scientific Figure (Non-crop contain enforced — preserves axes & labels)'
      : 'Editorial Photograph (Responsive cover with focal point)',
  };
}

/**
 * Runs deterministic local checks (not fake AI) for the "Prepare with Codex" drawer.
 * Inspects actual article fields, HTML headings, tags, media alt text, sources, and knowledge links.
 */
export function runDeterministicLocalChecks(params: {
  article: Article;
  allTags: Tag[];
  articleMedia: MediaAsset[];
  articleSources: ScientificSource[];
  availableKnowledgeLinks: KnowledgeLink[];
  tasks: AssistantTask[];
}): EditorialChange[] {
  const {
    article,
    allTags,
    articleMedia,
    articleSources,
    availableKnowledgeLinks,
    tasks,
  } = params;

  const proposals: EditorialChange[] = [];

  // 1. Format checks (H1 inside body, double spaces, trailing whitespace)
  if (tasks.includes('format')) {
    const h1Match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(article.bodyHtml);
    if (h1Match) {
      const sanitized = sanitizeAndDemoteBodyH1(article.bodyHtml);
      proposals.push({
        id: `chg-format-h1-${article.id}`,
        articleId: article.id,
        baseVersion: article.version,
        task: 'format',
        category: 'mechanical',
        targetPath: 'bodyHtml',
        label: 'Demote body H1 heading to H2',
        before: `<h1>${h1Match[1]}</h1>`,
        after: `<h2>${h1Match[1]}</h2>`,
        reason:
          'Article title renders the sole H1. Body headings must use H2/H3 for valid document outline.',
        requiresApproval: true,
        safeToAutoSelect: true,
      });
      void sanitized;
    }

    if (/\s{2,}/.test(article.summary)) {
      proposals.push({
        id: `chg-format-summary-space-${article.id}`,
        articleId: article.id,
        baseVersion: article.version,
        task: 'format',
        category: 'mechanical',
        targetPath: 'summary',
        label: 'Normalize redundant whitespace in summary/dek',
        before: article.summary,
        after: article.summary.replace(/\s{2,}/g, ' ').trim(),
        reason: 'Removes accidental double spaces without altering scientific terminology.',
        requiresApproval: true,
        safeToAutoSelect: true,
      });
    }
  }

  // 2. Image checks (missing alt text, locked layout notice)
  if (tasks.includes('images')) {
    for (const media of articleMedia) {
      if (!media.altText || media.altText.trim().length < 10) {
        proposals.push({
          id: `chg-img-alt-${media.id}`,
          articleId: article.id,
          baseVersion: article.version,
          task: 'images',
          category: 'metadata',
          targetPath: 'media.altText',
          label: `Add descriptive alt text for ${media.filename}`,
          before: media.altText || '(Empty alt text)',
          after: `${media.title} — ${media.caption || 'Scientific visual figure referenced in article'}`,
          reason:
            'Accessibility and scientific figure standards require descriptive alt text explaining visible structure.',
          requiresApproval: true,
          safeToAutoSelect: true,
        });
      }
    }
  }

  // 3. SEO & Taxonomy checks (missing SEO title/description, tag count 3-6 suggestion)
  if (tasks.includes('seo')) {
    if (!article.seo.title || article.seo.title.trim().length < 15) {
      proposals.push({
        id: `chg-seo-title-${article.id}`,
        articleId: article.id,
        baseVersion: article.version,
        task: 'seo',
        category: 'metadata',
        targetPath: 'seo.title',
        label: 'Populate structured SEO title',
        before: article.seo.title || '(Empty SEO title)',
        after: `${article.title} | ScientificRadar`,
        reason: 'Provides explicit search result title within 60–70 character display window.',
        requiresApproval: true,
        safeToAutoSelect: true,
      });
    }

    if (!article.seo.description || article.seo.description.trim().length < 40) {
      const fallbackDesc =
        article.summary.slice(0, 155) ||
        'Peer-reviewed research analysis and scientific findings published on ScientificRadar.';
      proposals.push({
        id: `chg-seo-desc-${article.id}`,
        articleId: article.id,
        baseVersion: article.version,
        task: 'seo',
        category: 'metadata',
        targetPath: 'seo.description',
        label: 'Populate meta description from article summary/dek',
        before: article.seo.description || '(Empty meta description)',
        after: fallbackDesc,
        reason: 'Summarizing key research context helps readers evaluate relevance in search snippets.',
        requiresApproval: true,
        safeToAutoSelect: true,
      });
    }

    if (article.tagIds.length < 3) {
      const bodyLower = `${article.title} ${article.summary} ${article.bodyHtml}`.toLowerCase();
      const matchedTags = allTags
        .filter(
          (t) =>
            !article.tagIds.includes(t.id) &&
            bodyLower.includes(t.name.toLowerCase().split(' ')[0])
        )
        .slice(0, 4 - article.tagIds.length);

      if (matchedTags.length > 0) {
        const currentNames = allTags
          .filter((t) => article.tagIds.includes(t.id))
          .map((t) => t.name);
        const nextNames = [...currentNames, ...matchedTags.map((t) => t.name)];
        proposals.push({
          id: `chg-seo-tags-${article.id}`,
          articleId: article.id,
          baseVersion: article.version,
          task: 'seo',
          category: 'metadata',
          targetPath: 'tagIds',
          label: 'Suggest relevant taxonomy tags (3–6 editorial guideline)',
          before: currentNames.join(', ') || '(No tags)',
          after: nextNames.join(', '),
          reason:
            'Recommends 3–6 relevant taxonomy tags matched from article text without keyword stuffing.',
          requiresApproval: true,
          safeToAutoSelect: true,
        });
      }
    }
  }

  // 4. Sources & Links checks (DOI syntax, unsafe URLs, unverified warnings)
  if (tasks.includes('sources')) {
    if (articleSources.length === 0) {
      proposals.push({
        id: `chg-src-missing-${article.id}`,
        articleId: article.id,
        baseVersion: article.version,
        task: 'sources',
        category: 'editorial',
        targetPath: 'sources',
        label: 'Flag: No primary scientific sources linked',
        before: '0 linked citations',
        after: 'Editorial review required: attach peer-reviewed DOI or primary dataset URL',
        reason:
          'ScientificRadar editorial policy requires primary source provenance. Assistant never fabricates citations.',
        requiresApproval: true,
        safeToAutoSelect: false,
      });
    } else {
      for (const src of articleSources) {
        const urlCheck = validateSafeUrl(src.url);
        if (!urlCheck.valid) {
          proposals.push({
            id: `chg-src-url-${src.id}`,
            articleId: article.id,
            baseVersion: article.version,
            task: 'sources',
            category: 'editorial',
            targetPath: 'sources',
            label: `Malformed or unsafe URL in source "${src.title.slice(0, 36)}..."`,
            before: src.url,
            after: 'Requires valid https:// source URL',
            reason: urlCheck.reason || 'Source URL failed local syntax validation.',
            requiresApproval: true,
            safeToAutoSelect: false,
          });
        }
        if (src.doi) {
          const doiCheck = validateDoiSyntax(src.doi);
          if (!doiCheck.validSyntax) {
            proposals.push({
              id: `chg-src-doi-${src.id}`,
              articleId: article.id,
              baseVersion: article.version,
              task: 'sources',
              category: 'unverified',
              targetPath: 'sources',
              label: `Invalid DOI syntax on "${src.title.slice(0, 36)}..."`,
              before: src.doi,
              after: 'Expected format: 10.xxxx/suffix',
              reason: doiCheck.note,
              requiresApproval: true,
              safeToAutoSelect: false,
            });
          }
        }
      }
    }
  }

  // 5. Smart Knowledge Links checks (find first unlinked occurrence of known scientific terms)
  if (tasks.includes('knowledge')) {
    const plainBody = article.bodyHtml.replace(/<[^>]+>/g, ' ').toLowerCase();
    for (const kl of availableKnowledgeLinks) {
      if (kl.locale !== article.locale) continue;
      const termLower = kl.term.toLowerCase();
      const alreadyLinked = article.bodyHtml.toLowerCase().includes(`data-knowledge-term="${termLower}"`);
      if (plainBody.includes(termLower) && !alreadyLinked) {
        proposals.push({
          id: `chg-kl-${kl.id}-${article.id}`,
          articleId: article.id,
          baseVersion: article.version,
          task: 'knowledge',
          category: 'metadata',
          targetPath: 'knowledgeLinks',
          label: `Link first occurrence of "${kl.term}" (${kl.targetType === 'internal' ? 'Internal Article' : 'Wikipedia Concept'})`,
          before: kl.term,
          after: `[Knowledge Link: ${kl.term} -> ${kl.previewTitle}]`,
          reason:
            kl.targetType === 'internal'
              ? 'Prefers authoritative internal ScientificRadar article preview over external encyclopedia.'
              : 'Adds reader hover/focus concept summary card for technical terminology.',
          requiresApproval: true,
          safeToAutoSelect: true,
        });
      }
    }
  }

  return proposals;
}

/**
 * Navigation preset builder for Settings -> Dashboard & Navigation.
 */
export function getPresetVisibility(preset: NavPreset): Record<NavItemId, boolean> {
  const allItems: NavItemId[] = [
    'dashboard',
    'articles',
    'pages',
    'categories',
    'media',
    'series',
    'homepage',
    'videos',
    'review',
    'calendar',
    'authors',
    'revisions',
    'assistant',
    'seo',
    'knowledge_links',
    'search_performance',
    'settings_general',
    'settings_navigation',
    'settings_defaults',
    'settings_integrations',
    'settings_roles',
    'settings_audit',
  ];

  if (preset === 'show_all') {
    return Object.fromEntries(allItems.map((id) => [id, true])) as Record<NavItemId, boolean>;
  }

  if (preset === 'minimal') {
    const minimalSet = new Set<NavItemId>([
      'dashboard',
      'articles',
      'pages',
      'media',
      'settings_navigation',
      'settings_integrations',
    ]);
    return Object.fromEntries(
      allItems.map((id) => [id, minimalSet.has(id)])
    ) as Record<NavItemId, boolean>;
  }

  // Default: 'balanced' preset per Section 3 of Master Spec
  const balancedHidden = new Set<NavItemId>([
    'videos',
    'revisions',
    'search_performance',
    'settings_defaults',
    'settings_roles',
    'settings_audit',
  ]);

  return Object.fromEntries(
    allItems.map((id) => [id, !balancedHidden.has(id)])
  ) as Record<NavItemId, boolean>;
}

export function getDefaultNavigationPreference(): NavigationPreference {
  return {
    preset: 'balanced',
    visibleItems: getPresetVisibility('balanced'),
    collapsedGroups: {
      GENERAL: false,
      CONTENT: false,
      EDITORIAL: false,
      TOOLS: false,
      ADMINISTRATION: false,
    },
    sidebarCollapsed: false,
    dashboardWidgets: {
      metrics: true,
      continueEditing: true,
      requiresAttention: true,
      upcomingCalendar: true,
      recentActivity: true,
    },
  };
}

/**
 * Counts words in an HTML string after stripping tags.
 */
export function countWordsFromHtml(html: string): number {
  const plain = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates estimated reading time in minutes (at 200 words/minute, minimum 1 min).
 */
export function calculateReadingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil((wordCount || 0) / 200));
}

/**
 * Checks whether a string is a safe HTTP/HTTPS or relative URL.
 */
export function isValidHttpUrl(url: string): boolean {
  return validateSafeUrl(url).valid;
}

/**
 * Validates primary category, subcategory list, and editorial tag count (3–6 house guideline).
 */
export function validateCategoriesAndTags(
  primaryCategoryId: string,
  categoryIds: string[],
  tagIds: string[]
): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!primaryCategoryId) {
    warnings.push('Select a Primary Scientific Discipline category.');
  }
  const uniqueTagCount = new Set(tagIds).size;
  if (uniqueTagCount === 0) {
    warnings.push('Assign at least 1 taxonomy tag (3–6 tags recommended).');
  } else if (uniqueTagCount < 3) {
    warnings.push(`Only ${uniqueTagCount} tag(s) assigned; 3–6 tags recommended for discovery.`);
  } else if (uniqueTagCount > MAX_EDITORIAL_TAGS) {
    warnings.push(
      `Assigned ${uniqueTagCount} tags, which exceeds the ${MAX_EDITORIAL_TAGS}-tag maximum.`
    );
  }
  if (!categoryIds.includes(primaryCategoryId) && primaryCategoryId) {
    warnings.push('Primary category should be included in the article category list.');
  }
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

