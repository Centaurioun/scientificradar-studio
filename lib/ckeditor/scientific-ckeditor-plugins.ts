import {
  Command,
  Plugin,
  Widget,
  toWidget,
  viewToModelPositionOutsideModelElement,
  type Editor,
  type ViewDowncastWriter,
  type ModelElement,
  type ViewElement,
} from 'ckeditor5';
import type { ScientificSource } from '@/lib/types';

export interface ScientificCitationInsertPayload {
  sourceId: string;
  label?: string;
}

export class InsertScientificCitationCommand extends Command {
  public override execute(payload: ScientificCitationInsertPayload): void {
    if (!payload?.sourceId) return;
    const model = this.editor.model;
    model.change((writer) => {
      const citationNode = writer.createElement('scientificCitation', {
        sourceId: payload.sourceId,
        label: payload.label || '[Cite]',
        orphaned: false,
      });
      model.insertContent(citationNode);
      writer.setSelection(citationNode, 'after');
    });
  }

  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    this.isEnabled = model.schema.checkChild(
      selection.focus?.parent as ModelElement,
      'scientificCitation'
    );
  }
}

/**
 * CKEditor 5 plugin that preserves `<sup data-citation-source-id="...">` as a structured inline
 * widget with appearance-order numbering (`[1]`, `[2]`) and orphaned citation warnings (`[!N]`).
 */
export class ScientificCitationPlugin extends Plugin {
  public static get requires() {
    return [Widget] as const;
  }

  public static get pluginName() {
    return 'ScientificCitationPlugin' as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;
    const conversion = editor.conversion;

    schema.register('scientificCitation', {
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['sourceId', 'label', 'orphaned'],
    });

    editor.commands.add(
      'insertScientificCitation',
      new InsertScientificCitationCommand(editor)
    );

    editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(editor.model, (viewElement) =>
        viewElement.hasClass('ck-scientific-citation')
      )
    );

    // Upcast <sup data-citation-source-id="..."> before standard Superscript plugin
    conversion.for('upcast').elementToElement({
      view: {
        name: 'sup',
        attributes: {
          'data-citation-source-id': true,
        },
      },
      model: (viewElement, { writer }) => {
        const sourceId = viewElement.getAttribute('data-citation-source-id') || '';
        if (!sourceId) return null;
        let label = '[1]';
        const firstChild = viewElement.getChild(0);
        if (firstChild && firstChild.is('$text')) {
          label = firstChild.data.trim() || '[1]';
        }
        return writer.createElement('scientificCitation', {
          sourceId,
          label,
          orphaned: label.startsWith('[!'),
        });
      },
      converterPriority: 'high',
    });

    // Editing downcast -> interactive inline widget badge
    conversion.for('editingDowncast').elementToElement({
      model: 'scientificCitation',
      view: (modelItem, { writer }) => {
        const widgetView = createCitationEditingView(modelItem, writer);
        return toWidget(widgetView, writer);
      },
    });

    // Data downcast -> canonical <sup data-citation-source-id="...">
    conversion.for('dataDowncast').elementToElement({
      model: 'scientificCitation',
      view: (modelItem, { writer }) => {
        const sourceId = String(modelItem.getAttribute('sourceId') || '');
        const label = String(modelItem.getAttribute('label') || '[1]');
        const supEl = writer.createContainerElement('sup', {
          'data-citation-source-id': sourceId,
        });
        writer.insert(writer.createPositionAt(supEl, 0), writer.createText(label));
        return supEl;
      },
    });

    // Also listen for changes on label/orphaned attributes so widget updates in place
    conversion.for('editingDowncast').add((dispatcher) => {
      dispatcher.on(
        'attribute:label:scientificCitation',
        (_evt, data, conversionApi) => {
          conversionApi.consumable.consume(data.item, 'attribute:label:scientificCitation');
          const viewElement = conversionApi.mapper.toViewElement(data.item as ModelElement);
          if (!viewElement) return;
          conversionApi. mapper.unbindViewElement(viewElement);
        }
      );
    });

