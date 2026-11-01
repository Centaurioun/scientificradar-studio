# ScientificRadar Studio — Google AI Studio CKEditor 5 + Math Integration Mission

**Date:** 2026-11-02 (Europe/Istanbul)
**Repository:** Centaurioun/scientificradar-studio, imported by the owner from GitHub main.
**Mission:** Integrate a professional CKEditor 5 49.0.1 + the owner's CKEditor Math scientific editor safely and reversibly. This is the NEXT mission, not an instruction to automatically activate CKEditor merely because this document exists.
**Runtime status at authoring:** Tiptap remains the active editor; both CKEditor forks are staged as **inactive source references**, not application dependencies.

> ## START — READ AND IMPLEMENT LOCAL SOURCES
>
> Read this ENTIRE file and the slim source manifest. Inspect the **curated** CKEditor 5 API sources and the Math fork's preserved full src/theme/typings tree, plus the upstream pinned GitHub sources if any omitted module is needed. Inspect ScientificRadar's existing scientific data model, editor, persistence, test suite and latest exact Git HEAD. Implement the best maintainable CKEditor 5 + Math editor experience *inside the existing app*, with a reversible Tiptap fallback, real scientific data preservation tests and honest evidence. Do not merely write a plan. Do not delete prior articles, revisions or Tiptap, and do not connect production. Report the real result to docs/google-ai-reports/CKEDITOR_INTEGRATION_AUDIT.md.

## Import-size mitigation notice (2026-11-02)

Google AI Studio failed to import the previous multi-thousand-file source snapshot. To reduce importer load, the ScientificRadar `vendor-staging/` copies were reduced from **7,859 files to 51 vendor files (743,479 bytes)**. **Do not rebuild or copy the full CKEditor monorepo into ScientificRadar, and do not ask AI Studio to pull either upstream repo wholesale.** The complete repositories are still available on GitHub at the pinned commits in `vendor-staging/SOURCE_MANIFEST.md`. The local Math `src/`, `theme/` and `typings/` remain complete; the local core directory is deliberately a curated API reference. If import still fails, report the exact error rather than restoring the removed source bloat.

## 1. Mandatory read order

1. vendor-staging/SOURCE_MANIFEST.md — immutable provenance, snapshot scope, licences, isolation.
2. vendor-staging/ckeditor5/ — **31 curated, original CKEditor 5 49.0.1 API source-reference files**, including the entry point, selected engine, UI, table, HTML support, widget, clipboard and source-editing internals, plus GPL/licence notices. This is NOT the complete 60-package monorepo and is NOT an installed/bundled dependency. For omitted modules consult https://github.com/Centaurioun/ckeditor5/tree/fc80e6091c1df4753fbbc82888bafdc6a4871f62.
3. vendor-staging/ckeditor5-math/ — **20-file compact Math fork snapshot**, preserving all actual src/, theme/, typings/, package metadata, LICENSE and UPGRADE_49.md. The old and modern Math tests, sample, screenshots and workflow files are only in the original fork at https://github.com/Centaurioun/ckeditor5-math/tree/6d8a39a181d1a0b233b8676eb47847c9b506ef53; do NOT assume they exist in the local staging. It is not a separately npm-published package.
4. docs/SCIENTIFICRADAR_STUDIO_CHATGPT_HANDOFF_2026-11-01.md and docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md.
5. docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md and docs/GOOGLE_AI_STUDIO_FINAL_COMPLETION_MISSION_2026-11-01.md.
6. docs/google-ai-reports/COMPLETION_AUDIT.md for the baseline accepted pre-CKEditor behaviours.
7. Actual source: components/editor/article-tiptap-editor.tsx, components/editor/article-workspace.tsx, lib/html-source.ts, lib/html-security.ts, lib/citations.ts, lib/studio-context.tsx, lib/editor-extensions.ts, lib/latex-math.ts, lib/audit/run-article-audit.ts and tests/e2e/scientific-editor.spec.ts.

Historical pre-CKEditor baseline: Next.js 16.4.3, React 19.3.1, TypeScript 6.0.3, Webpack, **50/50 unit** and **35/35 Chromium E2E** on a GitHub PR check. Recheck the actual SHA/CI after importing. Do not assume that 49 upstream Math browser tests prove ScientificRadar integration.

## 2. Inviolable constraints

