import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
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
      const { from, to } = state.selection;
      let changed = false;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
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
 */
export const ScientificMathInlineNode = Node.create({
  name: 'scientificMathInline',
  priority: 1000,
  group: 'inline',
  inline: true,
  atom: true,

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
        title: `LaTeX: ${tex}`,
      },
      rendered.valid ? rendered.renderedText : `[LaTeX Error: ${tex}]`,
    ];
  },
});

/**
 * Block LaTeX equation node (`<div data-math-tex="..." data-math-display="block">...</div>`) (`SRS-MATH-001/002`).
 */
export const ScientificMathBlockNode = Node.create({
  name: 'scientificMathBlock',
  priority: 1000,
  group: 'block',
  atom: true,

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
        title: `Block LaTeX: ${tex}`,
      },
      rendered.valid ? rendered.renderedText : `[LaTeX Error: ${tex}]`,
    ];
  },
});

/**
 * Semantic Scientific Figure block node (`<figure data-media-id="..." data-figure-layout="locked"><img .../><figcaption>...</figcaption></figure>`)
 * (`SRS-ED-007`, `SRS-MED-002`).
 */
export const ScientificFigureNode = Node.create({
  name: 'scientificFigure',
  priority: 1000,
  group: 'block',
  atom: true,

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
    const src = String(node.attrs.src || '/figures/quantum-ldpc-lattice.svg');
    const alt = String(node.attrs.alt || 'Scientific figure');
    const caption = String(node.attrs.caption || '');

    return [
      'figure',
      {
        'data-media-id': mediaId,
        'data-figure-layout': layout,
      },
      ['img', { src, alt }],
      ['figcaption', {}, caption],
    ];
  },
});

/**
 * Semantic Scientific Table nodes (`table`, `tr`, `th`, `td`) (`SRS-ED-005`).
 */
export const ScientificTableNode = Node.create({
  name: 'scientificTable',
  group: 'block',
  content: 'scientificTableRow+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'table' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['table', mergeAttributes(HTMLAttributes), ['tbody', 0]];
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
    if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
      attrs['data-text-align'] = String(node.attrs.textAlign);
    }
    return ['td', mergeAttributes(HTMLAttributes, attrs), 0];
  },
});

/**
 * Inserts a semantic scientific data table at the current cursor position (`SRS-ED-005`).
 */
export function insertScientificTable(editor: Editor, rows = 3, cols = 3): void {
  const safeRows = Math.max(2, Math.min(12, rows));
  const safeCols = Math.max(1, Math.min(8, cols));

  const headerCells = Array.from({ length: safeCols }, (_, idx) => ({
    type: 'scientificTableHeader',
    attrs: { scope: 'col', textAlign: 'left' },
    content: [{ type: 'text', text: `Column ${idx + 1}` }],
  }));

  const bodyRows = Array.from({ length: safeRows - 1 }, (_, rIdx) => ({
    type: 'scientificTableRow',
    content: Array.from({ length: safeCols }, (__, cIdx) => ({
      type: 'scientificTableCell',
      attrs: { textAlign: 'left' },
      content: [{ type: 'text', text: rIdx === 0 && cIdx === 0 ? 'Sample n = 144' : '0.00 ± 0.01' }],
    })),
  }));

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'scientificTable',
      content: [
        {
          type: 'scientificTableRow',
          content: headerCells,
        },
        ...bodyRows,
      ],
    })
    .run();
}

/**
 * Appends a row to the active `scientificTable` when the selection is inside a table.
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
          const firstRow = node.firstChild;
          const colCount = firstRow ? firstRow.childCount : 3;
          const cellType = state.schema.nodes.scientificTableCell;
          const rowType = state.schema.nodes.scientificTableRow;
          if (!cellType || !rowType) return false;
          const cells = Array.from({ length: colCount }, () =>
            cellType.create({ textAlign: 'left' }, state.schema.text('—'))
          );
          const newRow = rowType.create(null, cells);
          const insertPos = $from.end(d);
          if (dispatch) {
            tr.insert(insertPos, newRow);
            dispatch(tr);
          }
          return true;
        }
      }
      return false;
    })
    .run();
}

/**
 * Appends a column to every row of the active `scientificTable`.
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
          const tableStart = $from.start(d);
          const headerType = state.schema.nodes.scientificTableHeader;
          const cellType = state.schema.nodes.scientificTableCell;
          const rowType = state.schema.nodes.scientificTableRow;
          if (!headerType || !cellType || !rowType) return false;

          const newRows: ReturnType<typeof rowType.create>[] = [];
          tableNode.forEach((rowNode, _offset, rowIndex) => {
            const existingCells: ReturnType<typeof cellType.create>[] = [];
            rowNode.forEach((cell) => {
              existingCells.push(cell);
            });
            const extraCell =
              rowIndex === 0
                ? headerType.create(
                    { scope: 'col', textAlign: 'left' },
                    state.schema.text(`Col ${existingCells.length + 1}`)
                  )
                : cellType.create({ textAlign: 'left' }, state.schema.text('—'));
            newRows.push(rowType.create(rowNode.attrs, [...existingCells, extraCell]));
          });

          const newTable = tableNode.type.create(tableNode.attrs, newRows);
          if (dispatch) {
            tr.replaceWith(tableStart - 1, tableStart - 1 + tableNode.nodeSize, newTable);
            dispatch(tr);
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
      if (tableNode.childCount <= 1) {
        const tablePos = $from.before(tableDepth);
        if (dispatch) {
          tr.delete(tablePos, tablePos + tableNode.nodeSize);
          dispatch(tr);
        }
        return true;
      }
      const rowPos = $from.before(rowDepth);
      const rowNode = $from.node(rowDepth);
      if (dispatch) {
        tr.delete(rowPos, rowPos + rowNode.nodeSize);
        dispatch(tr);
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
            dispatch(tr);
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
