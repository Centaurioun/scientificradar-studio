'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { KnowledgeLink, MediaAsset, ScientificSource } from '@/lib/types';
import { sanitizeEditorialHtml } from '@/lib/html-security';
import { validateAndRenderKatex } from '@/lib/ckeditor/ckeditor5-math/utils';
import { analyzeManuscriptCitations } from '@/lib/citations';
import { ExternalLink, BookOpen, X, AlertTriangle } from 'lucide-react';

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

function decodeHtmlAttr(val: string): string {
  return val
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Renders sanitized article HTML into valid React block elements (<p>, <h2>, <h3>, <blockquote>, <ul>, <ol>, <table>, <figure>, <pre>, <div>)
 * while enriching:
 * - Recognized Smart Knowledge Link terms into interactive hover/keyboard/mobile popovers
 * - Inline and Block LaTeX equations into 2D mathematical typography
 * - Inline citations (<sup data-citation-source-id>) into appearance-ordered links to the bibliography
 * - Scientific figures with truthful rights metadata and missing-media warnings
 */
export function InteractiveArticleBodyRenderer({
  html,
  knowledgeLinks,
  trustedImageSources = new Set<string>(),
  sources = [],
  mediaAssets = [],
}: {
  html: string;
  knowledgeLinks: KnowledgeLink[];
  trustedImageSources?: ReadonlySet<string>;
  sources?: ScientificSource[];
  mediaAssets?: MediaAsset[];
}) {
  const safeHtml = sanitizeEditorialHtml(html, { trustedImageSources }).html;
  const citationAnalysis = analyzeManuscriptCitations(safeHtml, sources);

  const enrichInlineScientificMarkup = (fragment: string): string => {
    const sanitized = sanitizeEditorialHtml(fragment, { trustedImageSources }).html;
    // 1. Transform inline <span data-math-tex="...">...</span> into real KaTeX 2D math HTML
    const withMath = sanitized.replace(
      /<span\b([^>]*?\bdata-math-tex="([^"]+)"[^>]*)>[\s\S]*?<\/span>/gi,
      (_match, attrs, rawTex) => {
        const tex = decodeHtmlAttr(rawTex);
        const rendered = validateAndRenderKatex(tex, false);
        return `<span ${attrs}>${rendered.renderedHtml}</span>`;
      }
    );

    // 2. Transform inline <sup data-citation-source-id="...">...</sup> into appearance-ordered linked citations
    return withMath.replace(
      /<sup\b[^>]*?\bdata-citation-source-id="([^"]+)"[^>]*>([\s\S]*?)<\/sup>/gi,
      (_match, sourceId, fallbackLabel) => {
        const resolved = citationAnalysis.occurrences.find((o) => o.sourceId === sourceId);
        if (!resolved) {
          return `<sup data-citation-source-id="${sourceId}">${fallbackLabel}</sup>`;
        }
        if (resolved.isOrphaned) {
          return `<sup data-citation-source-id="${sourceId}" data-citation-orphaned="true" title="Orphaned citation: source ${sourceId} is not attached to this article" class="inline-block font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1 rounded mx-0.5">[!${resolved.number}]</sup>`;
        }
        const sourceTitle = resolved.source?.title
          ? resolved.source.title.replace(/"/g, '&quot;')
          : sourceId;
        return `<sup data-citation-source-id="${sourceId}" class="inline-block font-mono text-xs font-bold mx-0.5"><a href="#ref-${sourceId}" title="${sourceTitle}" class="text-[#087f83] dark:text-teal-400 hover:underline px-1 py-0.5 rounded bg-teal-50/80 dark:bg-teal-950/50">[${resolved.number}]</a></sup>`;
      }
    );
  };

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
            dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(slice) }}
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
            dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(fullMatch) }}
          />
        );
      }

      lastIndex = matchStart + fullMatch.length;
    }

    if (lastIndex < inlineHtml.length) {
      nodes.push(
        <span
          key={`${keyPrefix}-end-${lastIndex}`}
          dangerouslySetInnerHTML={{
            __html: enrichInlineScientificMarkup(inlineHtml.slice(lastIndex)),
          }}
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

  const getAttrValue = (attrSource: string, attrName: string): string => {
    const regex = new RegExp(`\\b${attrName}="([^"]*)"`, 'i');
    const m = attrSource.match(regex);
    return m ? decodeHtmlAttr(m[1]) : '';
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
          dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(inner) }}
        />
      );
    } else if (tagLower === 'ol') {
      blocks.push(
        <ol
          key={key}
          className="list-decimal pl-6 space-y-1 my-4"
          dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(inner) }}
        />
      );
    } else if (tagLower === 'pre') {
      blocks.push(
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-slate-800 whitespace-pre"
          dangerouslySetInnerHTML={{
            __html: sanitizeEditorialHtml(inner, { trustedImageSources }).html,
          }}
        />
      );
    } else if (tagLower === 'table') {
      blocks.push(
        <div
          key={key}
          className="my-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <table
            className="w-full border-collapse text-left text-sm [&_caption]:caption-top [&_caption]:bg-slate-50 dark:[&_caption]:bg-slate-900/80 [&_caption]:px-3 [&_caption]:py-2 [&_caption]:text-xs [&_caption]:font-semibold [&_caption]:text-slate-600 dark:[&_caption]:text-slate-400 [&_caption]:border-b [&_caption]:border-slate-200 dark:[&_caption]:border-slate-800 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold dark:[&_th]:border-slate-800 dark:[&_th]:bg-slate-900 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-slate-800"
            dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(inner) }}
          />
        </div>
      );
    } else if (tagLower === 'figure') {
      const mediaId = getAttrValue(attrStr, 'data-media-id');
      const layout = getAttrValue(attrStr, 'data-figure-layout') || 'locked';
      const matchedAsset = mediaId ? mediaAssets.find((m) => m.id === mediaId) : undefined;
      const imgMatch = inner.match(/<img\b([^>]*)>/i);
      const imgAttrs = imgMatch ? imgMatch[1] : '';
      const imgSrc = getAttrValue(imgAttrs, 'src') || matchedAsset?.src || '';
      const imgAlt = getAttrValue(imgAttrs, 'alt') || matchedAsset?.altText || 'Scientific figure';
      const captionMatch = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
      const captionHtml = captionMatch ? captionMatch[1] : '';

      const credit =
        matchedAsset?.credit?.trim() || getAttrValue(attrStr, 'data-figure-credit').trim();
      const licence =
        matchedAsset?.licence?.trim() || getAttrValue(attrStr, 'data-figure-licence').trim();
      const sourceUrl =
        matchedAsset?.sourceUrl?.trim() || getAttrValue(attrStr, 'data-figure-source-url').trim();

      const isMissingAsset = !imgSrc || (Boolean(mediaId) && mediaAssets.length > 0 && !matchedAsset && !imgAttrs.includes('src='));

      blocks.push(
        <figure
          key={key}
          data-media-id={mediaId || undefined}
          data-figure-layout={layout}
          className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
        >
          {isMissingAsset ? (
            <div
              role="alert"
              data-testid="missing-figure-asset-warning"
              className="p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Referenced figure asset unavailable:</strong> Media asset{' '}
                <code className="font-mono">{mediaId || 'unknown'}</code> was removed from the
                Media Library or its image source is missing. Re-select a valid figure in the
                editor before publishing.
              </span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imgSrc}
              alt={imgAlt}
              referrerPolicy="no-referrer"
              className={`mx-auto max-h-96 ${
                layout === 'locked' ? 'w-auto object-contain' : 'w-full object-cover'
              }`}
            />
          )}
          {captionHtml && (
            <figcaption
              className="mt-2.5 text-center text-xs text-slate-600 dark:text-slate-400"
              dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(captionHtml) }}
            />
          )}
          {(credit || licence || sourceUrl) && (
            <div className="mt-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-2">
              {credit && <span>Credit: {credit}</span>}
              {licence && <span>Licence: {licence}</span>}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#087f83] dark:text-teal-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Source</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}
        </figure>
      );
    } else if (tagLower === 'div') {
      const mathTex = getAttrValue(attrStr, 'data-math-tex');
      if (mathTex) {
        const rendered = validateAndRenderKatex(mathTex, true);
        blocks.push(
          <div
            key={key}
            data-math-tex={mathTex}
            data-math-display="block"
            className="my-5 overflow-x-auto rounded-lg border border-teal-200/80 bg-teal-50/40 px-4 py-3.5 text-center font-serif text-base text-slate-900 dark:border-teal-900/50 dark:bg-teal-950/25 dark:text-slate-100"
            dangerouslySetInnerHTML={{
              __html: rendered.renderedHtml,
            }}
          />
        );
      } else {
        blocks.push(
          <div
            key={key}
            className="my-4 overflow-x-auto rounded-lg border border-indigo-200/70 bg-indigo-50/40 px-4 py-3 text-center font-serif text-base text-slate-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: enrichInlineScientificMarkup(inner) }}
          />
        );
      }
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



