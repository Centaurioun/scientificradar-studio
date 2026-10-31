'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { validateSafeUrl } from '@/lib/editorial-rules';
import { AppShell } from '@/components/layout/app-shell';
import {
  Globe,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

export default function HomepageAndMenusPage() {
  const {
    articles,
    homepageBlocks,
    menus,
    updateHomepageBlocks,
    updateMenus,
  } = useStudio();

  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuHref, setNewMenuHref] = useState('');
  const [menuError, setMenuError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [previewVisibilityMode, setPreviewVisibilityMode] = useState<
    'public_published_only' | 'internal_editorial'
  >('public_published_only');

  const sortedBlocks = [...homepageBlocks].sort((a, b) => a.order - b.order);
  const primaryMenu = menus.find((m) => m.location === 'primary') || menus[0];
  const publishedArticles = articles.filter((a) => a.status === 'published');
  const visiblePreviewArticles =
    previewVisibilityMode === 'public_published_only' ? publishedArticles : articles;

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sortedBlocks.length) return;
    const copy = [...sortedBlocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    const reindexed = copy.map((b, idx) => ({ ...b, order: idx + 1 }));
    updateHomepageBlocks(reindexed);
  };

  const handleHeroArticleChange = (blockId: string, articleId: string) => {
    const next = homepageBlocks.map((b) =>
      b.id === blockId ? { ...b, articleIds: [articleId] } : b
    );
    updateHomepageBlocks(next);
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError(null);
    if (!newMenuLabel.trim() || !newMenuHref.trim()) return;
    const check = validateSafeUrl(newMenuHref);
    if (!check.valid) {
      setMenuError(check.reason || 'Unsafe URL');
      return;
    }
    const nextMenus = menus.map((m) =>
      m.id === primaryMenu.id
        ? {
            ...m,
            items: [
              ...m.items,
              {
                id: `mi-${Date.now()}`,
                label: newMenuLabel.trim(),
                href: newMenuHref.trim(),
                targetType: newMenuHref.startsWith('/') ? ('page' as const) : ('external' as const),
              },
            ],
          }
        : m
    );
    updateMenus(nextMenus);
    setNewMenuLabel('');
    setNewMenuHref('');
  };

  const heroBlock = sortedBlocks.find((b) => b.type === 'hero');
  const configuredHero = articles.find((a) => a.id === heroBlock?.articleIds[0]);
  const heroArticle =
    previewVisibilityMode === 'public_published_only'
      ? configuredHero?.status === 'published'
        ? configuredHero
        : publishedArticles[0]
      : configuredHero || articles[0];

  return (
    <AppShell title="Homepage & Menus" breadcrumbs={[{ label: 'Homepage & Menus' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Homepage Blocks &amp; Site Navigation Menus
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure predefined editorial blocks (Hero, Featured Grid, Recent Feed, Integrity Banner) and dual hover/click navigation menus.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Local Demo Preview Only — scientificradar.com untouched</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Columns: Predefined Homepage Blocks & Menu Controls */}
          <div className="lg:col-span-6 space-y-5">
            <section className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1. Predefined Homepage Sections (Order &amp; Lead Story)
              </h2>

              <div className="space-y-2.5">
                {sortedBlocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        <input
                          type="checkbox"
                          checked={block.enabled}
                          onChange={() =>
                            updateHomepageBlocks(
                              homepageBlocks.map((b) =>
                                b.id === block.id ? { ...b, enabled: !b.enabled } : b
                              )
                            )
                          }
                          className="rounded border-slate-300 text-[#087f83]"
                        />
                        <span>
                          {idx + 1}. {block.title}
                        </span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(idx, -1)}
                          aria-label={`Move ${block.title} up`}
                          className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(idx, 1)}
                          aria-label={`Move ${block.title} down`}
                          className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {block.type === 'hero' && (
                      <div>
                        <label
                          htmlFor="select-hero-article"
                          className="block text-[11px] text-slate-500 mb-1"
                        >
                          Lead Hero Article (AT-13):
                        </label>
                        <select
                          id="select-hero-article"
                          value={block.articleIds[0] || ''}
                          onChange={(e) => handleHeroArticleChange(block.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          {articles.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title} ({a.locale.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Primary Navigation Menu Editor */}
            <section className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. Primary Navigation Menu Items
              </h2>
              <p className="text-[11px] text-slate-500">
                Supports both hover-to-open and click-to-open dropdowns on desktop, with separate toggle buttons so parent category links remain clickable (Spec §7).
              </p>

              <form onSubmit={handleAddMenuItem} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newMenuLabel}
                  onChange={(e) => setNewMenuLabel(e.target.value)}
                  placeholder="Menu Label (e.g., Quantum)"
                  aria-label="New menu item label"
                  className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={newMenuHref}
                  onChange={(e) => setNewMenuHref(e.target.value)}
                  placeholder="/categories?cat=quantum"
                  aria-label="New menu item target URL"
                  className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#087f83] text-white font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </form>
              {menuError && <div className="text-red-600 text-[11px]">{menuError}</div>}
            </section>
          </div>

          {/* Right 6 Columns: Live Representative Homepage & Menu Preview */}
          <div className="lg:col-span-6 bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Representative Front-Page &amp; Menu Preview</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewVisibilityMode('public_published_only')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    previewVisibilityMode === 'public_published_only'
                      ? 'bg-[#087f83] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Simulated Public (Published Only)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVisibilityMode('internal_editorial')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    previewVisibilityMode === 'internal_editorial'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Internal Preview (All Statuses)
                </button>
              </div>
            </div>

            {/* Interactive Preview Header with Hover + Click Dropdown */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                ScientificRadar
              </span>
              <nav
                aria-label="Preview Site Navigation"
                className="flex flex-wrap items-center gap-4 text-xs"
              >
                {primaryMenu.items.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isOpen = openDropdownId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="relative flex items-center gap-0.5"
                      onMouseEnter={() => hasChildren && setOpenDropdownId(item.id)}
                      onMouseLeave={() => hasChildren && setOpenDropdownId(null)}
                    >
                      <Link
                        href={item.href}
                        className="font-medium text-slate-700 dark:text-slate-200 hover:text-[#087f83]"
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          aria-label={`Toggle ${item.label} submenu`}
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenDropdownId((prev) => (prev === item.id ? null : item.id))
                          }
                          className="p-0.5 text-slate-400 hover:text-slate-800"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasChildren && isOpen && (
                        <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-[#15222a] border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1.5 z-20">
                          {item.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              href={sub.href}
                              className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Rendered Homepage Blocks */}
            <div className="p-5 space-y-6 text-xs">
              {sortedBlocks
                .filter((b) => b.enabled)
                .map((block) => {
                  if (block.type === 'hero' && heroArticle) {
                    return (
                      <div
                        key={block.id}
                        className="p-5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#087f83] dark:text-teal-400 font-semibold">
                            Lead Science Story
                          </span>
                          {heroArticle.status !== 'published' && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                              Internal Preview — Status: {heroArticle.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {heroArticle.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {heroArticle.summary}
                        </p>
                        <Link
                          href={`/articles/${heroArticle.id}/preview`}
                          className="inline-block pt-1 font-semibold text-[#087f83] dark:text-teal-400 hover:underline"
                        >
                          Read full article preview →
                        </Link>
                      </div>
                    );
                  }

                  if (block.type === 'editorial_banner') {
                    return (
                      <div
                        key={block.id}
                        className="p-3.5 rounded border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-medium"
                      >
                        {block.bannerText}
                      </div>
                    );
                  }

                  return (
                    <div key={block.id} className="space-y-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
                        {block.title}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visiblePreviewArticles
                          .filter((a) => a.id !== heroArticle?.id)
                          .slice(0, 2)
                          .map((art) => (
                            <div
                              key={art.id}
                              className="p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1"
                            >
                              {art.status !== 'published' && (
                                <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                  Internal Preview — {art.status.replace('_', ' ')}
                                </span>
                              )}
                              <Link
                                href={`/articles/${art.id}/preview`}
                                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#087f83] block"
                              >
                                {art.title}
                              </Link>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {art.locale.toUpperCase()} · {art.status}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
