/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import {
  ClipboardPipeline,
  Plugin,
  type Editor,
  ModelLivePosition as LivePosition,
  ModelLiveRange as LiveRange,
  Undo,
  global,
} from 'ckeditor5';
import { extractDelimiters, hasDelimiters, delimitersCounts } from './utils';
import type { MathConfig } from './typings-external';

export default class AutoMath extends Plugin {
  public static get requires() {
    return [ClipboardPipeline, Undo] as const;
  }

  public static get pluginName() {
    return 'AutoMath' as const;
  }

  private _timeoutId: null | number;
  private _positionToInsert: null | LivePosition;

  constructor(editor: Editor) {
    super(editor);
    this._timeoutId = null;
    this._positionToInsert = null;
  }

  public init(): void {
    const editor = this.editor;

    this.listenTo(
      editor.plugins.get(ClipboardPipeline),
      'contentInsertion',
      (_event, data) => {
        if (data.method !== 'paste' || !data.resultRange) {
          return;
        }

        const leftLivePosition = LivePosition.fromPosition(data.resultRange.start);
        leftLivePosition.stickiness = 'toPrevious';
        const rightLivePosition = LivePosition.fromPosition(data.resultRange.end);
        rightLivePosition.stickiness = 'toNext';

        this._mathBetweenPositions(leftLivePosition, rightLivePosition);
        leftLivePosition.detach();
        rightLivePosition.detach();
      },
      { priority: 'lowest' }
    );

    editor.commands.get('undo')?.on(
      'execute',
      () => {
        if (this._timeoutId) {
          global.window.clearTimeout(this._timeoutId);
          this._positionToInsert?.detach();

          this._timeoutId = null;
          this._positionToInsert = null;
        }
      },
      { priority: 'high' }
    );
  }

  private _mathBetweenPositions(leftPosition: LivePosition, rightPosition: LivePosition) {
    const editor = this.editor;
    const mathConfig = (this.editor.config.get('math') || {
      outputType: 'span',
    }) as MathConfig;

    const equationRange = new LiveRange(leftPosition, rightPosition);
    const walker = equationRange.getWalker({ ignoreElementEnd: true });

    let text = '';

    for (const node of walker) {
      if (node.item.is('$textProxy')) {
        text += node.item.data;
      }
    }

    text = text.trim();

    if (!hasDelimiters(text) || delimitersCounts(text) !== 2) {
      return;
    }

    const mathCommand = editor.commands.get('math');

    if (!mathCommand?.isEnabled) {
      return;
    }

    this._positionToInsert = LivePosition.fromPosition(leftPosition);

    this._timeoutId = global.window.setTimeout(() => {
      editor.model.change((writer) => {
        this._timeoutId = null;

        writer.remove(equationRange);

        let insertPosition: LivePosition | null = null;

        if (this._positionToInsert?.root.rootName !== '$graveyard') {
          insertPosition = this._positionToInsert;
        }

        editor.model.change((innerWriter) => {
          const params = Object.assign(extractDelimiters(text), {
            type: mathConfig.outputType || 'span',
          });
          const mathElement = innerWriter.createElement(
            params.display ? 'mathtex-display' : 'mathtex-inline',
            params
          );

          editor.model.insertContent(mathElement, insertPosition);
          innerWriter.setSelection(mathElement, 'on');
        });

        this._positionToInsert?.detach();
        this._positionToInsert = null;
      });
    }, 100);
  }
}
