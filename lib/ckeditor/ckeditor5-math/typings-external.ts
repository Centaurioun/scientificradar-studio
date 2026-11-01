/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 * Adapted for ScientificRadar Studio CKEditor 5 v49.0.1 + KaTeX integration.
 */

export interface MathJax3 {
  version: string;
  tex2chtmlPromise?: (input: string, options: { display: boolean }) => Promise<HTMLElement>;
  tex2svgPromise?: (input: string, options: { display: boolean }) => Promise<HTMLElement>;
}

export interface MathJax2 {
  Hub: {
    Queue: (callback: [string, MathJax2['Hub'], string | HTMLElement] | (() => void)) => void;
  };
}

export interface Katex {
  render(equation: string, el: HTMLElement, options: KatexOptions): void;
  renderToString?(equation: string, options?: KatexOptions): string;
}

declare global {
  var CKEDITOR_MATH_LAZY_LOAD: undefined | Promise<void>;
  var MathJax: undefined | MathJax2 | MathJax3;
}

export interface KatexOptions {
  displayMode?: boolean | undefined;
  output?: 'html' | 'mathml' | 'htmlAndMathml' | undefined;
  leqno?: boolean | undefined;
  fleqn?: boolean | undefined;
  throwOnError?: boolean | undefined;
  errorColor?: string | undefined;
  macros?: Record<string, string> | undefined;
  minRuleThickness?: number | undefined;
  colorIsTextColor?: boolean | undefined;
  maxSize?: number | undefined;
  maxExpand?: number | undefined;
  strict?: boolean | string | ((errorCode: string, errorMsg: string, token: unknown) => string | boolean | undefined) | undefined;
  trust?: boolean | ((context: object) => boolean) | undefined;
  globalGroup?: boolean | undefined;
}

export interface MathConfig {
  engine?:
    | 'mathjax'
    | 'katex'
    | ((equation: string, element: HTMLElement, display: boolean) => void)
    | undefined;
  lazyLoad?: undefined | (() => Promise<void>);
  outputType?: 'script' | 'span' | undefined;
  className?: string | undefined;
  forceOutputType?: boolean | undefined;
  enablePreview?: boolean | undefined;
  previewClassName?: Array<string> | undefined;
  popupClassName?: Array<string> | undefined;
  katexRenderOptions?: Partial<KatexOptions> | undefined;
}
