import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { validateAndRenderLatex } from './html-source';

export type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

/**
 * Superscript mark (`<sup>`), mutually exclusive with Subscript (`SRS-ED-004`).
 * Priority is 900 so `ScientificCitation` (`sup[data-citation-source-id]`, priority 1000) matches first.
 */
export const SuperscriptMark = Mark.create({
  name: 'superscript',
  priority: 900,
  excludes: 'subscript',

  parseHTML() {
    return [
      {
        tag: 'sup:not([data-citation-source-id])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleMark(this.name),
    };
  },
});

/**
 * Subscript mark (`<sub>`), mutually exclusive with Superscript (`SRS-ED-004`).
 */
export const SubscriptMark = Mark.create({
  name: 'subscript',
  priority: 900,
  excludes: 'superscript',

  parseHTML() {
    return [{ tag: 'sub' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sub', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleMark(this.name),
    };
  },
});

/**
 * Safe text-alignment extension (`left`, `center`, `right`, `justify`) serialized via
 * `data-text-align` rather than arbitrary inline `style` attributes (`SRS-ED-004`, `SRS-HTML-002`).
 */
export const SafeTextAlignExtension = Extension.create({
  name: 'safeTextAlign',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          textAlign: {
            default: 'left',
            parseHTML: (element) => {
              const explicit = (element.getAttribute('data-text-align') || '').toLowerCase();
              if (
                explicit === 'left' ||
                explicit === 'center' ||
                explicit === 'right' ||
                explicit === 'justify'
              ) {
                return explicit;
              }
              const styleAlign = (element.style?.textAlign || '').toLowerCase();
              if (
                styleAlign === 'left' ||
                styleAlign === 'center' ||
                styleAlign === 'right' ||
                styleAlign === 'justify'
              ) {
                return styleAlign;
              }
              return 'left';
            },
            renderHTML: (attributes) => {
              const align = attributes.textAlign as TextAlignValue | undefined;
              if (!align || align === 'left') {
                return {};
              }
              return { 'data-text-align': align };
            },
          },
        },
      },
    ];
  },
});

export function setBlockTextAlign(editor: Editor, align: TextAlignValue): void {
  editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      const { from, to, $from } = state.selection;
      let changed = false;

      // Also support aligning active table cells/headers when cursor is inside a table
      for (let d = $from.depth; d > 0; d -= 1) {
        const ancestor = $from.node(d);
        if (
          ancestor.type.name === 'scientificTableCell' ||
          ancestor.type.name === 'scientificTableHeader' ||
          ancestor.type.name === 'scientificTableCaption'
        ) {
          tr.setNodeMarkup($from.before(d), undefined, {
            ...ancestor.attrs,
            textAlign: align,
          });
          changed = true;
          break;
        }
      }

      state.doc.nodesBetween(from, to, (node, pos) => {
        if (
          node.type.name === 'paragraph' ||
          node.type.name === 'heading' ||
          node.type.name === 'scientificTableCell' ||
          node.type.name === 'scientificTableHeader'
        ) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: align,
          });
          changed = true;
        }
      });
      if (changed && dispatch) {
        dispatch(tr);
      }
      return changed;
    })
    .run();
}

export function getActiveBlockTextAlign(editor: Editor): TextAlignValue {
  const cellAlign = editor.getAttributes('scientificTableCell')?.textAlign as TextAlignValue | undefined;
  if (cellAlign && cellAlign !== 'left') return cellAlign;
  const headerAlign = editor.getAttributes('scientificTableHeader')?.textAlign as TextAlignValue | undefined;
  if (headerAlign && headerAlign !== 'left') return headerAlign;
  const headingAlign = editor.getAttributes('heading')?.textAlign as TextAlignValue | undefined;
  if (headingAlign && headingAlign !== 'left') return headingAlign;
  const paragraphAlign = editor.getAttributes('paragraph')?.textAlign as TextAlignValue | undefined;
  return paragraphAlign || 'left';
}

