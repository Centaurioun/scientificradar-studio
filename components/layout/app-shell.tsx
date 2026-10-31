'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStudio } from '@/lib/studio-context';
import { NavItemId, UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Tags,
  Image as ImageIcon,
  Layers,
  Globe,
  Video,
  CheckSquare,
  Calendar,
  Users,
  History,
  Sparkles,
  SearchCheck,
  Link2,
  BarChart3,
  Settings,
  Sliders,
  Plug,
  Shield,
  ClipboardList,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';

export interface NavItemDefinition {
  id: NavItemId;
  label: string;
  href: string;
  group: 'GENERAL' | 'CONTENT' | 'EDITORIAL' | 'TOOLS' | 'ADMINISTRATION';
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}

export const ALL_NAV_ITEMS: NavItemDefinition[] = [
  // GENERAL
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', group: 'GENERAL', icon: LayoutDashboard },
  // CONTENT
  { id: 'articles', label: 'Articles', href: '/articles', group: 'CONTENT', icon: FileText },
  { id: 'pages', label: 'Pages', href: '/pages', group: 'CONTENT', icon: BookOpen },
  { id: 'categories', label: 'Categories & Tags', href: '/categories', group: 'CONTENT', icon: Tags },
  { id: 'media', label: 'Media Library', href: '/media', group: 'CONTENT', icon: ImageIcon },
  { id: 'series', label: 'Series & Collections', href: '/series', group: 'CONTENT', icon: Layers },
  { id: 'homepage', label: 'Homepage & Menus', href: '/homepage', group: 'CONTENT', icon: Globe },
  { id: 'videos', label: 'Videos', href: '/videos', group: 'CONTENT', icon: Video, badgeText: 'Opt' },
  // EDITORIAL
  { id: 'review', label: 'Review Queue', href: '/review', group: 'EDITORIAL', icon: CheckSquare },
  { id: 'calendar', label: 'Publishing Calendar', href: '/calendar', group: 'EDITORIAL', icon: Calendar },
  { id: 'authors', label: 'Authors & Editors', href: '/authors', group: 'EDITORIAL', icon: Users },
  { id: 'revisions', label: 'Revision History', href: '/revisions', group: 'EDITORIAL', icon: History },
  // TOOLS
  { id: 'assistant', label: 'Codex Assistant', href: '/assistant', group: 'TOOLS', icon: Sparkles, badgeText: 'Local' },
  { id: 'seo', label: 'SEO & Quality Center', href: '/seo', group: 'TOOLS', icon: SearchCheck },
  { id: 'knowledge_links', label: 'Smart Knowledge Links', href: '/knowledge-links', group: 'TOOLS', icon: Link2 },
  { id: 'search_performance', label: 'Search Performance', href: '/search-performance', group: 'TOOLS', icon: BarChart3 },
  // ADMINISTRATION
  { id: 'settings_general', label: 'General Settings', href: '/settings', group: 'ADMINISTRATION', icon: Settings },
  { id: 'settings_navigation', label: 'Dashboard & Navigation', href: '/settings/navigation', group: 'ADMINISTRATION', icon: Sliders },
  { id: 'settings_integrations', label: 'Integrations', href: '/settings/integrations', group: 'ADMINISTRATION', icon: Plug },
  { id: 'settings_roles', label: 'Roles & Permissions', href: '/settings/roles', group: 'ADMINISTRATION', icon: Shield, badgeText: 'P1' },
  { id: 'settings_audit', label: 'Audit Logs', href: '/settings/audit', group: 'ADMINISTRATION', icon: ClipboardList },
];

const GROUPS: Array<'GENERAL' | 'CONTENT' | 'EDITORIAL' | 'TOOLS' | 'ADMINISTRATION'> = [
  'GENERAL',
  'CONTENT',
  'EDITORIAL',
  'TOOLS',
  'ADMINISTRATION',
];

export function AppShell({
  children,
  title,
  breadcrumbs,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    articles,
    pages,
    navigation,
    theme,
    setTheme,
    activeRole,
    setActiveRole,
    toggleNavGroupCollapsed,
    setSidebarCollapsed,
    persistenceMode,
  } = useStudio();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K global command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if (e.key === 'Escape' && commandOpen) {
        setCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandOpen]);

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [commandOpen]);

  const filteredArticles = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles.slice(0, 5);

  const filteredPages = searchQuery.trim()
    ? pages.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : pages.slice(0, 3);

  const filteredRoutes = searchQuery.trim()
    ? ALL_NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_NAV_ITEMS.filter((i) => navigation.visibleItems[i.id]).slice(0, 6);

  const isCollapsed = navigation.sidebarCollapsed;

  return (
    <div className="min-h-screen flex bg-[#f7f9fa] dark:bg-[#0b1216] text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Primary Editorial Navigation"
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] transition-all duration-150 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap truncate"
            >
              <span className="w-6 h-6 rounded bg-[#087f83] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                SR
              </span>
              <span>ScientificRadar Studio</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick New Article Action in Sidebar */}
        <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/articles/new"
            className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-medium transition-colors whitespace-nowrap ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Create New Scientific Article"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>New Article</span>}
          </Link>
        </div>

        {/* Grouped Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {GROUPS.map((group) => {
            // Settings -> Dashboard & Navigation is always kept reachable for safety even if customized
            const groupItems = ALL_NAV_ITEMS.filter(
              (item) =>
                item.group === group &&
                (navigation.visibleItems[item.id] || item.id === 'settings_navigation')
            );
            if (groupItems.length === 0) return null;

            const groupCollapsed = !!navigation.collapsedGroups[group];

            return (
              <div key={group} className="space-y-1">
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleNavGroupCollapsed(group)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <span>{group}</span>
                    {groupCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}

                {(!groupCollapsed || isCollapsed) && (
                  <div className="space-y-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/settings' &&
                          item.href !== '/dashboard' &&
                          pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={isCollapsed ? item.label : undefined}
                          className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#087f83]/10 text-[#087f83] dark:bg-teal-500/15 dark:text-teal-300 font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!isCollapsed && item.badgeText && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                              {item.badgeText}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Safety Disclosure */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-medium text-slate-700 dark:text-slate-300">
              P0 Isolated Prototype
            </div>
            <div>
              Local IndexedDB Store · <span className="font-mono">scientificradar.com</span> untouched
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-[#111c22] h-full flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                ScientificRadar Studio
              </span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <Link
                href="/articles/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-[#087f83] text-white text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New Article</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
              {GROUPS.map((group) => {
                const items = ALL_NAV_ITEMS.filter(
                  (i) =>
                    i.group === group &&
                    (navigation.visibleItems[i.id] || i.id === 'settings_navigation')
                );
                if (items.length === 0) return null;
                return (
                  <div key={group} className="space-y-1">
                    <div className="px-2 text-[11px] font-semibold text-slate-400">
                      {group}
                    </div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Left: Mobile Trigger + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
              <Link
                href="/dashboard"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                Studio
              </Link>
              {breadcrumbs?.map((b, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 truncate max-w-[180px]"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                      {b.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
              {!breadcrumbs && title && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Center/Right: Global Search Command, Demo Role Switcher, Theme Toggle, Contextual Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Search / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Search articles, pages, and navigation (Ctrl+K)"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search studio...</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono px-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Demo Role Switcher per Section 14 */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <label htmlFor="demo-role-select" className="text-slate-400 dark:text-slate-500 text-[11px]">
                Demo Role:
              </label>
              <select
                id="demo-role-select"
                aria-label="Demo Role Switcher"
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#087f83]"
              >
                <option value="owner">Owner / Admin (Demo)</option>
                <option value="editor">Editor (Demo)</option>
                <option value="author">Author / Contributor (Demo)</option>
                <option value="reviewer">Reviewer (Demo)</option>
              </select>
            </div>

            {/* Light / Dark Mode Switch */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {actions}
          </div>
        </header>

        {/* Memory fallback warning banner if IndexedDB is blocked */}
        {persistenceMode === 'memory_fallback' && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Browser IndexedDB storage is unavailable in this frame; running with in-memory demo fallback. Use Settings → Export JSON to save work.
            </span>
          </div>
        )}

        {/* Main Workspace Viewport */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Command Palette Modal (Cmd/Ctrl+K) */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 p-4"
          onClick={() => setCommandOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global Command & Article Search"
            className="w-full max-w-xl bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, slug, or jump to module..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded"
              >
                Esc
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Articles ({filteredArticles.length})
                </div>
                <div className="space-y-1 mt-1">
                  {filteredArticles.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        setCommandOpen(false);
                        router.push(`/articles/${art.id}/edit`);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {art.title}
                      </span>
                      <span className="text-slate-400 font-mono shrink-0">
                        {art.locale.toUpperCase()} · {art.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {filteredPages.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Pages
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredPages.map((pg) => (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => {
                          setCommandOpen(false);
                          router.push(`/pages/${pg.id}/edit`);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span className="text-slate-800 dark:text-slate-200">{pg.title}</span>
                        <span className="text-slate-400 font-mono">/{pg.slug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Studio Navigation
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {filteredRoutes.map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => {
                        setCommandOpen(false);
                        router.push(rt.href);
                      }}
                      className="text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
