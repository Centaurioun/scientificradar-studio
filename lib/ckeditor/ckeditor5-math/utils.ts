/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 * Adapted for ScientificRadar Studio CKEditor 5 v49.0.1 + real KaTeX rendering.
 */

import katexLib from 'katex';
import type {
  Editor,
  ModelElement as CKElement,
  ModelDocumentSelection,
  PositioningFunction,
} from 'ckeditor5';
import type { KatexOptions, MathJax2, MathJax3 } from './typings-external';

const DISALLOWED_LATEX_MACRO_REGEX =
  /\\(?:href|url|includegraphics|input|include|write18|immediate|openin|openout|read|catcode|def|edef|gdef|xdef|newcommand|renewcommand|let|futurelet|csname|endcsname|loop|repeat|htmlData|htmlId|htmlClass|htmlStyle)\b/i;

export interface SafeKatexValidationResult {
  valid: boolean;
  html: string;
  renderedHtml: string;
  error?: string;
}

/**
 * Validates and renders a LaTeX equation using real KaTeX with `trust: false` and `maxExpand: 1000`.
 * Rejects dangerous macros and syntax errors (unbalanced braces, unknown environments) when `throwOnError: true` is used for validation,
 * and provides safe fallback HTML when `throwOnError: false` is used for non-crashing display.
 */
export function validateAndRenderKatex(
  rawEquation: string,
  displayMode = false,
  katexRenderOptions: KatexOptions = {}
): SafeKatexValidationResult {
  const equation = typeof rawEquation === 'string' ? rawEquation.trim() : '';
  if (!equation) {
    return {
      valid: false,
      html: '',
      renderedHtml: '',
      error: 'LaTeX expression cannot be empty.',
    };
  }
  if (equation.length > 2000) {
    return {
      valid: false,
      html: '',
      renderedHtml: '',
      error: 'LaTeX expression exceeds 2,000 characters.',
    };
  }
  if (DISALLOWED_LATEX_MACRO_REGEX.test(equation)) {
    return {
      valid: false,
      html: '',
      renderedHtml: '',
      error:
        'Blocked unsafe LaTeX command (external URLs, HTML attributes, and macro definitions are disabled for security).',
    };
  }

  try {
    const html = katexLib.renderToString(equation, {
      displayMode,
      output: 'htmlAndMathml',
      ...katexRenderOptions,
      throwOnError: true,
      trust: false,
      maxExpand: 1000,
      strict: 'ignore',
    });
    return {
      valid: true,
      html,
      renderedHtml: html,
    };
  } catch (err) {
    const fallbackHtml = katexLib.renderToString(equation, {
      displayMode,
      output: 'htmlAndMathml',
      ...katexRenderOptions,
      throwOnError: false,
      trust: false,
      maxExpand: 1000,
      strict: 'ignore',
    });
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      html: fallbackHtml,
      renderedHtml: fallbackHtml,
      error: message,
    };
  }
}

export function getSelectedMathModelWidget(
  selection: ModelDocumentSelection
): null | CKElement {
  const selectedElement = selection.getSelectedElement();

  if (
    selectedElement &&
    (selectedElement.is('element', 'mathtex-inline') ||
      selectedElement.is('element', 'mathtex-display'))
  ) {
    return selectedElement;
  }

  return null;
}

export function isMathJaxVersion3(MathJaxObj: unknown): MathJaxObj is MathJax3 {
  return (
    MathJaxObj != null &&
    typeof MathJaxObj === 'object' &&
    'version' in MathJaxObj &&
    typeof MathJaxObj.version === 'string' &&
    MathJaxObj.version.split('.').length === 3 &&
    MathJaxObj.version.split('.')[0] === '3'
  );
}

export function isMathJaxVersion2(MathJaxObj: unknown): MathJaxObj is MathJax2 {
  return MathJaxObj != null && typeof MathJaxObj === 'object' && 'Hub' in MathJaxObj;
}

export function hasDelimiters(text: string): boolean {
  return /^(\\\[.*?\\\]|\\\(.*?\\\))$/.test(text.trim());
}

