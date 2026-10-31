'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { getMediaDisplayPolicy } from '@/lib/editorial-rules';
import { InteractiveArticleBodyRenderer } from '@/components/knowledge/knowledge-link-popover';
import {
  ArrowLeft,
  Edit3,
  Monitor,
  Smartphone,
  ShieldAlert,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export function ArticlePreviewView({
  articleId,
  standalonePublicPreview = false,
}: {
  articleId: string;
  standalonePublicPreview?: boolean;
}) {
  const { articles, categories, tags, authors, media, sources, knowledgeLinks, series } =
    useStudio();

  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  const article = articles.find((a) => a.id === articleId);
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
  const mediaPolicy = featuredMedia ? getMediaDisplayPolicy(featuredMedia) : null;
  const articleTags = tags.filter((t) => article.tagIds.includes(t.id));
  const articleSources = sources.filter((s) => article.sourceIds.includes(s.id));
  const articleSeries = series.find((s) => s.id === article.seriesId);

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
              Updated {new Date(article.updatedAt).toLocaleDateString()}
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
                  Credit: {featuredMedia.credit || 'ScientificRadar'} · Licence:{' '}
                  {featuredMedia.licence || 'CC BY 4.0'} · Layout: {featuredMedia.layout}
                </div>
              </figcaption>
            </figure>
          )}

          {/* Interactive Body with H2/H3 and Wikipedia/Internal Smart Knowledge Link Popovers */}
          <InteractiveArticleBodyRenderer
            html={article.bodyHtml}
            knowledgeLinks={knowledgeLinks}
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

          {/* Primary Scientific Sources & References Section */}
          <section
            aria-label="Primary Scientific References"
            className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                References &amp; Primary Sources ({articleSources.length})
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                External verification not run (P0 offline demo)
              </span>
            </div>

            {articleSources.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No primary sources linked yet. Attach peer-reviewed DOIs in the editor before final sign-off.
              </p>
            ) : (
              <ol className="list-decimal pl-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                {articleSources.map((src) => (
                  <li key={src.id} className="space-y-0.5">
                    <div>
                      <span className="font-semibold">{src.authors}</span> ({src.year}).{' '}
                      {src.title}. <em>{src.journal}</em>.
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {src.doi && <span className="font-mono">DOI: {src.doi}</span>}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#087f83] dark:text-teal-400 hover:underline font-medium"
                      >
                        <span>View Primary Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}
