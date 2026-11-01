'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { AppShell } from '@/components/layout/app-shell';
import {
  Download,
  Upload,
  RotateCcw,
  Sliders,
  Plug,
  Shield,
  ClipboardList,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_DATETIME_PREFS,
  HourCycleOption,
  resolveEffectiveDatePrefs,
} from '@/lib/datetime/format';
import { LocalizedDate } from '@/components/datetime/localized-date';

const LOCALE_OPTIONS = [
  { value: 'tr-TR', label: 'Türkçe — Türkiye (tr-TR, Default Editorial)' },
  { value: 'en-US', label: 'English — United States (en-US)' },
  { value: 'en-GB', label: 'English — United Kingdom (en-GB)' },
  { value: 'de-DE', label: 'Deutsch — Deutschland (de-DE)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (TRT, UTC+3 — Default)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time — DST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST — DST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST — DST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
];

export default function GeneralSettingsPage() {
  const {
    exportSnapshotJson,
    importSnapshotJson,
    resetDemoDatabase,
    persistenceMode,
    dateTimePreferences,
    setDateTimePreferences,
    simulateSaveFailure,
    setSimulateSaveFailure,
  } = useStudio();

  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const effectivePrefs = resolveEffectiveDatePrefs(dateTimePreferences);

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

  const handleImport = async () => {
    if (!jsonInput.trim()) return;
    const res = await importSnapshotJson(jsonInput);
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
            Configure publication metadata, date/time localization, navigation customization,
            disconnected external integrations, and local demo persistence backups.
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

        {/* Date & Time Localization Preferences (Gate V5-A) */}
        <section
          aria-labelledby="datetime-settings-heading"
          className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="datetime-settings-heading"
                className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-[#087f83] dark:text-teal-400" />
                <span>Date &amp; Time Localization Preferences</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Controls how dates, timestamps, and scheduled publication slots are formatted and
                interpreted across the administration workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDateTimePreferences(DEFAULT_ADMIN_DATETIME_PREFS);
                setMessage(
                  'Restored default editorial Date & Time preferences (tr-TR · Europe/Istanbul · 24-hour).'
                );
              }}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Reset to tr-TR / Istanbul Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pref-locale-select" className="block font-semibold mb-1">
                Display Locale
              </label>
              <select
                id="pref-locale-select"
                value={effectivePrefs.locale}
                onChange={(e) => {
                  setDateTimePreferences({ locale: e.target.value });
                  setMessage(`Updated display locale to ${e.target.value}.`);
                }}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pref-timezone-select" className="block font-semibold mb-1">
                Editorial IANA Time Zone
              </label>
              <select
                id="pref-timezone-select"
                value={effectivePrefs.timeZone}
                onChange={(e) => {
                  setDateTimePreferences({ timeZone: e.target.value });
                  setMessage(`Updated editorial timezone to ${e.target.value}.`);
                }}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pref-hourcycle-select" className="block font-semibold mb-1">
                Clock Format (24h / 12h)
              </label>
              <select
                id="pref-hourcycle-select"
                value={effectivePrefs.hourCycle}
                onChange={(e) => {
                  setDateTimePreferences({ hourCycle: e.target.value as HourCycleOption });
                  setMessage(`Updated clock format to ${e.target.value}.`);
                }}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="24">24-hour Clock (14:30)</option>
                <option value="12">12-hour Clock (02:30 PM)</option>
                <option value="auto">Automatic (Follow Locale Default)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-500">
              Live Formatting Preview (Reference Instant{' '}
              <code className="font-mono">2026-10-31T14:30:00Z</code>):
            </span>
            <span
              data-testid="datetime-settings-preview"
              className="font-mono font-bold text-slate-900 dark:text-slate-100"
            >
              <LocalizedDate
                iso="2026-10-31T14:30:00Z"
                mode="datetime"
                includeZoneName
              />
            </span>
          </div>
        </section>

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

          {/* QA Storage Failure Simulation Toggle */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  QA Test Mode: Simulate Storage Write Failure
                </span>
                <p className="text-[11px] text-slate-500">
                  When enabled, editor saves return a failedSaveReceipt so you can test the
                  unsaved-changes alert and Retry Save recovery flow.
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={simulateSaveFailure}
                onChange={(e) => setSimulateSaveFailure(e.target.checked)}
                className="rounded border-slate-300 text-amber-600"
              />
              <span>{simulateSaveFailure ? 'Simulating Save Failure' : 'Normal Storage'}</span>
            </label>
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
