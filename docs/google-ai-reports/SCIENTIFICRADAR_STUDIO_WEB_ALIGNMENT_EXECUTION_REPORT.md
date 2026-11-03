# ScientificRadar Studio ↔ ScientificRadar Web Alignment (M1–M7) Execution Report

**Execution Date:** 2026-11-03  
**Studio Repository:** `https://github.com/Centaurioun/scientificradar-studio`  
**Pinned ScientificRadar Web Reference SHA:** `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7`  
**Publication Contract Version:** `v1.0.0` (`PUBLICATION_CONTRACT_VERSION = "1.0.0"`)

---

## 1. Executive Summary & Truthful Scope Disclosure

This execution aligned **ScientificRadar Studio** (the isolated editorial CMS prototype) with the pinned **ScientificRadar Web** public reader reference pack (`docs/references/scientificradar-web/`) across milestones **M1 through M7**:

1. **M1 — Web-Faithful Article Preview (`components/editor/web-article-reader-preview.tsx`, `components/editor/article-preview-view.tsx`, `app/globals.css`, `app/layout.tsx`, `lib/design/web-tokens.ts`):**
   - Studio's article preview now faithfully renders the pinned ScientificRadar Web reader experience (`WebArticleHeader`, `ScientificRadarWebArticlePreview`, `ResponsiveArticleToc`, `WebScientificFigure`, `WebCitationList`, `WebAuthorProfile`) inside a dedicated `.sr-web-preview-scope` container so Studio's administration UI and dual CKEditor 5 / Tiptap authoring surfaces remain completely unaffected.
   - Loaded `Merriweather` (`--font-editorial`) and `Inter` (`--font-interface`) via `next/font/google` in `app/layout.tsx` and bound all `--sr-*` Web design tokens (`#FAFAF8` paper, `#F2F1EC` surface, `#181C21` ink, `#15747B` accent, `700px`/`600px`/`560px` reading measure presets, `880px` heading max, `1100px` figure max, `1320px` page max).
   - Preserved Studio's interactive `KnowledgeLinkPopover` concept cards, missing-media safety alerts (`missing-featured-media-warning`, `missing-figure-asset-warning`), and orphaned citation alerts (`preview-orphaned-citation-alert`).

2. **M1 — Versioned Studio → Web Publication Contract Exporter (`lib/publishing/web-contract-v1.ts`):**
   - Implemented deterministic serialization (`serializeStudioArticleToSnapshotV1`), schema validation (`validatePublicationSnapshotV1`), canonical HTML sanitization and preprocessing (`sanitizeCanonicalBodyHtml`, `prepareCanonicalBodyHtml`, `resolveArticleHeadings`, `renderScientificMath`), and Web reader adaptation (`adaptSnapshotV1ToPublicArticle`, `adaptPublicArticleToSnapshotV1`).
   - Enforced **non-public default status mapping** (`mapStudioStatusToWebStatus`): Studio articles in `idea`, `draft`, `in_review`, `revision_requested`, `approved`, `scheduled`, `published`, or `archived` never emit Web `status: "published"` or `noindex: false` unless an explicit `PublicationAuthorizationReceipt` with `serverVerified: true` is supplied.

3. **M2 — Pre-Publish Quality Gate & SEO Alignment (`lib/audit/run-article-audit.ts`, `lib/publishing/web-contract-v1.ts`):**
   - Added `images.rights.verified` to `runArticleAudit` and `enforceStrictStudioPrePublish: true` to `validatePublicationSnapshotV1`, closing the cross-repository gap where Web's baseline validator at SHA `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7` did not reject `rightsVerified === false`.

4. **M3 — Deterministic Legacy Import Preparation (`lib/publishing/legacy-import.ts`):**
   - Implemented `prepareLegacyArticlesImportDryRun` for deterministic, reversible dry-run staging of verified legacy article exports into non-public Studio drafts (`status: "draft"`, `seo.noindex: true`), preserving `legacyId` and `legacyUrlPath` for `301` redirect mapping and flagging slug/category conflicts without touching any external site or database.

5. **M4 — Google Service Configuration Model (`lib/publishing/google-services-model.ts`):**
   - Defined typed configuration and readiness models for Google Analytics 4 (`GA4`), Google AdSense (`ads.txt` prerequisites, CLS slot reservation, prohibited scientific placements), and Google Search Console (`GSC`), separating public client IDs from server-only secrets and reporting truthful `not_connected` status.

