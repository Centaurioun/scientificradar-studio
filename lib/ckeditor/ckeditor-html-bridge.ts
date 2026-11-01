import { sanitizeEditorialHtml } from '@/lib/html-security';
import {
  deriveCanonicalBodyJsonFromHtml,
  extractScientificSemanticsFromHtml,
  ManuscriptSemanticSignature,
} from '@/lib/html-source';
import { extractDelimiters, validateAndRenderKatex } from './ckeditor5-math/utils';

export interface CkeditorPreparedHtmlResult {
  html: string;
  ckeditorHtml: string;
  demotedH1Count: number;
  removedUnsafeCount: number;
  convertedLegacyMathCount: number;
}

export interface CkeditorCanonicalizedDataResult {
  html: string;
  sanitizedHtml: string;
  bodyJson: Record<string, unknown>;
  demotedH1Count: number;
  demotedCount: number;
  removedUnsafeCount: number;
  semantics: ManuscriptSemanticSignature;
}

export interface SemanticFidelityComparison {
  aligned: boolean;
  matches: boolean;
  before: ManuscriptSemanticSignature;
  after: ManuscriptSemanticSignature;
  differences: string[];
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Converts legacy CKEditor Math `<script type="math/tex">`, `<script type="math/tex; mode=display">`,
 * `<span class="math-tex">\( ... \)</span>`, `<span class="math-tex">\[ ... \]</span>`, and Quill
 * `<span class="ql-formula" data-value="...">` into ScientificRadar's canonical `data-math-tex` /
 * `data-math-display` elements BEFORE DOMPurify strips `<script>` tags.
 *
 * Security rule: executable `<script>` tags (anything other than exact `type="math/tex"` or
 * `type="math/tex; mode=display"`) are NEVER converted and are stripped by `sanitizeEditorialHtml`.
 */
export function convertLegacyMathMarkupToCanonical(rawHtml: string): {
  html: string;
  convertedCount: number;
} {
  let convertedCount = 0;
  let working = typeof rawHtml === 'string' ? rawHtml : '';

  // 1. <script type="math/tex; mode=display">...</script> -> <div data-math-tex="..." data-math-display="block">\[...\]</div>
  working = working.replace(
    /<script\b[^>]*\btype\s*=\s*["']math\/tex\s*;\s*mode\s*=\s*display["'][^>]*>([\s\S]*?)<\/script>/gi,
    (_match, innerTex) => {
      const tex = decodeBasicEntities(String(innerTex || '')).trim();
      if (!tex || /<[a-z!/]/i.test(tex)) return '';
      convertedCount += 1;
      const escaped = escapeHtmlAttr(tex);
      return `<div data-math-tex="${escaped}" data-math-display="block">\\[${escaped}\\]</div>`;
    }
  );

  // 2. <script type="math/tex">...</script> -> <span data-math-tex="..." data-math-display="inline">\(...\)</span>
  working = working.replace(
    /<script\b[^>]*\btype\s*=\s*["']math\/tex["'][^>]*>([\s\S]*?)<\/script>/gi,
    (_match, innerTex) => {
      const tex = decodeBasicEntities(String(innerTex || '')).trim();
      if (!tex || /<[a-z!/]/i.test(tex)) return '';
      convertedCount += 1;
      const escaped = escapeHtmlAttr(tex);
      return `<span data-math-tex="${escaped}" data-math-display="inline">\\(${escaped}\\)</span>`;
    }
  );

  // 3. <span class="...math-tex...">\( ... \) or \[ ... \]</span> without data-math-tex
  working = working.replace(
    /<(span|div)\b([^>]*\bclass\s*=\s*["'][^"']*\bmath-tex\b[^"']*["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (fullMatch, tag, attrs, innerText) => {
      if (/\bdata-math-tex\s*=/i.test(attrs)) {
        const displayMatch = /\bdata-math-display\s*=\s*["'](block|inline)["']/i.exec(attrs);
        const texMatch = /\bdata-math-tex\s*=\s*["']([^"']*)["']/i.exec(attrs);
        if (texMatch) {
          const tex = decodeBasicEntities(texMatch[1]).trim();
          const escaped = escapeHtmlAttr(tex);
          const isBlock =
            (displayMatch && displayMatch[1].toLowerCase() === 'block') ||
            String(tag).toLowerCase() === 'div';
          if (isBlock) {
            return `<div data-math-tex="${escaped}" data-math-display="block">\\[${escaped}\\]</div>`;
          }
          return `<span data-math-tex="${escaped}" data-math-display="inline">\\(${escaped}\\)</span>`;
        }
        return fullMatch;
      }
      const rawInner = decodeBasicEntities(String(innerText || '').replace(/<[^>]+>/g, '')).trim();
      if (!rawInner) return fullMatch;
      const extracted = extractDelimiters(rawInner);
      if (!extracted.equation) return fullMatch;
      convertedCount += 1;
      const escaped = escapeHtmlAttr(extracted.equation);
      if (extracted.display || String(tag).toLowerCase() === 'div') {
        return `<div data-math-tex="${escaped}" data-math-display="block">\\[${escaped}\\]</div>`;
      }
      return `<span data-math-tex="${escaped}" data-math-display="inline">\\(${escaped}\\)</span>`;
    }
  );

  // 4. Quill <span class="ql-formula" data-value="...">
  working = working.replace(
    /<span\b[^>]*\bclass\s*=\s*["'][^"']*\bql-formula\b[^"']*["'][^>]*\bdata-value\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/gi,
    (_match, val) => {
      const tex = decodeBasicEntities(String(val || '')).trim();
      if (!tex) return '';
      convertedCount += 1;
      const escaped = escapeHtmlAttr(tex);
      return `<span data-math-tex="${escaped}" data-math-display="inline">\\(${escaped}\\)</span>`;
    }
  );

  return { html: working, convertedCount };
}

/**
 * Unwraps CKEditor 5 `<figure class="table"><table>...</table><figcaption>...</figcaption></figure>`
 * into ScientificRadar's canonical `<table><caption>...</caption>...</table>`.
 */
export function normalizeCkeditorTableFigures(rawHtml: string): string {
  let working = typeof rawHtml === 'string' ? rawHtml : '';

  working = working.replace(
    /<figure\b([^>]*)>\s*(<table\b[^>]*>[\s\S]*?<\/table>)\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>\s*)?<\/figure>/gi,
    (fullMatch, figAttrs, tableHtml, figCaptionInner) => {
      // Do not touch genuine scientific media figures
      if (/\bdata-media-id\s*=/i.test(figAttrs)) {
        return fullMatch;
      }
      const captionText = typeof figCaptionInner === 'string' ? figCaptionInner.trim() : '';
      if (!captionText || /<caption\b/i.test(tableHtml)) {
        return tableHtml;
      }
      return tableHtml.replace(
        /^<table\b([^>]*)>/i,
        `<table$1><caption>${captionText}</caption>`
      );
    }
  );

  return working;
}

/**
 * Maps CKEditor inline `style="...text-align: center..."` on block/table elements to `data-text-align`.
 */
export function normalizeInlineTextAlignStyles(rawHtml: string): string {
  return (rawHtml || '').replace(
    /<(p|h1|h2|h3|h4|td|th|caption)\b([^>]*?)\bstyle=["'][^"']*text-align\s*:\s*(left|center|right|justify)\b[^"']*["']([^>]*)>/gi,
    (_match, tag, before, align, after) => {
      const combinedAttrs = `${before}${after}`;
      if (/\bdata-text-align\s*=/i.test(combinedAttrs)) {
        return `<${tag}${combinedAttrs}>`;
      }
      return `<${tag}${before} data-text-align="${align.toLowerCase()}"${after}>`;
    }
  );
}

/**
 * Strips CKEditor's single `&nbsp;` filler from otherwise empty table cells and paragraphs.
 */
export function cleanCkeditorPlaceholderNbsp(rawHtml: string): string {
  return (rawHtml || '')
    .replace(/<(th|td)\b([^>]*)>\s*(?:&nbsp;|\u00a0)\s*<\/\1>/gi, '<$1$2></$1>')
    .replace(/<p\b([^>]*)>\s*(?:&nbsp;|\u00a0)\s*<\/p>/gi, '<p$1></p>');
}

/**
 * Prepares stored or pasted HTML for loading into CKEditor 5 while preserving all scientific attributes
 * and converting legacy `<script type="math/tex">` / `<span class="math-tex">` equations safely.
 */
export function prepareCanonicalHtmlForCkeditor(
  rawHtml: string,
  trustedImageSources?: ReadonlySet<string>
): CkeditorPreparedHtmlResult {
  const mathConverted = convertLegacyMathMarkupToCanonical(rawHtml || '<p></p>');
  const tableNormalized = normalizeCkeditorTableFigures(mathConverted.html);
  const alignNormalized = normalizeInlineTextAlignStyles(tableNormalized);

  const sanitized = sanitizeEditorialHtml(alignNormalized, {
    demoteBodyH1: true,
    trustedImageSources,
  });

  const outHtml = sanitized.html || '<p></p>';
  return {
    html: outHtml,
    ckeditorHtml: outHtml,
    demotedH1Count: sanitized.demotedH1Count,
    removedUnsafeCount: sanitized.removedUnsafeCount,
    convertedLegacyMathCount: mathConverted.convertedCount,
  };
}

/**
 * Converts CKEditor 5 `editor.getData()` HTML output into ScientificRadar's canonical sanitized
 * `bodyHtml` and derives a semantically synchronized ProseMirror `body` JSON document.
 *
 * Inviolable rule: CKEditor's internal model is NEVER saved as `article.body`.
 */
export function canonicalizeCkeditorDataHtml(
  ckDataHtml: string,
  trustedImageSources?: ReadonlySet<string>
): CkeditorCanonicalizedDataResult {
  const mathConverted = convertLegacyMathMarkupToCanonical(ckDataHtml || '<p></p>');
  const tableNormalized = normalizeCkeditorTableFigures(mathConverted.html);
  const alignNormalized = normalizeInlineTextAlignStyles(tableNormalized);
  const nbspCleaned = cleanCkeditorPlaceholderNbsp(alignNormalized);

  const sanitized = sanitizeEditorialHtml(nbspCleaned, {
    demoteBodyH1: true,
    trustedImageSources,
  });

  const canonicalHtml = sanitized.html || '<p></p>';
  const bodyJson = deriveCanonicalBodyJsonFromHtml(canonicalHtml);
  const semantics = extractScientificSemanticsFromHtml(canonicalHtml);

  return {
    html: canonicalHtml,
    sanitizedHtml: canonicalHtml,
    bodyJson,
    demotedH1Count: sanitized.demotedH1Count,
    demotedCount: sanitized.demotedH1Count,
    removedUnsafeCount: sanitized.removedUnsafeCount,
    semantics,
  };
}

/**
 * Compares two HTML representations of a scientific manuscript and reports any semantic differences
 * across headings, citations, figures, equations, tables, code blocks, and prose text.
 */
export function compareEditorSemanticFidelity(
  beforeHtml: string,
  afterHtml: string
): SemanticFidelityComparison {
  const before = extractScientificSemanticsFromHtml(beforeHtml);
  const after = extractScientificSemanticsFromHtml(afterHtml);
  const differences: string[] = [];

  if (before.plainText !== after.plainText) {
    differences.push(`Prose text changed: "${before.plainText}" -> "${after.plainText}"`);
  }
  if (JSON.stringify(before.headings) !== JSON.stringify(after.headings)) {
    differences.push(
      `Headings changed: ${JSON.stringify(before.headings)} -> ${JSON.stringify(after.headings)}`
    );
  }
  if (JSON.stringify(before.citationSourceIds) !== JSON.stringify(after.citationSourceIds)) {
    differences.push(
      `Citations changed: ${JSON.stringify(before.citationSourceIds)} -> ${JSON.stringify(after.citationSourceIds)}`
    );
  }
  if (JSON.stringify(before.figureAssets) !== JSON.stringify(after.figureAssets)) {
    differences.push(
      `Figures changed: ${JSON.stringify(before.figureAssets)} -> ${JSON.stringify(after.figureAssets)}`
    );
  }
  if (JSON.stringify(before.mathExpressions) !== JSON.stringify(after.mathExpressions)) {
    differences.push(
      `Equations changed: ${JSON.stringify(before.mathExpressions)} -> ${JSON.stringify(after.mathExpressions)}`
    );
  }
  if (before.tableCount !== after.tableCount) {
    differences.push(`Table count changed: ${before.tableCount} -> ${after.tableCount}`);
  }
  if (JSON.stringify(before.tableCaptions) !== JSON.stringify(after.tableCaptions)) {
    differences.push(
      `Table captions changed: ${JSON.stringify(before.tableCaptions)} -> ${JSON.stringify(after.tableCaptions)}`
    );
  }
  if (JSON.stringify(before.codeBlocks) !== JSON.stringify(after.codeBlocks)) {
    differences.push(
      `Code blocks changed: ${JSON.stringify(before.codeBlocks)} -> ${JSON.stringify(after.codeBlocks)}`
    );
  }

  const isAligned = differences.length === 0;
  return {
    aligned: isAligned,
    matches: isAligned,
    before,
    after,
    differences,
  };
}

export { validateAndRenderKatex };
