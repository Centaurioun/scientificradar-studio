'use client';

import React from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { formatUtcDateTime } from '@/lib/date-display';
import {
  Plus,
  FileText,
  BookOpen,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Sliders,
  Eye,
  Edit3,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    articles,
    categories,
    authors,
    media,
    sources,
    auditEvents,
    navigation,
  } = useStudio();

  const draftsCount = articles.filter((a) => a.status === 'draft' || a.status === 'idea').length;
  const reviewCount = articles.filter(
    (a) => a.status === 'in_review' || a.status === 'revision_requested'
  ).length;
  const scheduledCount = articles.filter(
    (a) => a.status === 'scheduled' || a.status === 'approved'
  ).length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;

  const recentDrafts = articles
    .filter((a) => a.status === 'draft' || a.status === 'revision_requested' || a.status === 'in_review')
    .slice(0, 5);

  // Build dynamic "Requires Attention" list from actual local repository records (Spec §5)
  const attentionItems: Array<{
    id: string;
    title: string;
    issue: string;
    href: string;
    severity: 'warning' | 'info';
  }> = [];

  for (const art of articles) {
    if (art.sourceIds.length === 0) {
      attentionItems.push({
        id: `att-src-${art.id}`,
        title: art.title,
        issue: 'Missing primary scientific source / DOI link',
        href: `/articles/${art.id}/edit`,
        severity: 'warning',
      });
    }
    if (!art.seo.title || !art.seo.description) {
      attentionItems.push({
        id: `att-seo-${art.id}`,
        title: art.title,
        issue: 'Incomplete SEO title or meta summary',
        href: `/articles/${art.id}/edit`,
        severity: 'info',
      });
    }
    const unresolvedNotes = (art.reviewNotes || []).filter((n) => !n.resolved);
    if (unresolvedNotes.length > 0) {
      attentionItems.push({
        id: `att-rev-${art.id}`,
        title: art.title,
        issue: `Unresolved editorial review note: "${unresolvedNotes[0].note.slice(0, 64)}..."`,
        href: `/articles/${art.id}/edit`,
        severity: 'warning',
      });
    }
  }

  for (const m of media) {
    if (!m.altText || m.altText.trim().length < 10) {
      attentionItems.push({
        id: `att-media-${m.id}`,
        title: m.title,
        issue: `Media figure (${m.filename}) has empty or insufficient alt text`,
        href: `/media`,
        severity: 'warning',
      });
    }
  }

  for (const s of sources) {
    if (s.verificationStatus === 'needs_review' || s.verificationStatus === 'broken_url') {
      attentionItems.push({
        id: `att-doi-${s.id}`,
        title: s.title,
        issue: `Source flagged (${s.verificationStatus}): ${s.notes || 'Check DOI syntax'}`,
        href: `/seo`,
        severity: 'warning',
      });
    }
  }

  const upcomingArticles = articles.filter(
    (a) => a.scheduledAt || a.status === 'scheduled' || a.status === 'approved'
  );

  const widgets = navigation.dashboardWidgets;

  return (
    <AppShell
      title="Editorial Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/pages/new"
            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>New Page</span>
          </Link>
          <Link
            href="/articles/new"
            className="px-3.5 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </Link>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Newsroom Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ScientificRadar Editorial Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Write science. Refine with confidence. Publish with control. · Isolated P0 Demo Store (Live site untouched)
            </p>
          </div>
          <Link
            href="/settings/navigation"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#087f83] dark:hover:text-teal-400"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Sidebar &amp; Widgets</span>
          </Link>
        </div>

        {/* Restrained Editorial Metric Strip (Computed strictly from real demo records, zero fake revenue/traffic) */}
        {widgets.metrics && (
          <section
            aria-label="Editorial Status Metrics"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Link
              href="/articles?filter=drafts"
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] transition-colors"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Drafts
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
                {draftsCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                In authoring or initial outlining
              </div>
            </Link>

            <Link
              href="/review"
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] transition-colors"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Needs Editorial Review
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {reviewCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                In Review or Revision Requested
              </div>
            </Link>

            <Link
              href="/calendar"
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] transition-colors"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Approved &amp; Scheduled
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#087f83] dark:text-teal-400 mt-1">
                {scheduledCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Queued on publishing calendar
              </div>
            </Link>

            <Link
              href="/articles?filter=published"
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] transition-colors"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Published (Local Demo)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {publishedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                EN &amp; TR editions in demo repository
              </div>
            </Link>
          </section>
        )}

        {/* Main Two-Column Editorial Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Continue Editing + Requires Attention */}
          <div className="lg:col-span-7 space-y-6">
            {widgets.continueEditing && (
              <section className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#087f83] dark:text-teal-400" />
                    <span>Continue Editing Manuscripts</span>
                  </h2>
                  <Link
                    href="/articles"
                    className="text-xs font-medium text-[#087f83] dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>All Articles ({articles.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentDrafts.map((art) => {
                    const cat = categories.find((c) => c.id === art.primaryCategoryId);
                    const author = authors.find((a) => a.id === art.authorId);
                    return (
                      <div
                        key={art.id}
                        className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <Link
                            href={`/articles/${art.id}/edit`}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#087f83] dark:hover:text-teal-400 block"
                          >
                            {art.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{cat?.name || 'Science'}</span>
                            <span>·</span>
                            <span>{art.locale.toUpperCase()}</span>
                            <span>·</span>
                            <span>{author?.displayName || 'Staff'}</span>
                            <span>·</span>
                            <span className="font-mono uppercase text-[11px]">
                              {art.status.replace('_', ' ')}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-[11px]">v{art.version}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/articles/${art.id}/preview`}
                            title="Preview Article"
                            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/articles/${art.id}/edit`}
                            className="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Requires Attention List */}
            {widgets.requiresAttention && (
              <section className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Requires Editorial Attention ({attentionItems.length})</span>
                  </h2>
                  <Link
                    href="/seo"
                    className="text-xs font-medium text-[#087f83] dark:text-teal-400 hover:underline"
                  >
                    SEO &amp; Quality Center →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {attentionItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </div>
                        <div className="text-amber-700 dark:text-amber-400 mt-0.5">
                          {item.issue}
                        </div>
                      </div>
                      <Link
                        href={item.href}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium shrink-0"
                      >
                        Resolve
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right 5 Columns: Upcoming Publication Schedule + Recent Activity Feed */}
          <div className="lg:col-span-5 space-y-6">
            {widgets.upcomingCalendar && (
              <section className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#087f83] dark:text-teal-400" />
                    <span>Upcoming Publication Dates</span>
                  </h2>
                  <Link
                    href="/calendar"
                    className="text-xs font-medium text-[#087f83] dark:text-teal-400 hover:underline"
                  >
                    Open Calendar →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-4 space-y-3 text-xs">
                  {upcomingArticles.length === 0 ? (
                    <div className="text-slate-400">No scheduled articles queued.</div>
                  ) : (
                    upcomingArticles.map((art) => (
                      <div key={art.id} className="pt-2 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span>
                            {art.scheduledAt
                              ? formatUtcDateTime(art.scheduledAt)
                              : 'Approved · Awaiting slot'}
                          </span>
                          <span className="uppercase text-[#087f83] dark:text-teal-400 font-semibold">
                            {art.status}
                          </span>
                        </div>
                        <Link
                          href={`/articles/${art.id}/edit`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:underline block"
                        >
                          {art.title}
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {widgets.recentActivity && (
              <section className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Recent Editorial Activity
                  </h2>
                  <Link
                    href="/settings/audit"
                    className="text-xs font-medium text-[#087f83] dark:text-teal-400 hover:underline"
                  >
                    Audit Log →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                  {auditEvents.slice(0, 6).map((ev) => (
                    <div key={ev.id} className="p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {ev.actor}
                        </span>
                        <span className="font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {ev.action}: <span className="font-normal">{ev.targetTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{ev.details}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
