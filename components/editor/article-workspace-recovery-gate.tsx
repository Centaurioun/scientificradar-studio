'use client';

import React, { useState } from 'react';
import { ArticleWorkspace } from '@/components/editor/article-workspace';
import { loadCandidate, login, isServerPublishingConfigured } from '@/lib/publishing/server-client';
import { validateAndSanitizeSnapshot } from '@/lib/backup-validation';
import { trustedMediaSourceSet } from '@/lib/html-security';
import { useStudio, type StudioDatabaseSnapshot } from '@/lib/studio-context';
import type { Article } from '@/lib/types';

function getTrustedServerImageSources(bodyHtml: string): string[] {
  const configuredOrigin = process.env.NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL;
  if (!configuredOrigin) return [];
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(configuredOrigin).origin;
  } catch {
    return [];
  }
  const sources: string[] = [];
  const imageSource = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  let match: RegExpExecArray | null;
  while ((match = imageSource.exec(bodyHtml)) !== null) {
    const source = match[1] ?? match[2] ?? '';
    try {
      const url = new URL(source, allowedOrigin);
      if (url.origin === allowedOrigin && /^\/api\/public\/media\/[a-f0-9]{64}$/.test(url.pathname)) {
        sources.push(source);
      }
    } catch {
      // Invalid media URLs are omitted from the trusted source set and sanitized below.
    }
  }
  return sources;
}

function validateEditorDraft(
  value: unknown,
  articleId: string,
  studio: ReturnType<typeof useStudio>
): Article {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('SERVER_EDITOR_DRAFT_MISSING');
  }
  const envelope = value as { schemaVersion?: unknown; article?: unknown };
  if (envelope.schemaVersion !== 1 || !envelope.article || typeof envelope.article !== 'object' || Array.isArray(envelope.article)) {
    throw new Error('SERVER_EDITOR_DRAFT_INVALID');
  }
  const inputArticle = envelope.article as Record<string, unknown>;
  if (inputArticle.id !== articleId || typeof inputArticle.title !== 'string' || !inputArticle.title.trim()) {
    throw new Error('SERVER_EDITOR_DRAFT_IDENTITY_MISMATCH');
  }

  const article = {
    ...inputArticle,
    status: 'draft',
    publishedAt: undefined,
    scheduledAt: undefined,
    reviewNotes: [],
    seo: {
      ...((inputArticle.seo && typeof inputArticle.seo === 'object' && !Array.isArray(inputArticle.seo))
        ? inputArticle.seo as Record<string, unknown>
        : {}),
      noindex: true,
    },
  } as unknown as Article;
  const candidateSnapshot: StudioDatabaseSnapshot = {
    schemaVersion: 1,
    articles: [article],
    pages: studio.pages,
    categories: studio.categories,
    tags: studio.tags,
    series: studio.series,
    authors: studio.authors,
    media: studio.media,
    sources: studio.sources,
    knowledgeLinks: studio.knowledgeLinks,
    revisions: studio.revisions,
    homepageBlocks: studio.homepageBlocks,
    menus: studio.menus,
    navigation: studio.navigation,
    auditEvents: studio.auditEvents,
    integrations: studio.integrations,
    activeRole: studio.activeRole,
    theme: studio.theme,
    dateTimePreferences: studio.dateTimePreferences,
    auditReportsByArticleId: studio.auditReportsByArticleId,
  };
  const trustedSources = trustedMediaSourceSet([
    ...studio.media.map((asset) => asset.src),
    ...getTrustedServerImageSources(article.bodyHtml),
  ]);
  const validation = validateAndSanitizeSnapshot(JSON.stringify(candidateSnapshot), trustedSources);
  if (!validation.snapshot) throw new Error(`SERVER_EDITOR_DRAFT_INVALID:${validation.error || 'SCHEMA_VALIDATION_FAILED'}`);
  const restored = validation.snapshot.articles.find((candidate) => candidate.id === articleId);
  if (!restored) throw new Error('SERVER_EDITOR_DRAFT_INVALID');
  return restored as Article;
}

export function ArticleWorkspaceRecoveryGate({ articleId }: { articleId: string }) {
  const studio = useStudio();
  const localArticle = studio.articles.find((article) => article.id === articleId);
  const publishingEnabled = isServerPublishingConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [persistingRecovery, setPersistingRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recoveredArticleId, setRecoveredArticleId] = useState<string | null>(null);

  if (!studio.isHydrated) {
    return <p role="status" className="p-8 text-sm text-slate-600">Checking local article storage…</p>;
  }
  if ((localArticle && !persistingRecovery) || !publishingEnabled) {
    return <>
      {recoveredArticleId === articleId && (
        <p role="status" data-testid="server-draft-recovered" className="sr-only">
          Server draft restored to local storage.
        </p>
      )}
      <ArticleWorkspace key={articleId} articleId={articleId} />
    </>;
  }

  const recover = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const actor = await login(email.trim(), password);
      if (!actor?.id || !actor.email || !actor.role) throw new Error('PUBLISHING_INVALID_ACTOR_RESPONSE');
      setPassword('');
      const candidate = await loadCandidate(articleId);
      if (candidate.articleId !== articleId || candidate.editorDraft?.schemaVersion !== 1) {
        throw new Error('SERVER_EDITOR_DRAFT_MISSING');
      }
      const restored = validateEditorDraft(candidate.editorDraft, articleId, studio);
      setPersistingRecovery(true);
      const receipt = await studio.persistArticleDraft(restored, {
        createRevision: false,
        revisionSource: 'restore',
        revisionSummary: 'Recovered private server draft into local editor storage',
      });
      if (!receipt.ok) throw new Error(receipt.error || 'LOCAL_DRAFT_RECOVERY_FAILED');
      setRecoveredArticleId(articleId);
      setPersistingRecovery(false);
      setFeedback(`Recovered exact server draft v${restored.version} into local storage. Opening the scientific editor…`);
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'SERVER_DRAFT_RECOVERY_FAILED');
    } finally {
      setPersistingRecovery(false);
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
      <section aria-label="Recover server draft" className="w-full rounded-xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-900 dark:bg-slate-950">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recover article draft</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This article is not in local storage. Sign in to restore its private server draft before opening the editor.
        </p>
        <form onSubmit={(event) => void recover(event)} className="mt-5 grid gap-3 sm:max-w-md">
          <label className="grid gap-1 text-sm font-medium">
            Publishing email
            <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <button type="submit" disabled={busy} className="w-fit rounded-md bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">
            {busy ? 'Recovering draft…' : 'Sign in and recover draft'}
          </button>
        </form>
        {error && <p role="alert" className="mt-4 text-sm text-red-800 dark:text-red-300">{error}</p>}
        {feedback && <p role="status" className="mt-4 text-sm text-emerald-800 dark:text-emerald-300">{feedback}</p>}
      </section>
    </main>
  );
}
