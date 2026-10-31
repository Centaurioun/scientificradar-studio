'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Layers, Plus } from 'lucide-react';

export default function SeriesPage() {
  const { series, articles, saveSeries } = useStudio();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    saveSeries({ title, description, locale: 'en', articleIds: [] });
    setTitle('');
    setDescription('');
  };

  return (
    <AppShell title="Series & Collections" breadcrumbs={[{ label: 'Series & Collections' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Editorial Series &amp; Collections ({series.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Named multi-part thematic series. Even when hidden from the left sidebar via Settings → Navigation, series records remain accessible in the Article Metadata Inspector (AT-02).
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 text-xs"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New Series Title (e.g., Polar Ice-Sheet Telemetry 2026)..."
            aria-label="New series title"
            className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Series editorial scope..."
            aria-label="New series description"
            className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#087f83] text-white font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Series</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((s) => {
            const memberArticles = articles.filter(
              (a) => a.seriesId === s.id || s.articleIds.includes(a.id)
            );
            return (
              <div
                key={s.id}
                className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                  <Layers className="w-4 h-4 text-[#087f83]" />
                  <span>{s.title}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{s.description}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Member Articles ({memberArticles.length}):
                  </div>
                  {memberArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/articles/${art.id}/edit`}
                      className="block text-[#087f83] dark:text-teal-400 hover:underline truncate"
                    >
                      → {art.title} ({art.locale.toUpperCase()})
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
