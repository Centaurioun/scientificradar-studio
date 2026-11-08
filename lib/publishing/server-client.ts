import type { Article, MediaAsset, ScientificSourceSnapshot } from '../types';
import type { PublishedSnapshotRecordV1, PublicMedia } from './web-contract-v1';

export interface ServerPublishingActor { id: string; email: string; role: 'owner' | 'editor' | 'author' | 'reviewer' | 'rights_reviewer'; }
export interface ServerActionResult<T = unknown> { ok: boolean; value?: T; error?: string; }
export interface RightsEvidenceInput { evidenceId: string; mediaId: string; assetRevisionId: string; license: string; }

type ServerMedia = PublicMedia & { rightsEvidence?: RightsEvidenceInput };
type PublicationSnapshotInput = Omit<PublishedSnapshotRecordV1, 'hero' | 'blocks'> & {
  hero?: ServerMedia;
  blocks: Array<PublishedSnapshotRecordV1['blocks'][number] | { type: 'figure'; id: string; media: ServerMedia; layout: 'column' | 'wide'; figureNumber: string }>;
};

export function isServerPublishingConfigured(): boolean {
  return typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SERVER_PUBLISHING_ENABLED === 'true';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'include', cache: 'no-store', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `PUBLISHING_HTTP_${response.status}`);
  return body as T;
}

export async function login(email: string, password: string): Promise<ServerPublishingActor> {
  const result = await request<{ actor: ServerPublishingActor }>('/api/studio/auth/session', { method: 'POST', body: JSON.stringify({ email, password }) });
  return result.actor;
}

export async function logout(): Promise<void> {
  await request('/api/studio/auth/session', { method: 'DELETE' });
}

async function uploadMedia(media: ServerMedia, sourceAsset?: MediaAsset): Promise<void> {
  if (media.src.startsWith('data:')) {
    const result = await request<{ assetRevisionId: string; publicSrc: string; mediaId: string }>('/api/studio/media-assets', {
      method: 'POST', body: JSON.stringify({ mediaId: media.id, dataUrl: media.src, license: media.license }),
    });
    media.src = result.publicSrc;
    const evidenceId = sourceAsset?.rightsApproval?.evidenceRef;
    media.rightsEvidence = evidenceId ? { evidenceId, mediaId: media.id, assetRevisionId: result.assetRevisionId, license: media.license } : undefined;
    media.rightsVerified = false;
    return;
  }
  const configuredOrigin = process.env.NEXT_PUBLIC_SCIENTIFICRADAR_STUDIO_PUBLISHING_URL;
  if (!configuredOrigin) throw new Error('SERVER_MEDIA_PUBLIC_URL_NOT_CONFIGURED');
  const publicOrigin = new URL(configuredOrigin).origin;
  const url = new URL(media.src, typeof window === 'undefined' ? publicOrigin : window.location.origin);
  if (url.origin !== publicOrigin || !url.pathname.startsWith('/api/public/media/')) throw new Error('EXTERNAL_MEDIA_UPLOAD_REQUIRED');
  const assetRevisionId = url.pathname.split('/').pop() || '';
  if (!/^[a-f0-9]{64}$/.test(assetRevisionId)) throw new Error('UNREGISTERED_MEDIA_SOURCE');
  const evidenceId = sourceAsset?.rightsApproval?.evidenceRef;
  media.rightsEvidence = evidenceId ? { evidenceId, mediaId: media.id, assetRevisionId, license: media.license } : undefined;
  media.src = url.toString();
  media.rightsVerified = false;
}

