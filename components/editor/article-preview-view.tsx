'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Edit3,
  Monitor,
  ShieldAlert,
  Smartphone,
  Tablet,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Article } from '@/lib/types';
import {
  adaptSnapshotV1ToPublicArticle,
  serializeStudioArticleToSnapshotV1,
} from '@/lib/publishing/web-contract-v1';
import { ReadingMeasureOption } from '@/lib/design/web-tokens';
import { ScientificRadarWebArticlePreview } from './web-article-reader-preview';

export function ArticlePreviewView({
  articleId,
  article: directArticle,
  standalonePublicPreview = false,
}: {
  articleId?: string;
  article?: Article;
  standalonePublicPreview?: boolean;
}) {
  const {
    articles,
    categories,
    tags,
    authors,
    media,
    sources,
    knowledgeLinks,
    series,
  } = useStudio();

  const [viewportMode, setViewportMode] = useState<
    'desktop' | 'tablet' | 'mobile' | 'mobile320'
  >('desktop');
  const [measure, setMeasure] = useState<ReadingMeasureOption>('700');
  const [showContractModal, setShowContractModal] = useState(false);

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

  const featuredMedia = media.find((m) => m.id === article.featuredMediaId);
  const isFeaturedMediaMissing =
    Boolean(article.featuredMediaId) && !featuredMedia;
  const articleSources = sources.filter((s) => article.sourceIds.includes(s.id));
  const articleSeries = series.find((s) => s.id === article.seriesId);

  const serialized = serializeStudioArticleToSnapshotV1({
    article,
    categories,
    tags,
    authors,
    sources,
    media,
    knowledgeLinks,
  });

  const publicArticle = adaptSnapshotV1ToPublicArticle(serialized.snapshot);

  const viewportWidthClass =
    viewportMode === 'mobile320'
      ? 'max-w-[320px] mx-auto border-x border-slate-300 dark:border-slate-700 shadow-lg'
      : viewportMode === 'mobile'
      ? 'max-w-[390px] mx-auto border-x border-slate-300 dark:border-slate-700 shadow-lg'
      : viewportMode === 'tablet'
      ? 'max-w-[768px] mx-auto border-x border-slate-300 dark:border-slate-700 shadow-lg'
      : 'w-full';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF8] text-[#181C21]">
      {/* Sticky Preview Guard Bar (AT-07: Noindex — demo preview guard present) */}
      <div className="sticky top-0 z-40 w-full max-w-full px-3 sm:px-4 lg:px-6 py-2 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full">
          <Link
            href={
              standalonePublicPreview
                ? '/articles'
                : `/articles/${article.id}/edit`
            }
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </Link>
          <span className="text-slate-600 shrink-0">|</span>
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-[11px] truncate min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Noindex — Demo Preview Only (Not live on scientificradar.com · Web
              Contract v{serialized.snapshot.contractVersion} · v{article.version})
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
          {/* Contract v1.0.0 Snapshot Inspector Trigger */}
          <button
            type="button"
            data-testid="open-contract-snapshot-inspector"
            onClick={() => setShowContractModal(true)}
            className={`px-2 py-1 rounded text-[11px] sm:text-xs font-medium inline-flex items-center gap-1 border ${
              serialized.strictStudioValidation.valid
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200 hover:bg-emerald-900/70'
                : 'bg-amber-950/60 border-amber-700 text-amber-200 hover:bg-amber-900/70'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Contract v1.0.0 (
              {serialized.strictStudioValidation.valid
                ? 'Valid'
                : `${serialized.strictStudioValidation.issues.length}`}
              )
            </span>
          </button>

          {/* Desktop / Tablet / Mobile Viewport Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              aria-label="Desktop viewport"
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                viewportMode === 'desktop'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('tablet')}
              aria-label="Tablet 768px viewport"
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                viewportMode === 'tablet'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Tablet (768px)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              aria-label="Mobile 390px viewport"
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                viewportMode === 'mobile'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile (390px)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile320')}
              aria-label="Mobile 320px viewport"
              className={`px-1.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                viewportMode === 'mobile320'
                  ? 'bg-[#087f83] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>320px</span>
            </button>
          </div>

          <Link
            href={`/articles/${article.id}/edit`}
            className="px-2.5 py-1 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center gap-1 text-[11px] sm:text-xs"
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span>Edit Manuscript</span>
          </Link>
        </div>
      </div>

      {/* Pinned ScientificRadar Web Reader Preview Surface */}
      <div className={viewportWidthClass}>
        <ScientificRadarWebArticlePreview
          article={publicArticle}
          authors={serialized.snapshot.authors}
          rawBodyHtml={article.bodyHtml}
          knowledgeLinks={knowledgeLinks}
          studioMediaAssets={media}
          studioSources={articleSources}
          studioCategories={categories}
          studioTags={tags}
          seriesTitle={articleSeries?.title}
          isFeaturedMediaMissing={isFeaturedMediaMissing}
          missingFeaturedMediaId={article.featuredMediaId}
          measure={measure}
          onMeasureChange={setMeasure}
        />
      </div>

      {/* Contract v1.0.0 Snapshot Inspector Modal */}
      {showContractModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PublishedSnapshotRecordV1 Contract Inspector"
          data-testid="contract-snapshot-modal"
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 font-sans"
        >
          <div className="bg-white dark:bg-[#111c22] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold">
                  Studio → Web Publication Contract Snapshot (v
                  {serialized.snapshot.contractVersion})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revision ID:{' '}
                  <code className="font-mono">
                    {serialized.snapshot.revisionId}
                  </code>{' '}
                  · Mapped Web Status:{' '}
                  <code className="font-mono uppercase">
                    {serialized.snapshot.status}
                  </code>{' '}
                  · Public Release Authorized:{' '}
                  <code className="font-mono">
                    {String(serialized.publicReleaseAuthorized)}
                  </code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                aria-label="Close contract inspector"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {serialized.strictStudioValidation.valid ? (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Snapshot passes both Web Contract v1.0.0 schema validation and
                    Studio strict pre-publish producer checks. (Note: Remains{' '}
                    <code className="font-mono">
                      status=&quot;{serialized.snapshot.status}&quot;
                    </code>{' '}
                    and <code className="font-mono">noindex=true</code> in isolated
                    local demo mode until server publish receipt is issued.)
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Studio Strict Pre-Publish Contract Findings (
                      {serialized.strictStudioValidation.issues.length})
                    </span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {serialized.strictStudioValidation.issues.map((issue, i) => (
                      <li key={`${issue.code}-${i}`}>
                        <code className="font-mono font-semibold">
                          [{issue.code}]
                        </code>{' '}
                        <span className="font-mono text-slate-600">
                          ({issue.field})
                        </span>
                        : {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Serialized PublishedSnapshotRecordV1 JSON Payload
                </div>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  {JSON.stringify(serialized.snapshot, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