- Preserve the existing **Tiptap 3 editor** as an operational fallback. Provide a feature-gated or explicitly selectable CKEditor pilot. Do not remove Tiptap or destructively rewrite any stored article/revision/backup until owner approval after comprehensive acceptance.
- Do not rewrite the admin panel, introduce a CRM or change the restrained teal/neutral UX and navigation. No production deploy, scientificradar.com DNS, Cloudflare, Google services, external AI provider, auth credentials or public scientific manuscripts.
- Preserve all licence notices. CKEditor 5 core uses GPL/commercial terms while Math uses ISC; do not pretend the Math licence removes core obligations, adopt paid features without authorization or bypass licence gates. Document obligations/blocks faithfully for the owner's initially private editor use.
- Core and Math must use compatible **49.0.1** APIs; avoid CKEditor 43 deep imports and incompatible versions. Build/integrate the actual compact Math fork source safely. The **31-file curated core API reference is not buildable as a standalone editor**; use a maintainable, appropriately licensed `ckeditor5@49.0.1` runtime dependency and exact Bun lockfile, or explicitly document a viable equivalent. Do not treat reference snapshots as automatically installed modules.
- Human researchers author the science. Never fabricate citations, DOI validation, statistical data, credits or image rights. AI suggestions are opt-in, reviewable, reversible.

## 3. Editor state and scientific content migration safety

### Canonical representation and rollback

- Before coding, trace article.body (legacy Tiptap/ProseMirror JSON), article.bodyHtml (sanitized HTML), latestBodyRef, revisions, IndexedDB commit receipts, sourceId, mediaId, raw TeX and audit fingerprints.
- CKEditor has a different document model. **NEVER** save CKEditor's model as Tiptap JSON. Use existing synchronization/conversion helpers to derive a semantically aligned legacy body JSON from sanitized CKEditor HTML, or a new tested compatibility adapter. Detect unsupported scientific elements and block destructive saves rather than silently discarding information.
- On read, preserve historical articles whose HTML and JSON previously disagreed; use documented per-document authority and keep original revisions/backups. Selecting another editor must not change any article.
- Keep real IndexedDB transaction-done receipts for successful saves, draft dirty-state, concurrent tab/revision conflicts, stale Quick Fix prevention and truthful Saved (Local) indicators.
- Use Next.js client-only mounting and correct editor destruction. Avoid duplicate plugin registrations, SSR hydration errors, abandoned event listeners or focus/selection losses.

### Functional professional CKEditor experience

- Polished readable toolbar, grouping, shortcuts and keyboard accessibility, reliable contextual controls, light/dark and 390px viewport. Preserve existing main editor layout and all non-editor workflows.
- Title-only H1; body supports paragraph, H2 and H3. Demote pasted H1 with user notice; preserve body outline.
- Tables: genuinely empty 3x3 with visible borders, persistent focused row/column controls, headers, insert/delete, merge/split, caption, Tab navigation, undo/redo, numeric notation, no mobile page-wide overflow.
- Math: integrate owner's CKEditor Math plugin with **real KaTeX**, inline/display math, exact raw LaTeX, edit-existing/cancel, undo/redo, fraction/sum/root/scripts/Greek and safe malformed macro fallback. Legacy math script input must be importable without treating raw script output as trusted/public HTML. Do not simply rename the existing hand-made LaTeX renderer as KaTeX.
- Citations: stable sourceId attributes, repeated references, first-appearance numbering, orphan warnings, Vancouver bibliography and unchanged provenance; never downgrade citations to anonymous superscript text.
- Figures: stable mediaId, alt/caption/credit/licence/rights/crop/layout, uploaded raster validation and Unverified rights display; do not fabricate image rights.
- Body-only HTML Source editing with sanitization, Apply/Discard, conflict guard and explicit warnings for unsupported nodes; preserve current richer source mode if the CKEditor built-in source mode would lose custom scientific attributes.
- Bold/italic/underline, superscript/subscript, links, lists, blockquotes, alignment, scientific symbols, code block indentation, undo/redo and find/replace functionality already supported by ScientificRadar.
- Domain gate: SEO fingerprints, tags max six as editorial policy (not Google rule), roles/review/scheduling, AI Quick Fix diff/apply/undo and no live-publish pretence remain unchanged.

## 4. Mandatory scientific semantic acceptance fixtures