    function createCitationEditingView(
      modelItem: ModelElement,
      writer: ViewDowncastWriter
    ) {
      const sourceId = String(modelItem.getAttribute('sourceId') || '');
      const label = String(modelItem.getAttribute('label') || '[1]');
      const orphaned = Boolean(modelItem.getAttribute('orphaned')) || label.startsWith('[!');

      const attrs: Record<string, string> = {
        class: 'ck-scientific-citation',
        'data-citation-source-id': sourceId,
      };
      if (orphaned) {
        attrs['data-citation-orphaned'] = 'true';
      }

      const supContainer = writer.createContainerElement('sup', attrs);
      const uiSpan = writer.createUIElement(
        'span',
        null,
        function (
          this: { toDomElement: (doc: Document) => HTMLElement },
          domDocument: Document
        ) {
          const domElement = this.toDomElement(domDocument);
          domElement.textContent = label;
          return domElement;
        }
      );
      writer.insert(writer.createPositionAt(supContainer, 0), uiSpan);
      return supContainer;
    }
  }
}

/**
 * Synchronizes inline citation labels (`[1]`, `[2]`, `[!N]`) inside a CKEditor 5 model root
 * according to appearance order and attached article sources without creating an undo step.
 */
export function syncCkeditorCitationBadges(
  editor: Editor,
  availableSources: ScientificSource[]
): boolean {
  const root = editor.model.document.getRoot();
  if (!root) return false;

  const attachedIds = new Set(availableSources.map((s) => s.id));
  const numberBySourceId = new Map<string, number>();
  let nextNumber = 1;

  const range = editor.model.createRangeIn(root);
  const updates: Array<{ element: ModelElement; nextLabel: string; isOrphaned: boolean }> = [];

  for (const value of range.getWalker({ ignoreElementEnd: true })) {
    if (value.item.is('element', 'scientificCitation')) {
      const el = value.item;
      const sourceId = String(el.getAttribute('sourceId') || '');
      if (!sourceId) continue;
      let num = numberBySourceId.get(sourceId);
      if (num === undefined) {
        num = nextNumber++;
        numberBySourceId.set(sourceId, num);
      }
      const isOrphaned = !attachedIds.has(sourceId);
      const expectedLabel = isOrphaned ? `[!${num}]` : `[${num}]`;
      const currentLabel = String(el.getAttribute('label') || '');
      const currentOrphaned = Boolean(el.getAttribute('orphaned'));
      if (currentLabel !== expectedLabel || currentOrphaned !== isOrphaned) {
        updates.push({ element: el, nextLabel: expectedLabel, isOrphaned });
      }
    }
  }

  if (updates.length === 0) return false;

  editor.model.enqueueChange({ isUndoable: false }, (writer) => {
    for (const item of updates) {
      // Replace the citation node so its editingDowncast UIElement refreshes cleanly
      const sourceId = String(item.element.getAttribute('sourceId') || '');
      const replacement = writer.createElement('scientificCitation', {
        sourceId,
        label: item.nextLabel,
        orphaned: item.isOrphaned,
      });
      const posBefore = writer.createPositionBefore(item.element);
      writer.remove(item.element);
      writer.insert(replacement, posBefore);
    }
  });

  return true;
}

export interface ScientificFigureInsertPayload {
  mediaId: string;
  layout?: string;
  credit?: string;
  licence?: string;
  sourceUrl?: string;
  src: string;
  alt: string;
  caption: string;
}

export class InsertScientificFigureCommand extends Command {
  public override execute(payload: ScientificFigureInsertPayload): void {
    if (!payload?.src) return;
    const model = this.editor.model;
    model.change((writer) => {
      const figNode = writer.createElement('scientificFigure', {
        mediaId: payload.mediaId || 'figure',
        layout: payload.layout || 'locked',
        credit: payload.credit || '',
        licence: payload.licence || '',
        sourceUrl: payload.sourceUrl || '',
        src: payload.src,
        alt: payload.alt || 'Scientific figure',
        caption: payload.caption || '',
      });
      model.insertContent(figNode);
    });
  }

  public override refresh(): void {
    this.isEnabled = true;
  }
}

function findNestedViewChild(root: ViewElement, tagName: string): ViewElement | null {
  for (const child of root.getChildren()) {
    if (child.is('element')) {
      if (child.name.toLowerCase() === tagName.toLowerCase()) {
        return child;
      }
      const found = findNestedViewChild(child, tagName);
      if (found) return found;
    }
  }
  return null;
}

function extractViewElementText(el: ViewElement | null): string {
  if (!el) return '';
  let text = '';
  for (const child of el.getChildren()) {
    if (child.is('$text')) {
      text += child.data;
    } else if (child.is('element')) {
      text += extractViewElementText(child);
    }
  }
  return text.trim();
}

/**
 * CKEditor 5 plugin that preserves ScientificRadar's `<figure data-media-id="..." data-figure-layout="..." ...>`
 * blocks with `<img>` and `<figcaption>` and truthful rights metadata (`SRS-ED-007`, `SRS-MED-002`).
 */
