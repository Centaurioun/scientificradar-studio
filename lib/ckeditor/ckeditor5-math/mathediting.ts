/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 * Enhanced with bidirectional upcast/downcast for ScientificRadar canonical `data-math-tex` / `data-math-display`.
 */

import MathCommand from './mathcommand';
import {
  type Editor,
  Plugin,
  toWidget,
  Widget,
  viewToModelPositionOutsideModelElement,
  type ViewDowncastWriter as DowncastWriter,
  type ModelElement as Element,
  CKEditorError,
  uid,
} from 'ckeditor5';
import { renderEquation, extractDelimiters } from './utils';
import type { MathConfig } from './typings-external';

export default class MathEditing extends Plugin {
  public static get requires() {
    return [Widget] as const;
  }

  public static get pluginName() {
    return 'MathEditing' as const;
  }

  constructor(editor: Editor) {
    super(editor);
    editor.config.define('math', {
      engine: 'katex',
      outputType: 'span',
      className: 'math-tex',
      forceOutputType: false,
      enablePreview: true,
      previewClassName: [],
      popupClassName: [],
      katexRenderOptions: {},
    });
  }

  public init(): void {
    const editor = this.editor;
    editor.commands.add('math', new MathCommand(editor));

    this._defineSchema();
    this._defineConverters();

    editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(editor.model, (viewElement) =>
        viewElement.hasClass('math') || viewElement.hasClass('ck-math-tex')
      )
    );
  }

  private _defineSchema() {
    const schema = this.editor.model.schema;
    schema.register('mathtex-inline', {
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['equation', 'type', 'display'],
    });

    schema.register('mathtex-display', {
      allowWhere: '$block',
      isInline: false,
      isObject: true,
      allowAttributes: ['equation', 'type', 'display'],
    });
  }

  private _defineConverters() {
    const conversion = this.editor.conversion;
    const mathConfig = (this.editor.config.get('math') || {
      engine: 'katex',
      outputType: 'span',
      className: 'math-tex',
      forceOutputType: false,
      enablePreview: true,
      previewClassName: [],
      popupClassName: [],
      katexRenderOptions: {},
    }) as MathConfig;

    // View -> Model
    conversion
      .for('upcast')
      // ScientificRadar canonical block math (<div data-math-tex="..." data-math-display="block">)
      .elementToElement({
        view: {
          name: 'div',
          attributes: {
            'data-math-tex': true,
          },
        },
        model: (viewElement, { writer }) => {
          const rawTex = viewElement.getAttribute('data-math-tex');
          if (!rawTex) return null;
          const equation = rawTex.trim();
          return writer.createElement('mathtex-display', {
            equation,
            type: 'span',
            display: true,
          });
        },
        converterPriority: 'high',
      })
      // ScientificRadar canonical inline math (<span data-math-tex="..." data-math-display="inline">)
      .elementToElement({
        view: {
          name: 'span',
          attributes: {
            'data-math-tex': true,
          },
        },
        model: (viewElement, { writer }) => {
          const rawTex = viewElement.getAttribute('data-math-tex');
          if (!rawTex) return null;
          const equation = rawTex.trim();
          const isBlock = viewElement.getAttribute('data-math-display') === 'block';
          return writer.createElement(isBlock ? 'mathtex-display' : 'mathtex-inline', {
            equation,
            type: 'span',
            display: isBlock,
          });
        },
        converterPriority: 'high',
      })
      // MathJax inline way (e.g. <script type="math/tex">\sqrt{\frac{a}{b}}</script>)
      .elementToElement({
        view: {
          name: 'script',
          attributes: {
            type: 'math/tex',
          },
        },
        model: (viewElement, { writer }) => {
          const child = viewElement.getChild(0);
          if (child?.is('$text')) {
            const equation = child.data.trim();
            return writer.createElement('mathtex-inline', {
              equation,
              type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
              display: false,
            });
          }
          return null;
        },
      })
      // MathJax display way (e.g. <script type="math/tex; mode=display">\sqrt{\frac{a}{b}}</script>)
      .elementToElement({
        view: {
          name: 'script',
          attributes: {
            type: 'math/tex; mode=display',
          },
        },
        model: (viewElement, { writer }) => {
          const child = viewElement.getChild(0);
          if (child?.is('$text')) {
            const equation = child.data.trim();
            return writer.createElement('mathtex-display', {
              equation,
              type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
              display: true,
            });
          }
          return null;
        },
      })
      // CKEditor 4 / CKEditor Math span way (e.g. <span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>)
      .elementToElement({
        view: {
          name: 'span',
          classes: [mathConfig.className || 'math-tex'],
        },
        model: (viewElement, { writer }) => {
          const attrTex = viewElement.getAttribute('data-math-tex');
          if (attrTex) {
            const isBlock = viewElement.getAttribute('data-math-display') === 'block';
            return writer.createElement(isBlock ? 'mathtex-display' : 'mathtex-inline', {
              equation: attrTex.trim(),
              type: 'span',
              display: isBlock,
            });
          }
          const child = viewElement.getChild(0);
          if (child?.is('$text')) {
            const equation = child.data.trim();
            const params = Object.assign(extractDelimiters(equation), {
              type: mathConfig.forceOutputType ? mathConfig.outputType : 'span',
            });

            return writer.createElement(
              params.display ? 'mathtex-display' : 'mathtex-inline',
              params
            );
          }
          return null;
        },
      })
      // KaTeX from Quill: <span class="ql-formula" data-value="...">
      .elementToElement({
        view: {
          name: 'span',
          classes: ['ql-formula'],
        },
        model: (viewElement, { writer }) => {
          const equation = viewElement.getAttribute('data-value');
          if (equation == null) {
            throw new CKEditorError('missing-equation', { pluginName: 'math' });
          }
          return writer.createElement('mathtex-inline', {
            equation: equation.trim(),
            type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
            display: false,
          });
        },
      });

    // Model -> Editing View
    conversion
      .for('editingDowncast')
      .elementToElement({
        model: 'mathtex-inline',
        view: (modelItem, { writer }) => {
          const widgetElement = createMathtexEditingView(modelItem, writer);
          return toWidget(widgetElement, writer);
        },
      })
      .elementToElement({
        model: 'mathtex-display',
        view: (modelItem, { writer }) => {
          const widgetElement = createMathtexEditingView(modelItem, writer);
          return toWidget(widgetElement, writer);
        },
      });

    // Model -> Data
    conversion
      .for('dataDowncast')
      .elementToElement({
        model: 'mathtex-inline',
        view: createMathtexView,
      })
      .elementToElement({
        model: 'mathtex-display',
        view: createMathtexView,
      });

    function createMathtexEditingView(modelItem: Element, writer: DowncastWriter) {
      const equation = String(modelItem.getAttribute('equation') || '');
      const display = Boolean(modelItem.getAttribute('display'));

      const styles = 'user-select: none; ' + (display ? '' : 'display: inline-block;');
      const classes = 'ck-math-tex ' + (display ? 'ck-math-tex-display' : 'ck-math-tex-inline');

      const mathtexView = writer.createContainerElement(display ? 'div' : 'span', {
        style: styles,
        class: classes,
        'data-math-tex': equation,
        'data-math-display': display ? 'block' : 'inline',
      });

      const uiElement = writer.createUIElement(
        'span',
        null,
        function (
          this: { toDomElement: (doc: Document) => HTMLElement },
          domDocument: Document
        ) {
          const domElement = this.toDomElement(domDocument);

          void renderEquation(
            equation,
            domElement,
            mathConfig.engine,
            mathConfig.lazyLoad,
            display,
            false,
            `math-editing-${uid()}`,
            mathConfig.previewClassName || [],
            mathConfig.katexRenderOptions || {}
          );

          return domElement;
        }
      );

      writer.insert(writer.createPositionAt(mathtexView, 0), uiElement);

      return mathtexView;
    }

    function createMathtexView(
      modelItem: Element,
      { writer }: { writer: DowncastWriter }
    ) {
      const equation = modelItem.getAttribute('equation');
      if (typeof equation !== 'string') {
        throw new CKEditorError('missing-equation', { pluginName: 'math' });
      }

      const type = modelItem.getAttribute('type');
      const display = Boolean(modelItem.getAttribute('display'));

      if (type !== 'script') {
        if (display) {
          const mathtexView = writer.createContainerElement('div', {
            class: mathConfig.className || 'math-tex',
            'data-math-tex': equation,
            'data-math-display': 'block',
          });
          writer.insert(
            writer.createPositionAt(mathtexView, 0),
            writer.createText('\\[' + equation + '\\]')
          );
          return mathtexView;
        } else {
          const mathtexView = writer.createContainerElement('span', {
            class: mathConfig.className || 'math-tex',
            'data-math-tex': equation,
            'data-math-display': 'inline',
          });
          writer.insert(
            writer.createPositionAt(mathtexView, 0),
            writer.createText('\\(' + equation + '\\)')
          );
          return mathtexView;
        }
      } else {
        const mathtexView = writer.createContainerElement('script', {
          type: display ? 'math/tex; mode=display' : 'math/tex',
        });

        writer.insert(
          writer.createPositionAt(mathtexView, 0),
          writer.createText(equation)
        );

        return mathtexView;
      }
    }
  }
}
