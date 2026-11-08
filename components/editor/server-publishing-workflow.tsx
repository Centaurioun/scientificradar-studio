'use client';

import React, { useRef, useState } from 'react';
import {
  isServerPublishingConfigured,
  loadCandidate,
  login,
  logout,
  publish,
  restore,
  saveCandidate,
  submitReview,
  withdraw,
  type ServerPublishingActor,
} from '@/lib/publishing/server-client';
import { serializeStudioArticleToSnapshotV1 } from '@/lib/publishing/web-contract-v1';
import type {
  Article,
  AuthorProfile,
  Category,
  KnowledgeLink,
  MediaAsset,
  ScientificSource,
  Tag,
} from '@/lib/types';

type ServerCandidateState = 'in_review' | 'approved' | 'rejected';
type ServerPublicationState = 'published' | 'withdrawn';

type ServerCandidate = {
  articleId: string;
  revisionId: string;
  revisionNumber: number;
  state: ServerCandidateState;
  snapshotHash?: string;
  savedBy?: string;
  decisionBy?: string;
};

type ServerPublication = {
  articleId: string;
  revisionId: string;
  status: ServerPublicationState;
  publishedAt?: string;
  withdrawnAt?: string;
};

type ServerPublishingWorkflowProps = {
  article: Article;
  categories: Category[];
  tags: Tag[];
  authors: AuthorProfile[];
  sources: ScientificSource[];
  media: MediaAsset[];
  knowledgeLinks: KnowledgeLink[];
  isDirty: boolean;
  persistLocalRevision: () => Promise<Article | null>;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('PUBLISHING_INVALID_RESPONSE');
  }
  return value as Record<string, unknown>;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'PUBLISHING_BACKEND_UNAVAILABLE';
}

function canSave(role: ServerPublishingActor['role']): boolean {
  return role === 'owner' || role === 'editor' || role === 'author';
}

function canReview(role: ServerPublishingActor['role']): boolean {
  return role === 'owner' || role === 'editor' || role === 'reviewer';
}

function canPublish(role: ServerPublishingActor['role']): boolean {
  return role === 'owner' || role === 'editor';
}

