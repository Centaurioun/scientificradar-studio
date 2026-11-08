'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AuditFinding, AuditReport } from '@/lib/audit/types';
import { evaluatePublishGate } from '@/lib/audit/publish-policy';
import { LocalizedDate } from '@/components/datetime/localized-date';

function getGoToFieldLabel(finding: AuditFinding) {
  return finding.ruleId === 'images.rights.verified' ? 'Inspect Figure' : 'Go to Field';
}

interface PrePublishDialogProps {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  report: AuditReport;
  onConfirmPublish: (overrideNote?: string) => void;
  onGoToField?: (finding: AuditFinding) => void;
}

export function PrePublishDialog({
  open,
  onClose,
  articleId,
  articleTitle,
  articleSlug,
  report,
  onConfirmPublish,
  onGoToField,
}: PrePublishDialogProps) {
  const [overrideNote, setOverrideNote] = useState(
    'Editorial review completed; proceeding with local demo publication despite advisory warnings.'
  );

  if (!open) return null;

  const gate = evaluatePublishGate(report);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-publish-dialog-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Pre-Publish Quality Gate
              </span>
              <span className="text-xs text-slate-500">
                Evaluated <LocalizedDate iso={report.generatedAt} mode="datetime" />
              </span>
            </div>
            <h2
              id="pre-publish-dialog-title"
              className="mt-1 text-base font-bold text-slate-900 dark:text-white"
            >
              {articleTitle || 'Untitled Scientific Article'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">/{articleSlug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Pre-Publish Check modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Truthfulness Banner */}
          <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Local Demo Publication Only:</strong> Confirming publication updates the article
            status to <code className="font-mono font-bold">published</code> in your local IndexedDB
            repository. It never deploys to, alters, or indexes on{' '}
            <code className="font-mono">scientificradar.com</code>.
          </div>

          {/* Summary Counters */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/25">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span>Blockers</span>
              </div>
              <p className="mt-1 text-xl font-bold text-red-900 dark:text-red-200">
                {gate.blockers.length}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/25">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Warnings</span>
              </div>
              <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-200">
                {gate.warnings.length}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/25">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Local Passed</span>
              </div>
              <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-200">
                {report.counts.pass}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <HelpCircle className="h-4 w-4" />
                <span>Unverified</span>
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {gate.unverified.length}
              </p>
            </div>
          </div>

          {/* 1. Blockers */}
          {gate.blockers.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                <ShieldAlert className="h-4 w-4" />
                <span>1. Publishing Blockers (Must Resolve Before Publishing)</span>
              </h3>
              <div className="space-y-2">
                {gate.blockers.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-red-300 bg-red-50/60 p-3 text-xs dark:border-red-900/70 dark:bg-red-950/30"
                  >
                    <div className="space-y-0.5 flex-1">
                      <p className="font-bold text-red-950 dark:text-red-200">{b.title}</p>
                      <p className="text-red-800 dark:text-red-300">{b.observed}</p>
                      <p className="text-[11px] text-red-700/90 dark:text-red-300/80">
                        Fix: {b.recommendation}
                      </p>
                    </div>
                    {onGoToField && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToField(b);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-200"
                      >
                        <span>{getGoToFieldLabel(b)}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Advisory Warnings */}
          {gate.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>2. Advisory Warnings (Editorial Confirmation Allowed)</span>
              </h3>
              <div className="space-y-2">
                {gate.warnings.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50/50 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/20"
                  >
                    <div className="space-y-0.5 flex-1">
                      <p className="font-bold text-amber-950 dark:text-amber-200">{w.title}</p>
                      <p className="text-amber-900 dark:text-amber-300">{w.observed}</p>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                        Recommendation: {w.recommendation}
                      </p>
                    </div>
                    {onGoToField && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToField(w);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"
                      >
                        <span>{getGoToFieldLabel(w)}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {gate.canPublish && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <label
                    htmlFor="publish-override-note"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Editorial Override Note (Logged to Audit Trail)
                  </label>
                  <input
                    id="publish-override-note"
                    type="text"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. Unverified External & Human Checks */}
          {gate.unverified.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <HelpCircle className="h-4 w-4" />
                <span>3. Unverified External & Human Editorial Checks (Informational)</span>
              </h3>
              <div className="space-y-1.5">
                {gate.unverified.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{u.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {u.observed}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <Link
            href={`/articles/${articleId}/seo`}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <span>Open Full Per-Article SEO Audit</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!gate.canPublish}
              onClick={() => {
                onConfirmPublish(
                  gate.requiresWarningConfirmation ? overrideNote : 'Passed local pre-publish check'
                );
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {!gate.canPublish
                  ? `Blocked (${gate.blockers.length} Error${gate.blockers.length > 1 ? 's' : ''})`
                  : gate.requiresWarningConfirmation
                  ? 'Publish Anyway (Local Demo)'
                  : 'Confirm Publish (Local Demo)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