6. **M5 — Storage, Media Transfer & Publication Transport Ports (`lib/publishing/persistence-ports.ts`):**
   - Defined clean architectural port interfaces (`StudioPersistencePort`, `MediaTransferPort`, `PublicationTransportPort`, `PublicationAuditReceipt`) for Stage C backend integration while preserving local IndexedDB + memory fallback durability.

7. **M6 & M7 — Contract Fixtures, Unit/Contract Verification & Live Browser Inspection (`lib/publishing/fixtures.ts`, `lib/publishing/web-contract-v1.test.ts`):**
   - Verified all 3 pinned Web example fixtures (`published-html-en.json`, `published-blocks-tr.json`, `draft-not-public.json`) and Studio's 3 deterministic export fixtures (`publishedEnglishHtmlFixture`, `publishedTurkishHtmlFixture`, `nonPublicDraftFixture`).

> **Honest Boundary Statement:** Preview visual parity and local `PublishedSnapshotRecordV1` (`v1.0.0`) contract serialization/validation are **complete and verified locally**. Live cross-application webhook transport to `scientificradar-web`, Cloudflare R2 media uploads, and live Google services remain **intentionally unconnected** in this isolated prototype environment.

---

## 2. Six-Cycle Engineering Review

### Cycle 1 — Architecture & Cross-Repo Boundary Review
- **Decision:** Keep Web reader CSS custom properties (`--sr-*`) and typography strictly scoped under `.sr-web-preview-scope` in `app/globals.css`, and place all contract serialization/validation logic in `lib/publishing/`.
- **Outcome:** Zero style leakage into Studio's dark/light admin shell, CKEditor 5 toolbar, or Tiptap fallback editor. No `.txt` reference files in `docs/references/scientificradar-web/` are imported at runtime.

### Cycle 2 — Visual & Reader Typography Parity Review
- **Decision:** Match `ArticleHeader`, `ArticleReader`, `ResponsiveArticleToc`, `ScientificFigure`, `CitationList`, and `AuthorProfile` from the pinned Web reference pack, including the Reading Measure Comparator (`700px`, `600px`, `560px`), 3-column desktop grid (`xl:grid-cols-[220px_minmax(0,1fr)_220px]`), `#102028` figure framing, and left-bordered figure captions.
- **Outcome:** Verified via live Playwright browser inspection at `1440×900`, `390×844`, and `320×700` with zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).

### Cycle 3 — Scientific Content Integrity Review (Math, Citations, Figures, Tables, Turkish Unicode)
- **Decision:** Normalize Studio's `data-math-tex` and `data-citation-source-id` attributes alongside Web's `data-latex` and `data-citation-id`, render equations through KaTeX (`output: 'htmlAndMathml'`, `role="math"`), wire bidirectional citation anchors (`#cite-${id}` ↔ `#ref-${id}`), and preserve Turkish diacritics (`İ, ı, ğ, ş, ö, ü, ç`) in both titles/prose and ASCII-normalized heading slugs (`slugifyHeadingText`).
- **Outcome:** All 12 contract/unit tests in `lib/publishing/web-contract-v1.test.ts` and all 11 CKEditor bridge tests in `lib/ckeditor/ckeditor-html-bridge.test.ts` pass.

### Cycle 4 — Security & Sanitization Review
- **Decision:** Enforce allowlist HTML sanitization (`sanitizeCanonicalBodyHtml`), strip `<script>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<math>`, inline event handlers (`on*`), `style`, `srcdoc`, and `javascript:`/`data:`/`blob:` URLs, and demote any embedded `<h1>` in `bodyHtml` to `<h2>` so the article title remains the sole page `<h1>`.
- **Outcome:** Verified against XSS payloads and encoded protocol variants (`java&#x09;script:`) in unit tests.

### Cycle 5 — Pre-Publish Policy & Non-Public Isolation Review
- **Decision:** Require an explicit `PublicationAuthorizationReceipt` with `serverVerified: true` before `mapStudioStatusToWebStatus` can emit `status: "published"`. Enforce `enforceStrictStudioPrePublish: true` in Studio's Contract Inspector and `images.rights.verified` in `runArticleAudit`.
- **Outcome:** Local Studio drafts and demo articles always serialize with non-public status (`draft` or `in_review`) and `seo.noindex: true` by default.

