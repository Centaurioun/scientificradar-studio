/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import { Plugin, Autoformat, global, logWarning, blockAutoformatEditing } from 'ckeditor5';
import Math from './math';
import MathCommand from './mathcommand';
import MathUI from './mathui';

export default class AutoformatMath extends Plugin {
  public static get requires() {
    return [Math, Autoformat] as const;
  }

  public init(): void {
    const editor = this.editor;

    if (!editor.plugins.has('Math')) {
      logWarning('autoformat-math-feature-missing', editor);
    }
  }

  public afterInit(): void {
    const editor = this.editor;
    const command = editor.commands.get('math');

    if (command instanceof MathCommand) {
      const callback = () => {
        if (!command.isEnabled) {
          return false;
        }

        command.display = true;

        global.window.setTimeout(() => {
          const mathUIInstance = editor.plugins.get('MathUI');
          if (mathUIInstance instanceof MathUI) {
            mathUIInstance._showUI();
          }
        }, 50);
      };

      blockAutoformatEditing(editor, editor.plugins.get(Autoformat), /^\$\$$/, callback);
      blockAutoformatEditing(editor, editor.plugins.get(Autoformat), /^\\\[$/, callback);
    }
  }

  public static get pluginName() {
    return 'AutoformatMath' as const;
  }
}
