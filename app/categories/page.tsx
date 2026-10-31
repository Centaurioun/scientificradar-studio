'use client';

import React, { useState } from 'react';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Plus, Trash2, Tags, FolderTree } from 'lucide-react';

export default function CategoriesAndTagsPage() {
  const {
    categories,
    tags,
    articles,
    addCategory,
    deleteCategory,
    addTag,
    deleteTag,
  } = useStudio();

  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catDescription, setCatDescription] = useState('');

  const [tagName, setTagName] = useState('');
  const [tagAliases, setTagAliases] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const topCategories = categories.filter((c) => !c.parentId);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const created = addCategory({
      name: catName,
      parentId: catParentId || undefined,
      description: catDescription,
      locale: 'en',
    });
    setCatName('');
    setCatDescription('');
    setNotice(`Added category "${created.name}" (/${created.slug}) — immediately available in Article Editor selectors.`);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    const aliasList = tagAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const created = addTag(tagName, aliasList);
    setTagName('');
    setTagAliases('');
    setNotice(`Saved normalized tag "${created.name}" (#${created.slug}).`);
  };

  return (
    <AppShell title="Categories & Tags" breadcrumbs={[{ label: 'Categories & Tags' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Scientific Taxonomy: Categories &amp; Tags
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            7 top-level scientific disciplines and 25+ subcategories, plus cross-disciplinary normalized tags. Audit live scientificradar.com URLs before production migration.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="p-3 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between"
          >
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Hierarchical Categories */}
          <div className="lg:col-span-7 space-y-5">
            {/* Add Category Form */}
            <form
              onSubmit={handleAddCategory}
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#087f83]" />
                <span>Add Category or Subcategory</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-cat-name" className="block text-[11px] text-slate-500 mb-1">
                    Category Name *
                  </label>
                  <input
                    id="new-cat-name"
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g., Astrobiology"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="new-cat-parent" className="block text-[11px] text-slate-500 mb-1">
                    Parent Discipline (Optional)
                  </label>
                  <select
                    id="new-cat-parent"
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="">Top-Level Discipline</option>
                    {topCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Optional editorial scope description..."
                  aria-label="Category description"
                  className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>
            </form>

            {/* Category Hierarchy Tree */}
            <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
              {topCategories.map((top) => {
                const children = categories.filter((c) => c.parentId === top.id);
                const count = articles.filter((a) => a.categoryIds.includes(top.id)).length;
                return (
                  <div key={top.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {top.name}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-slate-400">
                          /{top.slug} · {count} article(s)
                        </span>
                        {top.description && (
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                            {top.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCategory(top.id)}
                        aria-label={`Delete category ${top.name}`}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {children.length > 0 && (
                      <div className="pl-3 pt-1 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        {children.map((sub, idx) => (
                          <React.Fragment key={sub.id}>
                            {idx > 0 && <span className="text-slate-300">·</span>}
                            <span className="inline-flex items-center gap-1">
                              <span>{sub.name}</span>
                              <button
                                type="button"
                                onClick={() => deleteCategory(sub.id)}
                                aria-label={`Remove subcategory ${sub.name}`}
                                className="text-slate-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Columns: Cross-Disciplinary Normalized Tags */}
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={handleAddTag}
              className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Tags className="w-4 h-4 text-[#087f83]" />
                <span>Add Cross-Disciplinary Tag</span>
              </div>

              <div>
                <label htmlFor="new-tag-name" className="block text-[11px] text-slate-500 mb-1">
                  Tag Name (Case-insensitive deduplicated) *
                </label>
                <input
                  id="new-tag-name"
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., Superconducting Qubits"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label htmlFor="new-tag-aliases" className="block text-[11px] text-slate-500 mb-1">
                  Synonyms / Aliases (comma-separated)
                </label>
                <input
                  id="new-tag-aliases"
                  type="text"
                  value={tagAliases}
                  onChange={(e) => setTagAliases(e.target.value)}
                  placeholder="Transmon, Josephson Junction"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Normalized Tag</span>
              </button>
            </form>

            <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Active Tags ({tags.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tags.map((t) => {
                  const usedCount = articles.filter((a) => a.tagIds.includes(t.id)).length;
                  return (
                    <div
                      key={t.id}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          #{t.slug} · {usedCount} article(s)
                          {t.aliases && t.aliases.length > 0
                            ? ` · Aliases: ${t.aliases.join(', ')}`
                            : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTag(t.id)}
                        aria-label={`Delete tag ${t.name}`}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
