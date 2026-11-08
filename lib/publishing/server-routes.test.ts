import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { POST as loginPost } from '../../app/api/studio/auth/session/route';
import { POST as usersPost } from '../../app/api/studio/auth/users/route';
import { POST as mediaPost } from '../../app/api/studio/media-assets/route';
import { POST as evidencePost } from '../../app/api/studio/media-evidence/route';
import { PUT as candidatePut } from '../../app/api/studio/publications/[articleId]/route';
import { GET as candidateGet } from '../../app/api/studio/publications/[articleId]/route';
import { POST as reviewPost } from '../../app/api/studio/publications/[articleId]/review/route';
import { POST as publishPost } from '../../app/api/studio/publications/[articleId]/publish/route';
import { POST as withdrawPost } from '../../app/api/studio/publications/[articleId]/withdraw/route';
import { POST as restorePost } from '../../app/api/studio/publications/[articleId]/restore/route';
import { GET as publicListGet } from '../../app/api/publications/route';
import { GET as publicSlugGet } from '../../app/api/publications/[slug]/route';
import { GET as publicMediaGet } from '../../app/api/public/media/[assetRevisionId]/route';
import type { PublishedSnapshotRecordV1 } from './web-contract-v1';

const origin = 'http://localhost:3000';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Z6YcAAAAASUVORK5CYII=', 'base64');
const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

