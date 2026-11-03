'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import {
  READING_MEASURE_PRESETS,
  ReadingMeasureOption,
} from '@/lib/design/web-tokens';
import {
  ArticleHeadingOutlineItem,
  PUBLICATION_CONTRACT_VERSION,
  PublicArticle,
  PublicAuthor,
  PublicMedia,
  PublicSource,
  deriveMediaRightsVerified,
  renderScientificMath,
  resolveArticleHeadings,
  sanitizeCanonicalBodyHtml,
  slugifyHeadingText,
  stripHtmlTags,
} from '@/lib/publishing/web-contract-v1';
import {
  Category,
  KnowledgeLink,
  MediaAsset,
  ScientificSource,
  Tag,
} from '@/lib/types';
import { KnowledgeLinkPopover } from '@/components/knowledge/knowledge-link-popover';
import { analyzeManuscriptCitations, formatVancouverReference } from '@/lib/citations';

function formatEditorialDate(iso: string, locale: 'en' | 'tr'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

const EDITORIAL_TYPE_LABELS: Record<
  PublicArticle['editorialType'],
  { en: string; tr: string }
> = {
  news: { en: 'Science News', tr: 'Bilim Haberi' },
  feature: { en: 'In-Depth Feature', tr: 'Derinlemesine Dosya' },
  explainer: { en: 'Scientific Explainer', tr: 'Bilimsel Açıklayıcı' },
  'research-digest': { en: 'Research Digest', tr: 'Araştırma Özeti' },
};

export function WebScientificFigure({
  media,
  layout = 'column',
  figureNumber,
  priority = false,
}: {
  media: PublicMedia;
  layout?: 'column' | 'wide';
  figureNumber?: string;
  priority?: boolean;
}) {
  const widthClass =
    layout === 'wide'
      ? 'max-w-[var(--sr-figure-max)]'
      : 'max-w-[var(--sr-reading-max)]';

  return (
    <figure
      data-media-id={media.id}
      data-layout={layout}
      className={`my-8 mx-auto ${widthClass}`}
    >
      <div className="overflow-hidden rounded-sm border border-[var(--sr-rule)] bg-[#102028]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-auto block"
        />
      </div>
      <figcaption className="mt-3 font-sans text-xs leading-relaxed text-[var(--sr-muted)] border-l-2 border-[var(--sr-accent)] pl-3">
        {figureNumber && (
          <strong className="text-[var(--sr-ink)] mr-1.5">
            Figure {figureNumber}.
          </strong>
        )}
        <span className="text-[var(--sr-ink-secondary)] font-medium">
          {media.caption}
        </span>{' '}
        <span className="block mt-1 text-[11px] uppercase tracking-wider text-[var(--sr-muted)]">
          Credit: {media.credit || 'Unverified / Not specified'} · License:{' '}
          {media.license || 'Unverified / Not specified'}
        </span>
      </figcaption>
    </figure>
  );
}

export function WebArticleHeader({
  article,
  authors,
  categoryName,
  subcategoryNames = [],
  seriesTitle,
  isFeaturedMediaMissing = false,
  missingFeaturedMediaId,
}: {
  article: PublicArticle;
  authors: PublicAuthor[];
  categoryName: string;
  subcategoryNames?: string[];
  seriesTitle?: string;
  isFeaturedMediaMissing?: boolean;
  missingFeaturedMediaId?: string;
}) {
  const heroMedia = article.hero;
  const typeLabel =
    EDITORIAL_TYPE_LABELS[article.editorialType]?.[article.locale] ||
    EDITORIAL_TYPE_LABELS['research-digest'][article.locale];

  return (
    <header className="pt-8 pb-6 border-b border-[var(--sr-rule)]">
      <div className="site-container">
        <div className="max-w-[var(--sr-heading-max)] mx-auto">
          {seriesTitle && (
            <div className="mb-3 pb-2.5 border-b border-[var(--sr-rule-subtle)] font-sans text-xs text-[var(--sr-muted)] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[var(--sr-accent)]" />
              <span>Series:</span>
              <strong className="text-[var(--sr-ink)]">{seriesTitle}</strong>
            </div>
          )}

          {/* Category + Editorial Type Kicker */}
          <div className="flex flex-wrap items-center gap-2 font-sans text-xs uppercase tracking-wider text-[var(--sr-muted)] mb-3">
            <span className="font-semibold text-[var(--sr-accent)]">
              {categoryName}
            </span>
            {subcategoryNames.length > 0 && (
              <>
                <span aria-hidden="true">/</span>
                <span>{subcategoryNames.join(', ')}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{typeLabel}</span>
          </div>

          {/* Single semantic H1 per page */}
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[var(--sr-ink)] leading-[1.16] mb-4">
            {article.title}
          </h1>

          {/* Dek / Standfirst */}
          {article.dek && (
            <p className="font-sans text-lg sm:text-xl text-[var(--sr-ink-secondary)] leading-relaxed mb-6 max-w-3xl">
              {article.dek}
            </p>
          )}

          {/* Byline & Timestamps */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--sr-rule)] font-sans text-xs text-[var(--sr-muted)]">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[var(--sr-ink)] font-semibold">
                {authors.map((a) => a.name).join(', ')}
              </span>
              {authors[0]?.credentialsNote && (
                <>
                  <span aria-hidden="true">—</span>
                  <span>{authors[0].credentialsNote}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 tabular-nums">
              <time dateTime={article.publishedAt}>
                Published {formatEditorialDate(article.publishedAt, article.locale)}
              </time>
              {article.updatedAt && article.updatedAt !== article.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.updatedAt}>
                    Updated {formatEditorialDate(article.updatedAt, article.locale)}
                  </time>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{article.readingTimeMinutes} min read</span>
            </div>
          </div>
        </div>

        {/* Missing Featured Media Alert (Studio Safety Check) */}
        {isFeaturedMediaMissing && (
          <div
            role="alert"
            data-testid="missing-featured-media-warning"
            className="mt-6 max-w-[var(--sr-heading-max)] mx-auto p-4 rounded-sm border border-amber-300 bg-amber-50 text-amber-900 font-sans text-xs flex items-center gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Featured media asset missing:</strong> Asset{' '}
              <code className="font-mono">{missingFeaturedMediaId}</code> was deleted
              from the Media Library. Select a replacement featured image in the
              editor before publishing.
            </span>
          </div>
        )}

        {/* Lead Scientific Figure */}
        {heroMedia && (
          <div className="mt-6">
            <WebScientificFigure media={heroMedia} layout="wide" priority />
          </div>
        )}
      </div>
    </header>
  );
}

function ResponsiveArticleToc({
  headings,
  sourcesCount,
}: {
  headings: ArticleHeadingOutlineItem[];
  sourcesCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Article sections"
      data-testid="responsive-toc"
      className="xl:hidden mb-8 rounded-sm border border-[var(--sr-rule)] bg-[var(--sr-surface)] font-sans"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        data-testid="responsive-toc-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sr-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sr-accent)]"
      >
        <span>In This Article ({headings.length} sections)</span>
        <span aria-hidden="true" className="text-[var(--sr-accent)] font-mono">
          {isOpen ? '− Hide' : '+ Contents'}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          data-testid="responsive-toc-panel"
          className="px-4 pb-4 pt-2 border-t border-[var(--sr-rule)]"
        >
          <ol className="space-y-2 text-xs text-[var(--sr-ink-secondary)]">
            {headings.map((h) => (
              <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setIsOpen(false)}
                  className="hover:text-[var(--sr-accent)] transition-colors block py-0.5 leading-snug"
                >
                  {h.text}
                </a>
              </li>
            ))}
            {sourcesCount > 0 && (
              <li className="pt-2 border-t border-[var(--sr-rule)]">
                <a
                  href="#references-heading"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-[var(--sr-accent)] transition-colors block py-0.5 font-medium"
                >
                  Sources &amp; References ({sourcesCount})
                </a>
              </li>
            )}
          </ol>
        </div>
      )}
    </nav>
  );
}

export function WebCitationList({
  sources,
  studioSources = [],
  rawBodyHtml = '',
}: {
  sources: PublicSource[];
  studioSources?: ScientificSource[];
  rawBodyHtml?: string;
}) {
  const citationAnalysis = analyzeManuscriptCitations(rawBodyHtml, studioSources);
  const hasOrphans = citationAnalysis.orphanedSourceIds.length > 0;

  if (sources.length === 0 && !hasOrphans) return null;

  return (
    <section
      aria-labelledby="references-heading"
      className="mt-12 pt-8 border-t border-[var(--sr-rule)] font-sans"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2
          id="references-heading"
          className="text-sm font-semibold uppercase tracking-wider text-[var(--sr-ink)]"
        >
          Sources &amp; Primary References ({sources.length})
        </h2>
        <span className="text-[11px] font-mono text-[var(--sr-muted)]">
          Contract v{PUBLICATION_CONTRACT_VERSION} · Vancouver Citation Order
        </span>
      </div>

      {hasOrphans && (
        <div
          role="alert"
          data-testid="preview-orphaned-citation-alert"
          className="mb-4 p-3 rounded-sm border border-rose-300 bg-rose-50 text-xs text-rose-900 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Orphaned inline citation(s):</strong>{' '}
            {citationAnalysis.orphanedSourceIds.map((id) => `"${id}"`).join(', ')} is
            cited in the body text but is missing from this article&apos;s attached
            sources.
          </span>
        </div>
      )}

      <ol
        data-testid="vancouver-bibliography-list"
        className="space-y-3 text-xs leading-relaxed text-[var(--sr-ink-secondary)]"
      >
        {sources.map((source, index) => {
          const matchedStudioSource = studioSources.find((s) => s.id === source.id);
          const refNumber = index + 1;
          return (
            <li
              key={source.id}
              id={`ref-${source.id}`}
              className="pl-2 border-l-2 border-transparent target:border-[var(--sr-accent)] target:bg-[var(--sr-surface)] py-1 transition-colors"
            >
              <a
                href={`#cite-${source.id}`}
                aria-label={`Jump back to citation ${source.label} in text`}
                className="font-mono font-semibold text-[var(--sr-accent)] hover:underline mr-2"
              >
                [{source.label}]
              </a>
              <span data-testid={`vancouver-ref-${refNumber}`}>
                {matchedStudioSource ? (
                  formatVancouverReference(matchedStudioSource)
                ) : (
                  <>
                    {source.authors && (
                      <span className="text-[var(--sr-ink)] font-medium">
                        {source.authors}{' '}
                      </span>
                    )}
                    {source.year && <span>({source.year}). </span>}
                    <span>{source.title}. </span>
                    {source.publication && (
                      <em className="text-[var(--sr-ink)]">
                        {source.publication}.
                      </em>
                    )}
                  </>
                )}
              </span>
              {source.doi && (
                <>
                  {' '}
                  <a
                    href={source.href || `https://doi.org/${source.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--sr-accent)] hover:underline break-all"
                  >
                    https://doi.org/{source.doi}
                  </a>
                </>
              )}
              {!source.doi && source.href && (
                <>
                  {' '}
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--sr-accent)] hover:underline break-all"
                  >
                    {source.href}
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function WebAuthorProfile({
  authors,
  tagLabels,
}: {
  authors: PublicAuthor[];
  tagLabels: string[];
}) {
  return (
    <footer className="mt-10 pt-8 border-t border-[var(--sr-rule)] font-sans">
      {/* Topics */}
      {tagLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-muted)] mr-1">
            Topics:
          </span>
          {tagLabels.map((tagName, index) => (
            <span key={`${tagName}-${index}`} className="text-xs text-[var(--sr-muted)]">
              <span className="text-[var(--sr-accent)] font-medium">{tagName}</span>
              {index < tagLabels.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Author Bio Box */}
      <div className="space-y-4">
        {authors.map((author) => (
          <div
            key={author.id}
            className="p-5 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-semibold text-[var(--sr-ink)]">
                {author.name}
              </h3>
              <span className="text-xs text-[var(--sr-muted)]">
                {author.role} · {author.credentialsNote}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--sr-ink-secondary)]">
              {author.bio}
            </p>
          </div>
        ))}
      </div>
    </footer>
  );
}

function WebCanonicalBodyWithKnowledgeLinks({
  rawHtml,
  article,
  knowledgeLinks,
  studioMediaAssets,
  studioSources,
}: {
  rawHtml: string;
  article: PublicArticle;
  knowledgeLinks: KnowledgeLink[];
  studioMediaAssets: MediaAsset[];
  studioSources: ScientificSource[];
}) {
  const sanitized = sanitizeCanonicalBodyHtml(rawHtml);
  const citationAnalysis = analyzeManuscriptCitations(rawHtml, studioSources);
  const sourceById = new Map(article.sources.map((s) => [s.id, s]));

  const enrichInlineWebMarkup = (fragment: string): string => {
    const clean = sanitizeCanonicalBodyHtml(fragment);

    // 1. Render inline equations with KaTeX + role="math"
    const withMath = clean.replace(
      /<span\b([^>]*?\bdata-(?:latex|math-tex)="([^"]+)"[^>]*)>[\s\S]*?<\/span>/gi,
      (_full, _attrs: string, encodedLatex: string) => {
        const latex = encodedLatex
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        const rendered = renderScientificMath(latex, false);
        return `<span class="sr-math-inline px-0.5" role="math" aria-label="${latex.replace(
          /"/g,
          '&quot;'
        )}" data-latex="${latex.replace(
          /"/g,
          '&quot;'
        )}" data-math-display="inline">${rendered.html}</span>`;
      }
    );

    // 2. Render inline citations with Web's #cite-... and #ref-... anchors
    return withMath.replace(
      /<sup\b([^>]*?\bdata-citation-(?:source-)?id="([^"]+)"[^>]*)>([\s\S]*?)<\/sup>/gi,
      (_full, _attrs: string, sourceId: string, fallbackInner: string) => {
        const publicSrc = sourceById.get(sourceId);
        const resolved = citationAnalysis.occurrences.find(
          (o) => o.sourceId === sourceId
        );
        if (resolved?.isOrphaned || (!publicSrc && !resolved?.source)) {
          const num = resolved?.number || '?';
          return `<sup data-citation-id="${sourceId}" data-citation-source-id="${sourceId}" data-citation-orphaned="true" title="Orphaned citation: source ${sourceId} is not attached to this article" class="inline-block font-mono text-xs font-bold text-rose-700 bg-rose-100 px-1 rounded mx-0.5">[!${num}]</sup>`;
        }
        const label = publicSrc?.label || String(resolved?.number || 1);
        const title = (
          publicSrc?.title ||
          resolved?.source?.title ||
          sourceId
        ).replace(/"/g, '&quot;');
        if (/<a\b/i.test(fallbackInner)) {
          return `<sup id="cite-${sourceId}" data-citation-id="${sourceId}" data-citation-source-id="${sourceId}" class="font-sans text-xs font-semibold text-[var(--sr-accent)] ml-0.5">${fallbackInner}</sup>`;
        }
        return `<sup id="cite-${sourceId}" data-citation-id="${sourceId}" data-citation-source-id="${sourceId}" class="font-sans text-xs font-semibold text-[var(--sr-accent)] ml-0.5"><a href="#ref-${sourceId}" aria-label="Reference ${label}: ${title}" class="hover:underline">[${label}]</a></sup>`;
      }
    );
  };

  const renderInlineWithKnowledgeLinks = (
    inlineHtml: string,
    keyPrefix: string
  ) => {
    const linkRegex =
      /<a\b[^>]*data-knowledge-term="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
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
            dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(slice) }}
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
            termText={stripHtmlTags(innerText)}
            knowledgeItem={foundKl}
          />
        );
      } else {
        nodes.push(
          <span
            key={`${keyPrefix}-raw-${matchStart}`}
            dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(fullMatch) }}
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
            __html: enrichInlineWebMarkup(inlineHtml.slice(lastIndex)),
          }}
        />
      );
    }

    return nodes;
  };

  const getAttrValue = (attrSource: string, attrName: string): string => {
    const regex = new RegExp(`\\b${attrName}="([^"]*)"`, 'i');
    const m = attrSource.match(regex);
    return m
      ? m[1]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
      : '';
  };

  const usedHeadingIds = new Set<string>();
  const allocateHeadingId = (
    attrStr: string,
    innerHtml: string,
    idx: number
  ) => {
    const explicitId = getAttrValue(attrStr, 'id');
    const plainText = stripHtmlTags(innerHtml);
    let candidate =
      explicitId || `section-${slugifyHeadingText(plainText)}` || `section-${idx}`;
    candidate =
      candidate.replace(/[^A-Za-z0-9_.:-]/g, '') || `section-${idx}`;
    let unique = candidate;
    let suffix = 2;
    while (usedHeadingIds.has(unique)) {
      unique = `${candidate}-${suffix}`;
      suffix += 1;
    }
    usedHeadingIds.add(unique);
    return unique;
  };

  const blockRegex =
    /<(hr)\b[^>]*\/?>|<(p|h2|h3|h4|blockquote|ul|ol|pre|figure|table|div)\b([^>]*)>([\s\S]*?)<\/\2>/gi;
  const elements: React.ReactNode[] = [];
  let blockMatch: RegExpExecArray | null;
  let idx = 0;

  while ((blockMatch = blockRegex.exec(sanitized)) !== null) {
    const [, hrTag, pairedTag, attrStr = '', inner = ''] = blockMatch;
    const key = `web-blk-${idx++}`;

    if (hrTag) {
      elements.push(<hr key={key} className="my-8 border-[var(--sr-rule)]" />);
      continue;
    }

    const tagLower = pairedTag.toLowerCase();

    if (tagLower === 'h2') {
      const headingId = allocateHeadingId(attrStr, inner, idx);
      elements.push(
        <h2 key={key} id={headingId}>
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h2>
      );
    } else if (tagLower === 'h3') {
      const headingId = allocateHeadingId(attrStr, inner, idx);
      elements.push(
        <h3 key={key} id={headingId}>
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h3>
      );
    } else if (tagLower === 'h4') {
      const headingId = allocateHeadingId(attrStr, inner, idx);
      elements.push(
        <h4
          key={key}
          id={headingId}
          className="font-editorial font-bold mt-6 mb-2"
        >
          {renderInlineWithKnowledgeLinks(inner, key)}
        </h4>
      );
    } else if (tagLower === 'blockquote') {
      const cleanQuote = inner.replace(/^<p\b[^>]*>|<\/p>$/gi, '');
      elements.push(
        <blockquote key={key}>
          {renderInlineWithKnowledgeLinks(cleanQuote, key)}
        </blockquote>
      );
    } else if (tagLower === 'ul') {
      elements.push(
        <ul
          key={key}
          dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(inner) }}
        />
      );
    } else if (tagLower === 'ol') {
      elements.push(
        <ol
          key={key}
          dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(inner) }}
        />
      );
    } else if (tagLower === 'pre') {
      elements.push(
        <pre
          key={key}
          dangerouslySetInnerHTML={{ __html: sanitizeCanonicalBodyHtml(inner) }}
        />
      );
    } else if (tagLower === 'table') {
      elements.push(
        <div
          key={key}
          className="my-8 overflow-x-auto rounded-sm border border-[var(--sr-rule)] bg-[var(--sr-paper)]"
        >
          <table
            dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(inner) }}
          />
        </div>
      );
    } else if (tagLower === 'figure') {
      const mediaId = getAttrValue(attrStr, 'data-media-id');
      const layoutAttr = getAttrValue(attrStr, 'data-layout') as
        | 'column'
        | 'wide'
        | '';
      const studioAsset = mediaId
        ? studioMediaAssets.find((m) => m.id === mediaId)
        : undefined;
      const imgMatch = inner.match(/<img\b([^>]*)>/i);
      const imgAttrs = imgMatch ? imgMatch[1] : '';
      const imgSrc =
        getAttrValue(imgAttrs, 'src') || studioAsset?.src || '';

      const isMissingAsset =
        !imgSrc ||
        (Boolean(mediaId) &&
          studioMediaAssets.length > 0 &&
          !studioAsset &&
          !imgAttrs.includes('src='));

      if (isMissingAsset) {
        elements.push(
          <figure
            key={key}
            data-media-id={mediaId || undefined}
            className="my-8 mx-auto max-w-[var(--sr-reading-max)]"
          >
            <div
              role="alert"
              data-testid="missing-figure-asset-warning"
              className="p-4 rounded-sm border border-amber-300 bg-amber-50 text-amber-900 font-sans text-xs flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Referenced figure asset unavailable:</strong> Media asset{' '}
                <code className="font-mono">{mediaId || 'unknown'}</code> was
                removed from the Media Library or its image source is missing.
                Re-select a valid figure in the editor before publishing.
              </span>
            </div>
          </figure>
        );
      } else {
        const captionMatch = inner.match(
          /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i
        );
        const captionText = stripHtmlTags(captionMatch ? captionMatch[1] : '');
        const fallbackMedia: PublicMedia = {
          id: mediaId || `fig-${idx}`,
          src: imgSrc,
          alt:
            getAttrValue(imgAttrs, 'alt') ||
            studioAsset?.altText ||
            'Scientific figure',
          caption:
            captionText || studioAsset?.caption || studioAsset?.title || '',
          credit: studioAsset?.credit?.trim() || '',
          license: studioAsset?.licence?.trim() || '',
          width: studioAsset?.width || 1200,
          height: studioAsset?.height || 675,
          rightsVerified: studioAsset ? deriveMediaRightsVerified(studioAsset) : false,
        };
        elements.push(
          <WebScientificFigure
            key={key}
            media={fallbackMedia}
            layout={layoutAttr || 'column'}
          />
        );
      }
    } else if (tagLower === 'div') {
      const latex =
        getAttrValue(attrStr, 'data-latex') ||
        getAttrValue(attrStr, 'data-math-tex');
      const calloutTitle = getAttrValue(attrStr, 'data-callout-title');
      if (latex) {
        const rendered = renderScientificMath(latex, true);
        const eqId =
          getAttrValue(attrStr, 'data-equation-id') ||
          getAttrValue(attrStr, 'id');
        elements.push(
          <div
            key={key}
            id={eqId || undefined}
            className="my-6 p-4 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)] overflow-x-auto"
            role="math"
            aria-label={latex}
            data-latex={latex}
            data-math-tex={latex}
            data-math-display="block"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        );
      } else if (calloutTitle) {
        elements.push(
          <aside
            key={key}
            className="my-8 p-5 rounded-sm bg-[var(--sr-surface)] border-l-4 border-[var(--sr-accent)] font-sans"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-accent)] mb-2">
              {calloutTitle}
            </h4>
            <div
              className="text-sm leading-relaxed text-[var(--sr-ink-secondary)]"
              dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(inner) }}
            />
          </aside>
        );
      } else {
        elements.push(
          <div
            key={key}
            dangerouslySetInnerHTML={{ __html: enrichInlineWebMarkup(inner) }}
          />
        );
      }
    } else {
      elements.push(
        <p key={key}>{renderInlineWithKnowledgeLinks(inner, key)}</p>
      );
    }
  }

  if (elements.length === 0) {
    return <p>{renderInlineWithKnowledgeLinks(sanitized, 'fallback')}</p>;
  }

  return <>{elements}</>;
}

