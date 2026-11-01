# ScientificRadar Studio — Complete ChatGPT Continuity Handoff

**Date:** 2026-11-01 (Europe/Istanbul)  
**Scope:** Authoritative conversation-context handoff for a **new ChatGPT session**, NOT an implementation request or Google AI Studio prompt.  
**ScientificRadar repository:** https://github.com/Centaurioun/scientificradar-studio  
**CKEditor core fork:** https://github.com/Centaurioun/ckeditor5  
**CKEditor Math fork:** https://github.com/Centaurioun/ckeditor5-math  
**Google AI Studio app:** https://aistudio.google.com/app/u/1/apps/4792ee46-2342-45a3-ae8e-3a88787826c5?showPreview=true&showAssistant=true

> **NEXT CHATGPT — FIRST RESPONSE CONTRACT:** Read this ENTIRE document. Reply briefly **in Turkish** only to confirm you understand the context and are ready to continue. The owner will ask one or two questions next. DO NOT automatically generate an AI Studio prompt, code, technical specification, new GitHub PR, new plan, or an implementation action. DO NOT immediately restart settled technical debates. Wait for the owner's next request.

## A. Owner's actual goals and working style

ScientificRadar Studio is an **article-centric scientific editorial CMS/admin panel**, NOT a sales CRM. It is meant for scientificradar.com, but current editing and publishing behavior is prototype/local; production website, DNS, external services, real credentials and public publication must not be altered without explicit authorization.

The owner prefers a thorough, polished, understandable React/Next.js solution with good editor usability, science-specific features and safe content preservation. They like the existing teal/neutral visual identity, light/dark theme, wide writing area, organized left navigation and optional modules; do not start over or add useless features.

**Work allocation:** The owner now prefers **Google AI Studio Gemini 4 Argon/Max** for substantive feature implementation and completion. They have observed comprehensive working sandbox results from relatively long AI Studio runs. They personally find their Codex Luna workflow slower and less reliable for this project. Do not replace their chosen workflow with repeated Codex implementation tasks unless specifically requested. Previous Codex work mainly repaired existing security/data/publishing/test defects; most new feature work was subsequently handed to Google AI Studio.

**AI Studio's actual operating model:** It imports the GitHub repository `main` into its sandbox, modifies and previews code there, then may synchronize its files directly to GitHub `main` — **without a PR**. The owner saw this flow; the open AI Studio browser tab displayed “GitHub & Google AI Studio are currently in sync.” Do not require it to merge PR #N or access unrelated GitHub repos. When preparing future AI Studio work, place the specification and any required source files in the ScientificRadar repository itself so they are visible in the imported snapshot; use **local paths** in the eventual instruction.

**Critical CI correction:** ScientificRadar's current `.github/workflows/ci.yml` triggers on `pull_request` to `main`, NOT `push`. A direct AI Studio export to `main` therefore does not trigger this CI. “No GitHub CI on latest main” DOES NOT equal “AI Studio failed to build/run the app.” Conversely, successful AI Studio preview/build does not establish exhaustive browser, storage, security and migration acceptance. Track these separately: imported SHA; sandbox compile/UI; GitHub export SHA; independent CI if manually/otherwise run; substantive E2E/data integrity checks. Owner does not want endless repetitive auditing; inspect actual gaps and make them actionable for AI Studio.

**No automatic action in the next session.** The owner wants to ask follow-up questions first. This handoff is a context document, NOT permission to start implementing anything.

## B. Verified ScientificRadar source and docs state, 2026-11-01

**Source-code baseline before this documentation-only handoff:** GitHub `main` at `bae598fc3c194ca54736e59e2eade4c618b5c7db`. The commit adding this document moves HEAD but does **not** modify that application baseline. Recheck newest `main` when work resumes.

Relevant chronology:
1. `6039acc` — earlier Codex hardening and repairs consolidated.
2. `6eba7df` — Google AI Studio master implementation playbook.
3. `31a620a` — first broad Google AI Studio S0–S7 implementation.
4. `d317382` — remaining-work brief.
5. `bae598f` — subsequent AI Studio implementation with genuine new editor/publishing features.

