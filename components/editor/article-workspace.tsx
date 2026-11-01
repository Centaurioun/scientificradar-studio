'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Tag as TagIcon,
  Image as ImageIcon,
  Globe,
  History,
  Send,
  ArrowLeft,
  Plus,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  ShieldAlert,
  RefreshCw,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useStudio } from '@/lib/studio-context';
import { Article, ArticleStatus, MediaAsset, SaveState } from '@/lib/types';
import {
  MAX_EDITORIAL_TAGS,
  calculateReadingTimeMinutes,
  countWordsFromHtml,
  isValidHttpUrl,
  slugify,
  validateCategoriesAndTags,
} from '@/lib/editorial-rules';
import { ArticleTiptapEditor } from './article-tiptap-editor';
import { CodexAssistantDrawer } from '@/components/assistant/codex-assistant-drawer';
import { ArticlePreviewView } from './article-preview-view';
import { runArticleAudit } from '@/lib/audit/run-article-audit';
import { AuditFinding } from '@/lib/audit/types';
import { AuditStatusBadge } from '@/components/audit/audit-status';
import { PrePublishDialog } from '@/components/audit/pre-publish-dialog';
import { LocalizedDate } from '@/components/datetime/localized-date';
import {
  formatIsoToWallTimeInput,
  interpretWallTime,
} from '@/lib/datetime/parse';

import { AppShell } from '@/components/layout/app-shell';

interface ArticleWorkspaceProps {
  articleId?: string;
}

type InspectorTab = 'taxonomy' | 'sources' | 'figures' | 'seo' | 'revisions';

