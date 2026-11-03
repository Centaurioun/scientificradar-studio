import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  PUBLICATION_CONTRACT_VERSION,
  PublishedSnapshotRecordV1,
  adaptSnapshotV1ToPublicArticle,
  buildDeterministicStudioExportFixtures,
  detectUnsupportedEditorConstructs,
  getDefaultGoogleServicesReadinessSnapshot,
  mapStudioStatusToWebStatus,
  prepareCanonicalBodyHtml,
  prepareLegacyArticlesImportDryRun,
  renderScientificMath,
  sanitizeCanonicalBodyHtml,
  serializeStudioArticleToSnapshotV1,
  validatePublicationSnapshotV1,
} from './index';
import {
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
  SEED_MEDIA,
  SEED_SOURCES,
  SEED_TAGS,
} from '../seed-data';

function loadPinnedWebExample(filename: string): PublishedSnapshotRecordV1 {
  const filePath = path.join(
    process.cwd(),
    'docs',
    'references',
    'scientificradar-web',
    'examples',
    filename
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PublishedSnapshotRecordV1;
}

describe('ScientificRadar Studio ↔ Web Contract v1.0.0 & M1–M7 Alignment', () => {
  it('validates the pinned Web published-html-en.json fixture as valid and isPubliclyRenderable', () => {
    const enHtml = loadPinnedWebExample('published-html-en.json');
    const result = validatePublicationSnapshotV1(enHtml, {
      enforceStrictStudioPrePublish: true,
    });

    assert.equal(result.valid, true, JSON.stringify(result.issues));
    assert.equal(result.isPubliclyRenderable, true);
    assert.equal(result.publicEligible, true);
    // Because seo.noindex === true in the synthetic reference fixture, isIndexableCandidate is false
    assert.equal(result.isIndexableCandidate, false);
    assert.equal(result.issues.length, 0);

    const adapted = adaptSnapshotV1ToPublicArticle(enHtml);
    assert.equal(adapted.id, 'ref-sample-en-001');
    const prepared = prepareCanonicalBodyHtml(adapted.bodyHtml || '', {
      sources: adapted.sources,
    });
    assert.equal(prepared.headings.length, 2);
    assert.ok(prepared.html.includes('role="math"'));
    assert.ok(prepared.html.includes('href="#ref-src-illustrative"'));
  });

  it('validates the pinned Web published-blocks-tr.json fixture with Turkish diacritics and detects unverified rights in strict Studio mode', () => {
    const trBlocks = loadPinnedWebExample('published-blocks-tr.json');
    // Baseline Web contract v1 validator accepts rightsVerified: false in demo fixture
    const webResult = validatePublicationSnapshotV1(trBlocks, {
      enforceStrictStudioPrePublish: false,
    });
    assert.equal(webResult.valid, true, JSON.stringify(webResult.issues));
    assert.equal(webResult.isPubliclyRenderable, true);
    assert.ok(trBlocks.title.includes('Ö'));
    assert.ok(trBlocks.dek.includes('ğ'));

    // Studio strict pre-publish mode flags rightsVerified: false on blocks[4].media
    const strictStudioResult = validatePublicationSnapshotV1(trBlocks, {
      enforceStrictStudioPrePublish: true,
    });
    assert.equal(strictStudioResult.valid, false);
    assert.ok(
      strictStudioResult.issues.some((i) => i.code === 'UNVERIFIED_MEDIA_RIGHTS')
    );
  });

  it('validates the pinned Web draft-not-public.json fixture as NON_PUBLIC_STATUS and not publicly renderable', () => {
    const draft = loadPinnedWebExample('draft-not-public.json');
    const result = validatePublicationSnapshotV1(draft);

    assert.equal(result.isPubliclyRenderable, false);
    assert.equal(result.isIndexableCandidate, false);
    assert.equal(result.publicEligible, false);
    assert.ok(result.issues.some((i) => i.code === 'NON_PUBLIC_STATUS'));
  });

  it('never maps Studio editorial statuses to public "published" without a serverVerified receipt', () => {
    const statuses = [
      'idea',
      'draft',
      'in_review',
      'revision_requested',
      'approved',
      'scheduled',
      'published',
      'archived',
    ] as const;

    for (const st of statuses) {
      const mapped = mapStudioStatusToWebStatus(st);
      assert.notEqual(
        mapped,
        'published',
        `Studio status "${st}" must not map to Web "published" without authorization receipt`
      );
    }

    const withVerifiedReceipt = mapStudioStatusToWebStatus('published', {
      receiptId: 'rcpt-1',
      authorizedByActor: 'Dr. Clara Vance',
      authorizedByRole: 'owner',
      issuedAt: '2026-11-03T12:00:00.000Z',
      serverVerified: true,
    });
    assert.equal(withVerifiedReceipt, 'published');
  });

  it('produces valid deterministic Studio export fixtures for M7 (EN HTML, TR HTML, and non-public draft)', () => {
    const fixtures = buildDeterministicStudioExportFixtures();

    const enVal = validatePublicationSnapshotV1(
      fixtures.publishedEnglishHtmlFixture,
      { enforceStrictStudioPrePublish: true }
    );
    assert.equal(enVal.valid, true, JSON.stringify(enVal.issues));
    assert.equal(enVal.isPubliclyRenderable, true);
    assert.equal(enVal.isIndexableCandidate, true);
    assert.equal(
      fixtures.publishedEnglishHtmlFixture.contractVersion,
      PUBLICATION_CONTRACT_VERSION
    );

    const trVal = validatePublicationSnapshotV1(
      fixtures.publishedTurkishHtmlFixture,
      { enforceStrictStudioPrePublish: true }
    );
    assert.equal(trVal.valid, true, JSON.stringify(trVal.issues));
    assert.equal(trVal.isPubliclyRenderable, true);
    assert.equal(fixtures.publishedTurkishHtmlFixture.locale, 'tr');

    const draftVal = validatePublicationSnapshotV1(
      fixtures.nonPublicDraftFixture
    );
    assert.equal(draftVal.isPubliclyRenderable, false);
    assert.equal(draftVal.isIndexableCandidate, false);
    assert.equal(fixtures.nonPublicDraftFixture.seo?.noindex, true);
  });

  it('strips malicious XSS payloads, demotes embedded H1 to H2, and preserves scientific formatting', () => {
    const dirtyHtml = `
      <h1>Forbidden Embedded Headline</h1>
      <script>window.__pwned = true;</script>
      <p onclick="evil()">Quantum coherence <a href="java&#x09;script:alert(1)">unsafe link</a> and <a href="https://doi.org/10.1038/s41586-025-08100-0">valid link</a>.</p>
      <span data-math-tex="E = mc^2">E = mc^2</span>
      <iframe srcdoc="<script>alert(1)</script>"></iframe>
    `;

    const sanitized = sanitizeCanonicalBodyHtml(dirtyHtml);
    assert.equal(/<script\b/i.test(sanitized), false);
    assert.equal(/<iframe\b/i.test(sanitized), false);
    assert.equal(/onclick=/i.test(sanitized), false);
    assert.equal(/javascript:/i.test(sanitized), false);
    assert.equal(/<h1\b/i.test(sanitized), false);
    assert.ok(sanitized.includes('<h2>Forbidden Embedded Headline</h2>'));
    assert.ok(sanitized.includes('data-latex="E = mc^2"'));

    const prepared = prepareCanonicalBodyHtml(sanitized);
    assert.equal(prepared.headings.length, 1);
    assert.equal(prepared.headings[0].id, 'section-forbidden-embedded-headline');
    assert.ok(prepared.html.includes('role="math"'));
    assert.ok(prepared.html.includes('katex-mathml'));
  });

  it('rejects synthetic demo DOIs, broken inline citation references, unverified media rights, and unsupported HTML nodes', () => {
    const enHtml = loadPinnedWebExample('published-html-en.json');
    const mutated: PublishedSnapshotRecordV1 = {
      ...enHtml,
      bodyHtml: `${enHtml.bodyHtml}<p>Dangling citation <sup data-citation-source-id="src-nonexistent">[99]</sup></p><iframe src="https://evil.example"></iframe>`,
      sources: [
        {
          ...enHtml.sources[0],
          isIllustrativeDemo: true,
          doi: '10.1038/demo-synthetic-doi',
        },
      ],
      hero: {
        id: 'hero-unverified',
        src: '/images/demo/spider-silk-hierarchy.svg',
        alt: 'Diagram of spider silk',
        caption: 'Hierarchical structure',
        credit: 'ScientificRadar Lab',
        license: 'CC BY 4.0',
        width: 1200,
        height: 675,
        rightsVerified: false,
      },
    };

    const strictResult = validatePublicationSnapshotV1(mutated, {
      enforceStrictStudioPrePublish: true,
    });
    assert.equal(strictResult.valid, false);
    assert.equal(strictResult.isPubliclyRenderable, false);

    const codes = new Set(strictResult.issues.map((i) => i.code));
    assert.ok(codes.has('SYNTHETIC_DEMO_DOI_FORBIDDEN'));
    assert.ok(codes.has('BROKEN_CITATION_REFERENCE'));
    assert.ok(codes.has('UNVERIFIED_MEDIA_RIGHTS'));
    assert.ok(codes.has('UNSUPPORTED_STUDIO_NODE'));
  });

  it('renders KaTeX equations with MathML accessibility and degrades gracefully on invalid LaTeX', () => {
    const validMath = renderScientificMath(
      '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}',
      true
    );
    assert.equal(validMath.valid, true);
    assert.ok(validMath.html.includes('katex-mathml'));

    const invalidMath = renderScientificMath('\\frac{1}{', false);
    assert.equal(invalidMath.valid, false);
    assert.ok(invalidMath.html.includes('data-math-fallback="true"'));
  });

  it('detects unsupported editor constructs before export', () => {
    const issues = detectUnsupportedEditorConstructs(
      '<p>Text</p><video src="clip.mp4"></video><img src="data:image/png;base64,AAAA" />'
    );
    assert.equal(issues.length, 2);
    assert.equal(issues[0].code, 'UNSUPPORTED_STUDIO_NODE');
    assert.equal(issues[1].code, 'UNSUPPORTED_STUDIO_NODE');
  });

  it('performs deterministic M3 legacy article import dry-run with conflict detection and redirect mapping', () => {
    const dryRun = prepareLegacyArticlesImportDryRun({
      legacyRecords: [
        {
          legacyId: 'wp-2024-881',
          legacyUrlPath: '/2024/09/kuantum-algilayicilar.html',
          sourceSystem: 'wordpress-xml-v1',
          locale: 'tr',
          title: '<h1>Kuantum Algılayıcılar ve Kütleçekim Dalgaları</h1>',
          dek: 'İyon tuzakları ile düşük frekanslı faz kaymalarının ölçümü.',
          bodyHtml:
            '<h1>Giriş</h1><p>Türkçe bilimsel içerik: İ, ı, ğ, ş, ö, ü, ç.</p>',
          categorySlug: 'physics',
        },
        {
          legacyId: 'wp-2024-empty',
          legacyUrlPath: '/2024/09/empty.html',
          sourceSystem: 'wordpress-xml-v1',
          locale: 'en',
          title: '',
          bodyHtml: '',
        },
      ],
      existingArticles: SEED_ARTICLES,
      categories: SEED_CATEGORIES,
      tags: SEED_TAGS,
    });

    assert.equal(dryRun.sourceBatchCount, 2);
    assert.equal(dryRun.importableCount, 1);
    assert.equal(dryRun.blockedCount, 1);
    assert.equal(dryRun.stagedArticles[0].status, 'draft');
    assert.equal(dryRun.stagedArticles[0].seo.noindex, true);
    assert.equal(
      /<h1\b/i.test(dryRun.stagedArticles[0].bodyHtml),
      false,
      'Legacy body H1 must be demoted to H2 on import'
    );
    assert.equal(dryRun.redirectMappings.length, 1);
    assert.equal(
      dryRun.redirectMappings[0].fromLegacyPath,
      '/2024/09/kuantum-algilayicilar.html'
    );
  });

  it('reports truthful M4 Google services readiness with zero fabricated live metrics', () => {
    const readiness = getDefaultGoogleServicesReadinessSnapshot();
    assert.equal(readiness.ga4.status, 'not_connected');
    assert.equal(readiness.adSense.status, 'not_connected');
    assert.equal(readiness.searchConsole.status, 'not_connected');
    assert.ok(
      readiness.adSense.prohibitedPlacements.includes('inside_equation_block')
    );
  });

  it('serializes Studio seed articles cleanly and preserves non-public status in isolated prototype', () => {
    const serialized = serializeStudioArticleToSnapshotV1({
      article: SEED_ARTICLES[0],
      categories: SEED_CATEGORIES,
      tags: SEED_TAGS,
      authors: SEED_AUTHORS,
      sources: SEED_SOURCES,
      media: SEED_MEDIA,
    });

    assert.equal(serialized.publicReleaseAuthorized, false);
    assert.notEqual(serialized.snapshot.status, 'published');
    assert.equal(serialized.snapshot.seo?.noindex, true);
  });
});
