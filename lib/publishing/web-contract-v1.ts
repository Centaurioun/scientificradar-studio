import katex from 'katex';
import type {
  Article,
  AuthorProfile as StudioAuthorProfile,
  Category as StudioCategory,
  EditorialArticleType,
  KnowledgeLink as StudioKnowledgeLink,
  MediaAsset as StudioMediaAsset,
  ScientificSource as StudioScientificSource,
  Tag as StudioTag,
} from '../types';

export const PUBLICATION_CONTRACT_VERSION = '1.0.0' as const;
export const PINNED_WEB_COMMIT_SHA =
  '3b096e84023ca1ba358b7d7dd4f25f17185fc8d7' as const;

export type EditorialType = EditorialArticleType;

export type PublicationStatus =
  | 'demo'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'withdrawn';

export type SupportedLocale = 'en' | 'tr';

export interface ArticleHeadingOutlineItem {
  type: 'heading';
  id: string;
  level: 2 | 3;
  text: string;
}

export interface PublicSource {
  id: string;
  label: string;
  title: string;
  authors?: string;
  publication?: string;
  year?: string;
  href?: string;
  /**
   * Authentic DOI only when referencing a real foundational concept or omitted
   * for illustrative demonstration records. Never fabricate synthetic DOIs as real.
   */
  doi?: string;
  isIllustrativeDemo: boolean;
  note?: string;
}

export interface PublicMedia {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  credit: string;
  rightsVerified: boolean;
  license: string;
  /** Server-resolved, content-addressed rights evidence. Client values are not authoritative. */
  rightsEvidence?: {
    evidenceId: string;
    mediaId: string;
    assetRevisionId: string;
    license: string;
  };
}

export interface PublicAuthor {
  id: string;
  name: string;
  role: string;
  credentialsNote: string;
  bio: string;
  isDemoPersona: boolean;
}

export interface PublicKnowledgeLink {
  id: string;
  term: string;
  targetType: 'internal' | 'wikipedia';
  targetUrl: string;
  targetArticleId?: string;
  locale: SupportedLocale;
  previewTitle: string;
  previewExcerpt: string;
  sourceAttribution: string;
  reviewStatus: 'approved';
  isSampleDemoData: false;
}

export interface ScientificTableData {
  id: string;
  caption: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
}

export type ArticleBlock =
  | {
      type: 'paragraph';
      id: string;
      text: string;
      dropCap?: boolean;
      citations?: string[]; // References PublicSource.id
    }
  | {
      type: 'heading';
      id: string;
      level: 2 | 3;
      text: string;
    }
  | {
      type: 'figure';
      id: string;
      media: PublicMedia;
      layout: 'column' | 'wide';
      figureNumber: string;
    }
  | {
      type: 'quote';
      id: string;
      quote: string;
      attribution?: string;
    }
  | {
      type: 'math';
      id: string;
      tex: string;
      label: string;
      explanation: string;
      variables?: { symbol: string; meaning: string }[];
    }
  | {
      type: 'table';
      id: string;
      table: ScientificTableData;
    }
  | {
      type: 'key-takeaways';
      id: string;
      title: string;
      items: string[];
    };

export interface PublicArticle {
  id: string;
  slug: string;
  locale: SupportedLocale;
  editorialType: EditorialType;
  status: PublicationStatus;
  title: string;
  dek: string;
  summary: string;
  categorySlug: string;
  subcategorySlugs: string[];
  tagSlugs: string[];
  authorIds: string[];
  seriesId?: string;
  knowledgeLinks?: PublicKnowledgeLink[];
  publishedAt: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  featuredRank?: number;
  mostReadDemoRank?: number;
  hero?: PublicMedia;
  blocks: ArticleBlock[];
  bodyHtml?: string;
  sources: PublicSource[];
  relatedIds: string[];
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    noindex?: boolean;
  };
  revisionId?: string;
  revisionNumber?: number;
  translationGroupId?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
}

/**
 * Versioned Studio -> Web Publication Snapshot Contract (v1.0.0).
 * Matches docs/references/scientificradar-web/content-model/types.ts.txt.
 */
export interface PublishedSnapshotRecordV1 {
  contractVersion: typeof PUBLICATION_CONTRACT_VERSION;
  articleId: string;
  revisionId: string;
  revisionNumber: number;
  slug: string;
  locale: SupportedLocale;
  translationGroupId?: string;
  editorialType: EditorialType;
  status: PublicationStatus;
  title: string;
  dek: string;
  summary: string;
  categorySlug: string;
  subcategorySlugs: string[];
  tagSlugs: string[];
  authorIds: string[];
  seriesId?: string;
  knowledgeLinks?: PublicKnowledgeLink[];
  authors?: PublicAuthor[];
  publishedAt: string;
  updatedAt?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  readingTimeMinutes: number;
  featuredRank?: number;
  mostReadDemoRank?: number;
  hero?: PublicMedia;
  blocks: ArticleBlock[];
  bodyHtml?: string;
  headings?: ArticleHeadingOutlineItem[];
  sources: PublicSource[];
  relatedIds: string[];
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    noindex?: boolean;
  };
}

export interface SnapshotValidationIssue {
  code:
    | 'INVALID_CONTRACT_VERSION'
    | 'MISSING_REQUIRED_FIELD'
    | 'INVALID_REVISION'
    | 'INVALID_LOCALE'
    | 'NON_PUBLIC_STATUS'
    | 'WITHDRAWN_ARTICLE'
    | 'UNSAFE_MEDIA_URL'
    | 'INCOMPLETE_MEDIA_METADATA'
    | 'UNVERIFIED_MEDIA_RIGHTS'
    | 'SYNTHETIC_DEMO_DOI_FORBIDDEN'
    | 'INVALID_DOI_FORMAT'
    | 'BROKEN_CITATION_REFERENCE'
    | 'UNSUPPORTED_STUDIO_NODE'
    | 'EMPTY_ARTICLE_BODY';
  field: string;
  message: string;
}