The current codebase includes Next.js 15, React 19, TypeScript, Tailwind 4, **Tiptap 3/ProseMirror**, IndexedDB (`idb`), DOMPurify, and Playwright 1.64.1; it is **not using CKEditor 5 as its primary article editor**. The full CKEditor source and Math source have **not yet been copied** into ScientificRadar.

Real feature code created/improved by AI Studio includes: science-focused tables and contextual controls, richer text operations, citations and Vancouver-style bibliography (`lib/citations.ts`), inline/block equation UI, HTML Source validation, SEO/quality checks, figure metadata and rights, revision and local publishing safeguards. The owner reports the AI Studio preview works and displays no apparent error. Do not erase this work or describe the app as merely a wireframe.

**Precise state distinctions:** feature exists in source ≠ every behavior tested; a past “DONE (verified)” label is not definitive for current HEAD. The next review should give a task-by-task **VERIFIED / IMPLEMENTED-NOT-E2E-VERIFIED / PARTIAL / BLOCKED / DEFERRED** table against the actual latest code and tests, not an unsupported blanket “unfinished.”

### Open reliability questions from source review

- **`SRS-DATA-003` / Issue #14 remains open:** https://github.com/Centaurioun/scientificradar-studio/issues/14. Some core article/revision paths are transaction-backed, but `lib/studio-context.tsx` continues to expose synchronous or void supporting-entity operations such as `addTag`, `saveSource`, `addMediaAsset` and `deletePage`. The generic `updateState` path uses optimistic updates before persistence confirmation. This is a **source-visible durability/receipt contract gap**; actual data loss must be reproduced with targeted transaction-abort/reload tests before claiming a live defect.
- **Tiptap JSON vs HTML consistency:** `components/editor/article-tiptap-editor.tsx` emits current `getJSON()`, but in `components/editor/article-workspace.tsx` the draft construction still sets `body: existingArticle?.body || { type: 'doc', content: [] }` while updating `bodyHtml`. Thus JSON `body` can be stale even when HTML is fresh. Confirm data flow and restore/import semantics, then repair before any CKEditor migration.
- **Current math is not KaTeX:** `lib/latex-math.ts` is a large bespoke LaTeX parser/renderer, not the official KaTeX engine. It may produce useful output but needs real math typesetting and scientific fidelity verification rather than an automatic COMPLETE label.
- **Requested detailed Google AI run report:** `docs/google-ai-reports/README.md` exists, but `docs/google-ai-reports/COMPLETION_AUDIT.md` was absent in the checked repository. The next substantive AI Studio run should record precise imported/exported SHAs, modified files, test results and unresolved items there.
- **Latest ScientificRadar `main` CI:** No hosted CI acceptance run on `bae598f` because CI has PR-only triggers. Historical passing PR checks and sandbox preview are distinct evidence.
- **S8 live integrations:** Google Search Console, GA4, AdSense, GTM, Cloudflare R2/Images, remote Codex/ChatGPT and real production publishing remain credential/permission gated. Do not misrepresent disconnected integrations as already working or as failures of S0–S7.

### Established product/design requirements

Title-only H1; body H2/H3; H1 paste demotion. Broad editor functions include proper empty tables with visible borders and durable row/column/merge controls, math, superscript/subscript, code blocks, figures, symbol palette, citations and body-only HTML source. Science-specific links, DOI/source review, figure rights, and safe Wikipedia-style hover/focus previews matter.

SEO checks are richer than a title/description length counter: missing vs invalid vs warning vs pass vs unverified vs stale, headings, sources, links, images, taxonomy, tags, meta, quality and prepublish gate. A **six-tag maximum** is this product's editorial policy, not a universal Google SEO rule. Changes proposed by AI Assistant/Quick Fix should be non-destructive, reviewable via diff and revocable; AI improves formatting/proofreading/SEO but **does not generate or replace the human author's scientific manuscript**.

Local date defaults `tr-TR`/`Europe/Istanbul`/24-hour; reader-side locale/timezone can follow user preferences; distinguish DST gaps/overlaps and avoid hydration mismatch. Media assets need durable identity, alt text, captions, rights/licence and proper crop/layout; do not invent Creative Commons rights. Configurable side navigation, pages/menus/homepage, series, editorial roles/workflows and accessible responsive design remain product requirements.

