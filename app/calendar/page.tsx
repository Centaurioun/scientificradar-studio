'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
} from 'lucide-react';
import { LocalizedDate } from '@/components/datetime/localized-date';
import {
  formatIsoToWallTimeInput,
  getWallPartsInZone,
  interpretWallTime,
} from '@/lib/datetime/parse';
import { formatLocalizedInstant, resolveEffectiveDatePrefs } from '@/lib/datetime/format';
import { canTransitionStatus } from '@/lib/editorial-rules';

export default function PublishingCalendarPage() {
  const { articles, saveArticle, activeRole, isHydrated, dateTimePreferences } = useStudio();
  const effectivePrefs = resolveEffectiveDatePrefs(dateTimePreferences);
  const timeZone = effectivePrefs.timeZone;

  const [selectedArticleId, setSelectedArticleId] = useState(
    articles.find((a) => a.status === 'approved' || a.status === 'scheduled')?.id ||
      articles.find((a) => a.status !== 'published')?.id ||
      articles[0]?.id ||
      ''
  );
  const [scheduleDate, setScheduleDate] = useState('');
  const [dstDisambiguation, setDstDisambiguation] = useState<'earlier' | 'later'>('earlier');
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize wall-time input deterministically after hydration in the user's configured timezone
  useEffect(() => {
    if (!isHydrated) return;
    const timer = window.setTimeout(() => {
      const target = articles.find((a) => a.id === selectedArticleId);
      if (target?.scheduledAt) {
        setScheduleDate(formatIsoToWallTimeInput(target.scheduledAt, timeZone));
        return;
      }
      const tomorrowMs = Date.now() + 24 * 3600 * 1000;
      const parts = getWallPartsInZone(tomorrowMs, timeZone);
      if (parts) {
        const pad = (n: number) => String(n).padStart(2, '0');
        setScheduleDate(`${parts.year}-${pad(parts.month)}-${pad(parts.day)}T10:00`);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isHydrated, selectedArticleId, articles, timeZone]);

  const interpretation = useMemo(() => {
    if (!scheduleDate.trim()) return null;
    return interpretWallTime(scheduleDate, timeZone, dstDisambiguation);
  }, [scheduleDate, timeZone, dstDisambiguation]);

  const handleSchedule = async (e: React.FormEvent) => {
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

    if (target.status !== 'scheduled') {
      const check = canTransitionStatus(target.status, 'scheduled', activeRole);
      if (!check.allowed) {
        setWarning(
          check.reason ||
            'Only approved manuscripts can be scheduled by an Editor or Owner.'
        );
        return;
      }
    } else if (activeRole === 'author' || activeRole === 'reviewer') {
      setWarning('Only Editors or Owners can reschedule articles.');
      return;
    }

    if (!scheduleDate.trim() || !interpretation) {
      setWarning('Please enter a valid target publication date and time.');
      return;
    }

    if (interpretation.kind === 'invalid' || interpretation.kind === 'nonexistent') {
      setWarning(interpretation.message);
      return;
    }

    const scheduledUtcMs = new Date(interpretation.utcIso).getTime();
    if (scheduledUtcMs < Date.now() - 60000) {
      setWarning(
        `Warning: Selected schedule time (${scheduleDate} in ${timeZone}) is in the past. Please choose a future slot.`
      );
      return;
    }

    try {
      await saveArticle({
        ...target,
        status: 'scheduled',
        scheduledAt: interpretation.utcIso,
      });
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'Schedule was not saved.');
      return;
    }

    const formattedLocal = formatLocalizedInstant(interpretation.utcIso, effectivePrefs, {
      mode: 'datetime',
      includeZoneName: true,
    });
    setSuccess(
      `Scheduled "${target.title}" for ${formattedLocal} (UTC: ${interpretation.utcIso}).`
    );
  };

  return (
    <AppShell
      title="Publishing Calendar"
      breadcrumbs={[{ label: 'Publishing Calendar' }]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Editorial Publishing Calendar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage scheduled publication slots in your configured editorial timezone. Past dates
              and DST spring-forward gaps are rejected; already published articles are locked.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111c22] dark:text-slate-200"
          >
            <Globe className="h-3.5 w-3.5 text-[#087f83] dark:text-teal-400" />
            <span>
              Active Zone: <strong className="font-mono">{timeZone}</strong> ({effectivePrefs.locale})
            </span>
          </Link>
        </div>

        {/* Schedule Form */}
        <form
          onSubmit={handleSchedule}
          className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
        >
          <div className="flex flex-wrap items-end gap-3">
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
              <label
                htmlFor="cal-datetime-input"
                className="flex items-center gap-1.5 font-semibold mb-1"
              >
                <span>Target Publication Date &amp; Time</span>
                <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  <Clock className="h-3 w-3" />
                  {timeZone}
                </span>
              </label>
              <input
                id="cal-datetime-input"
                type="datetime-local"
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
          </div>

          {interpretation?.kind === 'ambiguous' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-300 bg-amber-50 p-2.5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <span>{interpretation.message}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDstDisambiguation('earlier')}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                    dstDisambiguation === 'earlier'
                      ? 'bg-amber-800 text-white'
                      : 'bg-white text-amber-900'
                  }`}
                >
                  Earlier Occurrence ({interpretation.earlierUtcIso})
                </button>
                <button
                  type="button"
                  onClick={() => setDstDisambiguation('later')}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                    dstDisambiguation === 'later'
                      ? 'bg-amber-800 text-white'
                      : 'bg-white text-amber-900'
                  }`}
                >
                  Later Occurrence ({interpretation.laterUtcIso})
                </button>
              </div>
            </div>
          )}
        </form>

        {warning && (
          <div
            role="alert"
            className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2"
          >
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
                    <span>
                      Scheduled:{' '}
                      <LocalizedDate iso={art.scheduledAt} mode="datetime" includeZoneName />
                    </span>
                  </span>
                ) : art.publishedAt ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Published (Demo):{' '}
                    <LocalizedDate iso={art.publishedAt} mode="datetime" includeZoneName />
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
