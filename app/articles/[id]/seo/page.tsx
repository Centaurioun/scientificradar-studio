'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Send,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useStudio } from '@/lib/studio-context';
import {
  buildQuickFixProposal,
  computeArticleFingerprint,
  runArticleAudit,
} from '@/lib/audit/run-article-audit';
import { FindingCategory, FindingStatus } from '@/lib/audit/types';
import { IssueRow } from '@/components/audit/issue-row';
import { AuditStatusBadge } from '@/components/audit/audit-status';
import { PrePublishDialog } from '@/components/audit/pre-publish-dialog';
import { LocalizedDate } from '@/components/datetime/localized-date';

export default function ArticleSeoAuditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    articles,
    categories,
    tags,
    sources,
    media,
    knowledgeLinks,
    integrations,
    auditReportsByArticleId,
    runAndStoreArticleAudit,
    applyQuickFixProposal,
    transitionArticleStatus,
  } = useStudio();

  const article = articles.find((a) => a.id === params.id);
  const [statusFilter, setStatusFilter] = useState<'all' | FindingStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FindingCategory>('all');
  const [prePublishOpen, setPrePublishOpen] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const liveReport = useMemo(() => {
    if (!article) return null;
    return runArticleAudit({
      article,
      allArticles: articles,
      categories,
      tags,
      sources,
      media,
      knowledgeLinks,
      integrations,
    });
  }, [article, articles, categories, tags, sources, media, knowledgeLinks, integrations]);

  if (!article || !liveReport) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Article Not Found
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              The requested article ID ({params.id}) does not exist in the local studio repository.
            </p>
            <Link
              href="/seo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to SEO Audit Overview</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const storedReport = auditReportsByArticleId?.[article.id];
  const currentFp = computeArticleFingerprint(article);
  const isStoredReportStale =
    storedReport && storedReport.articleFingerprint !== currentFp;

  const report = storedReport && !isStoredReportStale ? storedReport : liveReport;

  const filteredFindings = report.findings.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    return true;
  });

  const quickFixableFindings = report.findings.filter(
    (f) => f.quickFixAvailable && f.status !== 'pass'
  );

  const handleRunAudit = () => {
    const updated = runAndStoreArticleAudit(article.id);
    if (updated) {
      setFeedbackBanner(
        `SEO & Editorial Quality Audit completed: ${updated.counts.pass} passed, ${updated.counts.warning} warning(s), ${updated.counts.error} error(s), ${updated.counts.unverified} unverified.`
      );
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/articles/${article.id}/edit`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Article Editor</span>
              </Link>
              <Link
                href="/seo"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                SEO Overview
              </Link>
              <span className="text-xs text-slate-400">/</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                v{article.version} · {article.status.toUpperCase()}
              </span>
              {isStoredReportStale ? (
                <AuditStatusBadge status="stale" />
              ) : (
                <AuditStatusBadge
                  status={
                    report.counts.error > 0
                      ? 'error'
                      : report.counts.warning > 0
                      ? 'warning'
                      : 'pass'
                  }
                />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SEO & Editorial Quality Audit: {article.title}
            </h1>
            <p className="text-xs text-slate-500">
              Slug: <code className="font-mono">/{article.slug}</code> · Last evaluated:{' '}
              <LocalizedDate iso={report.generatedAt} mode="datetime" includeZoneName />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunAudit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Run SEO Audit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                runAndStoreArticleAudit(article.id);
                setPrePublishOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Pre-Publish Gate</span>
            </button>

            <Link
              href="/settings/integrations"
              title="AI Assistant is not connected in local mode. Click to inspect adapter status."
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fix All Eligible Issues with AI (Not Connected)</span>
            </Link>
          </div>
        </div>

        {feedbackBanner && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            <span>{feedbackBanner}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'error' ? 'all' : 'error')}
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === 'error'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-200 dark:border-slate-800'
            } bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-400">
              <span>Blocker Errors</span>
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {report.counts.error}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Blocks local demo publish until fixed
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === 'warning'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800'
            } bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Advisory Warnings</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {report.counts.warning}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Recommended editorial improvements
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'pass' ? 'all' : 'pass')}
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === 'pass'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800'
            } bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Passed Local Checks</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {report.counts.pass}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Verified by deterministic local rules
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'unverified' ? 'all' : 'unverified')}
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === 'unverified'
                ? 'border-slate-500 ring-2 ring-slate-500/20'
                : 'border-slate-200 dark:border-slate-800'
            } bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Unverified (External/Human)</span>
              <HelpCircle className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {report.counts.unverified}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Requires external API or human sign-off
            </p>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${report.findings.length})` },
                { id: 'error', label: `Errors (${report.counts.error})` },
                { id: 'warning', label: `Warnings (${report.counts.warning})` },
                { id: 'unverified', label: `Unverified (${report.counts.unverified})` },
                { id: 'pass', label: `Passed (${report.counts.pass})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="audit-category-filter" className="text-xs font-medium text-slate-500">
              Category:
            </label>
            <select
              id="audit-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | FindingCategory)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="all">All Categories</option>
              <option value="seo_metadata">SEO Metadata</option>
              <option value="heading_structure">Heading Structure</option>
              <option value="taxonomy">Taxonomy & Discipline</option>
              <option value="sources_citations">Sources & Citations</option>
              <option value="figures_alt_text">Figures & Alt Text</option>
              <option value="links_knowledge">Knowledge Links</option>
              <option value="schema_indexing">Schema & Indexing</option>
              <option value="publishing_readiness">Publishing Readiness</option>
            </select>
          </div>
        </div>

        {/* Deterministic Quick Fixes Callout */}
        {quickFixableFindings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <div className="flex items-center gap-2.5">
              <Wrench className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {quickFixableFindings.length} Deterministic Local Quick Fix
                  {quickFixableFindings.length > 1 ? 'es' : ''} Available
                </p>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Each Quick Fix previews the exact before/after diff and creates a recoverable
                  revision snapshot without altering scientific prose.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No audit findings match the selected status/category filter.
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const proposal = buildQuickFixProposal(article, finding.ruleId, categories);
              const targetTab = finding.inspectorTab || 'seo';
              const targetFocus = finding.targetField || '';
              const goToHref = `/articles/${article.id}/edit?tab=${encodeURIComponent(
                targetTab
              )}${targetFocus ? `&focus=${encodeURIComponent(targetFocus)}` : ''}`;

              return (
                <IssueRow
                  key={finding.id}
                  finding={finding}
                  proposal={proposal}
                  goToHref={goToHref}
                  onApplyQuickFix={(prop) => {
                    const res = applyQuickFixProposal(prop);
                    if (res.ok) {
                      setFeedbackBanner(
                        `Applied deterministic Quick Fix "${prop.label}" and saved revision v${res.updatedArticle?.version}.`
                      );
                    } else if (res.error) {
                      setFeedbackBanner(`Quick Fix error: ${res.error}`);
                    }
                  }}
                />
              );
            })
          )}
        </div>

        <PrePublishDialog
          open={prePublishOpen}
          onClose={() => setPrePublishOpen(false)}
          articleId={article.id}
          articleTitle={article.title}
          articleSlug={article.slug}
          report={report}
          onConfirmPublish={(overrideNote) => {
            const res = transitionArticleStatus(article.id, 'published', overrideNote);
            if (res.ok) {
              setFeedbackBanner(
                'Article marked as Published in local demo repository (scientificradar.com remains untouched).'
              );
            } else if (res.error) {
              setFeedbackBanner(`Publish transition blocked: ${res.error}`);
            }
          }}
          onGoToField={(finding) => {
            const targetTab = finding.inspectorTab || 'seo';
            const targetFocus = finding.targetField || '';
            router.push(
              `/articles/${article.id}/edit?tab=${encodeURIComponent(targetTab)}${
                targetFocus ? `&focus=${encodeURIComponent(targetFocus)}` : ''
              }`
            );
          }}
        />
      </div>
    </AppShell>
  );
}