## C. CKEditor 5 vs Tiptap — owner decision and honest tradeoffs

The owner strongly likes the **professional CKEditor 5 feature-rich WYSIWYG UX**, especially tables, toolbars and code/source editing. Two forks exist:

1. **Core CKEditor:** https://github.com/Centaurioun/ckeditor5
2. **Mathematics plugin:** https://github.com/Centaurioun/ckeditor5-math — fork of `isaul32/ckeditor5-math` (ISC licensed).

The owner explicitly chose to use **their CKEditor Math plugin plus KaTeX/MathJax**, NOT to transplant the Tiptap Math extension and NOT to purchase premium MathType merely for equations. CKEditor core has separate GPL-2+/commercial licence obligations; the Math plugin being ISC does not erase them. Use is initially the owner's own editor, not a resold SaaS. Preserve notices and evaluate browser-side source distribution/GPL obligations before opening the admin editor to others.

Multiple prior independent research reports recommended **keeping Tiptap 3 and improving custom TableKit/UI/math integration**, based on lower migration risk. These are legitimate counterarguments and should be remembered. But **the owner's latest chosen direction is to evaluate CKEditor seriously**. Do not silently overrule them, and do not prematurely delete Tiptap. A reversible parallel proof of concept with scientific semantic preservation is the sensible acceptance route.

## D. CKEditor 5 Math fork — exact tested work and still-missing work

**Draft PR #1:** https://github.com/Centaurioun/ckeditor5-math/pull/1  
**Branch:** `upgrade/ckeditor5-49-compat-ci-20261101`  
**Current checked HEAD:** `da213b836d550e0ab1d195bf0f232ea1d7e2756a`  
**Target:** CKEditor 5 **49.0.1**, upgraded from plugin APIs around **43.2.0**.  
**Successful exact-HEAD CI:** https://github.com/Centaurioun/ckeditor5-math/actions/runs/41331233660  
**Upgrade evidence:** https://github.com/Centaurioun/ckeditor5-math/blob/upgrade/ckeditor5-49-compat-ci-20261101/UPGRADE_49.md

The fork has modern `ckeditor5` entrypoint imports, TypeScript/declaration and browser bundle checks, Node 22/24 CI, and Chromium/Playwright smoke **2/2 PASS** verifying CKEditor initialization, math toolbar and inline/block TeX data round-trip/KaTeX render. **This is real verified progress.** PR remains **OPEN / DRAFT / UNMERGED**; `master` unchanged. No npm release.

**Not yet complete:** Old `tests/` contains roughly **49 historical `it(...)` tests** tied to older CKEditor 43-era APIs. These were **NOT ported to CKEditor 49 and NOT run**. Two passing smoke tests are NOT a replacement for old test coverage. Prioritize equivalent behavior tests for insertion, editing, edit cancellation, dialog focus, paste/autoformat, keyboard, undo/redo, invalid or untrusted TeX, export/import, persistence and equation shape. Need reproducible updated lockfile (old `yarn.lock` reflects 43-era deps), review modern package output/ESM, and preserve licence/security. Do not claim READY for full historic compatibility or merge PR #1 merely because CI's current small suite passes.

## E. LATEST OWNER OVERRIDE: STAGE **BOTH** SOURCE FORKS INSIDE SCIENTIFICRADAR

**Important: the owner explicitly DISAGREES with the prior assistant's recommendation to copy ONLY the Math package.**

Once ready and authorized, they want to copy the **CKEditor core source AND CKEditor Math source**, each into its own **temporary reference/staging directory inside the ScientificRadar GitHub `main`**. Motivation: Google AI Studio imports only that repository into its sandbox. If both full source trees are local, AI Studio can inspect packages/files we might have overlooked and adapt them without depending on separate GitHub repository access.

Conceptual staging location (**NOT yet created; final path negotiable**):

```text
scientificradar-studio/
  vendor-staging/
    ckeditor5/          # complete tracked, relevant upstream/core source snapshot
    ckeditor5-math/     # complete tracked, relevant Math fork source snapshot
    SOURCE_MANIFEST.md  # origin URLs, exact SHAs, licenses, excluded artifacts, sync method
```

