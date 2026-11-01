export interface LatexRenderResult {
  valid: boolean;
  rawTex: string;
  renderedText: string;
  renderedHtml: string;
  error?: string;
}

export interface ScientificSymbolCategory {
  id: string;
  label: string;
  symbols: Array<{ char: string; name: string }>;
}

export const SCIENTIFIC_SYMBOL_CATEGORIES: ScientificSymbolCategory[] = [
  {
    id: 'greek',
    label: 'Greek Letters',
    symbols: [
      { char: 'α', name: 'Alpha' },
      { char: 'β', name: 'Beta' },
      { char: 'γ', name: 'Gamma' },
      { char: 'δ', name: 'Delta' },
      { char: 'ε', name: 'Epsilon' },
      { char: 'ζ', name: 'Zeta' },
      { char: 'η', name: 'Eta' },
      { char: 'θ', name: 'Theta' },
      { char: 'λ', name: 'Lambda' },
      { char: 'μ', name: 'Mu / Micro' },
      { char: 'π', name: 'Pi' },
      { char: 'ρ', name: 'Rho' },
      { char: 'σ', name: 'Sigma' },
      { char: 'τ', name: 'Tau' },
      { char: 'φ', name: 'Phi' },
      { char: 'ψ', name: 'Psi' },
      { char: 'ω', name: 'Omega' },
      { char: 'Δ', name: 'Capital Delta' },
      { char: 'Σ', name: 'Capital Sigma' },
      { char: 'Ω', name: 'Capital Omega' },
    ],
  },
  {
    id: 'operators',
    label: 'Operators & Relations',
    symbols: [
      { char: '±', name: 'Plus-Minus' },
      { char: '∓', name: 'Minus-Plus' },
      { char: '×', name: 'Multiply' },
      { char: '÷', name: 'Divide' },
      { char: '·', name: 'Center Dot' },
      { char: '≤', name: 'Less than or equal' },
      { char: '≥', name: 'Greater than or equal' },
      { char: '≠', name: 'Not equal' },
      { char: '≈', name: 'Approximately equal' },
      { char: '≡', name: 'Identical to' },
      { char: '∝', name: 'Proportional to' },
      { char: '∞', name: 'Infinity' },
      { char: '∂', name: 'Partial differential' },
      { char: '∇', name: 'Nabla / Del' },
    ],
  },
  {
    id: 'arrows_units',
    label: 'Arrows & Units',
    symbols: [
      { char: '→', name: 'Right Arrow' },
      { char: '←', name: 'Left Arrow' },
      { char: '↔', name: 'Left-Right Arrow' },
      { char: '⇒', name: 'Implies' },
      { char: '⇔', name: 'Equivalent' },
      { char: '⇌', name: 'Equilibrium Harpoons' },
      { char: '°', name: 'Degree' },
      { char: '℃', name: 'Degree Celsius' },
      { char: 'Å', name: 'Angstrom' },
      { char: 'ℏ', name: 'Reduced Planck Constant' },
      { char: '‰', name: 'Per Mille' },
    ],
  },
];

export const FORBIDDEN_LATEX_MACROS =
  /\\(?:href|url|input|include|write|openout|def|csdef|catcode|csname|makeatletter|htmlData|htmlId|htmlClass|htmlStyle|includegraphics|write18|immediate)\b/i;

