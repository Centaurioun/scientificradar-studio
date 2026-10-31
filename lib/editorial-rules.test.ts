import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  ensureUniqueSlug,
  validateSafeUrl,
  validateDoiSyntax,
  sanitizeAndDemoteBodyH1,
  convertMarkdownPasteToSafeHtml,
  canTransitionStatus,
  normalizeAndDedupeTags,
  getMediaDisplayPolicy,
  runDeterministicLocalChecks,
  getPresetVisibility,
} from './editorial-rules';
import { Article, KnowledgeLink, MediaAsset, ScientificSource, Tag } from './types';
import { formatUtcDate, formatUtcDateTime, toUtcDateTimeInput, parseUtcDateTimeInput } from './date-display';

test('slugify handles English and Turkish characters cleanly', () => {
  assert.equal(
    slugify('Quantum Entanglement & Bell Inequalities: 2026 Review!'),
    'quantum-entanglement-bell-inequalities-2026-review'
  );
  assert.equal(
    slugify('Kara Delik Gözlemleri ve Kütleçekim Dalgaları'),
    'kara-delik-gozlemleri-ve-kutlecekim-dalgalari'
  );
});

test('ensureUniqueSlug prevents collisions per locale', () => {
  const existing = [
    { id: '1', slug: 'crispr-off-target-effects', locale: 'en' as const },
    { id: '2', slug: 'crispr-off-target-effects-2', locale: 'en' as const },
  ];
  assert.equal(
    ensureUniqueSlug('CRISPR Off-Target Effects', 'en', existing),
    'crispr-off-target-effects-3'
  );
  // Same slug in Turkish locale does not collide
  assert.equal(
    ensureUniqueSlug('CRISPR Off-Target Effects', 'tr', existing),
    'crispr-off-target-effects'
  );
});

test('validateSafeUrl blocks javascript: and data: schemes while allowing https and relative routes', () => {
  assert.equal(validateSafeUrl('https://en.wikipedia.org/wiki/Quantum_entanglement').valid, true);
  assert.equal(validateSafeUrl('/articles/jwst-exoplanet-spectra').valid, true);
  assert.equal(validateSafeUrl('javascript:alert(1)').valid, false);
  assert.equal(validateSafeUrl('data:text/html,<script>alert(1)</script>').valid, false);
});

test('validateDoiSyntax validates DOI structure without claiming external verification', () => {
  const valid = validateDoiSyntax('https://doi.org/10.1038/s41586-026-01492-x');
  assert.equal(valid.validSyntax, true);
  assert.equal(valid.normalized, '10.1038/s41586-026-01492-x');

  const invalid = validateDoiSyntax('doi:99.invalid/abc');
  assert.equal(invalid.validSyntax, false);
});

test('sanitizeAndDemoteBodyH1 strips scripts/handlers and demotes body H1 to H2 (AT-05, AT-06, AT-26)', () => {
  const dirty =
    '<h1>Duplicate Body Title</h1><p onclick="evil()">Paragraph with <a href="javascript:void(0)">bad link</a></p><script>steal()</script>';
  const res = sanitizeAndDemoteBodyH1(dirty);
  assert.equal(res.demotedH1Count, 1);
  assert.ok(res.removedUnsafeCount >= 2);
  assert.ok(!res.sanitizedHtml.includes('<h1'));
  assert.ok(res.sanitizedHtml.includes('<h2>Duplicate Body Title</h2>'));
  assert.ok(!res.sanitizedHtml.includes('<script'));
  assert.ok(!res.sanitizedHtml.includes('onclick='));
  assert.ok(!res.sanitizedHtml.includes('javascript:'));
});

test('convertMarkdownPasteToSafeHtml converts # H1 into H2 and preserves ## H2 / ### H3 (AT-05)', () => {
  const md = `# Pasted Top Heading\n\n## Methods & Telemetry\n\n### Cryogenic Calibration\n\nObserved **coherence** across 140 km.`;
  const res = convertMarkdownPasteToSafeHtml(md);
  assert.equal(res.demotedH1Count, 1);
  assert.ok(!res.html.includes('<h1>'));
  assert.ok(res.html.includes('<h2>Pasted Top Heading</h2>'));
  assert.ok(res.html.includes('<h2>Methods &amp; Telemetry</h2>'));
  assert.ok(res.html.includes('<h3>Cryogenic Calibration</h3>'));
});

test('canTransitionStatus enforces editorial role permissions', () => {
  assert.equal(canTransitionStatus('draft', 'in_review', 'author').allowed, true);
  assert.equal(canTransitionStatus('draft', 'published', 'author').allowed, false);
  assert.equal(canTransitionStatus('in_review', 'approved', 'reviewer').allowed, true);
  assert.equal(canTransitionStatus('approved', 'published', 'reviewer').allowed, false);
  assert.equal(canTransitionStatus('approved', 'published', 'editor').allowed, true);
});

test('getMediaDisplayPolicy enforces non-destructive contain for scientific figures (AT-19)', () => {
  const figPolicy = getMediaDisplayPolicy({ kind: 'scientific_figure', layout: 'locked' });
  assert.equal(figPolicy.objectFit, 'contain');
  assert.equal(figPolicy.allowAssistantReflow, false);

  const photoPolicy = getMediaDisplayPolicy({ kind: 'photograph', layout: 'auto' });
  assert.equal(photoPolicy.objectFit, 'cover');
  assert.equal(photoPolicy.allowAssistantReflow, true);
});