/**
 * Inline scientific citation node (`<sup data-citation-source-id="src-...">[1]</sup>`) (`SRS-SCI-001`).
 */
export const ScientificCitationNode = Node.create({
  name: 'scientificCitation',
  priority: 1000,
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      sourceId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-citation-source-id') || '',
      },
      label: {
        default: '[1]',
        parseHTML: (element) => (element.textContent || '[1]').trim(),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-citation-source-id]',
      },
    ];
  },

  renderHTML({ node }) {
    const sourceId = String(node.attrs.sourceId || '');
    const label = String(node.attrs.label || '[1]');
    return [
      'sup',
      {
        'data-citation-source-id': sourceId,
        title: `Scientific Source Citation (${sourceId})`,
      },
      label,
    ];
  },
});

/**
 * Inline LaTeX equation node (`<span data-math-tex="..." data-math-display="inline">...</span>`) (`SRS-MATH-001/002`).
 * Serializes canonical `data-math-tex` while rendering 2D mathematical typography inside the editor via NodeView.
 */
export const ScientificMathInlineNode = Node.create({
  name: 'scientificMathInline',
  priority: 1000,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      tex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-math-tex') || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-math-tex]',
      },
    ];
  },

  renderHTML({ node }) {
    const tex = String(node.attrs.tex || '').trim();
    const rendered = validateAndRenderLatex(tex, 'inline');
    return [
      'span',
      {
        'data-math-tex': tex,
        'data-math-display': 'inline',
        title: `LaTeX: ${tex} (Click to edit)`,
      },
      rendered.valid ? rendered.renderedText : `[LaTeX Error: ${tex}]`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      const applyRender = (currentNode: typeof node) => {
        const tex = String(currentNode.attrs.tex || '').trim();
        const rendered = validateAndRenderLatex(tex, 'inline');
        dom.setAttribute('data-math-tex', tex);
        dom.setAttribute('data-math-display', 'inline');
        dom.setAttribute('title', `LaTeX: ${tex} — Click to edit equation`);
        if (rendered.valid && rendered.renderedHtml) {
          dom.innerHTML = rendered.renderedHtml;
        } else {
          dom.textContent = `[LaTeX Error: ${tex}]`;
        }
      };
      applyRender(node);
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'scientificMathInline') return false;
          applyRender(updatedNode);
          return true;
        },
      };
    };
  },
});

/**
 * Block LaTeX equation node (`<div data-math-tex="..." data-math-display="block">...</div>`) (`SRS-MATH-001/002`).
 * Serializes canonical `data-math-tex` while rendering 2D mathematical typography inside the editor via NodeView.
 */
export const ScientificMathBlockNode = Node.create({
  name: 'scientificMathBlock',
  priority: 1000,
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      tex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-math-tex') || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-math-tex]',
      },
    ];
  },

  renderHTML({ node }) {
    const tex = String(node.attrs.tex || '').trim();
    const rendered = validateAndRenderLatex(tex, 'block');
    return [
      'div',
      {
        'data-math-tex': tex,
        'data-math-display': 'block',
        title: `Block LaTeX: ${tex} (Click to edit)`,
      },
      rendered.valid ? rendered.renderedText : `[LaTeX Error: ${tex}]`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      const applyRender = (currentNode: typeof node) => {
        const tex = String(currentNode.attrs.tex || '').trim();
        const rendered = validateAndRenderLatex(tex, 'block');
        dom.setAttribute('data-math-tex', tex);
        dom.setAttribute('data-math-display', 'block');
        dom.setAttribute('title', `Block LaTeX: ${tex} — Click to edit equation`);
        if (rendered.valid && rendered.renderedHtml) {
          dom.innerHTML = rendered.renderedHtml;
        } else {
          dom.textContent = `[LaTeX Error: ${tex}]`;
        }
      };
      applyRender(node);
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'scientificMathBlock') return false;
          applyRender(updatedNode);
          return true;
        },
      };
    };
  },
});