export function ScientificRadarWebArticlePreview({
  article,
  authors = [],
  rawBodyHtml = '',
  knowledgeLinks = [],
  studioMediaAssets = [],
  studioSources = [],
  studioCategories = [],
  studioTags = [],
  seriesTitle,
  isFeaturedMediaMissing = false,
  missingFeaturedMediaId,
  measure,
  onMeasureChange,
}: {
  article: PublicArticle;
  authors?: PublicAuthor[];
  rawBodyHtml?: string;
  knowledgeLinks?: KnowledgeLink[];
  studioMediaAssets?: MediaAsset[];
  studioSources?: ScientificSource[];
  studioCategories?: Category[];
  studioTags?: Tag[];
  seriesTitle?: string;
  isFeaturedMediaMissing?: boolean;
  missingFeaturedMediaId?: string;
  measure?: ReadingMeasureOption;
  onMeasureChange?: (next: ReadingMeasureOption) => void;
}) {
  const [internalMeasure, setInternalMeasure] =
    useState<ReadingMeasureOption>('700');
  const activeMeasure = measure ?? internalMeasure;
  const setActiveMeasure = onMeasureChange ?? setInternalMeasure;

  const activePreset = READING_MEASURE_PRESETS[activeMeasure];

  const headings = resolveArticleHeadings({
    bodyHtml: article.bodyHtml || rawBodyHtml,
    blocks: article.blocks,
    sources: article.sources,
  });

  const categoryName =
    studioCategories.find((c) => c.slug === article.categorySlug)?.name ||
    article.categorySlug;

  const subcategoryNames = article.subcategorySlugs.map(
    (slug) => studioCategories.find((c) => c.slug === slug)?.name || slug
  );

  const tagLabels = article.tagSlugs.map(
    (slug) => studioTags.find((t) => t.slug === slug)?.name || slug
  );

  const effectiveAuthors: PublicAuthor[] =
    authors.length > 0
      ? authors
      : [
          {
            id: 'author-editorial-desk',
            name: 'ScientificRadar Editorial Desk',
            role: 'Editorial Desk',
            credentialsNote: 'ScientificRadar',
            bio: 'Editorial science desk at ScientificRadar.',
            isDemoPersona: true,
          },
        ];

  const hasCanonicalBodyHtml =
    typeof (rawBodyHtml || article.bodyHtml) === 'string' &&
    (rawBodyHtml || article.bodyHtml || '').trim().length > 0;

  return (
    <div className="sr-web-preview-scope">
      <article>
        <WebArticleHeader
          article={article}
          authors={effectiveAuthors}
          categoryName={categoryName}
          subcategoryNames={subcategoryNames}
          seriesTitle={seriesTitle}
          isFeaturedMediaMissing={isFeaturedMediaMissing}
          missingFeaturedMediaId={missingFeaturedMediaId}
        />

        <div
          className="site-container py-8 lg:py-12"
          style={
            {
              '--sr-reading-max': activePreset.px,
            } as React.CSSProperties
          }
          data-reading-measure={activePreset.px}
        >
          {/* Reading Measure Comparator Bar (Pinned Web Parity) */}
          <div className="max-w-[var(--sr-heading-max)] mx-auto mb-8 p-3.5 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)] flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--sr-ink)] uppercase tracking-wider">
                Reading Measure:
              </span>
              <span className="text-[var(--sr-muted)] hidden sm:inline">
                {activePreset.note}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              role="group"
              aria-label="Reading measure width"
            >
              {(
                Object.keys(READING_MEASURE_PRESETS) as ReadingMeasureOption[]
              ).map((key) => {
                const isSelected = activeMeasure === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveMeasure(key)}
                    aria-pressed={isSelected}
                    className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-[var(--sr-accent)] text-white'
                        : 'bg-[var(--sr-paper)] text-[var(--sr-ink-secondary)] border border-[var(--sr-rule)] hover:border-[var(--sr-accent)]'
                    }`}
                  >
                    {key}px
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:gap-8 items-start max-w-[var(--sr-page-max)] mx-auto">
            {/* Left Rail: Sticky Table of Contents on Desktop */}
            <aside
              aria-label="Table of contents"
              className="hidden xl:block sticky top-20 font-sans pr-4"
            >
              {headings.length > 0 && (
                <div className="border-l border-[var(--sr-rule)] pl-4 py-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sr-muted)] mb-3">
                    In This Article
                  </p>
                  <ul className="space-y-2 text-xs text-[var(--sr-muted)]">
                    {headings.map((h) => (
                      <li key={h.id} className={h.level === 3 ? 'pl-2.5' : ''}>
                        <a
                          href={`#${h.id}`}
                          className="hover:text-[var(--sr-accent)] transition-colors block leading-snug"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                    {article.sources.length > 0 && (
                      <li className="pt-2 border-t border-[var(--sr-rule-subtle)]">
                        <a
                          href="#references-heading"
                          className="hover:text-[var(--sr-accent)] transition-colors block leading-snug font-medium"
                        >
                          Sources &amp; References ({article.sources.length})
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-6 border-l border-[var(--sr-rule)] pl-4 py-1 text-[11px] text-[var(--sr-muted)] space-y-1">
                <p className="font-semibold uppercase tracking-wider text-[var(--sr-ink-secondary)]">
                  Edition Status
                </p>
                <p>Contract v{PUBLICATION_CONTRACT_VERSION} · Validated</p>
                <p>Locale: {article.locale.toUpperCase()}</p>
              </div>
            </aside>

            {/* Central Reading Column */}
            <div className="min-w-0">
              {/* Mobile / Tablet Disclosure TOC */}
              <ResponsiveArticleToc
                headings={headings}
                sourcesCount={article.sources.length}
              />

              <div
                className="article-prose mx-auto"
                data-testid="article-prose-container"
              >
                {hasCanonicalBodyHtml ? (
                  <WebCanonicalBodyWithKnowledgeLinks
                    rawHtml={rawBodyHtml || article.bodyHtml || ''}
                    article={article}
                    knowledgeLinks={knowledgeLinks}
                    studioMediaAssets={studioMediaAssets}
                    studioSources={studioSources}
                  />
                ) : (
                  article.blocks.map((block) => {
                    switch (block.type) {
                      case 'paragraph':
                        return (
                          <p key={block.id}>
                            {block.text}
                            {block.citations &&
                              block.citations.map((citeId) => {
                                const src = article.sources.find(
                                  (s) => s.id === citeId
                                );
                                if (!src) return null;
                                return (
                                  <sup
                                    key={citeId}
                                    id={`cite-${src.id}`}
                                    className="font-sans text-xs font-semibold text-[var(--sr-accent)] ml-0.5"
                                  >
                                    <a
                                      href="#references-heading"
                                      className="hover:underline"
                                    >
                                      [{src.label}]
                                    </a>
                                  </sup>
                                );
                              })}
                          </p>
                        );

                      case 'heading':
                        return block.level === 2 ? (
                          <h2 key={block.id} id={block.id}>
                            {block.text}
                          </h2>
                        ) : (
                          <h3 key={block.id} id={block.id}>
                            {block.text}
                          </h3>
                        );

                      case 'figure':
                        return (
                          <WebScientificFigure
                            key={block.id}
                            media={block.media}
                            layout={block.layout}
                            figureNumber={block.figureNumber}
                          />
                        );

                      case 'quote':
                        return (
                          <blockquote key={block.id}>
                            <p className="!mb-2">“{block.quote}”</p>
                            {block.attribution && (
                              <footer className="font-sans text-xs not-italic text-[var(--sr-muted)]">
                                — {block.attribution}
                              </footer>
                            )}
                          </blockquote>
                        );

                      case 'key-takeaways':
                        return (
                          <aside
                            key={block.id}
                            className="my-8 p-5 rounded-sm bg-[var(--sr-surface)] border-l-4 border-[var(--sr-accent)] font-sans"
                          >
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-accent)] mb-2">
                              {block.title}
                            </h4>
                            <ul className="list-disc pl-5 text-sm leading-relaxed text-[var(--sr-ink-secondary)] space-y-1">
                              {block.items.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </aside>
                        );

                      case 'math': {
                        const renderedMath = renderScientificMath(
                          block.tex,
                          true
                        );
                        return (
                          <div
                            key={block.id}
                            id={block.id}
                            className="my-8 p-4 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)] overflow-x-auto"
                            role="math"
                            aria-label={block.explanation || block.tex}
                            data-latex={block.tex}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div
                                className="font-math text-base sm:text-lg text-[var(--sr-ink)] py-1 overflow-x-auto"
                                dangerouslySetInnerHTML={{
                                  __html: renderedMath.html,
                                }}
                              />
                              {block.label && (
                                <span className="font-sans text-xs font-mono text-[var(--sr-muted)] shrink-0">
                                  {block.label}
                                </span>
                              )}
                            </div>
                            {block.explanation && (
                              <p className="!mb-0 mt-2 font-sans text-xs text-[var(--sr-muted)]">
                                {block.explanation}
                              </p>
                            )}
                          </div>
                        );
                      }

                      case 'table':
                        return (
                          <div
                            key={block.id}
                            id={block.id}
                            className="my-8 overflow-x-auto rounded-sm border border-[var(--sr-rule)] bg-[var(--sr-paper)]"
                          >
                            <table>
                              <caption className="text-left font-sans text-xs font-semibold text-[var(--sr-ink)] p-3 bg-[var(--sr-surface)] border-b border-[var(--sr-rule)]">
                                {block.table.caption}
                              </caption>
                              <thead>
                                <tr>
                                  {block.table.headers.map((header, hIdx) => (
                                    <th key={hIdx} scope="col">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.table.rows.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx}>{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {block.table.footnote && (
                              <p className="!mb-0 p-3 font-sans text-[11px] text-[var(--sr-muted)] bg-[var(--sr-surface)] border-t border-[var(--sr-rule)]">
                                {block.table.footnote}
                              </p>
                            )}
                          </div>
                        );

                      default:
                        return null;
                    }
                  })
                )}

                <WebCitationList
                  sources={article.sources}
                  studioSources={studioSources}
                  rawBodyHtml={rawBodyHtml || article.bodyHtml || ''}
                />
                <WebAuthorProfile
                  authors={effectiveAuthors}
                  tagLabels={tagLabels}
                />
              </div>
            </div>

            {/* Right Rail: Reserved quiet margin on 3-column desktop */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>
        </div>
      </article>
    </div>
  );
}