export const GREEK_AND_MATH_SYMBOLS: Record<string, string> = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ϵ',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\vartheta': 'ϑ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\pi': 'π',
  '\\rho': 'ρ',
  '\\varrho': 'ϱ',
  '\\sigma': 'σ',
  '\\varsigma': 'ς',
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
  '\\Upsilon': 'Υ',
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
  '\\pm': '±',
  '\\mp': '∓',
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\ast': '∗',
  '\\star': '⋆',
  '\\leq': '≤',
  '\\le': '≤',
  '\\geq': '≥',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\sim': '∼',
  '\\simeq': '≃',
  '\\cong': '≅',
  '\\propto': '∝',
  '\\ll': '≪',
  '\\gg': '≫',
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\nexists': '∄',
  '\\emptyset': '∅',
  '\\varnothing': '∅',
  '\\in': '∈',
  '\\notin': '∉',
  '\\ni': '∋',
  '\\subset': '⊂',
  '\\supset': '⊃',
  '\\subseteq': '⊆',
  '\\supseteq': '⊇',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\setminus': '∖',
  '\\rightarrow': '→',
  '\\to': '→',
  '\\leftarrow': '←',
  '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\iff': '⟺',
  '\\mapsto': '↦',
  '\\uparrow': '↑',
  '\\downarrow': '↓',
  '\\rightleftharpoons': '⇌',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\coprod': '∐',
  '\\int': '∫',
  '\\iint': '∬',
  '\\iiint': '∭',
  '\\oint': '∮',
  '\\hbar': 'ℏ',
  '\\ell': 'ℓ',
  '\\Re': 'ℜ',
  '\\Im': 'ℑ',
  '\\wp': '℘',
  '\\aleph': 'ℵ',
  '\\langle': '⟨',
  '\\rangle': '⟩',
  '\\lceil': '⌈',
  '\\rceil': '⌉',
  '\\lfloor': '⌊',
  '\\rfloor': '⌋',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\otimes': '⊗',
  '\\oplus': '⊕',
  '\\odot': '⊙',
  '\\dagger': '†',
  '\\ddagger': '‡',
  '\\dots': '…',
  '\\cdots': '⋯',
  '\\ldots': '…',
  '\\vdots': '⋮',
  '\\ddots': '⋱',
  '\\prime': '′',
  '\\circ': '∘',
  '\\bullet': '•',
  '\\angle': '∠',
  '\\triangle': '△',
};

const CALLIGRAPHIC_MAP: Record<string, string> = {
  A: '𝒜',
  B: 'ℬ',
  C: '𝒞',
  D: '𝒟',
  E: 'ℰ',
  F: 'ℱ',
  G: '𝒢',
  H: 'ℋ',
  I: 'ℐ',
  J: '𝒥',
  K: '𝒦',
  L: 'ℒ',
  M: 'ℳ',
  N: '𝒩',
  O: '𝒪',
  P: '𝒫',
  Q: '𝒬',
  R: 'ℛ',
  S: '𝒮',
  T: '𝒯',
  U: '𝒰',
  V: '𝒱',
  W: '𝒲',
  X: '𝒳',
  Y: '𝒴',
  Z: '𝒵',
};

const BLACKBOARD_MAP: Record<string, string> = {
  A: '𝔸',
  B: '𝔹',
  C: 'ℂ',
  D: '𝔻',
  E: '𝔼',
  F: '𝔽',
  G: '𝔾',
  H: 'ℍ',
  I: '𝕀',
  J: '𝕁',
  K: '𝕂',
  L: '𝕃',
  M: '𝕄',
  N: 'ℕ',
  O: '𝕆',
  P: 'ℙ',
  Q: 'ℚ',
  R: 'ℝ',
  S: '𝕊',
  T: '𝕋',
  U: '𝕌',
  V: '𝕍',
  W: '𝕎',
  X: '𝕏',
  Y: '𝕐',
  Z: 'ℤ',
};

const LARGE_OPERATORS = new Set(['∑', '∏', '∐', '∫', '∬', '∭', '∮', 'lim', 'sup', 'inf', 'max', 'min']);

const FUNCTION_NAMES = new Set([
  '\\sin',
  '\\cos',
  '\\tan',
  '\\cot',
  '\\sec',
  '\\csc',
  '\\arcsin',
  '\\arccos',
  '\\arctan',
  '\\sinh',
  '\\cosh',
  '\\tanh',
  '\\ln',
  '\\log',
  '\\exp',
  '\\lim',
  '\\sup',
  '\\inf',
  '\\min',
  '\\max',
  '\\det',
  '\\dim',
  '\\ker',
  '\\deg',
  '\\gcd',
  '\\Pr',
  '\\arg',
  '\\Tr',
]);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ParsedGroup {
  content: string;
  nextIndex: number;
}

function readBracedGroup(src: string, startIndex: number): ParsedGroup | null {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (i >= src.length || src[i] !== '{') return null;
  i += 1;
  let depth = 1;
  const startContent = i;
  while (i < src.length && depth > 0) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) return null;
  return {
    content: src.slice(startContent, i - 1),
    nextIndex: i,
  };
}

function readBracketGroup(src: string, startIndex: number): ParsedGroup | null {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (i >= src.length || src[i] !== '[') return null;
  i += 1;
  let depth = 1;
  const startContent = i;
  while (i < src.length && depth > 0) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === '[') depth += 1;
    else if (src[i] === ']') depth -= 1;
    i += 1;
  }
  if (depth !== 0) return null;
  return {
    content: src.slice(startContent, i - 1),
    nextIndex: i,
  };
}