export class ScientificFigurePlugin extends Plugin {
  public static get requires() {
    return [Widget] as const;
  }

  public static get pluginName() {
    return 'ScientificFigurePlugin' as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;
    const conversion = editor.conversion;

    schema.register('scientificFigure', {
      inheritAllFrom: '$blockObject',
      allowAttributes: [
        'mediaId',
        'layout',
        'credit',
        'licence',
        'sourceUrl',
        'src',
        'alt',
        'caption',
      ],
    });

    editor.commands.add('insertScientificFigure', new InsertScientificFigureCommand(editor));

    // Upcast <figure data-media-id="..."> (excluding <figure class="table">)
    conversion.for('upcast').add((dispatcher) => {
      dispatcher.on(
        'element:figure',
        (evt, data, conversionApi) => {
          const viewFigure = data.viewItem;
          if (viewFigure.hasClass('table') || findNestedViewChild(viewFigure, 'table')) {
            return;
          }
          const imgView = findNestedViewChild(viewFigure, 'img');
          const mediaId = viewFigure.getAttribute('data-media-id') || '';
          if (!mediaId && !imgView) {
            return;
          }
          if (!conversionApi.consumable.test(viewFigure, { name: true })) {
            return;
          }

          conversionApi.consumable.consume(viewFigure, { name: true });
          const figCaptionView = findNestedViewChild(viewFigure, 'figcaption');
          if (imgView) {
            conversionApi.consumable.consume(imgView, { name: true });
          }
          if (figCaptionView) {
            conversionApi.consumable.consume(figCaptionView, { name: true });
          }

          const modelFigure = conversionApi.writer.createElement('scientificFigure', {
            mediaId: mediaId || 'figure',
            layout: viewFigure.getAttribute('data-figure-layout') || 'locked',
            credit: viewFigure.getAttribute('data-figure-credit') || '',
            licence: viewFigure.getAttribute('data-figure-licence') || '',
            sourceUrl: viewFigure.getAttribute('data-figure-source-url') || '',
            src: imgView?.getAttribute('src') || '',
            alt: imgView?.getAttribute('alt') || 'Scientific figure',
            caption: extractViewElementText(figCaptionView),
          });

          if (!conversionApi.safeInsert(modelFigure, data.modelCursor)) {
            return;
          }
          conversionApi.updateConversionResult(modelFigure, data);
        },
        { priority: 'high' }
      );
    });

    // Editing downcast
    conversion.for('editingDowncast').elementToElement({
      model: 'scientificFigure',
      view: (modelItem, { writer }) => {
        const mediaId = String(modelItem.getAttribute('mediaId') || 'figure');
        const layout = String(modelItem.getAttribute('layout') || 'locked');
        const credit = String(modelItem.getAttribute('credit') || '').trim();
        const licence = String(modelItem.getAttribute('licence') || '').trim();
        const sourceUrl = String(modelItem.getAttribute('sourceUrl') || '').trim();
        const src = String(modelItem.getAttribute('src') || '');
        const alt = String(modelItem.getAttribute('alt') || 'Scientific figure');
        const caption = String(modelItem.getAttribute('caption') || '');

        const figAttrs: Record<string, string> = {
          class: 'ck-scientific-figure',
          'data-media-id': mediaId,
          'data-figure-layout': layout,
        };
        if (credit) figAttrs['data-figure-credit'] = credit;
        if (licence) figAttrs['data-figure-licence'] = licence;
        if (sourceUrl) figAttrs['data-figure-source-url'] = sourceUrl;

        const figureContainer = writer.createContainerElement('figure', figAttrs);
        const uiCard = writer.createUIElement(
          'div',
          { class: 'ck-scientific-figure-body' },
          function (
            this: { toDomElement: (doc: Document) => HTMLElement },
            domDocument: Document
          ) {
            const wrapper = this.toDomElement(domDocument);
            const img = domDocument.createElement('img');
            img.src = src;
            img.alt = alt;
            img.className = 'mx-auto max-h-[340px] object-contain rounded mb-2';
            wrapper.appendChild(img);

            const cap = domDocument.createElement('figcaption');
            cap.className = 'text-xs text-slate-600 dark:text-slate-300 text-center space-y-1';
            const capText = domDocument.createElement('div');
            capText.className = 'font-medium';
            capText.textContent = caption || alt;
            cap.appendChild(capText);

            const metaLine = domDocument.createElement('div');
            metaLine.className = 'text-[11px] text-slate-400 font-mono';
            const hasRights = Boolean(credit && licence);
            metaLine.textContent = hasRights
              ? `Media ID: ${mediaId} · Credit: ${credit} · Licence: ${licence} · Layout: ${layout}`
              : `Media ID: ${mediaId} · Unverified rights / licence · Layout: ${layout}`;
            cap.appendChild(metaLine);

            wrapper.appendChild(cap);
            return wrapper;
          }
        );

        writer.insert(writer.createPositionAt(figureContainer, 0), uiCard);
        return toWidget(figureContainer, writer, { label: `Scientific figure: ${alt}` });
      },
    });

    // Data downcast -> exact canonical <figure data-media-id="...">
    conversion.for('dataDowncast').elementToElement({
      model: 'scientificFigure',
      view: (modelItem, { writer }) => {
        const mediaId = String(modelItem.getAttribute('mediaId') || 'figure');
        const layout = String(modelItem.getAttribute('layout') || 'locked');
        const credit = String(modelItem.getAttribute('credit') || '').trim();
        const licence = String(modelItem.getAttribute('licence') || '').trim();
        const sourceUrl = String(modelItem.getAttribute('sourceUrl') || '').trim();
        const src = String(modelItem.getAttribute('src') || '');
        const alt = String(modelItem.getAttribute('alt') || 'Scientific figure');
        const caption = String(modelItem.getAttribute('caption') || '');

        const figAttrs: Record<string, string> = {
          'data-media-id': mediaId,
          'data-figure-layout': layout,
        };
        if (credit) figAttrs['data-figure-credit'] = credit;
        if (licence) figAttrs['data-figure-licence'] = licence;
        if (sourceUrl) figAttrs['data-figure-source-url'] = sourceUrl;

        const figureEl = writer.createContainerElement('figure', figAttrs);
        const imgEl = writer.createEmptyElement('img', { src, alt });
        const figCaptionEl = writer.createContainerElement('figcaption');
        if (caption) {
          writer.insert(writer.createPositionAt(figCaptionEl, 0), writer.createText(caption));
        }

        writer.insert(writer.createPositionAt(figureEl, 0), imgEl);
        writer.insert(writer.createPositionAt(figureEl, 1), figCaptionEl);
        return figureEl;
      },
    });
  }
}

