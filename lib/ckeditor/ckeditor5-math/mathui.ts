/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import MathEditing from './mathediting';
import MainFormView from './ui/mainformview';
import {
  Plugin,
  ClickObserver,
  ButtonView,
  ContextualBalloon,
  clickOutsideHandler,
  CKEditorError,
  global,
  uid,
} from 'ckeditor5';
import { getBalloonPositionData } from './utils';
import MathCommand from './mathcommand';
import type { MathConfig } from './typings-external';

const mathIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.44 10.78" height="40.74" width="58.35"><path d="M8.15 0c-.06 0-.1.02-.11.03a.12.12 0 0 0-.02.01 6.81 6.81 0 0 0-2.32 4.9v.9a6.82 6.82 0 0 0 2.32 4.9.12.12 0 0 0 .02 0c.02.02.06.04.11.04.07 0 .12-.03.16-.07a.22.22 0 0 0 0-.32.12.12 0 0 0-.02-.02A4.4 4.4 0 0 1 7 8.44a7.62 7.62 0 0 1-.5-2.6v-.9c0-.82.19-1.76.5-2.6A4.4 4.4 0 0 1 8.3.42.12.12 0 0 0 8.3.39a.22.22 0 0 0 .08-.16.22.22 0 0 0-.07-.16.22.22 0 0 0-.16-.07zm4.83 0a.22.22 0 0 0-.16.07.22.22 0 0 0-.07.16c0 .08.05.13.08.16a.12.12 0 0 0 .01.02c.52.39.98 1.1 1.3 1.94.3.83.49 1.77.49 2.6v.88c0 .83-.18 1.78-.5 2.6a4.4 4.4 0 0 1-1.29 1.95.22.22 0 0 0-.01.33c.03.04.08.07.15.07.05 0 .09-.02.12-.03a.12.12 0 0 0 .02-.01 6.82 6.82 0 0 0 2.32-4.9v-.9a6.81 6.81 0 0 0-2.32-4.9.12.12 0 0 0-.02 0c-.03-.02-.06-.04-.12-.04zm-8.5.46c-.4 0-1.13.23-1.46 1.32-.06.2-.11.45-.33 1.58h-.64c-.1 0-.19-.01-.28.03a.25.25 0 0 0-.12.12.38.38 0 0 0-.03.17c0 .04 0 .1.04.14.03.04.07.07.11.08.09.03.16.02.26.02h.56l-.77 4.04c-.1.51-.19 1-.32 1.36-.06.18-.14.32-.22.4-.08.1-.16.13-.26.13-.03 0-.1 0-.2-.03.11-.05.2-.13.26-.2a.7.7 0 0 0 .13-.4.48.48 0 0 0-.16-.38.53.53 0 0 0-.35-.12c-.34 0-.7.3-.7.76 0 .27.14.5.34.64s.44.2.68.2c.33 0 .61-.17.83-.4.21-.21.37-.48.47-.69.18-.35.32-.84.43-1.25a14.17 14.17 0 0 0 .18-.8l.61-3.26h.81c.1 0 .2.01.3-.03.04-.03.09-.07.11-.13.02-.05.03-.1.03-.17 0-.05-.01-.1-.05-.14a.23.23 0 0 0-.11-.07c-.08-.03-.16-.02-.25-.02h-.73l.2-1.07a26.3 26.3 0 0 1 .24-1.07c.08-.17.22-.3.39-.3l.21.05a.7.7 0 0 0-.25.2.7.7 0 0 0-.13.4c0 .15.06.28.16.37.1.08.22.12.35.12.34 0 .7-.3.7-.76 0-.28-.15-.5-.35-.64-.2-.14-.45-.2-.7-.2zm5.4 2.78c-.6 0-1.06.37-1.36.76-.16.2-.27.4-.35.57-.07.18-.12.3-.12.42 0 .1.08.18.14.2.06.03.1.02.1.02.06 0 .12 0 .18-.04.05-.05.07-.1.08-.17v.02c.35-1.09 1-1.3 1.3-1.3.09 0 .2.01.29.09.09.07.17.2.17.5 0 .27-.18 1-.57 2.48a1.8 1.8 0 0 1-.37.75.7.7 0 0 1-.52.26c-.04 0-.13 0-.22-.03a.68.68 0 0 0 .3-.56.47.47 0 0 0-.18-.39.55.55 0 0 0-.32-.1c-.4 0-.7.33-.7.74 0 .28.16.5.38.63.21.13.48.18.73.18.39 0 .69-.2.89-.41.09-.1.15-.19.2-.27.2.36.59.68 1.16.68.6 0 1.05-.37 1.35-.76.15-.2.27-.4.34-.57.08-.18.12-.3.12-.42a.24.24 0 0 0-.11-.2c-.06-.03-.12-.02-.13-.02a.26.26 0 0 0-.18.06c-.05.05-.06.1-.07.14-.34 1.1-1.02 1.3-1.3 1.3-.17 0-.27-.06-.35-.17a.72.72 0 0 1-.11-.4c0-.22.06-.45.18-.91l.36-1.45c.03-.14.1-.44.25-.7.15-.25.36-.46.68-.46.03 0 .12 0 .22.03a.7.7 0 0 0-.32.56c0 .11.04.23.13.33.08.1.22.16.4.16.14 0 .3-.06.44-.18a.73.73 0 0 0 .24-.55c0-.32-.2-.54-.42-.66a1.52 1.52 0 0 0-.68-.16c-.34 0-.62.16-.82.34a1.8 1.8 0 0 0-.3.35 1.32 1.32 0 0 0-.5-.54 1.37 1.37 0 0 0-.63-.15z" style="line-height:1.25;-inkscape-font-specification:\'Latin Modern Math\'" font-weight="400" font-size="10.58" font-family="Latin Modern Math" letter-spacing="-1.06" word-spacing="0"/></svg>';