Treat staging as **source visibility, NOT activation or app integration**. Prefer full maintainable tracked source, tests, styles, package manifests, build configs and licence files. Exclude `.git`, `node_modules`, caches, generated output, secrets, oversized irrelevant binaries (these are not maintained source). Determine CKEditor monorepo size and Git/AI Studio sandbox limits **before** copying; if a full core snapshot is technically impractical, demonstrate the constraint and discuss a complete but bounded source alternative with the owner. Do not unilaterally revert to “Math only.”

Preserve build stability: staged sources must not accidentally be imported into the application, compiled, indexed as active Next.js code, or deployed to readers. Both source snapshots should have immutable commit provenance, clear licences, reproducibility notes and separate identities. This has **NOT been done yet**. Do not imply it was done or take this handoff as permission to perform it immediately.

The owner envisages instructing Google AI Studio from local Markdown under `docs/` to analyze current Tiptap, CKEditor and Math; integrate CKEditor first and Math second **or** both together if technically justified; write substantive findings/limitations to `docs/google-ai-reports/`. Avoid forced artificial segmentation; preserve rollback and output truthful evidence.

## F. Scientific content acceptance is more important than editor appearance

CKEditor 5 has its own document schema: it is **not** a drop-in renderer for Tiptap/ProseMirror JSON. Before default editor replacement, require a non-destructive comparison with exact semantic round trips:

- Immutable copies of existing articles/revisions/backup, inspect `body` JSON versus `bodyHtml` and decide per-document authoritative conversion path.
- Title-only H1, body H2/H3; paragraphs, marks, alignment, inline super/subscript, Unicode, lists, quotations and code blocks preserved.
- Truly empty 3×3 table, visible grid, cell navigation, row/column insert/delete, merge/split, captions, scientific notation, keyboard focus, resize/undo, reload.
- Inline/block raw TeX exactly preserved, nested equations rendered via KaTeX, equation edit/cancel and malformed TeX safe.
- Citations preserve source IDs (`sourceId`), first-appearance numbering, bibliography identity and missing-source warnings.
- Figures preserve `mediaId`, alt, caption, credit, licence, rights, crop/layout; sanitizer and editor conversion must not silently discard metadata.
- Body-only HTML Source -> sanitize -> visual editor -> save -> revision -> reload -> export/import loop checks scientific **semantics**, not just HTML string equality.
- Security and durability: XSS canaries, stored HTML, multi-tab save conflicts, aborted IndexedDB transaction, safe retry, uncommitted-change warning, publish-role gates.
- CKEditor is client-only where necessary under Next.js; no hydration error; desktop/tablet/mobile, keyboard and large scientific documents should be verified.
- **No destructive migration, no removal of Tiptap or old revisions without explicit owner approval.** The owner's CKEditor direction remains subject to measurable evidence and a final owner decision.

## G. Work sequence to DISCUSS later (NOT automatic execution)

**Step 0 — New session acknowledgment.** Read this handoff and answer briefly that you understand and are ready. Owner has follow-up questions. No implementation prompt yet.

**Step 1 — ScientificRadar latest-state review upon request.** Verify `main` and the Google AI Studio sync, compare actual code against `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md`, `docs/GOOGLE_AI_STUDIO_REMAINING_WORK.md` and `docs/google-ai-reports/`. Give a clear done/partial/not-done/deferred table. Priority source checks: `SRS-DATA-003`, `body`/`bodyHtml`, real math, table/citation code, user-visible UX, missing completion audit. No repetitive broad audit or blanket rejection of AI Studio's work.

**Step 2 — Complete Math fork.** Continue draft PR #1 on the Math fork, port meaningful historical tests to CKEditor 49.0.1, improve tests, lockfile, package handling, and retain exact CI evidence. Do not silently merge to `master`.

**Step 3 — Stage BOTH forks.** After verifying sizes/provenance and owner authorization, copy complete applicable core and Math source snapshots into distinct inactive reference directories in ScientificRadar `main`. Keep all application behavior untouched. This is SOURCE STAGING, not editing engine integration.

