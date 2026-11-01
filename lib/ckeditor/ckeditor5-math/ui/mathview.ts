/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import { View, type Locale } from 'ckeditor5';
import type { KatexOptions } from '../typings-external';
import { renderEquation } from '../utils';

export default class MathView extends View {
  declare public value: string;
  declare public display: boolean;
  public previewUid: string;
  public previewClassName: Array<string>;
  public katexRenderOptions: KatexOptions;
  public engine:
    | 'mathjax'
    | 'katex'
    | ((equation: string, element: HTMLElement, display: boolean) => void);
  public lazyLoad: undefined | (() => Promise<void>);

  constructor(
    engine:
      | 'mathjax'
      | 'katex'
      | ((equation: string, element: HTMLElement, display: boolean) => void),
    lazyLoad: undefined | (() => Promise<void>),
    locale: Locale,
    previewUid: string,
    previewClassName: Array<string>,
    katexRenderOptions: KatexOptions
  ) {
    super(locale);

    this.engine = engine;
    this.lazyLoad = lazyLoad;
    this.previewUid = previewUid;
    this.katexRenderOptions = katexRenderOptions;
    this.previewClassName = previewClassName;

    this.set('value', '');
    this.value = '';
    this.set('display', false);
    this.display = false;

    this.on('change', () => {
      if (this.isRendered) {
        this.updateMath();
      }
    });

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-math-preview'],
      },
    });
  }

  public updateMath(): void {
    if (this.element) {
      void renderEquation(
        this.value,
        this.element,
        this.engine,
        this.lazyLoad,
        this.display,
        true,
        this.previewUid,
        this.previewClassName,
        this.katexRenderOptions
      );
    }
  }

  public override render(): void {
    super.render();
    this.updateMath();
  }
}