Test semantic fidelity, **not merely visually plausible markup or HTML byte equality**:

1. Existing Tiptap manuscript -> CKEditor view -> non-destructive edit -> durable IndexedDB save -> reload -> Tiptap fallback -> CKEditor again; compare scientific attributes.
2. CKEditor HTML -> sanitized canonical HTML -> ProseMirror JSON compatibility -> revision save/restore -> export/import -> reload. Detect and clearly report losses.
3. Two references with stable source IDs, repeated citations, reordering, orphan warnings and Vancouver bibliography.
4. Inline and block equations: raw fraction, sum, Greek, radical and malformed TeX; edit/cancel, safe macros and expected KaTeX DOM.
5. Empty 3x3 grid, scientific notation 10⁻⁶ and p = 0.003, row/column/header/merge/split, semantic caption and reload.
6. Figure with media ID, missing rights, alt/caption/credit and recorded licence; upload validation; legacy image metadata.
7. Turkish/Greek Unicode, H1 paste demotion, Word/Docs pasted HTML, multiline code with significant whitespace, safe list and link conversions.
8. Long article, 390x844 / 1024x768 / 1440x900 and both themes, toolbar keyboard focus, screen reader labels.
9. Concurrent IndexedDB tabs, aborted transactions, stale Quick Fix, article revisions, import/export and source edit conflict resolution.
10. XSS canaries for event attributes, scripts, SVG/MathML injection and javascript: URLs across editor, source, preview and backups; no active content.

When a critical custom node cannot be preserved, keep the Tiptap path functioning, show a non-destructive warning, and classify that feature as PARTIAL/BLOCKED. Do not remove the test or weaken assertions to claim a migration passed.

## 5. One comprehensive run; six internal quality passes

1. **Discovery/brainstorming:** read actual source and two forks, establish build plan, licence constraints and current baseline.
2. **Data-risk plan:** map custom nodes/attributes and determine safe CKEditor->HTML->ProseMirror compatibility.
3. **Implementation:** build editor UI and Math bridge, controlled activation, rollback and reuse of existing persistence/services.
4. **Regression verification:** real unit, TypeScript, ESLint, production build, local Playwright and new CKEditor Math E2E with scientific fixtures.
5. **Adversarial refinement:** malformed TeX, unknown content, conversion drops, unsupported paste, XSS, IDB abort/multi-tab, long document, mobile and keyboard.
6. **Final cross-check:** exact imported/final code states, changed files, external licence issues, actual tests and residual blockers. Classify VERIFIED / IMPLEMENTED-NOT-E2E-VERIFIED / PARTIAL / BLOCKED / DEFERRED.

Run all the current actual project scripts after inspecting package.json, normally: bun install --frozen-lockfile, bun run test:unit, bun run typecheck, bun run lint, bun run build, bun run test:e2e:install, bun run test:e2e. Keep all 50 old unit and 35 old E2E assertions active, with additional real CKEditor-specific tests. Separate Google AI Studio sandbox tests from hosted GitHub push-to-main CI checks.

## 6. Required output

1. Working and reversible **CKEditor 5 + Math pilot** in the existing ScientificRadar codebase, preserving Tiptap and all original science data.
2. An honest implementation/evidence report at **docs/google-ai-reports/CKEDITOR_INTEGRATION_AUDIT.md**, including exact source SHA, dependency versions, licence restrictions, changed files, fixture results, test counts/exits, unresolved semantic gaps and rollback.
3. Keep both staged source directories and SOURCE_MANIFEST.md unchanged as pinned reference sources. Do not publish either source tree into the Next.js runtime bundle, delete source provenance or access external production.
4. Synchronize implemented changes via the owner's existing Google AI Studio -> GitHub main workflow when instructed. Do not invent a Git SHA or a CI success not actually observed.
5. If safe complete editor migration is technically impossible at this stage, deliver the strongest working reversible parallel CKEditor pilot and an explicit blocker list, not a destructive replacement.

**Final instruction:** Read the compact CKEditor 49 API reference and complete locally preserved Math src/theme/typings implementation; refer to the pinned original upstream repositories for omitted CKEditor modules and Math tests. Implement a professional CKEditor 5 + Math integration with semantic proof and reversibility, preserve all existing scientific CMS capabilities, test the result comprehensively, and document verified outcomes in CKEDITOR_INTEGRATION_AUDIT.md. Do not connect production.
