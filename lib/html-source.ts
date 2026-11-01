import { sanitizeEditorialHtml } from './html-security';
import { parseAndRenderLatex } from './latex-math';

export interface HtmlSourceDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'UNBALANCED_MARKUP'
    | 'UNSUPPORTED_TAG'
    | 'UNSUPPORTED_ATTR'
    | 'UNSAFE_STRIPPED'
    | 'BODY_H1_DEMOTED'
    | 'INVALID_LATEX'
    | 'SCIENTIFIC_NODE_LOSS';
  message: string;
}

export interface HtmlSourceValidationResult {
  validSyntax: boolean;
  canApplyCleanly: boolean;
  requiresNormalizationConfirm: boolean;
  sanitizedHtml: string;
  demotedH1Count: number;
  removedUnsafeCount: number;
  unsupportedTags: string[];
  unsupportedAttrs: string[];
  diagnostics: HtmlSourceDiagnostic[];
}

const VISUAL_SCHEMA_SUPPORTED_TAGS = new Set([
  'p',
  'h1', // Demoted to h2 with warning
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'sub',
  'sup',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'hr',
  'br',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'span',
  'div',
  'small',
]);

const DANGEROUS_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'style',
  'link',
  'meta',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'svg',
  'math',
]);

const SUPPORTED_ATTRS = new Set([
  'alt',
  'colspan',
  'height',
  'href',
  'id',
  'rel',
  'rowspan',
  'scope',
  'src',
  'start',
  'target',
  'title',
  'value',
  'width',
  'data-knowledge-term',
  'data-text-align',
  'data-math-tex',
  'data-math-display',
  'data-citation-source-id',
  'data-media-id',
  'data-figure-layout',
  'data-figure-credit',
  'data-figure-licence',
  'data-figure-source-url',
]);

const VOID_TAGS = new Set(['br', 'hr', 'img']);

/**
 * Checks for basic unbalanced HTML tags in raw source before applying.
 */
export function detectUnbalancedHtmlTags(rawHtml: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*?(\/?)>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(rawHtml)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    const selfClosing = match[2] === '/' || VOID_TAGS.has(tag);
    const isClosing = full.startsWith('</');

    if (selfClosing && !isClosing) {
      continue;
    }

    if (!isClosing) {
      stack.push(tag);
    } else {
      if (stack.length === 0) {
        errors.push(`Unexpected closing tag </${tag}> with no matching opening tag.`);
      } else {
        const last = stack[stack.length - 1];
        if (last === tag) {
          stack.pop();
        } else {
          errors.push(`Mismatched closing tag </${tag}> (expected </${last}>).`);
          const idx = stack.lastIndexOf(tag);
          if (idx !== -1) {
            stack.splice(idx);
          }
        }
      }
    }
  }

  for (const unclosed of stack) {
    errors.push(`Unclosed tag <${unclosed}>.`);
  }

  return errors;
}