export interface SnapshotValidationResult {
  valid: boolean;
  isPubliclyRenderable: boolean;
  isIndexableCandidate: boolean;
  /** Alias for convenience in Studio UI / tests */
  publicEligible: boolean;
  issues: SnapshotValidationIssue[];
  headings: ArticleHeadingOutlineItem[];
}

export interface ValidateSnapshotOptions {
  trustedMediaOrigins?: string[];
  allowLoopbackHttpMediaOrigin?: boolean;
  /**
   * When true, Studio enforces strict pre-publish producer guarantees beyond Web's
   * baseline runtime check at SHA 3b096e84023ca1ba358b7d7dd4f25f17185fc8d7, such as
   * rejecting `media.rightsVerified === false` (`UNVERIFIED_MEDIA_RIGHTS`) before
   * a production release.
   */
  enforceStrictStudioPrePublish?: boolean;
}

/** Transport description only: caller supplied fields are NEVER trusted by Studio. */
export interface PublicationAuthorizationReceipt {
  receiptId: string;
  authorizedByActor: string;
  authorizedByRole: 'owner' | 'editor';
  issuedAt: string;
  serverVerified: boolean;
}

// ============================================================================
// Scientific Math Rendering (Pinned Web Parity: content-model/math.ts.txt)
// ============================================================================

export interface RenderedMathOutput {
  html: string;
  latex: string;
  valid: boolean;
  errorMessage?: string;
}

