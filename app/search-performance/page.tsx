'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Plug } from 'lucide-react';

export default function SearchPerformancePage() {
  return (
    <AppShell title="Search Performance" breadcrumbs={[{ label: 'Search Performance' }]}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
            <Plug className="w-5 h-5 text-amber-500" />
            <span>Search Console Performance: Not Connected Yet (P0 Prototype)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Google Search Console integration is deferred to P2 and requires explicit property verification and authorization. ScientificRadar Studio never displays fabricated query impressions or click-through charts.
          </p>
          <Link
            href="/settings/integrations"
            className="inline-block text-[#087f83] dark:text-teal-400 font-semibold hover:underline"
          >
            View Google Search Console Integration Card →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
