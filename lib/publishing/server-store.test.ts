import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { ServerPublishingStore, type AuthenticatedActor } from './server-store';
import type { PublishedSnapshotRecordV1 } from './web-contract-v1';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Z6YcAAAAASUVORK5CYII=', 'base64');
const pngDataUrl = `data:image/png;base64,${png.toString('base64')}`;

describe('durable server publishing workflow', () => {
  let root = '';
  let store: ServerPublishingStore;
  let owner: AuthenticatedActor;
  let author: AuthenticatedActor;
  let reviewer: AuthenticatedActor;
  let rightsReviewer: AuthenticatedActor;
  let assetRevisionId = '';
  let publicSrc = '';

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'scientificradar-publishing-'));
    store = new ServerPublishingStore({ databasePath: join(root, 'publishing.sqlite'), sessionSecret: 'test-session-secret-for-local-suite-32-bytes', publicBaseUrl: 'https://studio.example.test', bootstrapEmail: 'owner@example.test', bootstrapPassword: 'correct horse battery staple test' });
    const ownerLogin = store.login('owner@example.test', 'correct horse battery staple test');
    assert.ok(ownerLogin);
    owner = ownerLogin.actor;
    assert.equal(store.login('owner@example.test', 'bad-password'), null);
    author = store.createUser(owner, { email: 'author@example.test', password: 'author secret test password', role: 'author' });
    reviewer = store.createUser(owner, { email: 'reviewer@example.test', password: 'reviewer secret test password', role: 'reviewer' });
    rightsReviewer = store.createUser(owner, { email: 'rights@example.test', password: 'rights reviewer secret test', role: 'rights_reviewer' });
  });

  after(() => {
    store?.close();
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('stores media bytes by verified SHA-256 and denies untrusted upload/evidence attempts', () => {
    const uploaded = store.uploadMedia(author, { mediaId: 'media-figure-1', dataUrl: pngDataUrl, license: 'CC BY 4.0' });
    assetRevisionId = uploaded.assetRevisionId;
    publicSrc = uploaded.publicSrc;
    assert.equal(uploaded.byteLength, png.length);
    assert.equal(assetRevisionId, createHash('sha256').update(png).digest('hex'));
    assert.throws(() => store.uploadMedia(author, { mediaId: 'remote', dataUrl: 'https://evil.example/image.png', license: 'CC BY 4.0' }), /UNSAFE_MEDIA_SOURCE/);
    assert.throws(() => store.uploadMedia(author, { mediaId: 'wrong-mime', dataUrl: `data:image/jpeg;base64,${png.toString('base64')}`, license: 'CC BY 4.0' }), /UNSAFE_MEDIA_SOURCE/);
    assert.throws(() => store.registerRightsEvidence(reviewer, { evidenceId: 'rights-1', mediaId: 'media-figure-1', assetRevisionId, license: 'CC BY 4.0' }), /FORBIDDEN/);
    assert.throws(() => store.registerRightsEvidence(rightsReviewer, { evidenceId: 'rights-1', mediaId: 'media-figure-1', assetRevisionId: '0'.repeat(64), license: 'CC BY 4.0' }), /ASSET_IDENTITY_MISMATCH/);
    store.registerRightsEvidence(rightsReviewer, { evidenceId: 'rights-1', mediaId: 'media-figure-1', assetRevisionId, license: 'CC BY 4.0' });
  });

  it('forces a review-gated, authorized, content-addressed publication; supports correction, withdrawal and restore', () => {
    const first = snapshot('rev-article-1', '2026-11-08T00:00:00.000Z', publicSrc, assetRevisionId);
    const reviewedLink = { id: 'knowledge-reviewed', term: 'quantum coherence', targetType: 'wikipedia' as const, targetUrl: 'https://en.wikipedia.org/wiki/Quantum_coherence', locale: 'en' as const, previewTitle: 'Quantum coherence', previewExcerpt: 'Reviewed entry', sourceAttribution: 'Wikipedia', reviewStatus: 'approved' as const, isSampleDemoData: false as const };
    const forgedLink = { ...reviewedLink, id: 'knowledge-unreviewed', term: 'unreviewed concept' };
    store.createKnowledgeLink(author, { id: reviewedLink.id, term: reviewedLink.term, targetType: reviewedLink.targetType, targetUrl: reviewedLink.targetUrl, locale: reviewedLink.locale, previewTitle: reviewedLink.previewTitle, previewExcerpt: reviewedLink.previewExcerpt, sourceAttribution: reviewedLink.sourceAttribution });
    store.reviewKnowledgeLink(reviewer, reviewedLink.id, 'approve');
    store.createKnowledgeLink(author, { id: forgedLink.id, term: forgedLink.term, targetType: forgedLink.targetType, targetUrl: forgedLink.targetUrl, locale: forgedLink.locale, previewTitle: forgedLink.previewTitle, previewExcerpt: forgedLink.previewExcerpt, sourceAttribution: forgedLink.sourceAttribution });
    first.knowledgeLinks = [reviewedLink, forgedLink];
    assert.equal(store.saveCandidate(author, first.articleId, first).state, 'in_review');
    assert.throws(() => store.reviewCandidate(author, first.articleId, first.revisionId, 'approve'), /FORBIDDEN/);
    store.reviewCandidate(reviewer, first.articleId, first.revisionId, 'approve', 'Test fixture review');
    assert.throws(() => store.publish(author, first.articleId, first.revisionId, 'publish-1'), /FORBIDDEN/);
    const publication = store.publish(owner, first.articleId, first.revisionId, 'publish-1');
    assert.equal(publication.status, 'published');
    assert.deepEqual(store.publish(owner, first.articleId, first.revisionId, 'publish-1'), publication);
    assert.equal(store.listPublications().length, 1);
    const publicSnapshot = store.getPublicationBySlug(first.slug);
    assert.equal(publicSnapshot?.status, 'published');
    assert.deepEqual(publicSnapshot?.knowledgeLinks?.map((link) => link.id), ['knowledge-reviewed']);
    assert.equal(publicSnapshot?.blocks[0]?.type, 'figure');
    assert.equal(store.readPublicMedia(assetRevisionId)?.bytes.byteLength, png.length);
    assert.ok(Buffer.from(store.readPublicMedia(assetRevisionId)?.bytes ?? new Uint8Array()).equals(png));

    const second = snapshot('rev-article-2', '2026-11-08T00:00:00.000Z', publicSrc, assetRevisionId);
    second.title = 'Corrected test article';
    store.saveCandidate(author, second.articleId, second);
    store.reviewCandidate(reviewer, second.articleId, second.revisionId, 'approve', 'Test correction review');
    store.publish(owner, second.articleId, second.revisionId, 'publish-2');
    assert.equal(store.getPublicationBySlug(first.slug)?.revisionId, second.revisionId);
    assert.equal(store.readPublicMedia(assetRevisionId)?.bytes.byteLength, png.length);

    const withdrawn = store.withdraw(owner, second.articleId, second.revisionId, 'Test-only takedown', 'withdraw-2');
    assert.equal(withdrawn.status, 'withdrawn');
    assert.equal(store.listPublications().length, 0);
    assert.equal(store.getPublicationBySlug(first.slug), null);
    assert.equal(store.readPublicMedia(assetRevisionId), null);

    const restored = store.restore(owner, second.articleId, second.revisionId, 'restore-2');
    assert.equal(restored.status, 'published');
    assert.equal(store.getPublicationBySlug(first.slug)?.revisionId, second.revisionId);
    assert.equal(store.readPublicMedia(assetRevisionId)?.bytes.byteLength, png.length);
    assert.deepEqual(store.getAuditEvents(first.articleId).map((event) => event.action), [
      'candidate_saved', 'revision_approved', 'publication_published', 'candidate_saved', 'revision_approved',
      'correction_published', 'publication_withdrawn', 'publication_restored',
    ]);
  });

  it('revokes sessions and rejects insufficient bootstrap credentials', () => {
    const login = store.login('rights@example.test', 'rights reviewer secret test');
    assert.ok(login);
    store.setUserAccess(owner, rightsReviewer.id, { disabled: true });
    assert.equal(store.actorForToken(login.token), null);
    assert.throws(() => new ServerPublishingStore({ databasePath: join(root, 'bad.sqlite'), sessionSecret: 'too-short', publicBaseUrl: 'https://studio.example.test' }), /STUDIO_SESSION_SECRET/);
  });
});