export function ServerPublishingWorkflow({
  article,
  categories,
  tags,
  authors,
  sources,
  media,
  knowledgeLinks,
  isDirty,
  persistLocalRevision,
}: ServerPublishingWorkflowProps) {
  const enabled = isServerPublishingConfigured();
  const [actor, setActor] = useState<ServerPublishingActor | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [candidate, setCandidate] = useState<ServerCandidate | null>(null);
  const [publication, setPublication] = useState<ServerPublication | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const idempotencyKeys = useRef(new Map<string, string>());

  if (!enabled) return null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      await action();
    } catch (actionError) {
      setError(messageFor(actionError));
    } finally {
      setBusy(false);
    }
  };

  const idempotencyKeyFor = (action: 'publish' | 'withdraw' | 'restore', revisionId: string) => {
    const scope = `${action}:${article.id}:${revisionId}`;
    let key = idempotencyKeys.current.get(scope);
    if (!key) {
      key = crypto.randomUUID();
      idempotencyKeys.current.set(scope, key);
    }
    return { scope, key };
  };

  const clearIdempotencyKey = (scope: string) => idempotencyKeys.current.delete(scope);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await run(async () => {
      const nextActor = await login(email.trim(), password);
      if (!nextActor?.id || !nextActor.email || !nextActor.role) {
        throw new Error('PUBLISHING_INVALID_ACTOR_RESPONSE');
      }
      setActor(nextActor);
      setPassword('');
      try {
        const loaded = await loadCandidate(article.id);
        if (
          loaded.articleId !== article.id ||
          !loaded.revisionId ||
          !Number.isInteger(loaded.revisionNumber) ||
          !['in_review', 'approved', 'rejected'].includes(loaded.state) ||
          loaded.snapshot?.articleId !== article.id ||
          loaded.snapshot?.revisionId !== loaded.revisionId ||
          loaded.snapshot?.revisionNumber !== loaded.revisionNumber ||
          (loaded.publication !== null &&
            (!loaded.publication.revisionId ||
              !['published', 'withdrawn'].includes(loaded.publication.status) ||
              typeof loaded.publication.publishedAt !== 'string' ||
              (loaded.publication.status === 'withdrawn' && typeof loaded.publication.withdrawnAt !== 'string')))
        ) {
          throw new Error('PUBLISHING_INVALID_CANDIDATE_RESPONSE');
        }
        setCandidate({
          articleId: loaded.articleId,
          revisionId: loaded.revisionId,
          revisionNumber: loaded.revisionNumber,
          state: loaded.state,
        });
        setPublication(loaded.publication ? {
          articleId: loaded.articleId,
          revisionId: loaded.publication.revisionId,
          status: loaded.publication.status,
          publishedAt: loaded.publication.publishedAt,
          ...(loaded.publication.status === 'withdrawn' ? { withdrawnAt: loaded.publication.withdrawnAt } : {}),
        } : null);
        setFeedback(`Signed in as ${nextActor.role}. Loaded server revision ${loaded.revisionId} (${loaded.state}).`);
      } catch (loadError) {
        if (messageFor(loadError) !== 'NOT_FOUND') throw loadError;
        setCandidate(null);
        setPublication(null);
        setFeedback(`Signed in to server publishing as ${nextActor.role}. No server revision exists for this article yet.`);
      }
    });
  };

  const handleLogout = async () => {
    await run(async () => {
      await logout();
      setActor(null);
      setPassword('');
      setFeedback('Signed out of server publishing.');
    });
  };

  const handleSaveCandidate = async () => {
    if (!actor || !canSave(actor.role)) return;
    await run(async () => {
      const localArticle = await persistLocalRevision();
      if (!localArticle) throw new Error('LOCAL_DRAFT_SAVE_FAILED');
      const serialized = serializeStudioArticleToSnapshotV1({
        article: localArticle,
        categories,
        tags,
        authors,
        sources,
        media,
        knowledgeLinks,
      });
      if (serialized.snapshot.articleId !== article.id) {
        throw new Error('PUBLISHING_ARTICLE_ID_MISMATCH');
      }
      const response = record(
        await saveCandidate({
          snapshot: serialized.snapshot,
          editorDraft: { schemaVersion: 1, article: localArticle },
          mediaAssets: media,
        })
      );
      if (
        response.articleId !== article.id ||
        response.revisionId !== serialized.snapshot.revisionId ||
        response.state !== 'in_review' ||
        typeof response.snapshotHash !== 'string'
      ) {
        throw new Error('PUBLISHING_INVALID_CANDIDATE_RESPONSE');
      }
      setCandidate({
        articleId: article.id,
        revisionId: response.revisionId,
        revisionNumber: serialized.snapshot.revisionNumber,
        state: 'in_review',
        snapshotHash: response.snapshotHash,
        savedBy: actor.id,
      });
      setPublication((current) =>
        current?.articleId === article.id ? current : null
      );
      setFeedback(
        `Server saved revision ${response.revisionId} for editorial review. Local recovery snapshot was also saved.`
      );
    });
  };

  const handleReview = async (decision: 'approve' | 'request_changes') => {
    if (!actor || !candidate || !canReview(actor.role)) return;
    await run(async () => {
      const response = record(
        await submitReview({
          articleId: candidate.articleId,
          revisionId: candidate.revisionId,
          decision,
          note: reviewNote.trim() || undefined,
        })
      );
      if (
        response.revisionId !== candidate.revisionId ||
        response.decision !== decision ||
        typeof response.reviewedBy !== 'string'
      ) {
        throw new Error('PUBLISHING_INVALID_REVIEW_RESPONSE');
      }
      setCandidate((current) =>
        current && current.revisionId === response.revisionId
          ? {
              ...current,
              state: decision === 'approve' ? 'approved' : 'rejected',
              decisionBy: response.reviewedBy as string,
            }
          : current
      );
      setReviewNote('');
      setFeedback(
        `Server recorded ${decision === 'approve' ? 'approval' : 'a request for changes'} for exact revision ${response.revisionId}.`
      );
    });
  };

  const handlePublish = async () => {
    if (!actor || !candidate || candidate.state !== 'approved' || !canPublish(actor.role) || isDirty) return;
    await run(async () => {
      const idempotency = idempotencyKeyFor('publish', candidate.revisionId);
      const response = record(
        await publish({ articleId: candidate.articleId, revisionId: candidate.revisionId, idempotencyKey: idempotency.key })
      );
      if (
        response.articleId !== candidate.articleId ||
        response.revisionId !== candidate.revisionId ||
        response.status !== 'published' ||
        typeof response.publishedAt !== 'string'
      ) {
        throw new Error('PUBLISHING_INVALID_PUBLISH_RESPONSE');
      }
      setPublication({
        articleId: candidate.articleId,
        revisionId: candidate.revisionId,
        status: 'published',
        publishedAt: response.publishedAt,
      });
      clearIdempotencyKey(idempotency.scope);
      setFeedback(`Server published exact revision ${response.revisionId}.`);
    });
  };

  const handleWithdraw = async () => {
    if (!actor || !publication || publication.status !== 'published' || !canPublish(actor.role)) return;
    const reason = withdrawalReason.trim();
    if (!reason) {
      setError('Enter a correction or takedown reason before withdrawing the publication.');
      return;
    }
    await run(async () => {
      const idempotency = idempotencyKeyFor('withdraw', publication.revisionId);
      const response = record(
        await withdraw({
          articleId: publication.articleId,
          revisionId: publication.revisionId,
          reason,
          idempotencyKey: idempotency.key,
        })
      );
      if (
        response.articleId !== publication.articleId ||
        response.revisionId !== publication.revisionId ||
        response.status !== 'withdrawn' ||
        typeof response.withdrawnAt !== 'string'
      ) {
        throw new Error('PUBLISHING_INVALID_WITHDRAW_RESPONSE');
      }
      setPublication({
        ...publication,
        status: 'withdrawn',
        withdrawnAt: response.withdrawnAt,
      });
      setWithdrawalReason('');
      clearIdempotencyKey(idempotency.scope);
      setFeedback(`Server withdrew exact revision ${response.revisionId}.`);
    });
  };

  const handleRestore = async () => {
    if (!actor || !publication || publication.status !== 'withdrawn' || !canPublish(actor.role)) return;
    await run(async () => {
      const idempotency = idempotencyKeyFor('restore', publication.revisionId);
      const response = record(
        await restore({ articleId: publication.articleId, revisionId: publication.revisionId, idempotencyKey: idempotency.key })
      );
      if (
        response.articleId !== publication.articleId ||
        response.revisionId !== publication.revisionId ||
        response.status !== 'published' ||
        typeof response.publishedAt !== 'string'
      ) {
        throw new Error('PUBLISHING_INVALID_RESTORE_RESPONSE');
      }
      setPublication({
        ...publication,
        status: 'published',
        publishedAt: response.publishedAt,
        withdrawnAt: undefined,
      });
      clearIdempotencyKey(idempotency.scope);
      setFeedback(`Server restored exact revision ${response.revisionId}.`);
    });
  };

  const activeServerState = publication?.status ?? candidate?.state ?? 'not loaded';

  return (
    <section
      aria-label="Server publishing workflow"
      className="mx-4 mb-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/25 sm:mx-6 lg:mx-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Server publishing <span className="font-normal text-slate-500">· {activeServerState}</span>
          </h2>
          {candidate && (
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600 dark:text-slate-400">
              Candidate article {candidate.articleId} · revision {candidate.revisionId} · v{candidate.revisionNumber}
              {candidate.decisionBy ? ` · decision recorded by ${candidate.decisionBy}` : ''}
            </p>
          )}
          {publication && (
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600 dark:text-slate-400">
              Public revision {publication.revisionId}
            </p>
          )}
        </div>

        {actor ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">
              Signed in: <strong>{actor.email}</strong> · {actor.role}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleLogout()}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void handleLogin(event)} className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="server-publishing-email" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Publishing email
              </label>
              <input
                id="server-publishing-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-48 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label htmlFor="server-publishing-password" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Password
              </label>
              <input
                id="server-publishing-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-40 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-indigo-700 px-3 py-1.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              Sign in
            </button>
          </form>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-indigo-200 pt-3 dark:border-indigo-900/60">
        {actor && canSave(actor.role) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveCandidate()}
            className="rounded-md bg-indigo-700 px-3 py-1.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            Save local recovery + server review revision
          </button>
        )}

        {actor && candidate?.state === 'in_review' && canReview(actor.role) && (
          <>
            <label className="min-w-48 flex-1">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Reviewer note (optional)
              </span>
              <input
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleReview('approve')}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              Approve exact revision
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleReview('request_changes')}
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              Request changes
            </button>
          </>
        )}

        {actor && candidate?.state === 'approved' && canPublish(actor.role) &&
          !(publication?.revisionId === candidate.revisionId && (publication.status === 'published' || publication.status === 'withdrawn')) && (
          <button
            type="button"
            disabled={busy || isDirty}
            onClick={() => void handlePublish()}
            className="rounded-md bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {isDirty ? 'Save a new revision before publishing' : 'Publish approved revision'}
          </button>
        )}

        {actor && publication?.status === 'published' && canPublish(actor.role) && (
          <>
            <label className="min-w-48 flex-1">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Correction or takedown reason
              </span>
              <input
                value={withdrawalReason}
                onChange={(event) => setWithdrawalReason(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <button
              type="button"
              disabled={busy || !withdrawalReason.trim()}
              onClick={() => void handleWithdraw()}
              className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            >
              Withdraw publication
            </button>
          </>
        )}

        {actor && publication?.status === 'withdrawn' && canPublish(actor.role) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRestore()}
            className="rounded-md bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Restore withdrawn revision
          </button>
        )}

        {isDirty && (
          <p className="basis-full text-[11px] font-medium text-amber-800 dark:text-amber-200">
            Local edits are not included in the server revision. Save a new recovery snapshot before review or publication.
          </p>
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-red-800 dark:text-red-200">{error}</p>}
      {feedback && <p role="status" className="mt-3 text-emerald-800 dark:text-emerald-200">{feedback}</p>}
    </section>
  );
}
