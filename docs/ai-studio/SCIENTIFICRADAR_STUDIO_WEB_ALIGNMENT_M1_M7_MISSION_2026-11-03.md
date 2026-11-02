# ScientificRadar Studio — Google AI Studio Web-Aligned M1–M7 Studio-Side Mission

> **2026-11-03 · Studio repository ONLY · Design/implementation scope approved by owner.**
>
> **Google AI Studio short invocation:** "Read \`docs/ai-studio/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_M1_M7_MISSION_2026-11-03.md\` in full. Use the pinned ScientificRadar Web reference bundle under \`docs/references/scientificradar-web/\`. Implement all feasible **Studio-owned** tasks in one substantive sandbox run, preserving the editor and verifying each slice. Do not modify Web or production systems. Produce an evidence-based execution report and confirm GitHub sync."
>
> The owner specifically chose **Web-first, Studio-second, integration-third**. Web's approved ARTICLE **VISUAL OUTPUT** is authoritative for Studio's preview. This does NOT mean replacing Studio's editor/data model with Web's public display model or embedding the entire Web app inside Studio.

## 0. Mission, scope and current evidence

- **Work only in** \`https://github.com/Centaurioun/scientificradar-studio\`, imported from its current \`main\`.
- Read \`docs/references/scientificradar-web/README.md\` and \`SOURCE_MANIFEST.md\`. The exact pinned source is Web SHA \`3b096e84023ca1ba358b7d7dd4f25f17185fc8d7\`, contract v\`1.0.0\`, with GitHub [Quality](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384305) and [Playwright 85/85](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384497) successful at that SHA.
- Existing Studio baseline at reference export: \`b160accd89c8d24b9e5b726e70158d73cc2176d1\` (historical: verify the actual imported HEAD; do not overwrite newer Studio work).
- Studio includes Tiptap 3 and CKEditor, HTML/JSON authoring, IndexedDB snapshots, editorial workflow, SEO quality gate, references, figure/media metadata, LaTeX, revisions and a **local-only demo preview**. Existing role selection is **client simulation**, not real server RBAC or a publishing API.
- **Do not replace the existing admin UX**. Make its ARTICLE PREVIEW look and behave like public Web; retain the separate, full-featured editorial workspace.
- This mission is the Studio-owned slice of the central [ScientificRadar Web Project #3](https://github.com/users/Centaurioun/projects/3) M1–M7 roadmap. Do not make duplicate milestones, declare both apps merged or close cross-repository milestones based on local tests.

### Read this authority order

1. This mission (scope and constraints).
2. \`docs/references/scientificradar-web/README.md\`, \`SOURCE_MANIFEST.md\`, \`examples/EXPECTED_RENDERING.md\`, the three synthetic JSON records.
3. \`docs/references/scientificradar-web/specs/CONTENT_CONTRACT.md\`, \`specs/DESIGN_TOKENS.md\` and selected source \`.tsx.txt\`, \`.ts.txt\`, \`.css.txt\` files and reference test sources.
4. **Current actual Studio code:** \`lib/types.ts\`, \`lib/studio-context.tsx\`, \`lib/studio-persistence.ts\`, \`lib/editorial-rules.ts\`, \`lib/html-security.ts\`, \`lib/citations.ts\`, \`lib/audit/publish-policy.ts\`, \`components/editor/article-workspace.tsx\`, \`components/editor/article-preview-view.tsx\`, \`components/editor/article-tiptap-editor.tsx\`, \`components/editor/article-ckeditor.tsx\`, roles/review/revisions/SEO/media pages, current tests and CI.
5. Existing \`docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md\` and \`docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md\` **as historical prototype context**. They are not instructions to recreate the app or override this newly approved Web-alignment task.

### Preserve the two distinct models

- **Studio authoring record:** editable \`Article\` in \`lib/types.ts\`, \`body\` (Tiptap JSON), \`bodyHtml\` (sanitized HTML), linked sources/media/author, original status and full revisions.
- **Web public projection:** \`PublishedSnapshotRecordV1\` (\`contractVersion: "1.0.0"\`) in Web's \`content-model/types.ts.txt\`; Web's public-facing \`ArticleReader\` is the visual/rendering target.
- Do not let Studio's schema be reduced to plain \`ArticleBlock[].text\`; preserve formatting, tables, math, linked citations, data integrity, and future editor capabilities.
- **Production publishing is a later authenticated integration:** a local Studio status change is NOT a server-acknowledged publication, and no Web fixture is the source-of-truth manuscript store.

## 1. Preflight, source and baseline checks — FIRST

- Verify imported Studio repo and actual source/commit; no stale sandbox merge overwriting newer \`main\`.
- Inventory the live preview/editor architecture and its source dependencies; identify current preview style and layout exactly.
- Run appropriate existing checks BEFORE changes: \`bun install --frozen-lockfile\` if lockfile exists and Bun available; \`bun run test:unit\`, \`bun run typecheck\`, \`bun run lint\`, \`bun run build\`, \`bun run test:e2e\` (after pinned Chromium installed). Do not state success where a command could not run. Preserve all previously passing tests and note baseline failures.
- Treat copied Web \`.txt\` files as inert source. Never import or move them into Studio application paths or include Web global CSS in Studio root.

## 2. M1 — Visual parity: adapt Studio preview, NOT editor

**Goal:** When editing an article in Studio, its preview's ARTICLE SURFACE should match Web's accepted public reader for the same semantic content and viewport.

- [ ] Inspect \`ArticlePreviewView\` and establish components rendering article header, dek, author byline, H2/H3, table, formula, figures, sources and navigation. Identify feature/typography differences versus pinned Web references.
- [ ] Preserve current Studio edit toolbar and admin shell. Refactor or add a contained \`ScientificRadarWebArticlePreview\` (name an illustrative suggestion, not an existing file) that takes a **validated Web-public projection or a deterministic preview projection** of the current Studio Article; never uses the published HTML from unsafe raw editor input.
- [ ] Scope Web typography/colors through a preview wrapper, CSS module, carefully scoped class or shadow boundary, so Web's \`--sr-*\`, Merriweather/Inter and \`.article-prose\` affect the article preview only. Preserve existing dark-mode/theme, admin navigation and editor panels. Do not replace \`app/globals.css\` or Studio font setup wholesale.
- [ ] Match Web's compact article header, default 700px prose measure (600/560 variants if useful), 880px heading max, 1100px figure max, responsive TOC, math and citation UI, table scrolling and author/meta layout. Preview chrome (edit/viewport/back/noindex guard) stays clearly identifiable as Studio and is excluded from the visual comparison surface.
- [ ] Ensure a real editor change is reflected in preview after save/unsaved-state changes according to existing Studio workflow, with predictable behavior; show honest save/preview status. Support mobile 320/390px, tablet and 1440px desktop; no horizontal overflow, image distortion or duplicate H1.
- [ ] Render both supported source HTML and structured Web block samples; verify equivalence of headings/anchor IDs, H2/H3 TOC, formulas, figures and citation/reference backlinks.
- [ ] For knowledge-link hover, source numbering, custom HTML editor extensions and scientific blocks, preserve existing Studio semantics; do not silently strip unsupported editor nodes.
- [ ] Compare rendered preview to pinned Web source with deterministic fixtures and visual snapshots created from ACTUAL running screens. **No screenshots are present in this reference bundle:** do not fabricate them or claim pixel parity without captures.

## 3. M1 — Versioned Studio → Web snapshot producer and validation

Build an explicitly versioned, typed, deterministic serializer from Studio's authoring model to Web \`PublishedSnapshotRecordV1\`. Make its interface testable with local fixtures, without using Web runtime or credentials. Suggested location: focused \`lib/publishing/\` modules, not \`docs/references/\`.

- [ ] Keep stable immutable article ID and independent published revision ID. Do not use \`slug\` as identity; preserve locale (\`en\`/\`tr\`), translation group only with real link, timestamps, category/subcategory/tag mapping, author IDs, source IDs and media ID mappings.
- [ ] Studio's statuses \`idea\`, \`draft\`, \`in_review\`, \`revision_requested\`, \`approved\`, \`scheduled\`, \`published\`, \`archived\` are **editorial state**. Map a prepared candidate only to an appropriate **non-public** Web state by default. An authorized backend publish receipt is required before returning a production \`published\` snapshot. Explicit withdrawal is a separate controlled action; no schema mismatch should silently make a draft public.
- [ ] Web public contract requires \`title\`, \`dek\`, \`summary\`, article/revision identities, slugs, authors/taxonomy, sources, dated publication, body and optional SEO fields. Studio \`Article\` currently lacks some Web public fields directly, e.g. \`dek\` and \`readingTimeMinutes\`; add intentional editor-facing fields/derivations or a documented deterministic mapping instead of inventing metadata or reusing unrelated fields without review.
- [ ] Source record conversion preserves reference identity, title, author, journal, year, DOI/URL/provenance verification. DOI syntax checks are not external authenticity verification; illustrative fake DOIs forbidden. Preserve separate author profile identity from Studio login account identity.
- [ ] Export **canonical sanitized rich HTML** or structured blocks with no silent data loss. Handle formatting (bold, italic, underline, sub/superscript), headings, inline and display LaTeX, scientific figures, tables/caption/footnotes, citations, trusted knowledge links and lists. When Web v1 cannot represent an element, **block export with an actionable explanation**, or create a documented cross-app contract change for later approval; never strip it silently.
- [ ] Block unsafe HTML/URL and ephemeral \`blob:\`/\`data:\` media. Reject unverified rights: current Web v1 validator's \`validateMediaRecord\` checks URL/alt/caption/credit/licence/dimensions but does not visibly reject \`rightsVerified === false\` at the pinned SHA. Studio's pre-publish gate MUST enforce actual verification; flag this remaining cross-repository gap for Codex/Antigravity.
- [ ] Provide deterministic validation and idempotency intent, schema-version mismatches, field-level errors, action/audit receipt placeholder interfaces and non-destructive revision preparation, while not claiming live remote credentials or a real publishing endpoint.
- [ ] Implement producer-consumer **contract fixture tests**, including both \`examples/published-html-en.json\` and \`examples/published-blocks-tr.json\`, a draft rejection example, malicious HTML, missing source IDs, untrusted media, duplicate slugs and version mismatch. The provided examples are synthetic spec fixtures and were **not pretested as a live Studio producer output**; adapt the assertions to source truth and document mismatches.

## 4. M1 — Security and preview/publication semantics

- [ ] A preview may display unsaved, draft, review, approved or scheduled article data **only to the authorized Studio preview context**. The current local prototype must display clear demo-only/noindex/NOT-LIVE notices; no public URL or sitemap insertion.
- [ ] Maintain existing editorial roles \`owner/editor/author/reviewer\` and appropriate review transitions, but keep simulated client role switching honest until real server auth is later implemented. Do not render "server-verified" or "published to Web" in the current prototype.
- [ ] Preserve local revision snapshots/restore and add contract-version and revision-number verification tests; do not overwrite history on restore.
- [ ] Prepare server boundary interface/security requirements for future integration, but do NOT provision DB, hosting, authentication vendor, secrets or publishing API against Web from this isolated sandbox.
- [ ] The public Web reader will remain authoritative; Studio preview may use adapted components, not a second fully independent design invented by the agent.

## 5. M2 — Studio editorial SEO and metadata responsibilities

- [ ] Retain Studio SEO & Editorial Quality Center, existing article title/description/canonical/noindex fields and Pre-Publish Quality Gate.
- [ ] Align the exported publication metadata with Web's public source-of-truth contract and known locale/canonical routes; do not guess missing URL scheme or set reciprocal \`hreflang\` for translations not genuinely published.
- [ ] Make published projection eligibility failures explicit: duplicate/empty metadata, unsupported markup, missing rights/citation provenance, invalid canonical and language mapping.
- [ ] Separate Studio **preflight warnings** from truly rendered Web metadata: production HTML/canonical checks are cross-app integration tests, not currently available from isolated Studio.
- [ ] Never activate public indexing or edit production GSC.

## 6. M3 — Legacy import preparation (Studio's side)

- [ ] Design a reversible, deterministic **import mapping** from verified legacy article/title/author/media/DOI/taxonomy/slug to Studio editable records, marking source provenance and conflicts. Do not scrape the live PHP site, fabricate Search Console exports or import non-authorized content.
- [ ] Preserve legacy URL IDs/paths in preparation records for later Web redirect validation. Do not mass-change Studio slugs or overwrite existing records during prototype validation.
- [ ] Provide dry-run/conflict report and fixtures. Real migration/redirect approval remains separate.

## 7. M4 — Google service admin model (Studio's side)

- [ ] The Studio admin may represent GA4, AdSense and Search Console **configuration requirements** and clearly unconnected/live status; no fake connection or real account activation.
- [ ] Keep public IDs and sensitive server credentials separate; avoid browser-storage secrets. Future permissions and consent requirements must not be reduced to a dummy toggle that claims compliance.
- [ ] Studio may document AdSense eligibility, ads.txt ownership, article ad placement preferences and editorial quality flags, but the real script and account verification occur in Web/production integration.
- [ ] No Google Ads campaign-management implementation unless separately authorized.

## 8. M5 — Persistence and infrastructure boundary preparation

- [ ] Preserve the current IndexedDB + memory-fallback prototype and transparent offline save status. Do not secretly migrate it to an arbitrary new database or claim durable cross-device data from local IndexedDB.
- [ ] Define a clean storage/publishing port interface for future server-side article persistence, identity, version snapshots, media transfer and publish receipts. Favor a versioned, authenticated API plus immutable public snapshots, as previously approved at the architecture-direction level; actual DB/provider and ops ownership remain separately reviewed.
- [ ] Prepare env schema/runbook with placeholders, never commit secrets, access tokens or real user records. Design graceful data errors, stale revisions, backend outage, failed media upload and preview-only status.
- [ ] New server RBAC integration is **not** silently achieved by client controls.

## 9. M6 — Continuous verification and QA (not a final-only phase)

At each slice, add real tests and confirm existing functionality rather than relying on a screenshot or a green preview alone.

- [ ] Run the actual Studio \`bun run test:unit\`, \`bun run typecheck\`, \`bun run lint\`, \`bun run build\` and \`bun run test:e2e\` (with Chromium installed) where tool capabilities permit. Report each exact output and limitations. Never report historical Web's 85/85 as Studio tests.
- [ ] Contract adapter tests must cover \`v1.0.0\` payload, data loss rejection, draft and approved isolation, revision identity, linked citations, rights status, DOI, math, table, malformed HTML, unsupported nodes, locale, and slug conflicts.
- [ ] Preview tests: real article title H1, H2/H3 TOC, 700px reading width, Merriweather/Inter, figure caption/credit, long table and math, 320/390px overflow, keyboard/focus/mobile preview, semantic and visual comparison.
- [ ] Regression tests for Tiptap and CKEditor loading and source editing, save queue, restored revision snapshots, preview from draft, media and tags, role simulator transparency, SEO quality center and assistant drawer.
- [ ] Security test matrix: safe sanitized rich HTML, non-live previews, no cross-app credentials, no actual API requests to unconfigured endpoints, no private content leaked into public routes.
- [ ] Preserve existing workflow. If a build/test suite cannot run in AI Studio's environment, mark UNVERIFIED; Github CI after sync does not retrospectively prove all screenshot parity.

## 10. M7 — Studio integration-ready handoff, not live launch

- [ ] Prepare a deterministic and inspectable **Studio export fixture** for each supported public article type; test it against Web v1.0.0 reference contract to the extent possible offline.
- [ ] Update \`docs/google-ai-reports/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_EXECUTION_REPORT.md\` with exact code delta, commits/export SHA (only verified), capabilities, test commands and results, preview comparison evidence and blockers.
- [ ] Record what Codex/Antigravity must still implement after both Google AI Studio runs: live server auth/RBAC, persistent DB/storage, media transfer/right audit, publishing transport, scheduled job execution, rollback, cache invalidation, real URLs, cross-repo contract E2E, production deployment/consent, analytics/AdSense verification.
- [ ] No live publishing, DNS, Cloudflare, GSC or AdSense changes in this mission. Do not close M1–M7 full roadmap milestones as though Stage C production is live.

## 11. One-session execution order (many checkpoints, one broad Web-alignment mission)

1. Preflight current Studio code, source SHA, reference manifest integrity and baseline tests.
2. **Preview-first**: build scoped Web-compatible article preview; compare with source references; real tests and visual screenshots where possible.
3. Build versioned Studio→Web serializer/validator with no data loss; test all examples and rejection cases.
4. Improve Studio pre-publish/SEO/review and media-rights gates only where directly required by Web publication contract.
5. Implement safe Studio-side M3/M4/M5 integration-preparation modules with NO live-provider actions.
6. Execute full Studio tests; review security, accessibility and preview design regression.
7. Produce a complete report and truthful cross-app integration handoff. Confirm whether GitHub main was pushed by AI Studio's sync; only report URL/SHA and CI that can be verified.

**If a single run cannot complete everything, stop at a valid testable checkpoint with accurate uncompleted items. Never conceal unfinished work or claim the Studio is live production ready.**

## 12. Six-cycle iterative review before reporting

1. **Source & ownership:** no Web app overwrite, no Studio code lost; reference SHA accurate.
2. **Visual parity:** unchanged Web reading experience inside scoped Studio preview, no admin chrome CSS leaks.
3. **Scientific fidelity:** no lost rich HTML, math, figures, source IDs, metadata or Turkish Unicode.
4. **Security and rights:** no false publishing, public drafts, unsafe media, fake consent or missing licensing gates.
5. **Contract interoperability:** typed v1 projection, tested error cases, explicit cross-repo blockers.
6. **Delivery verification:** actual Studio suite and screenshots, reproducible report, GitHub sync evidence, stage-gated unfinished work.

**Required final response:** A table for Studio-owned M1–M7: implemented locally / verified / explicitly deferred to cross-app integration / evidence. Separate **preview visually matched** from **Web publishing connected**. Do not close the project milestones merely because a local demo passes.