/**
 * Bridges ScientificRadar's `data-text-align="left|center|right|justify"` with CKEditor's `alignment`
 * attribute and preserves `data-knowledge-term` on links.
 */
export class ScientificHtmlAttributeBridge extends Plugin {
  public static get pluginName() {
    return 'ScientificHtmlAttributeBridge' as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;
    const conversion = editor.conversion;

    // 1. Preserve `data-knowledge-term` on links (`$text`)
    schema.extend('$text', {
      allowAttributes: ['knowledgeTerm'],
    });

    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          'data-knowledge-term': /.+/,
        },
      },
      model: {
        key: 'knowledgeTerm',
        value: (viewElement: ViewElement) => viewElement.getAttribute('data-knowledge-term'),
      },
      converterPriority: 'high',
    });

    conversion.for('downcast').attributeToElement({
      model: 'knowledgeTerm',
      view: (attrValue, { writer }) => {
        if (!attrValue) return;
        return writer.createAttributeElement(
          'a',
          { 'data-knowledge-term': String(attrValue) },
          { priority: 5 }
        );
      },
      converterPriority: 'high',
    });

    // 2. Map `data-text-align` <-> CKEditor `alignment` attribute
    const alignedTags = ['p', 'h2', 'h3', 'h4', 'td', 'th', 'caption'];
    for (const tag of alignedTags) {
      conversion.for('upcast').attributeToAttribute({
        view: {
          name: tag,
          key: 'data-text-align',
          value: /^(left|center|right|justify)$/i,
        },
        model: {
          key: 'alignment',
          value: (viewElement: ViewElement) =>
            (viewElement.getAttribute('data-text-align') || 'left').toLowerCase(),
        },
        converterPriority: 'high',
      });
    }

    conversion.for('dataDowncast').add((dispatcher) => {
      dispatcher.on(
        'attribute:alignment',
        (_evt, data, conversionApi) => {
          const viewElement = conversionApi.mapper.toViewElement(data.item as ModelElement);
          if (!viewElement) return;
          if (data.attributeNewValue && data.attributeNewValue !== 'left') {
            conversionApi.writer.setAttribute(
              'data-text-align',
              String(data.attributeNewValue),
              viewElement
            );
          } else {
            conversionApi.writer.removeAttribute('data-text-align', viewElement);
          }
        },
        { priority: 'low' }
      );
    });
  }
}
