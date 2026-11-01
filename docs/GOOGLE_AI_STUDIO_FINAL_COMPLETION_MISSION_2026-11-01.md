# ScientificRadar Studio — Google AI Studio Remaining-Work Completion Mission

**Date:** 2026-11-01 (Europe/Istanbul)  
**Mission:** Complete and verify the existing ScientificRadar Studio prototype's genuinely remaining local work **before** a separate, later CKEditor 5 / CKEditor Math integration.  
**Recipient:** Google AI Studio, working with the imported ScientificRadar Studio repository and its runnable sandbox.  
**Repository:** Centaurioun/scientificradar-studio  
**Execution status:** Owner-authorized implementation brief. Reading this local file and executing it is the task.  
**Do not interpret this document as permission to connect or change production infrastructure.**

> ## START — EXECUTE THE LOCAL REPOSITORY TASK
>
> You are working on the **existing** Next.js / React / TypeScript scientific editorial CMS. Read this entire document, verify the actual imported Git HEAD, inspect the present code and earlier repository specifications, then **implement, verify and report all feasible outstanding local functionality in one substantive run**. Do not ask for separate approval between ordinary implementation steps. Do not create a replacement project, generic CRM or new design system.
>
> **This is the pre-CKEditor completion run.** Do not install, copy, stage, upgrade or integrate CKEditor 5 or CKEditor Math, and do not delete or replace Tiptap in this run. Those tasks are being handled separately. Make science-content representations and tests editor-portable so a subsequent migration can preserve them.
>
> Existing functionality is valuable. **Inspect before changing. Preserve and test working code. Fix proven gaps rather than reimplementing already-completed features.** A visible sandbox preview proves the app runs, but does not by itself prove durable IndexedDB saves, scientific round trips, multi-tab safety or full regression coverage.
>
> On completion, write one evidence-based report at **docs/google-ai-reports/COMPLETION_AUDIT.md** and synchronize actual changed source with GitHub main through the **existing AI Studio export/sync workflow** if available. Do not claim that a GitHub push, CI run or production deployment happened unless you verified the exact result.

## 1. What has already happened; what is authoritative

### 1.1 The real baseline

- This brief was authored after reading GitHub main at **e4611534e662b864f4e26c5a2c2b9e0ca17219d2**. The latest **application-code** baseline known at that time was **bae598fc3c194ca54736e59e2eade4c618b5c7db**. Adding this brief creates another documentation commit. **Neither SHA is a substitute for checking your actual imported HEAD at runtime.**
- Earlier accepted source fixes were followed by Google AI Studio implementation at commits **31a620aeac1f7f3dd5b6f1acfc0fd3970f3778df** and **bae598fc3c194ca54736e59e2eade4c618b5c7db**. Do not reset to older snapshots or overwrite later changes with a previous spec.
- Current architecture includes Next.js 15, React 19, TypeScript, Tailwind 4, Tiptap 3 / ProseMirror, IndexedDB / idb, DOMPurify, and Playwright. Article editing is still Tiptap-based.
- Existing source already implements substantial tables, figure metadata, HTML Source mode, math nodes, citation ordering and bibliography, SEO, audit/publishing rules, revisions, and responsive editorial UI. **Never label all of that as missing simply because an older brief calls it NEW.**
- **Main CI currently triggers on pull_request to main, not on push to main.** AI Studio can correctly build and preview its sandbox and export directly to main without creating a PR; an absent GitHub Actions run is therefore **not evidence of a failed sandbox build**. Equally, an AI Studio preview is not an independent GitHub CI result.

### 1.2 Read order — all files are inside this imported repository

Read and reconcile, in this order:

