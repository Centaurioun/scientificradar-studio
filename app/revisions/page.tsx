'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { History, RotateCcw } from 'lucide-react';
import { LocalizedDate } from '@/components/datetime/localized-date';

export default function RevisionHistoryPage() {
  const { revisions, articles, restoreArticleRevision } = useStudio();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <AppShell title="Revision History" breadcrumbs={[{ label: 'Revision History' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Manuscript Revision History ({revisions.length} Snapshots)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explicit version snapshots recorded at draft save, review submission, local assistant acceptance, and demo publication. Restoring always creates a new version without destroying history.
          </p>
        </div>

        {notice && (
          <div className="p-3 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200 text-xs text-teal-900 dark:text-teal-200">
            {notice}
          </div>
        )}

        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {revisions.map((rev) => {
            const art = articles.find((a) => a.id === rev.articleId);
            return (
              <div
                key={rev.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <History className="w-3.5 h-3.5 text-[#087f83]" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      v{rev.version}
                    </span>
                    <span>·</span>
                    <span className="uppercase">{rev.source}</span>
                    <span>·</span>
                    <LocalizedDate iso={rev.createdAt} mode="datetime" includeZoneName />
                  </div>
                  <Link
                    href={`/articles/${rev.articleId}/edit`}
                    className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#087f83] block"
                  >
                    {art?.title || rev.snapshot.title}
                  </Link>
                  <div className="text-slate-600 dark:text-slate-400">{rev.summary}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const restored = restoreArticleRevision(rev.id);
                    if (restored) {
                      setNotice(
                        `Restored "${restored.title}" to snapshot v${rev.version} (saved as new version v${restored.version}).`
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Snapshot</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
