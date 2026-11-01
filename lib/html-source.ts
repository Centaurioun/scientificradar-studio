import { sanitizeEditorialHtml } from './html-security';

export interface HtmlSourceDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'UNBALANCED_MARKUP'
    | 'UNSUPPORTED_TAG'
    | 'UNSUPPORTED_ATTR'
    | 'UNSAFE_STRIPPED'
    | 'BODY_H1_DEMOTED'
    | 'INVALID_LATEX';
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

/**
 * Validates raw body HTML source against the shared editorial HTML contract and
 * detects any unsupported tags/attributes that would be lost on round-trip (SRS-HTML-001/002/003).
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
      sanitized.removedUnsafeCount > 0);

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
 * Formats body HTML source into readable multi-line indentation without altering inline text spacing.
 */
export function formatEditorialHtmlSource(rawHtml: string): string {
  const trimmed = (rawHtml || '').trim();
  if (!trimmed) return '<p></p>';

  const blockBoundary =
    /(<\/?(?:p|h1|h2|h3|h4|ul|ol|li|blockquote|pre|table|thead|tbody|tfoot|tr|th|td|caption|figure|figcaption|hr|div)\b[^>]*>)/gi;

  const tokens = trimmed
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
        // Leaf block like <p>, <h2>, <h3>, <li>, <th>, <td>, <figcaption>
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

  return lines.join('\n');
}

const GREEK_AND_MATH_SYMBOLS: Record<string, string> = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ϵ',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\pi': 'π',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'ϕ',
  '\\varphi': 'φ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  '\\Gamma': 'Γ',
  '\\Delta': 'Δ',
  '\\Theta': 'Θ',
  '\\Lambda': 'Λ',
  '\\Xi': 'Ξ',
  '\\Pi': 'Π',
  '\\Sigma': 'Σ',
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
  '\\pm': '±',
  '\\mp': '∓',
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\leq': '≤',
  '\\le': '≤',
  '\\geq': '≥',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\sim': '∼',
  '\\propto': '∝',
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\subseteq': '⊆',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\rightarrow': '→',
  '\\to': '→',
  '\\leftarrow': '←',
  '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftrightarrow': '⇔',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\int': '∫',
  '\\oint': '∮',
  '\\hbar': 'ℏ',
  '\\ell': 'ℓ',
  '\\langle': '⟨',
  '\\rangle': '⟩',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\otimes': '⊗',
  '\\oplus': '⊕',
  '\\dagger': '†',
};

const FORBIDDEN_LATEX_MACROS = /\\(?:href|url|input|include|write|openout|def|csdef|catcode|csname|makeatletter|htmlData|htmlId|htmlClass|htmlStyle)\b/i;

export interface LatexRenderResult {
  valid: boolean;
  renderedText: string;
  error?: string;
}

/**
 * Validates a LaTeX expression and renders a safe, deterministic typographic string
 * without executing arbitrary HTML/JS or requiring external network fonts (SRS-MATH-001/002).
 */
export function validateAndRenderLatex(
  rawTex: string,
  displayMode: 'inline' | 'block' = 'inline'
): LatexRenderResult {
  const tex = (rawTex || '').trim();
  if (!tex) {
    return { valid: false, renderedText: '', error: 'LaTeX expression cannot be empty.' };
  }
  if (tex.length > 2000) {
    return { valid: false, renderedText: '', error: 'LaTeX expression exceeds 2,000 character limit.' };
  }
  if (FORBIDDEN_LATEX_MACROS.test(tex)) {
    return {
      valid: false,
      renderedText: '',
      error: 'Unsafe LaTeX macro detected (commands like \\href, \\input, \\def are prohibited).',
    };
  }

  // Check balanced braces { }
  let depth = 0;
  for (let i = 0; i < tex.length; i += 1) {
    const ch = tex[i];
    if (ch === '\\') {
      i += 1; // skip escaped char
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth < 0) {
        return {
          valid: false,
          renderedText: '',
          error: `Unmatched closing brace "}" at position ${i + 1}.`,
        };
      }
    }
  }
  if (depth !== 0) {
    return {
      valid: false,
      renderedText: '',
      error: `Unbalanced braces: ${depth} opening "{" brace(s) not closed.`,
    };
  }
  if (/(?:^|[^\\])\\$/.test(tex)) {
    return {
      valid: false,
      renderedText: '',
      error: 'Trailing backslash "\\" at end of LaTeX expression.',
    };
  }

  // Transform common LaTeX constructs into readable scientific notation
  let out = tex;
  out = out.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');
  out = out.replace(/\\(?:text|mathrm|mathbf|mathcal|mathbb)\{([^{}]*)\}/g, '$1');
  out = out.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  out = out.replace(/\\hat\{([^{}]*)\}/g, '$1̂');
  out = out.replace(/\\bar\{([^{}]*)\}/g, '$1̄');
  out = out.replace(/\\vec\{([^{}]*)\}/g, '$1⃗');

  // Replace Greek letters and math operators (longest macro first)
  const macros = Object.keys(GREEK_AND_MATH_SYMBOLS).sort((a, b) => b.length - a.length);
  for (const macro of macros) {
    const escaped = macro.replace(/\\/g, '\\\\');
    out = out.replace(new RegExp(`${escaped}(?![a-zA-Z])`, 'g'), GREEK_AND_MATH_SYMBOLS[macro]);
  }

  // Clean simple superscript/subscript braces
  out = out.replace(/\^\{([^{}]+)\}/g, '^($1)').replace(/_\{([^{}]+)\}/g, '_($1)');
  out = out.replace(/\\[,;:!]/g, ' ').replace(/\\quad\b/g, '  ').replace(/\\qquad\b/g, '    ');

  void displayMode;
  return {
    valid: true,
    renderedText: out.trim(),
  };
}