export function delimitersCounts(text: string): number | undefined {
  return text.match(/(\\\[|\\\]|\\\(|\\\))/g)?.length;
}

export function extractDelimiters(equation: string): {
  equation: string;
  display: boolean;
} {
  equation = equation.trim();

  const hasInlineDelimiters = equation.includes('\\(') && equation.includes('\\)');
  const hasDisplayDelimiters = equation.includes('\\[') && equation.includes('\\]');
  if (hasInlineDelimiters || hasDisplayDelimiters) {
    equation = equation.substring(2, equation.length - 2).trim();
  }

  return {
    equation,
    display: hasDisplayDelimiters,
  };
}

export async function renderEquation(
  equation: string,
  element: HTMLElement,
  engine:
    | 'katex'
    | 'mathjax'
    | undefined
    | ((equation: string, element: HTMLElement, display: boolean) => void) = 'katex',
  lazyLoad?: () => Promise<void>,
  display = false,
  preview = false,
  previewUid = '',
  previewClassName: Array<string> = [],
  katexRenderOptions: KatexOptions = {}
): Promise<void> {
  const win = typeof window !== 'undefined' ? window : undefined;

  if (engine === 'mathjax') {
    const mathJaxGlobal = win?.MathJax;
    if (isMathJaxVersion3(mathJaxGlobal)) {
      selectRenderMode(element, preview, previewUid, previewClassName, (el) => {
        renderMathJax3(mathJaxGlobal, equation, el, display, () => {
          if (preview) {
            moveAndScaleElement(element, el);
            el.style.visibility = 'visible';
          }
        });
      });
    } else if (isMathJaxVersion2(mathJaxGlobal) && win) {
      selectRenderMode(element, preview, previewUid, previewClassName, (el) => {
        win.setTimeout(() => {
          renderMathJax2(mathJaxGlobal, equation, el, display);
          if (preview) {
            mathJaxGlobal.Hub.Queue(() => {
              moveAndScaleElement(element, el);
              el.style.visibility = 'visible';
            });
          }
        });
      });
    }
  } else if (engine === 'katex') {
    selectRenderMode(element, preview, previewUid, previewClassName, (el) => {
      if (DISALLOWED_LATEX_MACRO_REGEX.test(equation)) {
        el.textContent = `[Blocked unsafe LaTeX macro: ${equation}]`;
        el.setAttribute('data-katex-error', 'unsafe-macro');
      } else {
        const activeKatex = (win as any)?.katex || katexLib;
        activeKatex.render(equation, el, {
          throwOnError: false,
          displayMode: display,
          ...katexRenderOptions,
          trust: false,
          maxExpand: 1000,
        } as any);
      }
      if (preview) {
        moveAndScaleElement(element, el);
        el.style.visibility = 'visible';
      }
    });
  } else if (typeof engine === 'function') {
    engine(equation, element, display);
  } else {
    if (lazyLoad != null && win) {
      try {
        win.CKEDITOR_MATH_LAZY_LOAD ??= lazyLoad();
        element.textContent = equation;
        await win.CKEDITOR_MATH_LAZY_LOAD;
        await renderEquation(
          equation,
          element,
          engine,
          undefined,
          display,
          preview,
          previewUid,
          previewClassName,
          katexRenderOptions
        );
      } catch (err) {
        element.textContent = equation;
        console.error(`math-tex-typesetting-lazy-load-failed: Lazy load failed: ${String(err)}`);
      }
    } else {
      element.textContent = equation;
      console.warn(
        `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${String(engine)}) for tex.`
      );
    }
  }
}

const SOUTH_ARROW_POSITIONS: Array<PositioningFunction> = [
  (targetRect, balloonRect) => ({
    top: targetRect.bottom + 10,
    left: targetRect.left + targetRect.width / 2 - balloonRect.width / 2,
    name: 'arrow_n',
  }),
  (targetRect) => ({
    top: targetRect.bottom + 10,
    left: targetRect.left,
    name: 'arrow_nw',
  }),
  (targetRect, balloonRect) => ({
    top: targetRect.bottom + 10,
    left: targetRect.right - balloonRect.width,
    name: 'arrow_ne',
  }),
];