test('normalizeAndDedupeTags deduplicates case-insensitively', () => {
  const tags = normalizeAndDedupeTags(['CRISPR', 'crispr', '  Gene Editing ', 'GENE EDITING']);
  assert.deepEqual(tags, ['CRISPR', 'Gene Editing']);
});

test('runDeterministicLocalChecks flags body H1, missing alt text, and knowledge link opportunities without fabricating content (AT-20)', () => {
  const sampleArticle: Article = {
    id: 'art-test',
    locale: 'en',
    title: 'Entanglement Distribution Across Metropolitan Fiber Networks',
    slug: 'entanglement-distribution-fiber',
    summary: 'Double  space in summary text for testing.',
    body: {},
    bodyHtml: '<h1>Accidental Body H1</h1><p>Experiments using quantum entanglement demonstrated stable fidelity.</p>',
    status: 'draft',
    categoryIds: ['cat-physics'],
    tagIds: [],
    sourceIds: ['src-1'],
    seo: {},
    createdAt: '2026-10-30T10:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
    version: 2,
  };

  const tags: Tag[] = [
    { id: 't1', name: 'Quantum Physics', slug: 'quantum-physics' },
    { id: 't2', name: 'Entanglement', slug: 'entanglement' },
    { id: 't3', name: 'Fiber Networks', slug: 'fiber-networks' },
  ];

  const media: MediaAsset[] = [
    {
      id: 'm1',
      filename: 'interferometer-phase-plot.svg',
      title: 'Interferometer Phase Stability Plot',
      kind: 'scientific_figure',
      src: '/demo.svg',
      mime: 'image/svg+xml',
      width: 1200,
      height: 675,
      byteSize: 24000,
      altText: '',
      layout: 'locked',
      createdAt: '2026-10-30T10:00:00Z',
    },
  ];

  const sources: ScientificSource[] = [
    {
      id: 'src-1',
      title: 'Metropolitan Quantum Networking',
      authors: 'Chen et al.',
      journal: 'Nature Photonics',
      year: 2026,
      doi: 'invalid-doi',
      url: 'https://nature.com/articles/s41566-026-0001-x',
      sourceType: 'peer_reviewed',
      accessDate: '2026-10-30',
      verificationStatus: 'unverified',
    },
  ];

  const kl: KnowledgeLink[] = [
    {
      id: 'kl-1',
      term: 'quantum entanglement',
      targetType: 'wikipedia',
      targetUrl: 'https://en.wikipedia.org/wiki/Quantum_entanglement',
      locale: 'en',
      previewTitle: 'Quantum entanglement',
      previewExcerpt: 'A physical phenomenon that occurs when a group of particles are generated or interact...',
      sourceAttribution: 'Wikipedia (CC BY-SA 4.0 · Demo cached summary)',
      reviewStatus: 'approved',
      isSampleDemoData: true,
    },
  ];

  const changes = runDeterministicLocalChecks({
    article: sampleArticle,
    allTags: tags,
    articleMedia: media,
    articleSources: sources,
    availableKnowledgeLinks: kl,
    tasks: ['format', 'images', 'seo', 'sources', 'knowledge'],
  });

  assert.ok(changes.some((c) => c.targetPath === 'bodyHtml'));
  assert.ok(changes.some((c) => c.targetPath === 'media.altText'));
  assert.ok(changes.some((c) => c.targetPath === 'seo.title'));
  assert.ok(changes.some((c) => c.targetPath === 'sources'));
  assert.ok(changes.some((c) => c.targetPath === 'knowledgeLinks'));
});

test('getPresetVisibility returns expected item visibility for balanced and show_all', () => {
  const balanced = getPresetVisibility('balanced');
  assert.equal(balanced.articles, true);
  assert.equal(balanced.series, true);
  assert.equal(balanced.videos, false);

  const showAll = getPresetVisibility('show_all');
  assert.equal(showAll.videos, true);
  assert.equal(showAll.settings_audit, true);
});


test('SSR date formatting is timezone-independent and explicitly UTC', () => {
  assert.equal(formatUtcDate('2026-11-04T12:00:00.000Z'), 'Nov 4, 2026');
  assert.equal(formatUtcDateTime('2026-11-04T12:00:00.000Z'), 'Nov 4, 2026, 12:00 UTC');
  assert.equal(formatUtcDateTime('invalid'), 'Invalid date');
  assert.equal(formatUtcDate('invalid'), 'Invalid date');
});

test('scheduled publication round-trips exactly through the UTC datetime-local field', () => {
  const instant = '2026-11-04T12:00:00.000Z';
  const input = toUtcDateTimeInput(instant);
  assert.equal(input, '2026-11-04T12:00');
  assert.equal(parseUtcDateTimeInput(input)?.toISOString(), instant);
  assert.equal(parseUtcDateTimeInput('2026-02-30T12:00'), null);
  assert.equal(parseUtcDateTimeInput('2026-11-04T25:00'), null);
  assert.equal(parseUtcDateTimeInput(''), null);
});
