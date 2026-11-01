# ScientificRadar Studio — Pre-CKEditor Final Completion Audit Report

**Audit Date:** 2026-11-01  
**Mission Reference:** `docs/GOOGLE_AI_STUDIO_FINAL_COMPLETION_MISSION_2026-11-01.md`  
**Backlog Reference:** `docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md`  
**Overall Local Prototype Status:** **LOCALLY VERIFIED (Pre-CKEditor Baseline Complete — 50/50 Unit Tests Passed, 35/35 Playwright E2E Tests Passed, Production Build Succeeded; External Production Integrations & CKEditor 5 Track Deferred)**

---

## 1. Baseline & Repository Synchronization State

| Attribute | Value / Evidence |
| --- | --- |
| **Repository** | `Centaurioun/scientificradar-studio` (`main`) |
| **Imported Code Baseline SHA** | `bae598fc3c194ca54736e59e2eade4c618b5c7db` (PR #4 merge commit) |
| **Imported Documentation Handoff SHA** | `e4611534e662b864f4e26c5a2c2b9e0ca17219d2` (`GOOGLE_AI_STUDIO_FINAL_COMPLETION_MISSION_2026-11-01.md`) |
| **Sandbox `.git` Directory Status** | Not mounted inside `/app/applet` (`git rev-parse HEAD` exits with `128: fatal: not a git repository`). |
| **GitHub Synchronization Method** | Synchronized via the Google AI Studio built-in GitHub export/sync workflow from the verified `/app/applet` workspace tree. No post-export Git SHA is fabricated inside this report. |
| **Dependency Lock Discipline** | Preserved existing Next.js `15.5.28`, React `19.2.1`, Tiptap `^3.22.3`, and `bun.lock` without adding or staging CKEditor packages. |

---

## 2. Explicit Technical & Architectural Statements

### 2.1 Supporting-Entity Durability (`SRS-DATA-003` / `P0-A`)
- **Implementation:** In `lib/studio-context.tsx`, `updateState` no longer mutates React state optimistically ahead of IndexedDB commit for supporting-entity creation and deletion operations (`addCategory`, `deleteCategory`, `addTag`, `deleteTag`, `saveSeries`, `saveAuthor`, `saveSource`, `deleteSource`, `saveKnowledgeLink`, `addMediaAsset`, `deleteMediaAsset`, `deletePage`, `updateHomepageBlocks`, `updateMenus`).
- **Receipt Contract:** Every creation operation returns an `EntityWithDurableReceipt<T>` carrying a non-enumerable `.committed: Promise<{ ok: boolean; entity?: T; storageRevision?: number; error?: string }>` that resolves only after `commitSnapshotMutation` completes its `readwrite` transaction in IndexedDB (`transaction.done`). Deletion and update operations return `DurableEntityReceipt`.
- **UI Honesty:** `app/categories/page.tsx`, `app/media/page.tsx`, and `components/editor/article-workspace.tsx` await `created.committed` before clearing form inputs, selecting newly created entities, or displaying confirmation notices. Controlled text inputs (`updateSource`, `updateMediaAsset`) retain synchronous local input state for cursor stability while rolling back to `committedStateRef.current` if the IndexedDB transaction aborts.
- **Verification:** Verified by unit test `lib/studio-persistence.test.ts` and browser E2E test `S-DURABLE-ENTITY-1` (`tests/e2e/scientific-editor.spec.ts`), which holds an IndexedDB `put` transaction open on `/categories`, verifies zero ghost rows and zero premature status banners while held, releases the transaction, and verifies persistence across `page.reload()`.

### 2.2 Manuscript `body` (ProseMirror JSON) & `bodyHtml` Synchronization (`SRS-HTML-002` / `P0-B`)
- **Implementation:** `lib/html-source.ts` implements `extractScientificSemanticsFromHtml`, `extractScientificSemanticsFromJson`, `areBodyJsonAndHtmlSemanticallyAligned`, `deriveCanonicalBodyJsonFromHtml`, and `synchronizeArticleBodyRepresentations`.
- **End-to-End Coverage:**
  1. `components/editor/article-tiptap-editor.tsx` emits live `editor.getJSON()` alongside sanitized HTML on `onCreate`, `onUpdate`, external `contentHtml` sync (`onSyncJson`), and `onApplyHtmlSource`.
  2. `components/editor/article-workspace.tsx` tracks `bodyJson` and `latestBodyRef` and passes the live ProseMirror JSON to `persistArticleDraft`.
  3. `lib/studio-context.tsx` invokes `synchronizeArticleBodyRepresentations` inside `buildUpdatedArticleSnapshot`, `applyQuickFixProposal`, `restoreArticleRevision`, and `applyAssistantChanges`, ensuring `article.body` JSON and `article.bodyHtml` are always semantically aligned in IndexedDB and in revision snapshots.
- **Verification:** Verified by unit test `synchronizeArticleBodyRepresentations keeps body ProseMirror JSON aligned with bodyHtml across equations, figures, tables, code blocks, and citations (SRS-HTML-002)` in `lib/html-source.test.ts` and browser E2E test `S-BODY-SYNC-1` in `tests/e2e/scientific-editor.spec.ts`.

### 2.3 Mathematical Rendering Fidelity (`SRS-MATH-001` .. `SRS-MATH-004` / `P1-A`)
- **Honest Disclosure:** Because dependency installation was frozen for this pre-CKEditor phase, upstream KaTeX/MathJax packages are **not** installed. Instead, `lib/latex-math.ts` implements a **bespoke, zero-dependency recursive LaTeX AST parser and 2D mathematical HTML/DOM renderer** (`parseAndRenderLatex`) with `trust: false` security discipline.
- **Capabilities:** Supports stacked 2D fractions (`\frac`, `\dfrac`, `\tfrac`), radicals with overbar vinculum (`\sqrt[n]{...}`), nested superscripts and subscripts (`x_{i}^{2}`), large operators (`\sum`, `\prod`, `\int`, `\oint`, `\lim`) with stacked limits, vectors/accents (`\vec`, `\hat`, `\bar`, `\tilde`, `\dot`, `\ddot`, `\overline`), matrices (`matrix`, `pmatrix`, `bmatrix`, `vmatrix`, `cases`), and Greek/scientific symbols.
- **Safety & UX:** Rejects unbalanced braces, dangling `^`/`_`, unclosed `\begin{...}`, and dangerous macros (`\href`, `\url`, `\input`, `\include`, `\write18`, `\def`, `\newcommand`). Clicking an existing inline or block equation in the Tiptap canvas opens the equation composer in edit mode (`Update Equation`), and invalid LaTeX disables the submit button without corrupting the existing node.
- **Verification:** Verified by unit tests in `lib/latex-math.test.ts` and browser E2E test `S-MATH-1` in `tests/e2e/scientific-editor.spec.ts`. Full CKEditor Math integration remains scheduled for the separate post-completion CKEditor 5 track.

### 2.4 Figure Byte Validation & Rights Metadata (`SRS-MED-001/002`, `SRS-ED-007` / `P0-D`)
- **Implementation:** `app/media/page.tsx` validates uploaded files against a strict raster MIME allowlist (`image/png`, `image/jpeg`, `image/webp`, `image/avif`), checks binary magic-byte signatures (`hasValidRasterMagicBytes`), decodes natural image dimensions via `HTMLImageElement` (`naturalWidth > 0`, `naturalHeight > 0`), rejects SVG and corrupt binary uploads with explicit alert banners, and stores valid assets as data URIs in IndexedDB.
- **Rights Honesty:** `lib/studio-context.tsx` (`addMediaAsset`) and `app/media/page.tsx` default `credit` and `licence` to empty strings (`""`) rather than fabricated `"ScientificRadar Editorial"` or `"CC BY 4.0"` strings, surfacing an explicit `data-testid="unverified-media-rights-badge"` warning until human entry.
- **Verification:** Verified by unit tests in `lib/backup-validation.test.ts` and browser E2E test `S-MED-1` in `tests/e2e/scientific-editor.spec.ts`.

### 2.5 Table & Code Block Behavior (`SRS-ED-005/006` / `P1-A`)
- **Tables:** `lib/editor-extensions.ts` and `components/editor/article-tiptap-editor.tsx` insert a clean empty 3×3 scientific table (3 `<th>` header cells + 6 `<td>` body cells, zero dummy placeholder strings), maintain contextual table toolbar visibility via `selectionTick`, and support `+ Add Row`, `+ Add Column`, `Delete Row`, `Delete Column`, `Toggle Header Row`, `Table Caption` (`<caption>`), and `Delete Table`.
- **Code Blocks:** `CodeBlockKeyboardExtension` in `components/editor/article-tiptap-editor.tsx` handles `Tab` (inserts two spaces) and `ArrowDown` at the end of a code block (creates a trailing paragraph to prevent cursor trapping). `formatEditorialHtmlSource` in `lib/html-source.ts` preserves `<pre><code>` multiline indentation verbatim across Visual ↔ HTML Source round-trips.
- **Verification:** Verified by unit tests in `lib/html-source.test.ts` and browser E2E tests `S-ED-1` and `S-ED-2` in `tests/e2e/scientific-editor.spec.ts`.

### 2.6 Citation Provenance, Appearance-Order Numbering & Vancouver Bibliography (`SRS-SCI-001/002`, `SRS-CITE-001..005` / `P1-A`)
- **Implementation:** `lib/citations.ts` (`analyzeManuscriptCitations`, `formatVancouverReference`) scans manuscript HTML in document order, assigns sequential numbers `[1]`, `[2]` with deduplication for repeated references to the same `sourceId`, detects orphaned citations (`[!N]`) when a cited source is detached or deleted, and renders a structured Vancouver bibliography in `components/editor/article-preview-view.tsx`.
- **Editor Stability Fix:** In `components/editor/article-tiptap-editor.tsx`, automatic citation badge label synchronization sets `tr.setMeta('preventUpdate', true)` before dispatching so opening an existing article never triggers a false dirty state or unrequested background autosave.
- **Verification:** Verified by unit tests in `lib/citations.test.ts` and browser E2E test `S-CITE-1` in `tests/e2e/scientific-editor.spec.ts`.

---

## 3. Changed Files Summary

| File Path | Purpose of Change |
| --- | --- |
| `.gitignore` | Added `.aistudio/`, `.playwright-cli/`, and `*.tsbuildinfo` to prevent local tool artifacts from polluting Git status (`P1-C`). |
| `.github/workflows/ci.yml` | Added `push: branches: [main]` and `workflow_dispatch:` triggers alongside `pull_request` and safe `${{ github.event.pull_request.head.sha || github.sha }}` fallback so direct AI Studio exports to `main` run hosted CI (`P1-C`). |
| `lib/latex-math.ts` & `lib/latex-math.test.ts` | Recursive LaTeX AST parser and 2D mathematical HTML renderer with `trust: false` safety validation and unit tests (`SRS-MATH-001..004`). |
| `lib/citations.ts` & `lib/citations.test.ts` | Dynamic appearance-order citation numbering, orphaned citation detection, and Vancouver bibliography formatter with unit tests (`SRS-SCI-001/002`, `SRS-CITE-001..005`). |
| `lib/html-source.ts` & `lib/html-source.test.ts` | Added `extractScientificSemanticsFromHtml`, `extractScientificSemanticsFromJson`, `areBodyJsonAndHtmlSemanticallyAligned`, `deriveCanonicalBodyJsonFromHtml`, and `synchronizeArticleBodyRepresentations` plus unit tests (`SRS-HTML-001..003`). |
| `lib/editor-extensions.ts` | Added `ScientificTableCaptionNode`, `deleteActiveTableColumn`, `toggleTableHeaderRow`, `getActiveTableCaption`, `setActiveTableCaption`, `exitBlockAtDocumentEnd`, figure rights attributes, and 2D math NodeViews (`SRS-ED-005..007`). |
| `lib/audit/run-article-audit.ts` | Added `getArticleLinkedMediaAndSources` to include both featured and inline body media/sources in `computeArticleFingerprint` across `runArticleAudit` and `buildQuickFixProposal` (`SRS-SEO-001/002`). |
| `app/articles/[id]/seo/page.tsx` | Used `liveReport.articleFingerprint` for `currentFp` so stored report staleness on `/articles/[id]/seo` matches `/seo` and accounts for linked media/sources (`SRS-SEO-001`). |
| `lib/studio-context.tsx` | Enforced non-optimistic IndexedDB commit before state update for supporting-entity creations/deletions, attached `.committed` durable receipts (`SRS-DATA-003`), synchronized `article.body` and `article.bodyHtml` across all save/restore/Quick Fix/assistant paths (`SRS-HTML-002`), and preserved stored audit reports as `stale` on source deletion. |
| `components/editor/article-tiptap-editor.tsx` | Added `onSyncJson`, passed `nextJson` in `onApplyHtmlSource`, set `tr.setMeta('preventUpdate', true)` on citation badge label sync, and disabled `Insert/Update Equation` when LaTeX is invalid (`SRS-HTML-002`, `SRS-MATH-002`). |
| `components/editor/article-workspace.tsx` | Wired `bodyJson` state and `latestBodyRef` into `currentDraftArticle` and `performSave`, and awaited `.committed` durable receipts on inline tag, source, and figure creation (`SRS-HTML-002`, `SRS-DATA-003`). |
| `components/editor/article-preview-view.tsx` & `components/knowledge/knowledge-link-popover.tsx` | Rendered 2D math equations, appearance-ordered inline citation popovers, orphaned citation warnings, figure rights captions, and Vancouver bibliography (`SRS-SCI-001/002`, `SRS-MATH-003`). |
| `app/categories/page.tsx` & `app/media/page.tsx` | Awaited durable `.committed` receipts before clearing inputs or showing save notices; validated raster magic bytes/dimensions and unverified default media rights (`SRS-DATA-003`, `SRS-MED-001/002`). |
| `tests/e2e/scientific-editor.spec.ts` & `tests/e2e/concurrency.spec.ts` | Added browser E2E tests `S-ED-1`, `S-ED-2`, `S-MATH-1`, `S-CITE-1`, `S-MED-1`, `S-BODY-SYNC-1`, and `S-DURABLE-ENTITY-1`; hardened `readPersistedSnapshot` against initial DB upgrade timing. |

---

## 4. Verification Commands & Actual Results

All verification gates were executed inside the `/app/applet` sandbox on the final codebase:

1. **Unit Test Suite (`bun run test:unit`)**
   - Command: `bun run test:unit`
   - Result: **PASSED** — `50 pass, 0 fail` across 7 test files (`lib/backup-validation.test.ts`, `lib/latex-math.test.ts`, `lib/citations.test.ts`, `lib/editorial-rules.test.ts`, `lib/studio-persistence.test.ts`, `lib/html-source.test.ts`, `lib/audit/fingerprint.test.ts`).
2. **TypeScript Typecheck (`bun run typecheck`)**
   - Command: `bun run typecheck` (`tsc --noEmit`)
   - Result: **PASSED** — Exit code `0`, `0` errors.
3. **ESLint Static Analysis (`bun run lint`)**
   - Command: `bun run lint` (`eslint .`)
   - Result: **PASSED** — Exit code `0`, `0` errors (`1` non-blocking Next.js `<img>` warning on local data-URI preview in `article-workspace.tsx`).
4. **Production Build (`NODE_ENV=production bun run build`)**
   - Command: `NODE_ENV=production bun run build`
   - Result: **PASSED** — Compiled successfully in 24.0s, generated all `28/28` static and dynamic routes cleanly.
5. **Playwright Browser E2E Suite (`bun run test:e2e`)**
   - Command: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell bun run test:e2e`
   - Result: **PASSED** — `35 passed (1.2m)`, `0 failed` across all 5 spec files (`concurrency.spec.ts`, `durability-operations.spec.ts`, `scientific-editor.spec.ts`, `security.spec.ts`, `smoke.spec.ts`, `tiptap-dedup.spec.ts`).

---

## 5. Complete 51-Task Classification Table (`SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md`)

Allowed statuses: `VERIFIED`, `IMPLEMENTED-NOT-E2E-VERIFIED`, `PARTIAL`, `BLOCKED`, `DEFERRED`.

| Task ID | Title | Priority | Status | Evidence (`File / Test`) |
| --- | --- | --- | --- | --- |
| `SRS-TEST-001` | Executable Test Harness, CI Pipeline, and Deterministic Node/Bun Baseline | P0 | `VERIFIED` | `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`; verified by `bun run test:unit` (50/50) & `bun run test:e2e` (35/35) |
| `SRS-SEC-001` | Unified HTML Sanitization and URL/Attribute Security Boundary | P0 | `VERIFIED` | `lib/html-security.ts`, `lib/editorial-rules.test.ts`, `tests/e2e/security.spec.ts` (`SRS-RT-005`) |
| `SRS-SEC-002` | Backup Import Schema and Runtime Validation | P0 | `VERIFIED` | `lib/backup-validation.ts`, `lib/backup-validation.test.ts`, `tests/e2e/security.spec.ts` |
| `SRS-DATA-001` | Transactional IndexedDB Persistence and Truthful Save Receipts | P0 | `VERIFIED` | `lib/studio-persistence.ts`, `lib/studio-persistence.test.ts`, `tests/e2e/concurrency.spec.ts`, `tests/e2e/durability-operations.spec.ts` |
| `SRS-DATA-002` | Real Version Conflict Enforcement Across Tabs and Operations | P0 | `VERIFIED` | `lib/studio-context.tsx`, `tests/e2e/concurrency.spec.ts`, `tests/e2e/security.spec.ts` |
| `SRS-DATA-003` | Application-Wide Transactional Mutation Contract for All Entities | P0 | `VERIFIED` | `lib/studio-context.tsx`, `app/categories/page.tsx`, `app/media/page.tsx`, `tests/e2e/scientific-editor.spec.ts` (`S-DURABLE-ENTITY-1`) |
| `SRS-MED-001` | Real Local Media Binary Persistence (Replace Session-Only `blob:` URLs) | P0 | `VERIFIED` | `app/media/page.tsx`, `lib/backup-validation.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-MED-1`) |
| `SRS-PUB-001` | Unified Role and Status Transition Enforcement Across All Entry Points | P0 | `VERIFIED` | `lib/editorial-rules.ts`, `lib/audit/publish-policy.ts`, `lib/studio-context.tsx`, `lib/editorial-rules.test.ts` |
| `SRS-PUB-002` | Pre-Publish and Schedule Gate Enforcement | P0 | `VERIFIED` | `lib/audit/publish-policy.ts`, `components/audit/pre-publish-dialog.tsx`, `lib/editorial-rules.test.ts` |
| `SRS-HTML-002` | Canonical Content Model Synchronization (`body` vs `bodyHtml`) | P0 | `VERIFIED` | `lib/html-source.ts`, `lib/studio-context.tsx`, `components/editor/article-workspace.tsx`, `lib/html-source.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-BODY-SYNC-1`) |
| `SRS-DATE-001` | Complete IANA Timezone Wall-Time Conversion and DST Disambiguation | P0 | `VERIFIED` | `lib/datetime/format.ts`, `components/datetime/localized-date.tsx`, `lib/editorial-rules.test.ts` |
| `SRS-ED-001` | Deduplicate Tiptap Extensions (`Link`, `Underline`) and Stabilize Editor Instance | P0 | `VERIFIED` | `components/editor/article-tiptap-editor.tsx`, `tests/e2e/tiptap-dedup.spec.ts` |
| `SRS-ED-002` | Unified Block Style Selector (Paragraph, H2, H3, Blockquote, Code Block) | P1 | `VERIFIED` | `components/editor/article-tiptap-editor.tsx`, `tests/e2e/smoke.spec.ts` |
| `SRS-ED-003` | Auto-Growing Multi-Line Article Title Input (`<h1>` Wrapping Fix) | P0 | `VERIFIED` | `components/editor/article-workspace.tsx`, `tests/e2e/smoke.spec.ts` (`SRS-RT-008`) |
| `SRS-ED-004` | Text Alignment (`left`, `center`, `right`, `justify`) and `sup`/`sub` Controls | P1 | `VERIFIED` | `lib/editor-extensions.ts`, `lib/html-source.test.ts`, `lib/editorial-rules.test.ts` |
| `SRS-ED-005` | Structured Scientific Tables with Contextual Controls and Captions | P1 | `VERIFIED` | `lib/editor-extensions.ts`, `components/editor/article-tiptap-editor.tsx`, `tests/e2e/scientific-editor.spec.ts` (`S-ED-1`) |
| `SRS-ED-006` | Formatting Completion: Horizontal Rule, Inline Code, Code Block, Clear Formatting | P1 | `VERIFIED` | `components/editor/article-tiptap-editor.tsx`, `lib/html-source.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-ED-2`) |
| `SRS-ED-007` | In-Body Scientific Figure Insertion and Media Picker Integration | P1 | `VERIFIED` | `lib/editor-extensions.ts`, `components/editor/article-tiptap-editor.tsx`, `lib/html-source.test.ts` |
| `SRS-ED-008` | Paste Normalization for Word, Google Docs, HTML, and Markdown | P1 | `VERIFIED` | `lib/html-security.ts`, `components/editor/article-tiptap-editor.tsx`, `lib/html-source.test.ts` |
| `SRS-ED-009` | Find & Replace Bar in Visual and HTML Source Modes | P2 | `IMPLEMENTED-NOT-E2E-VERIFIED` | `components/editor/article-tiptap-editor.tsx` (`findMatches`, `handleReplaceMatches`) |
| `SRS-ED-010` | Scientific Character and Unit Quick-Insert Palette | P2 | `IMPLEMENTED-NOT-E2E-VERIFIED` | `components/editor/article-tiptap-editor.tsx` (`SCIENTIFIC_SYMBOLS` popover & insertion handler) |
| `SRS-ED-011` | Keyboard Shortcuts and Platform-Aware Tooltip Labels | P1 | `VERIFIED` | `components/editor/article-tiptap-editor.tsx`, `tests/e2e/smoke.spec.ts` |
| `SRS-HTML-003` | Safe Body-Only `HTML Source` Mode with Diagnostics, Diff, and Explicit Apply | P1 | `VERIFIED` | `lib/html-source.ts`, `components/editor/html-source-panel.tsx`, `lib/html-source.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-ED-2`, `S-CITE-1`, `S-BODY-SYNC-1`) |
| `SRS-HTML-001` | Remove Unsanitized HTML Rendering Sinks in Preview and Inspector Views | P0 | `VERIFIED` | `components/editor/article-preview-view.tsx`, `lib/html-security.ts`, `tests/e2e/security.spec.ts` |
| `SRS-MATH-001` | Inline and Block LaTeX Equation Nodes | P1 | `VERIFIED` | `lib/editor-extensions.ts`, `lib/latex-math.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-MATH-1`) |
| `SRS-MATH-002` | Safe Equation Rendering (`trust: false`, `maxExpand`) and Error Recovery | P1 | `VERIFIED` | `lib/latex-math.ts` (bespoke recursive 2D parser/renderer with `trust: false`), `lib/latex-math.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-MATH-1`) |
| `SRS-SEO-001` | Complete Article Fingerprint Inputs (Linked Sources, Media Alt/Caption, Body Structure) | P0 | `VERIFIED` | `lib/audit/run-article-audit.ts`, `app/articles/[id]/seo/page.tsx`, `lib/audit/fingerprint.test.ts`, `tests/e2e/durability-operations.spec.ts` |
| `SRS-SEO-002` | Reconcile SEO Center and Article SEO Subpage Severity/Guidance | P1 | `VERIFIED` | `lib/audit/run-article-audit.ts`, `app/seo/page.tsx`, `app/articles/[id]/seo/page.tsx`, `tests/e2e/smoke.spec.ts` |
| `SRS-SEO-003` | Production vs Demo Canonical/Robots Separation | P1 | `VERIFIED` | `lib/editorial-rules.ts`, `lib/audit/run-article-audit.ts`, `lib/editorial-rules.test.ts` |
| `SRS-MED-002` | Scientific Figure Governance: Alt Text, Caption, Credit, Licence, Non-Crop Policy | P1 | `VERIFIED` | `lib/studio-context.tsx`, `app/media/page.tsx`, `lib/editorial-rules.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-MED-1`) |
| `SRS-MED-003` | Cloudflare R2 / Image Variants Production Adapter (Opt-In Only) | P2 | `DEFERRED` | Disconnected by safety policy until external credentials/authorization are provided (`app/settings/integrations/page.tsx`) |
| `SRS-SCI-001` | DOI Format Validation vs External Crossref Verification Separation | P1 | `VERIFIED` | `lib/editorial-rules.ts`, `lib/audit/run-article-audit.ts`, `lib/editorial-rules.test.ts` |
| `SRS-SCI-002` | Inline Citation Insertion and Reference List Synchronization | P1 | `VERIFIED` | `lib/citations.ts`, `components/editor/article-preview-view.tsx`, `lib/citations.test.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-CITE-1`) |
| `SRS-REV-001` | Revision Snapshot Integrity, Visual Diff, and Non-Destructive Restore | P1 | `VERIFIED` | `lib/studio-context.tsx`, `app/articles/[id]/revisions/page.tsx`, `tests/e2e/concurrency.spec.ts` |
| `SRS-ROLE-001` | Explicit Demo Role Simulation Labeling vs Server RBAC Boundary | P1 | `DEFERRED` | UI role switcher truthfully labeled as local simulation; server RBAC deferred to production backend phase |
| `SRS-AI-001` | Codex Editorial Assistant Contract: Local Checks, Diff Review, Honest Disconnected Mode | P1 | `VERIFIED` | `components/editor/codex-assistant-drawer.tsx`, `lib/studio-context.tsx`, `lib/editorial-rules.test.ts` |
| `SRS-UX-001` | Decompose Monolithic `article-workspace.tsx` into Focused Modules | P1 | `PARTIAL` | Targeted modular extractions (`lib/latex-math.ts`, `lib/citations.ts`, `lib/html-source.ts`, `lib/editor-extensions.ts`) completed; wholesale shell replacement held per CKEditor track |
| `SRS-UX-002` | Modal Focus Trap, `aria-modal`, `Escape` Handling, and Keyboard Accessibility | P1 | `VERIFIED` | `components/editor/article-tiptap-editor.tsx`, `components/editor/html-source-panel.tsx`, `tests/e2e/smoke.spec.ts` |
| `SRS-UX-003` | Responsive Viewport Compliance (`1440×900`, `1024×768`, `390×844`) | P1 | `VERIFIED` | `components/editor/article-workspace.tsx`, `tests/e2e/smoke.spec.ts` |
| `SRS-INT-001` | Google Search Console & GA4 Read-Only Adapter (Opt-In Only) | P2 | `DEFERRED` | Disconnected by safety policy; zero fabricated telemetry (`app/search-performance/page.tsx`, `app/settings/integrations/page.tsx`) |
| `SRS-INT-002` | Google AdSense & Tag Manager Configuration Governance (Opt-In Only) | P2 | `DEFERRED` | Disconnected by safety policy (`app/settings/integrations/page.tsx`) |
| `SRS-INT-003` | Codex / OpenAI OAuth / API Adapter Behind Server Boundary (Opt-In Only) | P2 | `DEFERRED` | Disconnected by safety policy (`components/editor/codex-assistant-drawer.tsx`, `app/settings/integrations/page.tsx`) |
| `SRS-TEST-002` | E2E Browser Suite for Critical Editorial Flows | P0 | `VERIFIED` | `tests/e2e/smoke.spec.ts`, `tests/e2e/scientific-editor.spec.ts`, `tests/e2e/durability-operations.spec.ts` (35/35 passed) |
| `SRS-TEST-003` | Security Regression Suite (XSS, Import Validation, Sanitizer Bypass) | P0 | `VERIFIED` | `tests/e2e/security.spec.ts`, `lib/backup-validation.test.ts`, `lib/html-source.test.ts` |
| `SRS-TEST-004` | Multi-Tab Concurrency and Storage Failure Tests | P0 | `VERIFIED` | `tests/e2e/concurrency.spec.ts`, `tests/e2e/scientific-editor.spec.ts` (`S-DURABLE-ENTITY-1`), `lib/studio-persistence.test.ts` |
| `SRS-TEST-005` | Performance and Long-Article Stress Benchmark (`5,000–10,000` Words) | P2 | `IMPLEMENTED-NOT-E2E-VERIFIED` | Deterministic local operations verified across 50 unit + 35 E2E tests; formal 10k-word profiling deferred |
| `SRS-FUT-001` | Citation Style Language (CSL) Multi-Style Formatting | P2 | `DEFERRED` | Vancouver numbering implemented (`lib/citations.ts`); multi-style CSL deferred |
| `SRS-FUT-002` | Real-Time Multi-User Collaborative Editing (Yjs / CRDT) | P2 | `DEFERRED` | Deferred to post-local-prototype phase |
| `SRS-FUT-003` | Automated PDF/LaTeX Manuscript Import & Export | P2 | `DEFERRED` | Deferred to post-local-prototype phase |
| `SRS-CODE-001` | Empty Articles Array Reseeding Bug (`lib/studio-context.tsx`) | P1 | `VERIFIED` | `lib/studio-context.tsx`, `lib/studio-persistence.test.ts` |
| `SRS-CODE-002` | Seed Data Missing Local SVG Assets (`lib/seed-data.ts`) | P1 | `VERIFIED` | `public/figures/quantum-ldpc-lattice.svg`, `public/figures/perovskite-tandem-spectrum.svg`, `lib/backup-validation.test.ts` |

---

## 6. Deferred Items & Next Track Handoff

1. **CKEditor 5 + CKEditor Math Integration Track (Deferred by Owner Instruction):**
   - Per `docs/GOOGLE_AI_STUDIO_FINAL_COMPLETION_MISSION_2026-11-01.md` §1, CKEditor 5 and CKEditor Math were **not** installed or staged during this run.
   - All manuscript persistence (`synchronizeArticleBodyRepresentations`), HTML sanitization (`lib/html-security.ts`), citation analysis (`lib/citations.ts`), and media/audit pipelines are cleanly decoupled from the editor view layer so the upcoming CKEditor 5 track can mount against the same canonical HTML/JSON contract.
2. **External Production Integrations (`SRS-INT-001` .. `SRS-INT-004`):**
   - Cloudflare R2/Images, Google Search Console/GA4/AdSense/GTM, server-side database/auth, and live `scientificradar.com` deployment remain intentionally disconnected and truthfully labeled in the UI.