function countPatternMatches(html: string, regex: RegExp): number {
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Detects whether any semantic scientific nodes or attributes were lost during sanitization/normalization.
 */
function detectScientificConstructLosses(rawHtml: string, sanitizedHtml: string): string[] {
  const checks: Array<{ label: string; pattern: RegExp }> = [
    { label: '<table>', pattern: /<table\b/gi },
    { label: '<tr>', pattern: /<tr\b/gi },
    { label: '<th>', pattern: /<th\b/gi },
    { label: '<td>', pattern: /<td\b/gi },
    { label: '<caption>', pattern: /<caption\b/gi },
    { label: '<figure>', pattern: /<figure\b/gi },
    { label: '<figcaption>', pattern: /<figcaption\b/gi },
    { label: '<img>', pattern: /<img\b/gi },
    { label: 'img[src]', pattern: /<img\b[^>]*\bsrc\s*=\s*["'][^"']+["']/gi },
    { label: '<pre>', pattern: /<pre\b/gi },
    { label: '<code>', pattern: /<code\b/gi },
    { label: 'data-math-tex', pattern: /\bdata-math-tex\s*=\s*["'][^"']+["']/gi },
    { label: 'data-citation-source-id', pattern: /\bdata-citation-source-id\s*=\s*["'][^"']+["']/gi },
    { label: 'data-media-id', pattern: /\bdata-media-id\s*=\s*["'][^"']+["']/gi },
  ];

  const losses: string[] = [];
  for (const check of checks) {
    const beforeCount = countPatternMatches(rawHtml, check.pattern);
    const afterCount = countPatternMatches(sanitizedHtml, check.pattern);
    if (beforeCount > afterCount) {
      losses.push(`${check.label} (${beforeCount} → ${afterCount})`);
    }
  }
  return losses;
}

/**
 * Validates raw body HTML source against the shared editorial HTML contract and
 * detects any unsupported tags/attributes or scientific construct losses that would occur on round-trip (SRS-HTML-001/002/003).
 */
export function validateAndAnalyzeHtmlSource(
  rawHtml: string,
  trustedImageSources?: ReadonlySet<string>
): HtmlSourceValidationResult {
  const input = typeof rawHtml === 'string' ? rawHtml : '';
  const diagnostics: HtmlSourceDiagnostic[] = [];
  const unsupportedTagSet = new Set<string>();
  const unsupportedAttrSet = new Set<string>();

  const unbalancedErrors = detectUnbalancedHtmlTags(input);
  for (const err of unbalancedErrors) {
    diagnostics.push({
      severity: 'error',
      code: 'UNBALANCED_MARKUP',
      message: err,
    });
  }

  // Inspect raw tags and attributes before DOMPurify strips them
  const openTagRegex = /<([a-zA-Z][a-zA-Z0-9:-]*)\b([^>]*)>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = openTagRegex.exec(input)) !== null) {
    const tag = tagMatch[1].toLowerCase();
    const attrChunk = tagMatch[2] || '';

    if (!VISUAL_SCHEMA_SUPPORTED_TAGS.has(tag) && !DANGEROUS_TAGS.has(tag)) {
      unsupportedTagSet.add(tag);
    }

    const attrRegex = /\b([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*(?:=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrChunk)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      if (attrName.startsWith('on') || attrName === 'style') continue; // Flagged as unsafe/stripped
      if (!SUPPORTED_ATTRS.has(attrName)) {
        unsupportedAttrSet.add(`${tag}[${attrName}]`);
      }
    }
  }

  const sanitized = sanitizeEditorialHtml(input, {
    demoteBodyH1: true,
    trustedImageSources,
  });

  if (sanitized.demotedH1Count > 0) {
    diagnostics.push({
      severity: 'info',
      code: 'BODY_H1_DEMOTED',
      message: `${sanitized.demotedH1Count} body <h1> heading(s) will be normalized to <h2> so the Article Title remains the sole rendered H1.`,
    });
  }

  if (sanitized.removedUnsafeCount > 0) {
    diagnostics.push({
      severity: 'warning',
      code: 'UNSAFE_STRIPPED',
      message: `${sanitized.removedUnsafeCount} unsafe or disallowed HTML element(s)/attribute(s) (e.g. script, inline style, event handlers) will be stripped by the security sanitizer.`,
    });
  }

  const unsupportedTags = Array.from(unsupportedTagSet);
  if (unsupportedTags.length > 0) {
    diagnostics.push({
      severity: 'warning',
      code: 'UNSUPPORTED_TAG',
      message: `Unsupported HTML tag(s) detected (${unsupportedTags.map((t) => `<${t}>`).join(', ')}). Switching to Visual Editor will normalize or unwrap these elements.`,
    });
  }

  const unsupportedAttrs = Array.from(unsupportedAttrSet);
  if (unsupportedAttrs.length > 0) {
    diagnostics.push({
      severity: 'warning',
      code: 'UNSUPPORTED_ATTR',
      message: `Unsupported attribute(s) detected (${unsupportedAttrs.join(', ')}). Only canonical editorial attributes are preserved.`,
    });
  }

  const constructLosses = detectScientificConstructLosses(input, sanitized.html);
  if (constructLosses.length > 0) {
    diagnostics.push({
      severity: 'warning',
      code: 'SCIENTIFIC_NODE_LOSS',
      message: `Applying this source would drop or strip scientific construct(s): ${constructLosses.join(', ')}. Confirm normalization or fix the attributes before applying.`,
    });
  }

  // Validate any embedded data-math-tex expressions
  const mathRegex = /\bdata-math-tex=["']([^"']*)["']/gi;
  let mathMatch: RegExpExecArray | null;
  while ((mathMatch = mathRegex.exec(input)) !== null) {
    const tex = decodeHtmlEntities(mathMatch[1]);
    const check = validateAndRenderLatex(tex, 'inline');
    if (!check.valid) {
      diagnostics.push({
        severity: 'error',
        code: 'INVALID_LATEX',
        message: `Invalid LaTeX in data-math-tex="${tex}": ${check.error}`,
      });
    }
  }

  const hasSyntaxError = diagnostics.some((d) => d.severity === 'error');
  const requiresNormalizationConfirm =
    !hasSyntaxError &&
    (unsupportedTags.length > 0 ||
      unsupportedAttrs.length > 0 ||
      sanitized.removedUnsafeCount > 0 ||
      constructLosses.length > 0);

  return {
    validSyntax: !hasSyntaxError,
    canApplyCleanly: !hasSyntaxError && !requiresNormalizationConfirm,
    requiresNormalizationConfirm,
    sanitizedHtml: sanitized.html,
    demotedH1Count: sanitized.demotedH1Count,
    removedUnsafeCount: sanitized.removedUnsafeCount,
    unsupportedTags,
    unsupportedAttrs,
    diagnostics,
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Formats body HTML source into readable multi-line indentation without altering inline text spacing
 * or stripping whitespace/indentation inside <pre><code> blocks.
 */
export function formatEditorialHtmlSource(rawHtml: string): string {
  const trimmed = (rawHtml || '').trim();
  if (!trimmed) return '<p></p>';

  // Protect <pre>...</pre> blocks so internal newlines and leading/trailing spaces are never altered
  const preBlocks: string[] = [];
  const protectedHtml = trimmed.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const idx = preBlocks.length;
    preBlocks.push(match);
    return `<div data-pre-placeholder="${idx}"></div>`;
  });

  const blockBoundary =
    /(<\/?(?:p|h1|h2|h3|h4|ul|ol|li|blockquote|table|thead|tbody|tfoot|tr|th|td|caption|figure|figcaption|hr|div)\b[^>]*>)/gi;

  const tokens = protectedHtml
    .replace(/>\s+</g, '><')
    .split(blockBoundary)
    .map((t) => t.trim())
    .filter(Boolean);

  let indent = 0;
  const lines: string[] = [];
  const containerTags = new Set([
    'ul',
    'ol',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'figure',
  ]);

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const closeMatch = /^<\/([a-z0-9]+)\b/i.exec(token);
    const openMatch = /^<([a-z0-9]+)\b[^>]*>$/i.exec(token);

    if (closeMatch) {
      const tag = closeMatch[1].toLowerCase();
      if (containerTags.has(tag)) {
        indent = Math.max(0, indent - 1);
      }
      lines.push(`${'  '.repeat(indent)}${token}`);
    } else if (openMatch) {
      const tag = openMatch[1].toLowerCase();
      if (VOID_TAGS.has(tag)) {
        lines.push(`${'  '.repeat(indent)}${token}`);
      } else if (containerTags.has(tag)) {
        lines.push(`${'  '.repeat(indent)}${token}`);
        indent += 1;
      } else {
        // Leaf block like <p>, <h2>, <h3>, <li>, <th>, <td>, <caption>, <figcaption>
        const nextToken = tokens[i + 1];
        const nextClose = tokens[i + 2];
        if (
          nextToken &&
          !nextToken.startsWith('<') &&
          nextClose &&
          nextClose.toLowerCase() === `</${tag}>`
        ) {
          lines.push(`${'  '.repeat(indent)}${token}${nextToken}${nextClose}`);
          i += 2;
        } else if (nextToken && nextToken.toLowerCase() === `</${tag}>`) {
          lines.push(`${'  '.repeat(indent)}${token}${nextToken}`);
          i += 1;
        } else {
          lines.push(`${'  '.repeat(indent)}${token}`);
        }
      }
    } else {
      lines.push(`${'  '.repeat(indent)}${token}`);
    }
  }

  const joined = lines.join('\n');
  return joined.replace(
    /<div data-pre-placeholder="(\d+)"><\/div>/g,
    (_, idxStr) => preBlocks[Number(idxStr)] || ''
  );
}