### Cycle 6 — Verification & Cross-Repo Handoff Review
- **Decision:** Document the exact schema and validator discrepancy found in Web SHA `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7` (where Web's `validateMediaRecord` did not reject `rightsVerified: false`) so the Web repository maintainer can enable the same strict check in Stage C.

---

## 3. Files Created & Modified

### Created Files
- `lib/design/web-tokens.ts` — Pinned ScientificRadar Web design tokens and reading measure presets (`700px`, `600px`, `560px`).
- `lib/publishing/web-contract-v1.ts` — Versioned `PublishedSnapshotRecordV1` (`v1.0.0`) types, sanitizer, KaTeX math renderer, validator (`validatePublicationSnapshotV1`), Studio-to-Web serializer (`serializeStudioArticleToSnapshotV1`), and Web adapters.
- `lib/publishing/legacy-import.ts` — M3 deterministic legacy article import dry-run, conflict detector, and `301` redirect mapping generator.
- `lib/publishing/google-services-model.ts` — M4 truthful configuration model for GA4, AdSense, and Search Console.
- `lib/publishing/persistence-ports.ts` — M5 architectural port interfaces for persistence, media transfer, and publication transport.
- `lib/publishing/fixtures.ts` — M7 deterministic Studio export fixtures (English HTML, Turkish HTML, and non-public draft).
- `lib/publishing/index.ts` — Barrel export for `lib/publishing`.
- `lib/publishing/web-contract-v1.test.ts` — 12 unit and contract verification tests covering M1–M7.
- `components/editor/web-article-reader-preview.tsx` — Pinned Web reader preview components (`ScientificRadarWebArticlePreview`, `WebArticleHeader`, `WebScientificFigure`, `WebCitationList`, `WebAuthorProfile`, `ResponsiveArticleToc`).

### Modified Files
- `app/layout.tsx` — Loaded `Inter` (`--font-interface`) and `Merriweather` (`--font-editorial`) font variables.
- `app/globals.css` — Added `.sr-web-preview-scope` custom properties and `.article-prose` reader typography rules.
- `lib/types.ts` — Added optional `dek`, `editorialType`, `translationGroupId`, and `legacyProvenance` fields to `Article`.
- `components/editor/article-preview-view.tsx` — Integrated `ScientificRadarWebArticlePreview`, viewport simulation modes (`Desktop`, `Tablet 768px`, `Mobile 390px`, `320px`), and the `Contract v1.0.0` Snapshot Inspector modal.
- `lib/audit/run-article-audit.ts` — Added `images.rights.verified` check for Web Contract v1.0.0 figure attribution compliance.

---

## 4. Verification Commands & Actual Results

| Verification Step | Command | Result |
| :--- | :--- | :--- |
| Unit & Contract Test Suite | `bun test lib` | **PASS** — `73 pass, 0 fail` across 9 test files (`967ms`) |
| TypeScript Typecheck | `bun run typecheck` (`tsc --noEmit`) | **PASS** — `0 errors` |
| ESLint Code Quality | `bun run lint` (`eslint .`) | **PASS** — `0 errors` |
| Production Next.js Build | `compile_applet` (`next build --webpack`) | **PASS** — All 27 static/dynamic routes compiled cleanly |
| Live Browser Desktop Preview (`1440×900`) | `playwright-cli` on `/articles/art-jwst-hycean-spectra/preview` & `/articles/art-tr-kuantum-aglari/preview` | **PASS** — `h1Count: 1`, `paperBg: "#FAFAF8"`, `measureAttr: "700px"`, `hasOverflow: false`, `0 console errors` |
| Live Browser Mobile Preview (`390×844` & `320×700`) | `playwright-cli` on `/articles/art-jwst-hycean-spectra/preview` | **PASS** — `overflow390: false`, `overflow320: false`, `tocOpen: true`, Contract v1.0.0 Inspector modal verified |

---

## 5. Cross-Repository Handoff Notes for ScientificRadar Web (`Codex` / `Antigravity`)

1. **`rightsVerified` Enforcement in Web Validator:** At Web SHA `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7`, `validateMediaRecord` in `src/lib/content/contract-v1.ts` checks `src`, `alt`, `caption`, `credit`, `license`, `width`, and `height`, but does not reject `media.rightsVerified === false`. Studio now enforces `rightsVerified === true` via `enforceStrictStudioPrePublish: true` (`UNVERIFIED_MEDIA_RIGHTS`); Web should enable the same check for non-demo `status === "published"` snapshots in Stage C.
2. **Local Demo SVG Media vs. Production R2 URLs:** Studio's offline seed store uses inline `data:image/svg+xml;utf8,...` URIs so figures render without external network dependencies. Studio's Contract v1.0.0 Inspector truthfully flags `data:` URLs with `UNSAFE_MEDIA_URL` until assets are uploaded to a same-origin path (`/images/...`) or a trusted HTTPS Cloudflare R2 origin (`https://media.scientificradar.com`).