function escapeHtmlForMathFallback(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderScientificMath(
  latex: string,
  displayMode: boolean
): RenderedMathOutput {
  const normalizedLatex = latex.trim();
  if (!normalizedLatex) {
    return {
      html: '',
      latex: '',
      valid: false,
      errorMessage: 'Empty LaTeX expression',
    };
  }

  try {
    const html = katex.renderToString(normalizedLatex, {
      displayMode,
      throwOnError: true,
      strict: 'error',
      trust: false,
      output: 'htmlAndMathml',
    });

    return {
      html,
      latex: normalizedLatex,
      valid: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid LaTeX syntax';
    return {
      html: `<code class="sr-math-fallback font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--sr-surface)] text-[var(--sr-ink)]" data-math-fallback="true">${escapeHtmlForMathFallback(
        normalizedLatex
      )}</code>`,
      latex: normalizedLatex,
      valid: false,
      errorMessage: message,
    };
  }
}

// ============================================================================
// Canonical Body HTML Sanitizer & Preprocessor (Pinned Web Parity: sanitizer.ts.txt)
// ============================================================================

const FORBIDDEN_CONTAINER_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'meta',
  'link',
  'base',
  'svg',
  'math',
];

const ALLOWED_TAGS = new Set([
  'p',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'sub',
  'sup',
  'code',
  'pre',
  'a',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'figure',
  'figcaption',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'caption',
  'hr',
  'br',
  'span',
  'div',
]);

const ALLOWED_ATTRIBUTES_BY_TAG: Record<string, Set<string>> = {
  a: new Set([
    'href',
    'title',
    'id',
    'aria-label',
    'data-citation-id',
    'data-citation-source-id',
    'data-knowledge-term',
    'data-knowledge-id',
  ]),
  h2: new Set(['id']),
  h3: new Set(['id']),
  h4: new Set(['id']),
  sup: new Set([
    'id',
    'class',
    'data-citation-id',
    'data-citation-source-id',
    'data-citation-number',
  ]),
  figure: new Set(['id', 'class', 'data-media-id', 'data-layout']),
  figcaption: new Set(['class']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  table: new Set(['id', 'class']),
  th: new Set(['scope', 'colspan', 'rowspan']),
  td: new Set(['colspan', 'rowspan']),
  span: new Set([
    'class',
    'data-latex',
    'data-math-tex',
    'data-math-display',
    'data-equation-id',
    'role',
    'aria-label',
    'lang',
  ]),
  div: new Set([
    'id',
    'class',
    'data-latex',
    'data-math-tex',
    'data-math-display',
    'data-equation-id',
    'data-callout-title',
    'role',
    'aria-label',
  ]),
  code: new Set(['class', 'data-language']),
  pre: new Set(['class', 'data-language']),
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/&#([0-9]+);?/g, (_, dec: string) => {
      const codePoint = Number.parseInt(dec, 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isSafeHref(rawHref: string): boolean {
  const decoded = decodeHtmlEntities(rawHref)
    .replace(/[\u0000-\u001F\u007F\s]+/g, '')
    .trim();

  if (!decoded) return false;
  if (decoded.startsWith('#')) {
    return /^#[A-Za-z0-9_.:-]+$/.test(decoded);
  }
  if (decoded.startsWith('/')) {
    return !decoded.startsWith('//') && !decoded.includes('..');
  }

  try {
    const parsed = new URL(decoded);
    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'mailto:'
    );
  } catch {
    return false;
  }
}

function isSafeImageSrc(rawSrc: string): boolean {
  const decoded = decodeHtmlEntities(rawSrc)
    .replace(/[\u0000-\u001F\u007F\s]+/g, '')
    .trim();

  if (!decoded) return false;
  if (decoded.startsWith('/')) {
    return !decoded.startsWith('//') && !decoded.includes('..');
  }

  try {
    const parsed = new URL(decoded);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseTagAttributes(rawAttrs: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrPattern =
    /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[2] ?? match[3] ?? match[4] ?? '';
    attrs.set(attrName, attrValue);
  }

  return attrs;
}

export function slugifyHeadingText(rawText: string): string {
  const plain = decodeHtmlEntities(rawText.replace(/<[^>]*>/g, ' '))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return plain || 'section';
}

export function stripHtmlTags(input: string): string {
  if (!input) return '';
  let output = input.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const tag of FORBIDDEN_CONTAINER_TAGS) {
    const containerRegex = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      'gi'
    );
    output = output.replace(containerRegex, ' ');
  }
  return output
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectUnsupportedEditorConstructs(
  rawHtml: string
): SnapshotValidationIssue[] {
  const issues: SnapshotValidationIssue[] = [];
  if (!rawHtml) return issues;

  for (const rule of UNSUPPORTED_RAW_HTML_PATTERNS) {
    if (rule.pattern.test(rawHtml)) {
      issues.push({
        field: 'bodyHtml',
        code: 'UNSUPPORTED_STUDIO_NODE',
        message: rule.reason,
      });
    }
  }

  return issues;
}

export function normalizeStudioHtmlForWebContract(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // Convert Studio span/div[data-math-tex] or [data-latex] to carry both attributes
  html = html.replace(
    /<(span|div)\b([^>]*?\bdata-(?:math-tex|latex)=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (
      fullMatch,
      tag: string,
      rawAttrs: string,
      rawTex: string,
      innerHtml: string
    ) => {
      const attrs = parseTagAttributes(rawAttrs);
      const latex = decodeHtmlEntities(
        attrs.get('data-latex') || attrs.get('data-math-tex') || rawTex
      ).trim();
      if (!latex) return fullMatch;
      const isDisplay =
        tag.toLowerCase() === 'div' ||
        attrs.get('data-math-display') === 'block' ||
        attrs.get('data-math-display') === 'true';
      const eqId = attrs.get('data-equation-id') || attrs.get('id') || '';
      const idAttr = eqId ? ` data-equation-id="${escapeHtmlAttribute(eqId)}"` : '';
      return `<${tag.toLowerCase()} data-latex="${escapeHtmlAttribute(
        latex
      )}" data-math-tex="${escapeHtmlAttribute(latex)}" data-math-display="${
        isDisplay ? 'block' : 'inline'
      }"${idAttr}>${innerHtml}</${tag.toLowerCase()}>`;
    }
  );

  // Convert Studio sup[data-citation-source-id] or [data-citation-id] to carry both attributes
  html = html.replace(
    /<sup\b([^>]*?\bdata-citation-(?:source-)?id=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/sup>/gi,
    (_full, _rawAttrs: string, sourceId: string, inner: string) => {
      const cleanId = decodeHtmlEntities(sourceId).trim();
      return `<sup data-citation-id="${escapeHtmlAttribute(
        cleanId
      )}" data-citation-source-id="${escapeHtmlAttribute(cleanId)}">${inner}</sup>`;
    }
  );

  return html;
}

export function sanitizeCanonicalBodyHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let working = normalizeStudioHtmlForWebContract(rawHtml).replace(
    /<!--[\s\S]*?-->/g,
    ''
  );

  for (const tag of FORBIDDEN_CONTAINER_TAGS) {
    const containerRegex = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      'gi'
    );
    working = working.replace(containerRegex, '');
    const orphanRegex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    working = working.replace(orphanRegex, '');
  }

  // Enforce single H1 invariant: demote any embedded <h1> inside bodyHtml to <h2>.
  working = working
    .replace(/<h1(\b[^>]*)>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>');

  return working.replace(
    /<(\/?)([a-zA-Z0-9:-]+)([^<>]*?)(\/?)>/g,
    (_fullMatch, slash: string, rawTagName: string, rawAttrs: string) => {
      const tagName = rawTagName.toLowerCase();
      const isClosing = slash === '/';

      if (!ALLOWED_TAGS.has(tagName)) {
        return '';
      }

      if (isClosing) {
        if (tagName === 'br' || tagName === 'hr' || tagName === 'img') {
          return '';
        }
        return `</${tagName}>`;
      }

      const parsedAttrs = parseTagAttributes(rawAttrs);
      const allowedForTag =
        ALLOWED_ATTRIBUTES_BY_TAG[tagName] ?? new Set<string>();
      const serializedAttrs: string[] = [];

      for (const [attrName, rawValue] of parsedAttrs.entries()) {
        if (
          attrName.startsWith('on') ||
          attrName === 'style' ||
          attrName === 'srcdoc'
        ) {
          continue;
        }
        if (!allowedForTag.has(attrName)) {
          continue;
        }

        const trimmedValue = rawValue.trim();

        if (attrName === 'href') {
          if (!isSafeHref(trimmedValue)) {
            continue;
          }
          const decodedHref = decodeHtmlEntities(trimmedValue).trim();
          serializedAttrs.push(`href="${escapeHtmlAttribute(decodedHref)}"`);
          if (
            decodedHref.startsWith('http://') ||
            decodedHref.startsWith('https://')
          ) {
            serializedAttrs.push('target="_blank"');
            serializedAttrs.push('rel="noopener noreferrer"');
          }
          continue;
        }

        if (attrName === 'src') {
          if (!isSafeImageSrc(trimmedValue)) {
            return '';
          }
          const decodedSrc = decodeHtmlEntities(trimmedValue).trim();
          serializedAttrs.push(`src="${escapeHtmlAttribute(decodedSrc)}"`);
          continue;
        }

        if (
          attrName === 'id' ||
          attrName === 'data-citation-id' ||
          attrName === 'data-citation-source-id' ||
          attrName === 'data-media-id' ||
          attrName === 'data-equation-id'
        ) {
          const safeToken = trimmedValue.replace(/[^A-Za-z0-9_.:-]/g, '');
          if (safeToken) {
            serializedAttrs.push(
              `${attrName}="${escapeHtmlAttribute(safeToken)}"`
            );
          }
          continue;
        }

        serializedAttrs.push(
          `${attrName}="${escapeHtmlAttribute(trimmedValue)}"`
        );
      }

      if (tagName === 'img') {
        if (!serializedAttrs.some((attr) => attr.startsWith('src='))) {
          return '';
        }
        if (!serializedAttrs.some((attr) => attr.startsWith('alt='))) {
          serializedAttrs.push('alt=""');
        }
      }

      const attrString =
        serializedAttrs.length > 0 ? ` ${serializedAttrs.join(' ')}` : '';
      return `<${tagName}${attrString}>`;
    }
  );
}

export interface PreparedBodyHtmlOutput {
  html: string;
  headings: ArticleHeadingOutlineItem[];
}

export function prepareCanonicalBodyHtml(
  rawHtml: string,
  options?: {
    sources?: PublicSource[];
    media?: Record<string, PublicMedia>;
    explicitHeadings?: ArticleHeadingOutlineItem[];
  }
): PreparedBodyHtmlOutput {
  const sanitized = sanitizeCanonicalBodyHtml(rawHtml);
  if (!sanitized) {
    return {
      html: '',
      headings: options?.explicitHeadings ? [...options.explicitHeadings] : [],
    };
  }

  const usedHeadingIds = new Set<string>();
  const extractedHeadings: ArticleHeadingOutlineItem[] = [];
  let headingCounter = 0;

  let processed = sanitized.replace(
    /<h([23])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_full, levelStr: string, rawAttrs: string, innerHtml: string) => {
      const level = (levelStr === '2' ? 2 : 3) as 2 | 3;
      const attrs = parseTagAttributes(rawAttrs);
      const plainText = stripHtmlTags(innerHtml);
      const explicitHeading = options?.explicitHeadings?.[headingCounter];
      headingCounter += 1;

      let candidateId =
        attrs.get('id') ||
        explicitHeading?.id ||
        `section-${slugifyHeadingText(plainText)}`;

      candidateId =
        candidateId.replace(/[^A-Za-z0-9_.:-]/g, '') ||
        `section-${headingCounter}`;
      let uniqueId = candidateId;
      let suffix = 2;
      while (usedHeadingIds.has(uniqueId)) {
        uniqueId = `${candidateId}-${suffix}`;
        suffix += 1;
      }
      usedHeadingIds.add(uniqueId);

      if (plainText) {
        extractedHeadings.push({
          type: 'heading',
          id: uniqueId,
          level,
          text: plainText,
        });
      }

      return `<h${level} id="${escapeHtmlAttribute(uniqueId)}">${innerHtml}</h${level}>`;
    }
  );

  // Render inline and block scientific equations marked with data-latex
  processed = processed.replace(
    /<(span|div)\b([^>]*\bdata-latex="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_full, tagName: string, rawAttrs: string, encodedLatex: string) => {
      const attrs = parseTagAttributes(rawAttrs);
      const latex = decodeHtmlEntities(encodedLatex);
      const displayMode =
        tagName.toLowerCase() === 'div' ||
        attrs.get('data-math-display') === 'block' ||
        attrs.get('data-math-display') === 'true';
      const equationId = attrs.get('data-equation-id') || attrs.get('id');
      const rendered = renderScientificMath(latex, displayMode);

      if (displayMode) {
        const idAttr = equationId
          ? ` id="${escapeHtmlAttribute(equationId)}"`
          : '';
        return `<div${idAttr} class="my-6 p-4 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)] overflow-x-auto" role="math" aria-label="${escapeHtmlAttribute(
          latex
        )}" data-latex="${escapeHtmlAttribute(latex)}" data-math-display="block">${
          rendered.html
        }</div>`;
      }

      return `<span class="sr-math-inline px-0.5" role="math" aria-label="${escapeHtmlAttribute(
        latex
      )}" data-latex="${escapeHtmlAttribute(latex)}" data-math-display="inline">${
        rendered.html
      }</span>`;
    }
  );

  // Enrich inline citations <sup data-citation-source-id="src-1">[1]</sup> with anchor links to #ref-src-1
  const sourceById = new Map(
    (options?.sources ?? []).map((source) => [source.id, source])
  );
  processed = processed.replace(
    /<sup\b([^>]*\bdata-citation-(?:source-)?id="([^"]+)"[^>]*)>([\s\S]*?)<\/sup>/gi,
    (fullMatch, rawAttrs: string, citationId: string, innerHtml: string) => {
      const source = sourceById.get(citationId);
      if (!source) {
        return fullMatch;
      }
      if (/<a\b/i.test(innerHtml)) {
        return fullMatch;
      }
      const attrs = parseTagAttributes(rawAttrs);
      const supId = attrs.get('id') || `cite-${source.id}`;
      const labelText = stripHtmlTags(innerHtml) || `[${source.label}]`;
      return `<sup id="${escapeHtmlAttribute(
        supId
      )}" data-citation-id="${escapeHtmlAttribute(
        source.id
      )}" data-citation-source-id="${escapeHtmlAttribute(
        source.id
      )}" class="font-sans text-xs font-semibold text-[var(--sr-accent)] ml-0.5"><a href="#ref-${escapeHtmlAttribute(
        source.id
      )}" aria-label="Reference ${escapeHtmlAttribute(
        source.label
      )}: ${escapeHtmlAttribute(source.title)}" class="hover:underline">[${escapeHtmlText(
        labelText.replace(/^\[|\]$/g, '')
      )}]</a></sup>`;
    }
  );

  // Wrap standalone <table> elements in a responsive horizontal scroll container
  processed = processed.replace(
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
    (_full, rawAttrs: string, innerHtml: string) => {
      return `<div class="my-8 overflow-x-auto rounded-sm border border-[var(--sr-rule)] bg-[var(--sr-paper)]"><table${rawAttrs}>${innerHtml}</table></div>`;
    }
  );

  const headings =
    options?.explicitHeadings && options.explicitHeadings.length > 0
      ? options.explicitHeadings
      : extractedHeadings;

  return {
    html: processed,
    headings,
  };
}

export function resolveArticleHeadings(input: {
  headings?: ArticleHeadingOutlineItem[];
  bodyHtml?: string;
  blocks?: ArticleBlock[];
  sources?: PublicSource[];
}): ArticleHeadingOutlineItem[] {
  if (Array.isArray(input.headings) && input.headings.length > 0) {
    return input.headings
      .filter(
        (item) =>
          item &&
          (item.level === 2 || item.level === 3) &&
          typeof item.id === 'string' &&
          item.id.trim().length > 0 &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0
      )
      .map((item) => ({
        type: 'heading' as const,
        id: item.id.trim(),
        level: item.level,
        text: stripHtmlTags(item.text),
      }));
  }

  if (Array.isArray(input.blocks) && input.blocks.length > 0) {
    const blockHeadings = input.blocks
      .filter(
        (block): block is Extract<ArticleBlock, { type: 'heading' }> =>
          block.type === 'heading'
      )
      .map((block) => ({
        type: 'heading' as const,
        id: block.id,
        level: block.level,
        text: stripHtmlTags(block.text),
      }));
    if (blockHeadings.length > 0) {
      return blockHeadings;
    }
  }

  if (typeof input.bodyHtml === 'string' && input.bodyHtml.trim().length > 0) {
    return prepareCanonicalBodyHtml(input.bodyHtml, {
      sources: input.sources,
    }).headings;
  }

  return [];
}

// ============================================================================
// Contract v1.0.0 Validator (Pinned Web Parity + Studio Producer Strict Mode)
// ============================================================================

const VALID_LOCALES: ReadonlySet<SupportedLocale> = new Set(['en', 'tr']);
const PUBLIC_STATUSES: ReadonlySet<PublicationStatus> = new Set([
  'published',
  'demo',
]);
const NON_PUBLIC_STATUSES: ReadonlySet<PublicationStatus> = new Set([
  'draft',
  'in_review',
  'scheduled',
  'archived',
]);
const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

const UNSUPPORTED_RAW_HTML_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern:
      /<\s*(script|iframe|object|embed|applet|form|input|button|select|textarea|video|audio)\b/i,
    reason:
      'Interactive or executable HTML tag is forbidden in published snapshots',
  },
  {
    pattern: /\bsrc\s*=\s*["']\s*(blob:|data:|file:|javascript:)/i,
    reason:
      'Ephemeral or unsafe media scheme (blob:/data:/file:/javascript:) is forbidden',
  },
  {
    pattern: /\bdata-studio-(draft|unsaved|local-blob|editor-only)\b/i,
    reason: 'Unresolved Studio authoring node attribute cannot be published to Web',
  },
];

export function isSafePublishedMediaUrl(
  urlValue: string,
  trustedMediaOrigins: ReadonlySet<string> = new Set(),
  allowLoopbackHttpMediaOrigin = false
): boolean {
  if (typeof urlValue !== 'string') return false;
  const trimmed = urlValue.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    /^(blob|data|file|javascript|vbscript):/i.test(trimmed)
  ) {
    return false;
  }

  if (trimmed.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return trustedMediaOrigins.has(parsed.origin);
    return allowLoopbackHttpMediaOrigin && parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) && trustedMediaOrigins.has(parsed.origin);
  } catch {
    return false;
  }
}