/**
 * Semantic Scientific Figure block node (`<figure data-media-id="..." data-figure-layout="locked"><img .../><figcaption>...</figcaption></figure>`)
 * (`SRS-ED-007`, `SRS-MED-002`).
 * Preserves optional `credit`, `licence`, and `sourceUrl` without inventing defaults or substituting unrelated fallback images.
 */
export const ScientificFigureNode = Node.create({
  name: 'scientificFigure',
  priority: 1000,
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      mediaId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-media-id') || '',
      },
      layout: {
        default: 'locked',
        parseHTML: (element) => element.getAttribute('data-figure-layout') || 'locked',
      },
      credit: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-figure-credit') || '',
      },
      licence: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-figure-licence') || '',
      },
      sourceUrl: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-figure-source-url') || '',
      },
      src: {
        default: '',
        parseHTML: (element) => element.querySelector('img')?.getAttribute('src') || '',
      },
      alt: {
        default: '',
        parseHTML: (element) => element.querySelector('img')?.getAttribute('alt') || '',
      },
      caption: {
        default: '',
        parseHTML: (element) => (element.querySelector('figcaption')?.textContent || '').trim(),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
      },
    ];
  },

  renderHTML({ node }) {
    const mediaId = String(node.attrs.mediaId || 'figure');
    const layout = String(node.attrs.layout || 'locked');
    const credit = String(node.attrs.credit || '').trim();
    const licence = String(node.attrs.licence || '').trim();
    const sourceUrl = String(node.attrs.sourceUrl || '').trim();
    const src = String(node.attrs.src || '').trim();
    const alt = String(node.attrs.alt || 'Scientific figure');
    const caption = String(node.attrs.caption || '');

    const figureAttrs: Record<string, string> = {
      'data-media-id': mediaId,
      'data-figure-layout': layout,
    };
    if (credit) figureAttrs['data-figure-credit'] = credit;
    if (licence) figureAttrs['data-figure-licence'] = licence;
    if (sourceUrl) figureAttrs['data-figure-source-url'] = sourceUrl;

    return [
      'figure',
      figureAttrs,
      ['img', { src, alt }],
      ['figcaption', {}, caption],
    ];
  },
});

/**
 * Semantic Scientific Table nodes (`table`, `caption`, `tr`, `th`, `td`) (`SRS-ED-005`).
 */
export const ScientificTableCaptionNode = Node.create({
  name: 'scientificTableCaption',
  content: 'inline*',
  isolating: true,

  addAttributes() {
    return {
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'left',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'caption' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, string> = {};
    if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
      attrs['data-text-align'] = String(node.attrs.textAlign);
    }
    return ['caption', mergeAttributes(HTMLAttributes, attrs), 0];
  },
});

export const ScientificTableNode = Node.create({
  name: 'scientificTable',
  group: 'block',
  content: 'scientificTableCaption? scientificTableRow+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'table' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['table', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => moveTableCellSelection(this.editor, 'next'),
      'Shift-Tab': () => moveTableCellSelection(this.editor, 'prev'),
      ArrowDown: () => exitBlockAtDocumentEnd(this.editor, 'scientificTable'),
    };
  },
});

