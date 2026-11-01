'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStudio } from '@/lib/studio-context';
import { EditorialPage, Locale } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { ArticleTiptapEditor } from './article-tiptap-editor';
import { Save, Eye } from 'lucide-react';

export function PageWorkspace({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const { pages, savePage } = useStudio();

  const existing = pageId ? pages.find((p) => p.id === pageId) : undefined;

  const [title, setTitle] = useState(existing?.title || '');
  const [slug, setSlug] = useState(existing?.slug || '');
  const [locale, setLocale] = useState<Locale>(existing?.locale || 'en');
  const [summary, setSummary] = useState(existing?.summary || '');
  const [bodyHtml, setBodyHtml] = useState(
    existing?.bodyHtml || '<h2>Institutional Policy Section</h2><p>Enter page content...</p>'
  );
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>(
    existing?.body || { type: 'doc', content: [] }
  );
  const [template, setTemplate] = useState<EditorialPage['template']>(
    existing?.template || 'policy'
  );
  const [status, setStatus] = useState<EditorialPage['status']>(
    existing?.status || 'draft'
  );
  const [navigationVisibility, setNavigationVisibility] = useState(
    existing?.navigationVisibility ?? true
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    const timer = window.setTimeout(() => {
      setTitle(existing.title);
      setSlug(existing.slug);
      setLocale(existing.locale);
      setSummary(existing.summary);
      setBodyHtml(existing.bodyHtml);
      setTemplate(existing.template);
      setStatus(existing.status);
      setNavigationVisibility(existing.navigationVisibility);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [existing]);

  const handleSave = async () => {
    if (!title.trim()) {
      setNotice('Page title (H1) is required.');
      return;
    }
    let saved: EditorialPage;
    try {
      saved = await savePage({
        id: existing?.id || pageId,
        title,
        slug: slug || title,
        locale,
        summary,
        body: bodyJson,
        bodyHtml,
        template,
        status,
        navigationVisibility,
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Page changes were not saved.');
      return;
    }
    setNotice(`Saved page "${saved.title}" in local demo repository.`);
    if (!existing) {
      router.replace(`/pages/${saved.id}/edit`);
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Pages', href: '/pages' },
        { label: title || 'New Static Page' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {existing && (
            <Link
              href={`/pages/${existing.id}/preview`}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Page</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Page</span>
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
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

        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#087f83] dark:text-teal-400 font-semibold">
            Static / Institutional Page · Title = Sole &lt;H1&gt;
          </div>

          <div>
            <label htmlFor="page-title-input" className="sr-only">
              Page Title (H1)
            </label>
            <input
              id="page-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Page Title (e.g., Editorial Policy, About Us, Corrections Protocol)..."
              className="w-full text-2xl font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label htmlFor="page-slug-input" className="block text-[11px] text-slate-500 mb-1">
                Slug
              </label>
              <input
                id="page-slug-input"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="editorial-policy"
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>

            <div>
              <label htmlFor="page-template-select" className="block text-[11px] text-slate-500 mb-1">
                Template
              </label>
              <select
                id="page-template-select"
                value={template}
                onChange={(e) => setTemplate(e.target.value as EditorialPage['template'])}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="policy">Policy / Protocol</option>
                <option value="standard">Standard Page</option>
                <option value="landing">Landing / Overview</option>
              </select>
            </div>

            <div>
              <label htmlFor="page-status-select" className="block text-[11px] text-slate-500 mb-1">
                Status
              </label>
              <select
                id="page-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as EditorialPage['status'])}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="draft">Draft</option>
                <option value="published">Published (Demo)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="page-locale-select" className="block text-[11px] text-slate-500 mb-1">
                Locale
              </label>
              <select
                id="page-locale-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              >
                <option value="en">EN</option>
                <option value="tr">TR</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="page-summary-input" className="block text-[11px] text-slate-500 mb-1">
              Page Summary / Subtitle
            </label>
            <input
              id="page-summary-input"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview of this institutional page..."
              className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        <ArticleTiptapEditor
          initialHtml={bodyHtml}
          onChange={(nextHtml, nextJson) => {
            setBodyHtml(nextHtml);
            setBodyJson(nextJson);
          }}
        />
      </div>
    </AppShell>
  );
}