function validateMediaRecord(
  media: PublicMedia,
  fieldPrefix: string,
  trustedMediaOrigins: ReadonlySet<string>,
  issues: SnapshotValidationIssue[],
  options?: ValidateSnapshotOptions
): void {
  if (!isSafePublishedMediaUrl(media.src, trustedMediaOrigins, options?.allowLoopbackHttpMediaOrigin)) {
    const previewSrc =
      typeof media.src === 'string' && media.src.length > 64
        ? `${media.src.slice(0, 64)}…`
        : media.src;
    issues.push({
      code: 'UNSAFE_MEDIA_URL',
      field: `${fieldPrefix}.src`,
      message: `Media URL "${previewSrc}" is not an approved same-origin path or trusted HTTPS origin (blob:/data: URLs are forbidden).`,
    });
  }

  if (!media.alt || !media.alt.trim()) {
    issues.push({
      code: 'INCOMPLETE_MEDIA_METADATA',
      field: `${fieldPrefix}.alt`,
      message: 'Scientific figure/media requires non-empty accessible alt text.',
    });
  }

  if (!media.caption || !media.caption.trim()) {
    issues.push({
      code: 'INCOMPLETE_MEDIA_METADATA',
      field: `${fieldPrefix}.caption`,
      message: 'Scientific figure/media requires a descriptive caption.',
    });
  }

  if (
    !media.credit ||
    !media.credit.trim() ||
    !media.license ||
    !media.license.trim()
  ) {
    issues.push({
      code: 'INCOMPLETE_MEDIA_METADATA',
      field: `${fieldPrefix}.credit`,
      message:
        'Scientific figure/media requires explicit credit and license provenance.',
    });
  }

  if (
    typeof media.width !== 'number' ||
    media.width <= 0 ||
    typeof media.height !== 'number' ||
    media.height <= 0
  ) {
    issues.push({
      code: 'INCOMPLETE_MEDIA_METADATA',
      field: `${fieldPrefix}.dimensions`,
      message:
        'Media width and height must be positive numbers to prevent layout shift.',
    });
  }

  if (options?.enforceStrictStudioPrePublish && !media.rightsVerified) {
    issues.push({
      code: 'UNVERIFIED_MEDIA_RIGHTS',
      field: `${fieldPrefix}.rightsVerified`,
      message:
        'Studio strict pre-publish policy requires media.rightsVerified === true before production export.',
    });
  }
}

