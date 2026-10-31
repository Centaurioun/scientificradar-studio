'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStudio } from '@/lib/studio-context';
import { Article, ArticleStatus, Locale } from '@/lib/types';
import { validateDoiSyntax, validateSafeUrl, getMediaDisplayPolicy } from '@/lib/editorial-rules';
import { AppShell } from '@/components/layout/app-shell';
import { formatUtcDate, parseUtcDateTimeInput, toUtcDateTimeInput } from '@/lib/date-display';
import { ArticleTiptapEditor } from './article-tiptap-editor';
import { CodexAssistantDrawer } from '@/components/assistant/codex-assistant-drawer';
import {
  Save,
  Eye,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Trash2,
  History,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';

export function ArticleWorkspace({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const {
    articles,
    categories,
    tags,
    series,
    authors,
    media,
    sources,
    revisions,
    activeRole,
    saveArticle,
    transitionArticleStatus,
    restoreArticleRevision,
    addTag,
    saveSource,
    updateMediaAsset,
  } = useStudio();

  const existingArticle = articleId
    ? articles.find((a) => a.id === articleId)
    : undefined;

  const [title, setTitle] = useState(existingArticle?.title || '');
  const [slug, setSlug] = useState(existingArticle?.slug || '');
  const [locale, setLocale] = useState<Locale>(existingArticle?.locale || 'en');
  const [summary, setSummary] = useState(existingArticle?.summary || '');
  const [bodyHtml, setBodyHtml] = useState(
    existingArticle?.bodyHtml ||
      '<p>Enter or paste your scientific article manuscript here. Use H2 and H3 for section headings.</p>'
  );
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>(
    existingArticle?.body || { type: 'doc', content: [] }
  );
  const [status, setStatus] = useState<ArticleStatus>(existingArticle?.status || 'draft');
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
  const [featuredMediaId, setFeaturedMediaId] = useState<string>(
    existingArticle?.featuredMediaId || 'media-quantum-fiber'
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    existingArticle?.sourceIds || []
  );
  const [seoTitle, setSeoTitle] = useState(existingArticle?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(
    existingArticle?.seo?.description || ''
  );
  const [scheduledAt, setScheduledAt] = useState(
    toUtcDateTimeInput(existingArticle?.scheduledAt)
  );

  // Sync if existingArticle loads from IndexedDB after mount
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setLocale(existingArticle.locale);
      setSummary(existingArticle.summary);
      setBodyHtml(existingArticle.bodyHtml);
      setStatus(existingArticle.status);
      setPrimaryCategoryId(existingArticle.primaryCategoryId || 'cat-physics');
      setSelectedCategoryIds(existingArticle.categoryIds);
      setSelectedTagIds(existingArticle.tagIds);
      setSeriesId(existingArticle.seriesId || '');
      setAuthorId(existingArticle.authorId || 'auth-elena');
      setFeaturedMediaId(existingArticle.featuredMediaId || '');
      setSelectedSourceIds(existingArticle.sourceIds);
      setSeoTitle(existingArticle.seo?.title || '');
      setSeoDescription(existingArticle.seo?.description || '');
      setScheduledAt(
        toUtcDateTimeInput(existingArticle.scheduledAt)
      );
    }
  }, [existingArticle?.id, existingArticle?.version]);

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>(
    existingArticle ? 'saved' : 'unsaved'
  );
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<
    'metadata' | 'sources' | 'media' | 'seo' | 'versions'
  >('metadata');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick inline tag creation
  const [newTagInput, setNewTagInput] = useState('');
  // Quick inline source creation
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceAuthors, setNewSourceAuthors] = useState('');
  const [newSourceJournal, setNewSourceJournal] = useState('');
  const [newSourceDoi, setNewSourceDoi] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [sourceError, setSourceError] = useState<string | null>(null);

  const currentId = existingArticle?.id || articleId;

  const performSave = useCallback(
    (createRevisionSnapshot = false, summaryNote?: string) => {
      if (!title.trim()) {
        setSaveState('error');
        setStatusMessage('Article title (H1) is required before saving.');
        return null;
      }
      const parsedSchedule = scheduledAt ? parseUtcDateTimeInput(scheduledAt) : null;
      if (scheduledAt && !parsedSchedule) {
        setSaveState('error');
        setStatusMessage('Enter a valid UTC scheduled publication date.');
        return null;
      }
      setSaveState('saving');
      const result = saveArticle(
        {
          id: currentId,
          title,
          slug: slug || title,
          locale,
          summary,
          body: bodyJson,
          bodyHtml,
          status,
          primaryCategoryId,
          categoryIds: Array.from(new Set([primaryCategoryId, ...selectedCategoryIds])),
          tagIds: selectedTagIds,
          seriesId: seriesId || undefined,
          authorId,
          featuredMediaId: featuredMediaId || undefined,
          sourceIds: selectedSourceIds,
          seo: {
            title: seoTitle,
            description: seoDescription,
            noindex: true,
          },
          scheduledAt: parsedSchedule?.toISOString(),
        },
        {
          createRevision: createRevisionSnapshot,
          revisionSource: 'editor',
          revisionSummary: summaryNote,
        }
      );

      setTimeout(() => {
        setSaveState('saved');
      }, 150);

      if (!existingArticle && result.article.id) {
        router.replace(`/articles/${result.article.id}/edit`);
      }
      return result.article;
    },
    [
      currentId,
      title,
      slug,
      locale,
      summary,
      bodyJson,
      bodyHtml,
      status,
      primaryCategoryId,
      selectedCategoryIds,
      selectedTagIds,
      seriesId,
      authorId,
      featuredMediaId,
      selectedSourceIds,
      seoTitle,
      seoDescription,
      scheduledAt,
      saveArticle,
      existingArticle,
      router,
    ]
  );

  // Debounced autosave when editing an existing record
  useEffect(() => {
    if (!existingArticle || saveState !== 'unsaved') return;
    const timer = setTimeout(() => {
      if (title.trim()) {
        performSave(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [existingArticle, saveState, title, performSave]);

  const markDirty = () => {
    setSaveState('unsaved');
  };

  const handleStatusAction = (targetStatus: ArticleStatus, note?: string) => {
    const saved = performSave(true, `Prepared for ${targetStatus}`);
    if (!saved) return;
    const res = transitionArticleStatus(saved.id, targetStatus, note);
    if (!res.ok) {
      setStatusMessage(res.error || 'Permission denied for status transition.');
    } else {
      setStatus(targetStatus);
      setStatusMessage(
        targetStatus === 'published'
          ? 'Article marked Published in local P0 demo store. Live scientificradar.com remains untouched.'
          : `Article status transitioned to ${targetStatus}.`
      );
    }
  };

  const handleAddTagInline = () => {
    if (!newTagInput.trim()) return;
    const created = addTag(newTagInput.trim());
    if (!selectedTagIds.includes(created.id)) {
      setSelectedTagIds((prev) => [...prev, created.id]);
      markDirty();
    }
    setNewTagInput('');
  };

  const handleAddSourceInline = () => {
    setSourceError(null);
    if (!newSourceTitle.trim() || !newSourceUrl.trim()) {
      setSourceError('Source title and URL are required.');
      return;
    }
    const urlCheck = validateSafeUrl(newSourceUrl);
    if (!urlCheck.valid) {
      setSourceError(urlCheck.reason || 'Invalid URL');
      return;
    }
    const created = saveSource({
      articleId: currentId,
      title: newSourceTitle,
      authors: newSourceAuthors || 'Research Team',
      journal: newSourceJournal || 'Peer-Reviewed Journal',
      doi: newSourceDoi,
      url: newSourceUrl,
      verificationStatus: 'unverified',
    });
    setSelectedSourceIds((prev) => [...prev, created.id]);
    setNewSourceTitle('');
    setNewSourceAuthors('');
    setNewSourceJournal('');
    setNewSourceDoi('');
    setNewSourceUrl('');
    markDirty();
  };

  const articleRevisions = revisions.filter((r) => r.articleId === currentId);
  const selectedMediaAsset = media.find((m) => m.id === featuredMediaId);
  const mediaPolicy = selectedMediaAsset
    ? getMediaDisplayPolicy(selectedMediaAsset)
    : null;

  const liveDraftSnapshot: Article = existingArticle || {
    id: currentId || 'art-temp',
    locale,
    title: title || 'Untitled Article',
    slug: slug || 'untitled-article',
    summary,
    body: bodyJson,
    bodyHtml,
    status,
    primaryCategoryId,
    categoryIds: selectedCategoryIds,
    tagIds: selectedTagIds,
    authorId,
    sourceIds: selectedSourceIds,
    featuredMediaId,
    seo: { title: seoTitle, description: seoDescription, noindex: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Articles', href: '/articles' },
        { label: title ? title.slice(0, 36) : 'New Article' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {/* Save State Indicator */}
          <span
            aria-live="polite"
            className="text-xs font-mono text-slate-500 dark:text-slate-400 px-2 py-1"
          >
            {saveState === 'saving' && 'Saving...'}
            {saveState === 'saved' && `Saved · v${existingArticle?.version || 1}`}
            {saveState === 'unsaved' && 'Unsaved changes'}
            {saveState === 'error' && 'Save failed'}
          </span>

          <button
            type="button"
            onClick={() => performSave(true, 'Manual draft snapshot')}
            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          {existingArticle && (
            <Link
              href={`/articles/${existingArticle.id}/preview`}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              performSave(false);
              setAssistantOpen(true);
            }}
            className="px-3 py-1.5 rounded-md border border-[#087f83] text-[#087f83] dark:text-teal-300 dark:border-teal-500 hover:bg-[#087f83]/10 text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prepare with Codex</span>
          </button>

          {status === 'draft' || status === 'revision_requested' ? (
            <button
              type="button"
              onClick={() => handleStatusAction('in_review', 'Submitted for editorial review')}
              className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              Submit for Review
            </button>
          ) : null}

          {(activeRole === 'editor' || activeRole === 'owner') && (
            <button
              type="button"
              onClick={() => handleStatusAction('published', 'Published in local demo')}
              className="px-3 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold"
            >
              Publish (Demo)
            </button>
          )}

          <button
            type="button"
            onClick={() => setInspectorOpen((prev) => !prev)}
            aria-label={inspectorOpen ? 'Collapse metadata inspector' : 'Expand metadata inspector'}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={inspectorOpen ? 'Hide Metadata Inspector' : 'Show Metadata Inspector'}
          >
            {inspectorOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      }
    >
      {statusMessage && (
        <div
          role="status"
          className="px-6 py-2 bg-teal-50 dark:bg-teal-950/50 border-b border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split: Wide Central Writing Surface + Collapsible Right Metadata Inspector */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
        {/* Left/Center Wide Writing Surface */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-5">
          {/* Article Title (Rendered as the one and only H1) */}
          <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono uppercase tracking-wider text-[11px] text-[#087f83] dark:text-teal-400 font-semibold">
                Article Title · Sole Rendered &lt;H1&gt;
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5">
                  <span>Locale:</span>
                  <select
                    aria-label="Article Content Locale"
                    value={locale}
                    onChange={(e) => {
                      setLocale(e.target.value as Locale);
                      markDirty();
                    }}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs font-mono"
                  >
                    <option value="en">EN (English)</option>
                    <option value="tr">TR (Türkçe)</option>
                  </select>
                </label>
                <span>·</span>
                <span className="font-mono">Status: {status.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label htmlFor="article-title-h1-input" className="sr-only">
                Article Title (H1)
              </label>
              <textarea
                id="article-title-h1-input"
                rows={2}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder="Enter primary scientific headline (renders as the single H1)..."
                className="w-full text-xl sm:text-2xl font-bold tracking-tight bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none resize-none leading-snug"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div>
                <label
                  htmlFor="article-slug-input"
                  className="block text-[11px] font-medium text-slate-500 mb-1"
                >
                  URL Slug (Unique per locale/{locale})
                </label>
                <input
                  id="article-slug-input"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    markDirty();
                  }}
                  placeholder="auto-generated-from-title"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="article-author-select"
                  className="block text-[11px] font-medium text-slate-500 mb-1"
                >
                  Byline Author Profile
                </label>
                <select
                  id="article-author-select"
                  value={authorId}
                  onChange={(e) => {
                    setAuthorId(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                >
                  {authors.map((auth) => (
                    <option key={auth.id} value={auth.id}>
                      {auth.displayName} ({auth.locale.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="article-summary-dek"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                Summary / Standfirst (Dek)
              </label>
              <textarea
                id="article-summary-dek"
                rows={2}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  markDirty();
                }}
                placeholder="Concise scientific summary of key methodology, findings, and confidence intervals..."
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Wide Tiptap Manuscript Body Editor */}
          <ArticleTiptapEditor
            initialHtml={bodyHtml}
            onChange={(nextHtml, nextJson) => {
              setBodyHtml(nextHtml);
              setBodyJson(nextJson);
              markDirty();
            }}
            onRequestMediaInsert={() => {
              setInspectorOpen(true);
              setInspectorTab('media');
            }}
          />
        </div>

        {/* Right-Hand Collapsible Metadata Inspector (~320px) */}
        {inspectorOpen && (
          <aside
            aria-label="Article Metadata & Scientific Sources Inspector"
            className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] flex flex-col"
          >
            {/* Inspector Section Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] px-2 pt-2 gap-1 overflow-x-auto">
              {(
                [
                  { id: 'metadata', label: 'Taxonomy' },
                  { id: 'sources', label: `Sources (${selectedSourceIds.length})` },
                  { id: 'media', label: 'Figure' },
                  { id: 'seo', label: 'SEO' },
                  { id: 'versions', label: `History (${articleRevisions.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectorTab(tab.id)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-t-md border-b-2 transition-colors whitespace-nowrap ${
                    inspectorTab === tab.id
                      ? 'border-[#087f83] text-[#087f83] dark:text-teal-300 bg-white dark:bg-[#111c22]'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-5 flex-1 overflow-y-auto text-xs">
              {/* TAB 1: TAXONOMY, STATUS & SCHEDULE */}
              {inspectorTab === 'metadata' && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="inspector-status-select"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Editorial Status
                    </label>
                    <select
                      id="inspector-status-select"
                      value={status}
                      onChange={(e) => handleStatusAction(e.target.value as ArticleStatus)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="idea">Idea</option>
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                      <option value="revision_requested">Revision Requested</option>
                      <option value="approved">Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published (Demo Only)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="inspector-schedule-input"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Scheduled Publication Date (UTC)
                    </label>
                    <input
                      id="inspector-schedule-input"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => {
                        setScheduledAt(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inspector-primary-cat"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Primary Discipline Category
                    </label>
                    <select
                      id="inspector-primary-cat"
                      value={primaryCategoryId}
                      onChange={(e) => {
                        const nextPrimary = e.target.value;
                        setPrimaryCategoryId(nextPrimary);
                        setSelectedCategoryIds((prev) =>
                          prev.filter((id) =>
                            categories.some((category) => category.id === id && category.parentId === nextPrimary)
                          )
                        );
                        markDirty();
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      {categories
                        .filter((c) => !c.parentId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Subcategories
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/40">
                      {categories
                        .filter((c) => c.parentId === primaryCategoryId)
                        .map((sub) => {
                          const checked = selectedCategoryIds.includes(sub.id);
                          return (
                            <label
                              key={sub.id}
                              className="flex items-center gap-2 cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setSelectedCategoryIds((prev) =>
                                    checked
                                      ? prev.filter((id) => id !== sub.id)
                                      : [...prev, sub.id]
                                  );
                                  markDirty();
                                }}
                                className="rounded border-slate-300 text-[#087f83]"
                              />
                              <span>{sub.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Tags (3-6 recommended guideline) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Taxonomy Tags ({selectedTagIds.length})
                      </span>
                      <span className="text-[11px] text-slate-400">Guideline: 3–6 tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setSelectedTagIds((prev) =>
                                active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                              );
                              markDirty();
                            }}
                            className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                              active
                                ? 'border-[#087f83] bg-[#087f83]/10 text-[#087f83] dark:text-teal-300 font-semibold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Create or normalize tag..."
                        aria-label="New taxonomy tag name"
                        className="flex-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddTagInline}
                        className="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Series & Collections */}
                  <div>
                    <label
                      htmlFor="inspector-series-select"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Editorial Series / Collection
                    </label>
                    <select
                      id="inspector-series-select"
                      value={seriesId}
                      onChange={(e) => {
                        setSeriesId(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="">None (Standalone Article)</option>
                      {series.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: SCIENTIFIC SOURCES & CITATIONS */}
              {inspectorTab === 'sources' && (
                <div className="space-y-4">
                  <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-600 dark:text-slate-400">
                    Offline P0 mode runs deterministic DOI syntax &amp; URL safety checks. External Crossref registration verification is labeled <strong className="text-slate-800 dark:text-slate-200">External verification not run</strong>.
                  </div>

                  {/* Attached Sources */}
                  <div className="space-y-2.5">
                    {sources
                      .filter((s) => selectedSourceIds.includes(s.id))
                      .map((src) => {
                        const doiCheck = validateDoiSyntax(src.doi);
                        return (
                          <div
                            key={src.id}
                            className="p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {src.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSourceIds((prev) =>
                                    prev.filter((id) => id !== src.id)
                                  );
                                  markDirty();
                                }}
                                aria-label={`Unlink source ${src.title}`}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {src.authors} · <em>{src.journal}</em> ({src.year})
                            </div>
                            {src.doi && (
                              <div className="text-[11px] font-mono flex items-center gap-1.5">
                                {doiCheck.validSyntax ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                                <span className="truncate">DOI: {src.doi}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">
                              Status: {src.verificationStatus} · External verification not run
                            </div>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#087f83] dark:text-teal-400 hover:underline"
                            >
                              <span>Open source link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      })}
                  </div>

                  {/* Attach existing repository source */}
                  <div>
                    <label
                      htmlFor="attach-existing-source"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Attach Existing Source Record
                    </label>
                    <select
                      id="attach-existing-source"
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !selectedSourceIds.includes(e.target.value)) {
                          setSelectedSourceIds((prev) => [...prev, e.target.value]);
                          markDirty();
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="">Select peer-reviewed citation...</option>
                      {sources
                        .filter((s) => !selectedSourceIds.includes(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title.slice(0, 48)} ({s.year})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Add New Scientific Citation */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Add New Primary Citation
                    </div>
                    <input
                      type="text"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      placeholder="Study title *"
                      aria-label="New citation title"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newSourceAuthors}
                        onChange={(e) => setNewSourceAuthors(e.target.value)}
                        placeholder="Authors (e.g. Chen et al.)"
                        aria-label="New citation authors"
                        className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        value={newSourceJournal}
                        onChange={(e) => setNewSourceJournal(e.target.value)}
                        placeholder="Journal (e.g. Nature)"
                        aria-label="New citation journal"
                        className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <input
                      type="text"
                      value={newSourceDoi}
                      onChange={(e) => setNewSourceDoi(e.target.value)}
                      placeholder="DOI (e.g. 10.1038/s41586-026-0001-x)"
                      aria-label="New citation DOI"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                    <input
                      type="text"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="Canonical HTTPS URL *"
                      aria-label="New citation URL"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                    {sourceError && (
                      <div className="text-red-600 dark:text-red-400 text-[11px]">{sourceError}</div>
                    )}
                    <button
                      type="button"
                      onClick={handleAddSourceInline}
                      className="w-full py-1.5 rounded bg-[#087f83] text-white font-semibold hover:bg-[#086b70] flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add &amp; Link Citation</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: FEATURED FIGURE & AUTOMATED LAYOUT LOCKS (AT-19) */}
              {inspectorTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="inspector-featured-media"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Featured Article Figure / Media
                    </label>
                    <select
                      id="inspector-featured-media"
                      value={featuredMediaId}
                      onChange={(e) => {
                        setFeaturedMediaId(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="">No Featured Figure</option>
                      {media.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.kind})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMediaAsset && mediaPolicy && (
                    <div className="space-y-3 p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedMediaAsset.src}
                          alt={selectedMediaAsset.altText || selectedMediaAsset.title}
                          referrerPolicy="no-referrer"
                          className={`w-full h-36 ${
                            mediaPolicy.objectFit === 'contain' ? 'object-contain' : 'object-cover'
                          }`}
                        />
                      </div>

                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {mediaPolicy.policyLabel}
                      </div>

                      <div>
                        <label
                          htmlFor="media-layout-mode"
                          className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          Placement &amp; Assistant Reflow Control
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['auto', 'manual', 'locked'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() =>
                                updateMediaAsset(selectedMediaAsset.id, { layout: mode })
                              }
                              className={`py-1.5 px-2 rounded border text-[11px] font-medium flex items-center justify-center gap-1 ${
                                selectedMediaAsset.layout === mode
                                  ? 'border-[#087f83] bg-[#087f83] text-white'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {mode === 'locked' ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                              <span className="capitalize">{mode}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="inspector-media-alt"
                          className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          Verified Alt Text (Required for Publication)
                        </label>
                        <textarea
                          id="inspector-media-alt"
                          rows={3}
                          value={selectedMediaAsset.altText}
                          onChange={(e) =>
                            updateMediaAsset(selectedMediaAsset.id, { altText: e.target.value })
                          }
                          placeholder="Describe axes, variables, and key visible scientific trend..."
                          className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SEO & STRUCTURED QUALITY */}
              {inspectorTab === 'seo' && (
                <div className="space-y-4">
                  <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-600 dark:text-slate-400">
                    H1 is strictly derived from Article Title. Body uses H2/H3. Preview routes enforce <code className="font-mono">noindex</code> in P0 prototype.
                  </div>

                  <div>
                    <label
                      htmlFor="inspector-seo-title"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      SEO Title ({seoTitle.length}/65 chars)
                    </label>
                    <input
                      id="inspector-seo-title"
                      type="text"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value);
                        markDirty();
                      }}
                      placeholder={`${title || 'Article Title'} | ScientificRadar`}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inspector-seo-desc"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Meta Description ({seoDescription.length}/160 chars)
                    </label>
                    <textarea
                      id="inspector-seo-desc"
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Concise summary for search engines and social cards..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: VERSION SNAPSHOTS & RESTORE */}
              {inspectorTab === 'versions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Revision History ({articleRevisions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => performSave(true, 'Manual editorial checkpoint')}
                      className="text-[11px] text-[#087f83] dark:text-teal-400 hover:underline font-medium"
                    >
                      + Create Snapshot
                    </button>
                  </div>

                  {articleRevisions.length === 0 ? (
                    <div className="text-slate-400">
                      Save the article to record version v1.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {articleRevisions.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              v{rev.version} · {rev.source}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatUtcDate(rev.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            {rev.summary}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const restored = restoreArticleRevision(rev.id);
                              if (restored) {
                                setStatusMessage(
                                  `Restored snapshot v${rev.version} as new version v${restored.version}.`
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#087f83] dark:text-teal-400 hover:underline pt-1"
                          >
                            <History className="w-3 h-3" />
                            <span>Restore this snapshot</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Codex Assistant Overlay Drawer (Does NOT squeeze editor) */}
      <CodexAssistantDrawer
        article={liveDraftSnapshot}
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onChangesApplied={(updated) => {
          setTitle(updated.title);
          setSummary(updated.summary);
          setBodyHtml(updated.bodyHtml);
          setSelectedTagIds(updated.tagIds);
          setSeoTitle(updated.seo.title || '');
          setSeoDescription(updated.seo.description || '');
          setSaveState('saved');
        }}
      />
    </AppShell>
  );
}