export function getBalloonPositionData(editor: Editor): {
  target: Range | HTMLElement;
  positions: Array<PositioningFunction>;
} {
  const view = editor.editing.view;

  const selectedElement = view.document.selection.getSelectedElement();
  if (selectedElement) {
    return {
      target: view.domConverter.viewToDom(selectedElement) as HTMLElement,
      positions: SOUTH_ARROW_POSITIONS,
    };
  } else {
    const viewDocument = view.document;
    const firstRange = viewDocument.selection.getFirstRange();
    if (!firstRange) {
      throw new Error('math-missing-range');
    }
    return {
      target: view.domConverter.viewRangeToDom(firstRange),
      positions: SOUTH_ARROW_POSITIONS,
    };
  }
}

function selectRenderMode(
  element: HTMLElement,
  preview: boolean,
  previewUid: string,
  previewClassName: Array<string>,
  cb: (previewEl: HTMLElement) => void
) {
  if (preview && typeof document !== 'undefined') {
    createPreviewElement(element, previewUid, previewClassName, (previewEl) => {
      cb(previewEl);
    });
  } else {
    cb(element);
  }
}

function renderMathJax3(
  mathJaxInstance: MathJax3,
  equation: string,
  element: HTMLElement,
  display: boolean,
  cb: () => void
) {
  let promiseFunction:
    | undefined
    | ((input: string, options: { display: boolean }) => Promise<HTMLElement>) = undefined;
  if (mathJaxInstance.tex2chtmlPromise) {
    promiseFunction = mathJaxInstance.tex2chtmlPromise;
  } else if (mathJaxInstance.tex2svgPromise) {
    promiseFunction = mathJaxInstance.tex2svgPromise;
  }

  if (promiseFunction != null) {
    void promiseFunction(equation, { display }).then((node: Element) => {
      if (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(node);
      cb();
    });
  }
}

function renderMathJax2(
  mathJaxInstance: MathJax2,
  equation: string,
  element: HTMLElement,
  display?: boolean
) {
  if (display) {
    element.innerHTML = '\\[' + equation + '\\]';
  } else {
    element.innerHTML = '\\(' + equation + '\\)';
  }
  mathJaxInstance.Hub.Queue(['Typeset', mathJaxInstance.Hub, element]);
}

function createPreviewElement(
  element: HTMLElement,
  previewUid: string,
  previewClassName: Array<string>,
  render: (previewEl: HTMLElement) => void
): void {
  const previewEl = getPreviewElement(element, previewUid, previewClassName);
  render(previewEl);
}

function getPreviewElement(
  element: HTMLElement,
  previewUid: string,
  previewClassName: Array<string>
) {
  let previewEl = document.getElementById(previewUid);
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.setAttribute('id', previewUid);
    if (previewClassName.length > 0) {
      previewEl.classList.add(...previewClassName);
    }
    previewEl.style.visibility = 'hidden';
    document.body.appendChild(previewEl);

    let ticking = false;

    const renderTransformation = () => {
      if (!ticking && typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          if (previewEl) {
            moveElement(element, previewEl);
            ticking = false;
          }
        });
        ticking = true;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', renderTransformation);
      window.addEventListener('scroll', renderTransformation);
    }
  }
  return previewEl;
}

function moveAndScaleElement(parent: HTMLElement, child: HTMLElement) {
  moveElement(parent, child);
  const domRect = child.getBoundingClientRect();
  parent.style.width = domRect.width + 'px';
  parent.style.height = domRect.height + 'px';
}

function moveElement(parent: HTMLElement, child: HTMLElement) {
  const domRect = parent.getBoundingClientRect();
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const left = scrollX + domRect.left;
  const top = scrollY + domRect.top;
  child.style.position = 'absolute';
  child.style.left = left + 'px';
  child.style.top = top + 'px';
  child.style.zIndex = 'var(--ck-z-panel)';
  child.style.pointerEvents = 'none';
}
