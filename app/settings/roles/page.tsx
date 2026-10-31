'use client';

import React from 'react';
import { useStudio } from '@/lib/studio-context';
import { UserRole } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Shield } from 'lucide-react';

export default function RolesSettingsPage() {
  const { activeRole, setActiveRole } = useStudio();

  const roles: Array<{ role: UserRole; title: string; permissions: string }> = [
    {
      role: 'owner',
      title: 'Owner / Admin',
      permissions:
        'Full access to modules, taxonomy, navigation defaults, integrations, and demo publication.',
    },
    {
      role: 'editor',
      title: 'Managing / Science Editor',
      permissions:
        'Creates/edits articles, verifies sources, reviews assistant changes, approves, schedules, and publishes.',
    },
    {
      role: 'reviewer',
      title: 'Peer / Editorial Reviewer',
      permissions:
        'Reviews submitted manuscripts, records sign-off notes, approves or requests revision. Cannot publish directly.',
    },
    {
      role: 'author',
      title: 'Author / Contributor',
      permissions:
        'Authors drafts and submits for review without bypassing editorial approval.',
    },
  ];

  return (
    <AppShell
      title="Roles & Permissions"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Roles & Permissions' },
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Editorial Roles &amp; Access Control (P0 Demo Simulation / P1 Server RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a simulated role below to test editorial state transition rules in the Review Queue and Article Editor. Production server-side RBAC is scheduled for Gate P1.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {roles.map((r) => {
            const isActive = activeRole === r.role;
            return (
              <div
                key={r.role}
                className={`p-5 rounded-lg border bg-white dark:bg-[#111c22] space-y-2 ${
                  isActive
                    ? 'border-[#087f83] ring-2 ring-[#087f83]/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#087f83]" />
                    <span>{r.title}</span>
                  </div>
                  {isActive ? (
                    <span className="font-mono uppercase text-[11px] font-bold text-[#087f83] dark:text-teal-400">
                      Active Demo Role
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveRole(r.role)}
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                    >
                      Switch to {r.role}
                    </button>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300">{r.permissions}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