describe('Studio publication API routes', () => {
  let root = '';
  let ownerCookie = '';
  let authorCookie = '';
  let reviewerCookie = '';
  let rightsCookie = '';
  let otherAuthorCookie = '';
  let mediaHash = '';
  let mediaUrl = '';

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'scientificradar-api-'));
    Reflect.set(process.env, 'NODE_ENV', 'test');
    process.env.PUBLICATION_DATABASE_PATH = join(root, 'api.sqlite');
    process.env.SCIENTIFICRADAR_STUDIO_PUBLISHING_URL = origin;
    process.env.STUDIO_SESSION_SECRET = randomBytes(40).toString('hex');
    process.env.STUDIO_BOOTSTRAP_EMAIL = 'owner@example.test';
    process.env.STUDIO_BOOTSTRAP_PASSWORD = 'api test owner password 2026';
    ownerCookie = await sessionCookie('owner@example.test', 'api test owner password 2026');
    await createUser('author@example.test', 'api test author password 2026', 'author');
    await createUser('other-author@example.test', 'api test other author 2026', 'author');
    await createUser('reviewer@example.test', 'api test reviewer password 2026', 'reviewer');
    await createUser('rights@example.test', 'api test rights password 2026', 'rights_reviewer');
    authorCookie = await sessionCookie('author@example.test', 'api test author password 2026');
    otherAuthorCookie = await sessionCookie('other-author@example.test', 'api test other author 2026');
    reviewerCookie = await sessionCookie('reviewer@example.test', 'api test reviewer password 2026');
    rightsCookie = await sessionCookie('rights@example.test', 'api test rights password 2026');
  });

  after(() => { if (root) rmSync(root, { recursive: true, force: true }); });

  it('enforces auth, origin, roles, immutable media bytes and exact review authorization through handlers', async () => {
    const unauthenticated = await candidatePut(request('/api/studio/publications/article-api', 'PUT', { snapshot: {} }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(unauthenticated.status, 401);
    const crossOrigin = await candidatePut(request('/api/studio/publications/article-api', 'PUT', { snapshot: {} }, ownerCookie, 'https://attacker.example'), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(crossOrigin.status, 403);

    const upload = await mediaPost(request('/api/studio/media-assets', 'POST', { mediaId: 'media-api', dataUrl, license: 'CC BY 4.0' }, authorCookie));
    assert.equal(upload.status, 200);
    const uploadBody = await upload.json() as { assetRevisionId: string; publicSrc: string };
    mediaHash = uploadBody.assetRevisionId;
    mediaUrl = uploadBody.publicSrc;
    assert.equal(mediaHash, createHash('sha256').update(png).digest('hex'));
    const badMedia = await mediaPost(request('/api/studio/media-assets', 'POST', { mediaId: 'remote', dataUrl: 'https://evil.example/a.png', license: 'CC BY 4.0' }, authorCookie));
    assert.equal(badMedia.status, 422);

    const deniedEvidence = await evidencePost(request('/api/studio/media-evidence', 'POST', { evidenceId: 'fixture-evidence', mediaId: 'media-api', assetRevisionId: mediaHash, license: 'CC BY 4.0' }, reviewerCookie));
    assert.equal(deniedEvidence.status, 403);
    const evidence = await evidencePost(request('/api/studio/media-evidence', 'POST', { evidenceId: 'fixture-evidence', mediaId: 'media-api', assetRevisionId: mediaHash, license: 'CC BY 4.0' }, rightsCookie));
    assert.equal(evidence.status, 200);

    const candidate = snapshot(mediaUrl, mediaHash);
    const editorDraft = privateEditorDraft();
    const untrustedSnapshot = {
      ...candidate,
      status: 'published',
      seo: { noindex: false },
      editorDraft: { secret: 'SECRET PRIVATE DRAFT' },
      arbitraryMetadata: 'PRIVATE UNKNOWN FIELD',
      blocks: candidate.blocks.map((block) => block.type === 'figure'
        ? { ...block, attackerPayload: 'NESTED PRIVATE METADATA', media: { ...block.media, privateMediaNote: 'PRIVATE MEDIA METADATA' } }
        : { ...block, attackerPayload: 'NESTED PRIVATE METADATA' }),
    };
    const save = await candidatePut(request('/api/studio/publications/article-api', 'PUT', { snapshot: untrustedSnapshot, editorDraft }, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(save.status, 200);
    assert.equal((await save.json() as { state: string }).state, 'in_review');
    const invalidDraft = await candidatePut(request('/api/studio/publications/article-api', 'PUT', { snapshot: candidate, editorDraft: { ...editorDraft, article: { ...editorDraft.article, id: 'another-article' } } }, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(invalidDraft.status, 400);
    const oversizedDraft = await candidatePut(request('/api/studio/publications/article-api', 'PUT', { snapshot: candidate, editorDraft: { schemaVersion: 1, article: { ...editorDraft.article, bodyHtml: 'x'.repeat(3 * 1024 * 1024 + 1) } } }, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(oversizedDraft.status, 413);
    const beforeApproval = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal((await beforeApproval.json() as { publication: unknown }).publication, null);
    const candidateUnauthenticated = await candidateGet(request('/api/studio/publications/article-api', 'GET'), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(candidateUnauthenticated.status, 401);
    const candidatePrivate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, otherAuthorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(candidatePrivate.status, 404);
    const authorCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(authorCandidate.status, 200);
    const privateCandidate = await authorCandidate.json() as { snapshot: PublishedSnapshotRecordV1; editorDraft: { schemaVersion: number; article: { status: string; publishedAt?: string; scheduledAt?: string; reviewNotes?: unknown; title: string; bodyHtml: string; sourceIds: string[]; authorId?: string; seo: { noindex?: boolean } } } };
    assert.equal(privateCandidate.snapshot.revisionId, 'revision-api');
    assert.equal(Object.hasOwn(privateCandidate.snapshot, 'editorDraft'), false);
    assert.equal(Object.hasOwn(privateCandidate.snapshot, 'arbitraryMetadata'), false);
    assert.equal(Object.hasOwn(privateCandidate.snapshot.blocks[0], 'attackerPayload'), false);
    assert.equal(privateCandidate.snapshot.blocks[0].type === 'figure' && Object.hasOwn(privateCandidate.snapshot.blocks[0].media, 'privateMediaNote'), false);
    assert.equal(privateCandidate.editorDraft.schemaVersion, 1);
    assert.equal(privateCandidate.editorDraft.article.title, 'Private recovery draft');
    assert.equal(privateCandidate.editorDraft.article.status, 'draft');
    assert.equal(privateCandidate.editorDraft.article.publishedAt, undefined);
    assert.equal(privateCandidate.editorDraft.article.scheduledAt, undefined);
    assert.equal(privateCandidate.editorDraft.article.reviewNotes, undefined);
    assert.deepEqual(privateCandidate.editorDraft.article.sourceIds, ['source-api']);
    assert.equal(privateCandidate.editorDraft.article.authorId, 'credited-author');
    assert.equal(privateCandidate.editorDraft.article.seo.noindex, true);
    assert.doesNotMatch(privateCandidate.editorDraft.article.bodyHtml, /onclick|javascript:/i);
    assert.match(privateCandidate.editorDraft.article.bodyHtml, /katex/);
    assert.match(privateCandidate.editorDraft.article.bodyHtml, /data-citation-source-id="source-api"/);
    assert.match(privateCandidate.editorDraft.article.bodyHtml, /\[1\]/);
    const reviewerCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, reviewerCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(reviewerCandidate.status, 200);
    const selfReview = await reviewPost(request('/api/studio/publications/article-api/review', 'POST', { revisionId: 'revision-api', decision: 'approve' }, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(selfReview.status, 403);
    const reviewerDecision = await reviewPost(request('/api/studio/publications/article-api/review', 'POST', { revisionId: 'revision-api', decision: 'approve', note: 'fixture review' }, reviewerCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(reviewerDecision.status, 200);
    const approvedCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal((await approvedCandidate.json() as { state: string }).state, 'approved');
    const deniedPublish = await publishPost(request('/api/studio/publications/article-api/publish', 'POST', { revisionId: 'revision-api' }, reviewerCookie, origin, { 'Idempotency-Key': 'api-publish-1' }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(deniedPublish.status, 403);
    const published = await publishPost(request('/api/studio/publications/article-api/publish', 'POST', { revisionId: 'revision-api' }, ownerCookie, origin, { 'Idempotency-Key': 'api-publish-1' }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(published.status, 200);
    const publishedCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal((await publishedCandidate.json() as { publication: { revisionId: string; status: string } }).publication.status, 'published');
    const keyConflict = await publishPost(request('/api/studio/publications/article-api/publish', 'POST', { revisionId: 'different-revision' }, ownerCookie, origin, { 'Idempotency-Key': 'api-publish-1' }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(keyConflict.status, 409);
    assert.equal((await publicSlugGet(new Request(`${origin}/api/publications/article-api`), { params: Promise.resolve({ slug: 'article-api' }) }).then((response) => response.json()) as { revisionId: string }).revisionId, 'revision-api');
  });

  it('publishes only exact snapshots, serves public list/slug/media, and removes withdrawn items until restored', async () => {
    const publishedList = await publicListGet();
    assert.equal(publishedList.headers.get('cache-control'), 'no-store, max-age=0');
    const list = await publishedList.json() as Array<{ slug: string; status: string }>;
    assert.equal(list.length, 1);
    assert.equal(list[0].status, 'published');
    assert.equal(Object.hasOwn(list[0], 'editorDraft'), false);
    assert.doesNotMatch(JSON.stringify(list), /SECRET PRIVATE DRAFT|PRIVATE UNKNOWN FIELD|NESTED PRIVATE METADATA|PRIVATE MEDIA METADATA/);
    const slugResponse = await publicSlugGet(new Request(`${origin}/api/publications/article-api`), { params: Promise.resolve({ slug: 'article-api' }) });
    assert.equal(slugResponse.status, 200);
    const publicArticle = await slugResponse.json() as { status: string } & Record<string, unknown>;
    assert.equal(publicArticle.status, 'published');
    assert.equal(Object.hasOwn(publicArticle, 'editorDraft'), false);
    assert.doesNotMatch(JSON.stringify(publicArticle), /SECRET PRIVATE DRAFT|PRIVATE UNKNOWN FIELD|NESTED PRIVATE METADATA|PRIVATE MEDIA METADATA/);
    const mediaResponse = await publicMediaGet(new Request(`${origin}/api/public/media/${mediaHash}`), { params: Promise.resolve({ assetRevisionId: mediaHash }) });
    assert.equal(mediaResponse.status, 200);
    assert.ok(Buffer.from(await mediaResponse.arrayBuffer()).equals(png));

    const withdraw = await withdrawPost(request('/api/studio/publications/article-api/withdraw', 'POST', { revisionId: 'revision-api', reason: 'Fixture takedown' }, ownerCookie, origin, { 'Idempotency-Key': 'api-withdraw-1' }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(withdraw.status, 200);
    const withdrawnCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal((await withdrawnCandidate.json() as { publication: { revisionId: string; status: string; withdrawnAt: string } }).publication.status, 'withdrawn');
    assert.deepEqual(await (await publicListGet()).json(), []);
    assert.equal((await publicSlugGet(new Request(`${origin}/api/publications/article-api`), { params: Promise.resolve({ slug: 'article-api' }) })).status, 404);
    assert.equal((await publicMediaGet(new Request(`${origin}/api/public/media/${mediaHash}`), { params: Promise.resolve({ assetRevisionId: mediaHash }) })).status, 404);
    const restore = await restorePost(request('/api/studio/publications/article-api/restore', 'POST', { revisionId: 'revision-api' }, ownerCookie, origin, { 'Idempotency-Key': 'api-restore-1' }), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal(restore.status, 200);
    const restoredCandidate = await candidateGet(request('/api/studio/publications/article-api', 'GET', undefined, authorCookie), { params: Promise.resolve({ articleId: 'article-api' }) });
    assert.equal((await restoredCandidate.json() as { publication: { revisionId: string; status: string } }).publication.status, 'published');
    assert.equal((await (await publicListGet()).json() as unknown[]).length, 1);
  });

  async function createUser(email: string, password: string, role: string): Promise<void> {
    const response = await usersPost(request('/api/studio/auth/users', 'POST', { email, password, role }, ownerCookie));
    assert.equal(response.status, 201);
  }

  async function sessionCookie(email: string, password: string): Promise<string> {
    const response = await loginPost(request('/api/studio/auth/session', 'POST', { email, password }));
    assert.equal(response.status, 200);
    const setCookie = response.headers.get('set-cookie') ?? '';
    const token = /^sr-studio-session=([^;]+)/.exec(setCookie)?.[1];
    assert.ok(token);
    return `sr-studio-session=${token}`;
  }
});

function request(path: string, method: string, body?: unknown, cookie?: string, requestOrigin = origin, extraHeaders: Record<string, string> = {}): Request {
  const headers: Record<string, string> = { Origin: requestOrigin, ...extraHeaders };
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return new Request(`${origin}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

function privateEditorDraft() {
  return {
    schemaVersion: 1 as const,
    article: {
      id: 'article-api', locale: 'en' as const, title: 'Private recovery draft', slug: 'article-api', summary: 'Private draft body',
      body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A persisted draft with scientific content.' }] }] },
      bodyHtml: '<p onclick="alert(1)">Private recovery draft</p><p><span class="katex">x²</span> <sup data-citation-source-id="source-api">[1]</sup></p>',
      status: 'published', categoryIds: ['cat-science'], tagIds: ['tag-api'], sourceIds: ['source-api'], authorId: 'credited-author',
      seo: { title: 'Private SEO', noindex: false }, publishedAt: '2026-11-01T00:00:00.000Z', scheduledAt: '2026-11-30T00:00:00.000Z',
      createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-08T00:00:00.000Z', version: 5,
      reviewNotes: [{ id: 'forged-review', articleId: 'article-api', authorName: 'fake reviewer', role: 'reviewer', note: 'approved', action: 'approve', createdAt: '2026-11-08T00:00:00.000Z' }],
    },
  };
}

function snapshot(mediaUrl: string, mediaHash: string): PublishedSnapshotRecordV1 {
  const media = { id: 'media-api', src: mediaUrl, alt: 'Synthetic API fixture', width: 1, height: 1, caption: 'Synthetic test fixture; no rights claim.', credit: 'Synthetic fixture', rightsVerified: true, license: 'CC BY 4.0', rightsEvidence: { evidenceId: 'fixture-evidence', mediaId: 'media-api', assetRevisionId: mediaHash, license: 'CC BY 4.0' } };
  return {
    contractVersion: '1.0.0', articleId: 'article-api', revisionId: 'revision-api', revisionNumber: 1, slug: 'article-api',
    locale: 'en', editorialType: 'research-digest', status: 'in_review', title: 'API test article', dek: 'Test dek', summary: 'Test summary',
    categorySlug: 'science', subcategorySlugs: [], tagSlugs: ['science'], authorIds: ['author-api'], publishedAt: '2026-11-08T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z', readingTimeMinutes: 1, blocks: [{ type: 'figure', id: 'figure-api', media, layout: 'column', figureNumber: '1' }],
    bodyHtml: `<figure data-media-id="media-api"><img src="${mediaUrl}" alt="Synthetic API fixture"><figcaption>Synthetic fixture</figcaption></figure>`, sources: [], relatedIds: [], seo: { noindex: true },
  };
}
