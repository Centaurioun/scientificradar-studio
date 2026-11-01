'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import {
  Article,
  ArticleRevision,
  ArticleStatus,
  AuditEvent,
  AuthorProfile,
  Category,
  EditorialChange,
  EditorialPage,
  HomepageBlock,
  IntegrationConnection,
  KnowledgeLink,
  MediaAsset,
  MenuConfig,
  NavigationPreference,
  NavItemId,
  NavPreset,
  SaveReceipt,
  ScientificSource,
  Series,
  Tag,
  UserRole,
} from './types';
import {
  SEED_ARTICLES,
  SEED_AUDIT_EVENTS,
  SEED_AUTHORS,
  SEED_CATEGORIES,
  SEED_HOMEPAGE_BLOCKS,
  SEED_INTEGRATIONS,
  SEED_KNOWLEDGE_LINKS,
  SEED_MEDIA,
  SEED_MENUS,
  SEED_PAGES,
  SEED_REVISIONS,
  SEED_SERIES,
  SEED_TAGS,
  SEED_SOURCES,
} from './seed-data';
import {
  canTransitionStatus,
  ensureUniqueSlug,
  getDefaultNavigationPreference,
  getPresetVisibility,
  normalizeArticleTagIds,
  sanitizeAndDemoteBodyH1,
  slugify,
  validateSafeUrl,
} from './editorial-rules';
import {
  DateTimePreferences,
  DEFAULT_ADMIN_DATETIME_PREFS,
} from './datetime/format';
import { AuditReport, FixProposal } from './audit/types';
import { computeArticleFingerprint, runArticleAudit } from './audit/run-article-audit';
import { validateAndSanitizeSnapshot } from './backup-validation';
import { trustedMediaSourceSet } from './html-security';
import { commitSnapshotMutation } from './studio-persistence';

const DB_NAME = 'scientificradar-studio-p0-db';
const DB_VERSION = 1;
const STORE_NAME = 'studio_state';
const STATE_KEY = 'root_snapshot_v1';

export interface StudioDatabaseSnapshot {
  schemaVersion?: 1;
  /** Monotonic revision for committed root-snapshot mutations (legacy records omit it). */
  storageRevision?: number;
  articles: Article[];
  pages: EditorialPage[];
  categories: Category[];
  tags: Tag[];
  series: Series[];
  authors: AuthorProfile[];
  media: MediaAsset[];
  sources: ScientificSource[];
  knowledgeLinks: KnowledgeLink[];
  revisions: ArticleRevision[];
  homepageBlocks: HomepageBlock[];
  menus: MenuConfig[];
  navigation: NavigationPreference;
  auditEvents: AuditEvent[];
  integrations: IntegrationConnection[];
  activeRole: UserRole;
  theme: 'light' | 'dark';
  dateTimePreferences: DateTimePreferences;
  auditReportsByArticleId: Record<string, AuditReport>;
}

function getInitialSeedSnapshot(): StudioDatabaseSnapshot {
  return {
    schemaVersion: 1,
    articles: SEED_ARTICLES,
    pages: SEED_PAGES,
    categories: SEED_CATEGORIES,
    tags: SEED_TAGS,
    series: SEED_SERIES,
    authors: SEED_AUTHORS,
    media: SEED_MEDIA,
    sources: SEED_SOURCES,
    knowledgeLinks: SEED_KNOWLEDGE_LINKS,
    revisions: SEED_REVISIONS,
    homepageBlocks: SEED_HOMEPAGE_BLOCKS,
    menus: SEED_MENUS,
    navigation: getDefaultNavigationPreference(),
    auditEvents: SEED_AUDIT_EVENTS,
    integrations: SEED_INTEGRATIONS,
    activeRole: 'editor',
    theme: 'light',
    dateTimePreferences: DEFAULT_ADMIN_DATETIME_PREFS,
    auditReportsByArticleId: {},
  };
}

async function getDb(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  } catch {
    return null;
  }
}

