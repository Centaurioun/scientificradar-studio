'use client';

import React from 'react';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { LocalizedDate } from '@/components/datetime/localized-date';

export default function AuditLogsPage() {
  const { auditEvents } = useStudio();

  return (
    <AppShell
      title="Audit Logs"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Audit Logs' },
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Editorial &amp; Administrative Audit Log ({auditEvents.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological record of article updates, status transitions, accepted local check diffs, and navigation changes in the P0 prototype store.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] text-slate-500 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    <LocalizedDate iso={ev.timestamp} mode="datetime" includeZoneName />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {ev.actor}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {ev.action}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                    {ev.targetTitle}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {ev.details}
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
