'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Sparkles,
  Pilcrow,
  Code,
  FileCode2,
  Eye,
  Table as TableIcon,
  TerminalSquare,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Sigma,
  Omega,
  Minus,
  Trash2,
  Plus,
  BookMarked,
  Image as ImageIcon,
  AlertTriangle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eraser,
  Search,
  Replace,
  Combine,
  SplitSquareVertical,
  Captions,
} from 'lucide-react';
import { KnowledgeLink, MediaAsset, ScientificSource } from '@/lib/types';
import { isSafeLinkHref } from '@/lib/editorial-rules';
import { HtmlSourcePanel } from './html-source-panel';
import {
  SCIENTIFIC_SYMBOL_CATEGORIES,
  ScientificSymbolCategory,
} from '@/lib/latex-math';
import {
  formatEditorialHtmlSource,
  synchronizeArticleBodyRepresentations,
} from '@/lib/html-source';
import { analyzeManuscriptCitations } from '@/lib/citations';
import {
  prepareCanonicalHtmlForCkeditor,
  canonicalizeCkeditorDataHtml,
} from '@/lib/ckeditor/ckeditor-html-bridge';
import {
  renderEquation,
  validateAndRenderKatex,
} from '@/lib/ckeditor/ckeditor5-math/utils';
import { syncCkeditorCitationBadges } from '@/lib/ckeditor/scientific-ckeditor-plugins';
import type { ClassicEditor as ClassicEditorType } from 'ckeditor5';

interface ArticleCKEditorProps {
  contentHtml: string;
  knowledgeLinks: KnowledgeLink[];
  availableSources?: ScientificSource[];
  trustedImageSources?: Set<string>;
  pendingFigureInsert?: MediaAsset | null;
  onFigureInserted?: () => void;
  onRequestMediaInsert?: () => void;
  onChange: (html: string, json: Record<string, unknown>) => void;
  onSyncJson?: (json: Record<string, unknown>, canonicalHtml: string) => void;
  onApplyHtmlSource?: (
    sanitizedHtml: string,
    summaryNote: string,
    json: Record<string, unknown>
  ) => void;
  onDemotedH1?: (demotedCount: number) => void;
}

