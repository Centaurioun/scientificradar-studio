'use client';

import React from 'react';
import { useStudio } from '@/lib/studio-context';
import { AppShell, ALL_NAV_ITEMS } from '@/components/layout/app-shell';
import { RotateCcw, Sliders, LayoutDashboard } from 'lucide-react';

export default function NavigationSettingsPage() {
  const {
    navigation,
    setNavPreset,
    toggleNavItemVisibility,
    toggleDashboardWidget,
    resetNavigationToBalanced,
  } = useStudio();

  const groups = ['GENERAL', 'CONTENT', 'EDITORIAL', 'TOOLS', 'ADMINISTRATION'] as const;

  return (
    <AppShell
      title="Dashboard & Navigation"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Dashboard & Navigation' },
      ]}
      actions={
        <button
          type="button"
          onClick={resetNavigationToBalanced}
          className="px-3.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Defaults (Balanced)</span>
        </button>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard &amp; Sidebar Navigation Customization
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Show or hide individual sidebar modules without deleting implementation or underlying records (AT-02, AT-03). Preferences persist across browser reloads. Note: Hiding a menu entry is a UI preference and does not revoke authorization.
          </p>
        </div>

        {/* Navigation Presets */}
        <section className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#087f83]" />
              <span>1. Sidebar Navigation Presets (Active: {navigation.preset.toUpperCase()})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setNavPreset('balanced')}
              className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                navigation.preset === 'balanced'
                  ? 'border-[#087f83] bg-[#087f83]/10 dark:bg-teal-500/15'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Balanced Preset (Recommended)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shows core editorial modules while keeping advanced items (Videos, Revisions, Roles) tucked away.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setNavPreset('show_all')}
              className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                navigation.preset === 'show_all'
                  ? 'border-[#087f83] bg-[#087f83]/10 dark:bg-teal-500/15'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Show All Modules
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reveals every Content, Editorial, Tool, and Administration item in the left sidebar.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setNavPreset('minimal')}
              className={`p-3.5 rounded-lg border text-left space-y-1 transition-all ${
                navigation.preset === 'minimal'
                  ? 'border-[#087f83] bg-[#087f83]/10 dark:bg-teal-500/15'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Minimal Writer View
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Focuses strictly on Dashboard, Articles, Pages, Media, and Settings.
              </p>
            </button>
          </div>
        </section>

        {/* Individual Module Show/Hide Toggles */}
        <section className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            2. Individual Sidebar Module Toggles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((grp) => {
              const items = ALL_NAV_ITEMS.filter((i) => i.group === grp);
              return (
                <div
                  key={grp}
                  className="p-3.5 rounded border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {grp}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const isLockedSafetyItem = item.id === 'settings_navigation';
                      const visible =
                        isLockedSafetyItem || !!navigation.visibleItems[item.id];
                      return (
                        <label
                          key={item.id}
                          className="flex items-center justify-between py-1 cursor-pointer"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.label}
                            {isLockedSafetyItem && (
                              <span className="ml-1.5 text-[10px] text-slate-400">
                                (Always visible for safety)
                              </span>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            aria-label={`Toggle ${item.label} in sidebar`}
                            disabled={isLockedSafetyItem}
                            checked={visible}
                            onChange={() => toggleNavItemVisibility(item.id)}
                            className="rounded border-slate-300 text-[#087f83] focus:ring-[#087f83]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard Widget Visibility */}
        <section className="p-5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-[#087f83]" />
            <span>3. Editorial Dashboard Widget Visibility</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                { key: 'metrics', label: 'Publishing Metric Strip' },
                { key: 'continueEditing', label: 'Continue Editing Drafts' },
                { key: 'requiresAttention', label: 'Requires Editorial Attention' },
                { key: 'upcomingCalendar', label: 'Upcoming Publication Dates' },
                { key: 'recentActivity', label: 'Recent Activity Feed' },
              ] as const
            ).map((w) => (
              <label
                key={w.key}
                className="p-3 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {w.label}
                </span>
                <input
                  type="checkbox"
                  checked={navigation.dashboardWidgets[w.key]}
                  onChange={() => toggleDashboardWidget(w.key)}
                  className="rounded border-slate-300 text-[#087f83]"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
