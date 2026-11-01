'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Sparkles,
  Image as ImageIcon,
  Undo2,
  Redo2,
  AlertCircle,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  FileCode2,
  Minus,
  Eraser,
  Table as TableIcon,
  Sigma,
  BookOpen,
  Search,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Omega,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  convertMarkdownPasteToSafeHtml,
  sanitizeAndDemoteBodyH1,
  validateSafeUrl,
} from '@/lib/editorial-rules';
import { cleanClipboardPasteHtml, trustedMediaSourceSet } from '@/lib/html-security';
import { useStudio } from '@/lib/studio-context';
import { KnowledgeLink, MediaAsset, ScientificSource } from '@/lib/types';
import {
  SuperscriptMark,
  SubscriptMark,
  SafeTextAlignExtension,
  ScientificCitationNode,
  ScientificMathInlineNode,
  ScientificMathBlockNode,
  ScientificFigureNode,
  ScientificTableCaptionNode,
  ScientificTableNode,
  ScientificTableRowNode,
  ScientificTableHeaderNode,
  ScientificTableCellNode,
  setBlockTextAlign,
  getActiveBlockTextAlign,
  insertScientificTable,
  addTableRowToActiveTable,
  addTableColumnToActiveTable,
  deleteActiveTableRow,
  deleteActiveTableColumn,
  toggleTableHeaderRow,
  getActiveTableCaption,
  setActiveTableCaption,
  deleteActiveTable,
  isSelectionInsideTable,
  exitBlockAtDocumentEnd,
  TextAlignValue,
} from '@/lib/editor-extensions';
import {
  formatEditorialHtmlSource,
  validateAndRenderLatex,
} from '@/lib/html-source';
import { analyzeManuscriptCitations } from '@/lib/citations';
import { HtmlSourcePanel } from './html-source-panel';

const CodeBlockKeyboardExtension = Extension.create({
  name: 'codeBlockKeyboard',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive('codeBlock')) {
          return this.editor.commands.insertContent('  ');
        }
        return false;
      },
      ArrowDown: () => {
        if (this.editor.isActive('codeBlock')) {
          return exitBlockAtDocumentEnd(this.editor, 'codeBlock');
        }
        return false;
      },
    };
  },
});

const SCIENTIFIC_SYMBOLS: Array<{ symbol: string; name: string }> = [
  { symbol: '±', name: 'Plus-minus (±)' },
  { symbol: 'µ', name: 'Micro (µ)' },
  { symbol: 'Δ', name: 'Delta / Change (Δ)' },
  { symbol: 'α', name: 'Alpha (α)' },
  { symbol: 'β', name: 'Beta (β)' },
  { symbol: 'γ', name: 'Gamma (γ)' },
  { symbol: 'λ', name: 'Lambda / Wavelength (λ)' },
  { symbol: 'σ', name: 'Sigma / Standard Deviation (σ)' },
  { symbol: 'Ω', name: 'Omega / Ohm (Ω)' },
  { symbol: '≤', name: 'Less than or equal (≤)' },
  { symbol: '≥', name: 'Greater than or equal (≥)' },
  { symbol: '≠', name: 'Not equal (≠)' },
  { symbol: '≈', name: 'Approximately equal (≈)' },
  { symbol: '×', name: 'Multiplication (×)' },
  { symbol: '−', name: 'Minus sign (−)' },
  { symbol: '→', name: 'Right arrow (→)' },
  { symbol: '⇌', name: 'Equilibrium harpoons (⇌)' },
  { symbol: '°', name: 'Degree (°)' },
  { symbol: 'Å', name: 'Angstrom (Å)' },
  { symbol: '∞', name: 'Infinity (∞)' },
];

interface ArticleTiptapEditorProps {
  initialHtml?: string;
  contentHtml?: string;
  knowledgeLinks?: KnowledgeLink[];
  trustedImageSources?: ReadonlySet<string>;
  onChange?: (
    nextHtml: string,
    nextJson: Record<string, unknown>,
    demotedH1Count: number
  ) => void;
  onChangeHtml?: (html: string) => void;
  onDemotedH1?: (count: number) => void;
  onOpenCodexDrawer?: () => void;
  onRequestMediaInsert?: () => void;
  /** Optional linked scientific sources for inline citation insertion (`SRS-SCI-001`) */
  availableSources?: ScientificSource[];
  /** Optional media asset queued by the parent Figure Picker modal to insert at the caret (`SRS-ED-007`) */
  pendingFigureInsert?: MediaAsset | null;
  onFigureInserted?: () => void;
  /** Optional callback when HTML Source changes are explicitly applied (`SRS-HTML-003`) */
  onApplyHtmlSource?: (sanitizedHtml: string, summaryNote: string) => void;
}

