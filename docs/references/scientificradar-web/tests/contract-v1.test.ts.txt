import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEMO_ARTICLES, DEMO_AUTHORS } from "./fixtures";
import {
  adaptPublicArticleToSnapshotV1,
  adaptSnapshotV1ToPublicArticle,
  isSafePublishedMediaUrl,
  validatePublicationSnapshotV1,
} from "./contract-v1";
import { prepareCanonicalBodyHtml, resolveArticleHeadings } from "./sanitizer";
import ArticleReader from "../../components/editorial/ArticleReader";

test("all existing Stage A demo fixtures pass PublicationSnapshotV1 validation", () => {
  for (const article of DEMO_ARTICLES) {
    const snapshot = adaptPublicArticleToSnapshotV1(article, DEMO_AUTHORS);
    const validation = validatePublicationSnapshotV1(snapshot);
    assert.equal(
      validation.valid,
      true,
      `Expected ${article.slug} to pass v1 validation, issues: ${JSON.stringify(validation.issues)}`
    );
    assert.equal(validation.isPubliclyRenderable, true);
    // Demo articles must never be production-indexable candidates
    assert.equal(validation.isIndexableCandidate, false);
  }
});

test("PublicationSnapshotV1 supports both English (en) and Turkish (tr) locales and round-trips cleanly", () => {
  const base = adaptPublicArticleToSnapshotV1(DEMO_ARTICLES[0]);
  const trSnapshot = {
    ...base,
    articleId: "art-tr-kaf-01",
    revisionId: "rev-2026-11-03-tr-01",
    revisionNumber: 2,
    locale: "tr" as const,
    status: "published" as const,
    title: "Kuzey Anadolu Fay Zonu'nda Asismik Kayma ve Jeodezik Gerinim",
    dek: "InSAR ve GNSS dizileri İsmetpaşa segmentindeki yüzey kaymasını milimetre hassasiyetle çözümlüyor.",
  };

  const result = validatePublicationSnapshotV1(trSnapshot);
  assert.equal(result.valid, true);
  assert.equal(result.isPubliclyRenderable, true);
  assert.equal(result.isIndexableCandidate, true);

  const adapted = adaptSnapshotV1ToPublicArticle(trSnapshot);
  assert.equal(adapted.id, "art-tr-kaf-01");
  assert.equal(adapted.locale, "tr");
  assert.equal(adapted.revisionId, "rev-2026-11-03-tr-01");
  assert.equal(adapted.revisionNumber, 2);
});

test("draft, scheduled, in_review, archived, and withdrawn snapshots are rejected from public rendering", () => {
  const base = adaptPublicArticleToSnapshotV1(DEMO_ARTICLES[0]);

  for (const nonPublicStatus of [
    "draft",
    "in_review",
    "scheduled",
    "archived",
    "withdrawn",
  ] as const) {
    const candidate = {
      ...base,
      status: nonPublicStatus,
    };
    const res = validatePublicationSnapshotV1(candidate);
    assert.equal(
      res.isPubliclyRenderable,
      false,
      `Status "${nonPublicStatus}" must never be publicly renderable`
    );
    assert.equal(res.isIndexableCandidate, false);
    assert.ok(res.issues.length > 0);
  }
});

test("media validator rejects blob:, data:, javascript:, and untrusted external image origins", () => {
  assert.equal(isSafePublishedMediaUrl("/images/demo/spider-silk.svg"), true);
  assert.equal(
    isSafePublishedMediaUrl("blob:https://studio.scientificradar.com/abc-123"),
    false
  );
  assert.equal(
    isSafePublishedMediaUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="),
    false
  );
  assert.equal(isSafePublishedMediaUrl("javascript:alert(1)"), false);
  assert.equal(
    isSafePublishedMediaUrl("https://untrusted.example.com/fig1.png"),
    false
  );
  assert.equal(
    isSafePublishedMediaUrl(
      "https://media.scientificradar.com/figures/fig1.webp",
      new Set(["https://media.scientificradar.com"])
    ),
    true
  );
});

