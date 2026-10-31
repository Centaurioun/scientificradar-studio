'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { Article, AssistantTask, EditorialChange } from '@/lib/types';
import { runDeterministicLocalChecks } from '@/lib/editorial-rules';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Plug,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface CodexAssistantDrawerProps {
  article: Article;
  open: boolean;
  onClose: () => void;
  onChangesApplied?: (updated: Article) => void;
}

const TASK_DEFINITIONS: Array<{ id: AssistantTask; label: string; description: string }> = [
  {
    id: 'format',
    label: 'Format Article',
    description: 'Check H2/H3 heading hierarchy, demote accidental body H1s, normalize whitespace.',
  },
  {
    id: 'images',
    label: 'Optimize Images',
    description: 'Check missing figure alt text, verify non-crop contain policy and locked layout positions.',
  },
  {
    id: 'seo',
    label: 'Optimize for SEO & Tags',
    description: 'Check SEO title, meta description, and suggest 3–6 relevant taxonomy tags.',
  },
  {
    id: 'sources',
    label: 'Check Sources & Links',
    description: 'Run local DOI syntax validation, unsafe URL scheme checks, and missing citation flags.',
  },
  {
    id: 'knowledge',
    label: 'Smart Knowledge Links',
    description: 'Identify first occurrence of scientific concepts for internal or Wikipedia hover cards.',
  },
];

