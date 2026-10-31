'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { ArticleStatus } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { CheckCircle2, RotateCcw, Eye, Edit3, AlertCircle } from 'lucide-react';

export default function ReviewQueuePage() {
  const { articles, authors, activeRole, transitionArticleStatus } = useStudio();
  const [notesByArticle, setNotesByArticle] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const reviewItems = articles.filter(
    (a) =>
      a.status === 'in_review' ||
      a.status === 'revision_requested' ||
      a.status === 'approved' ||
      a.status === 'draft'
  );

  const handleAction = (articleId: string, nextStatus: ArticleStatus) => {
    const note = notesByArticle[articleId] || '';
    const res = transitionArticleStatus(articleId, nextStatus, note);
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error || 'Role permission denied' });
      return;
    }
    setNotesByArticle((prev) => ({ ...prev, [articleId]: '' }));
    setFeedback({
      type: 'ok',
      text: `Transitioned manuscript to ${nextStatus.toUpperCase()} as ${activeRole.toUpperCase()} (Demo).`,
    });
  };

  return (
    <AppShell title="Review Queue" breadcrumbs={[{ label: 'Review Queue' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Editorial Review &amp; Verification Queue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Demo Role: <strong className="uppercase">{activeRole}</strong> · Use the topbar Demo Role Switcher to test Owner, Editor, Reviewer, and Author permissions.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`p-3 rounded-md border text-xs flex items-center justify-between ${
              feedback.type === 'ok'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-4">
          {reviewItems.map((art) => {
            const author = authors.find((a) => a.id === art.authorId);
            return (
              <div
                key={art.id}
                className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span className="uppercase font-bold text-[#087f83] dark:text-teal-400">
                        {art.status.replace('_', ' ')}
                      </span>
                      <span>·</span>
                      <span>v{art.version}</span>
                      <span>·</span>
                      <span>Author: {author?.displayName || 'Staff'}</span>
                      <span>·</span>
                      <span>Sources linked: {art.sourceIds.length}</span>
                    </div>
                    <Link
                      href={`/articles/${art.id}/edit`}
                      className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#087f83] block"
                    >
                      {art.title}
                    </Link>
                    <p className="text-slate-600 dark:text-slate-400">{art.summary}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/articles/${art.id}/preview`}
                      className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>
                    <Link
                      href={`/articles/${art.id}/edit`}
                      className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Open Editor</span>
                    </Link>
                  </div>
                </div>

                {/* Existing Review Notes */}
                {art.reviewNotes && art.reviewNotes.length > 0 && (
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Editorial Review Notes:
                    </div>
                    {art.reviewNotes.map((rn) => (
                      <div key={rn.id} className="text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-200">
                          {rn.authorName}:
                        </strong>{' '}
                        {rn.note}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviewer Decision Input & Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={notesByArticle[art.id] || ''}
                    onChange={(e) =>
                      setNotesByArticle((prev) => ({ ...prev, [art.id]: e.target.value }))
                    }
                    placeholder="Add editorial sign-off note or revision request details..."
                    aria-label={`Review note for ${art.title}`}
                    className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAction(art.id, 'approved')}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(art.id, 'revision_requested')}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Request Revision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(art.id, 'draft')}
                      className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return to Draft</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
