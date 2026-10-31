'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Video } from 'lucide-react';

export default function VideosModulePage() {
  return (
    <AppShell title="Videos" breadcrumbs={[{ label: 'Videos' }]}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
            <Video className="w-5 h-5 text-[#087f83]" />
            <span>Scientific Video Dispatches (Optional Content Module)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Per Master Specification §8, <strong>Videos</strong> is a content format rather than a primary scientific discipline category. This optional module is hidden by default in the <code>Balanced</code> navigation preset and can be toggled in <strong>Settings → Dashboard &amp; Navigation</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
