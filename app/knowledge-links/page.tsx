'use client';

import React, { useState } from 'react';
import { useStudio } from '@/lib/studio-context';
import { validateSafeUrl } from '@/lib/editorial-rules';
import { AppShell } from '@/components/layout/app-shell';
import { KnowledgeLinkPopover } from '@/components/knowledge/knowledge-link-popover';
import { Link2, Plus } from 'lucide-react';

export default function SmartKnowledgeLinksPage() {
  const { knowledgeLinks, saveKnowledgeLink } = useStudio();
  const [term, setTerm] = useState('');
  const [targetType, setTargetType] = useState<'internal' | 'wikipedia'>('wikipedia');
  const [targetUrl, setTargetUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewExcerpt, setPreviewExcerpt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!term.trim() || !targetUrl.trim()) return;
    const urlCheck = validateSafeUrl(targetUrl);
    if (!urlCheck.valid) {
      setError(urlCheck.reason || 'Invalid URL');
      return;
    }
    saveKnowledgeLink({
      term,
      targetType,
      targetUrl,
      previewTitle: previewTitle || term,
      previewExcerpt,
      locale: 'en',
    });
    setTerm('');
    setTargetUrl('');
    setPreviewTitle('');
    setPreviewExcerpt('');
  };

  return (
    <AppShell
      title="Smart Knowledge Links"
      breadcrumbs={[{ label: 'Smart Knowledge Links' }]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Smart Knowledge Links — Interactive Concept Cards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Internal-first scientific concept linking with Wikipedia fallback. Hover with mouse, focus via Tab key (dismiss with Escape), or tap on mobile to inspect live popovers below (AT-14, AT-15, AT-16).
          </p>
        </div>

        {/* Live Interactive Sandbox */}
        <div className="p-6 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#087f83] dark:text-teal-400 font-semibold">
            Interactive Reader Experience Demo (Hover, Keyboard Focus, or Mobile Tap)
          </div>
          <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
            In recent experimental trials, long-distance{' '}
            {knowledgeLinks[0] && (
              <KnowledgeLinkPopover
                termText="quantum entanglement"
                knowledgeItem={knowledgeLinks[0]}
              />
            )}{' '}
            was stabilized across urban fiber, while spaceborne{' '}
            {knowledgeLinks[1] && (
              <KnowledgeLinkPopover
                termText="transmission spectroscopy"
                knowledgeItem={knowledgeLinks[1]}
              />
            )}{' '}
            and oceanographic{' '}
            {knowledgeLinks[2] && (
              <KnowledgeLinkPopover
                termText="thermohaline circulation"
                knowledgeItem={knowledgeLinks[2]}
              />
            )}{' '}
            models refined planetary climate boundaries.
          </p>
        </div>

        {/* Add Concept Card Form */}
        <form
          onSubmit={handleAdd}
          className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
        >
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#087f83]" />
            <span>Register Approved Knowledge Link Concept</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Concept term (e.g. Cas9 nickase) *"
              aria-label="Concept term"
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as 'internal' | 'wikipedia')}
              aria-label="Target link type"
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="internal">Internal ScientificRadar Article (Preferred)</option>
              <option value="wikipedia">Validated Wikimedia / Wikipedia HTTPS</option>
            </select>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/... *"
              aria-label="Target URL"
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={previewExcerpt}
              onChange={(e) => setPreviewExcerpt(e.target.value)}
              placeholder="Concise educational concept summary shown in hover popover..."
              aria-label="Concept summary excerpt"
              className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#087f83] text-white font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Concept</span>
            </button>
          </div>
          {error && <div className="text-red-600">{error}</div>}
        </form>

        {/* Registered Concepts Table */}
        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {knowledgeLinks.map((kl) => (
            <div key={kl.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KnowledgeLinkPopover termText={kl.term} knowledgeItem={kl} />
                  <span className="font-mono text-[11px] text-slate-400">
                    ({kl.targetType === 'internal' ? 'Internal Reference' : 'Wikipedia'})
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{kl.previewExcerpt}</p>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {kl.sourceAttribution}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