export const ScientificTableRowNode = Node.create({
  name: 'scientificTableRow',
  content: '(scientificTableHeader | scientificTableCell)+',

  parseHTML() {
    return [{ tag: 'tr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes), 0];
  },
});

export const ScientificTableHeaderNode = Node.create({
  name: 'scientificTableHeader',
  content: 'inline*',
  isolating: true,

  addAttributes() {
    return {
      scope: {
        default: 'col',
        parseHTML: (element) => element.getAttribute('scope') || 'col',
      },
      colspan: {
        default: 1,
        parseHTML: (element) => Number(element.getAttribute('colspan') || 1),
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => Number(element.getAttribute('rowspan') || 1),
      },
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'left',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'th' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, string> = { scope: String(node.attrs.scope || 'col') };
    if (Number(node.attrs.colspan) > 1) {
      attrs.colspan = String(node.attrs.colspan);
    }
    if (Number(node.attrs.rowspan) > 1) {
      attrs.rowspan = String(node.attrs.rowspan);
    }
    if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
      attrs['data-text-align'] = String(node.attrs.textAlign);
    }
    return ['th', mergeAttributes(HTMLAttributes, attrs), 0];
  },
});

export const ScientificTableCellNode = Node.create({
  name: 'scientificTableCell',
  content: 'inline*',
  isolating: true,

  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: (element) => Number(element.getAttribute('colspan') || 1),
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => Number(element.getAttribute('rowspan') || 1),
      },
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'left',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'td' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, string> = {};
    if (Number(node.attrs.colspan) > 1) {
      attrs.colspan = String(node.attrs.colspan);
    }
    if (Number(node.attrs.rowspan) > 1) {
      attrs.rowspan = String(node.attrs.rowspan);
    }
    if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
      attrs['data-text-align'] = String(node.attrs.textAlign);
    }
    return ['td', mergeAttributes(HTMLAttributes, attrs), 0];
  },
});

function moveTableCellSelection(editor: Editor, direction: 'next' | 'prev'): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  let tableDepth = -1;
  let cellPos = -1;
  for (let d = $from.depth; d > 0; d -= 1) {
    const n = $from.node(d);
    if (
      cellPos === -1 &&
      (n.type.name === 'scientificTableCell' ||
        n.type.name === 'scientificTableHeader' ||
        n.type.name === 'scientificTableCaption')
    ) {
      cellPos = $from.before(d);
    }
    if (n.type.name === 'scientificTable') {
      tableDepth = d;
      break;
    }
  }
  if (tableDepth === -1 || cellPos === -1) return false;

  const tableNode = $from.node(tableDepth);
  const tableStart = $from.start(tableDepth);
  const cellPositions: number[] = [];
  tableNode.descendants((node, pos) => {
    if (
      node.type.name === 'scientificTableCell' ||
      node.type.name === 'scientificTableHeader' ||
      node.type.name === 'scientificTableCaption'
    ) {
      cellPositions.push(tableStart + pos);
      return false;
    }
    return true;
  });

  const idx = cellPositions.indexOf(cellPos);
  if (idx === -1) return false;
  const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
  if (targetIdx < 0 || targetIdx >= cellPositions.length) {
    return true; // Consume Tab inside table so focus doesn't leave the editor
  }
  const targetCellPos = cellPositions[targetIdx];
  const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(targetCellPos + 1)));
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function exitBlockAtDocumentEnd(editor: Editor, blockTypeName: string): boolean {
  const { state, view } = editor;
  const { $from, empty } = state.selection;
  if (!empty) return false;
  for (let d = $from.depth; d > 0; d -= 1) {
    const node = $from.node(d);
    if (node.type.name === blockTypeName) {
      const blockAfter = $from.after(d);
      const isAtEndOfBlock = $from.pos >= blockAfter - 3;
      const isLastBlockInDoc = blockAfter >= state.doc.content.size;
      if (isAtEndOfBlock && isLastBlockInDoc) {
        const paragraphType = state.schema.nodes.paragraph;
        if (!paragraphType) return false;
        const tr = state.tr.insert(blockAfter, paragraphType.create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(blockAfter + 1)));
        view.dispatch(tr.scrollIntoView());
        return true;
      }
    }
  }
  return false;
}

/**
 * Inserts a genuinely empty semantic scientific data table at the current cursor position
 * and places focus inside the first cell (`SRS-ED-005`).
 */