interface AtomParseResult {
  html: string;
  text: string;
  isLargeOp?: boolean;
  nextIndex: number;
}

function parseAtom(src: string, startIndex: number, displayMode: 'inline' | 'block'): AtomParseResult {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (i >= src.length) {
    return { html: '', text: '', nextIndex: i };
  }

  // Group {...}
  if (src[i] === '{') {
    const grp = readBracedGroup(src, i);
    if (!grp) {
      return { html: '', text: '', nextIndex: src.length };
    }
    const inner = renderSegment(grp.content, displayMode);
    return {
      html: `<span class="sr-math-group">${inner.html}</span>`,
      text: inner.text,
      nextIndex: grp.nextIndex,
    };
  }

  // Command \...
  if (src[i] === '\\') {
    // Escaped spacing or symbols like \, \; \{ \} \%
    if (i + 1 < src.length && !/[a-zA-Z]/.test(src[i + 1])) {
      const ch = src[i + 1];
      if (ch === ',' || ch === ';' || ch === ':' || ch === ' ') {
        return { html: '<span class="sr-math-space"> </span>', text: ' ', nextIndex: i + 2 };
      }
      if (ch === '!') {
        return { html: '', text: '', nextIndex: i + 2 };
      }
      if (ch === '{' || ch === '}' || ch === '%' || ch === '$' || ch === '&' || ch === '#' || ch === '_') {
        return { html: escapeHtml(ch), text: ch, nextIndex: i + 2 };
      }
      if (ch === '\\') {
        return { html: '<br />', text: '\n', nextIndex: i + 2 };
      }
      return { html: escapeHtml(ch), text: ch, nextIndex: i + 2 };
    }

    let j = i + 1;
    while (j < src.length && /[a-zA-Z]/.test(src[j])) j += 1;
    const cmd = src.slice(i, j);

    // \left and \right delimiters
    if (cmd === '\\left' || cmd === '\\right') {
      let k = j;
      while (k < src.length && /\s/.test(src[k])) k += 1;
      if (k < src.length) {
        if (src[k] === '.') {
          return { html: '', text: '', nextIndex: k + 1 };
        }
        if (src[k] === '\\') {
          let m = k + 1;
          while (m < src.length && /[a-zA-Z]/.test(src[m])) m += 1;
          const delimCmd = src.slice(k, m);
          if (delimCmd === '\\{' || delimCmd === '\\}') {
            const brace = delimCmd.slice(1);
            return {
              html: `<span class="sr-math-delim">${escapeHtml(brace)}</span>`,
              text: brace,
              nextIndex: m,
            };
          }
          const sym = GREEK_AND_MATH_SYMBOLS[delimCmd] || delimCmd.slice(1);
          return {
            html: `<span class="sr-math-delim">${escapeHtml(sym)}</span>`,
            text: sym,
            nextIndex: m,
          };
        }
        const ch = src[k];
        return {
          html: `<span class="sr-math-delim">${escapeHtml(ch)}</span>`,
          text: ch,
          nextIndex: k + 1,
        };
      }
      return { html: '', text: '', nextIndex: j };
    }

    // \frac, \dfrac, \tfrac
    if (cmd === '\\frac' || cmd === '\\dfrac' || cmd === '\\tfrac') {
      const numGrp = readBracedGroup(src, j);
      if (!numGrp) {
        return { html: escapeHtml(cmd), text: cmd, nextIndex: j };
      }
      const denGrp = readBracedGroup(src, numGrp.nextIndex);
      if (!denGrp) {
        return { html: escapeHtml(cmd), text: cmd, nextIndex: numGrp.nextIndex };
      }
      const num = renderSegment(numGrp.content, displayMode);
      const den = renderSegment(denGrp.content, displayMode);
      return {
        html: `<span class="sr-math-frac" role="math"><span class="sr-math-num">${num.html}</span><span class="sr-math-frac-bar" aria-hidden="true"></span><span class="sr-math-denom">${den.html}</span></span>`,
        text: `(${num.text})/(${den.text})`,
        nextIndex: denGrp.nextIndex,
      };
    }

    // \sqrt[n]{x} or \sqrt{x}
    if (cmd === '\\sqrt') {
      const optRoot = readBracketGroup(src, j);
      const radStart = optRoot ? optRoot.nextIndex : j;
      const radGrp = readBracedGroup(src, radStart);
      if (!radGrp) {
        const singleAtom = parseAtom(src, radStart, displayMode);
        return {
          html: `<span class="sr-math-sqrt"><span class="sr-math-sqrt-stem">√</span><span class="sr-math-radicand">${singleAtom.html}</span></span>`,
          text: `√(${singleAtom.text})`,
          nextIndex: singleAtom.nextIndex,
        };
      }
      const rad = renderSegment(radGrp.content, displayMode);
      if (optRoot) {
        const rootIdx = renderSegment(optRoot.content, 'inline');
        return {
          html: `<span class="sr-math-sqrt"><sup class="sr-math-sqrt-index">${rootIdx.html}</sup><span class="sr-math-sqrt-stem">√</span><span class="sr-math-radicand">${rad.html}</span></span>`,
          text: `√[${rootIdx.text}](${rad.text})`,
          nextIndex: radGrp.nextIndex,
        };
      }
      return {
        html: `<span class="sr-math-sqrt"><span class="sr-math-sqrt-stem">√</span><span class="sr-math-radicand">${rad.html}</span></span>`,
        text: `√(${rad.text})`,
        nextIndex: radGrp.nextIndex,
      };
    }

    // \overset{top}{base} and \underset{bot}{base}
    if (cmd === '\\overset' || cmd === '\\underset') {
      const firstGrp = readBracedGroup(src, j);
      if (firstGrp) {
        const secondGrp = readBracedGroup(src, firstGrp.nextIndex);
        if (secondGrp) {
          const first = renderSegment(firstGrp.content, 'inline');
          const second = renderSegment(secondGrp.content, displayMode);
          if (cmd === '\\overset') {
            return {
              html: `<span class="sr-math-stack"><span class="sr-math-stack-top">${first.html}</span><span class="sr-math-stack-base">${second.html}</span></span>`,
              text: `${second.text}^(${first.text})`,
              nextIndex: secondGrp.nextIndex,
            };
          }
          return {
            html: `<span class="sr-math-stack"><span class="sr-math-stack-base">${second.html}</span><span class="sr-math-stack-bottom">${first.html}</span></span>`,
            text: `${second.text}_(${first.text})`,
            nextIndex: secondGrp.nextIndex,
          };
        }
      }
    }

    // Accents: \hat, \bar, \vec, \tilde, \dot, \ddot, \overline, \underline
    const accentMap: Record<string, { combining: string; className: string }> = {
      '\\hat': { combining: '\u0302', className: 'sr-math-accent-hat' },
      '\\widehat': { combining: '\u0302', className: 'sr-math-accent-hat' },
      '\\bar': { combining: '\u0304', className: 'sr-math-accent-bar' },
      '\\overline': { combining: '\u0304', className: 'sr-math-overline' },
      '\\underline': { combining: '\u0332', className: 'sr-math-underline' },
      '\\vec': { combining: '\u20D7', className: 'sr-math-accent-vec' },
      '\\tilde': { combining: '\u0303', className: 'sr-math-accent-tilde' },
      '\\widetilde': { combining: '\u0303', className: 'sr-math-accent-tilde' },
      '\\dot': { combining: '\u0307', className: 'sr-math-accent-dot' },
      '\\ddot': { combining: '\u0308', className: 'sr-math-accent-ddot' },
    };
    if (cmd in accentMap) {
      const acc = accentMap[cmd];
      const grp = readBracedGroup(src, j);
      if (grp) {
        const inner = renderSegment(grp.content, 'inline');
        const combinedText = `${inner.text}${acc.combining}`;
        return {
          html: `<span class="${acc.className}">${inner.html}${acc.combining}</span>`,
          text: combinedText,
          nextIndex: grp.nextIndex,
        };
      }
    }

    // Font / text commands: \text, \mathrm, \mathbf, \mathit, \mathcal, \mathbb, \operatorname
    if (
      cmd === '\\text' ||
      cmd === '\\mathrm' ||
      cmd === '\\mathbf' ||
      cmd === '\\mathit' ||
      cmd === '\\mathcal' ||
      cmd === '\\mathbb' ||
      cmd === '\\operatorname'
    ) {
      const grp = readBracedGroup(src, j);
      if (grp) {
        if (cmd === '\\mathcal') {
          const mapped = grp.content
            .split('')
            .map((c) => CALLIGRAPHIC_MAP[c] || c)
            .join('');
          return {
            html: `<span class="sr-math-cal">${escapeHtml(mapped)}</span>`,
            text: mapped,
            nextIndex: grp.nextIndex,
          };
        }
        if (cmd === '\\mathbb') {
          const mapped = grp.content
            .split('')
            .map((c) => BLACKBOARD_MAP[c] || c)
            .join('');
          return {
            html: `<span class="sr-math-bb">${escapeHtml(mapped)}</span>`,
            text: mapped,
            nextIndex: grp.nextIndex,
          };
        }
        if (cmd === '\\text' || cmd === '\\mathrm' || cmd === '\\operatorname') {
          const inner = renderSegment(grp.content, 'inline');
          return {
            html: `<span class="sr-math-roman">${inner.html}</span>`,
            text: inner.text,
            isLargeOp: cmd === '\\operatorname',
            nextIndex: grp.nextIndex,
          };
        }
        if (cmd === '\\mathbf') {
          const inner = renderSegment(grp.content, 'inline');
          return {
            html: `<strong class="sr-math-bold">${inner.html}</strong>`,
            text: inner.text,
            nextIndex: grp.nextIndex,
          };
        }
        const inner = renderSegment(grp.content, 'inline');
        return {
          html: `<em class="sr-math-italic">${inner.html}</em>`,
          text: inner.text,
          nextIndex: grp.nextIndex,
        };
      }
    }

    // Environments: \begin{matrix|pmatrix|bmatrix|vmatrix|aligned|cases} ... \end{...}
    if (cmd === '\\begin') {
      const envGrp = readBracedGroup(src, j);
      if (envGrp) {
        const envName = envGrp.content.trim();
        const endMarker = `\\end{${envName}}`;
        const endIdx = src.indexOf(endMarker, envGrp.nextIndex);
        if (endIdx !== -1) {
          const bodyContent = src.slice(envGrp.nextIndex, endIdx);
          const rows = bodyContent
            .split(/\\\\/)
            .map((r) => r.trim())
            .filter((r) => r.length > 0);
          const rowHtmls: string[] = [];
          const rowTexts: string[] = [];
          for (const row of rows) {
            const cells = row.split('&').map((c) => renderSegment(c.trim(), 'inline'));
            rowHtmls.push(
              `<span class="sr-math-matrix-row">${cells
                .map((c) => `<span class="sr-math-matrix-cell">${c.html}</span>`)
                .join('')}</span>`
            );
            rowTexts.push(cells.map((c) => c.text).join(', '));
          }
          const leftDelim =
            envName === 'pmatrix'
              ? '('
              : envName === 'bmatrix'
              ? '['
              : envName === 'vmatrix'
              ? '|'
              : envName === 'cases'
              ? '{'
              : '';
          const rightDelim =
            envName === 'pmatrix'
              ? ')'
              : envName === 'bmatrix'
              ? ']'
              : envName === 'vmatrix'
              ? '|'
              : '';
          return {
            html: `<span class="sr-math-matrix-wrap">${
              leftDelim ? `<span class="sr-math-delim">${leftDelim}</span>` : ''
            }<span class="sr-math-matrix">${rowHtmls.join('')}</span>${
              rightDelim ? `<span class="sr-math-delim">${rightDelim}</span>` : ''
            }</span>`,
            text: `[${rowTexts.join('; ')}]`,
            nextIndex: endIdx + endMarker.length,
          };
        }
      }
    }

    // Standard math functions (\sin, \cos, \lim, \log, \ln, \exp, etc.)
    if (FUNCTION_NAMES.has(cmd)) {
      const fnName = cmd.slice(1);
      const isLim = LARGE_OPERATORS.has(fnName);
      return {
        html: `<span class="sr-math-fn">${escapeHtml(fnName)}</span>`,
        text: fnName,
        isLargeOp: isLim,
        nextIndex: j,
      };
    }

    // Spacing macros
    if (cmd === '\\quad') {
      return { html: '<span class="sr-math-quad">&emsp;</span>', text: '  ', nextIndex: j };
    }
    if (cmd === '\\qquad') {
      return { html: '<span class="sr-math-qquad">&emsp;&emsp;</span>', text: '    ', nextIndex: j };
    }

    // Greek / operator symbols
    if (cmd in GREEK_AND_MATH_SYMBOLS) {
      const sym = GREEK_AND_MATH_SYMBOLS[cmd];
      const isLarge = LARGE_OPERATORS.has(sym);
      return {
        html: `<span class="${isLarge ? 'sr-math-large-op' : 'sr-math-sym'}">${escapeHtml(sym)}</span>`,
        text: sym,
        isLargeOp: isLarge,
        nextIndex: j,
      };
    }

    // Fallback unknown safe macro name: render macro identifier cleanly
    const fallbackName = cmd.slice(1);
    return {
      html: `<span class="sr-math-roman">${escapeHtml(fallbackName)}</span>`,
      text: fallbackName,
      nextIndex: j,
    };
  }

  // Single character or number/operator run
  const ch = src[i];
  if (/[0-9]/.test(ch)) {
    let j = i + 1;
    while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
    const num = src.slice(i, j);
    return {
      html: `<span class="sr-math-num-lit">${escapeHtml(num)}</span>`,
      text: num,
      nextIndex: j,
    };
  }

  if (/[a-zA-Z]/.test(ch)) {
    return {
      html: `<var class="sr-math-var">${escapeHtml(ch)}</var>`,
      text: ch,
      nextIndex: i + 1,
    };
  }

  if (ch === '-') {
    return {
      html: '<span class="sr-math-op">−</span>',
      text: '−',
      nextIndex: i + 1,
    };
  }

  if (ch === '+' || ch === '=' || ch === '<' || ch === '>' || ch === '/' || ch === '*') {
    return {
      html: `<span class="sr-math-op">${escapeHtml(ch)}</span>`,
      text: ch,
      nextIndex: i + 1,
    };
  }

  return {
    html: escapeHtml(ch),
    text: ch,
    nextIndex: i + 1,
  };
}