const mathKeystroke = 'Ctrl+M';

export default class MathUI extends Plugin {
  public static get requires() {
    return [ContextualBalloon, MathEditing] as const;
  }

  public static get pluginName() {
    return 'MathUI' as const;
  }

  private _previewUid = `math-preview-${uid()}`;
  private _balloon!: ContextualBalloon;
  public formView: MainFormView | null = null;

  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);
    editor.editing.view.addObserver(ClickObserver);

    this._createToolbarMathButton();
    this.formView = this._createFormView();
    this._enableUserBalloonInteractions();
  }

  public override destroy(): void {
    super.destroy();

    this.formView?.destroy();

    const previewEl = global.document.getElementById(this._previewUid);
    if (previewEl) {
      previewEl.parentNode?.removeChild(previewEl);
    }
  }

  public _showUI(): void {
    const editor = this.editor;
    const mathCommand = editor.commands.get('math');

    if (!mathCommand?.isEnabled) {
      return;
    }

    this._addFormView();
    this._balloon.showStack('main');
  }

  private _createFormView() {
    const editor = this.editor;
    const mathCommand = editor.commands.get('math');
    if (!(mathCommand instanceof MathCommand)) {
      throw new CKEditorError('math-command', null);
    }

    const mathConfig = (editor.config.get('math') || {
      engine: 'katex',
      outputType: 'span',
      className: 'math-tex',
      forceOutputType: false,
      enablePreview: true,
      previewClassName: [],
      popupClassName: [],
      katexRenderOptions: {},
    }) as MathConfig;

    const formView = new MainFormView(
      editor.locale,
      mathConfig.engine || 'katex',
      mathConfig.lazyLoad,
      mathConfig.enablePreview ?? true,
      this._previewUid,
      mathConfig.previewClassName || [],
      mathConfig.popupClassName || [],
      mathConfig.katexRenderOptions || {}
    );

    formView.mathInputView.bind('value').to(mathCommand, 'value');
    formView.displayButtonView.bind('isOn').to(mathCommand, 'display');

    formView.mathInputView.bind('isReadOnly').to(mathCommand, 'isEnabled', (value) => !value);
    formView.saveButtonView.bind('isEnabled').to(mathCommand);
    formView.displayButtonView.bind('isEnabled').to(mathCommand);

    this.listenTo(formView, 'submit', () => {
      editor.execute(
        'math',
        formView.equation,
        formView.displayButtonView.isOn,
        mathConfig.outputType,
        mathConfig.forceOutputType
      );
      this._closeFormView();
    });

    this.listenTo(formView, 'cancel', () => {
      this._closeFormView();
    });

    formView.keystrokes.set('esc', (_data, cancel) => {
      this._closeFormView();
      cancel();
    });

    return formView;
  }

  private _addFormView() {
    if (this._isFormInPanel) {
      return;
    }

    const editor = this.editor;
    const mathCommand = editor.commands.get('math');
    if (!(mathCommand instanceof MathCommand)) {
      throw new CKEditorError('plugin-load', { pluginName: 'math' });
    }

    if (this.formView == null) {
      return;
    }

    this._balloon.add({
      view: this.formView,
      position: getBalloonPositionData(editor),
    });

    if (this._balloon.visibleView === this.formView) {
      this.formView.mathInputView.fieldView.element?.select();
    }

    const previewEl = global.document.getElementById(this._previewUid);
    if (previewEl && this.formView.previewEnabled) {
      this.formView.mathView?.updateMath();
    }

    this.formView.equation = mathCommand.value ?? '';
    this.formView.displayButtonView.isOn = mathCommand.display || false;
  }

  public _hideUI(): void {
    if (!this._isFormInPanel) {
      return;
    }

    const editor = this.editor;

    this.stopListening(editor.ui, 'update');
    this.stopListening(this._balloon, 'change:visibleView');

    editor.editing.view.focus();
    this._removeFormView();
  }

  private _closeFormView() {
    const mathCommand = this.editor.commands.get('math');
    if (mathCommand?.value != null) {
      this._removeFormView();
    } else {
      this._hideUI();
    }
  }

  private _removeFormView() {
    if (this._isFormInPanel && this.formView) {
      this.formView.saveButtonView.focus();
      this._balloon.remove(this.formView);

      const previewEl = global.document.getElementById(this._previewUid);
      if (previewEl) {
        previewEl.style.visibility = 'hidden';
      }

      this.editor.editing.view.focus();
    }
  }

  private _createToolbarMathButton() {
    const editor = this.editor;
    const mathCommand = editor.commands.get('math');
    if (!mathCommand) {
      throw new CKEditorError('plugin-load', { pluginName: 'math' });
    }
    const t = editor.t;

    editor.keystrokes.set(mathKeystroke, (_keyEvtData, cancel) => {
      cancel();
      if (mathCommand.isEnabled) {
        this._showUI();
      }
    });

    this.editor.ui.componentFactory.add('math', (locale) => {
      const button = new ButtonView(locale);

      button.isEnabled = true;
      button.label = t('Insert math');
      button.icon = mathIcon;
      button.keystroke = mathKeystroke;
      button.tooltip = true;
      button.isToggleable = true;

      button.bind('isEnabled').to(mathCommand, 'isEnabled');

      this.listenTo(button, 'execute', () => {
        this._showUI();
      });

      return button;
    });
  }

  private _enableUserBalloonInteractions() {
    const editor = this.editor;
    const viewDocument = this.editor.editing.view.document;
    this.listenTo(viewDocument, 'click', () => {
      const mathCommand = editor.commands.get('math');
      if (mathCommand?.isEnabled && mathCommand.value) {
        this._showUI();
      }
    });

    editor.keystrokes.set('Esc', (_data, cancel) => {
      if (this._isUIVisible) {
        this._hideUI();
        cancel();
      }
    });

    if (this.formView) {
      clickOutsideHandler({
        emitter: this.formView,
        activator: () => Boolean(this._isFormInPanel),
        contextElements: this._balloon.view.element ? [this._balloon.view.element] : [],
        callback: () => {
          this._hideUI();
        },
      });
    } else {
      throw new Error('missing form view');
    }
  }

  private get _isUIVisible() {
    const visibleView = this._balloon.visibleView;
    return visibleView === this.formView;
  }

  private get _isFormInPanel() {
    return this.formView && this._balloon.hasView(this.formView);
  }
}
