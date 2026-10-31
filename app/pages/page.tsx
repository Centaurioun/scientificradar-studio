'use client';

import React from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Plus, Eye, Edit3, Trash2 } from 'lucide-react';
import { LocalizedDate } from '@/components/datetime/localized-date';

export default function PagesListPage() {
  const { pages, deletePage } = useStudio();

  return (
    <AppShell
      title="Pages"
      breadcrumbs={[{ label: 'Pages' }]}
      actions={
        <Link
          href="/pages/new"
          className="px-3.5 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </Link>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Institutional &amp; Static Pages ({pages.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage About Us, Editorial Policy, Corrections Protocol, Accessibility Statement, and custom pages in the wide Tiptap editor.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] text-slate-500 font-semibold">
                <th className="py-3 px-4">Page Title &amp; Slug</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Locale</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pages.map((pg) => (
                <tr key={pg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/pages/${pg.id}/edit`}
                      className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#087f83] block"
                    >
                      {pg.title}
                    </Link>
                    <div className="text-[11px] font-mono text-slate-400">
                      /{pg.slug} · {pg.summary.slice(0, 64)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-600 dark:text-slate-300">
                    {pg.template}
                  </td>
                  <td className="py-3.5 px-4 font-mono uppercase">{pg.locale}</td>
                  <td className="py-3.5 px-4 font-mono uppercase font-semibold">
                    {pg.status}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    <LocalizedDate iso={pg.updatedAt} mode="date" />
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/pages/${pg.id}/edit`}
                        aria-label={`Edit ${pg.title}`}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/pages/${pg.id}/preview`}
                        aria-label={`Preview ${pg.title}`}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deletePage(pg.id)}
                        aria-label={`Delete ${pg.title}`}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