async function prepareMedia(snapshot: PublicationSnapshotInput, sourceAssets: MediaAsset[] = []): Promise<void> {
  const media: ServerMedia[] = [];
  if (snapshot.hero) media.push(snapshot.hero);
  for (const block of snapshot.blocks) if (block.type === 'figure') media.push(block.media as ServerMedia);
  const assets = new Map(sourceAssets.map((asset) => [asset.id, asset]));
  const publicSrcByMediaId = new Map<string, string>();
  for (const item of media) {
    const sourceAsset = assets.get(item.id);
    if (!sourceAsset) throw new Error(`MEDIA_ASSET_NOT_FOUND:${item.id}`);
    if (sourceAsset.src !== item.src) throw new Error(`MEDIA_ASSET_IDENTITY_MISMATCH:${item.id}`);
    const priorSrc = publicSrcByMediaId.get(item.id);
    if (priorSrc) {
      const hash = priorSrc.split('/').pop() || '';
      if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`DUPLICATE_MEDIA_IDENTITY:${item.id}`);
      item.src = priorSrc;
      const evidenceId = sourceAsset.rightsApproval?.evidenceRef;
      item.rightsEvidence = evidenceId ? { evidenceId, mediaId: item.id, assetRevisionId: hash, license: item.license } : undefined;
      item.rightsVerified = false;
      continue;
    }
    await uploadMedia(item, sourceAsset);
    publicSrcByMediaId.set(item.id, item.src);
  }
  if (snapshot.bodyHtml) {
    snapshot.bodyHtml = snapshot.bodyHtml.replace(/<figure\b[^>]*>[^]*?<\/figure>/gi, (figureHtml) => {
      const mediaId = /\bdata-media-id\s*=\s*['"]([^'"]+)['"]/i.exec(figureHtml)?.[1];
      if (!mediaId) return figureHtml;
      const asset = assets.get(mediaId);
      if (!asset) throw new Error(`MEDIA_ASSET_NOT_FOUND:${mediaId}`);
      let publicSrc = publicSrcByMediaId.get(mediaId);
      if (!publicSrc) {
        const structured = media.find((item) => item.id === mediaId);
        if (structured) publicSrc = structured.src;
      }
      if (!publicSrc) throw new Error(`MEDIA_UPLOAD_REQUIRED:${mediaId}`);
      return figureHtml.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(['"])[^'"]*\2/i, (_match, prefix: string, quote: string) => `${prefix}${quote}${publicSrc}${quote}`);
    });
  }
}

export async function saveCandidate(input: { snapshot: PublishedSnapshotRecordV1; editorDraft?: { schemaVersion: 1; article: Article; sourceSnapshots?: ScientificSourceSnapshot[] }; mediaAssets?: MediaAsset[] }): Promise<unknown> {
  const snapshot = structuredClone(input.snapshot) as PublicationSnapshotInput;
  await prepareMedia(snapshot, input.mediaAssets);
  return request(`/api/studio/publications/${encodeURIComponent(snapshot.articleId)}`, { method: 'PUT', body: JSON.stringify({ snapshot, ...(input.editorDraft ? { editorDraft: input.editorDraft } : {}) }) });
}

export interface ServerCandidate {
  articleId: string;
  revisionId: string;
  revisionNumber: number;
  state: 'in_review' | 'approved' | 'rejected';
  savedAt: string;
  snapshot: PublishedSnapshotRecordV1;
  editorDraft: { schemaVersion: 1; article: Article; sourceSnapshots?: ScientificSourceSnapshot[] } | null;
  publication: { revisionId: string; status: 'published'; publishedAt: string } | { revisionId: string; status: 'withdrawn'; publishedAt: string; withdrawnAt: string } | null;
}

export async function loadCandidate(articleId: string): Promise<ServerCandidate> {
  return request(`/api/studio/publications/${encodeURIComponent(articleId)}`, { method: 'GET' });
}

export async function recordRightsEvidence(input: RightsEvidenceInput): Promise<unknown> {
  return request('/api/studio/media-evidence', { method: 'POST', body: JSON.stringify(input) });
}

export async function submitReview(input: { articleId: string; revisionId: string; decision: 'approve' | 'request_changes'; note?: string }): Promise<unknown> {
  return request(`/api/studio/publications/${encodeURIComponent(input.articleId)}/review`, { method: 'POST', body: JSON.stringify(input) });
}

function idempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  throw new Error('SECURE_RANDOM_UNAVAILABLE');
}

export async function publish(input: { articleId: string; revisionId: string; idempotencyKey?: string }): Promise<unknown> {
  return request(`/api/studio/publications/${encodeURIComponent(input.articleId)}/publish`, { method: 'POST', headers: { 'Idempotency-Key': input.idempotencyKey ?? idempotencyKey() }, body: JSON.stringify({ revisionId: input.revisionId }) });
}

export async function withdraw(input: { articleId: string; revisionId: string; reason: string; idempotencyKey?: string }): Promise<unknown> {
  return request(`/api/studio/publications/${encodeURIComponent(input.articleId)}/withdraw`, { method: 'POST', headers: { 'Idempotency-Key': input.idempotencyKey ?? idempotencyKey() }, body: JSON.stringify({ revisionId: input.revisionId, reason: input.reason }) });
}

export async function restore(input: { articleId: string; revisionId: string; idempotencyKey?: string }): Promise<unknown> {
  return request(`/api/studio/publications/${encodeURIComponent(input.articleId)}/restore`, { method: 'POST', headers: { 'Idempotency-Key': input.idempotencyKey ?? idempotencyKey() }, body: JSON.stringify({ revisionId: input.revisionId }) });
}
