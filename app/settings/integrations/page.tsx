'use client';

import React, { useState } from 'react';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Plug, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatLocalizedInstant, resolveEffectiveDatePrefs } from '@/lib/datetime/format';

export default function IntegrationsSettingsPage() {
  const { integrations, dateTimePreferences } = useStudio();
  const [testedIds, setTestedIds] = useState<Record<string, string>>({});

  const handleTruthfulHealthCheck = (id: string, name: string) => {
    const formattedTime = formatLocalizedInstant(
      new Date().toISOString(),
      resolveEffectiveDatePrefs(dateTimePreferences),
      { mode: 'time' }
    );
    setTestedIds((prev) => ({
      ...prev,
      [id]: `Checked at ${formattedTime}: Not connected yet — no credentials or external endpoints configured in P0 isolated prototype.`,
    }));
    void name;
  };

  return (
    <AppShell
      title="Integrations"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Integrations' },
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            External Integrations &amp; Provider Adapters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Truthful integration states per Master Specification §15 (AT-22, AT-23). In P0 prototype mode, no external credentials or live services are contacted. Google AdSense is strictly publisher display monetization (never Google Ads campaign buying).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((conn) => (
            <div
              key={conn.id}
              className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Plug className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{conn.name}</span>
                  </div>
                  <span className="font-mono uppercase text-[11px] text-amber-700 dark:text-amber-400 font-semibold shrink-0">
                    Not Connected
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Intended Use:</strong> {conn.intendedUse}
                </p>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>P0 Prototype Behavior:</strong> {conn.p0Behavior}
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Env placeholders (.env.example): {conn.requiredEnvVars.join(', ')}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{conn.statusDetail}</span>
                  <button
                    type="button"
                    onClick={() => handleTruthfulHealthCheck(conn.id, conn.name)}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium shrink-0"
                  >
                    Test Connection
                  </button>
                </div>

                {testedIds[conn.id] && (
                  <div
                    role="status"
                    className="p-2 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{testedIds[conn.id]}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#087f83] shrink-0" />
          <span>
            <strong>Security Guarantee:</strong> No live API secrets are stored in client code or localStorage, and no unofficial ChatGPT/Codex session scraping is permitted.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
