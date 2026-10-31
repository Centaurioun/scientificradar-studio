'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { ArticleStatus } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Archive,
  CheckCircle2,
  AlertTriangle,
  SearchCheck,
} from 'lucide-react';
import { LocalizedDate } from '@/components/datetime/localized-date';

type SavedFilter = 'all' | 'drafts' | 'in_review' | 'scheduled' | 'published' | 'needs_attention';

export default function ArticlesListPage() {
  const {
    articles,
    categories,
    tags,
    authors,
    sources,
    duplicateArticle,
    transitionArticleStatus,
    deleteArticle,
  } = useStudio();

  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localeFilter, setLocaleFilter] = useState<'all' | 'en' | 'tr'>('all');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (savedFilter === 'drafts' && art.status !== 'draft' && art.status !== 'idea') {
        return false;
      }
      if (
        savedFilter === 'in_review' &&
        art.status !== 'in_review' &&
        art.status !== 'revision_requested'
      ) {
        return false;
      }
      if (
        savedFilter === 'scheduled' &&
        art.status !== 'scheduled' &&
        art.status !== 'approved'
      ) {
        return false;
      }
      if (savedFilter === 'published' && art.status !== 'published') {
        return false;
      }
      if (
        savedFilter === 'needs_attention' &&
        art.sourceIds.length > 0 &&
        art.seo.title &&
        art.seo.description
      ) {
        return false;
      }

      if (categoryFilter !== 'all' && !art.categoryIds.includes(categoryFilter)) {
        return false;
      }
      if (localeFilter !== 'all' && art.locale !== localeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const author = authors.find((a) => a.id === art.authorId);
        const artTags = tags.filter((t) => art.tagIds.includes(t.id));
        const artSources = sources.filter((s) => art.sourceIds.includes(s.id));

        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesSlug = art.slug.toLowerCase().includes(q);
        const matchesAuthor = author?.displayName.toLowerCase().includes(q);
        const matchesTag = artTags.some((t) => t.name.toLowerCase().includes(q));
        const matchesDoi = artSources.some((s) => s.doi?.toLowerCase().includes(q));

        if (!matchesTitle && !matchesSlug && !matchesAuthor && !matchesTag && !matchesDoi) {
          return false;
        }
      }

      return true;
    });
  }, [articles, savedFilter, categoryFilter, localeFilter, searchQuery, authors, tags, sources]);

  const selectedList = Object.keys(selectedIds).filter((id) => selectedIds[id]);

  const handleBulkStatusChange = (nextStatus: ArticleStatus) => {
    let updatedCount = 0;
    let deniedReason: string | undefined;
    for (const id of selectedList) {
      const res = transitionArticleStatus(id, nextStatus, 'Bulk status transition');
      if (res.ok) {
        updatedCount += 1;
      } else {
        deniedReason = res.error;
      }
    }
    setSelectedIds({});
    if (deniedReason) {
      setFeedback(`Updated ${updatedCount} article(s). Blocked: ${deniedReason}`);
    } else {
      setFeedback(`Updated ${updatedCount} article(s) to ${nextStatus}.`);
    }
  };

  return (
    <AppShell
      title="Articles"
      breadcrumbs={[{ label: 'Articles' }]}
      actions={
        <Link
          href="/articles/new"
          className="px-3.5 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Article</span>
        </Link>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Scientific Articles ({filteredArticles.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search by title, slug, author, category, tag, language, or source DOI.
            </p>
          </div>

          {/* Saved Filter Tabs (Spec §6) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'drafts', label: 'My Drafts' },
                { id: 'in_review', label: 'In Review' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'published', label: 'Published' },
                { id: 'needs_attention', label: 'Needs Attention' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSavedFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  savedFilter === tab.id
                    ? 'bg-white dark:bg-[#111c22] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="px-4 py-2 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between"
          >
            <span>{feedback}</span>
            <button type="button" onClick={() => setFeedback(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search articles by title, slug, author, tag, or DOI"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, slug, author, tag, or DOI (e.g. 10.1038)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Filter by discipline category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => !c.parentId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <select
              aria-label="Filter by language locale"
              value={localeFilter}
              onChange={(e) => setLocaleFilter(e.target.value as 'all' | 'en' | 'tr')}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Locales (EN &amp; TR)</option>
              <option value="en">English (EN)</option>
              <option value="tr">Türkçe (TR)</option>
            </select>

            {selectedList.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {selectedList.length} selected:
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('in_review')}
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Send to Review
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('archived')}
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Articles Data Table */}
        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all visible articles"
                    checked={
                      filteredArticles.length > 0 &&
                      filteredArticles.every((a) => selectedIds[a.id])
                    }
                    onChange={(e) => {
                      const next: Record<string, boolean> = {};
                      if (e.target.checked) {
                        filteredArticles.forEach((a) => {
                          next[a.id] = true;
                        });
                      }
                      setSelectedIds(next);
                    }}
                    className="rounded border-slate-300 text-[#087f83]"
                  />
                </th>
                <th className="py-3 px-3">Title &amp; Slug</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Lang</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sources</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No articles match your current filter. Click &ldquo;New Article&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => {
                  const cat = categories.find((c) => c.id === art.primaryCategoryId);
                  const author = authors.find((a) => a.id === art.authorId);
                  const hasSources = art.sourceIds.length > 0;

                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 align-top">
                        <input
                          type="checkbox"
                          aria-label={`Select ${art.title}`}
                          checked={!!selectedIds[art.id]}
                          onChange={() =>
                            setSelectedIds((prev) => ({
                              ...prev,
                              [art.id]: !prev[art.id],
                            }))
                          }
                          className="rounded border-slate-300 text-[#087f83]"
                        />
                      </td>
                      <td className="py-3 px-3 align-top max-w-md">
                        <Link
                          href={`/articles/${art.id}/edit`}
                          className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#087f83] dark:hover:text-teal-400 block leading-snug"
                        >
                          {art.title}
                        </Link>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">
                          /{art.slug} · v{art.version}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {cat?.name || 'Science'}
                      </td>
                      <td className="py-3 px-3 align-top font-mono uppercase text-slate-600 dark:text-slate-400">
                        {art.locale}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {author?.displayName || 'Staff'}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <span className="font-mono uppercase text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          {art.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {hasSources ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{art.sourceIds.length} DOI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>0 linked</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap font-mono tabular-nums text-slate-500">
                        <LocalizedDate iso={art.updatedAt} mode="date" />
                      </td>
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/articles/${art.id}/edit`}
                            title={`Edit ${art.title}`}
                            aria-label={`Edit ${art.title}`}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/articles/${art.id}/seo`}
                            title={`SEO & Quality Audit for ${art.title}`}
                            aria-label={`SEO & Quality Audit for ${art.title}`}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#087f83] dark:text-teal-400"
                          >
                            <SearchCheck className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/articles/${art.id}/preview`}
                            title={`Preview ${art.title}`}
                            aria-label={`Preview ${art.title}`}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = duplicateArticle(art.id);
                              if (copy) {
                                setFeedback(`Duplicated article with unique slug /${copy.slug}`);
                              }
                            }}
                            title={`Duplicate ${art.title}`}
                            aria-label={`Duplicate ${art.title}`}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => transitionArticleStatus(art.id, 'archived')}
                            title={`Archive ${art.title}`}
                            aria-label={`Archive ${art.title}`}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(art.id)}
                            title={`Delete ${art.title}`}
                            aria-label={`Delete ${art.title}`}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm article deletion"
              className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl"
            >
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Confirm Article Deletion
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to permanently remove this article from the local demo repository? Consider Archiving instead if you may need its revision history.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteArticle(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
