import type { AuthenticatedActor, ServerRole } from './server-store';
import { getServerPublishingStore, SERVER_SESSION_COOKIE } from './server-store';

export function cookieToken(request: Request): string | null {
  const cookieName = process.env.NODE_ENV === 'production' ? SERVER_SESSION_COOKIE : 'sr-studio-session';
  const cookies = request.headers.get('cookie') ?? '';
  for (const part of cookies.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === cookieName) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function requireActor(request: Request, roles?: ServerRole[]): AuthenticatedActor {
  const actor = getServerPublishingStore().actorForToken(cookieToken(request));
  if (!actor) throw new Error('UNAUTHENTICATED');
  if (roles && !roles.includes(actor.role)) throw new Error('FORBIDDEN');
  return actor;
}

export async function readJson(request: Request, maxBytes = 6 * 1024 * 1024): Promise<Record<string, unknown>> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) throw new Error('UNSUPPORTED_MEDIA_TYPE');
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw new Error('REQUEST_TOO_LARGE');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('INVALID_JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_JSON');
  return value as Record<string, unknown>;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) throw new Error('ORIGIN_REQUIRED');
  const expected = new URL(process.env.SCIENTIFICRADAR_STUDIO_PUBLISHING_URL || request.url).origin;
  if (new URL(origin).origin !== expected) throw new Error('CROSS_ORIGIN_REQUEST');
}

const STATUS_BY_ERROR: Record<string, number> = {
  UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  INVALID_USER: 400, INVALID_SNAPSHOT: 400, INVALID_SNAPSHOT_IDENTITY: 400, INVALID_EDITOR_DRAFT: 400, INVALID_JSON: 400,
  UNSAFE_MEDIA_SOURCE: 400, MEDIA_TOO_LARGE: 413, REQUEST_TOO_LARGE: 413, SNAPSHOT_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415, ORIGIN_REQUIRED: 403, CROSS_ORIGIN_REQUEST: 403, EDITOR_DRAFT_TOO_LARGE: 413,
  REVISION_NOT_APPROVED: 409, NOT_ACTIVE_PUBLICATION: 409, IDEMPOTENCY_KEY_CONFLICT: 409,
  IDEMPOTENCY_KEY_REQUIRED: 400, WITHDRAWAL_REASON_REQUIRED: 400, CANNOT_REVOKE_SELF: 409,
  ASSET_IDENTITY_CONFLICT: 409, ASSET_IDENTITY_MISMATCH: 409, UNREGISTERED_MEDIA_SOURCE: 400,
  MISSING_RIGHTS_EVIDENCE_BINDING: 400, UNVERIFIED_RIGHTS_EVIDENCE: 403, INVALID_MEDIA: 400, INVALID_EVIDENCE: 400,
  INVALID_KNOWLEDGE_LINK: 400, UNSAFE_KNOWLEDGE_DESTINATION: 422, UNBOUND_HTML_MEDIA: 422,
  REVISION_IMMUTABLE: 409, REVISION_SUBMITTER_IMMUTABLE: 409, SELF_REVIEW_FORBIDDEN: 403, INVALID_REVIEW: 400,
};

export function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  if (message.startsWith('INVALID_SNAPSHOT:') || message.startsWith('INVALID_PUBLIC_SNAPSHOT:')) {
    return Response.json({ error: 'INVALID_SNAPSHOT', detail: message.slice(message.indexOf(':') + 1) }, { status: 422, headers: { 'Cache-Control': 'no-store' } });
  }
  if (message === 'NOT_FOUND' || message.startsWith('NOT_FOUND:')) return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (message === 'UNSAFE_MEDIA_SOURCE' || message === 'UNREGISTERED_MEDIA_SOURCE') return Response.json({ error: 'UNSAFE_MEDIA_SOURCE' }, { status: 422, headers: { 'Cache-Control': 'no-store' } });
  const status = STATUS_BY_ERROR[message] ?? 500;
  const safeError = status >= 500 ? 'PUBLISHING_BACKEND_UNAVAILABLE' : message;
  return Response.json({ error: safeError }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function noStoreJson(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return Response.json(body, { ...init, headers });
}
