'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import { Download, Upload, RotateCcw, Sliders, Plug, Shield, ClipboardList } from 'lucide-react';

export default function GeneralSettingsPage() {
  const { exportSnapshotJson, importSnapshotJson, resetDemoDatabase, persistenceMode } =
    useStudio();

  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const json = exportSnapshotJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scientificradar-studio-p0-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported local demo repository snapshot as JSON.');
  };

  const handleImport = () => {
    if (!jsonInput.trim()) return;
    const res = importSnapshotJson(jsonInput);
    if (!res.ok) {
      setMessage(`Import failed: ${res.error}`);
    } else {
      setJsonInput('');
      setMessage('Successfully restored repository snapshot from JSON.');
    }
  };

  return (
    <AppShell title="General Settings" breadcrumbs={[{ label: 'Settings' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Publication &amp; Administration Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure publication metadata, navigation customization, disconnected external integrations, and local demo persistence backups.
          </p>
        </div>

        {/* Settings Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Link
            href="/settings/navigation"
            className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] space-y-1"
          >
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#087f83]" />
              <span>Dashboard &amp; Navigation</span>
            </div>
            <p className="text-slate-500">Show/hide sidebar modules &amp; presets</p>
          </Link>

          <Link
            href="/settings/integrations"
            className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] space-y-1"
          >
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Plug className="w-4 h-4 text-[#087f83]" />
              <span>Integrations (7)</span>
            </div>
            <p className="text-slate-500">Codex, Cloudflare R2, GA4, AdSense, GSC, GTM</p>
          </Link>

          <Link
            href="/settings/roles"
            className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] space-y-1"
          >
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#087f83]" />
              <span>Roles &amp; Permissions</span>
            </div>
            <p className="text-slate-500">Editorial RBAC matrix (P0 Demo / P1 Server)</p>
          </Link>

          <Link
            href="/settings/audit"
            className="p-4 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 hover:border-[#087f83] space-y-1"
          >
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-[#087f83]" />
              <span>Audit Logs</span>
            </div>
            <p className="text-slate-500">Timestamped editorial &amp; status events</p>
          </Link>
        </div>

        {message && (
          <div className="p-3 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200 text-xs text-teal-900 dark:text-teal-200">
            {message}
          </div>
        )}

        {/* Publication Profile & Safety Contract */}
        <section className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Publication Identity &amp; Safety Contract
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-slate-500 mb-1">Publication Name</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                ScientificRadar (Studio Prototype)
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Production Domain Isolation</div>
              <div className="font-mono text-emerald-700 dark:text-emerald-400">
                https://scientificradar.com — UNTOUCHED (Isolated Demo State)
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Supported Content Locales</div>
              <div className="font-mono">en (English) · tr (Türkçe)</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Active Persistence Adapter</div>
              <div className="font-mono uppercase">{persistenceMode}</div>
            </div>
          </div>
        </section>

        {/* Backup / Export / Import / Reset */}
        <section className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Local Demo Repository Backup &amp; Reset
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 rounded bg-[#087f83] hover:bg-[#086b70] text-white font-semibold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Repository JSON</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await resetDemoDatabase();
                setMessage('Reset local demo repository to initial seeded records.');
              }}
              className="px-3.5 py-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seeded Demo Data</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label htmlFor="import-json-textarea" className="block font-semibold">
              Import Repository Snapshot JSON
            </label>
            <textarea
              id="import-json-textarea"
              rows={3}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste exported JSON snapshot here..."
              className="w-full p-2.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-[11px]"
            />
            <button
              type="button"
              onClick={handleImport}
              className="px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Snapshot</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
