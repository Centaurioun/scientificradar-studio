'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  HelpCircle,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useStudio } from '@/lib/studio-context';
import { runArticleAudit } from '@/lib/audit/run-article-audit';
import { AuditStatusBadge } from '@/components/audit/audit-status';
import { LocalizedDate } from '@/components/datetime/localized-date';

export default function SeoCenterPage() {
  const {
    articles,
    categories,
    tags,
    sources,
    media,
    knowledgeLinks,
    integrations,
    runAndStoreArticleAudit,
  } = useStudio();

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'error' | 'warning' | 'unverified' | 'pass'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditBanner, setAuditBanner] = useState<string | null>(null);

  const auditedArticles = useMemo(() => {
    return articles.map((article) => {
      const report = runArticleAudit({
        article,
        allArticles: articles,
        categories,
        tags,
        sources,
        media,
        knowledgeLinks,
        integrations,
      });

      const titleLenFinding = report.findings.find(
        (f) => f.ruleId === 'metadata.seo_title.length' || f.ruleId === 'seo.title.length'
      );
      const descLenFinding = report.findings.find(
        (f) => f.ruleId === 'metadata.description.length' || f.ruleId === 'seo.description.length'
      );
      const h1Finding = report.findings.find(
        (f) => f.ruleId === 'content.h1.single' || f.ruleId === 'heading.body_no_h1'
      );
      const subcatFinding = report.findings.find(
        (f) => f.ruleId === 'taxonomy.subcategory.valid'
      );
      const tagFinding = report.findings.find(
        (f) => f.ruleId === 'taxonomy.tags.count'
      );

      const overallStatus: 'error' | 'warning' | 'pass' =
        report.counts.error > 0
          ? 'error'
          : report.counts.warning > 0
          ? 'warning'
          : 'pass';

      return {
        article,
        report,
        overallStatus,
        titleLenFinding,
        descLenFinding,
        h1Finding,
        subcatFinding,
        tagFinding,
      };
    });
  }, [articles, categories, tags, sources, media, knowledgeLinks, integrations]);

  const filteredItems = useMemo(() => {
    return auditedArticles.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.article.title.toLowerCase().includes(q) ||
          item.article.slug.toLowerCase().includes(q) ||
          (item.article.seo.title || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter === 'error') return item.report.counts.error > 0;
      if (statusFilter === 'warning') return item.report.counts.warning > 0;
      if (statusFilter === 'unverified') return item.report.counts.unverified > 0;
      if (statusFilter === 'pass')
        return item.report.counts.error === 0 && item.report.counts.warning === 0;
      return true;
    });
  }, [auditedArticles, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    return auditedArticles.reduce(
      (acc, item) => {
        if (item.report.counts.error > 0) acc.withErrors += 1;
        else if (item.report.counts.warning > 0) acc.withWarnings += 1;
        else acc.localClean += 1;
        acc.totalUnverified += item.report.counts.unverified;
        return acc;
      },
      { withErrors: 0, withWarnings: 0, localClean: 0, totalUnverified: 0 }
    );
  }, [auditedArticles]);

  const handleRunAllAudits = async () => {
    const receipts = await Promise.all(articles.map((article) => runAndStoreArticleAudit(article.id)));
    const computed = receipts.filter((receipt) => receipt.report).length;
    const saved = receipts.filter((receipt) => receipt.persisted).length;
    const memoryOnly = receipts.filter((receipt) => receipt.report && !receipt.persisted).length;
    setAuditBanner(
      saved === receipts.length
        ? `Calculated and saved SEO audits for ${saved} manuscripts in IndexedDB.`
        : `Calculated ${computed} SEO audits; ${saved} saved to IndexedDB and ${memoryOnly} remain in memory only because storage failed.`
    );
  };

  return (
    <AppShell
      title="SEO & Editorial Quality Center"
      breadcrumbs={[{ label: 'SEO & Quality Center' }]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header & Batch Action */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SearchCheck className="w-5 h-5 text-[#087f83] dark:text-teal-400" />
              <span>Centralized SEO &amp; Editorial Quality Audit</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Truthful local deterministic rules for SEO metadata, single-H1 hierarchy,
              discipline/subcategory integrity, 6-tag limits, scientific figures, and citations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAllAudits}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Run SEO Audit on All Articles</span>
          </button>
        </div>

        {/* Safety Lock Banner */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong>
                Prototype Indexing Lock Active (<code>noindex, nofollow</code>):
              </strong>{' '}
              All preview routes enforce non-indexable headers. Google Search Console live
              indexing status is labeled <strong>Unverified (Not Connected)</strong>.
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 font-mono text-[11px] font-semibold">
            robots: noindex, nofollow
          </span>
        </div>

        {auditBanner && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            <span>{auditBanner}</span>
            <button
              type="button"
              onClick={() => setAuditBanner(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'error' ? 'all' : 'error')}
            className={`rounded-xl border p-4 text-left transition-all bg-white dark:bg-[#111c22] ${
              statusFilter === 'error'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-400">
              <span>Articles with Blockers</span>
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {totals.withErrors}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Must resolve before local demo publish
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')
            }
            className={`rounded-xl border p-4 text-left transition-all bg-white dark:bg-[#111c22] ${
              statusFilter === 'warning'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Articles with Warnings</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {totals.withWarnings}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Truncation risk or advisory range
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'pass' ? 'all' : 'pass')}
            className={`rounded-xl border p-4 text-left transition-all bg-white dark:bg-[#111c22] ${
              statusFilter === 'pass'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Local Checks Passed</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {totals.localClean}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Zero local errors or warnings
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === 'unverified' ? 'all' : 'unverified')
            }
            className={`rounded-xl border p-4 text-left transition-all bg-white dark:bg-[#111c22] ${
              statusFilter === 'unverified'
                ? 'border-slate-500 ring-2 ring-slate-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Unverified Checks</span>
              <HelpCircle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {totals.totalUnverified}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              External integrations or human sign-off
            </p>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#111c22]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All Manuscripts (${auditedArticles.length})` },
                { id: 'error', label: `With Blockers (${totals.withErrors})` },
                { id: 'warning', label: `With Warnings (${totals.withWarnings})` },
                { id: 'unverified', label: 'Unverified External/Human' },
                { id: 'pass', label: `Local Passed (${totals.localClean})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#087f83] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title or slug…"
            aria-label="Filter articles in SEO center"
            className="w-full sm:w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-xl bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Article &amp; Updated</th>
                  <th className="py-3 px-4">SEO Title (50–65 Advisory)</th>
                  <th className="py-3 px-4">Meta Description (110–160)</th>
                  <th className="py-3 px-4">Taxonomy &amp; Structure</th>
                  <th className="py-3 px-4">Audit Summary</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.map(
                  ({
                    article: art,
                    report,
                    overallStatus,
                    titleLenFinding,
                    descLenFinding,
                    h1Finding,
                    subcatFinding,
                    tagFinding,
                  }) => {
                    const seoTitleLen = (art.seo.title || '').trim().length;
                    const seoDescLen = (art.seo.description || '').trim().length;

                    return (
                      <tr
                        key={art.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {art.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            /{art.locale}/{art.slug}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            Updated <LocalizedDate iso={art.updatedAt} mode="datetime" />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold ${
                                titleLenFinding?.status === 'error'
                                  ? 'text-red-600 dark:text-red-400'
                                  : titleLenFinding?.status === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {seoTitleLen} / 65 chars
                            </span>
                            <AuditStatusBadge
                              status={titleLenFinding?.status || 'pass'}
                              label={
                                seoTitleLen > 65
                                  ? 'Truncation Risk'
                                  : seoTitleLen < 50
                                  ? 'Short'
                                  : 'Optimal'
                              }
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 break-words">
                            {art.seo.title || '(Missing SEO Title)'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold ${
                                descLenFinding?.status === 'error'
                                  ? 'text-red-600 dark:text-red-400'
                                  : descLenFinding?.status === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {seoDescLen} / 160 chars
                            </span>
                            <AuditStatusBadge
                              status={descLenFinding?.status || 'pass'}
                              label={
                                seoDescLen > 160
                                  ? 'Truncation Risk'
                                  : seoDescLen < 110
                                  ? 'Short'
                                  : 'Optimal'
                              }
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 break-words">
                            {art.seo.description || '(Missing Meta Description)'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">H1 Rule:</span>
                              <span
                                className={
                                  h1Finding?.status === 'pass'
                                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                    : 'font-semibold text-red-600 dark:text-red-400'
                                }
                              >
                                {h1Finding?.status === 'pass'
                                  ? 'Sole H1 Valid'
                                  : 'Body H1 Error'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Subcategories:</span>
                              <span
                                className={
                                  subcatFinding?.status === 'pass'
                                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                    : 'font-semibold text-red-600 dark:text-red-400'
                                }
                              >
                                {subcatFinding?.status === 'pass'
                                  ? 'Aligned'
                                  : 'Mismatch'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Tags:</span>
                              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {art.tagIds.length}/6 ({tagFinding?.status})
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <AuditStatusBadge status={overallStatus} />
                            <div className="text-[11px] text-slate-500 font-mono">
                              {report.counts.error}E · {report.counts.warning}W ·{' '}
                              {report.counts.pass}P · {report.counts.unverified}U
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Link
                              href={`/articles/${art.id}/seo`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                            >
                              <span>Audit Report</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/articles/${art.id}/edit?tab=seo`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View (390px Responsive without Horizontal Overflow) */}
        <div className="space-y-3 md:hidden">
          {filteredItems.map(({ article: art, report, overallStatus, titleLenFinding, descLenFinding }) => (
            <div
              key={art.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-[#111c22]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {art.title}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-400">
                    /{art.locale}/{art.slug}
                  </p>
                </div>
                <AuditStatusBadge status={overallStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-slate-200 p-2 dark:border-slate-800">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    SEO Title
                  </span>
                  <span className="font-mono font-bold">
                    {(art.seo.title || '').trim().length} / 65 ({titleLenFinding?.status})
                  </span>
                </div>
                <div className="rounded border border-slate-200 p-2 dark:border-slate-800">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Meta Description
                  </span>
                  <span className="font-mono font-bold">
                    {(art.seo.description || '').trim().length} / 160 ({descLenFinding?.status})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs dark:border-slate-800">
                <span className="font-mono text-[11px] text-slate-500">
                  {report.counts.error} err · {report.counts.warning} warn ·{' '}
                  {report.counts.pass} pass
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/articles/${art.id}/seo`}
                    className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    <span>Full Audit</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href={`/articles/${art.id}/edit?tab=seo`}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-700"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