function parseScriptArg(src: string, startIndex: number, displayMode: 'inline' | 'block'): AtomParseResult {
  let i = startIndex;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (i < src.length && src[i] === '{') {
    const grp = readBracedGroup(src, i);
    if (grp) {
      const rendered = renderSegment(grp.content, 'inline');
      return {
        html: rendered.html,
        text: rendered.text,
        nextIndex: grp.nextIndex,
      };
    }
  }
  return parseAtom(src, i, displayMode);
}

function renderSegment(src: string, displayMode: 'inline' | 'block'): { html: string; text: string } {
  const htmlParts: string[] = [];
  const textParts: string[] = [];
  let i = 0;

  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i += 1;
    if (i >= src.length) break;

    const base = parseAtom(src, i, displayMode);
    if (base.nextIndex <= i) {
      i += 1;
      continue;
    }
    i = base.nextIndex;

    // Check for trailing _ (subscript) and/or ^ (superscript) in any order
    let subPart: { html: string; text: string } | null = null;
    let supPart: { html: string; text: string } | null = null;

    for (let pass = 0; pass < 2; pass += 1) {
      while (i < src.length && /\s/.test(src[i])) i += 1;
      if (i < src.length && src[i] === '_' && !subPart) {
        const parsedSub = parseScriptArg(src, i + 1, displayMode);
        subPart = { html: parsedSub.html, text: parsedSub.text };
        i = parsedSub.nextIndex;
      } else if (i < src.length && src[i] === '^' && !supPart) {
        const parsedSup = parseScriptArg(src, i + 1, displayMode);
        supPart = { html: parsedSup.html, text: parsedSup.text };
        i = parsedSup.nextIndex;
      } else {
        break;
      }
    }

    if (subPart && supPart) {
      if (base.isLargeOp && displayMode === 'block') {
        htmlParts.push(
          `<span class="sr-math-limits"><span class="sr-math-limit-top">${supPart.html}</span><span class="sr-math-limit-base">${base.html}</span><span class="sr-math-limit-bottom">${subPart.html}</span></span>`
        );
      } else {
        htmlParts.push(
          `<span class="sr-math-scripts">${base.html}<span class="sr-math-subsup"><sup class="sr-math-sup">${supPart.html}</sup><sub class="sr-math-sub">${subPart.html}</sub></span></span>`
        );
      }
      textParts.push(
        `${base.text}_${subPart.text.length > 1 ? `(${subPart.text})` : subPart.text}^${
          supPart.text.length > 1 ? `(${supPart.text})` : supPart.text
        }`
      );
    } else if (subPart) {
      htmlParts.push(`${base.html}<sub class="sr-math-sub">${subPart.html}</sub>`);
      textParts.push(`${base.text}_${subPart.text.length > 1 ? `(${subPart.text})` : subPart.text}`);
    } else if (supPart) {
      htmlParts.push(`${base.html}<sup class="sr-math-sup">${supPart.html}</sup>`);
      textParts.push(`${base.text}^${supPart.text.length > 1 ? `(${supPart.text})` : supPart.text}`);
    } else {
      htmlParts.push(base.html);
      textParts.push(base.text);
    }
  }

  return {
    html: htmlParts.join(''),
    text: textParts.join(''),
  };
}

