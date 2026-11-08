import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Article } from '../types';
import type { PublishedSnapshotRecordV1 } from './web-contract-v1';
import { sanitizeCanonicalBodyHtml, validatePublicationSnapshotV1 } from './web-contract-v1';

export type ServerRole = 'owner' | 'editor' | 'author' | 'reviewer' | 'rights_reviewer';
export interface AuthenticatedActor { id: string; email: string; role: ServerRole; }
export interface MediaUpload { mediaId: string; dataUrl: string; license: string; }
export interface MediaUploadReceipt { mediaId: string; assetRevisionId: string; publicSrc: string; mime: string; byteLength: number; }
export interface PublishingConfig {
  databasePath: string;
  sessionSecret: string;
  bootstrapEmail?: string;
  bootstrapPassword?: string;
  publicBaseUrl: string;
  secureCookies?: boolean;
  maxMediaBytes?: number;
  maxAuthAttemptKeys?: number;
  allowLoopbackHttpMediaOrigin?: boolean;
}

export interface PrivateEditorDraftV1 {
  schemaVersion: 1;
  article: Article;
}

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024;
const MAX_EDITOR_DRAFT_BYTES = 3 * 1024 * 1024;
const ROLE_VALUES: ServerRole[] = ['owner', 'editor', 'author', 'reviewer', 'rights_reviewer'];

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}
function tokenDigest(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}
function passwordHash(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 64);
}
function assertRole(role: unknown): asserts role is ServerRole {
  if (!ROLE_VALUES.includes(role as ServerRole)) throw new Error('Invalid server role');
}
function toPublicUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}
function isSafeDataUrl(dataUrl: string): { mime: string; bytes: Buffer } | null {
  const match = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')) return null;
  const mime = match[1].toLowerCase();
  const validMagic = mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mime === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : mime === 'image/webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
        : bytes.toString('ascii', 4, 8) === 'ftyp' && bytes.toString('ascii', 8, 12) === 'avif';
  return validMagic ? { mime, bytes } : null;
}

function normalizePrivateEditorDraft(value: unknown, articleId: string): PrivateEditorDraftV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_EDITOR_DRAFT');
  let rawBytes: number;
  try { rawBytes = Buffer.byteLength(JSON.stringify(value)); } catch { throw new Error('INVALID_EDITOR_DRAFT'); }
  if (rawBytes > MAX_EDITOR_DRAFT_BYTES) throw new Error('EDITOR_DRAFT_TOO_LARGE');
  const envelope = value as { schemaVersion?: unknown; article?: unknown };
  if (envelope.schemaVersion !== 1 || !envelope.article || typeof envelope.article !== 'object' || Array.isArray(envelope.article)) throw new Error('INVALID_EDITOR_DRAFT');
  const article = structuredClone(envelope.article) as Record<string, unknown>;
  const allowedArticleFields = new Set(['id', 'locale', 'title', 'slug', 'dek', 'summary', 'editorialType', 'translationGroupId', 'legacyProvenance', 'body', 'bodyHtml', 'status', 'primaryCategoryId', 'categoryIds', 'tagIds', 'seriesId', 'authorId', 'sourceIds', 'featuredMediaId', 'seo', 'scheduledAt', 'publishedAt', 'createdAt', 'updatedAt', 'version', 'reviewNotes']);
  if (Object.keys(article).some((key) => !allowedArticleFields.has(key))) throw new Error('INVALID_EDITOR_DRAFT');
  if (article.id !== articleId || typeof article.title !== 'string' || typeof article.slug !== 'string' ||
    typeof article.summary !== 'string' || typeof article.bodyHtml !== 'string' || !article.body || typeof article.body !== 'object' || Array.isArray(article.body) ||
    !['en', 'tr'].includes(String(article.locale)) || !Array.isArray(article.categoryIds) || !Array.isArray(article.tagIds) || !Array.isArray(article.sourceIds) ||
    typeof article.createdAt !== 'string' || typeof article.updatedAt !== 'string' || !Number.isInteger(article.version)) {
    throw new Error('INVALID_EDITOR_DRAFT');
  }
  const arrays = [article.categoryIds, article.tagIds, article.sourceIds];
  if (arrays.some((items) => (items as unknown[]).length > 500 || (items as unknown[]).some((item) => typeof item !== 'string' || item.length > 300))) throw new Error('INVALID_EDITOR_DRAFT');
  if (typeof article.bodyHtml !== 'string') throw new Error('INVALID_EDITOR_DRAFT');
  article.bodyHtml = sanitizeCanonicalBodyHtml(article.bodyHtml);
  // Editorial status/review metadata cannot authorize server workflow transitions.
  // authorId remains scholarly attribution data and is never used as authenticated identity.
  article.status = 'draft';
  if (article.seo && typeof article.seo === 'object' && !Array.isArray(article.seo)) article.seo = { ...(article.seo as Record<string, unknown>), noindex: true };
  else article.seo = { noindex: true };
  delete article.publishedAt;
  delete article.scheduledAt;
  delete article.reviewNotes;
  const normalized = { schemaVersion: 1 as const, article: article as unknown as Article };
  if (Buffer.byteLength(JSON.stringify(normalized)) > MAX_EDITOR_DRAFT_BYTES) throw new Error('EDITOR_DRAFT_TOO_LARGE');
  return normalized;
}

/** Durable local/integration publication authority. It deliberately requires a persistent
 * filesystem path and a configured session key; route handlers never use an in-memory fallback. */
export class ServerPublishingStore {
  private readonly db: DatabaseSync;
  private readonly sessionSecret: string;
  private readonly publicBaseUrl: string;
  private readonly maxMediaBytes: number;
  private readonly maxAuthAttemptKeys: number;
  private readonly allowLoopbackHttpMediaOrigin: boolean;