export function ArticleTiptapEditor({
  initialHtml,
  contentHtml,
  trustedImageSources,
  onChange,
  onChangeHtml,
  onDemotedH1,
  onOpenCodexDrawer,
  onRequestMediaInsert,
  availableSources = [],
  pendingFigureInsert,
  onFigureInserted,
  onApplyHtmlSource,
}: ArticleTiptapEditorProps) {
  const { media } = useStudio();
  const effectiveHtml = contentHtml ?? initialHtml ?? '<p></p>';
  const trustedSources = React.useMemo(
    () =>
      trustedImageSources ||
      trustedMediaSourceSet(media.map((item) => item.src)),
    [media, trustedImageSources]
  );

  const [editorMode, setEditorMode] = useState<'visual' | 'html_source'>('visual');
  const [rawHtmlBuffer, setRawHtmlBuffer] = useState<string>(() =>
    formatEditorialHtmlSource(effectiveHtml)
  );
  // Selection/transaction tick ensures contextual toolbar state (e.g. inTable, active marks) updates immediately
  const [selectionTick, setSelectionTick] = useState(0);
  const lastEmittedHtmlRef = useRef<string>('');

  const [linkBarOpen, setLinkBarOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Table caption editing state
  const [tableCaptionOpen, setTableCaptionOpen] = useState(false);
  const [tableCaptionInput, setTableCaptionInput] = useState('');

  // Special character popover state
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);

  // LaTeX Equation bar state (supports both new insertion and clicking an existing equation to edit)
  const [equationBarOpen, setEquationBarOpen] = useState(false);
  const [equationTex, setEquationTex] = useState('\\mathcal{L}_{\\text{eff}} = \\frac{1}{2} \\partial_\\mu \\phi \\partial^\\mu \\phi');
  const [equationDisplay, setEquationDisplay] = useState<'inline' | 'block'>('inline');
  const [equationError, setEquationError] = useState<string | null>(null);
  const [editingMathPos, setEditingMathPos] = useState<number | null>(null);

  // Citation popover state
  const [citationMenuOpen, setCitationMenuOpen] = useState(false);

  // Find & Replace bar state
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [findStatus, setFindStatus] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          // Enforce Spec §8: Title is sole H1; body supports H2 and H3 only.
          levels: [2, 3],
        },
        link: false,
        underline: false,
      }),
      CodeBlockKeyboardExtension,
      Underline,
      SuperscriptMark,
      SubscriptMark,
      SafeTextAlignExtension,
      ScientificCitationNode,
      ScientificMathInlineNode,
      ScientificMathBlockNode,
      ScientificFigureNode,
      ScientificTableCaptionNode,
      ScientificTableNode,
      ScientificTableRowNode,
      ScientificTableHeaderNode,
      ScientificTableCellNode,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class:
            'text-[#087f83] dark:text-teal-400 underline decoration-teal-500/50 underline-offset-2',
        },
        validate: (href) => validateSafeUrl(href).valid,
      }),
      Placeholder.configure({
        placeholder:
          'Write your scientific article here. Use Heading 2 and Heading 3 for sections, insert LaTeX equations, tables, citations, or switch to HTML Source...',
      }),
    ],
    content: sanitizeAndDemoteBodyH1(effectiveHtml, trustedSources).sanitizedHtml,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none min-h-[520px] px-6 py-5 focus:outline-none text-slate-800 dark:text-slate-100 leading-relaxed',
        'aria-label': 'Article body editor',
      },
      handleClickOn: (_view, _pos, node, nodePos) => {
        if (
          node.type.name === 'scientificMathInline' ||
          node.type.name === 'scientificMathBlock'
        ) {
          setEditingMathPos(nodePos);
          setEquationTex(String(node.attrs.tex || ''));
          setEquationDisplay(
            node.type.name === 'scientificMathBlock' ? 'block' : 'inline'
          );
          setEquationError(null);
          setEquationBarOpen(true);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const htmlData = event.clipboardData?.getData('text/html') || '';
        const text = event.clipboardData?.getData('text/plain') || '';

        if (htmlData && htmlData.trim()) {
          const cleaned = cleanClipboardPasteHtml(htmlData, trustedSources);
          if (
            cleaned.demotedH1Count > 0 ||
            /mso-|docs-internal-guid|vertical-align/i.test(htmlData)
          ) {
            event.preventDefault();
            if (cleaned.demotedH1Count > 0) {
              setPasteNotice(
                `Normalized ${cleaned.demotedH1Count} pasted H1 heading(s) to H2 so the Article Title remains the single page H1.`
              );
              onDemotedH1?.(cleaned.demotedH1Count);
            } else {
              setPasteNotice('Cleaned rich clipboard formatting for scientific manuscript consistency.');
            }
            editor?.commands.insertContent(cleaned.html);
            return true;
          }
        }

        if (text && /^#{1,4}\s+/m.test(text) && !htmlData) {
          event.preventDefault();
          const converted = convertMarkdownPasteToSafeHtml(text);
          if (converted.demotedH1Count > 0) {
            setPasteNotice(
              `Demoted ${converted.demotedH1Count} pasted Markdown "# H1" heading(s) to H2 so the Article Title remains the single page H1.`
            );
            onDemotedH1?.(converted.demotedH1Count);
          }
          editor?.commands.insertContent(converted.html);
          return true;
        }
        return false;
      },
    },
    onSelectionUpdate: () => {
      setSelectionTick((t) => t + 1);
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1);
    },
    onUpdate: ({ editor: ed }) => {
      const rawHtml = ed.getHTML();
      const sanitized = sanitizeAndDemoteBodyH1(rawHtml, trustedSources);
      if (sanitized.demotedH1Count > 0) {
        setPasteNotice(
          `Normalized ${sanitized.demotedH1Count} body H1 tag(s) to H2 to preserve single-H1 hierarchy.`
        );
        onDemotedH1?.(sanitized.demotedH1Count);
      }
      lastEmittedHtmlRef.current = sanitized.sanitizedHtml;
      onChange?.(
        sanitized.sanitizedHtml,
        ed.getJSON() as Record<string, unknown>,
        sanitized.demotedH1Count
      );
      onChangeHtml?.(sanitized.sanitizedHtml);
    },
  });

  // Sync external content changes (e.g., version restore, quick-fix, or assistant apply) without length heuristics
  useEffect(() => {
    if (!editor) return;
    const current = sanitizeAndDemoteBodyH1(editor.getHTML(), trustedSources).sanitizedHtml;
    const cleaned = sanitizeAndDemoteBodyH1(effectiveHtml, trustedSources).sanitizedHtml;
    if (cleaned !== lastEmittedHtmlRef.current && cleaned !== current) {
      lastEmittedHtmlRef.current = cleaned;
      editor.commands.setContent(cleaned, { emitUpdate: false });
      setSelectionTick((t) => t + 1);
    }
  }, [effectiveHtml, editor, trustedSources]);

  // Synchronize inline citation numbering ([1], [2], [!1]) in document appearance order (SRS-SCI-001/002)
  const citationAnalysis = React.useMemo(() => {
    void selectionTick;
    const html = editor ? editor.getHTML() : effectiveHtml;
    return analyzeManuscriptCitations(html, availableSources);
  }, [editor, effectiveHtml, availableSources, selectionTick]);

  useEffect(() => {
    if (!editor) return;
    const { state, view } = editor;
    const { tr } = state;
    let mutated = false;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'scientificCitation') {
        const sourceId = String(node.attrs.sourceId || '');
        const resolved = citationAnalysis.occurrences.find((o) => o.sourceId === sourceId);
        const expectedLabel = resolved
          ? resolved.isOrphaned
            ? `[!${resolved.number}]`
            : `[${resolved.number}]`
          : '[!1]';
        if (node.attrs.label !== expectedLabel) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            label: expectedLabel,
          });
          mutated = true;
        }
      }
      return true;
    });
    if (mutated) {
      view.dispatch(tr);
    }
  }, [editor, citationAnalysis]);

  // Insert figure queued by parent ArticleWorkspace Media Picker (`SRS-ED-007`, `SRS-MED-001/002`)
  useEffect(() => {
    if (!editor || !pendingFigureInsert) return;
    const rightsSuffixParts = [
      pendingFigureInsert.credit?.trim(),
      pendingFigureInsert.licence?.trim(),
    ].filter(Boolean);
    const defaultCaption =
      pendingFigureInsert.caption?.trim() ||
      (rightsSuffixParts.length > 0
        ? `${pendingFigureInsert.title} (${rightsSuffixParts.join(' · ')})`
        : pendingFigureInsert.title);

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'scientificFigure',
        attrs: {
          mediaId: pendingFigureInsert.id,
          layout: pendingFigureInsert.layout || 'locked',
          credit: pendingFigureInsert.credit?.trim() || '',
          licence: pendingFigureInsert.licence?.trim() || '',
          sourceUrl: pendingFigureInsert.sourceUrl?.trim() || '',
          src: pendingFigureInsert.src,
          alt: pendingFigureInsert.altText || pendingFigureInsert.title,
          caption: defaultCaption,
        },
      })
      .run();
    onFigureInserted?.();
  }, [editor, pendingFigureInsert, onFigureInserted]);

  const handleApplyLink = useCallback(() => {
    if (!editor) return;
    setLinkError(null);
    const trimmed = linkUrlInput.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      setLinkBarOpen(false);
      return;
    }

    const validation = validateSafeUrl(trimmed);
    if (!validation.valid) {
      setLinkError(validation.reason || 'Invalid URL');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed, target: trimmed.startsWith('/') ? '_self' : '_blank' })
      .run();
    setLinkBarOpen(false);
    setLinkUrlInput('');
  }, [editor, linkUrlInput]);

  const handleInsertSymbol = useCallback(
    (symbol: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(symbol).run();
      setSymbolMenuOpen(false);
    },
    [editor]
  );

  const handleInsertEquation = useCallback(() => {
    if (!editor) return;
    setEquationError(null);
    const check = validateAndRenderLatex(equationTex, equationDisplay);
    if (!check.valid) {
      setEquationError(check.error || 'Invalid LaTeX syntax.');
      return;
    }
    const cleanTex = equationTex.trim();
    const targetType =
      equationDisplay === 'block' ? 'scientificMathBlock' : 'scientificMathInline';

    if (editingMathPos !== null) {
      editor
        .chain()
        .focus()
        .command(({ state, tr, dispatch }) => {
          const existing = state.doc.nodeAt(editingMathPos);
          const nodeType = state.schema.nodes[targetType];
          if (!existing || !nodeType) return false;
          const replacementNode = nodeType.create({ tex: cleanTex });
          tr.replaceWith(editingMathPos, editingMathPos + existing.nodeSize, replacementNode);
          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        })
        .run();
      setEditingMathPos(null);
      setEquationBarOpen(false);
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: targetType,
        attrs: { tex: cleanTex },
      })
      .run();
    setEquationBarOpen(false);
  }, [editor, equationTex, equationDisplay, editingMathPos]);

  const handleInsertCitation = useCallback(
    (source: ScientificSource) => {
      if (!editor) return;
      const existingNum = citationAnalysis.numberBySourceId.get(source.id);
      const nextNum = existingNum ?? citationAnalysis.orderedCitations.length + 1;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'scientificCitation',
          attrs: {
            sourceId: source.id,
            label: `[${nextNum}]`,
          },
        })
        .run();
      setCitationMenuOpen(false);
    },
    [editor, citationAnalysis]
  );

  // Compute all matches in manuscript text nodes for Find & Replace (`SRS-ED-009`)
  const findMatches = React.useMemo(() => {
    void selectionTick;
    if (!editor || !findQuery) return [] as Array<{ from: number; to: number }>;
    const needle = findCaseSensitive ? findQuery : findQuery.toLowerCase();
    if (!needle) return [] as Array<{ from: number; to: number }>;
    const matches: Array<{ from: number; to: number }> = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const haystack = findCaseSensitive ? node.text : node.text.toLowerCase();
        let idx = haystack.indexOf(needle);
        while (idx !== -1) {
          matches.push({
            from: pos + idx,
            to: pos + idx + needle.length,
          });
          idx = haystack.indexOf(needle, idx + needle.length);
        }
      }
      return true;
    });
    return matches;
  }, [editor, findQuery, findCaseSensitive, selectionTick]);

  const findMatchesCount = findMatches.length;
  const safeMatchIndex =
    findMatchesCount > 0 ? ((activeMatchIndex % findMatchesCount) + findMatchesCount) % findMatchesCount : 0;

  const focusMatchAtIndex = useCallback(
    (targetIdx: number) => {
      if (!editor || findMatches.length === 0) return;
      const normalized =
        ((targetIdx % findMatches.length) + findMatches.length) % findMatches.length;
      const match = findMatches[normalized];
      setActiveMatchIndex(normalized);
      const { state, view } = editor;
      const tr = state.tr.setSelection(
        TextSelection.create(state.doc, match.from, match.to)
      );
      view.dispatch(tr.scrollIntoView());
    },
    [editor, findMatches]
  );

  const handleReplaceMatches = useCallback(
    (replaceAll: boolean) => {
      if (!editor || !findQuery || findMatches.length === 0) return;
      const needle = findQuery;
      const replacement = replaceQuery;
      let replacedCount = 0;

      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          const targets = replaceAll
            ? [...findMatches].reverse()
            : [findMatches[safeMatchIndex]];
          for (const m of targets) {
            if (replacement) {
              tr.insertText(replacement, m.from, m.to);
            } else {
              tr.delete(m.from, m.to);
            }
            replacedCount += 1;
          }
          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        })
        .run();

      setFindStatus(
        replacedCount > 0
          ? `Replaced ${replacedCount} occurrence(s) of "${needle}" (Undo Ctrl/Cmd+Z reverts in one step).`
          : `No occurrences of "${needle}" found.`
      );
    },
    [editor, findQuery, replaceQuery, findMatches, safeMatchIndex]
  );

  if (!editor) {
    return (
      <div className="min-h-[520px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] p-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/70 rounded w-full mb-2.5" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800/70 rounded w-5/6" />
      </div>
    );
  }

  const activeBlockStyle = editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const activeAlign: TextAlignValue = getActiveBlockTextAlign(editor);
  const inTable = isSelectionInsideTable(editor);
  const latexPreview = validateAndRenderLatex(equationTex, equationDisplay);

  const handleBlockStyleChange = (value: string) => {
    if (value === 'h2') {
      editor.chain().focus().setHeading({ level: 2 }).run();
    } else if (value === 'h3') {
      editor.chain().focus().setHeading({ level: 3 }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  };

  const handleSwitchToHtmlSource = () => {
    const currentHtml = sanitizeAndDemoteBodyH1(editor.getHTML(), trustedSources).sanitizedHtml;
    setRawHtmlBuffer(formatEditorialHtmlSource(currentHtml));
    setEditorMode('html_source');
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] shadow-xs overflow-hidden flex flex-col">
      {/* Sticky Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="Manuscript formatting toolbar (Title is sole H1)"
        className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-slate-50/95 dark:bg-[#15222a]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800"
      >
        {/* Left group: Visual Formatting Controls (disabled when in HTML Source mode) */}
        <div
          className={`flex flex-wrap items-center gap-1 ${
            editorMode === 'html_source' ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {/* Single Block Style Selector + Single-Label H2/H3 Quick Toggles (SRS-ED-002: no duplicate H₂ H2) */}
          <select
            aria-label="Block text style"
            value={activeBlockStyle}
            onChange={(e) => handleBlockStyleChange(e.target.value)}
            className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2 (Section)</option>
            <option value="h3">Heading 3 (Subsection)</option>
          </select>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading 2"
            aria-pressed={editor.isActive('heading', { level: 2 })}
            title="Toggle Section Heading 2 (Title above is sole H1)"
            className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            H2
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3"
            aria-pressed={editor.isActive('heading', { level: 3 })}
            title="Toggle Subsection Heading 3"
            className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            H3
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Inline Marks: Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Inline Code */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            aria-pressed={editor.isActive('bold')}
            title="Bold (Ctrl/Cmd+B)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            aria-pressed={editor.isActive('italic')}
            title="Italic (Ctrl/Cmd+I)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            aria-pressed={editor.isActive('underline')}
            title="Underline (Ctrl/Cmd+U)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            aria-pressed={editor.isActive('strike')}
            title="Strikethrough"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('strike')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleMark('superscript').run()}
            aria-label="Superscript"
            aria-pressed={editor.isActive('superscript')}
            title="Superscript (x² — mutually exclusive with Subscript)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('superscript')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleMark('subscript').run()}
            aria-label="Subscript"
            aria-pressed={editor.isActive('subscript')}
            title="Subscript (H₂O — mutually exclusive with Superscript)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('subscript')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            aria-label="Inline Code"
            aria-pressed={editor.isActive('code')}
            title="Inline Code"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('code')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            aria-label="Clear Formatting"
            title="Clear inline formatting on selection"
            className="p-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Text Alignment: Left, Center, Right, Justify */}
          {(
            [
              { align: 'left', label: 'Align Left', Icon: AlignLeft },
              { align: 'center', label: 'Align Center', Icon: AlignCenter },
              { align: 'right', label: 'Align Right', Icon: AlignRight },
              { align: 'justify', label: 'Align Justify', Icon: AlignJustify },
            ] as const
          ).map(({ align, label, Icon }) => (
            <button
              key={align}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setBlockTextAlign(editor, align)}
              aria-label={label}
              aria-pressed={activeAlign === align}
              title={label}
              className={`p-1.5 rounded transition-colors ${
                activeAlign === align
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Lists, Blockquote, Code Block, Horizontal Rule */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
            aria-pressed={editor.isActive('bulletList')}
            title="Bullet List"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered List"
            aria-pressed={editor.isActive('orderedList')}
            title="Numbered List"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Blockquote"
            aria-pressed={editor.isActive('blockquote')}
            title="Blockquote / Callout"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="Code Block"
            aria-pressed={editor.isActive('codeBlock')}
            title="Code Block (<pre><code>)"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('codeBlock')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Insert Horizontal Rule"
            title="Insert Section Divider (<hr>)"
            className="p-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Link, Symbol, Table, Equation, Citation, Figure */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const prev = editor.getAttributes('link').href || '';
              setLinkUrlInput(prev);
              setLinkError(null);
              setLinkBarOpen((v) => !v);
            }}
            aria-label="Insert or edit safe link"
            aria-pressed={editor.isActive('link') || linkBarOpen}
            title="Insert or edit safe link"
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('link') || linkBarOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSymbolMenuOpen((v) => !v)}
            aria-label="Insert Scientific Symbol"
            aria-pressed={symbolMenuOpen}
            title="Insert Scientific Unicode Symbol (± µ Δ α β γ ≤ ≥ ×)"
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              symbolMenuOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Omega className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Symbol</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertScientificTable(editor, 3, 3)}
            aria-label="Insert Scientific Table"
            title="Insert 3×3 Empty Scientific Data Table"
            className="px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Table</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setEquationError(null);
              if (equationBarOpen) {
                setEquationBarOpen(false);
                setEditingMathPos(null);
              } else {
                // Check if selection is currently on an existing math node
                const { from } = editor.state.selection;
                const selectedNode = editor.state.doc.nodeAt(from);
                if (
                  selectedNode &&
                  (selectedNode.type.name === 'scientificMathInline' ||
                    selectedNode.type.name === 'scientificMathBlock')
                ) {
                  setEditingMathPos(from);
                  setEquationTex(String(selectedNode.attrs.tex || ''));
                  setEquationDisplay(
                    selectedNode.type.name === 'scientificMathBlock' ? 'block' : 'inline'
                  );
                } else {
                  setEditingMathPos(null);
                }
                setEquationBarOpen(true);
              }
            }}
            aria-label="Insert LaTeX Equation"
            aria-pressed={equationBarOpen}
            title="Insert or Edit Inline/Block LaTeX Equation"
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              equationBarOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Equation</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setCitationMenuOpen((v) => !v)}
            aria-label="Insert Citation"
            aria-pressed={citationMenuOpen}
            title="Insert linked Scientific Source citation ([1])"
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              citationMenuOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Cite</span>
          </button>

          {onRequestMediaInsert && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onRequestMediaInsert}
              aria-label="Insert Scientific Figure"
              title="Insert Scientific Figure from Media Library (Default Locked Contain)"
              className="px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Figure</span>
            </button>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setFindBarOpen((v) => !v)}
            aria-label="Find and Replace"
            aria-pressed={findBarOpen}
            title="Find and Replace in manuscript"
            className={`p-1.5 rounded transition-colors ${
              findBarOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
            title="Undo (Ctrl/Cmd+Z)"
            className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right group: Visual Editor / HTML Source Switch + Prepare with Codex */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Editor surface mode"
            className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-[11px] font-semibold"
          >
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              aria-pressed={editorMode === 'visual'}
              className={`px-2.5 py-1 rounded transition-colors ${
                editorMode === 'visual'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Visual Editor
            </button>
            <button
              type="button"
              onClick={handleSwitchToHtmlSource}
              aria-pressed={editorMode === 'html_source'}
              className={`px-2.5 py-1 rounded transition-colors ${
                editorMode === 'html_source'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              HTML Source
            </button>
          </div>

          {onOpenCodexDrawer && (
            <button
              type="button"
              onClick={onOpenCodexDrawer}
              className="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[#087f83] dark:text-teal-300 hover:bg-teal-100/70 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prepare with Codex</span>
            </button>
          )}
        </div>
      </div>

      {/* Contextual Table Editing Bar when selection is inside a scientificTable */}
      {editorMode === 'visual' && inTable && (
        <div
          role="region"
          aria-label="Table structure controls"
          className="px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-900/60 flex flex-col gap-2 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" />
              <span>Scientific Table Active</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTableRowToActiveTable(editor)}
                className="px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-200 font-medium"
              >
                + Add Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTableColumnToActiveTable(editor)}
                className="px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-200 font-medium"
              >
                + Add Column
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => deleteActiveTableRow(editor)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Delete Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => deleteActiveTableColumn(editor)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Delete Column
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleTableHeaderRow(editor)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Toggle Header Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTableCaptionInput(getActiveTableCaption(editor));
                  setTableCaptionOpen((v) => !v);
                }}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Table Caption
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => deleteActiveTable(editor)}
                className="px-2 py-0.5 rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
              >
                Delete Table
              </button>
            </div>
          </div>
          {tableCaptionOpen && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200/70 dark:border-indigo-900/50">
              <input
                type="text"
                aria-label="Table caption text"
                value={tableCaptionInput}
                onChange={(e) => setTableCaptionInput(e.target.value)}
                placeholder="Table 1: Experimental measurements and confidence intervals..."
                className="flex-1 min-w-[220px] px-2.5 py-1 rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-950 text-xs"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setActiveTableCaption(editor, tableCaptionInput);
                  setTableCaptionOpen(false);
                }}
                className="px-2.5 py-1 rounded bg-[#087f83] text-white font-semibold"
              >
                Apply Caption
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTableCaptionOpen(false)}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orphaned Citation Warning Banner (SRS-SCI-001/002) */}
      {editorMode === 'visual' && citationAnalysis.orphanedSourceIds.length > 0 && (
        <div
          role="alert"
          data-testid="orphaned-citation-warning"
          className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/70 flex items-center justify-between gap-2 text-xs text-rose-900 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              <strong>Orphaned inline citation(s) detected:</strong>{' '}
              {citationAnalysis.orphanedSourceIds.map((id) => `"${id}"`).join(', ')} is cited in the
              manuscript body but is no longer attached in the Article Sources list. Re-attach the
              source or remove the <code className="font-mono">[!N]</code> marker before publishing.
            </span>
          </div>
        </div>
      )}

      {/* Scientific Symbol Palette */}
      {editorMode === 'visual' && symbolMenuOpen && (
        <div
          role="region"
          aria-label="Scientific Unicode symbol palette"
          className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Insert Scientific Unicode Symbol at Cursor
            </span>
            <button
              type="button"
              onClick={() => setSymbolMenuOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SCIENTIFIC_SYMBOLS.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertSymbol(item.symbol)}
                title={item.name}
                aria-label={`Insert symbol ${item.name}`}
                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#087f83] hover:bg-teal-50 dark:hover:bg-teal-950/40 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center"
              >
                {item.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LaTeX Equation Composer Bar (SRS-MATH-001/002) */}
      {editorMode === 'visual' && equationBarOpen && (
        <div
          role="region"
          aria-label="LaTeX Equation Composer"
          className="px-4 py-3 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sigma className="w-4 h-4 text-[#087f83]" />
              <span>
                {editingMathPos !== null
                  ? 'Edit Scientific LaTeX Equation (Canonical TeX Preserved)'
                  : 'Insert Scientific LaTeX Equation (Canonical TeX Preserved)'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="math-display-mode"
                  checked={equationDisplay === 'inline'}
                  onChange={() => setEquationDisplay('inline')}
                />
                <span>Inline Equation</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="math-display-mode"
                  checked={equationDisplay === 'block'}
                  onChange={() => setEquationDisplay('block')}
                />
                <span>Block Equation</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              aria-label="LaTeX Expression"
              value={equationTex}
              onChange={(e) => {
                setEquationTex(e.target.value);
                setEquationError(null);
              }}
              placeholder="e.g., E = mc^2 or \frac{\hbar^2}{2m}\nabla^2\psi"
              className="flex-1 min-w-[260px] px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
            />
            <button
              type="button"
              onClick={handleInsertEquation}
              aria-label={editingMathPos !== null ? 'Update Equation' : 'Insert Equation'}
              className="px-3 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold"
            >
              {editingMathPos !== null ? 'Update Equation' : 'Insert Equation'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingMathPos(null);
                setEquationError(null);
                setEquationBarOpen(false);
              }}
              className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-500 shrink-0">Rendered 2D Preview:</span>
            {latexPreview.valid ? (
              <span
                className="font-serif text-sm text-slate-900 dark:text-slate-100"
                data-testid="latex-live-preview"
                dangerouslySetInnerHTML={{ __html: latexPreview.renderedHtml }}
              />
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {latexPreview.error}
              </span>
            )}
          </div>

          {equationError && (
            <p role="alert" className="text-red-600 dark:text-red-400 font-medium">
              {equationError}
            </p>
          )}
        </div>
      )}

      {/* Citation Picker Bar (SRS-SCI-001) */}
      {editorMode === 'visual' && citationMenuOpen && (
        <div
          role="region"
          aria-label="Scientific Source Citation Picker"
          className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Insert Inline Citation Linked to Article Sources (Numbered by Appearance Order)
            </span>
            <button
              type="button"
              onClick={() => setCitationMenuOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          {availableSources.length === 0 ? (
            <p className="text-slate-500">
              No scientific sources are attached to this article yet. Attach or add a citation in
              the Sources tab on the right inspector first.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {availableSources.map((src, idx) => {
                const assignedNum = citationAnalysis.numberBySourceId.get(src.id);
                return (
                  <button
                    key={src.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsertCitation(src)}
                    className="text-left px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#087f83] flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      <strong className="font-mono text-[#087f83] dark:text-teal-400 mr-1.5">
                        {assignedNum ? `[${assignedNum}]` : `[Ref ${idx + 1}]`}
                      </strong>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {src.title}
                      </span>{' '}
                      <span className="text-slate-500">
                        ({src.authors}, {src.year})
                      </span>
                    </span>
                    {src.doi && (
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        DOI: {src.doi}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Find & Replace Bar (SRS-ED-009) */}
      {editorMode === 'visual' && findBarOpen && (
        <div
          role="region"
          aria-label="Manuscript Find and Replace"
          className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs"
        >
          <input
            type="text"
            aria-label="Find text in manuscript"
            value={findQuery}
            onChange={(e) => {
              setFindQuery(e.target.value);
              setActiveMatchIndex(0);
              setFindStatus(null);
            }}
            placeholder="Find in manuscript..."
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
          <input
            type="text"
            aria-label="Replace with text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={findCaseSensitive}
              onChange={(e) => {
                setFindCaseSensitive(e.target.checked);
                setActiveMatchIndex(0);
              }}
            />
            <span>Match case</span>
          </label>
          <span
            data-testid="find-match-counter"
            className="font-mono text-[11px] text-slate-600 dark:text-slate-400"
          >
            {findQuery
              ? findMatchesCount > 0
                ? `${safeMatchIndex + 1} of ${findMatchesCount} match(es)`
                : '0 matches'
              : 'Enter search term'}
          </span>
          <button
            type="button"
            disabled={findMatchesCount === 0}
            aria-label="Find Previous"
            onClick={() => focusMatchAtIndex(safeMatchIndex - 1)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium disabled:opacity-40 flex items-center gap-0.5"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            disabled={findMatchesCount === 0}
            aria-label="Find Next"
            onClick={() => focusMatchAtIndex(safeMatchIndex + 1)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium disabled:opacity-40 flex items-center gap-0.5"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Next</span>
          </button>
          <button
            type="button"
            disabled={findMatchesCount === 0}
            onClick={() => handleReplaceMatches(false)}
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium disabled:opacity-40"
          >
            Replace Next
          </button>
          <button
            type="button"
            disabled={findMatchesCount === 0}
            onClick={() => handleReplaceMatches(true)}
            className="px-2.5 py-1 rounded bg-[#087f83] text-white font-semibold disabled:opacity-40"
          >
            Replace All
          </button>
          <button
            type="button"
            onClick={() => {
              setFindBarOpen(false);
              setFindStatus(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {findStatus && (
            <span className="w-full text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {findStatus}
            </span>
          )}
        </div>
      )}

      {/* Safe Link Validation Sub-bar */}
      {editorMode === 'visual' && linkBarOpen && (
        <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <label
            htmlFor="tiptap-link-url"
            className="font-medium text-slate-700 dark:text-slate-300"
          >
            Destination URL:
          </label>
          <input
            id="tiptap-link-url"
            type="text"
            value={linkUrlInput}
            onChange={(e) => setLinkUrlInput(e.target.value)}
            placeholder="https://doi.org/10.1038/... or /preview/articles/..."
            className="flex-1 min-w-[240px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-2.5 py-1 rounded bg-[#087f83] text-white font-medium flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Link</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setLinkBarOpen(false);
            }}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setLinkBarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {linkError && (
            <div className="w-full text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{linkError}</span>
            </div>
          )}
        </div>
      )}

      {/* H1 Demotion / Paste Safety Notice */}
      {pasteNotice && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{pasteNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPasteNotice(null)}
            className="text-amber-700 dark:text-amber-300 hover:underline text-[11px] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Writing Canvas or HTML Source Panel */}
      {editorMode === 'html_source' ? (
        <HtmlSourcePanel
          canonicalBodyHtml={sanitizeAndDemoteBodyH1(editor.getHTML(), trustedSources).sanitizedHtml}
          trustedImageSources={trustedSources}
          rawBuffer={rawHtmlBuffer}
          onChangeRawBuffer={setRawHtmlBuffer}
          onApplyValidatedHtml={(sanitizedHtml, demotedH1Count, summaryNote) => {
            lastEmittedHtmlRef.current = sanitizedHtml;
            editor.commands.setContent(sanitizedHtml, { emitUpdate: false });
            setRawHtmlBuffer(formatEditorialHtmlSource(sanitizedHtml));
            if (demotedH1Count > 0) {
              setPasteNotice(
                `Normalized ${demotedH1Count} body <h1> tag(s) to <h2> when applying HTML Source.`
              );
              onDemotedH1?.(demotedH1Count);
            } else {
              setPasteNotice('Applied HTML Source changes to Visual Editor.');
            }
            onChange?.(
              sanitizedHtml,
              editor.getJSON() as Record<string, unknown>,
              demotedH1Count
            );
            onChangeHtml?.(sanitizedHtml);
            onApplyHtmlSource?.(sanitizedHtml, summaryNote);
            setEditorMode('visual');
          }}
          onExitToVisual={() => setEditorMode('visual')}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