export function validatePublicationSnapshotV1(
  snapshot: PublishedSnapshotRecordV1,
  options?: ValidateSnapshotOptions
): SnapshotValidationResult {
  const issues: SnapshotValidationIssue[] = [];
  const trustedOrigins = new Set(options?.trustedMediaOrigins ?? []);

  if (snapshot.contractVersion !== PUBLICATION_CONTRACT_VERSION) {
    issues.push({
      code: 'INVALID_CONTRACT_VERSION',
      field: 'contractVersion',
      message: `Expected contractVersion "${PUBLICATION_CONTRACT_VERSION}", received "${String(
        snapshot.contractVersion
      )}".`,
    });
  }

  const requiredStrings: Array<[keyof PublishedSnapshotRecordV1, string]> = [
    ['articleId', snapshot.articleId],
    ['revisionId', snapshot.revisionId],
    ['slug', snapshot.slug],
    ['title', snapshot.title],
    ['dek', snapshot.dek],
    ['summary', snapshot.summary],
    ['categorySlug', snapshot.categorySlug],
    ['publishedAt', snapshot.publishedAt],
  ];

  for (const [field, value] of requiredStrings) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      issues.push({
        code: 'MISSING_REQUIRED_FIELD',
        field: String(field),
        message: `Required snapshot field "${String(
          field
        )}" must be a non-empty string.`,
      });
    }
  }

  if (
    typeof snapshot.revisionNumber !== 'number' ||
    !Number.isInteger(snapshot.revisionNumber) ||
    snapshot.revisionNumber < 1
  ) {
    issues.push({
      code: 'INVALID_REVISION',
      field: 'revisionNumber',
      message: 'revisionNumber must be a positive integer >= 1.',
    });
  }

  if (!VALID_LOCALES.has(snapshot.locale)) {
    issues.push({
      code: 'INVALID_LOCALE',
      field: 'locale',
      message: `Unsupported locale "${String(
        snapshot.locale
      )}". Supported locales are "en" and "tr".`,
    });
  }

  if (snapshot.status === 'withdrawn') {
    issues.push({
      code: 'WITHDRAWN_ARTICLE',
      field: 'status',
      message: `Article "${snapshot.slug}" has status "withdrawn" and must not be rendered as active public content.`,
    });
  } else if (NON_PUBLIC_STATUSES.has(snapshot.status)) {
    issues.push({
      code: 'NON_PUBLIC_STATUS',
      field: 'status',
      message: `Article "${snapshot.slug}" has non-public status "${snapshot.status}" and is excluded from public rendering.`,
    });
  }

  const hasBlocks = Array.isArray(snapshot.blocks) && snapshot.blocks.length > 0;
  const hasBodyHtml =
    typeof snapshot.bodyHtml === 'string' && snapshot.bodyHtml.trim().length > 0;

  if (!hasBlocks && !hasBodyHtml) {
    issues.push({
      code: 'EMPTY_ARTICLE_BODY',
      field: 'blocks',
      message:
        'Published snapshot must contain either structured blocks or canonical bodyHtml.',
    });
  }

  if (snapshot.hero) {
    validateMediaRecord(
      snapshot.hero,
      'hero',
      trustedOrigins,
      issues,
      options
    );
  }

  const sourceIds = new Set<string>();
  for (const [idx, source] of (snapshot.sources ?? []).entries()) {
    sourceIds.add(source.id);
    if (source.isIllustrativeDemo && source.doi !== undefined) {
      issues.push({
        code: 'SYNTHETIC_DEMO_DOI_FORBIDDEN',
        field: `sources[${idx}].doi`,
        message: `Illustrative demo source "${source.id}" must not fabricate a DOI.`,
      });
    }
    if (!source.isIllustrativeDemo && source.doi !== undefined) {
      if (!DOI_REGEX.test(source.doi.trim())) {
        issues.push({
          code: 'INVALID_DOI_FORMAT',
          field: `sources[${idx}].doi`,
          message: `Source "${source.id}" has malformed DOI "${source.doi}".`,
        });
      }
    }
  }

  for (const [idx, block] of (snapshot.blocks ?? []).entries()) {
    if (block.type === 'figure') {
      validateMediaRecord(
        block.media,
        `blocks[${idx}].media`,
        trustedOrigins,
        issues,
        options
      );
    }
    if (block.type === 'paragraph' && block.citations) {
      for (const citeId of block.citations) {
        if (!sourceIds.has(citeId)) {
          issues.push({
            code: 'BROKEN_CITATION_REFERENCE',
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
          code: 'UNSUPPORTED_STUDIO_NODE',
          field: 'bodyHtml',
          message: rule.reason,
        });
      }
    }

    const citationMatches = snapshot.bodyHtml.matchAll(
      /data-citation-(?:source-)?id\s*=\s*["']([^"']+)["']/gi
    );
    for (const match of citationMatches) {
      const citedId = match[1];
      if (!sourceIds.has(citedId)) {
        issues.push({
          code: 'BROKEN_CITATION_REFERENCE',
          field: 'bodyHtml',
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
  const isPubliclyRenderable = isPublicStatus && !hasBlockingIssues;

  return {
    valid: !hasBlockingIssues,
    isPubliclyRenderable,
    isIndexableCandidate:
      snapshot.status === 'published' &&
      !snapshot.seo?.noindex &&
      !hasBlockingIssues,
    publicEligible: isPubliclyRenderable,
    issues,
    headings,
  };
}

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
    subcategorySlugs: [...(snapshot.subcategorySlugs ?? [])],
    tagSlugs: [...(snapshot.tagSlugs ?? [])],
    authorIds,
    seriesId: snapshot.seriesId,
    knowledgeLinks: snapshot.knowledgeLinks,
    publishedAt: snapshot.publishedAt,
    updatedAt: snapshot.updatedAt,
    withdrawnAt: snapshot.withdrawnAt,
    withdrawalReason: snapshot.withdrawalReason,
    readingTimeMinutes: snapshot.readingTimeMinutes,
    featuredRank: snapshot.featuredRank,
    mostReadDemoRank: snapshot.mostReadDemoRank,
    hero: snapshot.hero,
    blocks: snapshot.blocks ?? [],
    bodyHtml: snapshot.bodyHtml,
    sources: snapshot.sources ?? [],
    relatedIds: snapshot.relatedIds ?? [],
    seo: snapshot.seo,
    revisionId: snapshot.revisionId,
    revisionNumber: snapshot.revisionNumber,
    translationGroupId: snapshot.translationGroupId,
  };
}

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
    seriesId: article.seriesId,
    knowledgeLinks: article.knowledgeLinks,
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
    sources: article.sources,
    relatedIds: [...article.relatedIds],
    seo: article.seo,
  };
}

// ============================================================================
// Studio → Web Contract v1.0.0 Serializer
// ============================================================================

export interface SerializeStudioArticleParams {
  article: Article;
  categories: StudioCategory[];
  tags: StudioTag[];
  authors: StudioAuthorProfile[];
  sources: StudioScientificSource[];
  media: StudioMediaAsset[];
  knowledgeLinks?: StudioKnowledgeLink[];
  authorizationReceipt?: PublicationAuthorizationReceipt;
  blocks?: ArticleBlock[];
}

export interface SerializedStudioSnapshotOutput {
  snapshot: PublishedSnapshotRecordV1;
  validation: SnapshotValidationResult;
  strictStudioValidation: SnapshotValidationResult;
  publicReleaseAuthorized: boolean;
}

export function mapStudioStatusToWebStatus(
  studioStatus: Article['status'],
  authorizationReceipt?: PublicationAuthorizationReceipt
): PublicationStatus {
  // A caller can forge serverVerified and receiptId. Only an authenticated
  // backend can authorize a public revision (outside this Studio prototype).
  void authorizationReceipt;
  switch (studioStatus) {
    case 'published':
    case 'approved':
      return 'in_review';
    case 'in_review':
    case 'revision_requested':
      return 'in_review';
    case 'scheduled':
      return 'scheduled';
    case 'archived':
      return 'archived';
    case 'idea':
    case 'draft':
    default:
      return 'draft';
  }
}

export function deriveMediaRightsVerified(asset: StudioMediaAsset): boolean {
  const approval = asset.rightsApproval;
  const at = typeof approval?.approvedAt === 'string' ? approval.approvedAt : '';
  const parsed = new Date(at);
  return Boolean(
    typeof asset.credit === 'string' && asset.credit.trim() &&
    typeof asset.licence === 'string' && asset.licence.trim() &&
    approval?.approved === true &&
    typeof approval.approvedBy === 'string' && approval.approvedBy.trim() &&
    typeof approval.evidenceRef === 'string' && approval.evidenceRef.trim() &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(at) &&
    !Number.isNaN(parsed.getTime()) && parsed.toISOString() === at
  );
}

function estimateReadingTimeMinutes(htmlOrText: string): number {
  const plain = stripHtmlTags(htmlOrText);
  if (!plain) return 1;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function serializeKnowledgeLinks(links: StudioKnowledgeLink[] = []): PublicKnowledgeLink[] {
  return links.filter((link) => {
    if (link.reviewStatus !== 'approved' || link.isSampleDemoData) return false;
    try {
      const url = new URL(link.targetUrl, 'https://scientificradar.com');
      if (url.protocol !== 'https:' || url.username || url.password) return false;
      if (link.targetType === 'wikipedia') return /(^|\.)wikipedia\.org$/i.test(url.hostname);
      return Boolean(link.targetArticleId) && (url.hostname === 'scientificradar.com' || url.hostname.endsWith('.scientificradar.com')) && url.pathname.startsWith('/article/');
    } catch { return false; }
  }).map((link) => ({
    id: link.id,
    term: stripHtmlTags(link.term),
    targetType: link.targetType,
    targetUrl: link.targetUrl,
    ...(link.targetArticleId ? { targetArticleId: link.targetArticleId } : {}),
    locale: link.locale,
    previewTitle: stripHtmlTags(link.previewTitle),
    previewExcerpt: stripHtmlTags(link.previewExcerpt),
    sourceAttribution: stripHtmlTags(link.sourceAttribution),
    reviewStatus: 'approved',
    isSampleDemoData: false,
  }));
}

function serializeFigureBlocks(html: string, assets: StudioMediaAsset[]): ArticleBlock[] {
  const figures: ArticleBlock[] = [];
  const figureRegex = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = figureRegex.exec(html)) !== null) {
    const mediaId = /\bdata-media-id\s*=\s*['"]([^'"]+)['"]/i.exec(match[1])?.[1];
    if (!mediaId) continue;
    const asset = assets.find((item) => item.id === mediaId);
    if (!asset) continue;
    const captionHtml = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(match[2])?.[1] ?? '';
    const media: PublicMedia = {
      id: asset.id,
      src: asset.src,
      alt: stripHtmlTags(asset.altText || asset.title),
      width: asset.width > 0 ? asset.width : 1200,
      height: asset.height > 0 ? asset.height : 675,
      caption: stripHtmlTags(captionHtml || asset.caption || asset.title),
      credit: stripHtmlTags(asset.credit || ''),
      rightsVerified: deriveMediaRightsVerified(asset),
      license: stripHtmlTags(asset.licence || ''),
    };
    const layoutValue = /\bdata-(?:figure-)?layout\s*=\s*['"](wide|column)['"]/i.exec(match[1])?.[1]?.toLowerCase();
    figures.push({ type: 'figure', id: `figure-${index + 1}-${asset.id}`, media, layout: layoutValue === 'wide' ? 'wide' : 'column', figureNumber: String(index + 1) });
    index += 1;
  }
  return figures;
}

const SYNTHETIC_DEMO_DOIS = new Set([
  '10.1038/s41567-026-09912-x',
  '10.1103/physrevx.16.021044',
  '10.1038/s41586-026-08411-9',
  '10.1126/science.adp9921',
]);

export function serializeStudioArticleToSnapshotV1(
  params: SerializeStudioArticleParams
): SerializedStudioSnapshotOutput {
  const {
    article,
    categories,
    tags,
    authors,
    sources,
    media,
    knowledgeLinks,
    authorizationReceipt,
    blocks,
  } = params;

  const primaryCat =
    categories.find((c) => c.id === article.primaryCategoryId && !c.parentId) ||
    categories.find((c) => c.id === article.primaryCategoryId) || {
      id: 'cat-general-science',
      name: article.locale === 'tr' ? 'Bilim' : 'Science',
      slug: article.locale === 'tr' ? 'bilim' : 'science',
      locale: article.locale,
    };

  const subcategorySlugs = article.categoryIds
    .filter((id) => id !== primaryCat.id)
    .map((id) => categories.find((c) => c.id === id)?.slug)
    .filter((slug): slug is string => Boolean(slug));

  const tagSlugs = article.tagIds
    .map((id) => tags.find((t) => t.id === id)?.slug)
    .filter((slug): slug is string => Boolean(slug));

  const studioAuthor = authors.find((a) => a.id === article.authorId);
  const publicAuthors: PublicAuthor[] = studioAuthor
    ? [
        {
          id: studioAuthor.id,
          name: stripHtmlTags(studioAuthor.displayName),
          role:
            studioAuthor.role === 'owner'
              ? 'Editor-in-Chief'
              : studioAuthor.role === 'editor'
              ? 'Senior Science Editor'
              : studioAuthor.role === 'reviewer'
              ? 'Scientific Reviewer'
              : 'Staff Science Writer',
          credentialsNote: stripHtmlTags(
            studioAuthor.affiliation || 'ScientificRadar Editorial Desk'
          ),
          bio: stripHtmlTags(
            studioAuthor.biography ||
              'ScientificRadar contributor covering peer-reviewed research.'
          ),
          isDemoPersona: false,
        },
      ]
    : [
        {
          id: 'author-editorial-desk',
          name: 'ScientificRadar Editorial Desk',
          role: 'Editorial Desk',
          credentialsNote: 'ScientificRadar',
          bio: 'Editorial science desk at ScientificRadar.',
          isDemoPersona: true,
        },
      ];

  // Collect all referenced sources in citation order followed by uncited attached sources
  const orderedSourceIds: string[] = [];
  const seenSourceIds = new Set<string>();
  const citeRegex = /data-citation-(?:source-)?id=["']([^"']+)["']/gi;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = citeRegex.exec(article.bodyHtml || '')) !== null) {
    const id = sMatch[1];
    if (id && !seenSourceIds.has(id)) {
      seenSourceIds.add(id);
      orderedSourceIds.push(id);
    }
  }
  for (const id of article.sourceIds) {
    if (!seenSourceIds.has(id)) {
      seenSourceIds.add(id);
      orderedSourceIds.push(id);
    }
  }

  const publicSources: PublicSource[] = [];
  orderedSourceIds.forEach((sourceId) => {
    const src = sources.find((s) => s.id === sourceId);
    if (!src) return;
    const labelNumber = String(publicSources.length + 1);
    const trimmedDoi = src.doi?.trim();
    const isSyntheticDemo = Boolean(
      trimmedDoi &&
        (SYNTHETIC_DEMO_DOIS.has(trimmedDoi.toLowerCase()) ||
          /\/(?:demo|example|sample|test|placeholder|fake)\b/i.test(trimmedDoi))
    );

    publicSources.push({
      id: src.id,
      label: labelNumber,
      title: stripHtmlTags(src.title),
      authors: stripHtmlTags(src.authors),
      publication: stripHtmlTags(src.journal),
      year: String(src.year),
      href: src.url?.trim() || undefined,
      // Per Web contract v1.0.0: illustrative demo sources must NOT carry a synthetic DOI
      ...(trimmedDoi && !isSyntheticDemo ? { doi: trimmedDoi } : {}),
      isIllustrativeDemo: isSyntheticDemo,
    });
  });

  const featuredAsset = article.featuredMediaId
    ? media.find((m) => m.id === article.featuredMediaId)
    : undefined;

  const heroMedia: PublicMedia | undefined = featuredAsset
    ? {
        id: featuredAsset.id,
        src: featuredAsset.src,
        alt: stripHtmlTags(featuredAsset.altText || featuredAsset.title),
        caption: stripHtmlTags(featuredAsset.caption || featuredAsset.title),
        credit: stripHtmlTags(featuredAsset.credit || ''),
        license: stripHtmlTags(featuredAsset.licence || ''),
        width: featuredAsset.width > 0 ? featuredAsset.width : 1200,
        height: featuredAsset.height > 0 ? featuredAsset.height : 675,
        rightsVerified: deriveMediaRightsVerified(featuredAsset),
      }
    : undefined;

  const sanitizedBodyHtml = sanitizeCanonicalBodyHtml(article.bodyHtml || '');
  const preparedBody = prepareCanonicalBodyHtml(sanitizedBodyHtml, {
    sources: publicSources,
  });

  const webStatus = mapStudioStatusToWebStatus(
    article.status,
    authorizationReceipt
  );
  const publicReleaseAuthorized = webStatus === 'published';

  const cleanTitle = stripHtmlTags(article.title);
  const cleanSummary = stripHtmlTags(article.summary);
  const cleanDek = stripHtmlTags(article.dek || article.summary);
  // Verified Web route is /article/[slug], not /{locale}/{category}/{slug}.
  const canonicalUrl = `https://scientificradar.com/article/${encodeURIComponent(article.slug)}`;

  const serializedBlocks = blocks ?? serializeFigureBlocks(sanitizedBodyHtml, media);
  const snapshot: PublishedSnapshotRecordV1 = {
    contractVersion: PUBLICATION_CONTRACT_VERSION,
    articleId: article.id,
    revisionId: `rev-${article.id}-${article.locale}-v${article.version}`,
    revisionNumber: Math.max(1, article.version || 1),
    slug: article.slug,
    locale: article.locale,
    translationGroupId: article.translationGroupId || `tg-${article.id}`,
    editorialType: article.editorialType || 'research-digest',
    status: webStatus,
    title: cleanTitle,
    dek: cleanDek,
    summary: cleanSummary,
    categorySlug: primaryCat.slug,
    subcategorySlugs,
    tagSlugs: tagSlugs.length > 0 ? tagSlugs : [primaryCat.slug],
    authorIds: publicAuthors.map((a) => a.id),
    ...(article.seriesId ? { seriesId: article.seriesId } : {}),
    ...(knowledgeLinks?.length ? { knowledgeLinks: serializeKnowledgeLinks(knowledgeLinks) } : {}),
    authors: publicAuthors,
    publishedAt: article.publishedAt || article.updatedAt || article.createdAt,
    updatedAt: article.updatedAt || article.createdAt,
    readingTimeMinutes: estimateReadingTimeMinutes(
      article.bodyHtml || cleanSummary
    ),
    ...(heroMedia ? { hero: heroMedia } : {}),
    blocks: serializedBlocks,
    ...(sanitizedBodyHtml ? { bodyHtml: sanitizedBodyHtml } : {}),
    headings: preparedBody.headings,
    sources: publicSources,
    relatedIds: [],
    seo: {
      title: stripHtmlTags(article.seo?.title || cleanTitle),
      description: stripHtmlTags(article.seo?.description || cleanSummary),
      canonicalUrl,
      noindex: publicReleaseAuthorized ? Boolean(article.seo?.noindex) : true,
    },
  };

  const validation = validatePublicationSnapshotV1(snapshot, {
    enforceStrictStudioPrePublish: false,
  });
  const strictStudioValidation = validatePublicationSnapshotV1(snapshot, {
    enforceStrictStudioPrePublish: true,
  });

  return {
    snapshot,
    validation,
    strictStudioValidation,
    publicReleaseAuthorized,
  };
}