test("contract validator flags broken citation references, synthetic demo DOIs, and unsupported Studio HTML nodes", () => {
  const base = adaptPublicArticleToSnapshotV1(DEMO_ARTICLES[0]);

  const brokenSnapshot = {
    ...base,
    sources: [
      {
        ...base.sources[0],
        isIllustrativeDemo: true,
        doi: "10.1038/fake-demo-doi",
      },
    ],
    bodyHtml:
      '<h2>Introduction</h2><p>Bad ref <sup data-citation-source-id="missing-src-99">[99]</sup></p><img src="blob:http://localhost/123" alt="bad">',
  };

  const validation = validatePublicationSnapshotV1(brokenSnapshot);
  assert.equal(validation.valid, false);
  const codes = new Set(validation.issues.map((i) => i.code));
  assert.ok(codes.has("SYNTHETIC_DEMO_DOI_FORBIDDEN"));
  assert.ok(codes.has("BROKEN_CITATION_REFERENCE"));
  assert.ok(codes.has("UNSUPPORTED_STUDIO_NODE"));
});

test("bodyHtml representation derives accurate TOC headings, KaTeX math, and citation back-links matching ArticleReader", () => {
  const sampleHtml = [
    "<h1>Demoted Inner Heading</h1>",
    '<p> Lead paragraph referencing spidroin <sup data-citation-source-id="silk-src-1">1</sup>.</p>',
    '<h2 id="custom-rheology-id">Nanoconfined Beta-Sheet Rheology</h2>',
    '<div data-math-tex="U_T = \\int_0^{\\varepsilon_f} \\sigma(\\varepsilon)\\,d\\varepsilon" data-math-display="block"></div>',
    "<h3>Sub-section on Hydrogen Bonding</h3>",
  ].join("");

  const prepared = prepareCanonicalBodyHtml(sampleHtml, {
    sources: DEMO_ARTICLES[0].sources,
  });

  // 1. Both H1 (demoted to H2) and explicit H2 appear in extracted TOC outline with valid IDs
  assert.equal(prepared.headings.length, 2);
  assert.equal(prepared.headings[0].id, "section-demoted-inner-heading");
  assert.equal(prepared.headings[0].text, "Demoted Inner Heading");
  assert.equal(prepared.headings[1].id, "custom-rheology-id");
  assert.equal(prepared.headings[1].text, "Nanoconfined Beta-Sheet Rheology");

  // 2. KaTeX math rendered with MathML and role="math"
  assert.match(prepared.html, /role="math"/);
  assert.match(prepared.html, /class="katex-mathml"/);

  // 3. Citation back-link wired to #ref-silk-src-1
  assert.match(prepared.html, /href="#ref-silk-src-1"/);
  assert.match(prepared.html, /id="cite-silk-src-1"/);

  // 4. Verify ArticleReader renders both desktop and mobile TOC when article uses bodyHtml with empty blocks
  const htmlOnlyArticle = {
    ...DEMO_ARTICLES[0],
    blocks: [],
    bodyHtml: sampleHtml,
  };
  const resolvedHeadings = resolveArticleHeadings(htmlOnlyArticle);
  assert.equal(resolvedHeadings.length, 2);

  const staticMarkup = renderToStaticMarkup(
    React.createElement(ArticleReader, {
      article: htmlOnlyArticle,
      authors: DEMO_AUTHORS.slice(0, 1),
    })
  );
  assert.ok(
    staticMarkup.includes('data-testid="responsive-toc"'),
    "ArticleReader must render responsive TOC for bodyHtml articles"
  );
  assert.ok(
    staticMarkup.includes("#custom-rheology-id"),
    "ArticleReader TOC must link to canonical bodyHtml H2 IDs"
  );
});
