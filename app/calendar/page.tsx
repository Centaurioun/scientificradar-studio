'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { formatUtcDate, formatUtcDateTime, parseUtcDateTimeInput } from '@/lib/date-display';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PublishingCalendarPage() {
  const { articles, saveArticle } = useStudio();
  const [selectedArticleId, setSelectedArticleId] = useState(
    articles.find((a) => a.status !== 'published')?.id || articles[0]?.id || ''
  );
  const [scheduleDate, setScheduleDate] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setWarning(null);
    setSuccess(null);

    const target = articles.find((a) => a.id === selectedArticleId);
    if (!target) return;

    if (target.status === 'published') {
      setWarning(
        'Already published articles cannot be silently moved to a new publication date (Spec §14).'
      );
      return;
    }

    const parsedDate = parseUtcDateTimeInput(scheduleDate);
    if (!parsedDate) {
      setWarning('Choose a valid UTC date and time.');
      return;
    }
    if (parsedDate.getTime() < Date.now() - 60000) {
      setWarning(
        'Warning: Selected schedule date is in the past. Please choose an upcoming publication slot.'
      );
      return;
    }

    saveArticle({
      ...target,
      status: 'scheduled',
      scheduledAt: parsedDate.toISOString(),
    });
    setSuccess(`Scheduled "${target.title}" for ${formatUtcDateTime(parsedDate.toISOString())} (Demo calendar).`);
  };

  return (
    <AppShell title="Publishing Calendar" breadcrumbs={[{ label: 'Publishing Calendar' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Editorial Publishing Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage scheduled publication slots. Past dates trigger a warning, and already published articles are locked against accidental date changes.
          </p>
        </div>

        {/* Schedule Form */}
        <form
          onSubmit={handleSchedule}
          className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="cal-article-select" className="block font-semibold mb-1">
              Select Manuscript to Schedule
            </label>
            <select
              id="cal-article-select"
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.status.toUpperCase()}] {a.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cal-datetime-input" className="block font-semibold mb-1">
              Target Publication Date &amp; Time (UTC)
            </label>
            <input
              id="cal-datetime-input"
              type="datetime-local"
              required
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold"
          >
            Assign Publication Slot
          </button>
        </form>

        {warning && (
          <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Calendar Schedule List */}
        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {articles.map((art) => (
            <div
              key={art.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <Link
                  href={`/articles/${art.id}/edit`}
                  className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#087f83]"
                >
                  {art.title}
                </Link>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Status: {art.status.toUpperCase()} · Locale: {art.locale.toUpperCase()}
                </div>
              </div>

              <div className="font-mono text-right">
                {art.scheduledAt ? (
                  <span className="text-[#087f83] dark:text-teal-400 font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Scheduled: {formatUtcDateTime(art.scheduledAt)}</span>
                  </span>
                ) : art.publishedAt ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Published (Demo): {formatUtcDate(art.publishedAt)}
                  </span>
                ) : (
                  <span className="text-slate-400">Unscheduled ({art.status})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