interface StudioContextValue extends StudioDatabaseSnapshot {
  isHydrated: boolean;
  persistenceMode: 'indexeddb' | 'memory_fallback';
  simulateSaveFailure: boolean;
  setSimulateSaveFailure: (val: boolean) => void;
  // Theme, Role & Date/Time Preferences
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveRole: (role: UserRole) => void;
  setDateTimePreferences: (prefs: Partial<DateTimePreferences>) => void;
  // Navigation customization
  setNavPreset: (preset: NavPreset) => void;
  toggleNavItemVisibility: (id: NavItemId) => void;
  toggleNavGroupCollapsed: (groupName: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleDashboardWidget: (widget: keyof NavigationPreference['dashboardWidgets']) => void;
  resetNavigationToBalanced: () => void;
  // Articles CRUD & Verified Persistence
  saveArticle: (
    articleInput: Partial<Article> & { id?: string; title: string },
    options?: { createRevision?: boolean; revisionSource?: ArticleRevision['source']; revisionSummary?: string }
  ) => Promise<{ article: Article; demotedH1Count: number }>;
  persistArticleDraft: (
    articleInput: Partial<Article> & { id?: string; title: string },
    options?: {
      expectedVersion?: number;
      createRevision?: boolean;
      revisionSource?: ArticleRevision['source'];
      revisionSummary?: string;
    }
  ) => Promise<SaveReceipt>;
  duplicateArticle: (articleId: string) => Article | null;
  transitionArticleStatus: (
    articleId: string,
    nextStatus: ArticleStatus,
    note?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteArticle: (articleId: string) => void;
  restoreArticleRevision: (revisionId: string) => Article | null;
  applyAssistantChanges: (articleId: string, acceptedChanges: EditorialChange[]) => Promise<{ ok: boolean; error?: string; updatedArticle?: Article }>;
  // SEO & Quality Audit
  runAndStoreArticleAudit: (articleId: string, draftOverride?: Article) => AuditReport | null;
  applyQuickFixProposal: (proposal: FixProposal) => Promise<{ ok: boolean; error?: string; updatedArticle?: Article }>;
  // Pages CRUD
  savePage: (pageInput: Partial<EditorialPage> & { id?: string; title: string }) => EditorialPage;
  deletePage: (pageId: string) => void;
  // Categories, Tags, Series, Authors
  addCategory: (cat: Omit<Category, 'id' | 'slug'> & { slug?: string }) => Category;
  deleteCategory: (id: string) => void;
  addTag: (name: string, aliases?: string[]) => Tag;
  deleteTag: (id: string) => void;
  saveSeries: (seriesInput: Partial<Series> & { title: string }) => Series;
  saveAuthor: (authorInput: Partial<AuthorProfile> & { displayName: string }) => AuthorProfile;
  // Sources & Knowledge Links
  saveSource: (sourceInput: Partial<ScientificSource> & { title: string; url: string }) => ScientificSource;
  updateSource: (sourceId: string, patch: Partial<ScientificSource>) => void;
  deleteSource: (sourceId: string) => void;
  saveKnowledgeLink: (klInput: Partial<KnowledgeLink> & { term: string; targetUrl: string }) => KnowledgeLink;
  // Media Library
  addMediaAsset: (assetInput: Partial<MediaAsset> & { filename: string; title: string; src: string }) => MediaAsset;
  updateMediaAsset: (id: string, patch: Partial<MediaAsset>) => void;
  deleteMediaAsset: (id: string) => void;
  // Homepage & Menus
  updateHomepageBlocks: (blocks: HomepageBlock[]) => void;
  updateMenus: (menus: MenuConfig[]) => void;
  // Backup / Reset
  exportSnapshotJson: () => string;
  importSnapshotJson: (rawJson: string) => Promise<{ ok: boolean; error?: string }>;
  resetDemoDatabase: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioDatabaseSnapshot>(() => getInitialSeedSnapshot());
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<'indexeddb' | 'memory_fallback'>('indexeddb');
  const [simulateSaveFailure, setSimulateSaveFailure] = useState(false);
  const stateRef = useRef<StudioDatabaseSnapshot>(state);
  const mutationTailRef = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted state from IndexedDB (with localStorage backup sync for instant read)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const db = await getDb();
        if (db) {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const saved = (await transaction.store.get(STATE_KEY)) as StudioDatabaseSnapshot | undefined;
          if (saved && Array.isArray(saved.articles)) {
            await transaction.done;
            const validated = validateAndSanitizeSnapshot(
              JSON.stringify(saved),
              trustedMediaSourceSet([...SEED_MEDIA.map((item) => item.src), ...saved.media.map((item) => item.src)])
            );
            if (!validated.snapshot) throw new Error(validated.error || 'Persisted snapshot is invalid');
            const migrated = validated.snapshot as unknown as StudioDatabaseSnapshot;
            if (!cancelled) {
              setState(migrated);
              document.documentElement.classList.toggle('dark', migrated.theme === 'dark');
              setIsHydrated(true);
            }
            return;
          }
          // Seed initial DB
          const seed = getInitialSeedSnapshot();
          await transaction.store.put(seed, STATE_KEY);
          await transaction.done;
          if (!cancelled) {
            setState(seed);
            document.documentElement.classList.toggle('dark', seed.theme === 'dark');
            setIsHydrated(true);
          }
        } else {
          setPersistenceMode('memory_fallback');
          setIsHydrated(true);
        }
      } catch {
        if (!cancelled) {
          setPersistenceMode('memory_fallback');
          setIsHydrated(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistState = useCallback(
    async (nextState: StudioDatabaseSnapshot): Promise<{ ok: boolean; volatileMemoryOnly: boolean; error?: string }> => {
      if (simulateSaveFailure) {
        return {
          ok: false,
          volatileMemoryOnly: persistenceMode === 'memory_fallback',
          error: 'Simulated storage write failure (QA test mode enabled in Settings). Changes remain unsaved.',
        };
      }
      try {
        const db = await getDb();
        if (db) {
          const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, undefined>(
            db,
            STORE_NAME,
            STATE_KEY,
            getInitialSeedSnapshot(),
            () => ({ snapshot: nextState, result: undefined })
          );
          stateRef.current = committed.snapshot;
          return { ok: true, volatileMemoryOnly: false };
        } else {
          setPersistenceMode('memory_fallback');
          return { ok: true, volatileMemoryOnly: true };
        }
      } catch (err) {
        setPersistenceMode('memory_fallback');
        return {
          ok: false,
          volatileMemoryOnly: true,
          error: err instanceof Error ? err.message : 'IndexedDB write failed',
        };
      }
    },
    [simulateSaveFailure, persistenceMode]
  );

  const updateState = useCallback(
    (updater: (prev: StudioDatabaseSnapshot) => StudioDatabaseSnapshot) => {
      // React updater functions must stay pure. Apply optimistically, then replay
      // the same functional mutation against the authoritative IDB record.
      const optimistic = updater(stateRef.current);
      stateRef.current = optimistic;
      setState(optimistic);
      const queued = mutationTailRef.current.then(async () => {
        if (simulateSaveFailure) return false;
        const db = await getDb();
        if (!db) {
          setPersistenceMode('memory_fallback');
          return false;
        }
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, undefined>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => ({ snapshot: updater(latest), result: undefined })
        );
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return true;
      }).catch(() => {
        setPersistenceMode('memory_fallback');
        return false;
      });
      mutationTailRef.current = queued.then(() => undefined);
      return queued;
    },
    [simulateSaveFailure]
  );

  const appendAudit = useCallback(
    (
      prev: StudioDatabaseSnapshot,
      action: string,
      targetType: AuditEvent['targetType'],
      targetTitle: string,
      details: string
    ): AuditEvent[] => {
      const actorMap: Record<UserRole, string> = {
        owner: 'Admin Owner (Demo)',
        editor: 'Dr. Elena Rostova (Editor)',
        author: 'Dr. Kerem Aydın (Author)',
        reviewer: 'Prof. Marcus Thorne (Reviewer)',
      };
      const event: AuditEvent = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actor: actorMap[prev.activeRole],
        role: prev.activeRole,
        action,
        targetType,
        targetTitle,
        details,
      };
      return [event, ...prev.auditEvents.slice(0, 99)];
    },
    []
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      updateState((prev) => ({ ...prev, theme }));
    },
    [updateState]
  );

  const setActiveRole = useCallback(
    (activeRole: UserRole) => {
      updateState((prev) => ({
        ...prev,
        activeRole,
        auditEvents: appendAudit(
          prev,
          `Switched demo role to ${activeRole.toUpperCase()}`,
          'system',
          'Role Switcher (Demo)',
          'Simulated editorial permission profile changed'
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const setDateTimePreferences = useCallback(
    (prefs: Partial<DateTimePreferences>) => {
      updateState((prev) => {
        const nextPrefs: DateTimePreferences = {
          ...(prev.dateTimePreferences || DEFAULT_ADMIN_DATETIME_PREFS),
          ...prefs,
        };
        return {
          ...prev,
          dateTimePreferences: nextPrefs,
          auditEvents: appendAudit(
            prev,
            'Updated Date & Time localization preferences',
            'system',
            'Date & Time Settings',
            `Locale: ${nextPrefs.locale} · Time Zone: ${nextPrefs.timeZone} · Clock: ${nextPrefs.hourCycle}`
          ),
        };
      });
    },
    [updateState, appendAudit]
  );

  const setNavPreset = useCallback(
    (preset: NavPreset) => {
      updateState((prev) => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          preset,
          visibleItems: preset === 'custom' ? prev.navigation.visibleItems : getPresetVisibility(preset),
        },
        auditEvents: appendAudit(
          prev,
          `Applied navigation preset: ${preset}`,
          'navigation',
          'Sidebar Navigation',
          `Preset set to ${preset}`
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const toggleNavItemVisibility = useCallback(
    (id: NavItemId) => {
      updateState((prev) => {
        const nextVal = !prev.navigation.visibleItems[id];
        return {
          ...prev,
          navigation: {
            ...prev.navigation,
            preset: 'custom',
            visibleItems: {
              ...prev.navigation.visibleItems,
              [id]: nextVal,
            },
          },
          auditEvents: appendAudit(
            prev,
            `${nextVal ? 'Showed' : 'Hid'} sidebar item: ${id}`,
            'navigation',
            id,
            'UI menu visibility changed (records remain preserved in local store)'
          ),
        };
      });
    },
    [updateState, appendAudit]
  );

  const toggleNavGroupCollapsed = useCallback(
    (groupName: string) => {
      updateState((prev) => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          collapsedGroups: {
            ...prev.navigation.collapsedGroups,
            [groupName]: !prev.navigation.collapsedGroups[groupName],
          },
        },
      }));
    },
    [updateState]
  );

  const setSidebarCollapsed = useCallback(
    (sidebarCollapsed: boolean) => {
      updateState((prev) => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          sidebarCollapsed,
        },
      }));
    },
    [updateState]
  );

  const toggleDashboardWidget = useCallback(
    (widget: keyof NavigationPreference['dashboardWidgets']) => {
      updateState((prev) => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          dashboardWidgets: {
            ...prev.navigation.dashboardWidgets,
            [widget]: !prev.navigation.dashboardWidgets[widget],
          },
        },
      }));
    },
    [updateState]
  );

  const resetNavigationToBalanced = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      navigation: getDefaultNavigationPreference(),
      auditEvents: appendAudit(
        prev,
        'Restored default Balanced navigation',
        'navigation',
        'Sidebar & Dashboard',
        'Reset all menu visibility and widget toggles to Balanced defaults'
      ),
    }));
  }, [updateState, appendAudit]);

  const buildUpdatedArticleSnapshot = useCallback(
    (
      prev: StudioDatabaseSnapshot,
      articleInput: Partial<Article> & { id?: string; title: string },
      options?: {
        createRevision?: boolean;
        revisionSource?: ArticleRevision['source'];
        revisionSummary?: string;
      }
    ): { nextState: StudioDatabaseSnapshot; updatedArticle: Article; demotedH1Count: number } => {
      const now = new Date().toISOString();
      const existing = articleInput.id
        ? prev.articles.find((a) => a.id === articleInput.id)
        : undefined;

      const locale = articleInput.locale || existing?.locale || 'en';
      const rawHtml =
        articleInput.bodyHtml !== undefined
          ? articleInput.bodyHtml
          : existing?.bodyHtml || '<p></p>';
      const sanitized = sanitizeAndDemoteBodyH1(
        rawHtml,
        trustedMediaSourceSet(prev.media.map((media) => media.src))
      );

      const desiredSlug = articleInput.slug || existing?.slug || articleInput.title;
      const uniqueSlug = ensureUniqueSlug(
        desiredSlug,
        locale,
        prev.articles,
        existing?.id
      );

      const nextVersion = existing ? existing.version + 1 : 1;

      const normalizedTags = normalizeArticleTagIds(articleInput.tagIds ?? existing?.tagIds ?? []);

      const updatedArticle: Article = {
        id: existing?.id || articleInput.id || `art-${Date.now()}`,
        locale,
        title: articleInput.title.trim() || 'Untitled Scientific Article',
        slug: uniqueSlug,
        summary: articleInput.summary ?? existing?.summary ?? '',
        body: articleInput.body ?? existing?.body ?? { type: 'doc', content: [] },
        bodyHtml: sanitized.sanitizedHtml,
        status: articleInput.status ?? existing?.status ?? 'draft',
        primaryCategoryId: articleInput.primaryCategoryId ?? existing?.primaryCategoryId ?? 'cat-physics',
        categoryIds: articleInput.categoryIds ?? existing?.categoryIds ?? ['cat-physics'],
        tagIds: normalizedTags.tagIds,
        seriesId: articleInput.seriesId !== undefined ? articleInput.seriesId : existing?.seriesId,
        authorId: articleInput.authorId ?? existing?.authorId ?? 'auth-elena',
        sourceIds: articleInput.sourceIds ?? existing?.sourceIds ?? [],
        featuredMediaId:
          articleInput.featuredMediaId !== undefined
            ? articleInput.featuredMediaId
            : existing?.featuredMediaId,
        seo: {
          title: articleInput.seo?.title ?? existing?.seo?.title ?? '',
          description: articleInput.seo?.description ?? existing?.seo?.description ?? '',
          canonical: articleInput.seo?.canonical ?? existing?.seo?.canonical ?? '',
          noindex: true,
        },
        scheduledAt:
          articleInput.scheduledAt !== undefined ? articleInput.scheduledAt : existing?.scheduledAt,
        publishedAt:
          articleInput.publishedAt !== undefined ? articleInput.publishedAt : existing?.publishedAt,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        version: nextVersion,
        reviewNotes: articleInput.reviewNotes ?? existing?.reviewNotes ?? [],
      };

      const nextArticles = existing
        ? prev.articles.map((a) => (a.id === existing.id ? updatedArticle : a))
        : [updatedArticle, ...prev.articles];

      let nextRevisions = prev.revisions;
      if (options?.createRevision || !existing) {
        const rev: ArticleRevision = {
          id: `rev-${updatedArticle.id}-v${updatedArticle.version}-${Date.now()}`,
          articleId: updatedArticle.id,
          version: updatedArticle.version,
          snapshot: updatedArticle,
          source: options?.revisionSource || 'editor',
          createdAt: now,
          summary:
            options?.revisionSummary ||
            (existing ? `Saved snapshot v${updatedArticle.version}` : 'Created initial draft v1'),
        };
        nextRevisions = [rev, ...prev.revisions];
      }

      const nextState: StudioDatabaseSnapshot = {
        ...prev,
        articles: nextArticles,
        revisions: nextRevisions,
        auditEvents: appendAudit(
          prev,
          existing ? 'Updated article' : 'Created new article',
          'article',
          updatedArticle.title,
          `Slug: /${updatedArticle.slug} · Status: ${updatedArticle.status} · v${updatedArticle.version}`
        ),
      };

      return { nextState, updatedArticle, demotedH1Count: sanitized.demotedH1Count };
    },
    [appendAudit]
  );

  const saveArticle = useCallback(
    async (
      articleInput: Partial<Article> & { id?: string; title: string },
      options?: {
        createRevision?: boolean;
        revisionSource?: ArticleRevision['source'];
        revisionSummary?: string;
      }
    ): Promise<{ article: Article; demotedH1Count: number }> => {
      if (simulateSaveFailure) throw new Error('Simulated storage write failure; changes remain unsaved.');
      const db = await getDb();
      if (!db) throw new Error('IndexedDB is unavailable; changes remain unsaved.');
      type Result = { conflict: string } | { built: ReturnType<typeof buildUpdatedArticleSnapshot> };
      const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, Result>(db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(), (latest) => {
        const existing = articleInput.id ? latest.articles.find((a) => a.id === articleInput.id) : undefined;
        if (articleInput.id && !existing && articleInput.version !== undefined) {
          return { snapshot: latest, result: { conflict: `Article ${articleInput.id} was removed from storage.` } };
        }
        if (existing && articleInput.version !== undefined && existing.version !== articleInput.version) {
          return { snapshot: latest, result: { conflict: `Article changed in another tab (stored v${existing.version}; expected v${articleInput.version}).` } };
        }
        const built = buildUpdatedArticleSnapshot(latest, articleInput, options);
        return { snapshot: built.nextState, result: { built } };
      });
      if ('conflict' in committed.result) throw new Error(committed.result.conflict);
      stateRef.current = committed.snapshot;
      setState(committed.snapshot);
      return { article: committed.result.built.updatedArticle, demotedH1Count: committed.result.built.demotedH1Count };
    },
    [buildUpdatedArticleSnapshot, simulateSaveFailure]
  );

  const persistArticleDraft = useCallback(
    async (
      articleInput: Partial<Article> & { id?: string; title: string },
      options?: {
        expectedVersion?: number;
        createRevision?: boolean;
        revisionSource?: ArticleRevision['source'];
        revisionSummary?: string;
      }
    ): Promise<SaveReceipt> => {
      if (simulateSaveFailure) {
        return { ok: false, savedAt: new Date().toISOString(), version: options?.expectedVersion || 1, demotedH1Count: 0, volatileMemoryOnly: persistenceMode === 'memory_fallback', error: 'Simulated storage write failure. Changes remain unsaved.' };
      }
      const db = await getDb();
      if (!db) {
        setPersistenceMode('memory_fallback');
        return { ok: false, savedAt: new Date().toISOString(), version: options?.expectedVersion || 1, demotedH1Count: 0, volatileMemoryOnly: true, error: 'IndexedDB is unavailable. Draft remains unsaved in this tab.' };
      }
      try {
        type ArticleSaveResult = { conflict: string; version: number; savedAt: string; demotedH1Count: number } | { built: ReturnType<typeof buildUpdatedArticleSnapshot> };
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, ArticleSaveResult>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => {
            const existing = articleInput.id ? latest.articles.find((a) => a.id === articleInput.id) : undefined;
            if (articleInput.id && !existing && options?.expectedVersion !== undefined) {
              return { snapshot: latest, result: { conflict: `Article ${articleInput.id} was removed from storage while this draft was open.`, version: options.expectedVersion, savedAt: new Date().toISOString(), demotedH1Count: 0 } };
            }
            if (existing && options?.expectedVersion !== undefined && existing.version !== options.expectedVersion) {
              return { snapshot: latest, result: { conflict: `Version conflict: stored article is v${existing.version} while editor base was v${options.expectedVersion}.`, version: existing.version, savedAt: existing.updatedAt, demotedH1Count: 0 } };
            }
            const built = buildUpdatedArticleSnapshot(latest, articleInput, options);
            return { snapshot: built.nextState, result: { built } };
          }
        );
        if ('conflict' in committed.result) {
          return { ok: false, savedAt: committed.result.savedAt, version: committed.result.version, demotedH1Count: 0, volatileMemoryOnly: false, error: committed.result.conflict };
        }
        const built = committed.result.built;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, savedAt: built.updatedArticle.updatedAt, version: built.updatedArticle.version, demotedH1Count: built.demotedH1Count, volatileMemoryOnly: false };
      } catch (err) {
        setPersistenceMode('memory_fallback');
        return {
          ok: false,
          savedAt: new Date().toISOString(),
          version: options?.expectedVersion || 1,
          demotedH1Count: 0,
          volatileMemoryOnly: false,
          error: err instanceof Error ? err.message : 'IndexedDB transaction failed; draft remains unsaved.',
        };
      }
    },
    [buildUpdatedArticleSnapshot, persistenceMode, simulateSaveFailure]
  );

  const runAndStoreArticleAudit = useCallback(
    (articleId: string, draftOverride?: Article): AuditReport | null => {
      let generatedReport: AuditReport | null = null;
      updateState((prev) => {
        const target = draftOverride || prev.articles.find((a) => a.id === articleId);
        if (!target) return prev;
        const report = runArticleAudit({
          article: target,
          allArticles: prev.articles.map((a) => (a.id === target.id ? target : a)),
          categories: prev.categories,
          tags: prev.tags,
          sources: prev.sources,
          media: prev.media,
          knowledgeLinks: prev.knowledgeLinks,
          integrations: prev.integrations,
          executedAt: new Date().toISOString(),
        });
        generatedReport = report;
        return {
          ...prev,
          auditReportsByArticleId: {
            ...(prev.auditReportsByArticleId || {}),
            [target.id]: report,
          },
          auditEvents: appendAudit(
            prev,
            'Executed SEO & Editorial Quality Audit',
            'article',
            target.title,
            `Pass: ${report.counts.pass} · Warn: ${report.counts.warning} · Error: ${report.counts.error} · Unverified: ${report.counts.unverified}`
          ),
        };
      });
      return generatedReport;
    },
    [updateState, appendAudit]
  );

  const applyQuickFixProposal = useCallback(
    async (proposal: FixProposal): Promise<{ ok: boolean; error?: string; updatedArticle?: Article }> => {
      if (simulateSaveFailure) return { ok: false, error: 'Storage write failed; Quick Fix was not saved.' };
      const db = await getDb();
      if (!db) {
        setPersistenceMode('memory_fallback');
        return { ok: false, error: 'IndexedDB is unavailable; Quick Fix was not saved.' };
      }
      try {
        type QuickFixResult = { error: string } | { updatedArticle: Article };
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, QuickFixResult>(db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(), (prev) => {
        const article = prev.articles.find((a) => a.id === proposal.articleId);
        if (!article) {
          return { snapshot: prev, result: { error: 'Article not found' } };
        }
        const articleMedia = prev.media.filter((m) => m.id === article.featuredMediaId);
        const articleSources = prev.sources.filter((s) => article.sourceIds.includes(s.id));
        const currentFp = computeArticleFingerprint(article, articleMedia, articleSources);
        if (proposal.baseFingerprint && proposal.baseFingerprint !== currentFp) {
          return { snapshot: prev, result: { error: 'Article changed since this Quick Fix was generated. Re-run SEO Audit first.' } };
        }

        const now = new Date().toISOString();
        const nextVersion = article.version + 1;
        let nextArticle: Article = {
          ...article,
          seo: { ...article.seo },
          categoryIds: [...article.categoryIds],
          tagIds: [...article.tagIds],
          version: nextVersion,
          updatedAt: now,
        };

        if (proposal.targetPath === 'seo.title') {
          nextArticle.seo.title = proposal.after;
        } else if (proposal.targetPath === 'seo.description') {
          nextArticle.seo.description = proposal.after;
        } else if (proposal.targetPath === 'seo.canonical') {
          nextArticle.seo.canonical = proposal.after;
        } else if (proposal.targetPath === 'slug') {
          nextArticle.slug = ensureUniqueSlug(proposal.after, nextArticle.locale, prev.articles, nextArticle.id);
        } else if (proposal.targetPath === 'bodyHtml') {
          nextArticle.bodyHtml = sanitizeAndDemoteBodyH1(proposal.after).sanitizedHtml;
        } else if (proposal.targetPath === 'categoryIds') {
          const validSubIds = new Set(
            prev.categories.filter((c) => c.parentId === nextArticle.primaryCategoryId).map((c) => c.id)
          );
          nextArticle.categoryIds = Array.from(
            new Set([
              ...(nextArticle.primaryCategoryId ? [nextArticle.primaryCategoryId] : []),
              ...nextArticle.categoryIds.filter((id) => validSubIds.has(id)),
            ])
          );
        } else if (proposal.targetPath === 'tagIds') {
          nextArticle.tagIds = normalizeArticleTagIds(nextArticle.tagIds).normalizedIds;
        }

        const rev: ArticleRevision = {
          id: `rev-${nextArticle.id}-v${nextVersion}-${Date.now()}`,
          articleId: nextArticle.id,
          version: nextVersion,
          snapshot: nextArticle,
          source: 'assistant_review',
          createdAt: now,
          summary: `Quick Fix applied (${proposal.ruleId}): ${proposal.label}`,
        };

        const nextArticles = prev.articles.map((a) => (a.id === nextArticle.id ? nextArticle : a));
        const updatedReport = runArticleAudit({
          article: nextArticle,
          allArticles: nextArticles,
          categories: prev.categories,
          tags: prev.tags,
          sources: prev.sources,
          media: prev.media,
          knowledgeLinks: prev.knowledgeLinks,
          integrations: prev.integrations,
        });

        return { snapshot: {
          ...prev,
          articles: nextArticles,
          revisions: [rev, ...prev.revisions],
          auditReportsByArticleId: {
            ...(prev.auditReportsByArticleId || {}),
            [nextArticle.id]: updatedReport,
          },
          auditEvents: appendAudit(
            prev,
            `Applied deterministic Quick Fix (${proposal.ruleId})`,
            'article',
            nextArticle.title,
            `${proposal.label} -> saved as v${nextVersion}`
          ),
        }, result: { updatedArticle: nextArticle } };
        });
        if ('error' in committed.result) return { ok: false, error: committed.result.error };
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, updatedArticle: committed.result.updatedArticle };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'IndexedDB transaction failed; Quick Fix was not saved.' };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const duplicateArticle = useCallback(
    (articleId: string): Article | null => {
      let created: Article | null = null;
      updateState((prev) => {
        const orig = prev.articles.find((a) => a.id === articleId);
        if (!orig) return prev;
        const now = new Date().toISOString();
        const newTitle = `${orig.title} (Copy)`;
        const newSlug = ensureUniqueSlug(`${orig.slug}-copy`, orig.locale, prev.articles);
        const copy: Article = {
          ...orig,
          id: `art-${Date.now()}`,
          title: newTitle,
          slug: newSlug,
          status: 'draft',
          publishedAt: undefined,
          scheduledAt: undefined,
          createdAt: now,
          updatedAt: now,
          version: 1,
        };
        created = copy;
        return {
          ...prev,
          articles: [copy, ...prev.articles],
          auditEvents: appendAudit(
            prev,
            'Duplicated article',
            'article',
            copy.title,
            `Cloned from "${orig.title}" with unique slug /${copy.slug}`
          ),
        };
      });
      return created;
    },
    [updateState, appendAudit]
  );

  const transitionArticleStatus = useCallback(
    async (
      articleId: string,
      nextStatus: ArticleStatus,
      note?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      let outcome: { ok: boolean; error?: string } = { ok: true };
      const committed = await updateState((prev) => {
        const article = prev.articles.find((a) => a.id === articleId);
        if (!article) {
          outcome = { ok: false, error: 'Article not found' };
          return prev;
        }
        const check = canTransitionStatus(article.status, nextStatus, prev.activeRole);
        if (!check.allowed) {
          outcome = { ok: false, error: check.reason };
          return prev;
        }

        const now = new Date().toISOString();
        const nextVersion = article.version + 1;
        const reviewNotes = [...(article.reviewNotes || [])];
        if (note && note.trim()) {
          reviewNotes.unshift({
            id: `rn-${Date.now()}`,
            articleId: article.id,
            authorName: `${prev.activeRole.toUpperCase()} (Demo)`,
            role: prev.activeRole,
            note: note.trim(),
            action:
              nextStatus === 'approved'
                ? 'approve'
                : nextStatus === 'revision_requested'
                ? 'request_revision'
                : nextStatus === 'in_review'
                ? 'submit'
                : 'comment',
            createdAt: now,
            resolved: nextStatus === 'approved' || nextStatus === 'published',
          });
        }

        const updated: Article = {
          ...article,
          status: nextStatus,
          publishedAt: nextStatus === 'published' ? now : article.publishedAt,
          updatedAt: now,
          version: nextVersion,
          reviewNotes,
        };

        const rev: ArticleRevision = {
          id: `rev-${updated.id}-v${nextVersion}-${Date.now()}`,
          articleId: updated.id,
          version: nextVersion,
          snapshot: updated,
          source: nextStatus === 'published' ? 'publish' : 'review',
          createdAt: now,
          summary: `Status changed: ${article.status} -> ${nextStatus}${note ? ` (${note})` : ''}`,
        };

        return {
          ...prev,
          articles: prev.articles.map((a) => (a.id === articleId ? updated : a)),
          revisions: [rev, ...prev.revisions],
          auditEvents: appendAudit(
            prev,
            `Changed status to ${nextStatus}`,
            'article',
            updated.title,
            nextStatus === 'published'
              ? 'Published in local demo store only — scientificradar.com remains untouched'
              : `Transitioned ${article.status} -> ${nextStatus}`
          ),
        };
      });
      if (!committed) return { ok: false, error: 'Storage transaction failed; article status was not saved.' };
      return outcome;
    },
    [updateState, appendAudit]
  );

  const deleteArticle = useCallback(
    (articleId: string) => {
      updateState((prev) => {
        const target = prev.articles.find((a) => a.id === articleId);
        if (!target) return prev;
        return {
          ...prev,
          articles: prev.articles.filter((a) => a.id !== articleId),
          auditEvents: appendAudit(
            prev,
            'Deleted article',
            'article',
            target.title,
            `Removed article /${target.slug} from local demo store`
          ),
        };
      });
    },
    [updateState, appendAudit]
  );

  const restoreArticleRevision = useCallback(
    (revisionId: string): Article | null => {
      let restored: Article | null = null;
      updateState((prev) => {
        const rev = prev.revisions.find((r) => r.id === revisionId);
        if (!rev) return prev;
        const current = prev.articles.find((a) => a.id === rev.articleId);
        const now = new Date().toISOString();
        const nextVersion = (current?.version || rev.version) + 1;
        const restoredArticle: Article = {
          ...rev.snapshot,
          bodyHtml: sanitizeAndDemoteBodyH1(
            rev.snapshot.bodyHtml,
            trustedMediaSourceSet(prev.media.map((media) => media.src))
          ).sanitizedHtml,
          version: nextVersion,
          updatedAt: now,
        };
        restored = restoredArticle;
        const newRevision: ArticleRevision = {
          id: `rev-${restoredArticle.id}-v${nextVersion}-${Date.now()}`,
          articleId: restoredArticle.id,
          version: nextVersion,
          snapshot: restoredArticle,
          source: 'restore',
          createdAt: now,
          summary: `Restored from snapshot v${rev.version} (${rev.summary})`,
        };
        return {
          ...prev,
          articles: prev.articles.map((a) => (a.id === restoredArticle.id ? restoredArticle : a)),
          revisions: [newRevision, ...prev.revisions],
          auditEvents: appendAudit(
            prev,
            `Restored version v${rev.version} as new v${nextVersion}`,
            'article',
            restoredArticle.title,
            `Non-destructive version restore created v${nextVersion}`
          ),
        };
      });
      return restored;
    },
    [updateState, appendAudit]
  );

  const applyAssistantChanges = useCallback(
    async (
      articleId: string,
      acceptedChanges: EditorialChange[]
    ): Promise<{ ok: boolean; error?: string; updatedArticle?: Article }> => {
      let result: { ok: boolean; error?: string; updatedArticle?: Article } = { ok: false };
      const committed = await updateState((prev) => {
        const article = prev.articles.find((a) => a.id === articleId);
        if (!article) {
          result = { ok: false, error: 'Article not found' };
          return prev;
        }
        if (acceptedChanges.length === 0) {
          result = { ok: false, error: 'No changes selected to apply' };
          return prev;
        }
        // Version conflict guard per Section 12
        const stale = acceptedChanges.some((c) => c.baseVersion !== article.version);
        if (stale) {
          result = {
            ok: false,
            error: `Version conflict detected: Article was updated to v${article.version} after checks ran on v${acceptedChanges[0].baseVersion}. Please re-run checks.`,
          };
          return prev;
        }

        let nextArticle: Article = {
          ...article,
          seo: { ...article.seo },
          tagIds: [...article.tagIds],
        };
        let nextMedia = [...prev.media];

        for (const chg of acceptedChanges) {
          if (chg.targetPath === 'bodyHtml') {
            const sanitized = sanitizeAndDemoteBodyH1(
              nextArticle.bodyHtml,
              trustedMediaSourceSet(prev.media.map((media) => media.src))
            );
            nextArticle.bodyHtml = sanitized.sanitizedHtml;
          } else if (chg.targetPath === 'summary') {
            nextArticle.summary = chg.after;
          } else if (chg.targetPath === 'seo.title') {
            nextArticle.seo.title = chg.after;
          } else if (chg.targetPath === 'seo.description') {
            nextArticle.seo.description = chg.after;
          } else if (chg.targetPath === 'tagIds') {
            const desiredNames = chg.after.split(',').map((s) => s.trim().toLowerCase());
            const matchedIds = prev.tags
              .filter((t) => desiredNames.includes(t.name.toLowerCase()))
              .map((t) => t.id);
            nextArticle.tagIds = normalizeArticleTagIds([...nextArticle.tagIds, ...matchedIds]).tagIds;
          } else if (chg.targetPath === 'media.altText') {
            nextMedia = nextMedia.map((m) =>
              m.id === nextArticle.featuredMediaId || chg.id.endsWith(m.id)
                ? { ...m, altText: chg.after }
                : m
            );
          } else if (chg.targetPath === 'knowledgeLinks') {
            const kl = prev.knowledgeLinks.find(
              (k) => k.term.toLowerCase() === chg.before.toLowerCase()
            );
            if (kl) {
              const regex = new RegExp(`\\b(${kl.term})\\b`, 'i');
              nextArticle.bodyHtml = nextArticle.bodyHtml.replace(
                regex,
                `<a href="${kl.targetUrl}" data-knowledge-term="${kl.term.toLowerCase()}" target="${
                  kl.targetType === 'wikipedia' ? '_blank' : '_self'
                }" rel="noopener noreferrer">$1</a>`
              );
            }
          }
        }

        const now = new Date().toISOString();
        const nextVersion = article.version + 1;
        nextArticle = {
          ...nextArticle,
          bodyHtml: sanitizeAndDemoteBodyH1(
            nextArticle.bodyHtml,
            trustedMediaSourceSet(nextMedia.map((media) => media.src))
          ).sanitizedHtml,
          version: nextVersion,
          updatedAt: now,
        };

        const rev: ArticleRevision = {
          id: `rev-${nextArticle.id}-v${nextVersion}-${Date.now()}`,
          articleId: nextArticle.id,
          version: nextVersion,
          snapshot: nextArticle,
          source: 'assistant_review',
          createdAt: now,
          summary: `Accepted ${acceptedChanges.length} local check proposal(s): ${acceptedChanges
            .map((c) => c.label)
            .join('; ')}`,
        };

        result = { ok: true, updatedArticle: nextArticle };

        return {
          ...prev,
          articles: prev.articles.map((a) => (a.id === articleId ? nextArticle : a)),
          media: nextMedia,
          revisions: [rev, ...prev.revisions],
          auditEvents: appendAudit(
            prev,
            `Applied ${acceptedChanges.length} reviewed local check change(s)`,
            'assistant',
            nextArticle.title,
            `Saved as new version v${nextVersion} (previous version recoverable)`
          ),
        };
      });
      if (!committed) return { ok: false, error: 'Storage transaction failed; accepted changes were not saved.' };
      return result;
    },
    [updateState, appendAudit]
  );

  const savePage = useCallback(
    (pageInput: Partial<EditorialPage> & { id?: string; title: string }): EditorialPage => {
      let savedPage!: EditorialPage;
      updateState((prev) => {
        const now = new Date().toISOString();
        const existing = pageInput.id ? prev.pages.find((p) => p.id === pageInput.id) : undefined;
        const sanitized = sanitizeAndDemoteBodyH1(
          pageInput.bodyHtml ?? existing?.bodyHtml ?? '<p></p>',
          trustedMediaSourceSet(prev.media.map((media) => media.src))
        );
        const page: EditorialPage = {
          id: existing?.id || pageInput.id || `page-${Date.now()}`,
          title: pageInput.title.trim() || 'Untitled Page',
          slug: slugify(pageInput.slug || existing?.slug || pageInput.title) || 'untitled-page',
          locale: pageInput.locale || existing?.locale || 'en',
          summary: pageInput.summary ?? existing?.summary ?? '',
          body: pageInput.body ?? existing?.body ?? { type: 'doc', content: [] },
          bodyHtml: sanitized.sanitizedHtml,
          status: pageInput.status ?? existing?.status ?? 'draft',
          template: pageInput.template ?? existing?.template ?? 'standard',
          navigationVisibility:
            pageInput.navigationVisibility ?? existing?.navigationVisibility ?? true,
          seo: {
            title: pageInput.seo?.title ?? existing?.seo?.title ?? `${pageInput.title} | ScientificRadar`,
            description: pageInput.seo?.description ?? existing?.seo?.description ?? '',
            noindex: true,
          },
          updatedAt: now,
        };
        savedPage = page;
        return {
          ...prev,
          pages: existing
            ? prev.pages.map((p) => (p.id === existing.id ? page : p))
            : [page, ...prev.pages],
          auditEvents: appendAudit(
            prev,
            existing ? 'Updated static page' : 'Created static page',
            'page',
            page.title,
            `Slug: /${page.slug} · Template: ${page.template}`
          ),
        };
      });
      return savedPage;
    },
    [updateState, appendAudit]
  );

  const deletePage = useCallback(
    (pageId: string) => {
      updateState((prev) => {
        const target = prev.pages.find((p) => p.id === pageId);
        if (!target) return prev;
        return {
          ...prev,
          pages: prev.pages.filter((p) => p.id !== pageId),
          auditEvents: appendAudit(prev, 'Deleted page', 'page', target.title, `Removed /${target.slug}`),
        };
      });
    },
    [updateState, appendAudit]
  );

  const addCategory = useCallback(
    (catInput: Omit<Category, 'id' | 'slug'> & { slug?: string }): Category => {
      let created!: Category;
      updateState((prev) => {
        const baseSlug = slugify(catInput.slug || catInput.name) || 'category';
        const existing = prev.categories.find((c) => c.slug === baseSlug);
        if (existing) {
          created = existing;
          return prev;
        }
        const cat: Category = {
          id: `cat-${Date.now()}`,
          name: catInput.name.trim(),
          slug: baseSlug,
          parentId: catInput.parentId || undefined,
          description: catInput.description || '',
          locale: catInput.locale || 'en',
        };
        created = cat;
        return {
          ...prev,
          categories: [...prev.categories, cat],
          auditEvents: appendAudit(
            prev,
            'Added taxonomy category',
            'taxonomy',
            cat.name,
            `Slug: ${cat.slug}${cat.parentId ? ` (parent: ${cat.parentId})` : ''}`
          ),
        };
      });
      return created;
    },
    [updateState, appendAudit]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id && c.parentId !== id),
      }));
    },
    [updateState]
  );

  const addTag = useCallback(
    (name: string, aliases?: string[]): Tag => {
      let resultTag!: Tag;
      updateState((prev) => {
        const cleaned = name.trim();
        const existing = prev.tags.find((t) => t.name.toLowerCase() === cleaned.toLowerCase());
        if (existing) {
          resultTag = existing;
          return prev;
        }
        const newTag: Tag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: cleaned,
          slug: slugify(cleaned),
          aliases: aliases || [],
        };
        resultTag = newTag;
        return {
          ...prev,
          tags: [...prev.tags, newTag],
          auditEvents: appendAudit(
            prev,
            'Created taxonomy tag',
            'taxonomy',
            newTag.name,
            `Normalized slug: #${newTag.slug}`
          ),
        };
      });
      return resultTag;
    },
    [updateState, appendAudit]
  );

  const deleteTag = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t.id !== id),
      }));
    },
    [updateState]
  );

  const saveSeries = useCallback(
    (seriesInput: Partial<Series> & { title: string }): Series => {
      let saved!: Series;
      updateState((prev) => {
        const existing = seriesInput.id ? prev.series.find((s) => s.id === seriesInput.id) : undefined;
        const item: Series = {
          id: existing?.id || `ser-${Date.now()}`,
          title: seriesInput.title.trim(),
          slug: slugify(seriesInput.slug || seriesInput.title),
          description: seriesInput.description ?? existing?.description ?? '',
          locale: seriesInput.locale ?? existing?.locale ?? 'en',
          articleIds: seriesInput.articleIds ?? existing?.articleIds ?? [],
          updatedAt: new Date().toISOString(),
        };
        saved = item;
        return {
          ...prev,
          series: existing
            ? prev.series.map((s) => (s.id === existing.id ? item : s))
            : [item, ...prev.series],
        };
      });
      return saved;
    },
    [updateState]
  );

  const saveAuthor = useCallback(
    (authorInput: Partial<AuthorProfile> & { displayName: string }): AuthorProfile => {
      let saved!: AuthorProfile;
      updateState((prev) => {
        const existing = authorInput.id ? prev.authors.find((a) => a.id === authorInput.id) : undefined;
        const item: AuthorProfile = {
          id: existing?.id || `auth-${Date.now()}`,
          displayName: authorInput.displayName.trim(),
          slug: slugify(authorInput.slug || authorInput.displayName),
          biography: authorInput.biography ?? existing?.biography ?? '',
          expertise: authorInput.expertise ?? existing?.expertise ?? [],
          affiliation: authorInput.affiliation ?? existing?.affiliation ?? '',
          orcid: authorInput.orcid ?? existing?.orcid ?? '',
          locale: authorInput.locale ?? existing?.locale ?? 'en',
          role: authorInput.role ?? existing?.role ?? 'author',
        };
        saved = item;
        return {
          ...prev,
          authors: existing
            ? prev.authors.map((a) => (a.id === existing.id ? item : a))
            : [...prev.authors, item],
        };
      });
      return saved;
    },
    [updateState]
  );

  const saveSource = useCallback(
    (sourceInput: Partial<ScientificSource> & { title: string; url: string }): ScientificSource => {
      let saved!: ScientificSource;
      updateState((prev) => {
        const existing = sourceInput.id ? prev.sources.find((s) => s.id === sourceInput.id) : undefined;
        const item: ScientificSource = {
          id: existing?.id || `src-${Date.now()}`,
          articleId: sourceInput.articleId ?? existing?.articleId,
          title: sourceInput.title.trim(),
          authors: sourceInput.authors ?? existing?.authors ?? 'Unknown Authors',
          journal: sourceInput.journal ?? existing?.journal ?? 'Preprint / Journal',
          year: sourceInput.year ?? existing?.year ?? 2026,
          doi: sourceInput.doi ?? existing?.doi ?? '',
          url: sourceInput.url.trim(),
          sourceType: sourceInput.sourceType ?? existing?.sourceType ?? 'peer_reviewed',
          accessDate: sourceInput.accessDate ?? existing?.accessDate ?? new Date().toISOString().slice(0, 10),
          verificationStatus: sourceInput.verificationStatus ?? existing?.verificationStatus ?? 'unverified',
          notes: sourceInput.notes ?? existing?.notes ?? 'External verification not run (Offline P0 demo)',
          linkedClaim: sourceInput.linkedClaim ?? existing?.linkedClaim ?? '',
          humanClaimVerified: sourceInput.humanClaimVerified ?? existing?.humanClaimVerified ?? false,
        };
        saved = item;
        return {
          ...prev,
          sources: existing
            ? prev.sources.map((s) => (s.id === existing.id ? item : s))
            : [item, ...prev.sources],
        };
      });
      return saved;
    },
    [updateState]
  );

  const updateSource = useCallback(
    (sourceId: string, patch: Partial<ScientificSource>) => {
      updateState((prev) => ({
        ...prev,
        sources: prev.sources.map((s) => (s.id === sourceId ? { ...s, ...patch } : s)),
      }));
    },
    [updateState]
  );

  const deleteSource = useCallback(
    (sourceId: string) => {
      updateState((prev) => ({
        ...prev,
        sources: prev.sources.filter((s) => s.id !== sourceId),
        articles: prev.articles.map((a) => ({
          ...a,
          sourceIds: a.sourceIds.filter((id) => id !== sourceId),
        })),
      }));
    },
    [updateState]
  );

  const saveKnowledgeLink = useCallback(
    (klInput: Partial<KnowledgeLink> & { term: string; targetUrl: string }): KnowledgeLink => {
      if (!validateSafeUrl(klInput.targetUrl).valid) {
        throw new Error('Knowledge link target must be an HTTP(S) URL or same-application path');
      }
      let saved!: KnowledgeLink;
      updateState((prev) => {
        const existing = klInput.id ? prev.knowledgeLinks.find((k) => k.id === klInput.id) : undefined;
        const item: KnowledgeLink = {
          id: existing?.id || `kl-${Date.now()}`,
          term: klInput.term.trim(),
          targetType: klInput.targetType ?? existing?.targetType ?? 'wikipedia',
          targetUrl: klInput.targetUrl.trim(),
          targetArticleId: klInput.targetArticleId ?? existing?.targetArticleId,
          locale: klInput.locale ?? existing?.locale ?? 'en',
          previewTitle: klInput.previewTitle || klInput.term.trim(),
          previewExcerpt:
            klInput.previewExcerpt ||
            'Educational concept summary stored in local P0 demo knowledge repository.',
          sourceAttribution:
            klInput.sourceAttribution ||
            (klInput.targetType === 'internal'
              ? 'ScientificRadar Internal Reference'
              : 'Wikipedia · CC BY-SA 4.0 (Demo sample)'),
          reviewStatus: klInput.reviewStatus ?? existing?.reviewStatus ?? 'approved',
          isSampleDemoData: true,
        };
        saved = item;
        return {
          ...prev,
          knowledgeLinks: existing
            ? prev.knowledgeLinks.map((k) => (k.id === existing.id ? item : k))
            : [item, ...prev.knowledgeLinks],
        };
      });
      return saved;
    },
    [updateState]
  );

  const addMediaAsset = useCallback(
    (assetInput: Partial<MediaAsset> & { filename: string; title: string; src: string }): MediaAsset => {
      let created!: MediaAsset;
      updateState((prev) => {
        const kind = assetInput.kind || 'scientific_figure';
        const isFigure =
          kind === 'scientific_figure' || kind === 'chart' || kind === 'diagram';
        const item: MediaAsset = {
          id: `media-${Date.now()}`,
          filename: assetInput.filename,
          title: assetInput.title,
          kind,
          src: assetInput.src,
          mime: assetInput.mime || 'image/svg+xml',
          width: assetInput.width || 1200,
          height: assetInput.height || 675,
          byteSize: assetInput.byteSize || 38400,
          altText: assetInput.altText || '',
          caption: assetInput.caption || '',
          credit: assetInput.credit || 'Local Demo Upload',
          licence: assetInput.licence || 'CC BY 4.0',
          sourceUrl: assetInput.sourceUrl || '',
          layout: assetInput.layout || (isFigure ? 'locked' : 'auto'),
          focalPoint: assetInput.focalPoint || { x: 0.5, y: 0.5 },
          createdAt: new Date().toISOString(),
          humanReviewedAlt: assetInput.humanReviewedAlt ?? false,
        };
        created = item;
        return {
          ...prev,
          media: [item, ...prev.media],
          auditEvents: appendAudit(
            prev,
            'Added media asset to Local Demo Storage',
            'media',
            item.title,
            `Kind: ${item.kind} · Layout: ${item.layout} (Cloudflare R2 not connected)`
          ),
        };
      });
      return created;
    },
    [updateState, appendAudit]
  );

  const updateMediaAsset = useCallback(
    (id: string, patch: Partial<MediaAsset>) => {
      updateState((prev) => ({
        ...prev,
        media: prev.media.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [updateState]
  );

  const deleteMediaAsset = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        media: prev.media.filter((m) => m.id !== id),
      }));
    },
    [updateState]
  );

  const updateHomepageBlocks = useCallback(
    (homepageBlocks: HomepageBlock[]) => {
      updateState((prev) => ({
        ...prev,
        homepageBlocks,
        auditEvents: appendAudit(
          prev,
          'Updated homepage block layout',
          'navigation',
          'Homepage Configuration',
          'Updated local homepage preview blocks (not live on scientificradar.com)'
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const updateMenus = useCallback(
    (menus: MenuConfig[]) => {
      updateState((prev) => ({
        ...prev,
        menus,
        auditEvents: appendAudit(
          prev,
          'Updated site navigation menus',
          'navigation',
          'Site Menus',
          'Updated primary/footer menu configuration in local demo store'
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const exportSnapshotJson = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importSnapshotJson = useCallback(
    async (rawJson: string): Promise<{ ok: boolean; error?: string }> => {
      if (simulateSaveFailure) {
        return { ok: false, error: 'Persistence failure is enabled; no data was restored' };
      }
      const trustedSources = trustedMediaSourceSet([
        ...SEED_MEDIA.map((item) => item.src),
        ...stateRef.current.media.map((item) => item.src),
      ]);
      const validated = validateAndSanitizeSnapshot(rawJson, trustedSources);
      if (!validated.snapshot) return { ok: false, error: validated.error || 'Invalid backup' };
      const candidate = validated.snapshot as unknown as StudioDatabaseSnapshot;
      candidate.articles = candidate.articles.map((article) => ({
        ...article,
        tagIds: normalizeArticleTagIds(article.tagIds || []).tagIds,
      }));

      try {
        const db = await getDb();
        if (!db) return { ok: false, error: 'IndexedDB is unavailable; backup was not restored' };
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const current = (await transaction.store.get(STATE_KEY)) as StudioDatabaseSnapshot | undefined;
        candidate.storageRevision = (current?.storageRevision || 0) + 1;
        await transaction.store.put(candidate, STATE_KEY);
        await transaction.done;
        stateRef.current = candidate;
        setState(candidate);
        setPersistenceMode('indexeddb');
        document.documentElement.classList.toggle('dark', candidate.theme === 'dark');
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'IndexedDB write failed; previous state remains active',
        };
      }
    },
    [simulateSaveFailure]
  );

  const resetDemoDatabase = useCallback(async () => {
    const seed = getInitialSeedSnapshot();
    const result = await persistState(seed);
    if (!result.ok) throw new Error(result.error || 'Reset could not be persisted.');
    if (result.volatileMemoryOnly) stateRef.current = seed;
    setState(stateRef.current);
  }, [persistState]);

  const value: StudioContextValue = {
    ...state,
    isHydrated,
    persistenceMode,
    simulateSaveFailure,
    setSimulateSaveFailure,
    setTheme,
    setActiveRole,
    setDateTimePreferences,
    setNavPreset,
    toggleNavItemVisibility,
    toggleNavGroupCollapsed,
    setSidebarCollapsed,
    toggleDashboardWidget,
    resetNavigationToBalanced,
    saveArticle,
    persistArticleDraft,
    duplicateArticle,
    transitionArticleStatus,
    deleteArticle,
    restoreArticleRevision,
    applyAssistantChanges,
    runAndStoreArticleAudit,
    applyQuickFixProposal,
    savePage,
    deletePage,
    addCategory,
    deleteCategory,
    addTag,
    deleteTag,
    saveSeries,
    saveAuthor,
    saveSource,
    updateSource,
    deleteSource,
    saveKnowledgeLink,
    addMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    updateHomepageBlocks,
    updateMenus,
    exportSnapshotJson,
    importSnapshotJson,
    resetDemoDatabase,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return ctx;
}
