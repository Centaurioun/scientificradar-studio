'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { ArrowLeft, Edit3, ShieldAlert } from 'lucide-react';
import { sanitizeEditorialHtml, trustedMediaSourceSet } from '@/lib/html-security';

export default function PagePreviewRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { pages, media } = useStudio();
  const page = pages.find((p) => p.id === id);

  if (!page) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-lg font-bold">Page Not Found</h1>
        <Link href="/pages" className="text-xs text-[#087f83] underline">
          Return to Pages
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-[#0b1216] text-slate-900 dark:text-slate-100">
      <div className="sticky top-0 z-40 h-14 px-6 bg-slate-900 text-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/pages/${page.id}/edit`}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Page Editor</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
            <ShieldAlert className="w-4 h-4" />
            <span>Noindex — Demo Static Page Preview (Not live on scientificradar.com)</span>
          </span>
        </div>

        <Link
          href={`/pages/${page.id}/edit`}
          className="px-3 py-1.5 rounded bg-[#087f83] text-white font-semibold flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Page</span>
        </Link>
      </div>

      <div className="py-10 px-4">
        <article className="max-w-3xl mx-auto bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-8 sm:p-12 space-y-6">
          <div className="text-xs font-mono uppercase tracking-wider text-[#087f83] dark:text-teal-400">
            ScientificRadar Institutional Page · Template: {page.template}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
          {page.summary && (
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed pb-4 border-b border-slate-200 dark:border-slate-800">
              {page.summary}
            </p>
          )}
          <div
            className="prose prose-slate dark:prose-invert max-w-none leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: sanitizeEditorialHtml(page.bodyHtml, {
                trustedImageSources: trustedMediaSourceSet(media.map((asset) => asset.src)),
              }).html,
            }}
          />
        </article>
      </div>
    </div>
  );
}