export function CodexAssistantDrawer({
  article,
  open,
  onClose,
  onChangesApplied,
}: CodexAssistantDrawerProps) {
  const { tags, media, sources, knowledgeLinks, applyAssistantChanges } = useStudio();

  const [selectedTasks, setSelectedTasks] = useState<AssistantTask[]>([
    'format',
    'images',
    'seo',
    'sources',
    'knowledge',
  ]);
  const [supplementalInstructions, setSupplementalInstructions] = useState('');
  const [hasRunLocalChecks, setHasRunLocalChecks] = useState(false);
  const [proposals, setProposals] = useState<EditorialChange[]>([]);
  const [selectedChangeIds, setSelectedChangeIds] = useState<Record<string, boolean>>({});
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const articleMedia = useMemo(
    () => media.filter((m) => m.id === article.featuredMediaId),
    [media, article.featuredMediaId]
  );

  const articleSources = useMemo(
    () => sources.filter((s) => article.sourceIds.includes(s.id)),
    [sources, article.sourceIds]
  );

  if (!open) return null;

  const toggleTask = (taskId: AssistantTask) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((t) => t !== taskId) : [...prev, taskId]
    );
  };

  const handleRunDeterministicLocalChecks = () => {
    setFeedbackBanner(null);
    const detected = runDeterministicLocalChecks({
      article,
      allTags: tags,
      articleMedia,
      articleSources,
      availableKnowledgeLinks: knowledgeLinks,
      tasks: selectedTasks,
    });
    setProposals(detected);
    const autoSel: Record<string, boolean> = {};
    for (const d of detected) {
      autoSel[d.id] = d.safeToAutoSelect;
    }
    setSelectedChangeIds(autoSel);
    setHasRunLocalChecks(true);
  };

  const handleSelectAllSafe = () => {
    const next: Record<string, boolean> = {};
    for (const p of proposals) {
      if (p.safeToAutoSelect) {
        next[p.id] = true;
      }
    }
    setSelectedChangeIds(next);
  };

  const handleRejectAll = () => {
    setSelectedChangeIds({});
  };

  const handleApplySelected = () => {
    const chosen = proposals.filter((p) => selectedChangeIds[p.id] && p.safeToAutoSelect);
    if (chosen.length === 0) {
      setFeedbackBanner({
        type: 'error',
        message: 'Select at least one actionable mechanical or metadata proposal to apply.',
      });
      return;
    }
    const res = applyAssistantChanges(article.id, chosen);
    if (!res.ok) {
      setFeedbackBanner({ type: 'error', message: res.error || 'Failed to apply changes' });
      return;
    }
    setFeedbackBanner({
      type: 'success',
      message: `Applied ${chosen.length} change(s) and saved Version v${res.updatedArticle?.version}. Previous snapshot remains recoverable in Version History.`,
    });
    if (res.updatedArticle && onChangesApplied) {
      onChangesApplied(res.updatedArticle);
    }
    setProposals((prev) => prev.filter((p) => !selectedChangeIds[p.id]));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Prepare with Codex — Editorial Finishing & Local Checks"
        className="relative w-full max-w-xl bg-white dark:bg-[#111c22] h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#087f83] dark:text-teal-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Prepare with Codex · Editorial Finishing
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Finishes &amp; checks human-authored science · Never rewrites claims or invents DOIs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Codex Assistant drawer"
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Truthful Connection State Banner (Spec §12, AT-22) */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#15222a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Plug className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Codex Provider: Not Connected
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Running deterministic <strong className="text-slate-700 dark:text-slate-300">Local checks (not Codex)</strong> on Snapshot v{article.version}
              </span>
            </div>
          </div>
          <Link
            href="/settings/integrations"
            className="text-xs font-medium text-[#087f83] dark:text-teal-400 hover:underline whitespace-nowrap"
          >
            Integration Status →
          </Link>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Task Checklist */}
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              1. Select Finishing &amp; Verification Tasks
            </div>
            <div className="space-y-2">
              {TASK_DEFINITIONS.map((task) => {
                const checked = selectedTasks.includes(task.id);
                return (
                  <label
                    key={task.id}
                    className={`flex items-start gap-3 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#087f83]/50 bg-[#087f83]/5 dark:bg-teal-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 rounded border-slate-300 text-[#087f83] focus:ring-[#087f83]"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {task.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {task.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Supplemental Editorial Instructions */}
          <div>
            <label
              htmlFor="assistant-supplemental-notes"
              className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1"
            >
              2. Supplemental Editorial Instructions (Optional)
            </label>
            <input
              id="assistant-supplemental-notes"
              type="text"
              value={supplementalInstructions}
              onChange={(e) => setSupplementalInstructions(e.target.value)}
              placeholder="e.g., Prefer British spelling for sulphate; keep all SI units unabreviated..."
              className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          {/* Run Local Deterministic Checks Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunDeterministicLocalChecks}
              className="px-4 py-2 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Run Local Checks (Not Codex)</span>
            </button>
            <button
              type="button"
              disabled
              title="Codex app-server / Sign in with ChatGPT is not configured in P0 prototype"
              className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 cursor-not-allowed"
            >
              Run Remote Codex (Not Configured)
            </button>
          </div>

          {feedbackBanner && (
            <div
              role="status"
              className={`p-3 rounded-md border text-xs flex items-start gap-2 ${
                feedbackBanner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
          )}

          {/* Review Changes Diff Section (AT-20, AT-21) */}
          {hasRunLocalChecks && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Review Proposed Changes ({proposals.length} findings · Local Checks)
                </div>
                {proposals.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllSafe}
                      className="text-[#087f83] dark:text-teal-400 hover:underline font-medium"
                    >
                      Select all safe
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleRejectAll}
                      className="text-slate-500 hover:underline"
                    >
                      Reject all
                    </button>
                  </div>
                )}
              </div>

              {proposals.length === 0 ? (
                <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-300">
                  All selected local deterministic checks passed. No body H1 violations, missing alt text, or unlinked concept terms detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map((prop) => {
                    const isSelected = !!selectedChangeIds[prop.id];
                    return (
                      <div
                        key={prop.id}
                        className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                          isSelected
                            ? 'border-[#087f83] bg-[#087f83]/5 dark:bg-teal-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label className="flex items-start gap-2 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                            {prop.safeToAutoSelect ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedChangeIds((prev) => ({
                                    ...prev,
                                    [prop.id]: !prev[prop.id],
                                  }))
                                }
                                className="mt-0.5 rounded border-slate-300 text-[#087f83]"
                              />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <span>{prop.label}</span>
                          </label>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                            {prop.category} · {prop.task}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {prop.reason}
                        </p>

                        {/* Side-by-side Before / After Diff */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div className="p-2 rounded bg-red-50/70 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 text-red-900 dark:text-red-200 break-words">
                            <span className="block text-[10px] uppercase text-red-500 mb-0.5">
                              Before
                            </span>
                            {prop.before}
                          </div>
                          <div className="p-2 rounded bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 break-words">
                            <span className="block text-[10px] uppercase text-emerald-600 mb-0.5">
                              After (Proposed)
                            </span>
                            {prop.after}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRunDeterministicLocalChecks}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run selection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium"
            >
              Close
            </button>
            {hasRunLocalChecks && proposals.some((p) => p.safeToAutoSelect) && (
              <button
                type="button"
                onClick={handleApplySelected}
                className="px-4 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Accept Selected &amp; Save Version</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
