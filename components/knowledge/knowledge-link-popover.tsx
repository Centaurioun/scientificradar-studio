'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { KnowledgeLink } from '@/lib/types';
import { sanitizeEditorialHtml } from '@/lib/html-security';
import { ExternalLink, BookOpen, X } from 'lucide-react';

/**
 * Interactive Wikipedia-style & Internal ScientificRadar Hover/Focus/Tap Popover Card (Section 10).
 * - Desktop: Hover or keyboard focus opens popover in place; remains open when pointer moves onto card.
 * - Keyboard: Focusable trigger; dismissible via Escape key.
 * - Mobile: Tap term to open popover with explicit action link to open destination.
 */
export function KnowledgeLinkPopover({
  termText,
  knowledgeItem,
}: {
  termText: string;
  knowledgeItem: KnowledgeLink;
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const clearTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const computeAlignment = () => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.left;
    setAlignRight(spaceRight < 340 && rect.right > 280);
  };

  const handleMouseEnter = () => {
    clearTimer();
    computeAlignment();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    clearTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const isInternal = knowledgeItem.targetType === 'internal';

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          computeAlignment();
          setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            computeAlignment();
            setOpen((prev) => !prev);
          }
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline text-[#087f83] dark:text-teal-400 underline decoration-[#087f83]/60 dark:decoration-teal-400/60 decoration-dotted underline-offset-4 hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087f83] font-medium cursor-pointer"
      >
        {termText}
      </button>

      {open && (
        <span
          role="dialog"
          aria-label={`Concept summary: ${knowledgeItem.previewTitle}`}
          className={`absolute ${
            alignRight ? 'right-0' : 'left-0'
          } bottom-full mb-2 w-72 sm:w-96 max-w-[calc(100vw-2rem)] p-4 rounded-lg bg-white dark:bg-[#15222a] border border-slate-200 dark:border-slate-700 shadow-xl z-50 text-left block font-sans`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#087f83] dark:text-teal-400" />
              <span>
                {isInternal ? 'ScientificRadar Internal Reference' : 'Wikipedia Concept Preview'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close concept preview"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>

          <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
            {knowledgeItem.previewTitle}
          </span>

          <span className="block text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
            {knowledgeItem.previewExcerpt}
          </span>

          <span className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[180px]" title={knowledgeItem.sourceAttribution}>
              {knowledgeItem.isSampleDemoData ? 'Demo preview · ' : ''}
              {knowledgeItem.sourceAttribution}
            </span>

            {isInternal ? (
              <Link
                href={knowledgeItem.targetUrl}
                className="inline-flex items-center gap-1 font-semibold text-[#087f83] dark:text-teal-400 hover:underline shrink-0"
              >
                <span>Read internal article</span>
              </Link>
            ) : (
              <a
                href={knowledgeItem.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#087f83] dark:text-teal-400 hover:underline shrink-0"
              >
                <span>Read on Wikipedia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Renders sanitized article HTML into valid React block elements (<p>, <h2>, <h3>, <blockquote>, <ul>, <ol>)
 * while enriching recognized Smart Knowledge Link terms into interactive hover/keyboard/mobile popovers
 * without breaking <p> tag nesting.
 */
export function InteractiveArticleBodyRenderer({
  html,
  knowledgeLinks,
  trustedImageSources = new Set<string>(),
}: {
  html: string;
  knowledgeLinks: KnowledgeLink[];
  trustedImageSources?: ReadonlySet<string>;
}) {
  const safeHtml = sanitizeEditorialHtml(html, { trustedImageSources }).html;
  const safeFragment = (fragment: string) =>
    sanitizeEditorialHtml(fragment, { trustedImageSources }).html;
  const renderInlineWithKnowledgeLinks = (inlineHtml: string, keyPrefix: string) => {
    const linkRegex = /<a\b[^>]*data-knowledge-term="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(inlineHtml)) !== null) {
      const [fullMatch, termAttr, innerText] = match;
      const matchStart = match.index;
      if (matchStart > lastIndex) {
        const slice = inlineHtml.slice(lastIndex, matchStart);
        nodes.push(
          <span
            key={`${keyPrefix}-txt-${lastIndex}`}
            dangerouslySetInnerHTML={{ __html: safeFragment(slice) }}
          />
        );
      }

      const foundKl = knowledgeLinks.find(
        (k) => k.term.toLowerCase() === termAttr.toLowerCase()
      );

      if (foundKl) {
        nodes.push(
          <KnowledgeLinkPopover
            key={`${keyPrefix}-kl-${matchStart}`}
            termText={innerText.replace(/<[^>]+>/g, '')}
            knowledgeItem={foundKl}
          />
        );
      } else {
        nodes.push(
          <span
            key={`${keyPrefix}-raw-${matchStart}`}
            dangerouslySetInnerHTML={{ __html: safeFragment(fullMatch) }}
          />
        );
      }

      lastIndex = matchStart + fullMatch.length;
    }

    if (lastIndex < inlineHtml.length) {
      nodes.push(
        <span
          key={`${keyPrefix}-end-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: safeFragment(inlineHtml.slice(lastIndex)) }}
        />
      );
    }

    return nodes;
  };

  const getAlignClass = (attrSource: string) => {
    const m = attrSource.match(/\bdata-text-align="(left|center|right|justify)"/i);
    if (!m) return '';
    const align = m[1].toLowerCase();
    if (align === 'center') return ' text-center';
    if (align === 'right') return ' text-right';
    if (align === 'justify') return ' text-justify';
    return '';
  };

  // Match top-level block elements (<p>, <h2>, <h3>, <h4>, <blockquote>, <ul>, <ol>, <pre>, <figure>, <table>, <div>, <hr>)
  const blockRegex =
    /<(hr)\b[^>]*\/?>|<(p|h2|h3|h4|blockquote|ul|ol|pre|figure|table|div)\b([^>]*)>([\s\S]*?)<\/\2>/gi;
  const blocks: React.ReactNode[] = [];
  let blockMatch: RegExpExecArray | null;
  let idx = 0;

  while ((blockMatch = blockRegex.exec(safeHtml)) !== null) {
    const [, hrTag, pairedTag, attrStr = '', inner = ''] = blockMatch;
    const key = `blk-${idx++}`;

    if (hrTag) {
      blocks.push(
        <hr key={key} className="my-6 border-slate-200 dark:border-slate-800" />
      );
      continue;
    }

    const tagLower = pairedTag.toLowerCase();
    const alignClass = getAlignClass(attrStr);

    if (tagLower === 'h2') {
      blocks.push(
        <h2
          key={key}
          className={`text-xl sm:text-2xl font-bold mt-7 mb-3 text-slate-900 dark:text-slate-100${alignClass}`}
        >
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h2>
      );
    } else if (tagLower === 'h3') {
      blocks.push(
        <h3
          key={key}
          className={`text-lg sm:text-xl font-semibold mt-5 mb-2 text-slate-900 dark:text-slate-100${alignClass}`}
        >
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h3>
      );
    } else if (tagLower === 'h4') {
      blocks.push(
        <h4
          key={key}
          className={`text-base sm:text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100${alignClass}`}
        >
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h4>
      );
    } else if (tagLower === 'blockquote') {
      const cleanQuote = inner.replace(/^<p\b[^>]*>|<\/p>$/gi, '');
      blocks.push(
        <blockquote
          key={key}
          className={`border-y border-slate-200 dark:border-slate-800 py-4 px-5 my-5 italic text-slate-600 dark:text-slate-300${alignClass}`}
        >
          {renderInlineWithKnowledgeLinks(cleanQuote, key)}
        </blockquote>
      );
    } else if (tagLower === 'ul') {
      blocks.push(
        <ul
          key={key}
          className="list-disc pl-6 space-y-1 my-4"
          dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
        />
      );
    } else if (tagLower === 'ol') {
      blocks.push(
        <ol
          key={key}
          className="list-decimal pl-6 space-y-1 my-4"
          dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
        />
      );
    } else if (tagLower === 'pre') {
      blocks.push(
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 dark:border-slate-800"
          dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
        />
      );
    } else if (tagLower === 'table') {
      blocks.push(
        <div
          key={key}
          className="my-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <table
            className="w-full border-collapse text-left text-sm [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold dark:[&_th]:border-slate-800 dark:[&_th]:bg-slate-900 [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-slate-800"
            dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
          />
        </div>
      );
    } else if (tagLower === 'figure') {
      blocks.push(
        <figure
          key={key}
          className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 [&_img]:mx-auto [&_img]:max-h-96 [&_img]:w-auto [&_img]:object-contain [&_figcaption]:mt-2.5 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-600 dark:[&_figcaption]:text-slate-400"
          dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
        />
      );
    } else if (tagLower === 'div') {
      blocks.push(
        <div
          key={key}
          className="my-4 overflow-x-auto rounded-lg border border-indigo-200/70 bg-indigo-50/40 px-4 py-3 text-center font-serif text-base text-slate-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: safeFragment(inner) }}
        />
      );
    } else {
      blocks.push(
        <p
          key={key}
          className={`leading-relaxed text-[17px] mb-4 text-slate-800 dark:text-slate-200${alignClass}`}
        >
          {renderInlineWithKnowledgeLinks(inner, key)}
        </p>
      );
    }
  }

  if (blocks.length === 0) {
    return (
      <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-[17px] space-y-4">
        <p>{renderInlineWithKnowledgeLinks(safeHtml, 'fallback')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-none leading-relaxed text-[17px] space-y-4">
      {blocks}
    </div>
  );
}