**Step 4 — Local AI Studio specification when owner asks.** Write a detailed `docs/` Markdown brief referencing those local staging directories and current app source, with compatibility, integration options, semantic migration tests, rollback and evidence acceptance. AI Studio should record actual reports under `docs/google-ai-reports/`; do not require it to see PRs/external repo branches.

**Step 5 — Google AI implementation, possibly one comprehensive run.** Let AI Studio do all feasible work in one run, report exact imported/exported GitHub SHA, source changes, tests (sandbox and GitHub independently), blockers and next repair list. Owner reviews, then targeted follow-up for actual misses.

**Step 6 — Owner's editor choice.** Compare Tiptap versus CKEditor on same scientific corpus and quality gates; switch primary editor only with owner approval and data preservation proof.

## H. Existing repository docs to read as needed

- `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` — original product purpose.
- `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md` — SEO, time, publishing experience.
- `docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md` — scientific editor and HTML mode.
- `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md` — S0–S7 development scope and historical completion ledger; **do not trust old DONE statuses automatically**.
- `docs/GOOGLE_AI_STUDIO_REMAINING_WORK.md` — remaining work and targeted acceptance, authored against earlier `31a620a`; compare with later `bae598f`.
- `docs/EDITOR_EXPERIENCE_RESEARCH_HOLD.md` — reported Tiptap table/code UX issues and previously held replacement decision; latest CKEditor evaluation preference now supersedes the old freeze for **planning and comparison**, not automatic production replacement.
- `docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md` — 51 ID task registry/historical status.
- `docs/TESTING.md`; `docs/SCIENTIFICRADAR_STUDIO_RUNTIME_VERIFICATION_AUDIT.md`; `docs/SCIENTIFICRADAR_STUDIO_CODE_ARCHITECTURE_SECOND_OPINION.md`; `docs/SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT_PHASE2.md`.
- `docs/google-ai-reports/README.md` — expected detailed run report protocol.
- https://github.com/Centaurioun/ckeditor5-math/pull/1 and `UPGRADE_49.md` — mathematics fork compatibility evidence.

A previous assistant's uploaded “ScientificRadar Studio — Güncel durum ve CKEditor 5 geçiş değerlendirmesi” is an important *historical* reference. Its observation that old Math tests were not ported stands; its proposal to copy **only Math** is explicitly superseded by the owner's subsequent **TWO-source-copy** decision. Its question “Should CKEditor totally replace Tiptap or should we compare?” is **not** an urgent clarification: current plan is reversible CKEditor testing followed by owner's final choice.

## I. Superpowers brainstorming + Six Cycle Iterative Refinement (handoff review)

These are **six critical document-review cycles**, NOT six new automated code/test executions.

1. **Intent:** New session acknowledgment, not implementation; prioritize owner's questions and Google AI Studio workflow.
2. **Evidence:** Distinguish exact scientificradar `bae598f` source, latest missing PR-triggered CI, verified Math fork `da213b` CI and unported legacy tests.
3. **Decisions:** Preserve owner override for **both** core and Math source snapshots; do not replace it with the assistant's narrower alternative.
4. **Dependencies:** Historical Math behavior/CI first, then staging/source visibility, then AI Studio scientific editor work, then owner replacement decision.
5. **Risk:** Explicit scientific semantic, security, durability, licence, resource-size, SSR, rollback and no-production boundaries.
6. **Handoff adversarial check:** Unknowns labeled unknown, no premature READY/COMPLETE, no unrequested prompts or code, no implicit licence or integration claims.

## J. Exact behavior of the next ChatGPT response

The first new-chat answer should only be a brief, natural Turkish acknowledgment along these lines:

“Geçiş belgesini okudum. ScientificRadar'ın güncel durumunu, Google AI Studio'nun doğrudan main/sandbox çalışma şeklini, CKEditor 5 ile CKEditor Math için iki ayrı kaynak kopyalama tercihini ve Math 49.0.1'in henüz tamamlanmamış eski testlerini anladım. Yeni bir prompt ya da geliştirme başlatmıyorum; sorularınla kaldığımız yerden devam edebiliriz.”

**Nothing further until the owner asks.**