export function insertScientificTable(editor: Editor, rows = 3, cols = 3): void {
  const safeRows = Math.max(2, Math.min(12, rows));
  const safeCols = Math.max(1, Math.min(8, cols));

  const headerCells = Array.from({ length: safeCols }, () => ({
    type: 'scientificTableHeader',
    attrs: { scope: 'col', textAlign: 'left' },
  }));

  const bodyRows = Array.from({ length: safeRows - 1 }, () => ({
    type: 'scientificTableRow',
    content: Array.from({ length: safeCols }, () => ({
      type: 'scientificTableCell',
      attrs: { textAlign: 'left' },
    })),
  }));

  editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const tableNode = state.schema.nodeFromJSON({
        type: 'scientificTable',
        content: [
          {
            type: 'scientificTableRow',
            content: headerCells,
          },
          ...bodyRows,
        ],
      });
      const insertPos = state.selection.from;
      tr.replaceSelectionWith(tableNode);
      // Place cursor inside the first cell of the newly inserted table
      const resolvedPos = Math.min(insertPos + 3, tr.doc.content.size);
      tr.setSelection(TextSelection.near(tr.doc.resolve(resolvedPos)));
      if (dispatch) {
        dispatch(tr.scrollIntoView());
      }
      return true;
    })
    .run();
}

/**
 * Appends an empty row to the active `scientificTable` when the selection is inside a table,
 * preserving the cursor inside the newly added row.
 */