1. **docs/SCIENTIFICRADAR_STUDIO_CHATGPT_HANDOFF_2026-11-01.md** — newer owner's decisions, GitHub/AI Studio flow and CKEditor boundary.
2. **This document** — operative scope, priorities, tests and reporting contract for this run.
3. **docs/GOOGLE_AI_STUDIO_REMAINING_WORK.md** — detailed previous remaining-work specification, authored against an **older** application commit.
4. **docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md** — original S0–S7 scope and historical completion ledger. Its recorded DONE claims are **not** automatically proof at the new HEAD.
5. **docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md** — canonical registry of 51 historic stable task IDs.
6. **docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md** — scientific CMS product and non-goals.
7. **docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md** and **docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md** — product acceptance and scientific-content semantics.
8. **docs/EDITOR_EXPERIENCE_RESEARCH_HOLD.md** — prior observed table/code UX problems; this is **not** permission to replatform.
9. **docs/TESTING.md** and **docs/google-ai-reports/README.md** — test harness and required report format.
10. Then examine **package.json**, **bun.lock**, **playwright.config.ts**, **.github/workflows/ci.yml**, relevant source under **app/**, **components/**, **lib/** and existing **tests/e2e/**.

When older documents disagree with actual source or the newer owner handoff, prioritize the **actual imported source and test evidence**, then the **latest explicit owner decisions**, then earlier design requirements. Record conflicts; do not silently erase requirements.

## 2. Scope decisions and guardrails

### Authorized in this run

- Repair real locally reproducible correctness, security, persistence, editor, UX, audit, tests, and documentation defects.
- Complete safe outstanding local features without requiring third-party production credentials.
- Add or update focused unit and Playwright tests and improve CI coverage for the direct-main export workflow where safe.
- Make one substantial integrated implementation pass with internal checkpoints and a final holistic verification. Continue through ordinary fix/test iterations without repeatedly asking the owner to approve every small change.
- Commit/export completed files through the existing AI Studio-to-GitHub workflow, reporting real SHAs and exact failures.

### Explicitly not authorized

- **No CKEditor 5 / CKEditor Math upgrade, source staging, dependency installation, integration or Tiptap removal in this mission.** That work will come later. Do not make this a condition for completing the present mission.
- No production website, DNS, current public CMS, live editorial database, Cloudflare R2/Images, AdSense, GA4, GSC, GTM, API credentials, external AI provider, live publication, paid licence, user-account/RBAC deployment, or authenticated third-party access changes.
- No fabricated academic research results, DOI verification, citations, figure author/licence, clinical evidence, Google indexing status, external link check, or AI provider response.
- No destructive bulk migration, article/revision reset, silent HTML/node conversion loss, author-content rewrite or application rewrite.
- No forced PR flow. AI Studio can export directly to GitHub main. Do not require reading unrelated repositories or a CKEditor fork.
- Do not disable failing tests, delete useful test coverage, weaken assertions or fabricate PASS output to make the final report green.

### Editorial product invariants

- Article **title is the only H1**; body has H2/H3 but no additional H1. Paste of body H1 must be explicitly demoted; titles must wrap without clipping.
- The human creates scientific content. Local AI/Quick Fix recommendations are reversible, reviewable and opt-in, and must never silently alter scientific meaning.
- Preserve UTF-8/Turkish/Greek symbols, all numbers/units, super/subscript, inline/block raw TeX, tables, citations with stable **sourceId**, figures with stable **mediaId** and rights/captions, source links, revision history and existing saved articles.
- Sanitize all untrusted HTML using the actual maintained DOMPurify boundary. No executable markup, untrusted SVG/MathML, event handlers, scripts, dangerous URLs or invented trusted assets.
- A UI receipt reading **Saved (Local)**, **Restored**, **Audit saved**, **Uploaded** or **Published (Demo)** must reflect the actual committed local operation; never claim durable storage based only on optimistic state.
- Keep local demo-only publication conspicuously separate from actual public publication. Client role switcher is not real server authentication.
- Keep the current restrained teal/neutral editorial interface, dark/light modes, wide article workspace, organized navigation, existing working routes, optional modules and responsive behavior.
- Product policy of **maximum six tags** is editorial policy, not a universal search-engine rule. External connections must say **Not connected / Unverified** truthfully.
- Prefer minimal, maintainable changes; no speculative rewrite of thousands of lines or throwaway table/math machinery when a future editor change is planned.

## 3. Mandatory initial reconnaissance — bounded, not another endless audit

Before touching application code, record:

1. Actual imported HEAD SHA, branch if known, current modified/untracked state, and whether this exact prompt file is present locally. Do not re-clone/reset to a previous snapshot.
2. Current scripts, locks, dependency versions, relevant editor extensions, persistence schemas, rendered manuscript paths, report files and test files.
3. Existing functionality that is **already implemented** at this HEAD; do not rely on older historical DONE/NEW labels.
4. Last known test result **only when actually run in this sandbox**; prior CI history and past chat claims must be separated.
5. A small actionable implementation matrix with **VERIFIED**, **IMPLEMENTED-NOT-E2E-VERIFIED**, **PARTIAL**, **BLOCKED** and **DEFERRED**, including traceable file paths and tests.

Do this triage quickly and continue **directly into repairs and implementation**. Do not stop at producing another independent architecture audit or require the owner to answer ordinary design questions. If a documented concern does not reproduce and the source demonstrates an adequate current implementation, write a passing regression test or record the evidence, then **move on**.

### Source-visible concerns to validate first (not claims of reproduced data loss)

- **lib/studio-context.tsx**: the generic **updateState** still applies optimistic state and queues a second updater against IndexedDB. Context operations such as **addTag**, **saveAuthor**, **saveSource**, **addMediaAsset** and **deletePage** expose synchronous or void result shapes. A returned entity is not a durable commit receipt. Determine precisely which callers prematurely report success and whether conflicting writes can roll back legitimate newer edits.
- **components/editor/article-workspace.tsx**: in the current draft construction, **body** is taken from **existingArticle?.body** while **bodyHtml** contains the current edit. The Tiptap editor emits **getJSON()** from **components/editor/article-tiptap-editor.tsx**. Trace whether a real edit/save/reload keeps both representations consistent. If JSON is stale, fix the source-of-truth contract without discarding old documents.
- **lib/latex-math.ts**: current math is a bespoke LaTeX parser/renderer rather than upstream KaTeX. Do not call it KaTeX or assume arbitrary scientific TeX fidelity. Test mathematical structure and safe fallback honestly; a small reusable renderer adapter is preferable to a large future-disposable Tiptap rewrite.
- **lib/citations.ts** already derives order and Vancouver-style references; verify behavior and data survival, **not** another unrelated bibliography implementation.
- The previous **docs/google-ai-reports/COMPLETION_AUDIT.md** was **absent** at the reviewed HEAD. This run must create a real report with actual evidence.

## 4. Implementation priorities and acceptance contracts

Treat these as ordered groups with independent testable outcomes. Where source already meets the contract, preserve it and verify it. Where multiple groups touch one module, coordinate changes and avoid competing rewrites.

### P0-A — Correct durable mutations and honest UI receipts (SRS-DATA-003)

**Likely source:** lib/studio-context.tsx, lib/studio-persistence.ts, associated pages and hook/context consumers.

- Inventory supporting-entity mutations: tags, categories, series, authors, sources/knowledge links, media, pages, menus/homepage, settings/preferences, taxonomy relationships, deletes, resets and imports.
- Use a clear awaited result **after the real IndexedDB transaction resolves**; where suitable return committed entity, stable ID, storage revision and explicit conflict/abort/quota/unavailable result. Generate IDs/timestamps **once per intent**, never during updater replay.
- Update call sites so success messages and navigation follow durable receipts. On failure/abort preserve the form or unsaved intent and allow safe retry. Do not show ghost objects or uncommitted media.
- Guard against stale-tab overwrite, out-of-order optimistic completion, double application of an updater and accidentally resurrected deleted entities. Keep unrelated entity edits across tabs; maintain article/version and audit invalidation when linked sources/media change.
- Preserve transactional article save/restore/Quick Fix safety, old snapshots and correct empty-list behavior. Failed IndexedDB transactions must not universally downgrade an available database to silent memory mode.
- Validate with actual IndexedDB held transactions, force abort/quota-type errors, two independent browser tabs, reload and direct inspection of **scientificradar-studio-p0-db / studio_state / root_snapshot_v1**. Unit-only mocks and a successful button click are insufficient.
- Do not introduce a server database or pretend local IndexedDB provides real multi-user security.

### P0-B — Eliminate stale editor JSON/HTML divergence, preserving historical content

**Likely source:** components/editor/article-workspace.tsx, components/editor/article-tiptap-editor.tsx, lib/types.ts, lib/studio-context.tsx, HTML import/export/revision helpers.

- Trace actual **onChange(html, json, ...)** event, draft state, autosave, revision creation, assistant changes, HTML Source Apply, duplicate, revision restore, import, preview and export.
- Establish an explicit, tested authoritative-content and synchronization policy. When visual editing changes manuscript content, **body JSON and sanitized bodyHtml must represent the same scientific semantics at commit time**. Do not save freshly edited HTML paired with stale JSON.
- Preserve legacy records where body and bodyHtml already disagree; use non-destructive compatibility reads and record which representation is authoritative **per existing document**, not a destructive blanket rewrite.
- Scientific semantic comparison must check citation IDs, media IDs/rights, math raw TeX, table/caption structures, H2/H3, code whitespace and Unicode. HTML string equality alone is not sufficient.
- Synchronize external changes without replacing an active unsaved draft or losing editor focus. Do not revert to a brittle string-length comparison; current editor already removed one such heuristic.
- Tests: fresh visual edit → save → reload, HTML Source Apply → visual → save, same-length different-content external update, restored old revision, older imported snapshots, repeated export/import, and a deliberate body/bodyHtml mismatch. Preserve article history and exact important attributes.

### P0-C — Defend HTML, backup, figures and scientific semantics

**Likely source:** lib/html-security.ts, lib/html-source.ts, lib/backup-validation.ts, lib/editor-extensions.ts, components/editor/html-source-panel.tsx, app/media, and editor preview.

- Verify sanitized **visual editor ↔ body-only HTML Source ↔ saved draft ↔ preview ↔ revision ↔ backup/export/import** round trips. Reject or explicitly warn before applying source that strips data-bearing nodes/attributes; never silently lose scientific meaning.
- Cover real empty table cells, row/column/caption/header, nested lists, block-code whitespace, raw TeX, citation sourceId, mediaId, captions, alt, credit/licence, crop/layout, URLs and Unicode.
- Test XSS and unsafe-URL canaries in paste, HTML Source, backup import, restored content and rendered previews. Use parser-backed sanitization; no regex-only substitute.
- Verify H1 paste demotion and title-only H1 through every path. Missing media/citation references must trigger honest warnings, not silently fabricated replacements.
- Preserve accessible source-edit diagnostics, diff/Apply/Discard UX and dirty-state/conflict checks.

### P0-D — Validate media bytes, rights and persistence (SRS-MED-001/002, ED-007)

- Verify accepted raster magic bytes, decode, dimensions, size limit, rejected SVG/corrupt uploads, no fabricated CC BY licence or creator credit, and correct empty/unverified rights states.
- In a disposable browser profile, upload real test fixture pixels, save, **close and restart the browser against the same disposable profile**, reload the editor, and assert actual image decoding and content identity. A data URL merely existing is insufficient.
- Check aborted upload/delete, quota and export/import failure behavior, local storage limits and missing-asset notices. If the current bounded data-URI storage remains reliable at supported sizes, retain it and document capacity limitations; only add a dedicated binary store if evidence justifies migration cost and the migration is reversible.
- Preserve figure metadata and explicit source/rights across editor, preview, HTML source, revision and backup. Do not connect Cloudflare services.

### P1-A — Scientific editor functions that work rather than just exist

**Likely source:** components/editor/article-tiptap-editor.tsx and lib/editor-extensions.ts.

- **Tables:** a truly blank, visually bounded 3×3 grid; persistent controls when focus is inside a table; intuitive cell selection and Tab/keyboard navigation; insert/delete row/column, merge/split if implemented, clear headers, caption and undo/redo. No demo numbers inserted as author content. Preserve numerical notation such as 10⁻⁶, p = 0.003 and 95% CI through save/reload and source mode. No page-wide horizontal overflow at 390px.
- **Code blocks:** correct insertion, typing, multiline indentation, exiting, source-HTML escaping, copy/paste, undo/redo and durable reload. Preserve whitespace.
- **Math:** verify inline/block layout, fractions/scripts/Greek/matrices as supported, edit-existing and cancel, untrusted macros, malformed TeX and exact raw-source fidelity. **Do not claim KaTeX is installed if it is not.** If renderer correctness fails important scientific fixtures and safe local KaTeX integration is practical, implement a small isolated trusted-renderer adapter, not a complete editor rewrite. If not feasible, preserve raw TeX, expose honest limitations and report the specific failing fixture.
- **Citations:** verify existing sourceId-based numbering by first appearance, repeated source deduplication, reorder, orphan/missing warning and Vancouver-style references from real stored fields. Do not invent journal metadata, verified DOI status or buy a reference service.
- **Editing basics:** styles (paragraph/H2/H3/quote), align, bold/italic/underline, sup/sub, scientific symbols, links, lists, find-next/previous/case-sensitive replace, code shortcut, undo/redo, Word/Docs/Markdown paste, keyboard and selection/focus behavior. Test existing features; do not create duplicate toolbars or unnecessary changes.
- Use accessibility checks for semantic buttons, keyboard return focus, dialog closure, document selection and assistive text.
- **Future CKEditor integration is separate; keep conversion surfaces and tests portable.**

### P1-B — Review, publishing, date/time, SEO, AI suggestions

- Enforce a **single domain policy** for demo roles/status transitions, including save, autosave, calendar, review UI, schedule/approve and assistant/Quick Fix paths. A disabled button alone is not authorization.
- Verify role/status matrix, review notes/revision attribution, reject unsafe draft-to-scheduled transitions, stale tabs and held transactions. Require a committed fresh audit where the existing policy specifies it.
- Use Europe/Istanbul for editor defaults, explicit IANA zones where set, local 24-hour display, actual UTC instants in storage, and deterministic DST gap/fold handling. No hydration mismatches or invented publication times.
- Verify audit fingerprints on **linked source/media mutations**, citation removal, article change and separate-tab edits. Stored audit/current/stale badges must match the actual persisted version across SEO Center, editor and article SEO pages. An old Quick Fix must not overwrite newer content.
- SEO should distinguish **missing / invalid / warning / pass / unverified / stale**, not imply Google ranking, verified indexing, verified DOI or real live link scanning. Maintain title-only H1, appropriate H2/H3 hierarchy, image alt/rights, references and six-tag editorial policy.
- Suggestions and deterministic AI checks must show diff, human Apply/Reject and a reliable undo path. Do not create a new LLM API dependency; label real providers disconnected unless expressly configured.
- Review accessibility and UI states on **390×844, 1024×768 and 1440×900**, light/dark, 90/120/160-character titles, long science articles, menus and popovers.

### P1-C — Repository hygiene and honest test automation

- Inspect tracked temporary artifacts (for example .aistudio/artifacts/.../.tempmediaStorage or tsconfig.tsbuildinfo) and .gitignore; only remove files clearly generated and unrelated to required fixtures. **Never delete provided scientific images, legitimate licensed assets, project docs or user content because they look temporary.**
- Keep current dependency/tool versions unless a concrete defect requires an upgrade; use the lockfile faithfully and preserve license notices.
- Investigate an appropriate **push-to-main** and/or **workflow_dispatch** GitHub Actions trigger in .github/workflows/ci.yml so a direct AI Studio export can have independent hosted checks. This is a **small optional CI improvement** if compatible with existing owner workflow, not a reason to require PRs or delay core repairs. Keep permissions read-only and ensure no production secrets. GitHub checks triggered after pushing are verification signals, **not** pre-merge protection.
- Never claim full hosted CI succeeded until a run on the **exact exported SHA** exists and can be inspected. The sandbox build, hosted CI and E2E are separate pieces of evidence.

### P2 — Remaining 51-ID registry; practical work versus authorization-gated work

- Review **all 51 IDs** from docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md. For each, map current code/test proof and mark **VERIFIED / IMPLEMENTED-NOT-E2E-VERIFIED / PARTIAL / BLOCKED / DEFERRED**. Do not blindly copy the earlier implementation ledger or create duplicate tickets.
- Implement additional **safe and genuinely necessary local** functionality if it fits the existing architecture and evidence. Prefer finishing incomplete real routes and broken user actions over speculative extra modules.
- Explicitly **DEFER/BLOCK** external/architecturally separate features: real account login/server RBAC; Cloudflare R2/Images; GA4/GSC/AdSense/GTM; real Codex/ChatGPT provider connections; public publishing; advanced licensed CSL/MathType/DOCX conversion; live collaboration; external performance claims. Describe what owner authorization and architecture would be needed, without connecting them.
- Future CKEditor 5 / CKEditor Math replacement and source-copy project is a separately planned **next** mission. Its absence is **not** a failure of this pre-integration run.
- Where the previous playbook contains additional IDs not in the stable registry, identify them separately as unregistered/proposed instead of silently expanding the official 51.

## 5. Required regression and science-data acceptance suite

Run existing project scripts, inspect current actual test case count, and **do not substitute one new smoke test** for the full suite. Add focused red/green regression tests for confirmed defects. Use real IndexedDB and real browser interactions for persistence/semantic acceptance.

| Acceptance area | Minimum scenario | Independent oracle |
| --- | --- | --- |
| Existing baseline | Entire pre-existing unit + Playwright suite still runs; link/underline extension warning absent | Actual exit codes and captured console diagnostics |
| Durable mutations | Add/edit/delete source, tag and media; hold/abort transaction; retry and reload | Direct IDB root snapshot / stable entity IDs / no false success |
| Cross-tab consistency | Tab A has pending draft; tab B writes newer article and linked source; stale A acts | Latest committed snapshot and conflict/merge behavior preserved |
| Editor dual representation | Different HTML and JSON before repair; new edit/save; revision, restore, backup | Both representations and semantic IDs agree after reload |
| Table/code | Empty 3×3, add/delete row+column, caption, code whitespace, undo | Saved body + revisitable visual structure; no focus loss |
| Math | Raw TeX: fraction, sum, sqrt, Greek, invalid syntax, unsafe macro; edit/cancel | Exact TeX identity, safe rendering and accessible fallback |
| Citation/bibliography | Two sources + duplicate; reorder; remove source; update DOI/title | sourceId persistence, deterministic numbering and missing warning |
| Image | Raster fixture + missing rights; restart isolated browser profile; quota/abort | Real decoded pixels plus preserved credit/licence/alt metadata |
| HTML/security | Word/Docs/Markdown paste; H1; XSS canary; unsafe URL; source round trip | Non-executing markup and no silent scientific-node loss |
| Publishing/SEO | Role transitions, DST ambiguity, updated linked media/source, stale Quick Fix | Committed state/version, audit staleness and correct user receipt |
| Responsive | 390/1024/1440, both themes, long title, dialogs, keyboard | No clipping, focus trap or document-wide overflow |
| Backup/reset | Versioned valid/invalid snapshots, empty collections, queued write + reset | Exact durable state after reload, no re-seeding |

**Mandatory science fixtures** should include Unicode/Turkish/Greek text, µ, α, β, Δ, ±, ≤, ≥, H₂O, CO₂, 10⁻⁶, p = 0.003, 95% CI, citation IDs, figure rights, TeX fractions and summations. Use a clearly labeled **synthetic** DOI test input; do not represent it as registered or validated against an external registry. Use inert security markers; never include real personal or confidential manuscripts in test fixtures.

**Test commands**, after verifying actual package scripts:

    bun install --frozen-lockfile
    bun run test:unit
    bun run typecheck
    bun run lint
    bun run build
    bun run test:e2e:install
    bun run test:e2e

Playwright's canonical local test server is **127.0.0.1:4175**, not 3000/3100. Use isolated disposable Chromium/Brave contexts; never run these tests against the owner's browser profile or production. Attach test logs/traces where practical. A command that cannot be executed is **NOT RUN / BLOCKED**, not PASS. Re-run the full suite on the **final changed source**, rather than reporting only an earlier checkpoint.

## 6. Execution and self-review protocol — one substantial run, six internal passes

Do **not** interpret these six passes as a request for six separate GitHub prompts, six rewrites or six new owner approvals. They are one iterative quality control loop:

1. **Discovery / brainstorming:** verify actual task intent, source HEAD, existing features, current defects and real constraints; choose minimal solutions and reject needless rewrites.
2. **Risk / data model:** check how each proposed fix affects legacy articles, IndexedDB receipts, semantic IDs, HTML trust, roles and the later CKEditor migration.
3. **Implementation:** repair verified defects and finish feasible local gaps in dependency order; create coherent reversible changes rather than vast wholesale replacements.
4. **Regression / evidence:** reproduce bugs with failing tests when possible, demonstrate corrected behavior, and run all relevant unit, browser and build gates.
5. **Adversarial refinement:** attack assumptions with multi-tab conflicts, aborted transactions, malformed TeX, unsupported HTML nodes, XSS, missing rights, keyboard access and long-document/mobile cases; fix regressions.
6. **Final reconciliation:** inspect the exact final diff, cross-check every requirement against actual evidence, classify all 51 IDs, report remaining blockers without inflation and verify GitHub export identity separately.

A partial failure is **not** a reason to abandon all other independent feasible tasks. Continue safe tasks, record blocked gates precisely and leave the app in a runnable, recoverable state. Keep a clear final residual list. If a genuinely destructive action or new paid/production integration would be necessary, **do not perform that action**; flag it as requiring separate owner authorization.

## 7. Required output and definition of completion

### Files

1. Actual improved source/tests in this imported ScientificRadar repository, changed only where justified.
2. **docs/google-ai-reports/COMPLETION_AUDIT.md** — substantive report, mandatory for this run.
3. Correct obvious misleading statuses in **docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md** where current test evidence contradicts them. Keep historical context; do not label tests PASS because prior documentation did.
4. Optional **docs/google-ai-reports/TEST_EVIDENCE.md**, **BUGS.md**, **ARCHITECTURE_NOTES.md**, **DECISIONS.md** **only if** these contain verifiable additional evidence. Do not generate filler.
5. Keep this mission file and prior specifications in the repository; do not delete them after execution.

### The completion report must contain

- Exact imported Git SHA, source baseline and final local/exported SHA; whether **GitHub main** actually contains the changes. If HEAD after export is unknown, say **not independently verified**.
- A concise implemented-versus-remaining summary; each changed path and task ID.
- **Every one of the stable 51 task IDs** with evidence-based status and a concrete supporting source/test path (or precise blocker). Do not simply claim 51/51.
- Explicit statements for **SRS-DATA-003**, **body JSON/bodyHtml synchronization**, scientific semantic round trips, math fidelity, figure bytes/rights, table/code UX, citation provenance and reporting.
- Actual test commands, environment, exit codes, pass/fail counts and browser versions/viewport. Keep sandbox build, Playwright, and GitHub CI separate. No invented evidence.
- Actual reproductions of defects and red/green tests where available; unresolved failures; any skipped checks and why.
- No production modification and no CKEditor integration in this run; external integrations honestly labeled pending.
- Exact proposed next actions **only for truly residual issues**, prioritizing data safety rather than another all-purpose audit.

### Meaning of DONE

**VERIFIED** means functionality was checked against the relevant code and executable acceptance tests **on the stated code revision**, with result recorded.  
**IMPLEMENTED-NOT-E2E-VERIFIED** means source exists but important end-to-end behavior has not been independently demonstrated.  
**PARTIAL** means a concrete part of the requirement remains.  
**BLOCKED** means a technical/environment/authorization condition prevents completion, with reason recorded.  
**DEFERRED** means a consciously excluded future phase such as CKEditor, production connectors or optional paid features.

**Do not declare the entire application production-ready.** It remains a local scientific CMS prototype until there is separate approved production architecture, server authentication, storage and deployment work. For this mission, success is **all feasible local gaps implemented, tested, and honestly classified** with a useful residual list.

## 8. Google AI Studio ↔ GitHub main synchronization

The owner uses the following workflow:

1. Owner imports/pulls the latest **ScientificRadar main**, including this Markdown file, into Google AI Studio.
2. You read this exact local file and implement in your runnable AI Studio sandbox.
3. You test the results there and export/sync the actual changed application files to **ScientificRadar main** using the owner's normal AI Studio workflow; **no PR is required**.
4. You report exact imported and exported SHAs when actually available. A visible "GitHub & Google AI Studio are currently in sync" indicator is useful UI evidence but should not be transformed into an invented SHA.
5. The owner and ChatGPT will review final source and evidence, then handle **CKEditor Math 49.0.1 historical tests and source staging** as a distinct subsequent stage.

If GitHub sync or hosted CI cannot be inspected, state that precisely. Never say the work was pushed merely because it was saved inside AI Studio. **Do not wait for a CKEditor repository or an external PR before executing this mission.**

---

**Final instruction:** Read the current source, complete the practical remaining ScientificRadar functionality, preserve scientific manuscript data and prior repairs, run the strongest feasible actual tests, generate docs/google-ai-reports/COMPLETION_AUDIT.md, and return a succinct evidence-grounded result. **Do not switch editors or touch production.**
