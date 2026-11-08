'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Wrench,
  ShieldAlert,
  Cpu,
  Globe,
  UserCheck,
} from 'lucide-react';
import { AuditFinding, FixProposal } from '@/lib/audit/types';
import { AuditStatusBadge } from './audit-status';

interface IssueRowProps {
  finding: AuditFinding;
  proposal?: FixProposal | null;
  onGoToField?: (finding: AuditFinding) => void;
  goToHref?: string;
  goToLabel?: string;
  onApplyQuickFix?: (proposal: FixProposal) => Promise<boolean>;
}

const CATEGORY_LABELS: Record<AuditFinding['category'], string> = {
  content: 'Content & Headings',
  metadata: 'SEO Metadata',
  taxonomy: 'Taxonomy & Discipline',
  links: 'Links & Knowledge Cards',
  images: 'Figures & Alt Text',
  scientific_integrity: 'Sources & Citations',
  structured_data: 'Schema & Dates',
  international: 'Locale & Hreflang',
  technical: 'Technical & Indexing',
  seo_metadata: 'SEO Metadata',
  heading_structure: 'Heading Structure',
  sources_citations: 'Sources & Citations',
  figures_alt_text: 'Figures & Alt Text',
  links_knowledge: 'Knowledge Links',
  schema_indexing: 'Schema & Indexing',
  publishing_readiness: 'Publishing Readiness',
};

export function IssueRow({
  finding,
  proposal,
  onGoToField,
  goToHref,
  goToLabel,
  onApplyQuickFix,
}: IssueRowProps) {
  const [showQuickFixPreview, setShowQuickFixPreview] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applying, setApplying] = useState(false);

  const originBadge =
    finding.origin === 'local_deterministic' ? (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <Cpu className="h-3 w-3" aria-hidden="true" />
        Local Deterministic Check
      </span>
    ) : finding.origin === 'external_unverified' ? (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <Globe className="h-3 w-3" aria-hidden="true" />
        External Integration Not Connected
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <UserCheck className="h-3 w-3" aria-hidden="true" />
        Human Editorial Verification Required
      </span>
    );

  return (
    <div
      data-testid={`audit-finding-${finding.ruleId}`}
      className={`rounded-lg border p-4 transition-colors ${
        finding.status === 'error'
          ? 'border-red-300 bg-red-50/40 dark:border-red-900/70 dark:bg-red-950/20'
          : finding.status === 'warning'
          ? 'border-amber-300 bg-amber-50/30 dark:border-amber-900/70 dark:bg-amber-950/15'
          : finding.status === 'pass'
          ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AuditStatusBadge status={finding.status} />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {CATEGORY_LABELS[finding.category]}
            </span>
            {finding.blocksPublish && finding.status === 'error' && (
              <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                Blocks Publish
              </span>
            )}
            {originBadge}
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {finding.title}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {goToHref ? (
            <Link
              href={goToHref}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>{goToLabel || 'Go to Field'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : onGoToField ? (
            <button
              type="button"
              onClick={() => onGoToField(finding)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>{goToLabel || 'Go to Field'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}

          {finding.quickFixAvailable && proposal && onApplyQuickFix && finding.status !== 'pass' && (
            <button
              type="button"
              onClick={() => setShowQuickFixPreview((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{finding.quickFixLabel || 'Quick Fix'}</span>
            </button>
          )}

          {finding.aiFixEligible && finding.status !== 'pass' && (
            <Link
              href="/settings/integrations"
              title="AI Assistant is not connected in local mode. Click to view Codex adapter status."
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Fix with AI (Not Connected)</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded bg-slate-50/90 p-2.5 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Observed Evidence
          </span>
          <p className="mt-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
            {finding.observed}
          </p>
        </div>
        <div className="rounded bg-slate-50/90 p-2.5 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Editorial Guidance
          </span>
          <p className="mt-0.5 text-slate-700 dark:text-slate-300">
            {finding.recommendation}
          </p>
        </div>
      </div>

      {showQuickFixPreview && proposal && onApplyQuickFix && (
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              Deterministic Quick Fix Preview: {proposal.label}
            </span>
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              Creates Recoverable Revision
            </span>
          </div>
          <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-300">
            {proposal.rationale}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded border border-red-200 bg-white p-2 dark:border-red-900/50 dark:bg-slate-900">
              <span className="block text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                Before
              </span>
              <p className="mt-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
                {proposal.before || '(empty)'}
              </p>
            </div>
            <div className="rounded border border-emerald-200 bg-white p-2 dark:border-emerald-900/50 dark:bg-slate-900">
              <span className="block text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                After
              </span>
              <p className="mt-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
                {proposal.after}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowQuickFixPreview(false)}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={async () => {
                setApplying(true);
                const saved = await onApplyQuickFix(proposal);
                setApplying(false);
                if (saved) {
                  setAppliedSuccess(true);
                  setShowQuickFixPreview(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{applying ? 'Saving…' : 'Apply Fix & Save Revision'}</span>
            </button>
          </div>
        </div>
      )}

      {appliedSuccess && (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Deterministic Quick Fix applied and saved as a new revision.
        </p>
      )}
    </div>
  );
}