export function ArticleCKEditor({
  contentHtml,
  knowledgeLinks,
  availableSources = [],
  trustedImageSources,
  pendingFigureInsert,
  onFigureInserted,
  onRequestMediaInsert,
  onChange,
  onSyncJson,
  onApplyHtmlSource,
  onDemotedH1,
}: ArticleCKEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<ClassicEditorType | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const isApplyingExternalDataRef = useRef(false);
  const lastEmittedHtmlRef = useRef<string>(contentHtml);
  const [rawHtmlBuffer, setRawHtmlBuffer] = useState<string>(() =>
    formatEditorialHtmlSource(contentHtml)
  );

  const onChangeRef = useRef(onChange);
  const onSyncJsonRef = useRef(onSyncJson);
  const onDemotedH1Ref = useRef(onDemotedH1);
  const trustedSourcesRef = useRef(trustedImageSources);
  const availableSourcesRef = useRef(availableSources);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSyncJsonRef.current = onSyncJson;
    onDemotedH1Ref.current = onDemotedH1;
    trustedSourcesRef.current = trustedImageSources;
    availableSourcesRef.current = availableSources;
  }, [onChange, onSyncJson, onDemotedH1, trustedImageSources, availableSources]);

  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

  // Link popover state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [linkKnowledgeTerm, setLinkKnowledgeTerm] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Symbol palette state
  const [symbolDrawerOpen, setSymbolDrawerOpen] = useState(false);
  const [activeSymbolCat, setActiveSymbolCat] = useState(
    SCIENTIFIC_SYMBOL_CATEGORIES[0].id
  );

  // LaTeX equation modal state (works alongside CKEditor Math command & KaTeX)
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [mathTexInput, setMathTexInput] = useState(
    '\\mathcal{F} = \\langle \\Psi | \\rho | \\Psi \\rangle'
  );
  const [mathDisplayMode, setMathDisplayMode] = useState<'inline' | 'block'>('block');
  const [editingExistingMath, setEditingExistingMath] = useState(false);
  const mathPreviewContainerRef = useRef<HTMLDivElement | null>(null);

  // Table caption inline editor state
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false);
  const [tableCaptionInput, setTableCaptionInput] = useState('');

  // Citation picker popover
  const [citationPickerOpen, setCitationPickerOpen] = useState(false);

  // Find & Replace bar state
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findStatusMessage, setFindStatusMessage] = useState<string | null>(null);

  // Track whether cursor is inside a table
  const [isInsideTable, setIsInsideTable] = useState(false);

  const citationAnalysis = useMemo(
    () => analyzeManuscriptCitations(contentHtml, availableSources),
    [contentHtml, availableSources]
  );

  const katexValidation = useMemo(
    () => validateAndRenderKatex(mathTexInput, mathDisplayMode === 'block'),
    [mathTexInput, mathDisplayMode]
  );

  // Update live KaTeX preview inside the modal using CKEditor Math's renderEquation
  useEffect(() => {
    if (!mathModalOpen || !mathPreviewContainerRef.current) return;
    if (!mathTexInput.trim()) {
      mathPreviewContainerRef.current.innerHTML =
        '<span class="text-xs text-slate-400 italic">Enter a LaTeX expression to preview KaTeX output…</span>';
      return;
    }
    void renderEquation(
      mathTexInput,
      mathPreviewContainerRef.current,
      'katex',
      undefined,
      mathDisplayMode === 'block',
      false
    );
  }, [mathModalOpen, mathTexInput, mathDisplayMode]);

  // Mount CKEditor 5 ClassicEditor
  useEffect(() => {
    let destroyed = false;
    const container = editorContainerRef.current;
    if (!container) return;

    async function initEditor() {
      const [
        ckeditorModule,
        mathModule,
        scientificPluginsModule,
      ] = await Promise.all([
        import('ckeditor5'),
        import('@/lib/ckeditor/ckeditor5-math'),
        import('@/lib/ckeditor/scientific-ckeditor-plugins'),
      ]);

      if (destroyed || !editorContainerRef.current) return;

      const {
        ClassicEditor,
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Code,
        Subscript,
        Superscript,
        RemoveFormat,
        Alignment,
        List,
        BlockQuote,
        CodeBlock,
        HorizontalLine,
        Table,
        TableToolbar,
        TableCaption,
        Link,
        FindAndReplace,
        Highlight,
        PasteFromOffice,
        GeneralHtmlSupport,
      } = ckeditorModule;

      const { Math, AutoformatMath } = mathModule;
      const {
        ScientificCitationPlugin,
        ScientificFigurePlugin,
        ScientificHtmlAttributeBridge,
      } = scientificPluginsModule;

      const prepared = prepareCanonicalHtmlForCkeditor(
        contentHtml,
        trustedSourcesRef.current
      );

      isApplyingExternalDataRef.current = true;

      const editor = await ClassicEditor.create(editorContainerRef.current, {
        licenseKey: 'GPL',
        initialData: prepared.ckeditorHtml,
        placeholder:
          'Write your scientific article body in CKEditor 5 + KaTeX… Use H2 and H3 for section hierarchy (the article title above is the sole H1).',
        plugins: [
          Essentials,
          Paragraph,
          Heading,
          Bold,
          Italic,
          Underline,
          Strikethrough,
          Code,
          Subscript,
          Superscript,
          RemoveFormat,
          Alignment,
          List,
          BlockQuote,
          CodeBlock,
          HorizontalLine,
          Table,
          TableToolbar,
          TableCaption,
          Link,
          FindAndReplace,
          Highlight,
          PasteFromOffice,
          GeneralHtmlSupport,
          Math,
          AutoformatMath,
          ScientificCitationPlugin,
          ScientificFigurePlugin,
          ScientificHtmlAttributeBridge,
        ],
        toolbar: {
          items: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            'subscript',
            'superscript',
            'removeFormat',
            '|',
            'alignment',
            '|',
            'bulletedList',
            'numberedList',
            'blockQuote',
            'codeBlock',
            'horizontalLine',
            '|',
            'insertTable',
            'math',
            'link',
            'findAndReplace',
          ],
          shouldNotGroupWhenFull: false,
        },
        heading: {
          options: [
            {
              model: 'paragraph',
              title: 'Paragraph',
              class: 'ck-heading_paragraph',
            },
            {
              model: 'heading2',
              view: 'h2',
              title: 'Heading 2 (Section)',
              class: 'ck-heading_heading2',
            },
            {
              model: 'heading3',
              view: 'h3',
              title: 'Heading 3 (Subsection)',
              class: 'ck-heading_heading3',
            },
          ],
        },
        table: {
          contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'toggleTableCaption',
          ],
        },
        math: {
          engine: 'katex',
          outputType: 'span',
          forceOutputType: true,
          enablePreview: true,
        },
        htmlSupport: {
          allow: [
            {
              name: /^(p|h2|h3|blockquote|ul|ol|li|pre|code|table|caption|thead|tbody|tr|th|td|figure|figcaption|img|sup|sub|span|div|a|hr)$/,
              attributes: true,
              classes: true,
            },
          ],
          disallow: [
            {
              name: /^(script|iframe|object|embed|style|form|input|button|svg|math)$/,
            },
          ],
        },
      } as any);

      if (destroyed) {
        await editor.destroy();
        return;
      }

      editorInstanceRef.current = editor;

      // Sync citation numbers on initial mount without firing dirty state
      syncCkeditorCitationBadges(editor, availableSourcesRef.current);

      const initialCanonical = canonicalizeCkeditorDataHtml(
        editor.getData(),
        trustedSourcesRef.current
      );
      lastEmittedHtmlRef.current = initialCanonical.sanitizedHtml;
      onSyncJsonRef.current?.(
        initialCanonical.bodyJson,
        initialCanonical.sanitizedHtml
      );

      isApplyingExternalDataRef.current = false;
      setEditorReady(true);

      // Track selection inside table & math widgets
      editor.model.document.selection.on('change:range', () => {
        const firstPos = editor.model.document.selection.getFirstPosition();
        const selectedElem = editor.model.document.selection.getSelectedElement();
        const inTable = Boolean(
          firstPos?.findAncestor('table') ||
            selectedElem?.is('element', 'table')
        );
        setIsInsideTable(inTable);
      });

      // Listen for user data changes
      editor.model.document.on('change:data', () => {
        if (isApplyingExternalDataRef.current) return;

        isApplyingExternalDataRef.current = true;
        try {
          syncCkeditorCitationBadges(editor, availableSourcesRef.current);
        } finally {
          isApplyingExternalDataRef.current = false;
        }

        const rawData = editor.getData();
        const canonical = canonicalizeCkeditorDataHtml(
          rawData,
          trustedSourcesRef.current
        );

        if (canonical.demotedCount > 0) {
          onDemotedH1Ref.current?.(canonical.demotedCount);
        }

        lastEmittedHtmlRef.current = canonical.sanitizedHtml;
        onChangeRef.current(canonical.sanitizedHtml, canonical.bodyJson);
      });
    }

    void initEditor();

    return () => {
      destroyed = true;
      setEditorReady(false);
      const currentEditor = editorInstanceRef.current;
      editorInstanceRef.current = null;
      if (currentEditor) {
        void currentEditor.destroy();
      }
    };
    // Only run on mount/unmount; external contentHtml changes are handled by the sync effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external contentHtml updates (e.g., revision restore, HTML source apply, or article switch)
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor || !editorReady) return;
    if (contentHtml === lastEmittedHtmlRef.current) return;

    const prepared = prepareCanonicalHtmlForCkeditor(
      contentHtml,
      trustedImageSources
    );
    isApplyingExternalDataRef.current = true;
    try {
      editor.setData(prepared.ckeditorHtml);
      syncCkeditorCitationBadges(editor, availableSources);
      const canonical = canonicalizeCkeditorDataHtml(
        editor.getData(),
        trustedImageSources
      );
      lastEmittedHtmlRef.current = canonical.sanitizedHtml;
      onSyncJsonRef.current?.(canonical.bodyJson, canonical.sanitizedHtml);
    } finally {
      isApplyingExternalDataRef.current = false;
    }
  }, [contentHtml, editorReady, trustedImageSources, availableSources]);

  // Keep citation badge numbering in sync when availableSources changes
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor || !editorReady) return;
    isApplyingExternalDataRef.current = true;
    try {
      const changed = syncCkeditorCitationBadges(editor, availableSources);
      if (changed) {
        const canonical = canonicalizeCkeditorDataHtml(
          editor.getData(),
          trustedImageSources
        );
        lastEmittedHtmlRef.current = canonical.sanitizedHtml;
        onSyncJsonRef.current?.(canonical.bodyJson, canonical.sanitizedHtml);
      }
    } finally {
      isApplyingExternalDataRef.current = false;
    }
  }, [availableSources, editorReady, trustedImageSources]);

  // Handle pending figure insertion from Media Picker modal
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor || !editorReady || !pendingFigureInsert) return;

    editor.execute('insertScientificFigure', {
      mediaId: pendingFigureInsert.id,
      src: pendingFigureInsert.src,
      alt: pendingFigureInsert.altText || pendingFigureInsert.title || 'Scientific illustration',
      caption: pendingFigureInsert.caption || 'Figure caption',
    });
    editor.editing.view.focus();
    onFigureInserted?.();
  }, [pendingFigureInsert, editorReady, onFigureInserted]);

  // Open Equation Dialog when clicking an existing math widget in CKEditor
  const handleEditableClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const mathWidget = target.closest('.ck-math-tex, [data-math-tex]') as HTMLElement | null;
    if (!mathWidget) return;

    const editor = editorInstanceRef.current;
    if (!editor) return;

    const selectedModelElement = editor.model.document.selection.getSelectedElement();
    if (
      selectedModelElement &&
      (selectedModelElement.is('element', 'mathtex-inline') ||
        selectedModelElement.is('element', 'mathtex-display'))
    ) {
      const eq = String(selectedModelElement.getAttribute('equation') || '');
      const isDisplay =
        selectedModelElement.is('element', 'mathtex-display') ||
        Boolean(selectedModelElement.getAttribute('display'));
      setMathTexInput(eq);
      setMathDisplayMode(isDisplay ? 'block' : 'inline');
      setEditingExistingMath(true);
      setMathModalOpen(true);
      return;
    }

    const domTex = mathWidget.getAttribute('data-math-tex');
    const domDisplay = mathWidget.getAttribute('data-math-display');
    if (domTex) {
      setMathTexInput(domTex);
      setMathDisplayMode(domDisplay === 'block' ? 'block' : 'inline');
      setEditingExistingMath(true);
      setMathModalOpen(true);
    }
  }, []);

  const openNewMathDialog = () => {
    const editor = editorInstanceRef.current;
    if (editor) {
      const selectedModelElement = editor.model.document.selection.getSelectedElement();
      if (
        selectedModelElement &&
        (selectedModelElement.is('element', 'mathtex-inline') ||
          selectedModelElement.is('element', 'mathtex-display'))
      ) {
        const eq = String(selectedModelElement.getAttribute('equation') || '');
        const isDisplay =
          selectedModelElement.is('element', 'mathtex-display') ||
          Boolean(selectedModelElement.getAttribute('display'));
        setMathTexInput(eq);
        setMathDisplayMode(isDisplay ? 'block' : 'inline');
        setEditingExistingMath(true);
        setMathModalOpen(true);
        return;
      }
    }
    setEditingExistingMath(false);
    setMathModalOpen(true);
  };

  const handleInsertOrUpdateEquation = () => {
    const editor = editorInstanceRef.current;
    const trimmed = mathTexInput.trim();
    if (!editor || !trimmed) return;

    editor.execute(
      'math',
      trimmed,
      mathDisplayMode === 'block',
      'katex',
      'span'
    );
    editor.editing.view.focus();
    setMathModalOpen(false);
    setEditingExistingMath(false);
  };

  // Insert an empty 3x3 scientific table with 1 header row and move cursor to Row 1 Col 1
  const handleInsertScientificTable = () => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    editor.execute('insertTable', {
      rows: 3,
      columns: 3,
      headingRows: 1,
      headingColumns: 0,
    });
    editor.editing.view.focus();
    setIsInsideTable(true);
  };

  // Ensure selection is inside a table (or focus the first table in the document if needed)
  const ensureTableSelection = (): boolean => {
    const editor = editorInstanceRef.current;
    if (!editor) return false;
    const firstPos = editor.model.document.selection.getFirstPosition();
    if (firstPos?.findAncestor('table')) return true;

    const root = editor.model.document.getRoot();
    if (!root) return false;
    for (const child of root.getChildren()) {
      if (child.is('element', 'table')) {
        const firstRow = child.getChild(0);
        if (firstRow && firstRow.is('element', 'tableRow')) {
          const firstCell = firstRow.getChild(0);
          if (firstCell && firstCell.is('element', 'tableCell')) {
            editor.model.change((writer) => {
              writer.setSelection(firstCell, 'in');
            });
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleAddRowBelow = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    editor.execute('insertTableRowBelow');
    editor.editing.view.focus();
  };

  const handleAddColumnRight = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    editor.execute('insertTableColumnRight');
    editor.editing.view.focus();
  };

  const handleDeleteRow = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    editor.execute('removeTableRow');
    editor.editing.view.focus();
  };

  const handleDeleteColumn = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    editor.execute('removeTableColumn');
    editor.editing.view.focus();
  };

  const handleToggleHeaderRow = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    editor.execute('setTableRowHeader');
    editor.editing.view.focus();
  };

  const handleMergeTableCells = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    const mergeCmd = editor.commands.get('mergeTableCells');
    if (mergeCmd?.isEnabled) {
      editor.execute('mergeTableCells');
    } else {
      const mergeRight = editor.commands.get('mergeTableCellRight');
      const mergeDown = editor.commands.get('mergeTableCellDown');
      if (mergeRight?.isEnabled) {
        editor.execute('mergeTableCellRight');
      } else if (mergeDown?.isEnabled) {
        editor.execute('mergeTableCellDown');
      }
    }
    editor.editing.view.focus();
  };

  const handleSplitTableCell = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    const splitVert = editor.commands.get('splitTableCellVertically');
    const splitHoriz = editor.commands.get('splitTableCellHorizontally');
    if (splitVert?.isEnabled) {
      editor.execute('splitTableCellVertically');
    } else if (splitHoriz?.isEnabled) {
      editor.execute('splitTableCellHorizontally');
    }
    editor.editing.view.focus();
  };

  const handleOpenTableCaptionEditor = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    const firstPos = editor.model.document.selection.getFirstPosition();
    const tableElement = firstPos?.findAncestor('table');
    if (!tableElement) return;

    let existingCaptionText = '';
    for (const child of tableElement.getChildren()) {
      if (child.is('element', 'caption')) {
        for (const node of child.getChildren()) {
          if (node.is('$text') || node.is('$textProxy')) {
            existingCaptionText += node.data;
          }
        }
      }
    }
    setTableCaptionInput(existingCaptionText);
    setCaptionEditorOpen(true);
  };

  const handleApplyTableCaption = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    const firstPos = editor.model.document.selection.getFirstPosition();
    const tableElement = firstPos?.findAncestor('table');
    if (!tableElement) return;

    editor.model.change((writer) => {
      let captionElem: ReturnType<typeof tableElement.getChild> | null = null;
      for (const child of tableElement.getChildren()) {
        if (child.is('element', 'caption')) {
          captionElem = child;
          break;
        }
      }
      if (!tableCaptionInput.trim()) {
        if (captionElem) {
          writer.remove(captionElem);
        }
        return;
      }
      if (!captionElem || !captionElem.is('element')) {
        const newCap = writer.createElement('caption');
        writer.insertText(tableCaptionInput.trim(), newCap);
        writer.append(newCap, tableElement);
      } else {
        writer.remove(writer.createRangeIn(captionElem));
        writer.insertText(tableCaptionInput.trim(), captionElem);
      }
    });

    setCaptionEditorOpen(false);
    editor.editing.view.focus();
  };

  const handleDeleteTable = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !ensureTableSelection()) return;
    const firstPos = editor.model.document.selection.getFirstPosition();
    const tableElement = firstPos?.findAncestor('table');
    if (!tableElement) return;

    editor.model.change((writer) => {
      writer.remove(tableElement);
    });
    setIsInsideTable(false);
    editor.editing.view.focus();
  };

  // Insert symbol at current cursor
  const handleInsertSymbol = (char: string) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    editor.model.change((writer) => {
      editor.model.insertContent(writer.createText(char));
    });
    editor.editing.view.focus();
  };

  // Insert Citation
  const handleInsertCitation = (sourceId: string) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    editor.execute('insertScientificCitation', { sourceId });
    syncCkeditorCitationBadges(editor, availableSources);
    setCitationPickerOpen(false);
    editor.editing.view.focus();
  };

  // Apply Link
  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const trimmed = linkHref.trim();
    if (!trimmed) {
      editor.execute('unlink');
      setLinkDialogOpen(false);
      return;
    }

    if (!isSafeLinkHref(trimmed)) {
      setLinkError(
        'Unsafe URL scheme blocked. Only https://, http://, mailto:, or internal / paths are permitted.'
      );
      return;
    }

    editor.model.change((writer) => {
      const selection = editor.model.document.selection;
      if (selection.isCollapsed) {
        const textNode = writer.createText(linkKnowledgeTerm || trimmed, {
          linkHref: trimmed,
          ...(linkKnowledgeTerm ? { scientificKnowledgeTerm: linkKnowledgeTerm } : {}),
        });
        editor.model.insertContent(textNode);
      } else {
        const ranges = editor.model.schema.getValidRanges(
          Array.from(selection.getRanges()),
          'linkHref'
        );
        for (const range of ranges) {
          writer.setAttribute('linkHref', trimmed, range);
          if (linkKnowledgeTerm) {
            writer.setAttribute('scientificKnowledgeTerm', linkKnowledgeTerm, range);
          } else {
            writer.removeAttribute('scientificKnowledgeTerm', range);
          }
        }
      }
    });

    setLinkDialogOpen(false);
    setLinkError(null);
    editor.editing.view.focus();
  };

  const applyKnowledgePreset = (record: KnowledgeLink) => {
    setLinkHref(
      record.targetUrl ||
        (record.targetArticleId ? `/articles/${record.targetArticleId}` : '#')
    );
    setLinkKnowledgeTerm(record.term);
    setLinkError(null);
  };

  // Find & Replace via CKEditor or model text nodes
  const handleReplaceNext = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !findQuery) return;
    const root = editor.model.document.getRoot();
    if (!root) return;

    const needle = findCaseSensitive ? findQuery : findQuery.toLowerCase();
    let replaced = false;

    editor.model.change((writer) => {
      const range = writer.createRangeIn(root);
      for (const item of range.getItems()) {
        if (replaced) break;
        if (item.is('$textProxy')) {
          const text = item.data;
          const haystack = findCaseSensitive ? text : text.toLowerCase();
          const idx = haystack.indexOf(needle);
          if (idx !== -1) {
            const proxy = item as any;
            const startPos = (proxy.startPosition || proxy.start).getShiftedBy(idx);
            const endPos = startPos.getShiftedBy(findQuery.length);
            const targetRange = writer.createRange(startPos, endPos);
            const attrs = Object.fromEntries(item.getAttributes());
            writer.remove(targetRange);
            writer.insertText(replaceQuery, attrs, startPos);
            replaced = true;
          }
        }
      }
    });

    setFindStatusMessage(
      replaced ? 'Replaced 1 occurrence.' : 'No matching text found in manuscript.'
    );
  };

  const handleReplaceAll = () => {
    const editor = editorInstanceRef.current;
    if (!editor || !findQuery) return;
    const root = editor.model.document.getRoot();
    if (!root) return;

    const needle = findCaseSensitive ? findQuery : findQuery.toLowerCase();
    let count = 0;

    editor.model.change((writer) => {
      const matches: Array<{
        startPos: ReturnType<typeof writer.createPositionAt>;
        endPos: ReturnType<typeof writer.createPositionAt>;
        attrs: Record<string, unknown>;
      }> = [];

      const range = writer.createRangeIn(root);
      for (const item of range.getItems()) {
        if (item.is('$textProxy')) {
          const text = item.data;
          const haystack = findCaseSensitive ? text : text.toLowerCase();
          let searchFrom = 0;
          while (searchFrom <= haystack.length - needle.length) {
            const idx = haystack.indexOf(needle, searchFrom);
            if (idx === -1) break;
            const proxy = item as any;
            const startPos = (proxy.startPosition || proxy.start).getShiftedBy(idx);
            const endPos = startPos.getShiftedBy(findQuery.length);
            matches.push({
              startPos,
              endPos,
              attrs: Object.fromEntries(item.getAttributes()),
            });
            searchFrom = idx + needle.length;
          }
        }
      }

      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const targetRange = writer.createRange(m.startPos, m.endPos);
        writer.remove(targetRange);
        writer.insertText(replaceQuery, m.attrs, m.startPos);
        count++;
      }
    });

    setFindStatusMessage(
      count > 0
        ? `Replaced ${count} occurrence(s).`
        : 'No matching text found in manuscript.'
    );
  };

  return (
    <div
      data-testid="ckeditor-scientific-container"
      className="sr-ckeditor-shell rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] shadow-xs overflow-hidden"
    >
      {/* Top Editor Mode Bar + Scientific Quick Actions */}
      <div
        role="toolbar"
        aria-label="Scientific formatting toolbar"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm"
      >
        {/* Visual vs HTML Source Mode Switch */}
        <div
          role="group"
          aria-label="Editor surface mode"
          className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 mr-1.5"
        >
          <button
            type="button"
            onClick={() => setEditorMode('visual')}
            aria-pressed={editorMode === 'visual'}
            className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors ${
              editorMode === 'visual'
                ? 'bg-[#087f83] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visual Editor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const currentHtml = editorInstanceRef.current
                ? canonicalizeCkeditorDataHtml(editorInstanceRef.current.getData(), trustedImageSources).sanitizedHtml
                : contentHtml;
              setRawHtmlBuffer(formatEditorialHtmlSource(currentHtml));
              setEditorMode('html');
            }}
            aria-pressed={editorMode === 'html'}
            className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors ${
              editorMode === 'html'
                ? 'bg-[#087f83] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>HTML Source</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-1 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300 mr-1">
          <span>CKEditor 5 v49.0.1 + KaTeX</span>
        </span>

        {editorMode === 'visual' && (
          <>
            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('heading', { value: 'paragraph' });
                ed.editing.view.focus();
              }}
              label="Paragraph"
            >
              <Pilcrow className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('heading', { value: 'heading2' });
                ed.editing.view.focus();
              }}
              label="Heading 2 (Section)"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('heading', { value: 'heading3' });
                ed.editing.view.focus();
              }}
              label="Heading 3 (Subsection)"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('bold');
                ed.editing.view.focus();
              }}
              label="Bold"
            >
              <BoldIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('italic');
                ed.editing.view.focus();
              }}
              label="Italic"
            >
              <ItalicIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('underline');
                ed.editing.view.focus();
              }}
              label="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('strikethrough');
                ed.editing.view.focus();
              }}
              label="Strikethrough"
            >
              <StrikethroughIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('code');
                ed.editing.view.focus();
              }}
              label="Inline Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('subscript');
                ed.editing.view.focus();
              }}
              label="Subscript (x₂)"
            >
              <SubscriptIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('superscript');
                ed.editing.view.focus();
              }}
              label="Superscript (x²)"
            >
              <SuperscriptIcon className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('alignment', { value: 'left' });
                ed.editing.view.focus();
              }}
              label="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('alignment', { value: 'center' });
                ed.editing.view.focus();
              }}
              label="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('alignment', { value: 'right' });
                ed.editing.view.focus();
              }}
              label="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('alignment', { value: 'justify' });
                ed.editing.view.focus();
              }}
              label="Align Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('removeFormat');
                ed.editing.view.focus();
              }}
              label="Clear Formatting"
            >
              <Eraser className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('bulletedList');
                ed.editing.view.focus();
              }}
              label="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('numberedList');
                ed.editing.view.focus();
              }}
              label="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('blockQuote');
                ed.editing.view.focus();
              }}
              label="Pull Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('codeBlock');
                ed.editing.view.focus();
              }}
              label="Code Block"
            >
              <TerminalSquare className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                const ed = editorInstanceRef.current;
                if (!ed) return;
                ed.execute('horizontalLine');
                ed.editing.view.focus();
              }}
              label="Section Divider"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Scientific Data Table Insertion */}
            <ToolbarButton
              onClick={handleInsertScientificTable}
              active={isInsideTable}
              label="Insert Scientific Table"
            >
              <TableIcon className="w-4 h-4" />
            </ToolbarButton>

            {/* LaTeX / KaTeX Equation Modal Trigger */}
            <ToolbarButton
              onClick={openNewMathDialog}
              active={mathModalOpen}
              label="Insert LaTeX Equation"
            >
              <Sigma className="w-4 h-4" />
            </ToolbarButton>

            {/* Scientific Symbol & Greek Drawer Trigger */}
            <ToolbarButton
              onClick={() => setSymbolDrawerOpen((v) => !v)}
              active={symbolDrawerOpen}
              label="Scientific Symbols & Greek Palette"
            >
              <Omega className="w-4 h-4" />
            </ToolbarButton>

            {/* Citation Picker Trigger */}
            <ToolbarButton
              onClick={() => setCitationPickerOpen((v) => !v)}
              active={citationPickerOpen}
              label="Cite Source"
            >
              <BookMarked className="w-4 h-4" />
            </ToolbarButton>

            {/* Figure Insertion Trigger */}
            {onRequestMediaInsert && (
              <ToolbarButton onClick={onRequestMediaInsert} label="Insert Figure">
                <ImageIcon className="w-4 h-4" />
              </ToolbarButton>
            )}

            <ToolbarButton
              onClick={() => setLinkDialogOpen((v) => !v)}
              active={linkDialogOpen}
              label="Insert Link or Knowledge Term"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setFindBarOpen((v) => !v)}
              active={findBarOpen}
              label="Find and Replace"
            >
              <Search className="w-4 h-4" />
            </ToolbarButton>

            <div className="ml-auto flex items-center gap-1">
              <ToolbarButton
                onClick={() => {
                  const ed = editorInstanceRef.current;
                  if (!ed) return;
                  ed.execute('undo');
                  ed.editing.view.focus();
                }}
                label="Undo"
              >
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const ed = editorInstanceRef.current;
                  if (!ed) return;
                  ed.execute('redo');
                  ed.editing.view.focus();
                }}
                label="Redo"
              >
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </>
        )}
      </div>

      {/* Contextual Table Operations Bar (visible when inside a table or after inserting a table) */}
      {editorMode === 'visual' && isInsideTable && (
        <div
          role="toolbar"
          aria-label="Table editing controls"
          className="flex flex-wrap items-center gap-1.5 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-teal-50/70 dark:bg-teal-950/30 text-xs"
        >
          <span className="font-semibold text-[#087f83] dark:text-teal-400 mr-1">
            Table Controls:
          </span>
          <button
            type="button"
            onClick={handleAddRowBelow}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
          <button
            type="button"
            onClick={handleAddColumnRight}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            <Plus className="w-3 h-3" /> Add Column
          </button>
          <button
            type="button"
            onClick={handleDeleteRow}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 font-medium"
          >
            Delete Row
          </button>
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 font-medium"
          >
            Delete Column
          </button>
          <button
            type="button"
            onClick={handleToggleHeaderRow}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            Toggle Header Row
          </button>
          <button
            type="button"
            onClick={handleMergeTableCells}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            <Combine className="w-3 h-3" /> Merge Cells
          </button>
          <button
            type="button"
            onClick={handleSplitTableCell}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            <SplitSquareVertical className="w-3 h-3" /> Split Cell
          </button>
          <button
            type="button"
            onClick={handleOpenTableCaptionEditor}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#087f83] text-slate-700 dark:text-slate-200 font-medium"
          >
            <Captions className="w-3 h-3" /> Table Caption
          </button>
          <button
            type="button"
            onClick={handleDeleteTable}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium ml-auto"
          >
            <Trash2 className="w-3 h-3" /> Delete Table
          </button>
        </div>
      )}

      {/* Table Caption Editor Inline Bar */}
      {editorMode === 'visual' && captionEditorOpen && (
        <div
          role="region"
          aria-label="Edit scientific table caption"
          className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
        >
          <label htmlFor="ckeditor-table-caption-input" className="font-semibold text-slate-700 dark:text-slate-200">
            Table Caption:
          </label>
          <input
            id="ckeditor-table-caption-input"
            type="text"
            value={tableCaptionInput}
            onChange={(e) => setTableCaptionInput(e.target.value)}
            placeholder="Table 1: Experimental parameters and statistical significance (p < 0.005)…"
            className="flex-1 min-w-[240px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
          <button
            type="button"
            onClick={handleApplyTableCaption}
            className="px-3 py-1 rounded bg-[#087f83] text-white font-semibold"
          >
            Save Caption
          </button>
          <button
            type="button"
            onClick={() => setCaptionEditorOpen(false)}
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Find & Replace Drawer */}
      {editorMode === 'visual' && findBarOpen && (
        <div
          role="region"
          aria-label="Find and replace in manuscript"
          className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => {
                setFindQuery(e.target.value);
                setFindStatusMessage(null);
              }}
              placeholder="Find in manuscript…"
              aria-label="Find text"
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs w-44"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Replace className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with…"
              aria-label="Replace with text"
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs w-44"
            />
          </div>
          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={findCaseSensitive}
              onChange={(e) => setFindCaseSensitive(e.target.checked)}
            />
            <span>Match case</span>
          </label>
          <button
            type="button"
            onClick={handleReplaceNext}
            disabled={!findQuery}
            className="px-2.5 py-1 rounded bg-[#087f83] text-white font-semibold disabled:opacity-40"
          >
            Replace Next
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={!findQuery}
            className="px-2.5 py-1 rounded border border-[#087f83] text-[#087f83] dark:text-teal-300 font-semibold disabled:opacity-40"
          >
            Replace All
          </button>
          {findStatusMessage && (
            <span role="status" className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {findStatusMessage}
            </span>
          )}
          <button
            type="button"
            onClick={() => setFindBarOpen(false)}
            className="ml-auto text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            Close
          </button>
        </div>
      )}

      {/* Orphaned Citation Alert Banner */}
      {citationAnalysis.orphanedSourceIds.length > 0 && (
        <div
          role="alert"
          data-testid="orphaned-citation-warning"
          className="flex items-center justify-between gap-2 px-4 py-2 border-b border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Orphaned Citation Marker:</strong> Manuscript references{' '}
              <code className="font-mono">{citationAnalysis.orphanedSourceIds.join(', ')}</code>{' '}
              which is no longer attached to this article&apos;s verified sources list.
            </span>
          </div>
        </div>
      )}

      {/* Citation Picker Popover */}
      {editorMode === 'visual' && citationPickerOpen && (
        <div
          role="dialog"
          aria-label="Insert numbered source citation"
          className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-[#087f83]" />
              <span>Insert In-Text Citation Marker</span>
            </span>
            <button
              type="button"
              onClick={() => setCitationPickerOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          {availableSources.length === 0 ? (
            <p className="text-xs text-slate-500">
              No sources attached to this manuscript yet. Add a source in the right-hand{' '}
              <strong>Sources</strong> inspector tab first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSources.map((src, idx) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => handleInsertCitation(src.id)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#087f83] transition-colors flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {src.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {src.doi ? `DOI: ${src.doi}` : src.url}
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-[#087f83] dark:text-teal-300 font-mono text-xs font-bold">
                    Cite [{idx + 1}]
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scientific Symbol & Greek Character Drawer */}
      {editorMode === 'visual' && symbolDrawerOpen && (
        <div
          role="region"
          aria-label="Scientific symbol palette"
          className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {SCIENTIFIC_SYMBOL_CATEGORIES.map((cat: ScientificSymbolCategory) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveSymbolCat(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeSymbolCat === cat.id
                      ? 'bg-[#087f83] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSymbolDrawerOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SCIENTIFIC_SYMBOL_CATEGORIES.find((c: ScientificSymbolCategory) => c.id === activeSymbolCat)?.symbols.map(
              (s: { char: string; name: string }) => (
                <button
                  key={`${s.char}-${s.name}`}
                  type="button"
                  onClick={() => handleInsertSymbol(s.char)}
                  title={`Insert ${s.name} (${s.char})`}
                  aria-label={`Insert ${s.name}`}
                  className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#087f83] hover:bg-teal-50/50 dark:hover:bg-teal-950/40 text-sm font-serif font-medium text-slate-900 dark:text-slate-100 transition-colors"
                >
                  {s.char}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* LaTeX / KaTeX Equation Modal / Inspector */}
      {editorMode === 'visual' && mathModalOpen && (
        <div
          role="dialog"
          aria-label="LaTeX Equation Editor"
          className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/90 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-[#087f83]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {editingExistingMath
                  ? 'Edit KaTeX Equation (CKEditor Math)'
                  : 'Insert KaTeX Equation (CKEditor Math)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="ckeditor-math-display-mode"
                  checked={mathDisplayMode === 'inline'}
                  onChange={() => setMathDisplayMode('inline')}
                />
                <span>Inline ($…$)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="ckeditor-math-display-mode"
                  checked={mathDisplayMode === 'block'}
                  onChange={() => setMathDisplayMode('block')}
                />
                <span>Display Block ($$…$$)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="latex-equation-input"
                className="block text-[11px] font-semibold text-slate-500 mb-1"
              >
                LaTeX Expression
              </label>
              <textarea
                id="latex-equation-input"
                rows={3}
                value={mathTexInput}
                onChange={(e) => setMathTexInput(e.target.value)}
                placeholder="e.g. \frac{-\hbar^2}{2m}\nabla^2\psi + V\psi = E\psi"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400">Presets:</span>
                {[
                  {
                    label: 'Bell Fidelity',
                    tex: '\\mathcal{F} = \\langle \\Psi^- | \\rho | \\Psi^- \\rangle \\ge 0.942',
                  },
                  {
                    label: 'Schrödinger',
                    tex: 'i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)',
                  },
                  {
                    label: 'Gaussian Integral',
                    tex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}',
                  },
                  {
                    label: 'Partition Sum',
                    tex: 'Z = \\sum_{i=1}^{N} e^{-\\beta E_i}',
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setMathTexInput(preset.tex)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#087f83]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                Live KaTeX Rendered Preview
              </span>
              <div
                ref={mathPreviewContainerRef}
                data-testid="math-live-preview"
                className="min-h-[76px] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center overflow-x-auto"
              />
              {!katexValidation.valid && katexValidation.error && (
                <div
                  role="alert"
                  data-testid="math-validation-error"
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{katexValidation.error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMathModalOpen(false);
                setEditingExistingMath(false);
              }}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertOrUpdateEquation}
              className="px-3 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold"
            >
              {editingExistingMath ? 'Update Equation' : 'Insert Equation'}
            </button>
          </div>
        </div>
      )}

      {/* Link & Knowledge Term Popover */}
      {editorMode === 'visual' && linkDialogOpen && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-3">
          <form onSubmit={handleApplyLink} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={linkHref}
              onChange={(e) => {
                setLinkHref(e.target.value);
                setLinkError(null);
              }}
              placeholder="https://doi.org/... or /articles/slug"
              aria-label="Link URL"
              className="flex-1 min-w-[240px] px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              value={linkKnowledgeTerm}
              onChange={(e) => setLinkKnowledgeTerm(e.target.value)}
              placeholder="Optional hover knowledge term (e.g. Quantum Entanglement)"
              aria-label="Knowledge card term"
              className="min-w-[220px] px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-medium"
            >
              Apply Link
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkError(null);
              }}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </form>

          {linkError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400 font-medium">
              {linkError}
            </p>
          )}

          {knowledgeLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#087f83]" />
                Quick Knowledge Hover Presets:
              </span>
              {knowledgeLinks.map((kl) => (
                <button
                  key={kl.id}
                  type="button"
                  onClick={() => applyKnowledgePreset(kl)}
                  className="text-[11px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100"
                >
                  {kl.term}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body Surface: Either CKEditor 5 Visual Surface OR HTML Source Editor */}
      {editorMode === 'html' ? (
        <HtmlSourcePanel
          canonicalBodyHtml={contentHtml}
          trustedImageSources={trustedImageSources}
          rawBuffer={rawHtmlBuffer}
          onChangeRawBuffer={setRawHtmlBuffer}
          onExitToVisual={() => setEditorMode('visual')}
          onApplyValidatedHtml={(sanitizedHtml: string, demotedCount: number, summaryNote: string) => {
            if (demotedCount > 0) {
              onDemotedH1?.(demotedCount);
            }
            const canonicalJson = synchronizeArticleBodyRepresentations(
              undefined,
              sanitizedHtml
            ).body;
            if (editorInstanceRef.current) {
              const prepared = prepareCanonicalHtmlForCkeditor(
                sanitizedHtml,
                trustedImageSources
              );
              isApplyingExternalDataRef.current = true;
              try {
                editorInstanceRef.current.setData(prepared.ckeditorHtml);
                syncCkeditorCitationBadges(editorInstanceRef.current, availableSources);
              } finally {
                isApplyingExternalDataRef.current = false;
              }
            }
            lastEmittedHtmlRef.current = sanitizedHtml;
            setRawHtmlBuffer(formatEditorialHtmlSource(sanitizedHtml));
            if (onApplyHtmlSource) {
              onApplyHtmlSource(sanitizedHtml, summaryNote, canonicalJson);
            } else {
              onChange(sanitizedHtml, canonicalJson);
            }
            setEditorMode('visual');
          }}
        />
      ) : null}

      {/* Keep CKEditor DOM mounted even while viewing HTML Source so state & instance stay fast */}
      <div
        onClick={handleEditableClick}
        className={editorMode === 'html' ? 'hidden' : 'block'}
      >
        <div
          ref={editorContainerRef}
          data-testid="ckeditor-editable-host"
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-[#087f83] text-white'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
