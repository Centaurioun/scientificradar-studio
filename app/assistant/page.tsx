'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { CodexAssistantDrawer } from '@/components/assistant/codex-assistant-drawer';
import { Sparkles, Plug, ShieldCheck, Edit3 } from 'lucide-react';

export default function AssistantOverviewPage() {
  const { articles } = useStudio();
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0]?.id || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  return (
    <AppShell title="AI Assistant" breadcrumbs={[{ label: 'AI Assistant' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#087f83]" />
              <span>AI Assistant · Editorial Finishing</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-400">
              <Plug className="w-4 h-4" />
              <span>Codex Adapter: Not Connected (P0 Prototype)</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Core Principle:</strong> You author and paste the scientific manuscript. The assistant never writes, replaces, summarizes, or reinterprets your scientific claims, and never invents DOIs. In P0 prototype mode, remote ChatGPT/Codex sign-in is disabled and clearly labeled disconnected, while deterministic <strong>Local Checks (not Codex)</strong> inspect heading hierarchy, missing alt text, SEO fields, tag suggestions, DOI syntax, and Smart Knowledge Link candidates.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Run Deterministic Local Checks on a Manuscript
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select manuscript for local checks"
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="flex-1 min-w-[260px] px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} (v{a.version} · {a.status})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Finishing &amp; Diff Review Drawer</span>
            </button>

            {selectedArticle && (
              <Link
                href={`/articles/${selectedArticle.id}/edit`}
                className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Open in Editor</span>
              </Link>
            )}
          </div>
        </div>

        {selectedArticle && (
          <CodexAssistantDrawer
            article={selectedArticle}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