/**
 * Validates a LaTeX expression (`trust: false` security policy) and renders both:
 * 1. `renderedHtml`: true 2D mathematical typography (stacked fractions, radicals, limits, matrices, scripts)
 * 2. `renderedText`: accessible Unicode/linearized math representation
 * while keeping `rawTex` intact for lossless persistence (`SRS-MATH-001/002`).
 */
export function parseAndRenderLatex(
  rawTex: string,
  displayMode: 'inline' | 'block' = 'inline'
): LatexRenderResult {
  const tex = (rawTex || '').trim();
  if (!tex) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: 'LaTeX expression cannot be empty.',
    };
  }
  if (tex.length > 2000) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: 'LaTeX expression exceeds 2,000 character limit.',
    };
  }
  if (FORBIDDEN_LATEX_MACROS.test(tex)) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: 'Unsafe LaTeX macro detected (commands like \\href, \\url, \\input, \\def are prohibited under trust:false).',
    };
  }
  if (/<\/?[a-zA-Z][a-zA-Z0-9:-]*\b[^>]*>/.test(tex)) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: 'Raw HTML tags are not permitted inside LaTeX expressions.',
    };
  }

  // Check balanced braces { }
  let depth = 0;
  for (let i = 0; i < tex.length; i += 1) {
    const ch = tex[i];
    if (ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth < 0) {
        return {
          valid: false,
          rawTex: tex,
          renderedText: '',
          renderedHtml: '',
          error: `Unmatched closing brace "}" at position ${i + 1}.`,
        };
      }
    }
  }
  if (depth !== 0) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: `Unbalanced braces: ${depth} opening "{" brace(s) not closed.`,
    };
  }
  if (/(?:^|[^\\])\\$/.test(tex)) {
    return {
      valid: false,
      rawTex: tex,
      renderedText: '',
      renderedHtml: '',
      error: 'Trailing backslash "\\" at end of LaTeX expression.',
    };
  }

  // Validate that every \frac / \dfrac / \tfrac has two braced arguments
  const fracRegex = /\\(?:d|t)?frac\b/g;
  let fracMatch: RegExpExecArray | null;
  while ((fracMatch = fracRegex.exec(tex)) !== null) {
    const afterCmd = fracMatch.index + fracMatch[0].length;
    const firstArg = readBracedGroup(tex, afterCmd);
    const secondArg = firstArg ? readBracedGroup(tex, firstArg.nextIndex) : null;
    if (!firstArg || !secondArg) {
      return {
        valid: false,
        rawTex: tex,
        renderedText: '',
        renderedHtml: '',
        error: `${fracMatch[0]} requires two braced arguments: ${fracMatch[0]}{numerator}{denominator}.`,
      };
    }
  }

  // Validate \begin{...} matches \end{...}
  const beginRegex = /\\begin\{([^{}]+)\}/g;
  let beginMatch: RegExpExecArray | null;
  while ((beginMatch = beginRegex.exec(tex)) !== null) {
    const env = beginMatch[1].trim();
    if (!tex.includes(`\\end{${env}}`)) {
      return {
        valid: false,
        rawTex: tex,
        renderedText: '',
        renderedHtml: '',
        error: `Unclosed LaTeX environment \\begin{${env}} (missing \\end{${env}}).`,
      };
    }
  }

  const rendered = renderSegment(tex, displayMode);
  const modeClass = displayMode === 'block' ? 'sr-math sr-math-block' : 'sr-math sr-math-inline';
  const renderedHtml = `<span class="${modeClass}" aria-label="${escapeHtml(`Equation: ${tex}`)}">${rendered.html}</span>`;

  return {
    valid: true,
    rawTex: tex,
    renderedText: rendered.text.trim(),
    renderedHtml,
  };
}