function snapshot(revisionId: string, publishedAt: string, mediaSrc: string, mediaHash: string): PublishedSnapshotRecordV1 {
  const media = {
    id: 'media-figure-1', src: mediaSrc, alt: 'Synthetic one-pixel fixture', width: 1, height: 1,
    caption: 'Synthetic test fixture; no rights claim.', credit: 'Synthetic test fixture', rightsVerified: true,
    license: 'CC BY 4.0', rightsEvidence: { evidenceId: 'rights-1', mediaId: 'media-figure-1', assetRevisionId: mediaHash, license: 'CC BY 4.0' },
  };
  return {
    contractVersion: '1.0.0', articleId: 'article-test', revisionId, revisionNumber: revisionId.endsWith('2') ? 2 : 1,
    slug: 'test-article', locale: 'en', editorialType: 'research-digest', status: 'published', title: 'Test article',
    dek: 'Test dek', summary: 'Test summary', categorySlug: 'science', subcategorySlugs: [], tagSlugs: ['science'],
    authorIds: ['author-test'], publishedAt, updatedAt: publishedAt, readingTimeMinutes: 1,
    blocks: [{ type: 'figure', id: 'figure-1', media, layout: 'column', figureNumber: '1' }],
    bodyHtml: `<figure data-media-id="media-figure-1"><img src="${mediaSrc}" alt="Synthetic one-pixel fixture"><figcaption>Synthetic fixture</figcaption></figure>`,
    sources: [], relatedIds: [], seo: { title: 'Test article', description: 'Test', noindex: false },
  };
}

