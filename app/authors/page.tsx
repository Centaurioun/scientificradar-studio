'use client';

import React, { useState } from 'react';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Users, Plus } from 'lucide-react';

export default function AuthorsPage() {
  const { authors, articles, saveAuthor } = useStudio();
  const [displayName, setDisplayName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [biography, setBiography] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');

  const handleAddAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    saveAuthor({
      displayName,
      affiliation: affiliation || 'Contributing Researcher (Demo Profile)',
      biography,
      expertise: expertiseInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      locale: 'en',
      role: 'author',
    });
    setDisplayName('');
    setAffiliation('');
    setBiography('');
    setExpertiseInput('');
  };

  return (
    <AppShell title="Authors & Editors" breadcrumbs={[{ label: 'Authors & Editors' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Authors &amp; Editorial Profiles ({authors.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Public author profiles are distinct from staff login accounts. Affiliations and credentials are never fabricated.
          </p>
        </div>

        <form
          onSubmit={handleAddAuthor}
          className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Full Name & Degree *"
            aria-label="Author display name"
            className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <input
            type="text"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="Truthful Affiliation (Optional)"
            aria-label="Author affiliation"
            className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <input
            type="text"
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            placeholder="Expertise (e.g. Astrophysics, Optics)"
            aria-label="Author expertise"
            className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#087f83] text-white font-semibold flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Author Profile</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {authors.map((auth) => {
            const authored = articles.filter((a) => a.authorId === auth.id);
            return (
              <div
                key={auth.id}
                className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#087f83]" />
                    <span>{auth.displayName}</span>
                  </div>
                  <span className="font-mono uppercase text-[11px] text-slate-400">
                    {auth.role} · {authored.length} article(s)
                  </span>
                </div>
                <div className="text-slate-500">
                  {auth.affiliation} {auth.orcid ? `· ORCID: ${auth.orcid}` : ''}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {auth.biography}
                </p>
                {auth.expertise.length > 0 && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Disciplines: {auth.expertise.join(' · ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