  constructor(config: PublishingConfig) {
    if (config.sessionSecret.length < 32) throw new Error('STUDIO_SESSION_SECRET must contain at least 32 characters');
    if (!config.databasePath || config.databasePath === ':memory:') throw new Error('A durable publication database path is required');
    const url = new URL(config.publicBaseUrl);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      throw new Error('SCIENTIFICRADAR_STUDIO_PUBLISHING_URL must use HTTPS outside localhost');
    }
    this.sessionSecret = config.sessionSecret;
    this.publicBaseUrl = url.origin;
    this.maxMediaBytes = config.maxMediaBytes ?? 8 * 1024 * 1024;
    this.maxAuthAttemptKeys = config.maxAuthAttemptKeys ?? 1000;
    this.allowLoopbackHttpMediaOrigin = config.allowLoopbackHttpMediaOrigin === true && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const databasePath = resolve(config.databasePath);
    const directory = dirname(databasePath);
    if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
    const directoryStat = statSync(directory);
    if (!directoryStat.isDirectory() || (directoryStat.mode & 0o077) !== 0) throw new Error('PUBLICATION_DATABASE_DIRECTORY_NOT_PRIVATE');
    if (existsSync(databasePath)) {
      if (!lstatSync(databasePath).isFile()) throw new Error('PUBLICATION_DATABASE_FILE_INVALID');
      chmodSync(databasePath, 0o600);
    } else closeSync(openSync(databasePath, 'wx', 0o600));
    this.db = new DatabaseSync(databasePath);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    this.secureDatabaseFiles(databasePath);
    this.migrate();
    if (config.bootstrapEmail && config.bootstrapPassword) {
      this.bootstrapOwner(config.bootstrapEmail, config.bootstrapPassword);
    }
    this.secureDatabaseFiles(databasePath);
  }

  close(): void { this.db.close(); }

  private secureDatabaseFiles(databasePath: string): void {
    for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) if (existsSync(path) && lstatSync(path).isFile()) chmodSync(path, 0o600);
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        role TEXT NOT NULL CHECK(role IN ('owner','editor','author','reviewer','rights_reviewer')),
        salt TEXT NOT NULL, password_hash TEXT NOT NULL, disabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT
      );
      CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
      CREATE TABLE IF NOT EXISTS auth_attempts (
        email TEXT PRIMARY KEY COLLATE NOCASE, window_started INTEGER NOT NULL, attempts INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS media_assets (
        asset_revision_id TEXT NOT NULL, media_id TEXT NOT NULL, mime TEXT NOT NULL,
        license TEXT NOT NULL, byte_length INTEGER NOT NULL, bytes BLOB NOT NULL,
        created_by TEXT NOT NULL, created_at TEXT NOT NULL,
        PRIMARY KEY(asset_revision_id,media_id,license)
      );
      CREATE INDEX IF NOT EXISTS media_assets_media_idx ON media_assets(media_id);
      CREATE TABLE IF NOT EXISTS rights_evidence (
        evidence_id TEXT PRIMARY KEY, media_id TEXT NOT NULL, asset_revision_id TEXT NOT NULL,
        license TEXT NOT NULL, reviewed_by TEXT NOT NULL, reviewed_at TEXT NOT NULL,
        FOREIGN KEY(asset_revision_id,media_id,license) REFERENCES media_assets(asset_revision_id,media_id,license)
      );
      CREATE TABLE IF NOT EXISTS knowledge_links (
        id TEXT PRIMARY KEY, term TEXT NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('internal','wikipedia')),
        target_url TEXT NOT NULL, target_article_id TEXT, locale TEXT NOT NULL CHECK(locale IN ('en','tr')),
        preview_title TEXT NOT NULL, preview_excerpt TEXT NOT NULL, source_attribution TEXT NOT NULL,
        review_status TEXT NOT NULL CHECK(review_status IN ('suggested','approved','rejected')),
        created_by TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, is_sample_demo_data INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS candidates (
        article_id TEXT NOT NULL, revision_id TEXT NOT NULL, revision_number INTEGER NOT NULL,
        slug TEXT NOT NULL, snapshot_json TEXT NOT NULL, snapshot_hash TEXT NOT NULL,
        editor_draft_json TEXT, editor_draft_hash TEXT,
        state TEXT NOT NULL CHECK(state IN ('in_review','approved','rejected')),
        saved_by TEXT NOT NULL, saved_at TEXT NOT NULL,
        PRIMARY KEY(article_id, revision_id)
      );
      CREATE TABLE IF NOT EXISTS publications (
        article_id TEXT NOT NULL, revision_id TEXT NOT NULL, slug TEXT NOT NULL,
        snapshot_json TEXT NOT NULL, snapshot_hash TEXT NOT NULL, published_at TEXT NOT NULL,
        withdrawn_at TEXT, withdrawal_reason TEXT,
        PRIMARY KEY(article_id, revision_id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS active_publication_slug_idx ON publications(slug)
        WHERE withdrawn_at IS NULL;
      CREATE TABLE IF NOT EXISTS active_publications (
        article_id TEXT PRIMARY KEY, revision_id TEXT NOT NULL,
        FOREIGN KEY(article_id, revision_id) REFERENCES publications(article_id, revision_id)
      );
      CREATE TABLE IF NOT EXISTS idempotency (
        scope TEXT NOT NULL, key TEXT NOT NULL, payload_hash TEXT NOT NULL, response_json TEXT NOT NULL,
        PRIMARY KEY(scope, key)
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, action TEXT NOT NULL,
        article_id TEXT, revision_id TEXT, actor_id TEXT NOT NULL, actor_role TEXT NOT NULL,
        occurred_at TEXT NOT NULL, details_json TEXT NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL
      );
      CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
      CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
    `);
    const candidateColumns = new Set((this.db.prepare('PRAGMA table_info(candidates)').all() as Array<{ name: string }>).map((column) => column.name));
    if (!candidateColumns.has('editor_draft_json')) this.db.exec('ALTER TABLE candidates ADD COLUMN editor_draft_json TEXT');
    if (!candidateColumns.has('editor_draft_hash')) this.db.exec('ALTER TABLE candidates ADD COLUMN editor_draft_hash TEXT');
  }

  private bootstrapOwner(email: string, password: string): void {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 14) throw new Error('Bootstrap owner requires a valid email and password of at least 14 characters');
    const hasOwner = this.db.prepare("SELECT 1 FROM users WHERE role='owner' LIMIT 1").get();
    if (hasOwner) return;
    const salt = randomBytes(16);
    const id = `usr_${randomBytes(12).toString('hex')}`;
    this.db.prepare('INSERT INTO users(id,email,role,salt,password_hash,created_at) VALUES(?,?,?,?,?,?)')
      .run(id, email, 'owner', salt.toString('hex'), passwordHash(password, salt).toString('hex'), new Date().toISOString());
  }

  private findUserByEmail(email: string): (AuthenticatedActor & { salt: string; password_hash: string; disabled: number }) | undefined {
    return this.db.prepare('SELECT id,email,role,salt,password_hash,disabled FROM users WHERE email=?').get(email) as (AuthenticatedActor & { salt: string; password_hash: string; disabled: number }) | undefined;
  }

  login(email: string, password: string): { actor: AuthenticatedActor; token: string; expiresAt: string } | null {
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 1024) return null;
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    this.db.prepare('DELETE FROM auth_attempts WHERE window_started < ?').run(now - 15 * 60_000);
    const attempt = this.db.prepare('SELECT window_started,attempts FROM auth_attempts WHERE email=?').get(normalizedEmail) as { window_started: number; attempts: number } | undefined;
    const user = this.findUserByEmail(normalizedEmail);
    const salt = user ? Buffer.from(user.salt, 'hex') : Buffer.alloc(16, 7);
    const computed = passwordHash(password, salt);
    const expected = user ? Buffer.from(user.password_hash, 'hex') : Buffer.alloc(64, 3);
    const matches = computed.length === expected.length && timingSafeEqual(computed, expected);
    if (!matches || !user || user.disabled) {
      const started = attempt && now - attempt.window_started < 15 * 60_000 ? attempt.window_started : now;
      const count = attempt && now - attempt.window_started < 15 * 60_000 ? attempt.attempts + 1 : 1;
      this.db.prepare('INSERT INTO auth_attempts(email,window_started,attempts) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET window_started=excluded.window_started,attempts=excluded.attempts').run(normalizedEmail, started, count);
      this.db.prepare(`DELETE FROM auth_attempts WHERE email IN (SELECT email FROM auth_attempts ORDER BY window_started ASC LIMIT MAX(0,(SELECT COUNT(*) FROM auth_attempts)-?))`).run(this.maxAuthAttemptKeys);
      return null;
    }
    this.db.prepare('DELETE FROM auth_attempts WHERE email=?').run(normalizedEmail);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now + SESSION_TTL_SECONDS * 1000).toISOString();
    this.db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
      .run(tokenDigest(token, this.sessionSecret), user.id, new Date(now).toISOString(), expiresAt);
    return { actor: { id: user.id, email: user.email, role: user.role }, token, expiresAt };
  }

  actorForToken(token: string | null | undefined): AuthenticatedActor | null {
    if (!token || token.length > 256) return null;
    const row = this.db.prepare(`SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.disabled=0`)
      .get(tokenDigest(token, this.sessionSecret), new Date().toISOString()) as AuthenticatedActor | undefined;
    return row ?? null;
  }

  revokeToken(token: string | null | undefined): void {
    if (!token) return;
    this.db.prepare('UPDATE sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL')
      .run(new Date().toISOString(), tokenDigest(token, this.sessionSecret));
  }

  createUser(actor: AuthenticatedActor, input: { email: string; password: string; role: ServerRole }): AuthenticatedActor {
    if (actor.role !== 'owner') throw new Error('FORBIDDEN');
    assertRole(input.role);
    if (!/^\S+@\S+\.\S+$/.test(input.email) || input.password.length < 14) throw new Error('INVALID_USER');
    const salt = randomBytes(16);
    const id = `usr_${randomBytes(12).toString('hex')}`;
    this.db.prepare('INSERT INTO users(id,email,role,salt,password_hash,created_at) VALUES(?,?,?,?,?,?)')
      .run(id, input.email.trim().toLowerCase(), input.role, salt.toString('hex'), passwordHash(input.password, salt).toString('hex'), new Date().toISOString());
    this.audit('user_created', actor, null, null, { userId: id, email: input.email.trim().toLowerCase(), role: input.role });
    return { id, email: input.email.trim().toLowerCase(), role: input.role };
  }

  setUserAccess(actor: AuthenticatedActor, userId: string, input: { role?: ServerRole; disabled?: boolean }): void {
    if (actor.role !== 'owner') throw new Error('FORBIDDEN');
    if (userId === actor.id && (input.disabled === true || input.role !== undefined && input.role !== 'owner')) throw new Error('CANNOT_REVOKE_SELF');
    if (input.role !== undefined) assertRole(input.role);
    if (input.role === undefined && input.disabled === undefined) throw new Error('INVALID_USER');
    const update = this.db.prepare('UPDATE users SET role=COALESCE(?,role),disabled=COALESCE(?,disabled) WHERE id=?')
      .run(input.role ?? null, input.disabled === undefined ? null : input.disabled ? 1 : 0, userId);
    if (Number(update.changes) === 0) throw new Error('NOT_FOUND');
    if (input.role !== undefined || input.disabled === true) this.db.prepare('UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').run(new Date().toISOString(), userId);
    this.audit('user_access_changed', actor, null, null, { userId, role: input.role ?? null, disabled: input.disabled ?? null });
  }

  uploadMedia(actor: AuthenticatedActor, input: MediaUpload): MediaUploadReceipt {
    if (!input.mediaId || input.mediaId.length > 200 || typeof input.license !== 'string') throw new Error('INVALID_MEDIA');
    const parsed = isSafeDataUrl(input.dataUrl);
    if (!parsed) throw new Error('UNSAFE_MEDIA_SOURCE');
    if (parsed.bytes.length > this.maxMediaBytes) throw new Error('MEDIA_TOO_LARGE');
    const assetRevisionId = sha256(parsed.bytes);
    this.db.prepare(`INSERT INTO media_assets(asset_revision_id,media_id,mime,license,byte_length,bytes,created_by,created_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(asset_revision_id,media_id,license) DO NOTHING`)
      .run(assetRevisionId, input.mediaId, parsed.mime, input.license.trim(), parsed.bytes.length, parsed.bytes, actor.id, new Date().toISOString());
    this.audit('media_uploaded', actor, null, null, { mediaId: input.mediaId, assetRevisionId, license: input.license.trim(), byteLength: parsed.bytes.length });
    return { mediaId: input.mediaId, assetRevisionId, publicSrc: toPublicUrl(this.publicBaseUrl, `/api/public/media/${assetRevisionId}`), mime: parsed.mime, byteLength: parsed.bytes.length };
  }

  registerRightsEvidence(actor: AuthenticatedActor, input: { evidenceId: string; mediaId: string; assetRevisionId: string; license: string }): void {
    if (!['owner', 'rights_reviewer'].includes(actor.role)) throw new Error('FORBIDDEN');
    if (!input.evidenceId.trim() || !input.mediaId || !input.license.trim() || !/^[a-f0-9]{64}$/.test(input.assetRevisionId)) throw new Error('INVALID_EVIDENCE');
    const asset = this.db.prepare('SELECT media_id,license FROM media_assets WHERE asset_revision_id=? AND media_id=? AND license=?').get(input.assetRevisionId, input.mediaId, input.license.trim()) as { media_id: string; license: string } | undefined;
    if (!asset || asset.media_id !== input.mediaId || asset.license !== input.license.trim()) throw new Error('ASSET_IDENTITY_MISMATCH');
    this.db.prepare(`INSERT INTO rights_evidence(evidence_id,media_id,asset_revision_id,license,reviewed_by,reviewed_at)
      VALUES(?,?,?,?,?,?) ON CONFLICT(evidence_id) DO UPDATE SET media_id=excluded.media_id,asset_revision_id=excluded.asset_revision_id,license=excluded.license,reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at`)
      .run(input.evidenceId.trim(), input.mediaId, input.assetRevisionId, input.license.trim(), actor.id, new Date().toISOString());
    this.audit('rights_evidence_registered', actor, null, null, { evidenceId: input.evidenceId.trim(), mediaId: input.mediaId, assetRevisionId: input.assetRevisionId, license: input.license.trim() });
  }

  createKnowledgeLink(actor: AuthenticatedActor, input: { id: string; term: string; targetType: 'internal' | 'wikipedia'; targetUrl: string; targetArticleId?: string; locale: 'en' | 'tr'; previewTitle: string; previewExcerpt: string; sourceAttribution: string }): void {
    if (!['owner', 'editor', 'author'].includes(actor.role)) throw new Error('FORBIDDEN');
    if (!input.id.trim() || !input.term.trim() || !input.previewTitle.trim() || !input.sourceAttribution.trim()) throw new Error('INVALID_KNOWLEDGE_LINK');
    const url = new URL(input.targetUrl, this.publicBaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('UNSAFE_KNOWLEDGE_DESTINATION');
    if (input.targetType === 'wikipedia' && !/(^|\.)wikipedia\.org$/i.test(url.hostname)) throw new Error('UNSAFE_KNOWLEDGE_DESTINATION');
    if (input.targetType === 'internal' && (!input.targetArticleId || !url.pathname.startsWith('/article/'))) throw new Error('UNSAFE_KNOWLEDGE_DESTINATION');
    this.db.prepare(`INSERT INTO knowledge_links(id,term,target_type,target_url,target_article_id,locale,preview_title,preview_excerpt,source_attribution,review_status,created_by,is_sample_demo_data)
      VALUES(?,?,?,?,?,?,?,?,?,'suggested',?,0) ON CONFLICT(id) DO UPDATE SET term=excluded.term,target_type=excluded.target_type,target_url=excluded.target_url,target_article_id=excluded.target_article_id,locale=excluded.locale,preview_title=excluded.preview_title,preview_excerpt=excluded.preview_excerpt,source_attribution=excluded.source_attribution,review_status='suggested',reviewed_by=NULL,reviewed_at=NULL,created_by=excluded.created_by,is_sample_demo_data=0`)
      .run(input.id.trim(), input.term.trim(), input.targetType, url.toString(), input.targetArticleId ?? null, input.locale, input.previewTitle.trim(), input.previewExcerpt.slice(0, 2000), input.sourceAttribution.trim(), actor.id);
    this.audit('knowledge_link_created', actor, null, null, { id: input.id.trim(), targetType: input.targetType, targetUrl: url.toString(), status: 'suggested' });
  }

  reviewKnowledgeLink(actor: AuthenticatedActor, id: string, decision: 'approve' | 'reject'): void {
    if (!['owner', 'editor', 'reviewer'].includes(actor.role)) throw new Error('FORBIDDEN');
    const current = this.db.prepare('SELECT created_by FROM knowledge_links WHERE id=?').get(id) as { created_by: string } | undefined;
    if (!current) throw new Error('NOT_FOUND');
    if (current.created_by === actor.id) throw new Error('SELF_REVIEW_FORBIDDEN');
    this.db.prepare('UPDATE knowledge_links SET review_status=?,reviewed_by=?,reviewed_at=? WHERE id=?')
      .run(decision === 'approve' ? 'approved' : 'rejected', actor.id, new Date().toISOString(), id);
    this.audit(decision === 'approve' ? 'knowledge_link_approved' : 'knowledge_link_rejected', actor, null, null, { id });
  }

  private bindKnowledgeLinks(snapshot: PublishedSnapshotRecordV1): void {
    const submitted = (snapshot as PublishedSnapshotRecordV1 & { knowledgeLinks?: Array<{ id?: string }> }).knowledgeLinks ?? [];
    const resolved = submitted.flatMap((item) => {
      if (!item.id) return [];
      const row = this.db.prepare(`SELECT id,term,target_type,target_url,target_article_id,locale,preview_title,preview_excerpt,source_attribution,review_status,is_sample_demo_data
        FROM knowledge_links WHERE id=? AND review_status='approved' AND is_sample_demo_data=0`).get(item.id) as {
          id: string; term: string; target_type: 'internal' | 'wikipedia'; target_url: string; target_article_id: string | null; locale: 'en' | 'tr';
          preview_title: string; preview_excerpt: string; source_attribution: string; review_status: 'approved'; is_sample_demo_data: number;
        } | undefined;
      if (!row) return [];
      if (row.target_type === 'internal') {
        const target = row.target_article_id ? this.db.prepare('SELECT slug FROM publications p JOIN active_publications a ON p.article_id=a.article_id AND p.revision_id=a.revision_id WHERE p.article_id=? AND p.withdrawn_at IS NULL').get(row.target_article_id) as { slug: string } | undefined : undefined;
        if (!target) return [];
        row.target_url = `/article/${encodeURIComponent(target.slug)}`;
      }
      return [{ id: row.id, term: row.term, targetType: row.target_type, targetUrl: row.target_url, ...(row.target_article_id ? { targetArticleId: row.target_article_id } : {}), locale: row.locale, previewTitle: row.preview_title, previewExcerpt: row.preview_excerpt, sourceAttribution: row.source_attribution, reviewStatus: 'approved' as const, isSampleDemoData: false as const }];
    });
    if (resolved.length) (snapshot as PublishedSnapshotRecordV1 & { knowledgeLinks?: unknown }).knowledgeLinks = resolved;
    else delete (snapshot as PublishedSnapshotRecordV1 & { knowledgeLinks?: unknown }).knowledgeLinks;
  }

  saveCandidate(actor: AuthenticatedActor, articleId: string, rawSnapshot: unknown, rawEditorDraft?: unknown): { articleId: string; revisionId: string; state: 'in_review' | 'approved' | 'rejected'; snapshotHash: string } {
    if (!['owner', 'editor', 'author'].includes(actor.role)) throw new Error('FORBIDDEN');
    const bytes = Buffer.byteLength(JSON.stringify(rawSnapshot));
    if (bytes > MAX_SNAPSHOT_BYTES) throw new Error('SNAPSHOT_TOO_LARGE');
    if (!rawSnapshot || typeof rawSnapshot !== 'object' || Array.isArray(rawSnapshot)) throw new Error('INVALID_SNAPSHOT');
    const candidate = rawSnapshot as PublishedSnapshotRecordV1;
    if (candidate.articleId !== articleId || typeof candidate.revisionId !== 'string' || !candidate.revisionId || !Number.isInteger(candidate.revisionNumber)) throw new Error('INVALID_SNAPSHOT_IDENTITY');
    // The client has no authority to set public state; candidates are always noindex and in review.
    const snapshot = structuredClone(candidate);
    snapshot.status = 'in_review';
    snapshot.seo = { ...snapshot.seo, noindex: true };
    if (typeof snapshot.bodyHtml === 'string') snapshot.bodyHtml = sanitizeCanonicalBodyHtml(snapshot.bodyHtml);
    this.bindKnowledgeLinks(snapshot);
    const validationCandidate = structuredClone(snapshot);
    validationCandidate.status = 'published';
    validationCandidate.seo = { ...validationCandidate.seo, noindex: false };
    const validation = validatePublicationSnapshotV1(validationCandidate, { enforceStrictStudioPrePublish: false, trustedMediaOrigins: [new URL(this.publicBaseUrl).origin], allowLoopbackHttpMediaOrigin: this.allowLoopbackHttpMediaOrigin });
    if (!validation.valid) throw new Error(`INVALID_SNAPSHOT:${validation.issues.map((issue) => issue.code).join(',')}`);
    this.bindRegisteredRightsEvidence(snapshot, false);
    this.assertHtmlMedia(snapshot, false);
    const snapshotJson = JSON.stringify(snapshot);
    const snapshotHash = sha256(snapshotJson);
    const editorDraft = rawEditorDraft === undefined ? undefined : normalizePrivateEditorDraft(rawEditorDraft, articleId);
    const editorDraftJson = editorDraft === undefined ? undefined : JSON.stringify(editorDraft);
    if (editorDraftJson && Buffer.byteLength(editorDraftJson) > MAX_EDITOR_DRAFT_BYTES) throw new Error('EDITOR_DRAFT_TOO_LARGE');
    const editorDraftHash = editorDraftJson === undefined ? undefined : sha256(editorDraftJson);
    const previousCandidate = this.db.prepare('SELECT snapshot_hash,editor_draft_hash,saved_by,state FROM candidates WHERE article_id=? AND revision_id=?').get(articleId, snapshot.revisionId) as { snapshot_hash: string; editor_draft_hash: string | null; saved_by: string; state: 'in_review' | 'approved' | 'rejected' } | undefined;
    if (previousCandidate) {
      if (previousCandidate.snapshot_hash !== snapshotHash) throw new Error('REVISION_IMMUTABLE');
      if (editorDraftHash !== undefined && previousCandidate.editor_draft_hash !== editorDraftHash) throw new Error('REVISION_IMMUTABLE');
      if (previousCandidate.saved_by !== actor.id) throw new Error('REVISION_SUBMITTER_IMMUTABLE');
      return { articleId, revisionId: snapshot.revisionId, state: previousCandidate.state, snapshotHash };
    }
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO candidates(article_id,revision_id,revision_number,slug,snapshot_json,snapshot_hash,editor_draft_json,editor_draft_hash,state,saved_by,saved_at)
      VALUES(?,?,?,?,?,?,?,?, 'in_review',?,?)`)
      .run(articleId, snapshot.revisionId, snapshot.revisionNumber, snapshot.slug, snapshotJson, snapshotHash, editorDraftJson ?? null, editorDraftHash ?? null, actor.id, now);
    this.audit('candidate_saved', actor, articleId, snapshot.revisionId, { snapshotHash });
    return { articleId, revisionId: snapshot.revisionId, state: 'in_review', snapshotHash };
  }

  loadCandidate(actor: AuthenticatedActor, articleId: string): {
    articleId: string; revisionId: string; revisionNumber: number; state: 'in_review' | 'approved' | 'rejected';
    savedAt: string; snapshot: PublishedSnapshotRecordV1;
    editorDraft: PrivateEditorDraftV1 | null;
    publication: { revisionId: string; status: 'published'; publishedAt: string } | { revisionId: string; status: 'withdrawn'; publishedAt: string; withdrawnAt: string } | null;
  } {
    if (!['owner', 'editor', 'author', 'reviewer'].includes(actor.role)) throw new Error('FORBIDDEN');
    const row = actor.role === 'author'
      ? this.db.prepare(`SELECT article_id,revision_id,revision_number,state,saved_at,snapshot_json,editor_draft_json FROM candidates
        WHERE article_id=? AND saved_by=? ORDER BY revision_number DESC,saved_at DESC LIMIT 1`).get(articleId, actor.id)
      : this.db.prepare(`SELECT article_id,revision_id,revision_number,state,saved_at,snapshot_json,editor_draft_json FROM candidates
        WHERE article_id=? ORDER BY revision_number DESC,saved_at DESC LIMIT 1`).get(articleId);
    const candidate = row as { article_id: string; revision_id: string; revision_number: number; state: 'in_review' | 'approved' | 'rejected'; saved_at: string; snapshot_json: string; editor_draft_json: string | null } | undefined;
    if (!candidate) throw new Error('NOT_FOUND');
    const activePublication = this.db.prepare(`SELECT p.revision_id,p.published_at FROM publications p
      JOIN active_publications a ON a.article_id=p.article_id AND a.revision_id=p.revision_id
      WHERE p.article_id=? AND p.withdrawn_at IS NULL`).get(articleId) as { revision_id: string; published_at: string } | undefined;
    const latestWithdrawal = activePublication ? undefined : this.db.prepare(`SELECT revision_id,published_at,withdrawn_at FROM publications
      WHERE article_id=? AND withdrawn_at IS NOT NULL ORDER BY withdrawn_at DESC,published_at DESC LIMIT 1`).get(articleId) as { revision_id: string; published_at: string; withdrawn_at: string } | undefined;
    return {
      articleId: candidate.article_id,
      revisionId: candidate.revision_id,
      revisionNumber: candidate.revision_number,
      state: candidate.state,
      savedAt: candidate.saved_at,
      snapshot: JSON.parse(candidate.snapshot_json) as PublishedSnapshotRecordV1,
      editorDraft: candidate.editor_draft_json ? JSON.parse(candidate.editor_draft_json) as PrivateEditorDraftV1 : null,
      publication: activePublication
        ? { revisionId: activePublication.revision_id, status: 'published', publishedAt: activePublication.published_at }
        : latestWithdrawal
          ? { revisionId: latestWithdrawal.revision_id, status: 'withdrawn', publishedAt: latestWithdrawal.published_at, withdrawnAt: latestWithdrawal.withdrawn_at }
          : null,
    };
  }

  private collectMedia(snapshot: PublishedSnapshotRecordV1): Array<{ media: Record<string, unknown>; path: string }> {
    const found: Array<{ media: Record<string, unknown>; path: string }> = [];
    if (snapshot.hero) found.push({ media: snapshot.hero as unknown as Record<string, unknown>, path: 'hero' });
    for (const block of snapshot.blocks ?? []) if (block.type === 'figure') found.push({ media: block.media as unknown as Record<string, unknown>, path: `blocks.${block.id}` });
    return found;
  }

  private bindRegisteredRightsEvidence(snapshot: PublishedSnapshotRecordV1, requireApproval: boolean): void {
    for (const { media } of this.collectMedia(snapshot)) {
      if (typeof media.src !== 'string' || !media.src.startsWith(this.publicBaseUrl + '/api/public/media/')) throw new Error('UNREGISTERED_MEDIA_SOURCE');
      const assetRevisionId = media.src.split('/').pop() || '';
      const asset = this.db.prepare('SELECT media_id,license FROM media_assets WHERE asset_revision_id=? AND media_id=? AND license=?').get(assetRevisionId, String(media.id), String(media.license)) as { media_id: string; license: string } | undefined;
      if (!asset || asset.media_id !== media.id || asset.license !== media.license) throw new Error('ASSET_IDENTITY_MISMATCH');
      const requested = media.rightsEvidence as { evidenceId?: string } | undefined;
      const evidence = requested?.evidenceId ? this.db.prepare(`SELECT evidence_id,media_id,asset_revision_id,license FROM rights_evidence WHERE evidence_id=?`).get(requested.evidenceId) as { evidence_id: string; media_id: string; asset_revision_id: string; license: string } | undefined : undefined;
      const verified = Boolean(evidence && evidence.media_id === media.id && evidence.asset_revision_id === assetRevisionId && evidence.license === media.license);
      if (requireApproval && !verified) throw new Error('UNVERIFIED_RIGHTS_EVIDENCE');
      media.rightsVerified = verified;
      if (verified && evidence) {
        media.rightsEvidence = { evidenceId: evidence.evidence_id, mediaId: evidence.media_id, assetRevisionId: evidence.asset_revision_id, license: evidence.license };
      } else {
        delete media.rightsEvidence;
      }
    }
  }

  private assertHtmlMedia(snapshot: PublishedSnapshotRecordV1, requireApproval: boolean): void {
    const html = snapshot.bodyHtml ?? '';
    const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
    if (imageTags.length === 0) return;
    const figureTags = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi) ?? [];
    const bound = new Set<string>();
    for (const figureHtml of figureTags) {
      const id = /\bdata-media-id\s*=\s*['"]([^'"]+)['"]/i.exec(figureHtml)?.[1];
      const img = /<img\b[^>]*\bsrc\s*=\s*['"]([^'"]+)['"][^>]*>/i.exec(figureHtml)?.[1];
      if (!id || !img) continue;
      const assetRevisionId = new URL(img, this.publicBaseUrl).pathname.split('/').pop() || '';
      if (!/^[a-f0-9]{64}$/.test(assetRevisionId) || !img.startsWith(`${this.publicBaseUrl}/api/public/media/`)) throw new Error('UNREGISTERED_MEDIA_SOURCE');
      const asset = this.db.prepare('SELECT media_id,license FROM media_assets WHERE asset_revision_id=? AND media_id=?').get(assetRevisionId, id) as { media_id: string; license: string } | undefined;
      if (!asset) throw new Error('ASSET_IDENTITY_MISMATCH');
      const structuredMatch = this.collectMedia(snapshot).some(({ media }) => media.id === id && media.src === img && media.license === asset.license);
      if (!structuredMatch) throw new Error('UNBOUND_HTML_MEDIA');
      if (requireApproval) {
        const evidence = this.db.prepare('SELECT 1 FROM rights_evidence WHERE media_id=? AND asset_revision_id=? AND license=?').get(id, assetRevisionId, asset.license);
        if (!evidence) throw new Error('UNVERIFIED_RIGHTS_EVIDENCE');
      }
      bound.add(img);
    }
    if (bound.size !== imageTags.length) throw new Error('UNBOUND_HTML_MEDIA');
  }

  reviewCandidate(actor: AuthenticatedActor, articleId: string, revisionId: string, decision: 'approve' | 'request_changes', note = ''): void {
    if (!['owner', 'editor', 'reviewer'].includes(actor.role)) throw new Error('FORBIDDEN');
    const candidate = this.db.prepare('SELECT snapshot_hash,state,saved_by FROM candidates WHERE article_id=? AND revision_id=?').get(articleId, revisionId) as { snapshot_hash: string; state: string; saved_by: string } | undefined;
    if (!candidate) throw new Error('NOT_FOUND');
    if (candidate.saved_by === actor.id) throw new Error('SELF_REVIEW_FORBIDDEN');
    const state = decision === 'approve' ? 'approved' : 'rejected';
    this.db.prepare('UPDATE candidates SET state=? WHERE article_id=? AND revision_id=?').run(state, articleId, revisionId);
    this.audit(decision === 'approve' ? 'revision_approved' : 'revision_changes_requested', actor, articleId, revisionId, { snapshotHash: candidate.snapshot_hash, note: note.slice(0, 2000) });
  }

  private idempotent<T>(scope: string, key: string, payload: unknown, fn: () => T): T {
    if (!key || key.length > 200) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const payloadHash = sha256(JSON.stringify(payload));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.db.prepare('SELECT payload_hash,response_json FROM idempotency WHERE scope=? AND key=?').get(scope, key) as { payload_hash: string; response_json: string } | undefined;
      if (existing) {
        if (existing.payload_hash !== payloadHash) throw new Error('IDEMPOTENCY_KEY_CONFLICT');
        this.db.exec('COMMIT');
        return JSON.parse(existing.response_json) as T;
      }
      const result = fn();
      this.db.prepare('INSERT INTO idempotency(scope,key,payload_hash,response_json) VALUES(?,?,?,?)').run(scope, key, payloadHash, JSON.stringify(result));
      this.db.exec('COMMIT');
      return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  publish(actor: AuthenticatedActor, articleId: string, revisionId: string, idempotencyKey: string): { articleId: string; revisionId: string; status: 'published'; publishedAt: string; snapshotHash: string } {
    if (!['owner', 'editor'].includes(actor.role)) throw new Error('FORBIDDEN');
    return this.idempotent(`publish:${articleId}`, idempotencyKey, { revisionId }, () => {
      const candidate = this.db.prepare('SELECT snapshot_json,snapshot_hash,state FROM candidates WHERE article_id=? AND revision_id=?').get(articleId, revisionId) as { snapshot_json: string; snapshot_hash: string; state: string } | undefined;
      if (!candidate) throw new Error('NOT_FOUND');
      if (candidate.state !== 'approved') throw new Error('REVISION_NOT_APPROVED');
      const prior = this.db.prepare('SELECT revision_id FROM active_publications WHERE article_id=?').get(articleId) as { revision_id: string } | undefined;
      const existingPublication = this.db.prepare('SELECT snapshot_hash,snapshot_json,published_at FROM publications WHERE article_id=? AND revision_id=?').get(articleId, revisionId) as { snapshot_hash: string; snapshot_json: string; published_at: string } | undefined;
      const snapshot = JSON.parse(candidate.snapshot_json) as PublishedSnapshotRecordV1;
      snapshot.status = 'published';
      snapshot.seo = { ...snapshot.seo, noindex: false };
      this.bindKnowledgeLinks(snapshot);
      const relatedVisible = new Set((this.db.prepare(`SELECT p.article_id FROM publications p JOIN active_publications a ON p.article_id=a.article_id AND p.revision_id=a.revision_id WHERE p.withdrawn_at IS NULL`).all() as Array<{ article_id: string }>).map((row) => row.article_id));
      snapshot.relatedIds = snapshot.relatedIds.filter((id) => id !== articleId && relatedVisible.has(id));
      const validation = validatePublicationSnapshotV1(snapshot, { enforceStrictStudioPrePublish: true, trustedMediaOrigins: [new URL(this.publicBaseUrl).origin], allowLoopbackHttpMediaOrigin: this.allowLoopbackHttpMediaOrigin });
      if (!validation.valid) throw new Error(`INVALID_PUBLIC_SNAPSHOT:${validation.issues.map((issue) => issue.code).join(',')}`);
      this.bindRegisteredRightsEvidence(snapshot, true);
      this.assertHtmlMedia(snapshot, true);
      const publishedAt = existingPublication?.published_at ?? new Date().toISOString();
      snapshot.publishedAt = publishedAt;
      if (!existingPublication) snapshot.updatedAt = publishedAt;
      const body = existingPublication?.snapshot_json ?? JSON.stringify(snapshot);
      const snapshotHash = existingPublication?.snapshot_hash ?? sha256(body);
      if (prior && prior.revision_id !== revisionId) this.db.prepare('UPDATE publications SET withdrawn_at=?,withdrawal_reason=? WHERE article_id=? AND revision_id=?')
        .run(publishedAt, `Superseded by correction revision ${revisionId}`, articleId, prior.revision_id);
      if (existingPublication) {
        this.db.prepare('UPDATE publications SET withdrawn_at=NULL,withdrawal_reason=NULL WHERE article_id=? AND revision_id=?').run(articleId, revisionId);
      } else {
        this.db.prepare('INSERT INTO publications(article_id,revision_id,slug,snapshot_json,snapshot_hash,published_at,withdrawn_at,withdrawal_reason) VALUES(?,?,?,?,?,?,NULL,NULL)')
          .run(articleId, revisionId, snapshot.slug, body, snapshotHash, publishedAt);
      }
      this.db.prepare('INSERT INTO active_publications(article_id,revision_id) VALUES(?,?) ON CONFLICT(article_id) DO UPDATE SET revision_id=excluded.revision_id').run(articleId, revisionId);
      this.audit(prior ? 'correction_published' : 'publication_published', actor, articleId, revisionId, { snapshotHash, previousRevisionId: prior?.revision_id ?? null });
      return { articleId, revisionId, status: 'published', publishedAt, snapshotHash };
    });
  }

  withdraw(actor: AuthenticatedActor, articleId: string, revisionId: string, reason: string, idempotencyKey: string): { articleId: string; revisionId: string; status: 'withdrawn'; withdrawnAt: string } {
    if (!['owner', 'editor'].includes(actor.role)) throw new Error('FORBIDDEN');
    if (!reason.trim()) throw new Error('WITHDRAWAL_REASON_REQUIRED');
    return this.idempotent(`withdraw:${articleId}`, idempotencyKey, { revisionId, reason: reason.trim() }, () => {
      const active = this.db.prepare('SELECT revision_id FROM active_publications WHERE article_id=?').get(articleId) as { revision_id: string } | undefined;
      if (!active || active.revision_id !== revisionId) throw new Error('NOT_ACTIVE_PUBLICATION');
      const withdrawnAt = new Date().toISOString();
      this.db.prepare('UPDATE publications SET withdrawn_at=?,withdrawal_reason=? WHERE article_id=? AND revision_id=?').run(withdrawnAt, reason.trim(), articleId, revisionId);
      this.db.prepare('DELETE FROM active_publications WHERE article_id=? AND revision_id=?').run(articleId, revisionId);
      this.audit('publication_withdrawn', actor, articleId, revisionId, { reason: reason.trim(), withdrawnAt });
      return { articleId, revisionId, status: 'withdrawn', withdrawnAt };
    });
  }

  restore(actor: AuthenticatedActor, articleId: string, revisionId: string, idempotencyKey: string): { articleId: string; revisionId: string; status: 'published'; publishedAt: string; snapshotHash: string } {
    if (!['owner', 'editor'].includes(actor.role)) throw new Error('FORBIDDEN');
    return this.idempotent(`restore:${articleId}`, idempotencyKey, { revisionId }, () => {
      const previous = this.db.prepare('SELECT snapshot_json FROM publications WHERE article_id=? AND revision_id=?').get(articleId, revisionId) as { snapshot_json: string } | undefined;
      if (!previous) throw new Error('NOT_FOUND');
      const snapshot = JSON.parse(previous.snapshot_json) as PublishedSnapshotRecordV1;
      this.bindRegisteredRightsEvidence(snapshot, true);
      this.assertHtmlMedia(snapshot, true);
      const publishedAt = snapshot.publishedAt;
      const snapshotHash = sha256(previous.snapshot_json);
      const active = this.db.prepare('SELECT revision_id FROM active_publications WHERE article_id=?').get(articleId) as { revision_id: string } | undefined;
      if (active && active.revision_id !== revisionId) this.db.prepare('UPDATE publications SET withdrawn_at=?,withdrawal_reason=? WHERE article_id=? AND revision_id=?')
        .run(new Date().toISOString(), `Superseded by restored revision ${revisionId}`, articleId, active.revision_id);
      this.db.prepare('UPDATE publications SET withdrawn_at=NULL,withdrawal_reason=NULL WHERE article_id=? AND revision_id=?').run(articleId, revisionId);
      this.db.prepare('INSERT INTO active_publications(article_id,revision_id) VALUES(?,?) ON CONFLICT(article_id) DO UPDATE SET revision_id=excluded.revision_id').run(articleId, revisionId);
      this.audit('publication_restored', actor, articleId, revisionId, { snapshotHash });
      return { articleId, revisionId, status: 'published', publishedAt, snapshotHash };
    });
  }

  listPublications(): PublishedSnapshotRecordV1[] {
    return (this.db.prepare(`SELECT p.snapshot_json FROM publications p JOIN active_publications a
      ON a.article_id=p.article_id AND a.revision_id=p.revision_id WHERE p.withdrawn_at IS NULL ORDER BY p.published_at DESC`).all() as Array<{ snapshot_json: string }>).map((row) => JSON.parse(row.snapshot_json) as PublishedSnapshotRecordV1);
  }

  getPublicationBySlug(slug: string): PublishedSnapshotRecordV1 | null {
    const row = this.db.prepare(`SELECT p.snapshot_json FROM publications p JOIN active_publications a
      ON a.article_id=p.article_id AND a.revision_id=p.revision_id WHERE p.withdrawn_at IS NULL AND p.slug=?`).get(slug) as { snapshot_json: string } | undefined;
    return row ? JSON.parse(row.snapshot_json) as PublishedSnapshotRecordV1 : null;
  }

  readPublicMedia(assetRevisionId: string): { mime: string; bytes: Uint8Array } | null {
    if (!/^[a-f0-9]{64}$/.test(assetRevisionId)) return null;
    const rows = this.db.prepare(`SELECT p.snapshot_json FROM publications p JOIN active_publications a
      ON a.article_id=p.article_id AND a.revision_id=p.revision_id WHERE p.withdrawn_at IS NULL`).all() as Array<{ snapshot_json: string }>;
    const referenced = rows.some((row) => this.collectMedia(JSON.parse(row.snapshot_json) as PublishedSnapshotRecordV1).some(({ media }) => String(media.src).endsWith(`/api/public/media/${assetRevisionId}`)));
    if (!referenced) return null;
    const asset = this.db.prepare('SELECT mime,bytes FROM media_assets WHERE asset_revision_id=?').get(assetRevisionId) as { mime: string; bytes: Uint8Array } | undefined;
    return asset ? { mime: asset.mime, bytes: asset.bytes } : null;
  }

  getAuditEvents(articleId?: string): Array<{ action: string; articleId: string | null; revisionId: string | null; actorId: string; role: ServerRole; occurredAt: string; details: unknown; previousHash: string; eventHash: string }> {
    const rows = articleId
      ? this.db.prepare('SELECT * FROM audit_events WHERE article_id=? ORDER BY sequence').all(articleId)
      : this.db.prepare('SELECT * FROM audit_events ORDER BY sequence').all();
    return (rows as Array<Record<string, string | null>>).map((row) => ({ action: row.action!, articleId: row.article_id, revisionId: row.revision_id, actorId: row.actor_id!, role: row.actor_role as ServerRole, occurredAt: row.occurred_at!, details: JSON.parse(row.details_json!), previousHash: row.previous_hash!, eventHash: row.event_hash! }));
  }

  private audit(action: string, actor: AuthenticatedActor, articleId: string | null, revisionId: string | null, details: unknown): void {
    const latest = this.db.prepare('SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get() as { event_hash: string } | undefined;
    const previousHash = latest?.event_hash ?? '0'.repeat(64);
    const occurredAt = new Date().toISOString();
    const eventId = `evt_${randomBytes(12).toString('hex')}`;
    const detailsJson = JSON.stringify(details);
    const eventHash = sha256(`${previousHash}\n${eventId}\n${action}\n${articleId ?? ''}\n${revisionId ?? ''}\n${actor.id}\n${actor.role}\n${occurredAt}\n${detailsJson}`);
    this.db.prepare(`INSERT INTO audit_events(event_id,action,article_id,revision_id,actor_id,actor_role,occurred_at,details_json,previous_hash,event_hash)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run(eventId, action, articleId, revisionId, actor.id, actor.role, occurredAt, detailsJson, previousHash, eventHash);
  }
}

let singleton: ServerPublishingStore | undefined;
export function getServerPublishingStore(): ServerPublishingStore {
  if (singleton) return singleton;
  const sessionSecret = process.env.STUDIO_SESSION_SECRET ?? '';
  const databasePath = process.env.PUBLICATION_DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '' : './data/scientificradar-publications.sqlite');
  const publicBaseUrl = process.env.SCIENTIFICRADAR_STUDIO_PUBLISHING_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  if (!databasePath || !publicBaseUrl || sessionSecret.length < 32) throw new Error('Server publishing is not configured; set PUBLICATION_DATABASE_PATH, SCIENTIFICRADAR_STUDIO_PUBLISHING_URL and STUDIO_SESSION_SECRET.');
  singleton = new ServerPublishingStore({ databasePath, publicBaseUrl, sessionSecret, bootstrapEmail: process.env.STUDIO_BOOTSTRAP_EMAIL, bootstrapPassword: process.env.STUDIO_BOOTSTRAP_PASSWORD, maxMediaBytes: Number(process.env.PUBLISHING_MAX_MEDIA_BYTES || 8 * 1024 * 1024), secureCookies: process.env.NODE_ENV === 'production', allowLoopbackHttpMediaOrigin: process.env.NODE_ENV !== 'production' });
  return singleton;
}

export const SERVER_SESSION_COOKIE = '__Host-sr-studio-session';
export const SERVER_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS;
export function hashSnapshot(value: unknown): string { return sha256(JSON.stringify(value)); }