export interface LatexRenderResult {
  valid: boolean;
  renderedText: string;
  renderedHtml: string;
  error?: string;
}

/**
 * Validates a LaTeX expression and renders both a safe 2D mathematical HTML layout (`renderedHtml`)
 * and deterministic typographic text (`renderedText`) without executing arbitrary HTML/JS (`trust: false`)
 * or requiring external network fonts (SRS-MATH-001/002).
 */
export function validateAndRenderLatex(
  rawTex: string,
  displayMode: 'inline' | 'block' = 'inline'
): LatexRenderResult {
  const res = parseAndRenderLatex(rawTex, displayMode);
  return {
    valid: res.valid,
    renderedText: res.renderedText,
    renderedHtml: res.renderedHtml,
    error: res.error,
  };
}

export interface ManuscriptSemanticSignature {
  plainText: string;
  headings: Array<{ level: number; text: string }>;
  citationSourceIds: string[];
  figureAssets: Array<{ mediaId: string; credit: string; licence: string; caption: string }>;
  mathExpressions: Array<{ display: 'inline' | 'block'; tex: string }>;
  tableCount: number;
  tableCaptions: string[];
  codeBlocks: string[];
}

function stripTagsAndDecode(raw: string): string {
  return decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAttr(attrsChunk: string, attrName: string): string {
  const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`, 'i');
  const match = regex.exec(attrsChunk);
  if (!match) return '';
  return decodeHtmlEntities(match[1] ?? match[2] ?? match[3] ?? '');
}

/**
 * Extracts a portable, editor-agnostic scientific semantic signature from canonical body HTML.
 */
export function extractScientificSemanticsFromHtml(html: string): ManuscriptSemanticSignature {
  const source = typeof html === 'string' ? html : '';
  const headings: Array<{ level: number; text: string }> = [];
  const citationSourceIds: string[] = [];
  const figureAssets: Array<{ mediaId: string; credit: string; licence: string; caption: string }> = [];
  const mathExpressions: Array<{ display: 'inline' | 'block'; tex: string }> = [];
  const tableCaptions: string[] = [];
  const codeBlocks: string[] = [];

  const headingRegex = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(source)) !== null) {
    headings.push({
      level: Number(match[1]),
      text: stripTagsAndDecode(match[2]),
    });
  }

  const citeRegex = /\bdata-citation-source-id\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  while ((match = citeRegex.exec(source)) !== null) {
    citationSourceIds.push(decodeHtmlEntities(match[1] ?? match[2] ?? ''));
  }

  const figureRegex = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi;
  while ((match = figureRegex.exec(source)) !== null) {
    const attrs = match[1] || '';
    const inner = match[2] || '';
    const mediaId = extractAttr(attrs, 'data-media-id');
    const credit = extractAttr(attrs, 'data-figure-credit');
    const licence = extractAttr(attrs, 'data-figure-licence');
    const capMatch = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner);
    const caption = capMatch ? stripTagsAndDecode(capMatch[1]) : '';
    if (mediaId || caption || credit || licence) {
      figureAssets.push({ mediaId, credit, licence, caption });
    }
  }

  const mathRegex = /<(span|div)\b([^>]*\bdata-math-tex\s*=\s*(?:"[^"]*"|'[^']*')[^>]*)>/gi;
  while ((match = mathRegex.exec(source)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const tex = extractAttr(attrs, 'data-math-tex').trim();
    const displayAttr = extractAttr(attrs, 'data-math-display');
    const display: 'inline' | 'block' =
      displayAttr === 'block' || tag === 'div' ? 'block' : 'inline';
    mathExpressions.push({ display, tex });
  }

  const tableCount = countPatternMatches(source, /<table\b/gi);

  const captionRegex = /<caption\b[^>]*>([\s\S]*?)<\/caption>/gi;
  while ((match = captionRegex.exec(source)) !== null) {
    tableCaptions.push(stripTagsAndDecode(match[1]));
  }

  const codeBlockRegex = /<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;
  while ((match = codeBlockRegex.exec(source)) !== null) {
    codeBlocks.push(decodeHtmlEntities(match[1]));
  }

  const proseOnlyHtml = source
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<div\b[^>]*\bdata-math-tex\b[^>]*>[\s\S]*?<\/div>/gi, ' ')
    .replace(/<span\b[^>]*\bdata-math-tex\b[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<sup\b[^>]*\bdata-citation-source-id\b[^>]*>[\s\S]*?<\/sup>/gi, ' ');

  const plainText = stripTagsAndDecode(proseOnlyHtml);

  return {
    plainText,
    headings,
    citationSourceIds,
    figureAssets,
    mathExpressions,
    tableCount,
    tableCaptions,
    codeBlocks,
  };
}

function collectJsonRawText(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }
  const content = Array.isArray(node.content) ? (node.content as Array<Record<string, unknown>>) : [];
  return content.map(collectJsonRawText).join('');
}

function collectJsonProseText(node: Record<string, unknown>): string {
  const type = String(node.type || '');
  if (
    type === 'scientificCitation' ||
    type === 'scientificMathInline' ||
    type === 'scientificMathBlock' ||
    type === 'scientificFigure'
  ) {
    return '';
  }
  if (type === 'text' && typeof node.text === 'string') {
    return node.text;
  }
  const content = Array.isArray(node.content) ? (node.content as Array<Record<string, unknown>>) : [];
  const sep =
    type === 'paragraph' ||
    type === 'heading' ||
    type === 'tableCell' ||
    type === 'tableHeader' ||
    type === 'tableCaption' ||
    type === 'listItem'
      ? ''
      : ' ';
  return content.map(collectJsonProseText).filter(Boolean).join(sep);
}

/**
 * Extracts a portable scientific semantic signature from a ProseMirror/Tiptap JSON document.
 */
export function extractScientificSemanticsFromJson(
  doc: Record<string, unknown> | undefined
): ManuscriptSemanticSignature {
  const headings: Array<{ level: number; text: string }> = [];
  const citationSourceIds: string[] = [];
  const figureAssets: Array<{ mediaId: string; credit: string; licence: string; caption: string }> = [];
  const mathExpressions: Array<{ display: 'inline' | 'block'; tex: string }> = [];
  const tableCaptions: string[] = [];
  const codeBlocks: string[] = [];
  let tableCount = 0;
  const proseChunks: string[] = [];

  function walk(node: Record<string, unknown> | undefined, insideBlockProse = false) {
    if (!node || typeof node !== 'object') return;
    const type = String(node.type || '');
    const attrs = (node.attrs && typeof node.attrs === 'object'
      ? (node.attrs as Record<string, unknown>)
      : {});

    if (type === 'heading') {
      const level = Number(attrs.level || 2);
      const text = collectJsonProseText(node).replace(/\s+/g, ' ').trim();
      if (level === 2 || level === 3) {
        headings.push({ level, text });
      }
      if (text) proseChunks.push(text);
    } else if (type === 'scientificCitation') {
      const sourceId = String(attrs.sourceId || '');
      if (sourceId) citationSourceIds.push(sourceId);
      return;
    } else if (type === 'scientificFigure') {
      figureAssets.push({
        mediaId: String(attrs.mediaId || ''),
        credit: String(attrs.credit || ''),
        licence: String(attrs.licence || ''),
        caption: String(attrs.caption || '').replace(/\s+/g, ' ').trim(),
      });
      return;
    } else if (type === 'scientificMathInline') {
      mathExpressions.push({
        display: 'inline',
        tex: String(attrs.tex || '').trim(),
      });
      return;
    } else if (type === 'scientificMathBlock') {
      mathExpressions.push({
        display: 'block',
        tex: String(attrs.tex || '').trim(),
      });
      return;
    } else if (type === 'table') {
      tableCount += 1;
    } else if (type === 'tableCaption') {
      const text = collectJsonProseText(node).replace(/\s+/g, ' ').trim();
      tableCaptions.push(text);
      if (text) proseChunks.push(text);
    } else if (type === 'codeBlock') {
      const raw = collectJsonRawText(node);
      codeBlocks.push(raw);
      const norm = raw.replace(/\s+/g, ' ').trim();
      if (norm) proseChunks.push(norm);
      return;
    } else if (
      type === 'paragraph' ||
      type === 'tableCell' ||
      type === 'tableHeader'
    ) {
      if (!insideBlockProse) {
        const text = collectJsonProseText(node).replace(/\s+/g, ' ').trim();
        if (text) proseChunks.push(text);
      }
    }

    const nextInsideProse =
      insideBlockProse ||
      type === 'heading' ||
      type === 'paragraph' ||
      type === 'tableCaption' ||
      type === 'tableCell' ||
      type === 'tableHeader';

    const content = Array.isArray(node.content) ? (node.content as Array<Record<string, unknown>>) : [];
    for (const child of content) {
      walk(child, nextInsideProse);
    }
  }

  walk(doc, false);

  return {
    plainText: proseChunks.join(' ').replace(/\s+/g, ' ').trim(),
    headings,
    citationSourceIds,
    figureAssets,
    mathExpressions,
    tableCount,
    tableCaptions,
    codeBlocks,
  };
}

/**
 * Checks whether an article's ProseMirror `body` JSON and sanitized `bodyHtml` represent the same scientific semantics.
 */
export function areBodyJsonAndHtmlSemanticallyAligned(
  bodyJson: Record<string, unknown> | undefined,
  bodyHtml: string
): boolean {
  if (!bodyJson || bodyJson.type !== 'doc' || !Array.isArray(bodyJson.content)) {
    return false;
  }
  const htmlSig = extractScientificSemanticsFromHtml(bodyHtml);
  const jsonSig = extractScientificSemanticsFromJson(bodyJson);
  return JSON.stringify(htmlSig) === JSON.stringify(jsonSig);
}

function parseInlineHtmlToProseMirrorNodes(inlineHtml: string): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];
  const tokenRegex =
    /(<sup\b[^>]*\bdata-citation-source-id\b[^>]*>[\s\S]*?<\/sup>|<span\b[^>]*\bdata-math-tex\b[^>]*>[\s\S]*?<\/span>|<a\b[^>]*>[\s\S]*?<\/a>|<(strong|b|em|i|u|s|del|code|sup|sub)\b[^>]*>[\s\S]*?<\/\2>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushPlainText = (rawSlice: string, marks?: Array<Record<string, unknown>>) => {
    const clean = decodeHtmlEntities(rawSlice.replace(/<[^>]+>/g, ''));
    if (!clean) return;
    nodes.push(marks && marks.length > 0 ? { type: 'text', text: clean, marks } : { type: 'text', text: clean });
  };

  while ((match = tokenRegex.exec(inlineHtml)) !== null) {
    if (match.index > lastIndex) {
      pushPlainText(inlineHtml.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (/^<sup\b[^>]*\bdata-citation-source-id\b/i.test(token)) {
      const sourceId = extractAttr(token, 'data-citation-source-id');
      const inner = stripTagsAndDecode(token) || '[1]';
      nodes.push({
        type: 'scientificCitation',
        attrs: { sourceId, label: inner },
      });
    } else if (/^<span\b[^>]*\bdata-math-tex\b/i.test(token)) {
      const tex = extractAttr(token, 'data-math-tex').trim();
      nodes.push({
        type: 'scientificMathInline',
        attrs: { tex },
      });
    } else if (/^<a\b/i.test(token)) {
      const href = extractAttr(token, 'href');
      const target = extractAttr(token, 'target') || (href.startsWith('/') ? '_self' : '_blank');
      const knowledgeTerm = extractAttr(token, 'data-knowledge-term') || null;
      const innerMatch = /^<a\b[^>]*>([\s\S]*?)<\/a>$/i.exec(token);
      pushPlainText(innerMatch ? innerMatch[1] : token, [
        {
          type: 'link',
          attrs: { href, target, 'data-knowledge-term': knowledgeTerm },
        },
      ]);
    } else {
      const tagMatch = /^<([a-z0-9]+)\b[^>]*>([\s\S]*?)<\/\1>$/i.exec(token);
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        const markType =
          tag === 'strong' || tag === 'b'
            ? 'bold'
            : tag === 'em' || tag === 'i'
            ? 'italic'
            : tag === 'u'
            ? 'underline'
            : tag === 's' || tag === 'del'
            ? 'strike'
            : tag === 'code'
            ? 'code'
            : tag === 'sup'
            ? 'superscript'
            : 'subscript';
        pushPlainText(tagMatch[2], [{ type: markType }]);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < inlineHtml.length) {
    pushPlainText(inlineHtml.slice(lastIndex));
  }

  return nodes;
}

/**
 * Derives a canonical ProseMirror/Tiptap JSON document from sanitized body HTML so
 * `body` JSON and `bodyHtml` remain semantically synchronized across visual edits,
 * HTML Source mode, Quick Fixes, assistant reviews, and legacy records (P0-B / SRS-HTML-002).
 */
export function deriveCanonicalBodyJsonFromHtml(sanitizedHtml: string): Record<string, unknown> {
  const source = typeof sanitizedHtml === 'string' && sanitizedHtml.trim() ? sanitizedHtml.trim() : '<p></p>';
  const content: Array<Record<string, unknown>> = [];

  const blockRegex =
    /(<h([23])\b([^>]*)>([\s\S]*?)<\/h\2>|<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>|<figure\b([^>]*)>([\s\S]*?)<\/figure>|<div\b([^>]*\bdata-math-tex\b[^>]*)>[\s\S]*?<\/div>|<table\b[^>]*>([\s\S]*?)<\/table>|<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>|<ul>([\s\S]*?)<\/ul>|<ol\b[^>]*>([\s\S]*?)<\/ol>|<hr\b[^>]*\/?>|<p\b([^>]*)>([\s\S]*?)<\/p>)/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(source)) !== null) {
    const full = match[0];
    if (/^<h[23]\b/i.test(full)) {
      const level = Number(match[2]);
      const textAlign = extractAttr(match[3] || '', 'data-text-align') || null;
      const inlineNodes = parseInlineHtmlToProseMirrorNodes(match[4] || '');
      content.push({
        type: 'heading',
        attrs: textAlign ? { level, textAlign } : { level },
        ...(inlineNodes.length > 0 ? { content: inlineNodes } : {}),
      });
    } else if (/^<pre\b/i.test(full)) {
      const rawCode = decodeHtmlEntities(match[5] || '');
      content.push({
        type: 'codeBlock',
        ...(rawCode ? { content: [{ type: 'text', text: rawCode }] } : {}),
      });
    } else if (/^<figure\b/i.test(full)) {
      const figAttrs = match[6] || '';
      const figInner = match[7] || '';
      const imgMatch = /<img\b([^>]*)\/?>/i.exec(figInner);
      const capMatch = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(figInner);
      const imgAttrs = imgMatch ? imgMatch[1] : '';
      content.push({
        type: 'scientificFigure',
        attrs: {
          mediaId: extractAttr(figAttrs, 'data-media-id'),
          layout: extractAttr(figAttrs, 'data-figure-layout') || 'locked',
          credit: extractAttr(figAttrs, 'data-figure-credit'),
          licence: extractAttr(figAttrs, 'data-figure-licence'),
          sourceUrl: extractAttr(figAttrs, 'data-figure-source-url'),
          src: extractAttr(imgAttrs, 'src'),
          alt: extractAttr(imgAttrs, 'alt'),
          caption: capMatch ? stripTagsAndDecode(capMatch[1]) : '',
        },
      });
    } else if (/^<div\b[^>]*\bdata-math-tex\b/i.test(full)) {
      const divAttrs = match[8] || '';
      content.push({
        type: 'scientificMathBlock',
        attrs: {
          tex: extractAttr(divAttrs, 'data-math-tex').trim(),
        },
      });
    } else if (/^<table\b/i.test(full)) {
      const tableInner = match[9] || '';
      const tableChildren: Array<Record<string, unknown>> = [];
      const capMatch = /<caption\b[^>]*>([\s\S]*?)<\/caption>/i.exec(tableInner);
      if (capMatch) {
        const capInline = parseInlineHtmlToProseMirrorNodes(capMatch[1]);
        tableChildren.push({
          type: 'tableCaption',
          ...(capInline.length > 0 ? { content: capInline } : {}),
        });
      }
      const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(tableInner)) !== null) {
        const rowCells: Array<Record<string, unknown>> = [];
        const cellRegex = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
        let cellMatch: RegExpExecArray | null;
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          const isHeader = cellMatch[1].toLowerCase() === 'th';
          const cellAttrsRaw = cellMatch[2] || '';
          const colspan = Number(extractAttr(cellAttrsRaw, 'colspan') || 1);
          const rowspan = Number(extractAttr(cellAttrsRaw, 'rowspan') || 1);
          const textAlign = extractAttr(cellAttrsRaw, 'data-text-align') || undefined;
          const cellAttrs: Record<string, unknown> = {};
          if (colspan > 1) cellAttrs.colspan = colspan;
          if (rowspan > 1) cellAttrs.rowspan = rowspan;
          if (textAlign) cellAttrs.textAlign = textAlign;
          const cellInline = parseInlineHtmlToProseMirrorNodes(cellMatch[3]);
          rowCells.push({
            type: isHeader ? 'tableHeader' : 'tableCell',
            ...(Object.keys(cellAttrs).length > 0 ? { attrs: cellAttrs } : {}),
            content: [
              {
                type: 'paragraph',
                ...(cellInline.length > 0 ? { content: cellInline } : {}),
              },
            ],
          });
        }
        if (rowCells.length > 0) {
          tableChildren.push({
            type: 'tableRow',
            content: rowCells,
          });
        }
      }
      if (tableChildren.length > 0) {
        content.push({
          type: 'table',
          content: tableChildren,
        });
      }
    } else if (/^<blockquote\b/i.test(full)) {
      const inner = match[10] || '';
      const inlineNodes = parseInlineHtmlToProseMirrorNodes(inner);
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            ...(inlineNodes.length > 0 ? { content: inlineNodes } : {}),
          },
        ],
      });
    } else if (/^<(ul|ol)\b/i.test(full)) {
      const isOrdered = /^<ol\b/i.test(full);
      const listInner = (isOrdered ? match[12] : match[11]) || '';
      const items: Array<Record<string, unknown>> = [];
      const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(listInner)) !== null) {
        const liInline = parseInlineHtmlToProseMirrorNodes(liMatch[1]);
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              ...(liInline.length > 0 ? { content: liInline } : {}),
            },
          ],
        });
      }
      if (items.length > 0) {
        content.push({
          type: isOrdered ? 'orderedList' : 'bulletList',
          content: items,
        });
      }
    } else if (/^<hr\b/i.test(full)) {
      content.push({ type: 'horizontalRule' });
    } else if (/^<p\b/i.test(full)) {
      const pAttrs = match[13] || '';
      const pInner = match[14] || '';
      const textAlign = extractAttr(pAttrs, 'data-text-align') || null;
      const inlineNodes = parseInlineHtmlToProseMirrorNodes(pInner);
      content.push({
        type: 'paragraph',
        ...(textAlign ? { attrs: { textAlign } } : {}),
        ...(inlineNodes.length > 0 ? { content: inlineNodes } : {}),
      });
    }
  }

  if (content.length === 0) {
    const fallbackInline = parseInlineHtmlToProseMirrorNodes(source);
    content.push({
      type: 'paragraph',
      ...(fallbackInline.length > 0 ? { content: fallbackInline } : {}),
    });
  }

  return {
    type: 'doc',
    content,
  };
}

/**
 * Synchronizes an article's `body` JSON and `bodyHtml` so that at commit time both
 * representations express the exact same scientific semantics.
 */
export function synchronizeArticleBodyRepresentations(
  bodyJson: Record<string, unknown> | undefined,
  sanitizedBodyHtml: string
): {
  body: Record<string, unknown>;
  bodyHtml: string;
  authoritativeSource: 'aligned' | 'html_authoritative';
} {
  if (areBodyJsonAndHtmlSemanticallyAligned(bodyJson, sanitizedBodyHtml) && bodyJson) {
    return {
      body: bodyJson,
      bodyHtml: sanitizedBodyHtml,
      authoritativeSource: 'aligned',
    };
  }
  return {
    body: deriveCanonicalBodyJsonFromHtml(sanitizedBodyHtml),
    bodyHtml: sanitizedBodyHtml,
    authoritativeSource: 'html_authoritative',
  };
}