export function addTableRowToActiveTable(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d -= 1) {
        const node = $from.node(d);
        if (node.type.name === 'scientificTable') {
          let colCount = 3;
          node.forEach((child) => {
            if (child.type.name === 'scientificTableRow') {
              colCount = child.childCount;
            }
          });
          const cellType = state.schema.nodes.scientificTableCell;
          const rowType = state.schema.nodes.scientificTableRow;
          if (!cellType || !rowType) return false;
          const cells = Array.from({ length: colCount }, () =>
            cellType.create({ textAlign: 'left' })
          );
          const newRow = rowType.create(null, cells);
          const insertPos = $from.end(d);
          if (dispatch) {
            tr.insert(insertPos, newRow);
            const focusPos = Math.min(insertPos + 2, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(focusPos)));
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

/**
 * Appends an empty column to every row of the active `scientificTable` and keeps selection inside the table.
 */
export function addTableColumnToActiveTable(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d -= 1) {
        const tableNode = $from.node(d);
        if (tableNode.type.name === 'scientificTable') {
          const tablePos = $from.before(d);
          const headerType = state.schema.nodes.scientificTableHeader;
          const cellType = state.schema.nodes.scientificTableCell;
          const rowType = state.schema.nodes.scientificTableRow;
          if (!headerType || !cellType || !rowType) return false;

          const newChildren: Array<ReturnType<typeof rowType.create>> = [];
          tableNode.forEach((childNode) => {
            if (childNode.type.name === 'scientificTableCaption') {
              newChildren.push(childNode);
              return;
            }
            const existingCells: Array<ReturnType<typeof cellType.create>> = [];
            let isHeaderRow = false;
            childNode.forEach((cell) => {
              if (cell.type.name === 'scientificTableHeader') isHeaderRow = true;
              existingCells.push(cell);
            });
            const extraCell = isHeaderRow
              ? headerType.create({ scope: 'col', textAlign: 'left' })
              : cellType.create({ textAlign: 'left' });
            newChildren.push(rowType.create(childNode.attrs, [...existingCells, extraCell]));
          });

          const newTable = tableNode.type.create(tableNode.attrs, newChildren);
          if (dispatch) {
            tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
            const safeFocusPos = Math.min(tablePos + 3, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(safeFocusPos)));
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

/**
 * Deletes the currently focused column from `scientificTable` (or deletes the table if only 1 column remains).
 */
export function deleteActiveTableColumn(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      let rowDepth = -1;
      let tableDepth = -1;
      let cellDepth = -1;
      for (let d = $from.depth; d > 0; d -= 1) {
        const name = $from.node(d).type.name;
        if (
          cellDepth === -1 &&
          (name === 'scientificTableCell' || name === 'scientificTableHeader')
        ) {
          cellDepth = d;
        }
        if (rowDepth === -1 && name === 'scientificTableRow') {
          rowDepth = d;
        }
        if (tableDepth === -1 && name === 'scientificTable') {
          tableDepth = d;
        }
      }
      if (tableDepth === -1) return false;
      const tableNode = $from.node(tableDepth);
      const tablePos = $from.before(tableDepth);

      // Determine which column index is currently selected (default to last column if in caption)
      let targetColIndex = -1;
      if (rowDepth !== -1 && cellDepth !== -1) {
        targetColIndex = $from.index(rowDepth);
      }

      const rowType = state.schema.nodes.scientificTableRow;
      if (!rowType) return false;

      let remainingCols = 0;
      const newChildren: Array<ReturnType<typeof rowType.create>> = [];
      tableNode.forEach((childNode) => {
        if (childNode.type.name === 'scientificTableCaption') {
          newChildren.push(childNode);
          return;
        }
        const colIdxToRemove =
          targetColIndex >= 0 && targetColIndex < childNode.childCount
            ? targetColIndex
            : childNode.childCount - 1;
        const keptCells: Array<ReturnType<typeof rowType.create>> = [];
        childNode.forEach((cell, _off, idx) => {
          if (idx !== colIdxToRemove) {
            keptCells.push(cell);
          }
        });
        remainingCols = Math.max(remainingCols, keptCells.length);
        if (keptCells.length > 0) {
          newChildren.push(rowType.create(childNode.attrs, keptCells));
        }
      });

      if (remainingCols === 0) {
        if (dispatch) {
          tr.delete(tablePos, tablePos + tableNode.nodeSize);
          dispatch(tr.scrollIntoView());
        }
        return true;
      }

      const newTable = tableNode.type.create(tableNode.attrs, newChildren);
      if (dispatch) {
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
        const safeFocusPos = Math.min(tablePos + 3, tr.doc.content.size);
        tr.setSelection(TextSelection.near(tr.doc.resolve(safeFocusPos)));
        dispatch(tr.scrollIntoView());
      }
      return true;
    })
    .run();
}

/**
 * Toggles the first row of the active `scientificTable` between `<th>` header cells and `<td>` data cells.
 */
export function toggleTableHeaderRow(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d -= 1) {
        const tableNode = $from.node(d);
        if (tableNode.type.name === 'scientificTable') {
          const tablePos = $from.before(d);
          const headerType = state.schema.nodes.scientificTableHeader;
          const cellType = state.schema.nodes.scientificTableCell;
          const rowType = state.schema.nodes.scientificTableRow;
          if (!headerType || !cellType || !rowType) return false;

          let firstDataRowSeen = false;
          const newChildren: Array<ReturnType<typeof rowType.create>> = [];
          tableNode.forEach((childNode) => {
            if (childNode.type.name === 'scientificTableCaption') {
              newChildren.push(childNode);
              return;
            }
            if (!firstDataRowSeen) {
              firstDataRowSeen = true;
              let currentlyHeader = false;
              childNode.forEach((c) => {
                if (c.type.name === 'scientificTableHeader') currentlyHeader = true;
              });
              const convertedCells: Array<ReturnType<typeof cellType.create>> = [];
              childNode.forEach((c) => {
                if (currentlyHeader) {
                  convertedCells.push(
                    cellType.create({ textAlign: c.attrs.textAlign || 'left' }, c.content)
                  );
                } else {
                  convertedCells.push(
                    headerType.create(
                      { scope: 'col', textAlign: c.attrs.textAlign || 'left' },
                      c.content
                    )
                  );
                }
              });
              newChildren.push(rowType.create(childNode.attrs, convertedCells));
            } else {
              newChildren.push(childNode);
            }
          });

          const newTable = tableNode.type.create(tableNode.attrs, newChildren);
          if (dispatch) {
            tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
            const safeFocusPos = Math.min(tablePos + 3, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(safeFocusPos)));
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

/**
 * Reads the caption text from the active `scientificTable`, if any.
 */
export function getActiveTableCaption(editor: Editor | null): string {
  if (!editor) return '';
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d -= 1) {
    const node = $from.node(d);
    if (node.type.name === 'scientificTable') {
      const first = node.firstChild;
      if (first && first.type.name === 'scientificTableCaption') {
        return first.textContent || '';
      }
      return '';
    }
  }
  return '';
}

/**
 * Sets or removes the `<caption>` on the active `scientificTable` while keeping focus inside the table.
 */
export function setActiveTableCaption(editor: Editor, captionText: string): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d -= 1) {
        const tableNode = $from.node(d);
        if (tableNode.type.name === 'scientificTable') {
          const tablePos = $from.before(d);
          const captionType = state.schema.nodes.scientificTableCaption;
          if (!captionType) return false;

          const trimmed = captionText.trim();
          const newChildren: Array<ReturnType<typeof captionType.create>> = [];
          if (trimmed) {
            newChildren.push(
              captionType.create({ textAlign: 'left' }, state.schema.text(trimmed))
            );
          }
          tableNode.forEach((child) => {
            if (child.type.name !== 'scientificTableCaption') {
              newChildren.push(child);
            }
          });

          const newTable = tableNode.type.create(tableNode.attrs, newChildren);
          if (dispatch) {
            tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
            const safeFocusPos = Math.min(tablePos + 3, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(safeFocusPos)));
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

/**
 * Deletes the currently focused row from `scientificTable` (or deletes the table if only 1 row remains).
 */
export function deleteActiveTableRow(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      let rowDepth = -1;
      let tableDepth = -1;
      for (let d = $from.depth; d > 0; d -= 1) {
        if ($from.node(d).type.name === 'scientificTableRow' && rowDepth === -1) {
          rowDepth = d;
        }
        if ($from.node(d).type.name === 'scientificTable' && tableDepth === -1) {
          tableDepth = d;
        }
      }
      if (rowDepth === -1 || tableDepth === -1) return false;
      const tableNode = $from.node(tableDepth);
      let rowCount = 0;
      tableNode.forEach((child) => {
        if (child.type.name === 'scientificTableRow') rowCount += 1;
      });
      if (rowCount <= 1) {
        const tablePos = $from.before(tableDepth);
        if (dispatch) {
          tr.delete(tablePos, tablePos + tableNode.nodeSize);
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
      const rowPos = $from.before(rowDepth);
      const rowNode = $from.node(rowDepth);
      const tablePos = $from.before(tableDepth);
      if (dispatch) {
        tr.delete(rowPos, rowPos + rowNode.nodeSize);
        const safeFocusPos = Math.min(tablePos + 3, tr.doc.content.size);
        tr.setSelection(TextSelection.near(tr.doc.resolve(safeFocusPos)));
        dispatch(tr.scrollIntoView());
      }
      return true;
    })
    .run();
}

/**
 * Deletes the entire `scientificTable` containing the current selection.
 */
export function deleteActiveTable(editor: Editor): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      const { $from } = state.selection;
      for (let d = $from.depth; d > 0; d -= 1) {
        const node = $from.node(d);
        if (node.type.name === 'scientificTable') {
          const pos = $from.before(d);
          if (dispatch) {
            tr.delete(pos, pos + node.nodeSize);
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

export function isSelectionInsideTable(editor: Editor | null): boolean {
  if (!editor) return false;
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d -= 1) {
    if ($from.node(d).type.name === 'scientificTable') return true;
  }
  return false;
}

