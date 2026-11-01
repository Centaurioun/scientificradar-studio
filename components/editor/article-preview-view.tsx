'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { getMediaDisplayPolicy } from '@/lib/editorial-rules';
import { InteractiveArticleBodyRenderer } from '@/components/knowledge/knowledge-link-popover';
import { trustedMediaSourceSet } from '@/lib/html-security';
import { analyzeManuscriptCitations, formatVancouverReference } from '@/lib/citations';
import {
  ArrowLeft,
  Edit3,
  Monitor,
  Smartphone,
  ShieldAlert,
  ExternalLink,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

import { Article } from '@/lib/types';
import { LocalizedDate } from '@/components/datetime/localized-date';

export function ArticlePreviewView({
  articleId,
  article: directArticle,
  standalonePublicPreview = false,
}: {
  articleId?: string;
  article?: Article;
  standalonePublicPreview?: boolean;
}) {
  const { articles, categories, tags, authors, media, sources, knowledgeLinks, series } =
    useStudio();

  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  const article = directArticle || articles.find((a) => a.id === articleId);
  if (!article) {
    return (
      <div className="p-8 text-center space-y-3">
        <h1 className="text-lg font-bold">Article Draft Not Found</h1>
        <Link href="/articles" className="text-xs text-[#087f83] underline">
          Return to Articles List
        </Link>
      </div>
    );
  }

  const primaryCat = categories.find((c) => c.id === article.primaryCategoryId);
  const author = authors.find((a) => a.id === article.authorId);
  const featuredMedia = media.find((m) => m.id === article.featuredMediaId);
  const isFeaturedMediaMissing = Boolean(article.featuredMediaId) && !featuredMedia;
  const mediaPolicy = featuredMedia ? getMediaDisplayPolicy(featuredMedia) : null;
  const articleTags = tags.filter((t) => article.tagIds.includes(t.id));
  const articleSources = sources.filter((s) => article.sourceIds.includes(s.id));
  const articleSeries = series.find((s) => s.id === article.seriesId);
  const citationAnalysis = analyzeManuscriptCitations(article.bodyHtml, articleSources);

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-[#0b1216] text-slate-900 dark:text-slate-100">
      {/* Sticky Preview Guard Bar (AT-07: Noindex — demo preview guard present) */}
      <div className="sticky top-0 z-40 h-14 px-4 lg:px-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={standalonePublicPreview ? '/articles' : `/articles/${article.id}/edit`}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-[11px] truncate">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Noindex — Demo Preview Only (Not live on scientificradar.com · v{article.version})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop / Mobile Viewport Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                viewportMode === 'desktop'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                viewportMode === 'mobile'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile (390px)</span>
            </button>
          </div>

          <Link
            href={`/articles/${article.id}/edit`}
            className="px-3 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Manuscript</span>
          </Link>
        </div>
      </div>

      {/* Rendered Article Container */}
      <div className="py-8 px-4">
        <article
          className={`mx-auto bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm transition-all ${
            viewportMode === 'mobile' ? 'max-w-[390px] p-5' : 'max-w-3xl p-8 sm:p-12'
          }`}
        >
          {/* Series Banner if part of a collection */}
          {articleSeries && (
            <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#087f83] dark:text-teal-400" />
              <span>Series:</span>
              <strong className="text-slate-800 dark:text-slate-200">{articleSeries.title}</strong>
            </div>
          )}

          {/* Clean Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-semibold uppercase tracking-wider text-[#087f83] dark:text-teal-400">
              {primaryCat?.name || 'Science'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Locale: {article.locale.toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Updated{' '}
              <LocalizedDate
                iso={article.publishedAt || article.updatedAt}
                mode="date"
                useReaderLocale
              />
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono uppercase">{article.status}</span>
          </div>

          {/* THE ONE AND ONLY H1 ON THE PAGE (Spec §6, AT-05) */}
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight mb-4">
            {article.title}
          </h1>

          {/* Standfirst / Summary Dek */}
          {article.summary && (
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {article.summary}
            </p>
          )}

          {/* Author Byline */}
          {author && (
            <div className="py-3.5 mb-6 border-y border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  By {author.displayName}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {author.affiliation} {author.orcid ? `· ORCID: ${author.orcid}` : ''}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                Hover or focus underlined terms for concept cards
              </div>
            </div>
          )}

          {/* Featured Scientific Figure / Media */}
          {isFeaturedMediaMissing && (
            <div
              role="alert"
              data-testid="missing-featured-media-warning"
              className="mb-8 p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Featured media asset missing:</strong> Asset{' '}
                <code className="font-mono">{article.featuredMediaId}</code> was deleted from the
                Media Library. Select a replacement featured image in the editor before publishing.
              </span>
            </div>
          )}

          {featuredMedia && mediaPolicy && (
            <figure className="mb-8 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredMedia.src}
                alt={featuredMedia.altText || featuredMedia.title}
                width={featuredMedia.width}
                height={featuredMedia.height}
                referrerPolicy="no-referrer"
                className={`w-full max-h-[420px] ${
                  mediaPolicy.objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'
                }`}
              />
              <figcaption className="p-3.5 bg-slate-50 dark:bg-[#15222a] border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>{featuredMedia.caption || featuredMedia.title}</div>
                <div className="text-[11px] text-slate-400">
                  Credit: {featuredMedia.credit?.trim() || 'Unverified / Not specified'} · Licence:{' '}
                  {featuredMedia.licence?.trim() || 'Unverified / Not specified'} · Layout:{' '}
                  {featuredMedia.layout}
                </div>
              </figcaption>
            </figure>
          )}

          {/* Interactive Body with H2/H3, 2D Equations, Appearance-Ordered Citations, and Smart Knowledge Link Popovers */}
          <InteractiveArticleBodyRenderer
            html={article.bodyHtml}
            knowledgeLinks={knowledgeLinks}
            trustedImageSources={trustedMediaSourceSet(media.map((asset) => asset.src))}
            sources={articleSources}
            mediaAssets={media}
          />

          {/* Taxonomy Tags Footer */}
          {articleTags.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Topics:</span>
              {articleTags.map((t, idx) => (
                <React.Fragment key={t.id}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span>{t.name}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Primary Scientific Sources & Vancouver Bibliography Section (SRS-SCI-001/002) */}
          <section
            aria-label="Primary Scientific References"
            className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                References &amp; Primary Sources ({articleSources.length})
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Vancouver numbered by manuscript citation order · P0 local repository
              </span>
            </div>

            {citationAnalysis.orphanedSourceIds.length > 0 && (
              <div
                role="alert"
                data-testid="preview-orphaned-citation-alert"
                className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Orphaned inline citation(s):</strong>{' '}
                  {citationAnalysis.orphanedSourceIds.map((id) => `"${id}"`).join(', ')} is cited in
                  the body text but is missing from this article&apos;s attached sources.
                </span>
              </div>
            )}

            {articleSources.length === 0 && citationAnalysis.orderedCitations.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No primary sources linked yet. Attach peer-reviewed DOIs in the editor before final sign-off.
              </p>
            ) : (
              <div className="space-y-4">
                {citationAnalysis.orderedCitations.length > 0 && (
                  <ol
                    data-testid="vancouver-bibliography-list"
                    className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    {citationAnalysis.orderedCitations.map((entry) => {
                      const src = entry.source;
                      if (!src) {
                        return (
                          <li
                            key={entry.sourceId}
                            id={`ref-${entry.sourceId}`}
                            className="p-2 rounded border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 flex items-start gap-2"
                          >
                            <span className="font-mono font-bold">[!{entry.number}]</span>
                            <span>
                              Orphaned reference ID <code className="font-mono">{entry.sourceId}</code>{' '}
                              (cited {entry.occurrenceCount}× in manuscript, source not attached).
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={src.id}
                          id={`ref-${src.id}`}
                          className="flex items-start gap-2.5 leading-relaxed"
                        >
                          <span className="font-mono font-bold text-[#087f83] dark:text-teal-400 shrink-0">
                            [{entry.number}]
                          </span>
                          <div className="space-y-0.5 flex-1">
                            <div data-testid={`vancouver-ref-${entry.number}`}>
                              {formatVancouverReference(src)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                              <span>Cited {entry.occurrenceCount}× in text</span>
                              {src.doi && <span className="font-mono">DOI: {src.doi}</span>}
                              {src.url && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#087f83] dark:text-teal-400 hover:underline font-medium"
                                >
                                  <span>View Primary Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {citationAnalysis.uncitedAttachedSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {citationAnalysis.orderedCitations.length > 0 && (
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Additional Attached Primary Sources (Not Cited Inline)
                      </div>
                    )}
                    <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {citationAnalysis.uncitedAttachedSources.map((src) => (
                        <li key={src.id} id={`ref-${src.id}`} className="space-y-0.5">
                          <div>{formatVancouverReference(src)}</div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            {src.doi && <span className="font-mono">DOI: {src.doi}</span>}
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#087f83] dark:text-teal-400 hover:underline font-medium"
                              >
                                <span>View Primary Source</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}