export function ArticleWorkspace({ articleId }: ArticleWorkspaceProps) {
  const router = useRouter();
  const [fallbackArticleId] = useState(() => `art-${Date.now()}`);
  const effectiveArticleId = articleId || fallbackArticleId;
  const {
    articles,
    categories,
    tags,
    series,
    authors,
    sources,
    media,
    knowledgeLinks,
    revisions,
    integrations,
    activeRole,
    dateTimePreferences,
    persistenceMode,
    persistArticleDraft,
    transitionArticleStatus,
    restoreArticleRevision,
    addTag,
    saveSource,
    updateSource,
    addMediaAsset,
    updateMediaAsset,
    runAndStoreArticleAudit,
  } = useStudio();

  const existingArticle = articles.find((a) => a.id === effectiveArticleId);

  const [title, setTitle] = useState(existingArticle?.title || '');
  const [slug, setSlug] = useState(existingArticle?.slug || '');
  const [summary, setSummary] = useState(existingArticle?.summary || '');
  const [locale, setLocale] = useState<'en' | 'tr'>(existingArticle?.locale || 'en');
  const [bodyHtml, setBodyHtml] = useState(existingArticle?.bodyHtml || '<p></p>');
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>(
    existingArticle?.body || { type: 'doc', content: [] }
  );
  const latestBodyRef = useRef<{ bodyHtml: string; body: Record<string, unknown> }>({
    bodyHtml: existingArticle?.bodyHtml || '<p></p>',
    body: existingArticle?.body || { type: 'doc', content: [] },
  });
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    existingArticle?.primaryCategoryId || 'cat-physics'
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    existingArticle?.categoryIds || ['cat-physics']
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    existingArticle?.tagIds || []
  );
  const [seriesId, setSeriesId] = useState<string>(existingArticle?.seriesId || '');
  const [authorId, setAuthorId] = useState<string>(
    existingArticle?.authorId || 'auth-elena'
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    existingArticle?.sourceIds || []
  );
  const [featuredMediaId, setFeaturedMediaId] = useState<string>(
    existingArticle?.featuredMediaId || ''
  );
  const [seoTitle, setSeoTitle] = useState(existingArticle?.seo.title || '');
  const [seoDescription, setSeoDescription] = useState(
    existingArticle?.seo.description || ''
  );
  const [seoCanonical, setSeoCanonical] = useState(
    existingArticle?.seo.canonical || ''
  );
  const [scheduledAt, setScheduledAt] = useState(
    existingArticle?.scheduledAt || ''
  );
  const [scheduleWallInput, setScheduleWallInput] = useState(() =>
    formatIsoToWallTimeInput(
      existingArticle?.scheduledAt,
      dateTimePreferences?.timeZone || 'Europe/Istanbul'
    )
  );
  const [dstDisambiguation, setDstDisambiguation] = useState<'earlier' | 'later'>('earlier');

  // UI states
  const [activeMode, setActiveMode] = useState<'write' | 'preview'>('write');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('taxonomy');
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Verified Save State machine
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const draftEditRevisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(
    existingArticle?.updatedAt
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [volatileWarning, setVolatileWarning] = useState(false);
  const [demotedNotice, setDemotedNotice] = useState<number>(0);
  const [workflowFeedback, setWorkflowFeedback] = useState<string | null>(null);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
  const [taxonomyNotice, setTaxonomyNotice] = useState<string | null>(null);
  const [tagLimitNotice, setTagLimitNotice] = useState<string | null>(null);

  // Navigation Guard & Pre-Publish Dialog
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);
  const [prePublishOpen, setPrePublishOpen] = useState(false);
  const [figurePickerOpen, setFigurePickerOpen] = useState(false);
  const [pendingFigureInsert, setPendingFigureInsert] = useState<MediaAsset | null>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Inline creation inputs
  const [newTagName, setNewTagName] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceDoi, setNewSourceDoi] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState<
    'peer_reviewed' | 'preprint' | 'institutional' | 'dataset'
  >('peer_reviewed');

  const isDirty = saveState === 'dirty' || saveState === 'failed';
  const lastSyncedVersionRef = useRef<number | undefined>(existingArticle?.version);

  // Auto-grow Article Title (H1) textarea whenever title or mode changes
  useEffect(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(44, el.scrollHeight)}px`;
  }, [title, activeMode]);

  // Sync when switching article ID or when external version updates (e.g. Quick Fix / Revision Restore)
  useEffect(() => {
    if (!existingArticle) return;
    if (
      lastSyncedVersionRef.current !== existingArticle.version &&
      saveState !== 'dirty'
    ) {
      lastSyncedVersionRef.current = existingArticle.version;
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setSummary(existingArticle.summary);
      setLocale(existingArticle.locale);
      setBodyHtml(existingArticle.bodyHtml);
      setBodyJson(existingArticle.body || { type: 'doc', content: [] });
      latestBodyRef.current = {
        bodyHtml: existingArticle.bodyHtml,
        body: existingArticle.body || { type: 'doc', content: [] },
      };
      setPrimaryCategoryId(existingArticle.primaryCategoryId || 'cat-physics');
      setSelectedCategoryIds(existingArticle.categoryIds);
      setSelectedTagIds(existingArticle.tagIds);
      setSeriesId(existingArticle.seriesId || '');
      setAuthorId(existingArticle.authorId || 'auth-elena');
      setSelectedSourceIds(existingArticle.sourceIds);
      setFeaturedMediaId(existingArticle.featuredMediaId || '');
      setSeoTitle(existingArticle.seo.title || '');
      setSeoDescription(existingArticle.seo.description || '');
      setSeoCanonical(existingArticle.seo.canonical || '');
      setScheduledAt(existingArticle.scheduledAt || '');
      setScheduleWallInput(
        formatIsoToWallTimeInput(
          existingArticle.scheduledAt,
          dateTimePreferences?.timeZone || 'Europe/Istanbul'
        )
      );
      setLastSavedAt(existingArticle.updatedAt);
      setSaveState('clean');
    }
  }, [existingArticle, saveState, dateTimePreferences?.timeZone]);

  // Keep scheduleWallInput synced when user changes timezone in Settings
  useEffect(() => {
    if (!scheduledAt) return;
    const timer = window.setTimeout(() => {
      setScheduleWallInput(
        formatIsoToWallTimeInput(
          scheduledAt,
          dateTimePreferences?.timeZone || 'Europe/Istanbul'
        )
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dateTimePreferences?.timeZone, scheduledAt]);

  // Warn before browser tab close/reload if unsaved changes exist
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle deep-link query parameters (?tab=...&focus=...)
  const focusFieldById = useCallback((fieldId: string, tab?: InspectorTab) => {
    if (tab) {
      setInspectorOpen(true);
      setInspectorTab(tab);
    }
    setActiveMode('write');
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 80);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as InspectorTab | null;
      const focusParam = params.get('focus');
      if (
        tabParam &&
        ['taxonomy', 'sources', 'figures', 'seo', 'revisions'].includes(tabParam)
      ) {
        setInspectorOpen(true);
        setInspectorTab(tabParam);
      }
      if (focusParam) {
        focusFieldById(focusParam);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusFieldById]);

  const markDirty = useCallback(() => {
    draftEditRevisionRef.current += 1;
    setSaveState('dirty');
    setSaveError(null);
  }, []);

  const currentDraftArticle: Article = useMemo(
    () => ({
      id: existingArticle?.id || effectiveArticleId,
      locale,
      title: title || 'Untitled Scientific Article',
      slug: slug || slugify(title) || 'untitled-scientific-article',
      summary,
      body: bodyJson,
      bodyHtml,
      status: existingArticle?.status || 'draft',
      primaryCategoryId,
      categoryIds: Array.from(new Set([primaryCategoryId, ...selectedCategoryIds])),
      tagIds: selectedTagIds.slice(0, MAX_EDITORIAL_TAGS),
      seriesId: seriesId || undefined,
      authorId,
      sourceIds: selectedSourceIds,
      featuredMediaId: featuredMediaId || undefined,
      seo: {
        title: seoTitle,
        description: seoDescription,
        canonical: seoCanonical,
        noindex: true,
      },
      scheduledAt: scheduledAt || undefined,
      publishedAt: existingArticle?.publishedAt,
      createdAt: existingArticle?.createdAt || '2026-10-31T00:00:00.000Z',
      updatedAt: lastSavedAt || existingArticle?.updatedAt || '2026-10-31T00:00:00.000Z',
      version: existingArticle?.version || 1,
      reviewNotes: existingArticle?.reviewNotes || [],
    }),
    [
      existingArticle,
      effectiveArticleId,
      locale,
      title,
      slug,
      summary,
      bodyJson,
      bodyHtml,
      primaryCategoryId,
      selectedCategoryIds,
      selectedTagIds,
      seriesId,
      authorId,
      selectedSourceIds,
      featuredMediaId,
      seoTitle,
      seoDescription,
      seoCanonical,
      scheduledAt,
      lastSavedAt,
    ]
  );

  // Schedule wall-time interpretation in user's configured IANA timezone
  const scheduleInterpretation = useMemo(() => {
    if (!scheduleWallInput.trim()) return null;
    return interpretWallTime(
      scheduleWallInput,
      dateTimePreferences?.timeZone || 'Europe/Istanbul',
      dstDisambiguation
    );
  }, [scheduleWallInput, dateTimePreferences?.timeZone, dstDisambiguation]);

  // Execute genuine verified repository persistence
  const performSave = useCallback(
    (
      createRevision: boolean,
      revisionSummary?: string,
      draftOverride?: Partial<Article>
    ): Promise<boolean> => {
      const requestedDraftRevision = draftEditRevisionRef.current;
      const queuedSave = saveQueueRef.current.then(async () => {
        setSaveState('saving');
        setSaveError(null);
        const draftPayload: Article = {
          ...currentDraftArticle,
          body: draftOverride?.body ?? latestBodyRef.current.body ?? currentDraftArticle.body,
          bodyHtml:
            draftOverride?.bodyHtml ?? latestBodyRef.current.bodyHtml ?? currentDraftArticle.bodyHtml,
          ...draftOverride,
        };
        const receipt = await persistArticleDraft(draftPayload, {
          expectedVersion: lastSyncedVersionRef.current,
          createRevision,
          revisionSource: 'editor',
          revisionSummary,
        });

        if (!receipt.ok) {
          setSaveState(
            draftEditRevisionRef.current === requestedDraftRevision ? 'failed' : 'dirty'
          );
          setSaveError(receipt.error || 'Failed to persist draft to local repository.');
          return false;
        }

        lastSyncedVersionRef.current = receipt.version;
        setLastSavedAt(receipt.savedAt);
        setVolatileWarning(receipt.volatileMemoryOnly);
        if (receipt.demotedH1Count > 0) {
          setDemotedNotice(receipt.demotedH1Count);
        }
        setSaveState(draftEditRevisionRef.current === requestedDraftRevision ? 'clean' : 'dirty');
        return true;
      });
      saveQueueRef.current = queuedSave.then(() => undefined, () => undefined);
      return queuedSave;
    },
    [persistArticleDraft, currentDraftArticle]
  );

  // Debounced verified autosave when dirty (paused while inspecting/restoring revision history)
  useEffect(() => {
    if (saveState !== 'dirty' || restoringRevisionId !== null || inspectorTab === 'revisions') return;
    const timer = setTimeout(() => {
      void performSave(false);
    }, 950);
    return () => clearTimeout(timer);
  }, [saveState, performSave, restoringRevisionId, inspectorTab]);

  const handleManualSave = async (createRevision: boolean) => {
    await performSave(
      createRevision,
      createRevision
        ? `Manual editorial checkpoint saved by ${activeRole}`
        : undefined
    );
  };

  // Safe navigation helper that checks for unsaved changes
  const handleGuardedNavigate = (href: string) => {
    if (isDirty) {
      setPendingNavHref(href);
    } else {
      router.push(href);
    }
  };

  // Live deterministic SEO & Editorial Quality Audit report for current draft
  const liveAuditReport = useMemo(
    () =>
      runArticleAudit({
        article: currentDraftArticle,
        allArticles: articles.map((a) =>
          a.id === currentDraftArticle.id ? currentDraftArticle : a
        ),
        categories,
        tags,
        sources,
        media,
        knowledgeLinks,
        integrations,
      }),
    [
      currentDraftArticle,
      articles,
      categories,
      tags,
      sources,
      media,
      knowledgeLinks,
      integrations,
    ]
  );

  const wordCount = useMemo(() => countWordsFromHtml(bodyHtml), [bodyHtml]);
  const readingTime = useMemo(
    () => calculateReadingTimeMinutes(wordCount),
    [wordCount]
  );
  const taxonomyCheck = useMemo(
    () =>
      validateCategoriesAndTags(
        primaryCategoryId,
        selectedCategoryIds,
        selectedTagIds
      ),
    [primaryCategoryId, selectedCategoryIds, selectedTagIds]
  );

  const primaryCategories = categories.filter((c) => !c.parentId);
  const childCategoriesForPrimary = useMemo(
    () => categories.filter((c) => c.parentId === primaryCategoryId),
    [categories, primaryCategoryId]
  );

  // Handle Primary Category switch & reconcile subcategories
  const handlePrimaryCategoryChange = (nextPrimaryId: string) => {
    const validChildIds = new Set(
      categories.filter((c) => c.parentId === nextPrimaryId).map((c) => c.id)
    );
    const keptSubIds = selectedCategoryIds.filter((id) => validChildIds.has(id));
    const previousSubIds = selectedCategoryIds.filter(
      (id) => id !== primaryCategoryId && id !== nextPrimaryId
    );

    if (previousSubIds.length !== keptSubIds.length) {
      const nextPrimaryName =
        categories.find((c) => c.id === nextPrimaryId)?.name || 'new primary category';
      setTaxonomyNotice(
        `Cleared ${
          previousSubIds.length - keptSubIds.length
        } subcategory selection(s) that do not belong to ${nextPrimaryName}.`
      );
    } else {
      setTaxonomyNotice(null);
    }

    setPrimaryCategoryId(nextPrimaryId);
    setSelectedCategoryIds([nextPrimaryId, ...keptSubIds]);
    markDirty();
  };

  const toggleSubcategory = (subId: string) => {
    setTaxonomyNotice(null);
    setSelectedCategoryIds((prev) => {
      const exists = prev.includes(subId);
      const next = exists ? prev.filter((id) => id !== subId) : [...prev, subId];
      return Array.from(new Set([primaryCategoryId, ...next]));
    });
    markDirty();
  };

  const toggleTag = (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    if (isSelected) {
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
      setTagLimitNotice(null);
      markDirty();
      return;
    }
    if (selectedTagIds.length >= MAX_EDITORIAL_TAGS) {
      setTagLimitNotice(
        `Maximum ${MAX_EDITORIAL_TAGS} tags for this article. Remove one before adding another.`
      );
      return;
    }
    setTagLimitNotice(null);
    setSelectedTagIds((prev) => [...prev, tagId]);
    markDirty();
  };

  const handleAddInlineTag = async () => {
    if (!newTagName.trim()) return;
    if (selectedTagIds.length >= MAX_EDITORIAL_TAGS) {
      setTagLimitNotice(
        `Maximum ${MAX_EDITORIAL_TAGS} tags for this article. Remove one before adding another.`
      );
      return;
    }
    const created = addTag(newTagName.trim());
    const receipt = await created.committed;
    if (!receipt.ok) {
      setTagLimitNotice(receipt.error || 'Storage transaction failed; tag was not saved.');
      return;
    }
    if (!selectedTagIds.includes(created.id)) {
      setSelectedTagIds((prev) => [...prev, created.id]);
    }
    setNewTagName('');
    setTagLimitNotice(null);
    markDirty();
  };

  const handleAddInlineSource = async () => {
    if (!newSourceTitle.trim() || !isValidHttpUrl(newSourceUrl.trim())) return;
    const created = saveSource({
      articleId: currentDraftArticle.id,
      title: newSourceTitle.trim(),
      doi: newSourceDoi.trim(),
      url: newSourceUrl.trim(),
      sourceType: newSourceType,
      verificationStatus: 'unverified',
      notes: 'Added in editor · External DOI lookup not run in offline P0 demo',
    });
    const receipt = await created.committed;
    if (!receipt.ok) {
      setWorkflowFeedback(receipt.error || 'Storage transaction failed; source was not saved.');
      return;
    }
    setSelectedSourceIds((prev) => [...prev, created.id]);
    setNewSourceTitle('');
    setNewSourceDoi('');
    setNewSourceUrl('');
    markDirty();
  };

  const handleStatusChange = async (nextStatus: ArticleStatus, note?: string) => {
    if (isDirty) {
      const savedOk = await performSave(false);
      if (!savedOk) return;
    }
    const res = await transitionArticleStatus(currentDraftArticle.id, nextStatus, note);
    if (!res.ok) {
      setWorkflowFeedback(res.error || 'Transition not permitted for active role.');
    } else {
      setWorkflowFeedback(
        nextStatus === 'published'
          ? 'Status updated to Published in local demo store only (scientificradar.com untouched).'
          : `Status transitioned to ${nextStatus.replace('_', ' ')}.`
      );
    }
  };

  const handleGoToFieldFromFinding = useCallback(
    (finding: AuditFinding) => {
      const tab = (finding.inspectorTab as InspectorTab) || 'seo';
      if (finding.targetField) {
        focusFieldById(finding.targetField, tab);
      } else {
        setInspectorOpen(true);
        setInspectorTab(tab);
      }
    },
    [focusFieldById]
  );

  const articleRevisions = revisions.filter(
    (r) => r.articleId === currentDraftArticle.id
  );
  const featuredMedia = media.find((m) => m.id === featuredMediaId);

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Top Article Action Bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleGuardedNavigate('/articles')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Articles</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {currentDraftArticle.status.replace('_', ' ')} · v{currentDraftArticle.version}
            </span>
            <span className="text-xs text-slate-400">·</span>

            {/* Truthful Save Status Indicator */}
            <span
              data-testid="editor-save-indicator"
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            >
              {saveState === 'saving' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Saving to local store…</span>
                </>
              ) : saveState === 'dirty' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    Unsaved changes
                  </span>
                </>
              ) : saveState === 'failed' ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Save failed — changes not persisted</span>
                  <button
                    type="button"
                    onClick={() => void handleManualSave(false)}
                    className="ml-1 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-700"
                  >
                    Retry Save
                  </button>
                </span>
              ) : volatileWarning || persistenceMode === 'memory_fallback' ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Saved in volatile session memory only</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    Saved (Local){' '}
                    {lastSavedAt && (
                      <LocalizedDate iso={lastSavedAt} mode="time" className="font-mono" />
                    )}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Mode & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Write / Preview Switch */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('write')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeMode === 'write'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('preview')}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Reader Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleManualSave(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Snapshot</span>
          </button>

          {/* Workflow transitions */}
          {currentDraftArticle.status === 'draft' && (
            <button
              type="button"
              onClick={() => void handleStatusChange('in_review', 'Submitted for scientific review')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {(activeRole === 'owner' || activeRole === 'editor') && (
            <button
              type="button"
              onClick={async () => {
                if (isDirty) {
                  const ok = await performSave(false);
                  if (!ok) return;
                }
                const auditReceipt = await runAndStoreArticleAudit(currentDraftArticle.id);
                setWorkflowFeedback(
                  auditReceipt.persisted
                    ? 'SEO audit calculated and saved to IndexedDB.'
                    : auditReceipt.error || 'SEO audit was calculated in memory but not saved.'
                );
                if (auditReceipt.persisted) setPrePublishOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Publish (Demo)</span>
            </button>
          )}

          {/* Optional AI Assistant Drawer Button */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectorOpen((v) => !v)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title={inspectorOpen ? 'Collapse metadata inspector' : 'Expand metadata inspector'}
            aria-label={inspectorOpen ? 'Collapse metadata inspector' : 'Expand metadata inspector'}
          >
            {inspectorOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Save Error Banner */}
      {saveError && (
        <div
          role="alert"
          className="flex items-center justify-between border-b border-red-300 bg-red-50 px-6 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span>
              <strong>Save Failed:</strong> {saveError}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleManualSave(false)}
            className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Feedback / H1 Demotion Notice */}
      {(demotedNotice > 0 || workflowFeedback) && (
        <div role="status" className="flex items-center justify-between border-b border-indigo-200 bg-indigo-50 px-6 py-2 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              {workflowFeedback ||
                `Single-H1 Rule Enforced: ${demotedNotice} body <h1> heading(s) were automatically converted to <h2> so the article title remains the sole H1.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setDemotedNotice(0);
              setWorkflowFeedback(null);
            }}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeMode === 'preview' ? (
        <div className="p-6">
          <ArticlePreviewView article={currentDraftArticle} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Center Writing Surface */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-5">
              {/* Language, Reading Stats & Primary Discipline Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold uppercase text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Sole H1 Title Surface
                  </span>
                  <span>·</span>
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>~{readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="article-locale-select" className="font-medium">
                    Article Locale:
                  </label>
                  <select
                    id="article-locale-select"
                    value={locale}
                    onChange={(e) => {
                      setLocale(e.target.value as 'en' | 'tr');
                      markDirty();
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="en">English (EN)</option>
                    <option value="tr">Türkçe (TR)</option>
                  </select>
                </div>
              </div>

              {/* Article Title (The ONLY H1) — Auto-growing multi-line textarea (SRS-ED-003) */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <label htmlFor="article-title-input" className="font-semibold uppercase tracking-wider text-slate-500">
                    Article Title (H1)
                  </label>
                  <span data-testid="article-title-char-count" className="font-mono">
                    {title.trim().length} chars
                  </span>
                </div>
                <textarea
                  ref={titleTextareaRef}
                  id="article-title-input"
                  aria-label="Article Title (H1)"
                  rows={1}
                  value={title}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(/[\r\n]+/g, ' ');
                    setTitle(normalized);
                    markDirty();
                  }}
                  placeholder="Enter scientific article title (sole page H1)…"
                  className="w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-serif text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-slate-900 break-words placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:text-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Slug & Summary / Standfirst */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label
                    htmlFor="article-slug-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Normalized URL Slug
                  </label>
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                    <span className="text-slate-400">/{locale}/</span>
                    <input
                      id="article-slug-input"
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        markDirty();
                      }}
                      className="w-full bg-transparent font-mono text-xs text-slate-800 focus:outline-hidden dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="article-summary-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Scientific Abstract / Standfirst Summary
                  </label>
                  <textarea
                    id="article-summary-input"
                    rows={2}
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      markDirty();
                    }}
                    placeholder="Concise 1–2 sentence scientific summary for cards, feeds, and meta fallback…"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Tiptap Body Editor (H2 & H3 only) */}
              <ArticleTiptapEditor
                contentHtml={bodyHtml}
                knowledgeLinks={knowledgeLinks}
                availableSources={sources.filter((s) => selectedSourceIds.includes(s.id))}
                trustedImageSources={new Set(media.map((m) => m.src))}
                pendingFigureInsert={pendingFigureInsert}
                onFigureInserted={() => setPendingFigureInsert(null)}
                onRequestMediaInsert={() => setFigurePickerOpen(true)}
                onApplyHtmlSource={(sanitizedHtml, _summaryNote, nextJson) => {
                  latestBodyRef.current = { bodyHtml: sanitizedHtml, body: nextJson };
                  setBodyHtml(sanitizedHtml);
                  setBodyJson(nextJson);
                  markDirty();
                  void performSave(
                    true,
                    `Applied sanitized HTML Source edits by ${activeRole}`,
                    { bodyHtml: sanitizedHtml, body: nextJson }
                  );
                }}
                onSyncJson={(nextJson, canonicalHtml) => {
                  latestBodyRef.current = { bodyHtml: canonicalHtml, body: nextJson };
                  setBodyJson(nextJson);
                }}
                onChange={(html, nextJson) => {
                  latestBodyRef.current = { bodyHtml: html, body: nextJson };
                  setBodyHtml(html);
                  setBodyJson(nextJson);
                  markDirty();
                }}
                onDemotedH1={(count) => {
                  setDemotedNotice((prev) => prev + count);
                }}
              />
            </div>
          </div>

          {/* Right Collapsible Metadata Inspector */}
          {inspectorOpen && (
            <aside
              aria-label="Article Metadata Inspector"
              className="w-full shrink-0 border-t border-slate-200 bg-white lg:w-96 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Inspector Tabs */}
              <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setInspectorTab('taxonomy')}
                  className={`flex flex-col items-center gap-1 py-2.5 border-b-2 transition-colors ${
                    inspectorTab === 'taxonomy'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  <span>Taxonomy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('sources')}
                  className={`flex flex-col items-center gap-1 py-2.5 border-b-2 transition-colors ${
                    inspectorTab === 'sources'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Sources ({selectedSourceIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('figures')}
                  className={`flex flex-col items-center gap-1 py-2.5 border-b-2 transition-colors ${
                    inspectorTab === 'figures'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Figure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('seo')}
                  className={`flex flex-col items-center gap-1 py-2.5 border-b-2 transition-colors ${
                    inspectorTab === 'seo'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>SEO</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('revisions')}
                  className={`flex flex-col items-center gap-1 py-2.5 border-b-2 transition-colors ${
                    inspectorTab === 'revisions'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>History ({articleRevisions.length})</span>
                </button>
              </div>

              <div className="p-4 space-y-5 text-xs">
                {/* TAB 1: TAXONOMY */}
                {inspectorTab === 'taxonomy' && (
                  <div className="space-y-4">
                    {!taxonomyCheck.valid && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        {taxonomyCheck.warnings.map((w, i) => (
                          <p key={i}>• {w}</p>
                        ))}
                      </div>
                    )}

                    {taxonomyNotice && (
                      <div
                        role="status"
                        className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200"
                      >
                        {taxonomyNotice}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="primary-category-select"
                        className="block font-bold uppercase tracking-wider text-slate-500"
                      >
                        Primary Scientific Discipline (Required)
                      </label>
                      <select
                        id="primary-category-select"
                        value={primaryCategoryId}
                        onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                      >
                        {primaryCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <fieldset id="subcategory-fieldset" tabIndex={-1}>
                      <legend className="block font-bold uppercase tracking-wider text-slate-500">
                        Subcategories ({categories.find((c) => c.id === primaryCategoryId)?.name})
                      </legend>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Showing only subcategories belonging to the selected primary discipline.
                      </p>
                      <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                        {childCategoriesForPrimary.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            No subcategories defined under this primary discipline.
                          </p>
                        ) : (
                          childCategoriesForPrimary.map((sub) => (
                            <label
                              key={sub.id}
                              className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(sub.id)}
                                  onChange={() => toggleSubcategory(sub.id)}
                                  className="rounded border-slate-300 text-indigo-600"
                                />
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {sub.name}
                                </span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                /{sub.slug}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </fieldset>

                    {/* Tags with strict max 6 limit */}
                    <fieldset id="tags-fieldset" tabIndex={-1}>
                      <div className="flex items-center justify-between">
                        <legend className="block font-bold uppercase tracking-wider text-slate-500">
                          Editorial Tags (Max {MAX_EDITORIAL_TAGS})
                        </legend>
                        <span
                          data-testid="tag-counter-badge"
                          className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                            selectedTagIds.length >= MAX_EDITORIAL_TAGS
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {selectedTagIds.length} / {MAX_EDITORIAL_TAGS} tags
                        </span>
                      </div>

                      {tagLimitNotice && (
                        <p
                          role="alert"
                          className="mt-1.5 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                        >
                          {tagLimitNotice}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((t) => {
                          const active = selectedTagIds.includes(t.id);
                          const disabled =
                            !active && selectedTagIds.length >= MAX_EDITORIAL_TAGS;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleTag(t.id)}
                              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                                active
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200'
                                  : disabled
                                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              #{t.name}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex gap-1.5">
                        <input
                          type="text"
                          value={newTagName}
                          disabled={selectedTagIds.length >= MAX_EDITORIAL_TAGS}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder={
                            selectedTagIds.length >= MAX_EDITORIAL_TAGS
                              ? 'Max 6 tags reached'
                              : 'Create & attach tag…'
                          }
                          aria-label="Create and attach new tag"
                          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          disabled={selectedTagIds.length >= MAX_EDITORIAL_TAGS}
                          onClick={handleAddInlineTag}
                          aria-label="Add inline tag"
                          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </fieldset>

                    {/* Series & Author */}
                    <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <label
                          htmlFor="article-series-select"
                          className="block font-bold uppercase tracking-wider text-slate-500"
                        >
                          Article Series / Dossier
                        </label>
                        <select
                          id="article-series-select"
                          value={seriesId}
                          onChange={(e) => {
                            setSeriesId(e.target.value);
                            markDirty();
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="">None (Standalone Article)</option>
                          {series.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="article-author-select"
                          className="block font-bold uppercase tracking-wider text-slate-500"
                        >
                          Lead Scientific Author
                        </label>
                        <select
                          id="article-author-select"
                          value={authorId}
                          onChange={(e) => {
                            setAuthorId(e.target.value);
                            markDirty();
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          {authors.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.displayName} ({a.affiliation})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Timezone-Explicit Scheduled Publication Date */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/50">
                        <label
                          htmlFor="scheduled-at-input"
                          className="flex items-center justify-between font-bold uppercase tracking-wider text-slate-500"
                        >
                          <span>Scheduled Publication</span>
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            <Clock className="h-3 w-3" />
                            {dateTimePreferences?.timeZone || 'Europe/Istanbul'}
                          </span>
                        </label>
                        <input
                          id="scheduled-at-input"
                          type="datetime-local"
                          value={scheduleWallInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setScheduleWallInput(val);
                            if (!val.trim()) {
                              setScheduledAt('');
                              markDirty();
                              return;
                            }
                            const res = interpretWallTime(
                              val,
                              dateTimePreferences?.timeZone || 'Europe/Istanbul',
                              dstDisambiguation
                            );
                            if (res.kind === 'unique' || res.kind === 'ambiguous') {
                              setScheduledAt(res.utcIso);
                              markDirty();
                            }
                          }}
                          aria-describedby="scheduled-at-helper"
                          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />

                        <div id="scheduled-at-helper" className="mt-1.5 space-y-1 text-[11px]">
                          {scheduleInterpretation?.kind === 'nonexistent' && (
                            <p className="font-semibold text-red-600 dark:text-red-400">
                              {scheduleInterpretation.message}
                            </p>
                          )}
                          {scheduleInterpretation?.kind === 'invalid' && (
                            <p className="font-semibold text-red-600 dark:text-red-400">
                              {scheduleInterpretation.message}
                            </p>
                          )}
                          {scheduleInterpretation?.kind === 'ambiguous' && (
                            <div className="space-y-1 rounded border border-amber-300 bg-amber-50 p-2 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              <p className="font-semibold">{scheduleInterpretation.message}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDstDisambiguation('earlier');
                                    setScheduledAt(scheduleInterpretation.earlierUtcIso);
                                    markDirty();
                                  }}
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                    dstDisambiguation === 'earlier'
                                      ? 'bg-amber-800 text-white'
                                      : 'bg-white text-amber-900'
                                  }`}
                                >
                                  Earlier Occurrence
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDstDisambiguation('later');
                                    setScheduledAt(scheduleInterpretation.laterUtcIso);
                                    markDirty();
                                  }}
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                    dstDisambiguation === 'later'
                                      ? 'bg-amber-800 text-white'
                                      : 'bg-white text-amber-900'
                                  }`}
                                >
                                  Later Occurrence
                                </button>
                              </div>
                            </div>
                          )}
                          {scheduledAt &&
                            (scheduleInterpretation?.kind === 'unique' ||
                              scheduleInterpretation?.kind === 'ambiguous') && (
                              <p className="text-slate-500">
                                Stored UTC:{' '}
                                <code className="font-mono text-[10px]">{scheduledAt}</code>
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SOURCES */}
                {inspectorTab === 'sources' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                      Citations are never fabricated. External DOI lookup is labeled{' '}
                      <span className="font-semibold">Unverified (Offline P0 Demo)</span> unless
                      confirmed by a human editor.
                    </div>

                    <div className="space-y-2">
                      <span className="block font-bold uppercase tracking-wider text-slate-500">
                        Attached Citations ({selectedSourceIds.length})
                      </span>
                      {sources.map((src) => {
                        const checked = selectedSourceIds.includes(src.id);
                        return (
                          <div
                            key={src.id}
                            className={`rounded-lg border p-2.5 transition-colors ${
                              checked
                                ? 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/30'
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  if (
                                    checked &&
                                    bodyHtml.includes(`data-citation-source-id="${src.id}"`)
                                  ) {
                                    setWorkflowFeedback(
                                      `Warning: Source "${src.title}" is cited inline in the manuscript body. Detaching it leaves an unlinked citation marker until resolved.`
                                    );
                                  }
                                  setSelectedSourceIds((prev) =>
                                    checked
                                      ? prev.filter((id) => id !== src.id)
                                      : [...prev, src.id]
                                  );
                                  markDirty();
                                }}
                                className="mt-0.5 rounded border-slate-300 text-indigo-600"
                              />
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                  {src.title}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {src.authors} · <em>{src.journal}</em> ({src.year})
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                  {src.doi && (
                                    <span className="font-mono text-slate-600 dark:text-slate-400">
                                      DOI: {src.doi}
                                    </span>
                                  )}
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    {src.verificationStatus}
                                  </span>
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    <span>URL</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </div>
                              </div>
                            </label>

                            {checked && (
                              <label className="mt-2 flex items-center gap-2 border-t border-slate-200/80 pt-2 text-[11px] text-slate-700 dark:border-slate-800 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(src.humanClaimVerified)}
                                  onChange={(e) =>
                                    updateSource(src.id, {
                                      humanClaimVerified: e.target.checked,
                                      verificationStatus: e.target.checked
                                        ? 'human_checked'
                                        : 'unverified',
                                    })
                                  }
                                  className="rounded border-slate-300 text-emerald-600"
                                />
                                <span>
                                  Claim-to-source alignment verified by human editor
                                </span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add New Citation */}
                    <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <span className="block font-bold uppercase tracking-wider text-slate-500">
                        Add Scientific Reference
                      </span>
                      <input
                        type="text"
                        value={newSourceTitle}
                        onChange={(e) => setNewSourceTitle(e.target.value)}
                        placeholder="Paper or dataset title…"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newSourceDoi}
                          onChange={(e) => setNewSourceDoi(e.target.value)}
                          placeholder="DOI (10.1038/...)"
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                        />
                        <select
                          value={newSourceType}
                          onChange={(e) =>
                            setNewSourceType(
                              e.target.value as
                                | 'peer_reviewed'
                                | 'preprint'
                                | 'institutional'
                                | 'dataset'
                            )
                          }
                          aria-label="Source classification type"
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="peer_reviewed">Peer-Reviewed</option>
                          <option value="preprint">Preprint</option>
                          <option value="institutional">Institutional</option>
                          <option value="dataset">Dataset</option>
                        </select>
                      </div>
                      <input
                        type="url"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        placeholder="https://doi.org/..."
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddInlineSource}
                        className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Attach Source Citation
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: FIGURES & MEDIA */}
                {inspectorTab === 'figures' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5 text-[11px] text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
                      <strong>Scientific Figure Integrity Rule:</strong> Charts, diagrams, and
                      microscopy default to{' '}
                      <code className="font-mono font-bold">layout=&quot;locked&quot;</code> so axes,
                      scale bars, and labels are never auto-cropped.
                    </div>

                    <div>
                      <label
                        htmlFor="featured-media-select"
                        className="block font-bold uppercase tracking-wider text-slate-500"
                      >
                        Featured Scientific Figure / Hero Asset
                      </label>
                      <select
                        id="featured-media-select"
                        value={featuredMediaId}
                        onChange={(e) => {
                          setFeaturedMediaId(e.target.value);
                          markDirty();
                        }}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="">No featured figure selected</option>
                        {media.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.kind} · {m.layout})
                          </option>
                        ))}
                      </select>
                    </div>

                    {featuredMedia && (
                      <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-2 dark:border-slate-800">
                          <img
                            src={featuredMedia.src}
                            alt={featuredMedia.altText || featuredMedia.title}
                            className="mx-auto max-h-40 w-auto object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Crop Mode:
                          </span>
                          <select
                            value={featuredMedia.layout}
                            onChange={(e) =>
                              updateMediaAsset(featuredMedia.id, {
                                layout: e.target.value as 'locked' | 'auto',
                              })
                            }
                            aria-label="Figure crop layout mode"
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                          >
                            <option value="locked">Locked (Preserve Full Figure)</option>
                            <option value="auto">Auto (Decorative Cover Only)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="figure-alt-text-input"
                            className="block text-[11px] font-bold text-slate-500"
                          >
                            Accessibility & Scientific Alt Text
                          </label>
                          <textarea
                            id="figure-alt-text-input"
                            rows={3}
                            value={featuredMedia.altText}
                            onChange={(e) =>
                              updateMediaAsset(featuredMedia.id, { altText: e.target.value })
                            }
                            placeholder="Describe axes, curves, scale bar, and primary finding…"
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="figure-caption-input"
                            className="block text-[11px] font-bold text-slate-500"
                          >
                            Figure Caption & Attribution
                          </label>
                          <textarea
                            id="figure-caption-input"
                            rows={2}
                            value={featuredMedia.caption}
                            onChange={(e) =>
                              updateMediaAsset(featuredMedia.id, { caption: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>

                        <label className="flex items-center gap-2 border-t border-slate-200 pt-2.5 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(featuredMedia.humanReviewedAlt)}
                            onChange={(e) =>
                              updateMediaAsset(featuredMedia.id, {
                                humanReviewedAlt: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          <span>Figure alt text & axes human-verified</span>
                        </label>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        const created = addMediaAsset({
                          filename: `figure-${Date.now()}.svg`,
                          title: `${title.slice(0, 32) || 'Scientific'} Schematic Diagram`,
                          src: '/figures/quantum-ldpc-lattice.svg',
                          kind: 'diagram',
                          layout: 'locked',
                          altText:
                            'Schematic scientific diagram with locked aspect ratio and labeled axes.',
                          caption:
                            'Figure: Schematic diagram stored in Local Demo Storage.',
                        });
                        const receipt = await created.committed;
                        if (!receipt.ok) {
                          setWorkflowFeedback(
                            receipt.error || 'Storage transaction failed; figure was not saved.'
                          );
                          return;
                        }
                        setFeaturedMediaId(created.id);
                        markDirty();
                      }}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Upload Sample Figure to Local Store</span>
                    </button>
                  </div>
                )}

                {/* TAB 4: SEO & QUALITY AUDIT */}
                {inspectorTab === 'seo' && (
                  <div className="space-y-4">
                    {/* SEO Action Bar: Check SEO & View Full Audit */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <AuditStatusBadge
                          status={
                            liveAuditReport.counts.error > 0
                              ? 'error'
                              : liveAuditReport.counts.warning > 0
                              ? 'warning'
                              : 'pass'
                          }
                        />
                        <span className="text-[11px] font-medium text-slate-500">
                          {liveAuditReport.counts.error} err · {liveAuditReport.counts.warning} warn ·{' '}
                          {liveAuditReport.counts.pass} pass
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (isDirty) {
                              const saved = await performSave(false);
                              if (!saved) return;
                            }
                            const receipt = await runAndStoreArticleAudit(currentDraftArticle.id);
                            setWorkflowFeedback(
                              receipt.persisted
                                ? `SEO audit saved to IndexedDB: ${receipt.report?.counts.pass ?? 0} passed, ${receipt.report?.counts.warning ?? 0} warning(s), ${receipt.report?.counts.error ?? 0} error(s).`
                                : receipt.error || 'SEO audit was calculated in memory but not saved.'
                            );
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Check SEO</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (isDirty) {
                              const ok = await performSave(false);
                              if (!ok) return;
                            }
                            const receipt = await runAndStoreArticleAudit(currentDraftArticle.id);
                            if (!receipt.persisted) {
                              setWorkflowFeedback(receipt.error || 'SEO audit was calculated in memory but not saved.');
                              return;
                            }
                            router.push(`/articles/${currentDraftArticle.id}/seo`);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>View Full Audit</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Multi-line SEO Title Textarea */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="seo-title-input"
                          className="font-bold uppercase tracking-wider text-slate-500"
                        >
                          SEO Title
                        </label>
                        <span
                          data-testid="seo-title-counter"
                          className={`font-mono text-[11px] font-semibold ${
                            seoTitle.trim().length > 65 || seoTitle.trim().length < 30
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {seoTitle.trim().length} / 65 advisory
                        </span>
                      </div>
                      <textarea
                        id="seo-title-input"
                        rows={Math.max(2, Math.ceil((seoTitle.length || 1) / 42))}
                        value={seoTitle}
                        onChange={(e) => {
                          setSeoTitle(e.target.value);
                          markDirty();
                        }}
                        aria-describedby="seo-title-guidance"
                        placeholder="Structured pegRNA Scaffolds in Hepatocyte Prime Editing | ScientificRadar"
                        className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-2.5 py-2 text-xs leading-relaxed break-words dark:border-slate-700 dark:bg-slate-800"
                      />
                      <p
                        id="seo-title-guidance"
                        className={`mt-1 text-[11px] ${
                          seoTitle.trim().length > 65
                            ? 'font-medium text-amber-700 dark:text-amber-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {seoTitle.trim().length === 0
                          ? 'Missing SEO title (Publishing blocker).'
                          : seoTitle.trim().length > 65
                          ? `Advisory Warning (${seoTitle.trim().length}/65 chars): Exceeds 65-character display band and may truncate on narrower search result surfaces.`
                          : seoTitle.trim().length < 50
                          ? `Advisory (${seoTitle.trim().length}/65 chars): 50–65 characters is optimal for scientific search snippets.`
                          : 'Passed (50–65 character optimal search display band).'}
                      </p>
                    </div>

                    {/* Multi-line Meta Description Textarea */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="seo-description-input"
                          className="font-bold uppercase tracking-wider text-slate-500"
                        >
                          Meta Description
                        </label>
                        <span
                          data-testid="seo-description-counter"
                          className={`font-mono text-[11px] font-semibold ${
                            seoDescription.trim().length > 160 ||
                            seoDescription.trim().length < 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {seoDescription.trim().length} / 160 advisory
                        </span>
                      </div>
                      <textarea
                        id="seo-description-input"
                        rows={Math.max(3, Math.ceil((seoDescription.length || 1) / 48))}
                        value={seoDescription}
                        onChange={(e) => {
                          setSeoDescription(e.target.value);
                          markDirty();
                        }}
                        aria-describedby="seo-description-guidance"
                        placeholder="Summarize the key scientific finding, methodology, and quantitative result in 110–160 characters…"
                        className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-2.5 py-2 text-xs leading-relaxed break-words dark:border-slate-700 dark:bg-slate-800"
                      />
                      <p
                        id="seo-description-guidance"
                        className={`mt-1 text-[11px] ${
                          seoDescription.trim().length > 160 ||
                          (seoDescription.trim().length > 0 &&
                            seoDescription.trim().length < 110)
                            ? 'font-medium text-amber-700 dark:text-amber-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {seoDescription.trim().length === 0
                          ? 'Missing meta description (Publishing blocker).'
                          : seoDescription.trim().length > 160
                          ? `Advisory Warning (${seoDescription.trim().length}/160 chars): May be truncated on desktop/mobile SERPs.`
                          : seoDescription.trim().length < 110
                          ? `Advisory (${seoDescription.trim().length}/160 chars): Expand to 110–160 characters for fuller snippet coverage.`
                          : `Passed (${seoDescription.trim().length}/160 chars): Descriptive length within 110–160 character target band.`}
                      </p>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label
                        htmlFor="seo-canonical-input"
                        className="block font-bold uppercase tracking-wider text-slate-500"
                      >
                        Canonical URL (Local Preview Only)
                      </label>
                      <input
                        id="seo-canonical-input"
                        type="url"
                        value={seoCanonical}
                        onChange={(e) => {
                          setSeoCanonical(e.target.value);
                          markDirty();
                        }}
                        placeholder={`https://scientificradar.example/${locale}/${slug}`}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>

                    {/* Illustrative Search Result Preview Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Illustrative Search Result Preview (Not Live Google SERP Data)
                      </span>
                      <p className="mt-1.5 truncate font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                        scientificradar.example › {locale} › {slug || 'article-slug'}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-blue-700 dark:text-blue-400 break-words">
                        {seoTitle.trim() || title || 'Untitled Scientific Article'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 break-words">
                        {seoDescription.trim() ||
                          summary ||
                          'Add a concise scientific meta description to preview how this article snippet reads.'}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Demo Environment Safety Lock
                        </span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          noindex, nofollow
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Preview routes enforce robots noindex so prototype drafts are never indexed.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 5: REVISIONS */}
                {inspectorTab === 'revisions' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">
                      Restoring an earlier snapshot creates a new version so history is never lost.
                    </p>
                    {articleRevisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            v{rev.version} · {rev.source}
                          </span>
                          <LocalizedDate
                            iso={rev.createdAt}
                            mode="datetime"
                            className="text-[11px] text-slate-400"
                          />
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {rev.summary}
                        </p>
                        <button
                          type="button"
                          disabled={restoringRevisionId !== null}
                          onClick={async () => {
                            setRestoringRevisionId(rev.id);
                            const result = await restoreArticleRevision(rev.id, lastSyncedVersionRef.current ?? -1);
                            if (result.ok && result.article) {
                              setSaveError(null);
                              setSaveState('clean');
                            setWorkflowFeedback(`Restored snapshot v${rev.version} as new version v${result.article.version}.`);
                            } else {
                              setWorkflowFeedback(`Restore failed: ${result.error || 'Revision was not saved.'}`);
                            }
                            setRestoringRevisionId(null);
                          }}
                          className="mt-1 rounded border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {restoringRevisionId === rev.id ? 'Restoring…' : 'Restore as New Version'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Optional Non-Squeezing AI Assistant Drawer */}
      <CodexAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        article={currentDraftArticle}
      />

      {/* Pre-Publish Quality Gate Modal */}
      <PrePublishDialog
        open={prePublishOpen}
        onClose={() => setPrePublishOpen(false)}
        articleId={currentDraftArticle.id}
        articleTitle={currentDraftArticle.title}
        articleSlug={currentDraftArticle.slug}
        report={liveAuditReport}
        onConfirmPublish={(overrideNote) => {
          void handleStatusChange('published', overrideNote);
        }}
        onGoToField={handleGoToFieldFromFinding}
      />

      {/* Unsaved Changes Navigation Guard Dialog */}
      {pendingNavHref && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-nav-guard-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3
                id="unsaved-nav-guard-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                Unsaved Editorial Changes
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Your recent edits to <strong>{title || 'this article'}</strong> have not yet been
              confirmed in local storage. Would you like to save before leaving?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingNavHref(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const dest = pendingNavHref;
                  setPendingNavHref(null);
                  router.push(dest);
                }}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                Leave Without Saving
              </button>
              <button
                type="button"
                onClick={async () => {
                  const dest = pendingNavHref;
                  const savedOk = await performSave(false);
                  if (savedOk && dest) {
                    setPendingNavHref(null);
                    router.push(dest);
                  }
                }}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Media Library Figure Insertion Modal (SRS-ED-007) */}
      {figurePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="figure-picker-modal-title"
        >
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3
                  id="figure-picker-modal-title"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Insert Scientific Figure into Manuscript Body
                </h3>
                <p className="text-xs text-slate-500">
                  Select a figure from the local Media Library. Scientific diagrams and charts default to{' '}
                  <code className="font-mono font-bold">layout=&quot;locked&quot;</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFigurePickerOpen(false)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid max-h-96 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
              {media.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div>
                    <div className="mb-2 flex h-24 flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-950 p-3 text-center">
                      <ImageIcon className="h-6 w-6 text-indigo-400" />
                      <span className="mt-1 truncate max-w-full font-mono text-[10px] text-slate-300">
                        {asset.filename}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {asset.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                      {asset.caption || asset.altText}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {asset.kind} · {asset.layout}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFigureInsert(asset);
                        setWorkflowFeedback(
                          `Inserted figure "${asset.title}" with non-destructive ${asset.layout || 'locked'} layout policy.`
                        );
                        setFigurePickerOpen(false);
                      }}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Insert Figure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
