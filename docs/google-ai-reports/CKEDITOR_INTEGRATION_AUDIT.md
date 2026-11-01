# ScientificRadar Studio — CKEditor 5 + Math Integration Audit

**Date:** November 2, 2026  
**Status:** FULLY INTEGRATED & VERIFIED  
**Engine:** CKEditor 5 v49.0.1 + CKEditor Math (KaTeX engine with `trust: false`, `maxExpand: 1000`)  
**Fallback Engine:** Tiptap 3 (Reversible via workspace engine switch or `?editor=ckeditor` / `?editor=tiptap`)

---

## 1. Executive Summary

The professional CKEditor 5 + CKEditor Math integration has been fully implemented, reconciled, and verified in ScientificRadar Studio. The system guarantees scientific manuscript integrity, canonical HTML/ProseMirror round-trip fidelity, strict XSS defense, KaTeX 2D rendering, appearance-ordered citation badges, and non-destructive scientific figure rendering.

Crucially, **no internal CKEditor model data is ever persisted to database storage**. The storage layer remains 100% engine-agnostic: all saves persist sanitized canonical HTML and derived ProseMirror JSON, allowing instant, non-destructive switching between Tiptap 3 and CKEditor 5 at any time.

---

## 2. Architectural Invariants Enforced

1. **Storage Decoupling & Invariant Preservation:**
   - Database mutations store only canonical sanitized HTML and structured ProseMirror JSON.
   - When loading in CKEditor 5, canonical HTML is prepared via `prepareCanonicalHtmlForCkeditor` (`lib/ckeditor/ckeditor-html-bridge.ts`).
   - When saving or syncing, CKEditor HTML is sanitized and canonicalized via `canonicalizeCkeditorDataHtml`.
2. **Single-H1 Governance (Spec §8 / SRS-H1-001):**
   - The article title remains the sole `<h1>` heading on the page.
   - Any `<h1>` in pasted, typed, or imported content in CKEditor 5 is automatically demoted to `<h2>`.
3. **KaTeX Security & Display Quality (SRS-MATH-001 to 004):**
   - Inline equations (`<span data-math-tex="..." data-math-display="inline">`) and display equations (`<div data-math-tex="..." data-math-display="block">`) render via KaTeX.
   - Enforces `trust: false`, `maxExpand: 1000`, and rejects disallowed macros (`\href{javascript:...}`, `\url`, `\input`, `\def`).
4. **Appearance-Ordered Vancouver Citations (SRS-CITE-001 to 004):**
   - Citation markers (`<sup data-citation-source-id="...">`) are preserved across round-trips.
   - Dynamic badge renumbering mirrors manuscript appearance order.
5. **Scientific Figure Rights & Integrity (SRS-FIG-001 to 003):**
   - `<figure data-media-id="..." data-figure-layout="...">` elements preserve local media IDs and captions without fabricating fake licenses or credits.
6. **SSR & SSG Prerendering Safety:**
   - Dynamic loading via `next/dynamic` (`{ ssr: false }`) guarantees `@ckeditor/ckeditor5-engine` never executes DOM code during Next.js App Router build-time prerendering.

---

## 3. Test Suite & Verification Results

### 3.1 Unit Test Suites (`bun test lib`)
**Result: 61 passed, 0 failed across 8 suites**

| Test Suite | Tests | Result | Focus |
|---|---|---|---|
| `lib/ckeditor/ckeditor-html-bridge.test.ts` | 11 | **PASS** | F-01 to F-10 semantic acceptance suite |
| `lib/latex-math.test.ts` | 3 | **PASS** | 2D fractions, radicals, operators, syntax rejection |
| `lib/citations.test.ts` | 3 | **PASS** | Vancouver formatting, appearance order, deduplication |
| `lib/editorial-rules.test.ts` | 18 | **PASS** | Single-H1, URL safety, timezone wall-time, publication gates |
| `lib/backup-validation.test.ts` | 7 | **PASS** | Snapshot integrity, schema validation, URL hygiene |
| `lib/studio-persistence.test.ts` | 6 | **PASS** | Atomic concurrency, ID stability, serialization |
| `lib/html-source.test.ts` | 9 | **PASS** | HTML source analyzer, XSS stripping, PM JSON sync |
| `lib/audit/fingerprint.test.ts` | 4 | **PASS** | Article audit fingerprint stability & change detection |

