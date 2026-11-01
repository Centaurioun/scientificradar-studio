/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import {
  IconCheck,
  IconCancel,
  ButtonView,
  createLabeledInputText,
  FocusCycler,
  LabelView,
  LabeledFieldView,
  submitHandler,
  SwitchButtonView,
  View,
  ViewCollection,
  type InputTextView,
  type FocusableView,
  Locale,
  FocusTracker,
  KeystrokeHandler,
} from 'ckeditor5';
import { extractDelimiters, hasDelimiters } from '../utils';
import MathView from './mathview';
import type { KatexOptions } from '../typings-external';

const checkIcon = IconCheck;
const cancelIcon = IconCancel;

class MathInputView extends LabeledFieldView<InputTextView> {
  public declare value: null | string;
  public isReadOnly = false;

  constructor(locale: Locale) {
    super(locale, createLabeledInputText);
    this.set('value', null);
  }
}

export default class MainFormView extends View {
  public saveButtonView: ButtonView;
  public mathInputView: MathInputView;
  public displayButtonView: SwitchButtonView;
  public cancelButtonView: ButtonView;
  public previewEnabled: boolean;
  public previewLabel?: LabelView;
  public mathView?: MathView;
  public override locale: Locale = new Locale();
  public lazyLoad: undefined | (() => Promise<void>);

  public focusTracker: FocusTracker = new FocusTracker();
  public keystrokes: KeystrokeHandler = new KeystrokeHandler();
  private _focusables = new ViewCollection<FocusableView>();
  private _focusCycler: FocusCycler;

  constructor(
    locale: Locale,
    engine:
      | 'mathjax'
      | 'katex'
      | ((equation: string, element: HTMLElement, display: boolean) => void),
    lazyLoad: undefined | (() => Promise<void>),
    previewEnabled = false,
    previewUid: string,
    previewClassName: Array<string>,
    popupClassName: Array<string>,
    katexRenderOptions: KatexOptions
  ) {
    super(locale);

    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        focusPrevious: 'shift + tab',
        focusNext: 'tab',
      },
    });

    const t = locale.t;

    this.saveButtonView = this._createButton(t('Save'), checkIcon, 'ck-button-save', null);
    this.saveButtonView.type = 'submit';

    this.mathInputView = this._createMathInput();
    this.displayButtonView = this._createDisplayButton();
    this.cancelButtonView = this._createButton(t('Cancel'), cancelIcon, 'ck-button-cancel', 'cancel');

    this.previewEnabled = previewEnabled;

    let children = [];
    if (this.previewEnabled) {
      this.previewLabel = new LabelView(locale);
      this.previewLabel.text = t('Equation preview');

      this.mathView = new MathView(
        engine,
        lazyLoad,
        locale,
        previewUid,
        previewClassName,
        katexRenderOptions
      );
      this.mathView.bind('display').to(this.displayButtonView, 'isOn');

      children = [
        this.mathInputView,
        this.displayButtonView,
        this.previewLabel,
        this.mathView,
      ];
    } else {
      children = [this.mathInputView, this.displayButtonView];
    }

    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'ck-math-form', ...popupClassName],
        tabindex: '-1',
        spellcheck: 'false',
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: ['ck-math-view'],
          },
          children,
        },
        this.saveButtonView,
        this.cancelButtonView,
      ],
    });
  }

  public override render(): void {
    super.render();

    submitHandler({
      view: this,
    });

    const childViews = [
      this.mathInputView,
      this.displayButtonView,
      this.saveButtonView,
      this.cancelButtonView,
    ];

    childViews.forEach((v) => {
      if (v.element) {
        this._focusables.add(v);
        this.focusTracker.add(v.element);
      }
    });

    if (this.element) {
      this.keystrokes.listenTo(this.element);
    }
  }

  public focus(): void {
    this._focusCycler.focusFirst();
  }

  public get equation(): string {
    return this.mathInputView.fieldView.element?.value ?? '';
  }

  public set equation(equation: string) {
    if (this.mathInputView.fieldView.element) {
      this.mathInputView.fieldView.element.value = equation;
    }
    if (this.previewEnabled && this.mathView) {
      this.mathView.value = equation;
    }
  }

  private _createMathInput() {
    const t = this.locale.t;

    const mathInput = new MathInputView(this.locale);
    const fieldView = mathInput.fieldView;
    mathInput.infoText = t('Insert equation in TeX format.');

    const onInput = () => {
      if (fieldView.element != null) {
        let equationInput = fieldView.element.value.trim();

        if (hasDelimiters(equationInput)) {
          const params = extractDelimiters(equationInput);
          fieldView.element.value = params.equation;
          equationInput = params.equation;
          this.displayButtonView.isOn = params.display;
        }
        if (this.previewEnabled && this.mathView) {
          this.mathView.value = equationInput;
        }

        this.saveButtonView.isEnabled = Boolean(equationInput);
      }
    };

    fieldView.on('render', onInput);
    fieldView.on('input', onInput);

    return mathInput;
  }

  private _createButton(
    label: string,
    icon: string,
    className: string,
    eventName: string | null
  ) {
    const button = new ButtonView(this.locale);

    button.set({
      label,
      icon,
      tooltip: true,
    });

    button.extendTemplate({
      attributes: {
        class: className,
      },
    });

    if (eventName) {
      button.delegate('execute').to(this, eventName);
    }

    return button;
  }

  private _createDisplayButton() {
    const t = this.locale.t;

    const switchButton = new SwitchButtonView(this.locale);

    switchButton.set({
      label: t('Display mode'),
      withText: true,
    });

    switchButton.extendTemplate({
      attributes: {
        class: 'ck-button-display-toggle',
      },
    });

    switchButton.on('execute', () => {
      switchButton.isOn = !switchButton.isOn;

      if (this.previewEnabled && this.mathView) {
        this.mathView.display = switchButton.isOn;
      }
    });

    return switchButton;
  }
}
