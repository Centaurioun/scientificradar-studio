'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  sanitizeAndDemoteBodyH1,
  convertMarkdownPasteToSafeHtml,
  validateSafeUrl,
} from '@/lib/editorial-rules';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  AlertCircle,
} from 'lucide-react';
import { KnowledgeLink } from '@/lib/types';

interface ArticleTiptapEditorProps {
  initialHtml?: string;
  contentHtml?: string;
  knowledgeLinks?: KnowledgeLink[];
  onChange?: (html: string, json: Record<string, unknown>, demotedH1Alert?: number) => void;
  onChangeHtml?: (html: string) => void;
  onDemotedH1?: (count: number) => void;
  onRequestMediaInsert?: () => void;
}

export function ArticleTiptapEditor({
  initialHtml,
  contentHtml,
  onChange,
  onChangeHtml,
  onDemotedH1,
  onRequestMediaInsert,
}: ArticleTiptapEditorProps) {
  const effectiveHtml = contentHtml ?? initialHtml ?? '<p></p>';
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enforce H2 and H3 only in body; Article Title is the single rendered H1 (Spec §6)
        heading: {
          levels: [2, 3],
        },
        // These standalone extensions are configured below; disable StarterKit's bundled copies.
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      ImageExtension,
      Placeholder.configure({
        placeholder:
          'Write or paste your scientific manuscript here. Top-level # H1 headings pasted into the body are automatically proposed as H2 sections so the article title remains the single rendered H1...',
      }),
    ],
    content: effectiveHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': 'Article body editor',
        class:
          'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[480px] px-6 py-5 text-[16px] leading-relaxed',
      },
      handlePaste: (_view, event) => {
        const htmlData = event.clipboardData?.getData('text/html');
        const textData = event.clipboardData?.getData('text/plain') || '';

        // Check if pasted plain text looks like Markdown with # headings
        if (!htmlData && /^#{1,3}\s+/m.test(textData)) {
          event.preventDefault();
          const converted = convertMarkdownPasteToSafeHtml(textData);
          if (converted.demotedH1Count > 0) {
            setPasteNotice(
              `Converted ${converted.demotedH1Count} pasted Markdown "# H1" heading(s) into H2 so the Article Title remains the single rendered H1.`
            );
            onDemotedH1?.(converted.demotedH1Count);
          }
          editor?.commands.insertContent(converted.html);
          return true;
        }

        // Route all rich HTML through the same parser-based allowlist before
        // Tiptap parses it, including markup without obvious attack tokens.
        if (htmlData) {
          event.preventDefault();
          const sanitized = sanitizeAndDemoteBodyH1(htmlData);
          const notices: string[] = [];
          if (sanitized.demotedH1Count > 0) {
            notices.push(
              `Demoted ${sanitized.demotedH1Count} pasted <h1> heading(s) to <h2> (Title is the sole H1)`
            );
            onDemotedH1?.(sanitized.demotedH1Count);
          }
          if (sanitized.removedUnsafeCount > 0) {
            notices.push(
              `Sanitized ${sanitized.removedUnsafeCount} unsafe script/handler attribute(s)`
            );
          }
          if (notices.length > 0) {
            setPasteNotice(notices.join(' · '));
          }
          editor?.commands.insertContent(sanitized.sanitizedHtml);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const rawHtml = ed.getHTML();
      const sanitized = sanitizeAndDemoteBodyH1(rawHtml);
      onChange?.(
        sanitized.sanitizedHtml,
        ed.getJSON() as Record<string, unknown>,
        sanitized.demotedH1Count
      );
      onChangeHtml?.(sanitized.sanitizedHtml);
      if (sanitized.demotedH1Count > 0) {
        onDemotedH1?.(sanitized.demotedH1Count);
      }
    },
  });

  // Sync external updates (e.g., when version restored or local assistant check accepted)
  useEffect(() => {
    if (editor && effectiveHtml !== editor.getHTML()) {
      editor.commands.setContent(effectiveHtml, { emitUpdate: false });
    }
  }, [effectiveHtml, editor]);

  const handleApplyLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkInputOpen(false);
      setLinkError(null);
      return;
    }
    const validation = validateSafeUrl(linkUrl);
    if (!validation.valid) {
      setLinkError(validation.reason || 'Invalid or unsafe URL');
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.trim(), target: linkUrl.startsWith('/') ? '_self' : '_blank' })
      .run();
    setLinkUrl('');
    setLinkError(null);
    setLinkInputOpen(false);
  };

  if (!editor) {
    return (
      <div className="min-h-[480px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#111c22] p-6 text-sm text-slate-400">
        Initializing scientific manuscript editor...
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#111c22] overflow-hidden">
      {/* Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="Manuscript formatting toolbar (H2/H3 enforced; Title is H1)"
        className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-2 py-1 rounded text-xs font-medium ${
              editor.isActive('paragraph')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Paragraph text"
          >
            Paragraph
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading 2 (Section)"
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Heading 2 (H2) — Primary body section"
          >
            <Heading2 className="w-4 h-4" />
            <span>H2</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3 (Subsection)"
            className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Heading 3 (H3) — Subsection"
          >
            <Heading3 className="w-4 h-4" />
            <span>H3</span>
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            className={`p-1.5 rounded ${
              editor.isActive('bold')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            className={`p-1.5 rounded ${
              editor.isActive('italic')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            className={`p-1.5 rounded ${
              editor.isActive('underline')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            className={`p-1.5 rounded ${
              editor.isActive('strike')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
            className={`p-1.5 rounded ${
              editor.isActive('bulletList')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered list"
            className={`p-1.5 rounded ${
              editor.isActive('orderedList')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Blockquote"
            className={`p-1.5 rounded ${
              editor.isActive('blockquote')
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href || '';
              setLinkUrl(previousUrl);
              setLinkInputOpen((prev) => !prev);
            }}
            aria-label="Insert or edit safe link"
            className={`p-1.5 rounded ${
              editor.isActive('link') || linkInputOpen
                ? 'bg-[#087f83] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Insert or edit link (validates safe URL scheme)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {onRequestMediaInsert && (
            <button
              type="button"
              onClick={onRequestMediaInsert}
              aria-label="Insert figure from Media Library"
              className="p-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1 text-xs"
              title="Insert figure from Media Library"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Figure</span>
            </button>
          )}

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
            className="p-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
            className="p-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Title = Sole H1 · Body = H2/H3
          </span>
        </div>
      </div>

      {/* Inline Safe Link Input Bar */}
      {linkInputOpen && (
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
          <label htmlFor="editor-link-url" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Destination URL:
          </label>
          <input
            id="editor-link-url"
            type="text"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkError(null);
            }}
            placeholder="https://doi.org/10.1038/... or /preview/articles/..."
            className="flex-1 min-w-[240px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-3 py-1 rounded bg-[#087f83] text-white text-xs font-medium hover:bg-[#086b70]"
          >
            Apply Link
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkInputOpen(false);
              setLinkError(null);
            }}
            className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 text-xs"
          >
            Cancel
          </button>
          {linkError && (
            <span className="w-full text-xs text-red-600 dark:text-red-400 font-medium">
              {linkError}
            </span>
          )}
        </div>
      )}

      {/* H1 Demotion / Sanitization Warning Notice */}
      {pasteNotice && (
        <div
          role="status"
          className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{pasteNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPasteNotice(null)}
            className="text-[11px] underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tiptap Writing Canvas */}
      <EditorContent editor={editor} />
    </div>
  );
}
