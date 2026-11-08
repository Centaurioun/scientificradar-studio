'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { mergeArticleEditorialMetadata } from './article-editorial-metadata';
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
import {
  computeArticleFingerprint,
  getArticleLinkedMediaAndSources,
  runArticleAudit,
} from './audit/run-article-audit';
import { evaluatePublishGate } from './audit/publish-policy';
import { validateAndSanitizeSnapshot } from './backup-validation';
import { trustedMediaSourceSet } from './html-security';
import { synchronizeArticleBodyRepresentations } from './html-source';
import { commitSnapshotMutation, createEntityWriteIntent } from './studio-persistence';

export type DurableEntityReceipt<T = undefined> = Promise<{
  ok: boolean;
  entity?: T;
  storageRevision?: number;
  error?: string;
}>;

export type EntityWithDurableReceipt<T> = T & {
  committed: DurableEntityReceipt<T>;
};

function attachDurableReceipt<T extends object>(
  entity: T,
  receiptPromise: DurableEntityReceipt<T>
): EntityWithDurableReceipt<T> {
  Object.defineProperty(entity, 'committed', {
    value: receiptPromise,
    enumerable: false,
    configurable: true,
  });
  return entity as EntityWithDurableReceipt<T>;
}

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
    const db = await openDB(DB_NAME, undefined, {
      upgrade(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
          upgradeDb.createObjectStore(STORE_NAME);
        }
      },
    });
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const nextVersion = db.version + 1;
      db.close();
      return await openDB(DB_NAME, nextVersion, {
        upgrade(upgradeDb) {
          if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
            upgradeDb.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return db;
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
  duplicateArticle: (articleId: string) => Promise<{ ok: boolean; article?: Article; error?: string }>;
  transitionArticleStatus: (
    articleId: string,
    nextStatus: ArticleStatus,
    note?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteArticle: (articleId: string) => Promise<{ ok: boolean; error?: string }>;
  restoreArticleRevision: (revisionId: string, expectedVersion: number) => Promise<{ ok: boolean; article?: Article; error?: string }>;
  applyAssistantChanges: (articleId: string, acceptedChanges: EditorialChange[]) => Promise<{ ok: boolean; error?: string; updatedArticle?: Article }>;
  // SEO & Quality Audit
  runAndStoreArticleAudit: (articleId: string) => Promise<{ ok: boolean; persisted: boolean; report?: AuditReport; error?: string }>;
  applyQuickFixProposal: (proposal: FixProposal) => Promise<{ ok: boolean; error?: string; updatedArticle?: Article }>;
  // Pages CRUD
  savePage: (pageInput: Partial<EditorialPage> & { id?: string; title: string }) => Promise<EditorialPage>;
  deletePage: (pageId: string) => DurableEntityReceipt;
  // Categories, Tags, Series, Authors
  addCategory: (cat: Omit<Category, 'id' | 'slug'> & { slug?: string }) => EntityWithDurableReceipt<Category>;
  deleteCategory: (id: string) => DurableEntityReceipt;
  addTag: (name: string, aliases?: string[]) => EntityWithDurableReceipt<Tag>;
  deleteTag: (id: string) => DurableEntityReceipt;
  saveSeries: (seriesInput: Partial<Series> & { title: string }) => EntityWithDurableReceipt<Series>;
  saveAuthor: (authorInput: Partial<AuthorProfile> & { displayName: string }) => EntityWithDurableReceipt<AuthorProfile>;
  // Sources & Knowledge Links
  saveSource: (sourceInput: Partial<ScientificSource> & { title: string; url: string }) => EntityWithDurableReceipt<ScientificSource>;
  updateSource: (sourceId: string, patch: Partial<ScientificSource>) => DurableEntityReceipt;
  deleteSource: (sourceId: string) => DurableEntityReceipt;
  saveKnowledgeLink: (klInput: Partial<KnowledgeLink> & { term: string; targetUrl: string }) => EntityWithDurableReceipt<KnowledgeLink>;
  // Media Library
  addMediaAsset: (assetInput: Partial<MediaAsset> & { filename: string; title: string; src: string }) => EntityWithDurableReceipt<MediaAsset>;
  updateMediaAsset: (id: string, patch: Partial<MediaAsset>) => DurableEntityReceipt;
  deleteMediaAsset: (id: string) => DurableEntityReceipt;
  // Homepage & Menus
  updateHomepageBlocks: (blocks: HomepageBlock[]) => DurableEntityReceipt;
  updateMenus: (menus: MenuConfig[]) => DurableEntityReceipt;
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
  const committedStateRef = useRef<StudioDatabaseSnapshot>(state);
  const mutationTailRef = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted state from IndexedDB (preserving intentionally empty collections on reload per SRS-CODE-001)
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
              committedStateRef.current = migrated;
              stateRef.current = migrated;
              setState(migrated);
              document.documentElement.classList.toggle('dark', migrated.theme === 'dark');
              setIsHydrated(true);
            }
            return;
          }
          // Seed initial DB only when no root record exists yet
          const seed = getInitialSeedSnapshot();
          await transaction.store.put(seed, STATE_KEY);
          await transaction.done;
          if (!cancelled) {
            committedStateRef.current = seed;
            stateRef.current = seed;
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
          committedStateRef.current = committed.snapshot;
          stateRef.current = committed.snapshot;
          return { ok: true, volatileMemoryOnly: false };
        } else {
          setPersistenceMode('memory_fallback');
          return { ok: true, volatileMemoryOnly: true };
        }
      } catch (err) {
        return {
          ok: false,
          volatileMemoryOnly: persistenceMode === 'memory_fallback',
          error: err instanceof Error ? err.message : 'IndexedDB write failed',
        };
      }
    },
    [simulateSaveFailure, persistenceMode]
  );

  const updateState = useCallback(
    (
      updater: (prev: StudioDatabaseSnapshot) => StudioDatabaseSnapshot,
      options?: { optimistic?: boolean }
    ): Promise<boolean> => {
      if (simulateSaveFailure) {
        return Promise.resolve(false);
      }
      if (options?.optimistic) {
        const optimistic = updater(stateRef.current);
        stateRef.current = optimistic;
        setState(optimistic);
      }
      const queued = mutationTailRef.current
        .then(async () => {
          if (simulateSaveFailure) {
            stateRef.current = committedStateRef.current;
            setState(committedStateRef.current);
            return false;
          }
          const db = await getDb();
          if (!db) {
            setPersistenceMode('memory_fallback');
            stateRef.current = committedStateRef.current;
            setState(committedStateRef.current);
            return false;
          }
          const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, undefined>(
            db,
            STORE_NAME,
            STATE_KEY,
            getInitialSeedSnapshot(),
            (latest) => ({ snapshot: updater(latest), result: undefined })
          );
          committedStateRef.current = committed.snapshot;
          stateRef.current = committed.snapshot;
          setState(committed.snapshot);
          return true;
        })
        .catch(() => {
          stateRef.current = committedStateRef.current;
          setState(committedStateRef.current);
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
      details: string,
      intent?: { auditId?: string; timestamp?: string }
    ): AuditEvent[] => {
      const actorMap: Record<UserRole, string> = {
        owner: 'Admin Owner (Demo)',
        editor: 'Dr. Elena Rostova (Editor)',
        author: 'Dr. Kerem Aydın (Author)',
        reviewer: 'Prof. Marcus Thorne (Reviewer)',
      };
      const event: AuditEvent = {
        id: intent?.auditId || `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: intent?.timestamp || new Date().toISOString(),
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
      const intent = createEntityWriteIntent('role');
      updateState((prev) => ({
        ...prev,
        activeRole,
        auditEvents: appendAudit(
          prev,
          `Switched demo role to ${activeRole.toUpperCase()}`,
          'system',
          'Role Switcher (Demo)',
          'Simulated editorial permission profile changed',
          intent
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const setDateTimePreferences = useCallback(
    (prefs: Partial<DateTimePreferences>) => {
      const intent = createEntityWriteIntent('dt');
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
            `Locale: ${nextPrefs.locale} · Time Zone: ${nextPrefs.timeZone} · Clock: ${nextPrefs.hourCycle}`,
            intent
          ),
        };
      });
    },
    [updateState, appendAudit]
  );

  const setNavPreset = useCallback(
    (preset: NavPreset) => {
      const intent = createEntityWriteIntent('nav');
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
          `Preset set to ${preset}`,
          intent
        ),
      }));
    },
    [updateState, appendAudit]
  );

  const toggleNavItemVisibility = useCallback(
    (id: NavItemId) => {
      const intent = createEntityWriteIntent('nav');
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
            'UI menu visibility changed (records remain preserved in local store)',
            intent
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
    const intent = createEntityWriteIntent('nav');
    updateState((prev) => ({
      ...prev,
      navigation: getDefaultNavigationPreference(),
      auditEvents: appendAudit(
        prev,
        'Restored default Balanced navigation',
        'navigation',
        'Sidebar & Dashboard',
        'Reset all menu visibility and widget toggles to Balanced defaults',
        intent
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
        intent?: { id: string; timestamp: string; auditId: string; revisionSuffix?: string };
      }
    ): { nextState: StudioDatabaseSnapshot; updatedArticle: Article; demotedH1Count: number } => {
      const now = options?.intent?.timestamp || new Date().toISOString();
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
      const syncedBody = synchronizeArticleBodyRepresentations(
        articleInput.body ?? existing?.body ?? { type: 'doc', content: [] },
        sanitized.sanitizedHtml
      );

      const updatedArticle: Article = {
        id: existing?.id || articleInput.id || options?.intent?.id || `art-${Date.now()}`,
        locale,
        title: articleInput.title.trim() || 'Untitled Scientific Article',
        slug: uniqueSlug,
        summary: articleInput.summary ?? existing?.summary ?? '',
        body: syncedBody.body,
        bodyHtml: syncedBody.bodyHtml,
        status: articleInput.status ?? existing?.status ?? 'draft',
        primaryCategoryId: articleInput.primaryCategoryId ?? existing?.primaryCategoryId ?? 'cat-physics',
        categoryIds: articleInput.categoryIds ?? existing?.categoryIds ?? ['cat-physics'],
        tagIds: normalizedTags.tagIds,
        seriesId: articleInput.seriesId !== undefined ? articleInput.seriesId : existing?.seriesId,
        authorId: articleInput.authorId ?? existing?.authorId ?? 'auth-elena',
        sourceIds: articleInput.sourceIds ?? existing?.sourceIds ?? [],
        ...mergeArticleEditorialMetadata(articleInput, existing),
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
        const revSuffix = options?.intent?.revisionSuffix || String(Date.now());
        const rev: ArticleRevision = {
          id: `rev-${updatedArticle.id}-v${updatedArticle.version}-${revSuffix}`,
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
          `Slug: /${updatedArticle.slug} · Status: ${updatedArticle.status} · v${updatedArticle.version}`,
          options?.intent
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
      const intent = createEntityWriteIntent('art', articleInput.id);
      type Result = { conflict: string } | { built: ReturnType<typeof buildUpdatedArticleSnapshot> };
      const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, Result>(db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(), (latest) => {
        const existing = articleInput.id ? latest.articles.find((a) => a.id === articleInput.id) : undefined;
        if (articleInput.id && !existing && articleInput.version !== undefined) {
          return { snapshot: latest, result: { conflict: `Article ${articleInput.id} was removed from storage.` } };
        }
        if (existing && articleInput.version !== undefined && existing.version !== articleInput.version) {
          return { snapshot: latest, result: { conflict: `Article changed in another tab (stored v${existing.version}; expected v${articleInput.version}).` } };
        }
        const targetStatus = articleInput.status ?? existing?.status ?? 'draft';
        if (existing && articleInput.status && articleInput.status !== existing.status) {
          const roleCheck = canTransitionStatus(existing.status, articleInput.status, latest.activeRole);
          if (!roleCheck.allowed) {
            return { snapshot: latest, result: { conflict: roleCheck.reason || 'Workflow status transition not permitted.' } };
          }
        } else if (existing && articleInput.status === 'scheduled' && existing.status === 'scheduled') {
          if (latest.activeRole === 'author' || latest.activeRole === 'reviewer') {
            return { snapshot: latest, result: { conflict: 'Only Editors or Owners can reschedule articles.' } };
          }
        }
        const built = buildUpdatedArticleSnapshot(latest, articleInput, {
          ...options,
          intent: { ...intent, revisionSuffix: intent.id },
        });
        if (
          (targetStatus === 'published' || targetStatus === 'scheduled') &&
          (!existing || existing.status !== targetStatus)
        ) {
          const auditReport = runArticleAudit({
            article: built.updatedArticle,
            allArticles: built.nextState.articles,
            categories: latest.categories,
            tags: latest.tags,
            sources: latest.sources,
            media: latest.media,
            knowledgeLinks: latest.knowledgeLinks,
            integrations: latest.integrations,
            executedAt: intent.timestamp,
          });
          const gate = evaluatePublishGate({
            report: auditReport,
            currentStatus: existing?.status || 'draft',
            targetStatus,
            activeRole: latest.activeRole,
          });
          if (gate.isBlocked) {
            return {
              snapshot: latest,
              result: {
                conflict:
                  gate.roleError ||
                  gate.blockers[0]?.title ||
                  'Article has publication blockers that must be resolved before publishing or scheduling.',
              },
            };
          }
        }
        return { snapshot: built.nextState, result: { built } };
      });
      if ('conflict' in committed.result) throw new Error(committed.result.conflict);
      committedStateRef.current = committed.snapshot;
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
      const intent = createEntityWriteIntent('art', articleInput.id);
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
              return { snapshot: latest, result: { conflict: `Article ${articleInput.id} was removed from storage while this draft was open.`, version: options.expectedVersion, savedAt: intent.timestamp, demotedH1Count: 0 } };
            }
            if (existing && options?.expectedVersion !== undefined && existing.version !== options.expectedVersion) {
              return { snapshot: latest, result: { conflict: `Version conflict: stored article is v${existing.version} while editor base was v${options.expectedVersion}.`, version: existing.version, savedAt: existing.updatedAt, demotedH1Count: 0 } };
            }
            const targetStatus = articleInput.status ?? existing?.status ?? 'draft';
            if (existing && articleInput.status && articleInput.status !== existing.status) {
              const roleCheck = canTransitionStatus(existing.status, articleInput.status, latest.activeRole);
              if (!roleCheck.allowed) {
                return {
                  snapshot: latest,
                  result: {
                    conflict: roleCheck.reason || 'Workflow status transition not permitted.',
                    version: existing.version,
                    savedAt: existing.updatedAt,
                    demotedH1Count: 0,
                  },
                };
              }
            } else if (existing && articleInput.status === 'scheduled' && existing.status === 'scheduled') {
              if (latest.activeRole === 'author' || latest.activeRole === 'reviewer') {
                return {
                  snapshot: latest,
                  result: {
                    conflict: 'Only Editors or Owners can reschedule articles.',
                    version: existing.version,
                    savedAt: existing.updatedAt,
                    demotedH1Count: 0,
                  },
                };
              }
            }
            const built = buildUpdatedArticleSnapshot(latest, articleInput, {
              ...options,
              intent: { ...intent, revisionSuffix: intent.id },
            });
            if (
              (targetStatus === 'published' || targetStatus === 'scheduled') &&
              (!existing || existing.status !== targetStatus)
            ) {
              const auditReport = runArticleAudit({
                article: built.updatedArticle,
                allArticles: built.nextState.articles,
                categories: latest.categories,
                tags: latest.tags,
                sources: latest.sources,
                media: latest.media,
                knowledgeLinks: latest.knowledgeLinks,
                integrations: latest.integrations,
                executedAt: intent.timestamp,
              });
              const gate = evaluatePublishGate({
                report: auditReport,
                currentStatus: existing?.status || 'draft',
                targetStatus,
                activeRole: latest.activeRole,
              });
              if (gate.isBlocked) {
                return {
                  snapshot: latest,
                  result: {
                    conflict:
                      gate.roleError ||
                      gate.blockers[0]?.title ||
                      'Article has publication blockers that must be resolved before publishing or scheduling.',
                    version: existing?.version || 1,
                    savedAt: existing?.updatedAt || intent.timestamp,
                    demotedH1Count: 0,
                  },
                };
              }
            }
            return { snapshot: built.nextState, result: { built } };
          }
        );
        if ('conflict' in committed.result) {
          return { ok: false, savedAt: committed.result.savedAt, version: committed.result.version, demotedH1Count: 0, volatileMemoryOnly: false, error: committed.result.conflict };
        }
        const built = committed.result.built;
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, savedAt: built.updatedArticle.updatedAt, version: built.updatedArticle.version, demotedH1Count: built.demotedH1Count, volatileMemoryOnly: false };
      } catch (err) {
        return {
          ok: false,
          savedAt: intent.timestamp,
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
    async (articleId: string): Promise<{ ok: boolean; persisted: boolean; report?: AuditReport; error?: string }> => {
      const intent = createEntityWriteIntent('audit', articleId);
      const calculate = (snapshot: StudioDatabaseSnapshot) => {
        const target = snapshot.articles.find((article) => article.id === articleId);
        if (!target) return undefined;
        return runArticleAudit({
          article: target,
          allArticles: snapshot.articles,
          categories: snapshot.categories,
          tags: snapshot.tags,
          sources: snapshot.sources,
          media: snapshot.media,
          knowledgeLinks: snapshot.knowledgeLinks,
          integrations: snapshot.integrations,
          executedAt: intent.timestamp,
        });
      };
      const inMemoryReport = calculate(stateRef.current);
      if (!inMemoryReport) return { ok: false, persisted: false, error: 'Article not found.' };
      if (simulateSaveFailure) {
        return { ok: false, persisted: false, report: inMemoryReport, error: 'Audit calculated in memory but not saved: simulated storage failure.' };
      }
      const db = await getDb();
      if (!db) {
        return { ok: false, persisted: false, report: inMemoryReport, error: 'Audit calculated in memory but not saved: IndexedDB is unavailable.' };
      }
      try {
        type AuditMutationResult = { error: string } | { report: AuditReport; title: string };
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, AuditMutationResult>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => {
            const target = latest.articles.find((article) => article.id === articleId);
            if (!target) return { snapshot: latest, result: { error: 'Article not found in storage.' } };
            const report = runArticleAudit({
              article: target,
              allArticles: latest.articles,
              categories: latest.categories,
              tags: latest.tags,
              sources: latest.sources,
              media: latest.media,
              knowledgeLinks: latest.knowledgeLinks,
              integrations: latest.integrations,
              executedAt: intent.timestamp,
            });
            return {
              snapshot: {
                ...latest,
                auditReportsByArticleId: { ...(latest.auditReportsByArticleId || {}), [articleId]: report },
                auditEvents: appendAudit(
                  latest,
                  'Executed SEO & Editorial Quality Audit',
                  'article',
                  target.title,
                  `Pass: ${report.counts.pass} · Warn: ${report.counts.warning} · Error: ${report.counts.error} · Unverified: ${report.counts.unverified}`,
                  intent
                ),
              },
              result: { report, title: target.title },
            };
          }
        );
        if ('error' in committed.result) return { ok: false, persisted: false, error: committed.result.error };
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, persisted: true, report: committed.result.report };
      } catch (error) {
        return {
          ok: false,
          persisted: false,
          report: inMemoryReport,
          error: `Audit calculated in memory but not saved: ${error instanceof Error ? error.message : 'IndexedDB transaction failed.'}`,
        };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const applyQuickFixProposal = useCallback(
    async (proposal: FixProposal): Promise<{ ok: boolean; error?: string; updatedArticle?: Article }> => {
      if (simulateSaveFailure) return { ok: false, error: 'Storage write failed; Quick Fix was not saved.' };
      const db = await getDb();
      if (!db) {
        setPersistenceMode('memory_fallback');
        return { ok: false, error: 'IndexedDB is unavailable; Quick Fix was not saved.' };
      }
      const intent = createEntityWriteIntent('qf');
      try {
        type QuickFixResult = { error: string } | { updatedArticle: Article };
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, QuickFixResult>(db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(), (prev) => {
          const article = prev.articles.find((a) => a.id === proposal.articleId);
          if (!article) {
            return { snapshot: prev, result: { error: 'Article not found' } };
          }
          const { articleMedia, articleSources } = getArticleLinkedMediaAndSources(
            article,
            prev.media,
            prev.sources
          );
          const currentFp = computeArticleFingerprint(article, articleMedia, articleSources);
          if (proposal.baseFingerprint && proposal.baseFingerprint !== currentFp) {
            return { snapshot: prev, result: { error: 'Article changed since this Quick Fix was generated. Re-run SEO Audit first.' } };
          }

          const now = intent.timestamp;
          const nextVersion = article.version + 1;
          let nextMedia = prev.media;
          const nextArticle: Article = {
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
            const sanitizedHtml = sanitizeAndDemoteBodyH1(
              proposal.after,
              trustedMediaSourceSet(prev.media.map((m) => m.src))
            ).sanitizedHtml;
            const synced = synchronizeArticleBodyRepresentations(
              nextArticle.body,
              sanitizedHtml
            );
            nextArticle.body = synced.body;
            nextArticle.bodyHtml = synced.bodyHtml;
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
            const candidateIds = proposal.after
              ? proposal.after
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : nextArticle.tagIds;
            nextArticle.tagIds = normalizeArticleTagIds(candidateIds).normalizedIds;
          } else if (proposal.targetPath === 'media.altText' && nextArticle.featuredMediaId) {
            nextMedia = prev.media.map((m) =>
              m.id === nextArticle.featuredMediaId ? { ...m, altText: proposal.after } : m
            );
          }

          const rev: ArticleRevision = {
            id: `rev-${nextArticle.id}-v${nextVersion}-${intent.id}`,
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
            media: nextMedia,
            knowledgeLinks: prev.knowledgeLinks,
            integrations: prev.integrations,
            executedAt: now,
          });

          return {
            snapshot: {
              ...prev,
              articles: nextArticles,
              media: nextMedia,
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
                `${proposal.label} -> saved as v${nextVersion}`,
                intent
              ),
            },
            result: { updatedArticle: nextArticle },
          };
        });
        if ('error' in committed.result) return { ok: false, error: committed.result.error };
        committedStateRef.current = committed.snapshot;
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
    async (articleId: string): Promise<{ ok: boolean; article?: Article; error?: string }> => {
      if (simulateSaveFailure) return { ok: false, error: 'Storage transaction failed; duplicate was not saved.' };
      const db = await getDb();
      if (!db) return { ok: false, error: 'IndexedDB is unavailable; duplicate was not saved.' };
      const intent = createEntityWriteIntent('art');
      try {
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, { article?: Article; error?: string }>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => {
            const orig = latest.articles.find((article) => article.id === articleId);
            if (!orig) return { snapshot: latest, result: { error: 'Article not found.' } };
            const copy: Article = {
              ...orig,
              id: intent.id,
              title: `${orig.title} (Copy)`,
              slug: ensureUniqueSlug(`${orig.slug}-copy`, orig.locale, latest.articles),
              status: 'draft',
              publishedAt: undefined,
              scheduledAt: undefined,
              createdAt: intent.timestamp,
              updatedAt: intent.timestamp,
              version: 1,
            };
            return {
              snapshot: {
                ...latest,
                articles: [copy, ...latest.articles],
                auditEvents: appendAudit(
                  latest,
                  'Duplicated article',
                  'article',
                  copy.title,
                  `Cloned from "${orig.title}" with unique slug /${copy.slug}`,
                  intent
                ),
              },
              result: { article: copy },
            };
          }
        );
        if (committed.result.error || !committed.result.article) return { ok: false, error: committed.result.error || 'Duplicate was not saved.' };
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, article: committed.result.article };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'IndexedDB transaction failed; duplicate was not saved.' };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const transitionArticleStatus = useCallback(
    async (
      articleId: string,
      nextStatus: ArticleStatus,
      note?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (simulateSaveFailure) {
        return { ok: false, error: 'Storage transaction failed; article status was not saved.' };
      }
      const db = await getDb();
      if (!db) {
        return { ok: false, error: 'IndexedDB is unavailable; article status was not saved.' };
      }
      const intent = createEntityWriteIntent('rn');
      try {
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, { ok: boolean; error?: string }>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (prev) => {
            const article = prev.articles.find((a) => a.id === articleId);
            if (!article) {
              return { snapshot: prev, result: { ok: false, error: 'Article not found' } };
            }
            const check = canTransitionStatus(article.status, nextStatus, prev.activeRole);
            if (!check.allowed) {
              return { snapshot: prev, result: { ok: false, error: check.reason } };
            }

            if (nextStatus === 'published' || nextStatus === 'scheduled') {
              const auditReport = runArticleAudit({
                article,
                allArticles: prev.articles,
                categories: prev.categories,
                tags: prev.tags,
                sources: prev.sources,
                media: prev.media,
                knowledgeLinks: prev.knowledgeLinks,
                integrations: prev.integrations,
                executedAt: intent.timestamp,
              });
              const gate = evaluatePublishGate({
                report: auditReport,
                currentStatus: article.status,
                targetStatus: nextStatus,
                activeRole: prev.activeRole,
              });
              if (gate.isBlocked) {
                return {
                  snapshot: prev,
                  result: {
                    ok: false,
                    error:
                      gate.roleError ||
                      gate.blockers[0]?.title ||
                      'Article has publication blockers that must be resolved before publishing or scheduling.',
                  },
                };
              }
            }

            const now = intent.timestamp;
            const nextVersion = article.version + 1;
            const reviewNotes = [...(article.reviewNotes || [])];
            if (note && note.trim()) {
              reviewNotes.unshift({
                id: intent.id,
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
              id: `rev-${updated.id}-v${nextVersion}-${intent.id}`,
              articleId: updated.id,
              version: nextVersion,
              snapshot: updated,
              source: nextStatus === 'published' ? 'publish' : 'review',
              createdAt: now,
              summary: `Status changed: ${article.status} -> ${nextStatus}${note ? ` (${note})` : ''}`,
            };

            return {
              snapshot: {
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
                    : `Transitioned ${article.status} -> ${nextStatus}`,
                  intent
                ),
              },
              result: { ok: true },
            };
          }
        );
        if (!committed.result.ok) return committed.result;
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return committed.result;
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Storage transaction failed; article status was not saved.',
        };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const deleteArticle = useCallback(
    async (articleId: string): Promise<{ ok: boolean; error?: string }> => {
      if (simulateSaveFailure) return { ok: false, error: 'Storage transaction failed; article was not deleted.' };
      const db = await getDb();
      if (!db) return { ok: false, error: 'IndexedDB is unavailable; article was not deleted.' };
      const intent = createEntityWriteIntent('del', articleId);
      try {
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, { ok: boolean; error?: string }>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => {
            const target = latest.articles.find((article) => article.id === articleId);
            if (!target) return { snapshot: latest, result: { ok: false, error: 'Article not found.' } };
            return {
              snapshot: {
                ...latest,
                articles: latest.articles.filter((article) => article.id !== articleId),
                auditEvents: appendAudit(
                  latest,
                  'Deleted article',
                  'article',
                  target.title,
                  `Removed article /${target.slug} from local demo store`,
                  intent
                ),
              },
              result: { ok: true },
            };
          }
        );
        if (!committed.result.ok) return committed.result;
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'IndexedDB transaction failed; article was not deleted.' };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const restoreArticleRevision = useCallback(
    async (revisionId: string, expectedVersion: number): Promise<{ ok: boolean; article?: Article; error?: string }> => {
      if (simulateSaveFailure) return { ok: false, error: 'Storage transaction failed; revision was not restored.' };
      const db = await getDb();
      if (!db) return { ok: false, error: 'IndexedDB is unavailable; revision was not restored.' };
      const intent = createEntityWriteIntent('rev-restore');
      try {
        const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, { article?: Article; error?: string }>(
          db,
          STORE_NAME,
          STATE_KEY,
          getInitialSeedSnapshot(),
          (latest) => {
            const rev = latest.revisions.find((revision) => revision.id === revisionId);
            if (!rev) return { snapshot: latest, result: { error: 'Revision was not found in storage.' } };
            const current = latest.articles.find((article) => article.id === rev.articleId);
            if (!current) return { snapshot: latest, result: { error: 'Article was removed from storage.' } };
            if (current.version !== expectedVersion) {
              return { snapshot: latest, result: { error: `Version conflict: stored article is v${current.version}; restore was based on v${expectedVersion}.` } };
            }
            const nextVersion = current.version + 1;
            const sanitizedRestoredHtml = sanitizeAndDemoteBodyH1(
              rev.snapshot.bodyHtml,
              trustedMediaSourceSet(latest.media.map((media) => media.src))
            ).sanitizedHtml;
            const syncedRestored = synchronizeArticleBodyRepresentations(
              rev.snapshot.body,
              sanitizedRestoredHtml
            );
            const restoredArticle: Article = {
              ...rev.snapshot,
              id: current.id,
              body: syncedRestored.body,
              bodyHtml: syncedRestored.bodyHtml,
              version: nextVersion,
              updatedAt: intent.timestamp,
            };
            const newRevision: ArticleRevision = {
              id: intent.id,
              articleId: restoredArticle.id,
              version: nextVersion,
              snapshot: restoredArticle,
              source: 'restore',
              createdAt: intent.timestamp,
              summary: `Restored from snapshot v${rev.version} (${rev.summary})`,
            };
            return {
              snapshot: {
                ...latest,
                articles: latest.articles.map((article) => (article.id === restoredArticle.id ? restoredArticle : article)),
                revisions: [newRevision, ...latest.revisions],
                auditEvents: appendAudit(
                  latest,
                  `Restored version v${rev.version} as new v${nextVersion}`,
                  'article',
                  restoredArticle.title,
                  `Non-destructive version restore created v${nextVersion}`,
                  intent
                ),
              },
              result: { article: restoredArticle },
            };
          }
        );
        if (committed.result.error || !committed.result.article) return { ok: false, error: committed.result.error || 'Revision was not restored.' };
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return { ok: true, article: committed.result.article };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'IndexedDB transaction failed; revision was not restored.' };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const applyAssistantChanges = useCallback(
    async (
      articleId: string,
      acceptedChanges: EditorialChange[]
    ): Promise<{ ok: boolean; error?: string; updatedArticle?: Article }> => {
      if (simulateSaveFailure) {
        return { ok: false, error: 'Storage transaction failed; accepted changes were not saved.' };
      }
      const db = await getDb();
      if (!db) {
        return { ok: false, error: 'IndexedDB is unavailable; accepted changes were not saved.' };
      }
      const intent = createEntityWriteIntent('assist');
      try {
        const committed = await commitSnapshotMutation<
          StudioDatabaseSnapshot,
          { ok: boolean; error?: string; updatedArticle?: Article }
        >(db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(), (prev) => {
          const article = prev.articles.find((a) => a.id === articleId);
          if (!article) {
            return { snapshot: prev, result: { ok: false, error: 'Article not found' } };
          }
          if (acceptedChanges.length === 0) {
            return { snapshot: prev, result: { ok: false, error: 'No changes selected to apply' } };
          }
          const stale = acceptedChanges.some((c) => c.baseVersion !== article.version);
          if (stale) {
            return {
              snapshot: prev,
              result: {
                ok: false,
                error: `Version conflict detected: Article was updated to v${article.version} after checks ran on v${acceptedChanges[0].baseVersion}. Please re-run checks.`,
              },
            };
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

          const now = intent.timestamp;
          const nextVersion = article.version + 1;
          const sanitizedAssistantHtml = sanitizeAndDemoteBodyH1(
            nextArticle.bodyHtml,
            trustedMediaSourceSet(nextMedia.map((media) => media.src))
          ).sanitizedHtml;
          const syncedAssistant = synchronizeArticleBodyRepresentations(
            nextArticle.body,
            sanitizedAssistantHtml
          );
          nextArticle = {
            ...nextArticle,
            body: syncedAssistant.body,
            bodyHtml: syncedAssistant.bodyHtml,
            version: nextVersion,
            updatedAt: now,
          };

          const rev: ArticleRevision = {
            id: `rev-${nextArticle.id}-v${nextVersion}-${intent.id}`,
            articleId: nextArticle.id,
            version: nextVersion,
            snapshot: nextArticle,
            source: 'assistant_review',
            createdAt: now,
            summary: `Accepted ${acceptedChanges.length} local check proposal(s): ${acceptedChanges
              .map((c) => c.label)
              .join('; ')}`,
          };

          return {
            snapshot: {
              ...prev,
              articles: prev.articles.map((a) => (a.id === articleId ? nextArticle : a)),
              media: nextMedia,
              revisions: [rev, ...prev.revisions],
              auditEvents: appendAudit(
                prev,
                `Applied ${acceptedChanges.length} reviewed local check change(s)`,
                'assistant',
                nextArticle.title,
                `Saved as new version v${nextVersion} (previous version recoverable)`,
                intent
              ),
            },
            result: { ok: true, updatedArticle: nextArticle },
          };
        });
        if (!committed.result.ok) return committed.result;
        committedStateRef.current = committed.snapshot;
        stateRef.current = committed.snapshot;
        setState(committed.snapshot);
        return committed.result;
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Storage transaction failed; accepted changes were not saved.',
        };
      }
    },
    [appendAudit, simulateSaveFailure]
  );

  const savePage = useCallback(
    async (pageInput: Partial<EditorialPage> & { id?: string; title: string }): Promise<EditorialPage> => {
      if (simulateSaveFailure) {
        throw new Error('Storage transaction failed; page changes were not saved.');
      }
      const db = await getDb();
      if (!db) {
        throw new Error('IndexedDB is unavailable; page changes were not saved.');
      }
      const intent = createEntityWriteIntent('page', pageInput.id);
      const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, EditorialPage>(
        db,
        STORE_NAME,
        STATE_KEY,
        getInitialSeedSnapshot(),
        (prev) => {
          const existing = pageInput.id ? prev.pages.find((p) => p.id === pageInput.id) : undefined;
          const sanitized = sanitizeAndDemoteBodyH1(
            pageInput.bodyHtml ?? existing?.bodyHtml ?? '<p></p>',
            trustedMediaSourceSet(prev.media.map((media) => media.src))
          );
          const page: EditorialPage = {
            id: existing?.id || intent.id,
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
            updatedAt: intent.timestamp,
          };
          return {
            snapshot: {
              ...prev,
              pages: existing
                ? prev.pages.map((p) => (p.id === existing.id ? page : p))
                : [page, ...prev.pages],
              auditEvents: appendAudit(
                prev,
                existing ? 'Updated static page' : 'Created static page',
                'page',
                page.title,
                `Slug: /${page.slug} · Template: ${page.template}`,
                intent
              ),
            },
            result: page,
          };
        }
      );
      committedStateRef.current = committed.snapshot;
      stateRef.current = committed.snapshot;
      setState(committed.snapshot);
      return committed.result;
    },
    [appendAudit, simulateSaveFailure]
  );

  const deletePage = useCallback(
    (pageId: string): DurableEntityReceipt => {
      const intent = createEntityWriteIntent('page', pageId);
      return updateState((prev) => {
        const target = prev.pages.find((p) => p.id === pageId);
        if (!target) return prev;
        return {
          ...prev,
          pages: prev.pages.filter((p) => p.id !== pageId),
          auditEvents: appendAudit(prev, 'Deleted page', 'page', target.title, `Removed /${target.slug}`, intent),
        };
      }).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; page deletion was not persisted.',
      }));
    },
    [updateState, appendAudit]
  );

  const addCategory = useCallback(
    (catInput: Omit<Category, 'id' | 'slug'> & { slug?: string }): EntityWithDurableReceipt<Category> => {
      const intent = createEntityWriteIntent('cat');
      const baseSlug = slugify(catInput.slug || catInput.name) || 'category';
      const existingInitial = stateRef.current.categories.find((c) => c.slug === baseSlug);
      let created: Category = existingInitial || {
        id: intent.id,
        name: catInput.name.trim(),
        slug: baseSlug,
        parentId: catInput.parentId || undefined,
        description: catInput.description || '',
        locale: catInput.locale || 'en',
      };
      const receipt = updateState((prev) => {
        const existing = prev.categories.find((c) => c.slug === baseSlug);
        if (existing) {
          created = existing;
          return prev;
        }
        return {
          ...prev,
          categories: [...prev.categories, created],
          auditEvents: appendAudit(
            prev,
            'Added taxonomy category',
            'taxonomy',
            created.name,
            `Slug: ${created.slug}${created.parentId ? ` (parent: ${created.parentId})` : ''}`,
            intent
          ),
        };
      }).then((ok) => ({
        ok,
        entity: ok ? created : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; category was not saved.',
      }));
      return attachDurableReceipt(created, receipt);
    },
    [updateState, appendAudit]
  );

  const deleteCategory = useCallback(
    (id: string): DurableEntityReceipt => {
      return updateState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id && c.parentId !== id),
      })).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; category was not deleted.',
      }));
    },
    [updateState]
  );

  const addTag = useCallback(
    (name: string, aliases?: string[]): EntityWithDurableReceipt<Tag> => {
      const intent = createEntityWriteIntent('tag');
      const cleaned = name.trim();
      const existingInitial = stateRef.current.tags.find(
        (t) => t.name.toLowerCase() === cleaned.toLowerCase()
      );
      let resultTag: Tag = existingInitial || {
        id: intent.id,
        name: cleaned,
        slug: slugify(cleaned),
        aliases: aliases || [],
      };
      const receipt = updateState((prev) => {
        const existing = prev.tags.find((t) => t.name.toLowerCase() === cleaned.toLowerCase());
        if (existing) {
          resultTag = existing;
          return prev;
        }
        return {
          ...prev,
          tags: [...prev.tags, resultTag],
          auditEvents: appendAudit(
            prev,
            'Created taxonomy tag',
            'taxonomy',
            resultTag.name,
            `Normalized slug: #${resultTag.slug}`,
            intent
          ),
        };
      }).then((ok) => ({
        ok,
        entity: ok ? resultTag : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; tag was not saved.',
      }));
      return attachDurableReceipt(resultTag, receipt);
    },
    [updateState, appendAudit]
  );

  const deleteTag = useCallback(
    (id: string): DurableEntityReceipt => {
      return updateState((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t.id !== id),
      })).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; tag was not deleted.',
      }));
    },
    [updateState]
  );

  const saveSeries = useCallback(
    (seriesInput: Partial<Series> & { title: string }): EntityWithDurableReceipt<Series> => {
      const intent = createEntityWriteIntent('ser', seriesInput.id);
      const existingInitial = seriesInput.id
        ? stateRef.current.series.find((s) => s.id === seriesInput.id)
        : undefined;
      let saved: Series = {
        id: existingInitial?.id || intent.id,
        title: seriesInput.title.trim(),
        slug: slugify(seriesInput.slug || seriesInput.title),
        description: seriesInput.description ?? existingInitial?.description ?? '',
        locale: seriesInput.locale ?? existingInitial?.locale ?? 'en',
        articleIds: seriesInput.articleIds ?? existingInitial?.articleIds ?? [],
        updatedAt: intent.timestamp,
      };
      const receipt = updateState((prev) => {
        const existing = seriesInput.id ? prev.series.find((s) => s.id === seriesInput.id) : undefined;
        const item: Series = {
          id: existing?.id || intent.id,
          title: seriesInput.title.trim(),
          slug: slugify(seriesInput.slug || seriesInput.title),
          description: seriesInput.description ?? existing?.description ?? '',
          locale: seriesInput.locale ?? existing?.locale ?? 'en',
          articleIds: seriesInput.articleIds ?? existing?.articleIds ?? [],
          updatedAt: intent.timestamp,
        };
        saved = item;
        return {
          ...prev,
          series: existing
            ? prev.series.map((s) => (s.id === existing.id ? item : s))
            : [item, ...prev.series],
        };
      }).then((ok) => ({
        ok,
        entity: ok ? saved : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; series was not saved.',
      }));
      return attachDurableReceipt(saved, receipt);
    },
    [updateState]
  );

  const saveAuthor = useCallback(
    (authorInput: Partial<AuthorProfile> & { displayName: string }): EntityWithDurableReceipt<AuthorProfile> => {
      const intent = createEntityWriteIntent('auth', authorInput.id);
      const existingInitial = authorInput.id
        ? stateRef.current.authors.find((a) => a.id === authorInput.id)
        : undefined;
      let saved: AuthorProfile = {
        id: existingInitial?.id || intent.id,
        displayName: authorInput.displayName.trim(),
        slug: slugify(authorInput.slug || authorInput.displayName),
        biography: authorInput.biography ?? existingInitial?.biography ?? '',
        expertise: authorInput.expertise ?? existingInitial?.expertise ?? [],
        affiliation: authorInput.affiliation ?? existingInitial?.affiliation ?? '',
        orcid: authorInput.orcid ?? existingInitial?.orcid ?? '',
        locale: authorInput.locale ?? existingInitial?.locale ?? 'en',
        role: authorInput.role ?? existingInitial?.role ?? 'author',
      };
      const receipt = updateState((prev) => {
        const existing = authorInput.id ? prev.authors.find((a) => a.id === authorInput.id) : undefined;
        const item: AuthorProfile = {
          id: existing?.id || intent.id,
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
      }).then((ok) => ({
        ok,
        entity: ok ? saved : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; author profile was not saved.',
      }));
      return attachDurableReceipt(saved, receipt);
    },
    [updateState]
  );

  const saveSource = useCallback(
    (sourceInput: Partial<ScientificSource> & { title: string; url: string }): EntityWithDurableReceipt<ScientificSource> => {
      const intent = createEntityWriteIntent('src', sourceInput.id);
      const existingInitial = sourceInput.id
        ? stateRef.current.sources.find((s) => s.id === sourceInput.id)
        : undefined;
      let saved: ScientificSource = {
        id: existingInitial?.id || intent.id,
        articleId: sourceInput.articleId ?? existingInitial?.articleId,
        title: sourceInput.title.trim(),
        authors: sourceInput.authors ?? existingInitial?.authors ?? 'Unknown Authors',
        journal: sourceInput.journal ?? existingInitial?.journal ?? 'Preprint / Journal',
        volume: sourceInput.volume ?? existingInitial?.volume,
        issue: sourceInput.issue ?? existingInitial?.issue,
        pages: sourceInput.pages ?? existingInitial?.pages,
        articleNumber: sourceInput.articleNumber ?? existingInitial?.articleNumber,
        year: sourceInput.year ?? existingInitial?.year ?? 2026,
        doi: sourceInput.doi ?? existingInitial?.doi ?? '',
        url: sourceInput.url.trim(),
        sourceType: sourceInput.sourceType ?? existingInitial?.sourceType ?? 'peer_reviewed',
        accessDate: sourceInput.accessDate ?? existingInitial?.accessDate ?? intent.timestamp.slice(0, 10),
        verificationStatus: sourceInput.verificationStatus ?? existingInitial?.verificationStatus ?? 'unverified',
        notes: sourceInput.notes ?? existingInitial?.notes ?? 'External verification not run (Offline P0 demo)',
        linkedClaim: sourceInput.linkedClaim ?? existingInitial?.linkedClaim ?? '',
        humanClaimVerified: sourceInput.humanClaimVerified ?? existingInitial?.humanClaimVerified ?? false,
      };
      const receipt = updateState((prev) => {
        const existing = sourceInput.id ? prev.sources.find((s) => s.id === sourceInput.id) : undefined;
        const item: ScientificSource = {
          id: existing?.id || intent.id,
          articleId: sourceInput.articleId ?? existing?.articleId,
          title: sourceInput.title.trim(),
          authors: sourceInput.authors ?? existing?.authors ?? 'Unknown Authors',
          journal: sourceInput.journal ?? existing?.journal ?? 'Preprint / Journal',
          volume: sourceInput.volume ?? existing?.volume,
          issue: sourceInput.issue ?? existing?.issue,
          pages: sourceInput.pages ?? existing?.pages,
          articleNumber: sourceInput.articleNumber ?? existing?.articleNumber,
          year: sourceInput.year ?? existing?.year ?? 2026,
          doi: sourceInput.doi ?? existing?.doi ?? '',
          url: sourceInput.url.trim(),
          sourceType: sourceInput.sourceType ?? existing?.sourceType ?? 'peer_reviewed',
          accessDate: sourceInput.accessDate ?? existing?.accessDate ?? intent.timestamp.slice(0, 10),
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
      }).then((ok) => ({
        ok,
        entity: ok ? saved : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; scientific source was not saved.',
      }));
      return attachDurableReceipt(saved, receipt);
    },
    [updateState]
  );

  const updateSource = useCallback(
    (sourceId: string, patch: Partial<ScientificSource>): DurableEntityReceipt => {
      return updateState(
        (prev) => ({
          ...prev,
          sources: prev.sources.map((s) => (s.id === sourceId ? { ...s, ...patch } : s)),
        }),
        { optimistic: true }
      ).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; source update was not saved.',
      }));
    },
    [updateState]
  );

  const deleteSource = useCallback(
    (sourceId: string): DurableEntityReceipt => {
      const intent = createEntityWriteIntent('src-del', sourceId);
      return updateState((prev) => {
        const nextArticles = prev.articles.map((a) => {
          if (!a.sourceIds.includes(sourceId)) return a;
          return {
            ...a,
            sourceIds: a.sourceIds.filter((id) => id !== sourceId),
            version: a.version + 1,
            updatedAt: intent.timestamp,
          };
        });
        return {
          ...prev,
          sources: prev.sources.filter((s) => s.id !== sourceId),
          articles: nextArticles,
        };
      }).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; source deletion was not saved.',
      }));
    },
    [updateState]
  );

  const saveKnowledgeLink = useCallback(
    (klInput: Partial<KnowledgeLink> & { term: string; targetUrl: string }): EntityWithDurableReceipt<KnowledgeLink> => {
      if (!validateSafeUrl(klInput.targetUrl).valid) {
        throw new Error('Knowledge link target must be an HTTP(S) URL or same-application path');
      }
      const intent = createEntityWriteIntent('kl', klInput.id);
      const existingInitial = klInput.id
        ? stateRef.current.knowledgeLinks.find((k) => k.id === klInput.id)
        : undefined;
      let saved: KnowledgeLink = {
        id: existingInitial?.id || intent.id,
        term: klInput.term.trim(),
        targetType: klInput.targetType ?? existingInitial?.targetType ?? 'wikipedia',
        targetUrl: klInput.targetUrl.trim(),
        targetArticleId: klInput.targetArticleId ?? existingInitial?.targetArticleId,
        locale: klInput.locale ?? existingInitial?.locale ?? 'en',
        previewTitle: klInput.previewTitle || klInput.term.trim(),
        previewExcerpt:
          klInput.previewExcerpt ||
          'Educational concept summary stored in local P0 demo knowledge repository.',
        sourceAttribution:
          klInput.sourceAttribution ||
          (klInput.targetType === 'internal'
            ? 'ScientificRadar Internal Reference'
            : 'Wikipedia · CC BY-SA 4.0 (Demo sample)'),
        reviewStatus: klInput.reviewStatus ?? existingInitial?.reviewStatus ?? 'approved',
        isSampleDemoData: true,
      };
      const receipt = updateState((prev) => {
        const existing = klInput.id ? prev.knowledgeLinks.find((k) => k.id === klInput.id) : undefined;
        const item: KnowledgeLink = {
          id: existing?.id || intent.id,
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
      }).then((ok) => ({
        ok,
        entity: ok ? saved : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; knowledge link was not saved.',
      }));
      return attachDurableReceipt(saved, receipt);
    },
    [updateState]
  );

  const addMediaAsset = useCallback(
    (assetInput: Partial<MediaAsset> & { filename: string; title: string; src: string }): EntityWithDurableReceipt<MediaAsset> => {
      const intent = createEntityWriteIntent('media', assetInput.id);
      const kind = assetInput.kind || 'scientific_figure';
      const isFigure =
        kind === 'scientific_figure' || kind === 'chart' || kind === 'diagram';
      const created: MediaAsset = {
        id: intent.id,
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
        credit: assetInput.credit?.trim() ?? '',
        licence: assetInput.licence?.trim() ?? '',
        sourceUrl: assetInput.sourceUrl || '',
        layout: assetInput.layout || (isFigure ? 'locked' : 'auto'),
        focalPoint: assetInput.focalPoint || { x: 0.5, y: 0.5 },
        createdAt: intent.timestamp,
        humanReviewedAlt: assetInput.humanReviewedAlt ?? false,
      };
      const receipt = updateState((prev) => ({
        ...prev,
        media: [created, ...prev.media.filter((m) => m.id !== created.id)],
        auditEvents: appendAudit(
          prev,
          'Added media asset to Local Demo Storage',
          'media',
          created.title,
          `Kind: ${created.kind} · Layout: ${created.layout} (Cloudflare R2 not connected)`,
          intent
        ),
      })).then((ok) => ({
        ok,
        entity: ok ? created : undefined,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; media asset was not saved.',
      }));
      return attachDurableReceipt(created, receipt);
    },
    [updateState, appendAudit]
  );

  const updateMediaAsset = useCallback(
    (id: string, patch: Partial<MediaAsset>): DurableEntityReceipt => {
      return updateState(
        (prev) => ({
          ...prev,
          media: prev.media.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }),
        { optimistic: true }
      ).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; media update was not saved.',
      }));
    },
    [updateState]
  );

  const deleteMediaAsset = useCallback(
    (id: string): DurableEntityReceipt => {
      return updateState((prev) => ({
        ...prev,
        media: prev.media.filter((m) => m.id !== id),
      })).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; media asset was not deleted.',
      }));
    },
    [updateState]
  );

  const updateHomepageBlocks = useCallback(
    (homepageBlocks: HomepageBlock[]): DurableEntityReceipt => {
      const intent = createEntityWriteIntent('home');
      return updateState((prev) => ({
        ...prev,
        homepageBlocks,
        auditEvents: appendAudit(
          prev,
          'Updated homepage block layout',
          'navigation',
          'Homepage Configuration',
          'Updated local homepage preview blocks (not live on scientificradar.com)',
          intent
        ),
      })).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; homepage blocks were not saved.',
      }));
    },
    [updateState, appendAudit]
  );

  const updateMenus = useCallback(
    (menus: MenuConfig[]): DurableEntityReceipt => {
      const intent = createEntityWriteIntent('menu');
      return updateState((prev) => ({
        ...prev,
        menus,
        auditEvents: appendAudit(
          prev,
          'Updated site navigation menus',
          'navigation',
          'Site Menus',
          'Updated primary/footer menu configuration in local demo store',
          intent
        ),
      })).then((ok) => ({
        ok,
        storageRevision: committedStateRef.current.storageRevision,
        error: ok ? undefined : 'Storage transaction failed; menus were not saved.',
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

      const runImport = mutationTailRef.current.then(async (): Promise<{ ok: boolean; error?: string }> => {
        if (simulateSaveFailure) {
          return { ok: false, error: 'Persistence failure is enabled; no data was restored' };
        }
        try {
          const db = await getDb();
          if (!db) return { ok: false, error: 'IndexedDB is unavailable; backup was not restored' };
          const committed = await commitSnapshotMutation<StudioDatabaseSnapshot, undefined>(
            db,
            STORE_NAME,
            STATE_KEY,
            getInitialSeedSnapshot(),
            () => ({ snapshot: candidate, result: undefined })
          );
          committedStateRef.current = committed.snapshot;
          stateRef.current = committed.snapshot;
          setState(committed.snapshot);
          setPersistenceMode('indexeddb');
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', committed.snapshot.theme === 'dark');
          }
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'IndexedDB write failed; previous state remains active',
          };
        }
      });
      mutationTailRef.current = runImport.then(() => undefined, () => undefined);
      return runImport;
    },
    [simulateSaveFailure]
  );

  const resetDemoDatabase = useCallback(async () => {
    const seed = getInitialSeedSnapshot();
    const runReset = mutationTailRef.current.then(async () => {
      const result = await persistState(seed);
      if (!result.ok) throw new Error(result.error || 'Reset could not be persisted.');
      if (result.volatileMemoryOnly) {
        committedStateRef.current = seed;
        stateRef.current = seed;
      }
      setState(stateRef.current);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', stateRef.current.theme === 'dark');
      }
    });
    mutationTailRef.current = runReset.then(() => undefined, () => undefined);
    return runReset;
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
