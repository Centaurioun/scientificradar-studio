/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import { Command, type Editor } from 'ckeditor5';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
  public declare value: string | null;
  public declare display: boolean;

  constructor(editor: Editor) {
    super(editor);
    this.set('display', false);
  }

  public override execute(
    equation: string,
    display?: boolean,
    outputType: 'script' | 'span' = 'span',
    forceOutputType?: boolean
  ): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    model.change((writer) => {
      let mathtex;
      if (
        selectedElement &&
        (selectedElement.is('element', 'mathtex-inline') ||
          selectedElement.is('element', 'mathtex-display'))
      ) {
        const typeAttr = selectedElement.getAttribute('type') as 'script' | 'span' | undefined;
        const type = forceOutputType ? outputType : typeAttr || outputType;

        mathtex = writer.createElement(display ? 'mathtex-display' : 'mathtex-inline', {
          equation,
          type,
          display: Boolean(display),
        });
      } else {
        mathtex = writer.createElement(display ? 'mathtex-display' : 'mathtex-inline', {
          equation,
          type: outputType,
          display: Boolean(display),
        });
      }
      model.insertContent(mathtex);
    });
  }

  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    this.isEnabled =
      selectedElement === null ||
      selectedElement.is('element', 'mathtex-inline') ||
      selectedElement.is('element', 'mathtex-display');

    const selectedEquation = getSelectedMathModelWidget(selection);
    const value = selectedEquation?.getAttribute('equation');
    this.value = typeof value === 'string' ? value : null;
    const display = selectedEquation?.getAttribute('display');
    this.display = typeof display === 'boolean' ? display : false;
  }
}