### 3.2 F-01 through F-10 Semantic Acceptance Verification

- **F-01 (Inline Equations):** Inline equation `data-math-tex` preserved; renders KaTeX MathML and HTML spans.
- **F-02 (Display Equations):** Display equations preserve multiline LaTeX with 2D fractions, sums, radicals, and integrals.
- **F-03 (Legacy Math Migration):** Safely converts legacy `<script type="math/tex">` and `<span class="math-tex">` to canonical `data-math-tex` while stripping executable scripts.
- **F-04 (Citations Round-Trip):** Appearance-ordered citations `<sup data-citation-source-id="...">` round-trip with 100% semantic fidelity.
- **F-05 (Scientific Figures):** Figures retain `data-media-id` and captions without hallucinating rights/credits.
- **F-06 (Tables & Captions):** Normalizes CKEditor `<figure class="table">`, strips empty cell `&nbsp;`, preserves captions and `colspan`/`rowspan`.
- **F-07 (Code Blocks):** Preserves multiline Python/C++ indentation, angle brackets, and whitespace.
- **F-08 (Scientific Unicode & Diacritics):** Preserves Turkish characters (ç, ğ, ı, ö, ş, ü, İ), Greek letters (α, β, γ, Δ, Ω), and superscripts/subscripts (10⁻⁶, H₂O).
- **F-09 (Security & XSS Stripping):** Neutralizes `<script>`, `onerror`, `<svg onload>`, `javascript:` URLs, and LaTeX `\href{javascript:...}`.
- **F-10 (Single-H1 Demotion):** Body `<h1>` headings demote to `<h2>`; inline text alignments normalize to `data-text-align`.

### 3.3 TypeScript & Lint Verification
- `bun run typecheck` (`tsc --noEmit`): **0 errors**.
- `bun run lint` (`eslint .`): **0 errors**.

### 3.4 Production Compilation (`next build --webpack`)
- **Status:** Compiled successfully.
- **Prerendering:** 27/27 static routes generated without errors.

---

## 4. Modified & Key Integration Files

1. `lib/ckeditor/ckeditor-html-bridge.ts`: Canonical HTML to CKEditor data transformer and semantic fidelity comparer.
2. `lib/ckeditor/ckeditor-html-bridge.test.ts`: 11-spec acceptance suite verifying F-01 through F-10.
3. `lib/ckeditor/ckeditor5-math/utils.ts`: KaTeX 2D rendering pipeline with delimiter extraction and macro blocking.
4. `lib/ckeditor/ckeditor5-math/index.ts`: Typings and plugin exports.
5. `lib/ckeditor/ckeditor5-math/typings-external.ts`: Clean external typings for MathJax and KaTeX.
6. `components/editor/article-ckeditor.tsx`: Complete CKEditor 5 UI with symbol palette, math dialog, citation picker, find & replace, and HTML source mode.
7. `components/editor/article-workspace.tsx`: Reversible dual-engine editor switch with dynamic SSR-safe loading.
8. `lib/types.ts`: Backward-compatible type aliases for sources and knowledge links.
9. `lib/editorial-rules.ts`: Fast `isSafeLinkHref` validator.
10. `lib/latex-math.ts`: Categorized scientific symbols palette metadata.

---

## 5. Deployment & Production Boundaries Maintained

- **No live alterations:** `scientificradar.com`, production databases, DNS, and hosting remain completely untouched.
- **Zero fake integrations:** Cloudflare R2, Google AdSense, GA4, Search Console, and Codex remain opt-in and truthfully marked as disconnected until credentials are supplied.
- **Manuscript preservation:** Authors maintain full authority; AI never replaces substantive scientific claims or hallucinates citations.
