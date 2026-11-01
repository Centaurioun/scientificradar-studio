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
  getAllowedNextStatuses,
  normalizeAndDedupeTags,
  MAX_EDITORIAL_TAGS,
  tagCountIsValid,
  normalizeArticleTagIds,
  getMediaDisplayPolicy,
  runDeterministicLocalChecks,
  getPresetVisibility,
} from './editorial-rules';
import {
  formatDeterministicUtc,
  formatLocalizedInstant,
  DEFAULT_ADMIN_DATETIME_PREFS,
} from './datetime/format';
import {
  interpretWallTime,
  formatIsoToWallTimeInput,
} from './datetime/parse';
import {
  runArticleAudit,
  buildQuickFixProposal,
  computeArticleFingerprint,
} from './audit/run-article-audit';
import { evaluatePublishGate } from './audit/publish-policy';
import { Article, Category, KnowledgeLink, MediaAsset, ScientificSource, Tag } from './types';

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
  assert.equal(
    ensureUniqueSlug('CRISPR Off-Target Effects', 'tr', existing),
    'crispr-off-target-effects'
  );
});

test('validateSafeUrl blocks javascript: and data: schemes while allowing https and relative routes', () => {
  assert.equal(validateSafeUrl('https://en.wikipedia.org/wiki/Quantum_entanglement').valid, true);
  assert.equal(validateSafeUrl('/articles/jwst-exoplanet-spectra').valid, true);
  assert.equal(validateSafeUrl('//external.example/path').valid, false);
  assert.equal(validateSafeUrl('/\\\\external.example/path').valid, false);
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

test('HTML security policy removes malformed active markup and encoded handler/protocol variants', () => {
  const dirty = [
    '<IMG SRC=/__missing.png oNeRrOr="runCanary()">',
    '<a href="JaVaScRiPt:runCanary()">unsafe link</a>',
    '<a href="jav&#x61;script:runCanary()">encoded unsafe link</a>',
    '<svg><foreignObject><img src=x onerror=runCanary()></foreignObject></svg>',
    '<math><mtext><img src=x onerror=runCanary()></mtext></math>',
    '<iframe src="https://example.invalid"></iframe><object data="x"></object><embed src="x">',
    '<p style="background:url(javascript:runCanary())">styled active content</p>',
    '<p>malformed<div onclick=runCanary()>nested</p>',
  ].join('');

  const { sanitizedHtml } = sanitizeAndDemoteBodyH1(dirty);
  assert.doesNotMatch(sanitizedHtml, /onerror|onclick|javascript:|<svg|<math|foreignObject|<iframe|<object|<embed|style=/i);
  assert.match(sanitizedHtml, /unsafe link/);
  assert.match(sanitizedHtml, /encoded unsafe link/);
  assert.match(sanitizedHtml, /styled active content/);
  assert.match(sanitizedHtml, /malformed/);
});

test('HTML security policy preserves supported scientific formatting, references, figures and Unicode', () => {
  const scientific = [
    '<p>Ω β ∑ ≈ 10⁻⁶; DOI 10.1038/s41586-026-01492-x.</p>',
    '<p><strong>Bold</strong> <em>emphasis</em> <u>underline</u> <s>strike</s> <sup>2</sup><sub>n</sub></p>',
    '<blockquote><p>Quoted observation</p></blockquote>',
    '<ol><li>First<ul><li>Nested second</li></ul></li></ol>',
    '<pre><code>const x = "&lt;img&gt;";</code></pre>',
    '<table><thead><tr><th scope="col">Measure</th></tr></thead><tbody><tr><td>±0.2</td></tr></tbody></table>',
    '<figure><img src="/media/figure-1.png" alt="Phase diagram" width="640" height="480"><figcaption>Adapted with attribution.</figcaption></figure>',
    '<p><a href="https://doi.org/10.1038/s41586-026-01492-x" target="_blank" rel="noopener noreferrer">Reference</a></p>',
    '<p><a href="/articles/art-1" data-knowledge-term="quantum state" target="_self">quantum state</a></p>',
    '<p>&lt;script&gt; is literal untrusted text.</p>',
  ].join('');

  const { sanitizedHtml, demotedH1Count } = sanitizeAndDemoteBodyH1(`<h1 id="body-heading">Body title</h1>${scientific}`);
  assert.equal(demotedH1Count, 1);
  assert.match(sanitizedHtml, /<h2[^>]*>Body title<\/h2>/);
  for (const retained of ['Ω β ∑', '10.1038/s41586-026-01492-x', '<sup>2</sup>', '<sub>n</sub>', 'Nested second', '±0.2', 'Phase diagram', 'Adapted with attribution.', 'data-knowledge-term="quantum state"', '&lt;script&gt;']) {
    assert.ok(sanitizedHtml.includes(retained), `expected supported scientific content to survive: ${retained}`);
  }
  assert.match(sanitizedHtml, /href="https:\/\/doi\.org\/10\.1038/);
  assert.match(sanitizedHtml, /rel="noopener noreferrer"/);
  assert.match(sanitizedHtml, /scope="col"/);
  assert.doesNotMatch(sanitizedHtml, /<h1\b/i);
});

test('HTML security policy rejects data/blob URLs and handles empty or large safe documents', () => {
  const urls = sanitizeAndDemoteBodyH1(
    '<p><a href="data:text/html,runCanary()">data link</a><a href="blob:https://example.invalid/id">blob link</a></p><img src="data:image/png;base64,AAAA" alt="data image"><img src="blob:https://example.invalid/id" alt="blob image">',
  ).sanitizedHtml;
  assert.doesNotMatch(urls, /href="(?:data|blob):|src="(?:data|blob):/i);

  assert.equal(sanitizeAndDemoteBodyH1('').sanitizedHtml, '');
  const largeSafeHtml = `<p>${'scientific μ-data '.repeat(10_000)}</p>`;
  const largeResult = sanitizeAndDemoteBodyH1(largeSafeHtml).sanitizedHtml;
  assert.match(largeResult, /scientific μ-data/);
  assert.equal((largeResult.match(/scientific μ-data/g) || []).length, 10_000);
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

test('canTransitionStatus and getAllowedNextStatuses enforce strict state and role matrix (v5 Gate C)', () => {
  assert.equal(canTransitionStatus('draft', 'in_review', 'author').allowed, true);
  assert.equal(canTransitionStatus('draft', 'published', 'author').allowed, false);
  assert.equal(canTransitionStatus('in_review', 'approved', 'reviewer').allowed, true);
  assert.equal(canTransitionStatus('approved', 'published', 'reviewer').allowed, false);
  assert.equal(canTransitionStatus('approved', 'published', 'editor').allowed, true);
  // Redundant self-transition or illegal jumps blocked
  assert.equal(canTransitionStatus('approved', 'approved', 'editor').allowed, false);
  assert.equal(canTransitionStatus('draft', 'approved', 'editor').allowed, false);

  const reviewerFromApproved = getAllowedNextStatuses('approved', 'reviewer');
  assert.deepEqual(reviewerFromApproved, ['draft']);

  const editorFromApproved = getAllowedNextStatuses('approved', 'editor');
  assert.ok(editorFromApproved.includes('published'));
  assert.ok(editorFromApproved.includes('scheduled'));
  assert.ok(!editorFromApproved.includes('approved'));
});

test('getMediaDisplayPolicy enforces non-destructive contain for scientific figures (AT-19)', () => {
  const figPolicy = getMediaDisplayPolicy({ kind: 'scientific_figure', layout: 'locked' });
  assert.equal(figPolicy.objectFit, 'contain');
  assert.equal(figPolicy.allowAssistantReflow, false);

  const photoPolicy = getMediaDisplayPolicy({ kind: 'photograph', layout: 'auto' });
  assert.equal(photoPolicy.objectFit, 'cover');
  assert.equal(photoPolicy.allowAssistantReflow, true);
});

test('normalizeAndDedupeTags and 6-tag house limit work deterministically (v5 Gate A)', () => {
  const tags = normalizeAndDedupeTags(['CRISPR', 'crispr', '  Gene Editing ', 'GENE EDITING']);
  assert.deepEqual(tags, ['CRISPR', 'Gene Editing']);

  assert.equal(MAX_EDITORIAL_TAGS, 6);
  assert.equal(tagCountIsValid(['t1', 't2', 't3', 't4', 't5', 't6']), true);
  assert.equal(tagCountIsValid(['t1', 't2', 't3', 't4', 't5', 't6', 't7']), false);
  const norm = normalizeArticleTagIds(['t1', 't2', 't1', 't3', 't4', 't5', 't6', 't7']);
  assert.deepEqual(norm.normalizedIds, ['t1', 't2', 't3', 't4', 't5', 't6']);
  assert.equal(norm.dedupedCount, 1);
  assert.equal(norm.rejectedOverflowCount, 1);
});

test('formatDeterministicUtc and formatLocalizedInstant format UTC and localized dates safely (v5 Gate A)', () => {
  const iso = '2026-10-30T14:30:00.000Z';
  assert.equal(formatDeterministicUtc(iso, 'date'), '2026-10-30 UTC');
  assert.equal(formatDeterministicUtc(iso, 'datetime'), '2026-10-30 14:30 UTC');
  assert.equal(formatDeterministicUtc('not-a-date', 'datetime'), 'Invalid date');

  // Europe/Istanbul is UTC+3 -> 17:30 in 24h mode
  const istanbulText = formatLocalizedInstant(iso, DEFAULT_ADMIN_DATETIME_PREFS, 'datetime');
  assert.ok(istanbulText.includes('17:30'), `Expected 17:30 in Istanbul output, got: ${istanbulText}`);

  // America/New_York in October (EDT, UTC-4) -> 10:30 AM in 12h mode
  const nyText = formatLocalizedInstant(
    iso,
    {
      locale: 'en-US',
      timeZone: 'America/New_York',
      hourCycle: '12',
    },
    'datetime'
  );
  assert.ok(nyText.includes('10:30'), `Expected 10:30 in New York output, got: ${nyText}`);
});

test('interpretWallTime handles timezone round-trip, invalid dates, DST spring-forward gap, and DST fall-back overlap (v5 Gate A)', () => {
  // Valid wall time in Europe/Istanbul (UTC+3)
  const ist = interpretWallTime('2026-11-12T09:00', 'Europe/Istanbul');
  assert.equal(ist.ok, true);
  if (ist.ok) {
    assert.equal(ist.utcIso, '2026-11-12T06:00:00.000Z');
    assert.equal(formatIsoToWallTimeInput(ist.utcIso, 'Europe/Istanbul'), '2026-11-12T09:00');
  }

  // Impossible calendar date
  const badCal = interpretWallTime('2026-02-30T10:00', 'Europe/Istanbul');
  assert.equal(badCal.ok, false);
  if (!badCal.ok) {
    assert.equal(badCal.reason, 'invalid');
  }

  // DST Spring-Forward Gap in America/New_York: 2026-03-08 at 02:30 does not exist
  const springGap = interpretWallTime('2026-03-08T02:30', 'America/New_York');
  assert.equal(springGap.ok, false);
  if (!springGap.ok) {
    assert.equal(springGap.reason, 'nonexistent');
  }

  // DST Fall-Back Overlap in America/New_York: 2026-11-01 at 01:30 occurs twice (EDT UTC-4 and EST UTC-5)
  const fallUndisambiguated = interpretWallTime('2026-11-01T01:30', 'America/New_York');
  assert.equal(fallUndisambiguated.ok, false);
  if (!fallUndisambiguated.ok) {
    assert.equal(fallUndisambiguated.reason, 'ambiguous');
    assert.equal(fallUndisambiguated.earlierUtcIso, '2026-11-01T05:30:00.000Z');
    assert.equal(fallUndisambiguated.laterUtcIso, '2026-11-01T06:30:00.000Z');
  }

  const fallEarlier = interpretWallTime('2026-11-01T01:30', 'America/New_York', 'earlier');
  const fallLater = interpretWallTime('2026-11-01T01:30', 'America/New_York', 'later');
  assert.equal(fallEarlier.ok, true);
  assert.equal(fallLater.ok, true);
  if (fallEarlier.ok && fallLater.ok) {
    assert.equal(fallEarlier.utcIso, '2026-11-01T05:30:00.000Z');
    assert.equal(fallLater.utcIso, '2026-11-01T06:30:00.000Z');
  }
});

test('runArticleAudit and evaluatePublishGate enforce v5 Scenario A (73/65 SEO title warning + 116/160 description pass), tag counts, subcategory mismatch, and unverified external checks (v5 Gates B & C)', () => {
  const categories: Category[] = [
    { id: 'cat-bio', name: 'Biotechnology & Genetics', slug: 'biotechnology-genetics', description: 'Bio', locale: 'en' },
    { id: 'sub-crispr', name: 'CRISPR & Gene Therapy', slug: 'crispr-gene-therapy', parentId: 'cat-bio', description: 'CRISPR', locale: 'en' },
    { id: 'cat-physics', name: 'Quantum & Condensed Matter Physics', slug: 'quantum-physics', description: 'Physics', locale: 'en' },
    { id: 'sub-optics', name: 'Quantum Optics', slug: 'quantum-optics', parentId: 'cat-physics', description: 'Optics', locale: 'en' },
  ];

  const tags: Tag[] = [
    { id: 't1', name: 'CRISPR', slug: 'crispr' },
    { id: 't2', name: 'Prime Editing', slug: 'prime-editing' },
    { id: 't3', name: 'Gene Therapy', slug: 'gene-therapy' },
    { id: 't4', name: 'Cardiology', slug: 'cardiology' },
    { id: 't5', name: 'Delivery Vectors', slug: 'delivery-vectors' },
    { id: 't6', name: 'Transcriptomics', slug: 'transcriptomics' },
    { id: 't7', name: 'Extra Seventh Tag', slug: 'extra-seventh-tag' },
  ];

  // 73-char SEO title & 113-char Meta description
  const seoTitle73 = 'Sub-Millisecond Prime Editing Fidelity Across Primary Cardiomyocyte Loci!';
  assert.equal(seoTitle73.length, 73);
  const metaDesc113 = 'High-depth duplex sequencing reveals how engineered pegRNA motifs suppress indels in human cardiac tissue models.';
  assert.equal(metaDesc113.length, 113);

  const baseArticle: Article = {
    id: 'art-v5-audit',
    locale: 'en',
    title: 'Prime Editing Fidelity in Human Cardiomyocytes',
    slug: 'prime-editing-fidelity-human-cardiomyocytes',
    summary: 'Distinct editorial deck summarizing prime editing fidelity experiments in human cardiac tissue.',
    body: {},
    bodyHtml:
      '<h2>Experimental Design</h2><p>Detailed telemetry across 48 donor lines using <a href="/articles/jwst-exoplanet-spectra">internal reference</a> and <a href="https://en.wikipedia.org/wiki/Prime_editing" data-knowledge-id="kl-1">prime editing</a>. In this study we analyze prime editing efficiency across cardiac loci with repeated duplex sequencing runs across multiple donor cohorts to establish statistical confidence and low off-target indel rates in human cardiomyocytes.</p><h3>Sequencing Protocol</h3><p>Duplex sequencing readouts confirmed low off-target activity across all tested loci in repeat trials, demonstrating reproducible editing fidelity without double-strand breaks.</p>',
    status: 'approved',
    primaryCategoryId: 'cat-bio',
    categoryIds: ['cat-bio', 'sub-crispr'],
    tagIds: ['t1', 't2', 't3', 't4'],
    authorId: 'usr-editor',
    featuredMediaId: 'm-lead',
    sourceIds: ['src-valid'],
    seo: {
      title: seoTitle73,
      description: metaDesc113,
      canonical: 'https://scientificradar.example/en/articles/prime-editing-fidelity-human-cardiomyocytes',
      noindex: true,
    },
    createdAt: '2026-10-30T10:00:00Z',
    updatedAt: '2026-10-30T12:00:00Z',
    version: 3,
  };

  const media: MediaAsset[] = [
    {
      id: 'm-lead',
      filename: 'cardiac-prime-editing.svg',
      title: 'Prime Editing Efficiency Plot',
      kind: 'scientific_figure',
      src: '/demo-figure.svg',
      mime: 'image/svg+xml',
      width: 1200,
      height: 675,
      byteSize: 28400,
      altText: 'Bar chart comparing pegRNA prime editing efficiency vs Cas9 nuclease indels across 12 cardiac loci',
      caption: 'Figure 1: Prime editing efficiency.',
      credit: 'ScientificRadar Lab',
      licence: 'CC BY 4.0',
      layout: 'locked',
      humanReviewedAlt: true,
      createdAt: '2026-10-30T10:00:00Z',
    },
  ];

  const sources: ScientificSource[] = [
    {
      id: 'src-valid',
      title: 'Engineered pegRNAs enhance prime editing in human cardiomyocytes',
      authors: 'Anzalone et al.',
      journal: 'Nature Biotechnology',
      year: 2026,
      doi: '10.1038/s41587-026-01928-z',
      url: 'https://doi.org/10.1038/s41587-026-01928-z',
      sourceType: 'peer_reviewed',
      accessDate: '2026-10-30',
      verificationStatus: 'syntax_checked_only',
      humanClaimVerified: true,
    },
  ];

  const report = runArticleAudit({
    article: baseArticle,
    allArticles: [baseArticle],
    categories,
    tags,
    media,
    sources,
  });

  // 73/65 SEO Title -> warning (truncation risk), NOT unconditional pass
  const titleLenFinding = report.findings.find((f) => f.id === 'metadata.seo_title.length');
  assert.equal(titleLenFinding?.status, 'warning');

  // 113/160 Meta description -> pass
  const descLenFinding = report.findings.find((f) => f.id === 'metadata.description.length');
  assert.equal(descLenFinding?.status, 'pass');

  // External checks are honestly marked unverified, never pass
  const gscFinding = report.findings.find((f) => f.id === 'search_console.indexed');
  assert.equal(gscFinding?.status, 'unverified');

  // Publish gate allows warning-only publish with override confirmation
  const gate = evaluatePublishGate({
    report,
    currentStatus: 'approved',
    targetStatus: 'published',
    activeRole: 'editor',
    isDirtyOrFailedSave: false,
  });
  assert.equal(gate.isBlocked, false);
  assert.equal(gate.canPublishWithWarningOverride, true);
  assert.equal(gate.blockers.length, 0);
  assert.ok(gate.warnings.length >= 1);

  // Now test 7 tags -> error blocker, plus mismatched subcategory -> error blocker
  const invalidTaxArticle: Article = {
    ...baseArticle,
    categoryIds: ['cat-bio', 'sub-optics'], // sub-optics belongs to cat-physics!
    tagIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7'], // 7 tags > 6 limit
  };

  const invalidReport = runArticleAudit({
    article: invalidTaxArticle,
    allArticles: [invalidTaxArticle],
    categories,
    tags,
    media,
    sources,
  });

  const subcatFinding = invalidReport.findings.find((f) => f.id === 'taxonomy.subcategory.valid');
  assert.equal(subcatFinding?.status, 'error');

  const tagCountFinding = invalidReport.findings.find((f) => f.id === 'taxonomy.tags.count');
  assert.equal(tagCountFinding?.status, 'error');

  const blockedGate = evaluatePublishGate({
    report: invalidReport,
    currentStatus: 'approved',
    targetStatus: 'published',
    activeRole: 'editor',
    isDirtyOrFailedSave: false,
  });
  assert.equal(blockedGate.isBlocked, true);
  assert.ok(blockedGate.blockers.length >= 2);

  // Verify deterministic Quick Fix proposals for subcategory mismatch and >6 tags
  const subcatFix = buildQuickFixProposal({
    findingId: 'taxonomy.subcategory.valid',
    article: invalidTaxArticle,
    allArticles: [invalidTaxArticle],
    categories,
    tags,
    media,
    sources,
  });
  assert.ok(subcatFix);
  assert.equal(subcatFix!.after, 'cat-bio');

  const tagFix = buildQuickFixProposal({
    findingId: 'taxonomy.tags.count',
    article: invalidTaxArticle,
    allArticles: [invalidTaxArticle],
    categories,
    tags,
    media,
    sources,
  });
  assert.ok(tagFix);
  assert.equal(tagFix!.after.split(', ').length, 6);

  // Fingerprint changes when article content changes
  const fp1 = computeArticleFingerprint(baseArticle, media, sources);
  const fp2 = computeArticleFingerprint(invalidTaxArticle, media, sources);
  assert.notEqual(fp1, fp2);
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
