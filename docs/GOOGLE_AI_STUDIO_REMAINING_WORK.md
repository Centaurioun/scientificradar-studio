# ScientificRadar Studio — Google AI Studio Remaining Work & Acceptance Brief

**Purpose:** Implement and verify the **remaining real functionality** after the broad S0–S7 Google AI Studio pass. This file is an executable, repository-local handoff: Google AI Studio may have **no access to GitHub PRs, Issues or earlier chat messages**. No tasks depend on opening those links.

**Verified source baseline when authored:** `main` commit `31a620aeac1f7f3dd5b6f1acfc0fd3970f3778df` (the Google AI S0–S7 delivery), following all merged Codex repairs and `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md`. If the imported code has moved, compare its actual content and preserve later improvements. **Do not reset to the older `6039acc…` baseline.**

**Owner decision:** It is ACCEPTABLE to complete several remaining tasks or all feasible remaining tasks **in one substantial run**, provided tests and recoverable checkpoints are real. Do not artificially pause for permission between every ordinary subtask. Do not rewrite the full application, restart a broad audit, or report READY from compilation alone. No new production APIs, passwords, paid infrastructure, real websites, public publishing or paid/licensed feature use without separate authorization.

**How to start:** Read `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md`, this file, `docs/google-ai-reports/README.md`, `docs/EDITOR_EXPERIENCE_RESEARCH_HOLD.md`, the v5/v6 specs, `docs/TESTING.md`, then inspect actual current `app/`, `components/`, `lib/`, `tests/e2e/`. Verify the imported HEAD; the current GitHub `main` already contains the previously accepted Codex repairs and the first S0–S7 implementation. Work from the **current** files, not a reconstructed app.

## 1. Independent source findings — why another completion pass is necessary

On `31a620…`, the new features are **real code**, but the implementation ledger marked S0–S7 `COMPLETED` more broadly than tested evidence supports:

| Work area | Verified existing implementation | Remaining required work |
| --- | --- | --- |
| Science editor shell | `components/editor/article-tiptap-editor.tsx` contains Paragraph/H2/H3, alignment, sup/sub, symbols, code-format buttons, lists, Find/Replace bar and science node registrations | Accessibility/behavior tests, code-block editing and stable selection, title viewport QA, true find-next/previous as needed |
| Tables | `lib/editor-extensions.ts` defines hand-written `scientificTable*` nodes and row/column manipulation; toolbar inserts tables | **Do not replatform now**; table example/empty cell behavior, tabular borders, contextual buttons disappearing, visible selection, rows/columns, caption, numeric round-trip all require QA. *UX redesign is a separate research decision*, see hold note |
| LaTeX | `lib/html-source.ts:validateAndRenderLatex` validates braces/macros then approximates TeX via text substitutions such as `\frac{a}{b}` → `(a)/(b)`; editor has inline/block nodes | **Real mathematical typography** using validated KaTeX or compatible renderer, safe local assets, precise raw TeX persistence, edit existing equation, errors and accessibility |
| Citations | Inline `scientificCitation` uses source ID, but `handleInsertCitation` stores a static `[index + 1]` label | Stable source identity **plus dynamic citation order/renumbering**, bibliography, missing-source warnings and schema-safe round trip |
| HTML source | `components/editor/html-source-panel.tsx` and `lib/html-source.ts` offer body-only View/Validate/Apply/Discard, warning for unsafe/unsupported input | Canonical semantic loss detection and rejection, safe round-trip with table/figure/math/citation, stale-base guard, no accidental loss on Apply |
| Data durability | `createEntityWriteIntent` is pre-generated, root mutations serialized; covered article flows already use authoritative IndexedDB transactions | General `addTag/saveSource/addMediaAsset/deleteSource/deletePage/preferences` still often return synchronous or void before commit, optimistic replay can misreport/rollback incorrectly; add **real IndexedDB** held-transaction/abort/cross-tab tests |
| Media | `app/media/page.tsx` reads data URLs with FileReader and restricts size to 8MB | Data URI != separate binary store; verify pixel decoding after **browser restart**, quota, backups, failure UI, SVG trust and scientific figure rights; remove unverified `CC BY 4.0` defaults |
| Publish | Calendar now checks roles, schedule time, and `saveArticle` uses shared gates | Complete role/status matrix and actual domain guards for **every** status change path including `persistArticleDraft`; test abort, DST and stale tabs |
| SEO | Central `/seo` has stored current/stale badges; merged fingerprint includes linked media/source inputs | End-to-end freshness across central/editor/article SEO views on linked entity edit and second-tab changes; honest persisted receipt; older Quick Fix cannot overwrite |
| Test evidence | Google AI reports 42 unit tests and one editor UI smoke at 1440×900; existing Playwright suite has pre-existing regression specs | **Run the full committed Playwright suite on the new Google AI HEAD**; add new math/table/citation/source/media/publish tests, mobile/light-dark and true persistence; compare QA results with all existing scenarios |

**Important:** These are source-grounded risks and missing acceptance evidence. Do not claim a bug was experimentally reproduced until a failing executable test actually reproduces it. Conversely, a UI button being present is NOT sufficient proof that a scientific manuscript feature is complete.

## 2. Mandatory implementation work — prioritize by data risk, not by the old completion labels

### P0-A. Preserve existing verified repairs and baseline

- Establish exact imported Git SHA and clean working baseline, test scripts and lockfile; preserve existing PR-A/PR-B/PR-C/F1/G1 behavior. Do not cherry-pick outdated PRs.
- Run `bun install --frozen-lockfile`, `bun run test:unit`, `bun run typecheck`, `bun run lint`, `bun run build`, `bun run test:e2e` as available, **including all original browser specs**, not only a new editor smoke. Use port **4175**, not 3000/3100, for canonical Playwright tests. Isolated disposable browser profiles; never use the owner's normal profile.
- If sandbox tools cannot run a command, record `BLOCKED / NOT EXECUTED` with exact reason and never assert PASS.
- Existing `main` includes some incidental `.aistudio/artifacts/brain/*/.tempmediaStorage/*` binary artifacts and `tsconfig.tsbuildinfo`. Remove unnecessary generated artifacts from version control **safely**, without deleting required author-provided public figures or audit fixtures. Verify `bun.lock` validity, tracked outputs and `.gitignore`; no needless dependency upgrades.

### P0-B. Complete actual support-entity durable mutations — SRS-DATA-003

**Source:** `lib/studio-context.tsx`, `lib/studio-persistence.ts`, relevant page callers.

The generic `updateState` invokes the updater optimistically, then again against IndexedDB in the queued transaction. Current context methods such as `addTag`, `saveAuthor`, `saveSource`, `addMediaAsset` return a sync value; `deleteSource`, `deletePage`, `updateMediaAsset`, preferences and navigation use void/sync operations. A returned object or optimistic UI does **not** prove `tx.done` happened.

Required:
1. Provide an awaited typed mutation result/receipt with `ok`, `durable`, actual committed value/version and conflict/error; generate intent ID/time **once**. Preserve existing IDs when editing.
2. Update UI call sites to await receipts before claiming success. On abort/quota failure keep or recover unsaved intent, no ghost media/source/tag.
3. Prevent stale-tab source/media edits from overwriting unrelated latest records. `deleteSource` must not silently strand inline citations or fail to invalidate audit-relevant links/version.
4. Do not let a failed generic transaction permanently switch the entire app to memory-only mode if IndexedDB remains available. Guard latest committed UI state against old queued completions.
5. Reset and import must serialize with pending writes and must not silently resurrect deleted records. Persisted empty article collections must remain empty after reload.
6. Preserve existing authoritative article save, version checks, autosave race protection, Quick Fix, revision restore, duplicate/delete and audit receipts.

**Test using actual IndexedDB with deliberately held transactions**, two tabs, forced abort, fake quota failure, reload, data read directly from `root_snapshot_v1` and post-reload equality of IDs/slugs. Unit-mocked transaction tests alone are insufficient.

**Example API shape, not copy-paste source:**

```ts
type StoredResult<T> =
  | { ok: true; durable: true; value: T; storageRevision: number }
  | { ok: false; durable: false; reason: 'conflict' | 'aborted' | 'unavailable' | 'quota' | 'validation'; message: string };
// const intent = createEntityWriteIntent('src'); // ONCE outside any transaction updater
// const receipt = await storeSource(intent, formValues);
// if (receipt.ok) showCommittedSuccess(receipt.value); else retainUnsavedInput(receipt.message);
```

### P0-C. Truthful publishing, calendars, scientific evidence — SRS-PUB-001/002, REV-001, DATE-001

- Domain-level single policy for role + current status + target status + saved draft + fresh audit. UI disable state alone is not security. Trace `transitionArticleStatus`, `saveArticle`, `persistArticleDraft`, calendar, review queue and assistant changes; ensure every persist path validates the same policy, rejects unauthorized schedule/publish.
- Validate full relevant role/status matrix (owner/editor/author/reviewer × draft/in_review/approved/scheduled/published/archived and defined intermediate states). Preserve owner-approved demo state changes only; no real public publish.
- Use explicit IANA timezone, reject nonexistent DST times, resolve ambiguous times deliberately; test calendar timezones, role change during held transaction, abort and reload.
- DOI syntax ≠ registered DOI; user-entered claims ≠ externally verified citations. Never hallucinate authors, journal, license or review signoff.

### P0-D. Correct media safety and durable figures — SRS-MED-001/002, ED-007

- Verify actual uploaded PNG/JPEG/WebP/AVIF pixel bytes survive **same-profile browser restart**. Data URLs can be persisted locally but large root snapshot strings risk quota/performance; measure and either implement bounded, versioned dedicated IDB binary storage or retain a tested capped solution with explicit limitations.
- A file's MIME/name alone is not proof of its actual type. Untrusted SVG upload must be sanitized safely or disallowed for uploads (retain vetted, static app-owned SVG fixtures). Never assume user content is `CC BY 4.0`. Replace fabricated `credit`/`licence` with empty/`unverified` states and explicit human validation.
- Figure node must preserve ID, caption, alt, credit, rights, source link and non-crop layout across editor ↔ HTML ↔ preview ↔ revision ↔ backup ↔ reload; after media deletion show missing-asset warning rather than silently using a generic fallback figure.
- Test aborted create, aborted deletion, invalid/malformed image, missing rights, quota, backup restore and detached citations/figures. Do not connect Cloudflare R2 without permission.

### P1-A. Real science-quality math (not a textual LaTeX approximation) — SRS-MATH-001/002

Current `lib/html-source.ts` is not KaTeX; it uses regex-like transformations that flatten fractions and exponents. Replace with **actually rendered** supported LaTeX using a maintained, compatible open-source math renderer (KaTeX with `trust:false` is a reasonable choice; verify APIs/licence and bundle CSS/fonts locally). Do NOT silently switch the whole editor framework.

- Persist raw TeX as canonical node data, not generated HTML only. Support inline and display math with appropriate layout.
- Provide insertion, **edit an existing equation** by activating/clicking it, validation and cancel/apply that cannot destroy the last valid expression; allow keyboard entry and accessible source fallback.
- Keep HTML Source, visual editor, preview and revision consistent; scientific fixtures `\frac{a+b}{c}`, `E=mc^2`, `\sum_{i=1}^{n} x_i`, `\alpha \leq \beta`, invalid `\frac{a}{` and disallowed macros. Test that mathematical typography is real and that raw TeX survives repeated edit/save/reload/source round trips.

### P1-B. Correct citations, bibliography and provenance — SRS-SCI-001/002

- Keep stable citation `sourceId` on nodes. Labels currently generated as static `[index+1]` are **not** bibliography management. Derive current visible numbers from document citation order, deduplicate repeated sources and display a stable references section without inventing bibliographic fields.
- On reorder/delete/insert, update numbering and references coherently. Preserve cited source across edit/restore, warn if missing, and respect human/DOI verification states.
- Support explicit Vancouver-like minimal output from real stored fields if feasible; advanced multiple styles only when validated. No paid citation API needed for basic local numbering.
- Test two sources, reordered and repeated, update source title/DOI, orphaned citation, backup/reload, undo/redo.

### P1-C. Correct table and code-block fundamentals — SRS-ED-005/006

**Observed by owner in Google AI Studio:** clicking Insert Table creates a populated/example-looking table; `Add Row` and `Add Column` controls appear and disappear almost immediately, and table grid borders/selection are unclear. Code block also appears unreliable. These are **user observations to reproduce**, not automatically verified code defects.

- Fix fundamental usability only: insert a **genuinely empty 3×3 semantic table** with visible grid borders/cell boundaries, optional header row, accessible cell focus and persistent contextual controls while caret/selection is in table; controls must not vanish due to selection loss or React rerender. Make row/column add/delete, undo, keyboard navigation, cell resize where truly supported, and numeric round-trip work. Do NOT invent demonstration data inside user-authored table.
- Compare behavior to `https://demo.filamentphp.com/blog/posts/74/edit` where a Tiptap-based editor has usable table cells and contextual controls. This is a UX reference, not instruction to import Filament PHP or blindly copy its source. **Do not spend this pass swapping the editor engine or undertaking a full toolbar redesign**.
- Verify code-block creation, entering/exiting, multiline preserved whitespace, escaping, undo/redo, copy, cursor positioning, source/preview/save/reload and pasted code. Avoid pretending keyboard shortcuts work if not tested.
- Cover table structure `<table>/<tr>/<th>/<td>` and semantic captions with scientific numbers `p = 0.003`, `α = 0.05`, `10⁻⁶`, `95% CI`. On narrow viewport allow an **in-table** scroll container, not whole-page horizontal overflow.
- Future editor-framework selection is deliberately **held** for an independent research report in `docs/EDITOR_EXPERIENCE_RESEARCH_HOLD.md`. Limit this pass to functionality/data safety and simple clarity repairs, not a broad visual replatform.

### P1-D. Validated HTML Source and lossless science round trips — SRS-HTML-001/002/003, ED-008

- Work from existing `lib/html-source.ts` and `components/editor/html-source-panel.tsx`. Sanitize every untrusted HTML boundary, and compare supported semantics **after parsing with the actual Tiptap extension schema**, not just a regex count of unsafe tags.
- Prevent disappearing nodes/attributes: `sup/sub`, tables/cells/captions, raw math TeX, linked citation IDs, figures, alt/caption/credit/licence, links, nested lists, whitespace and precise numeric values.
- If normalization would lose scientific meaning, block Apply and show exact warning/diff. An explicit user confirmation may strip *nonessential unsupported markup* but must not silently approve destruction of data-bearing scientific nodes.
- Changing visual ↔ HTML Source must not overwrite edits made while another tab saves; version guard when applying and proper dirty state. Audit invalidation and revision checkpoints must happen on committed saves.
- **Fix existing editor sync length heuristic:** `components/editor/article-tiptap-editor.tsx` only calls `editor.commands.setContent` for external updates if HTML length difference is more than 4 chars. Two distinct strings of equal length can be missed. Implement edit-aware semantic identity/baseline-based synchronization without causing focus loss or dirty draft overwrite.
- Word, Google Docs and Markdown paste must be loss-aware, safe, preserve scientific units/Greek/sup/sub/tables and warn on unsupported nodes; use fixtures instead of assuming regex-only clipboard cleaning is complete.

### P1-E. Finish science editor behavior/accessibility — SRS-ED-002/003/004/009/010/011, UX-002

- Existing title textarea and style/symbol/align controls are implemented; verify actual behavior at **390×844, 1024×768, 1440×900**, light/dark, 90/120/160 character titles, sole rendered H1 and body H2/H3-only policy.
- Find/Replace currently has Replace Next and Replace All but may select **first occurrence rather than current match**; implement true Find Next / Previous with caret/selection-aware highlighting, explicit match count, case sensitivity where useful, undo semantics and protection of atomic citation/math nodes.
- Fix keyboard focus trap, return focus from popovers/modals, meaningful accessible names and whether shortcuts are Mac/Windows correct. Existing symbols are acceptable; no needless expansion.
- Preserve the design system and existing working buttons.

### P1-F. SEO freshness/report integrity and review evidence — SRS-SEO-001/002/003, SRS-REV-001, AI-001

- Keep merged fingerprint engine `lib/audit/run-article-audit.ts`; wire persisted reports, computed live reports, stale/current badges across SEO Center, article inspector and per-article SEO route; verify linked source/media change in a **second tab** invalidates stored report and old Quick Fix.
- Fresh re-audit must persist before showing saved success. No fake ranking scores, verified DOI/network claims or externally indexed status.
- Complete appropriate reviewer approval/revision trail behavior and user-visible warnings for incomplete scientific evidence; ensure changes do not invalidate authoritative transaction checks.
- Unconnected AI assistant provider must remain honestly labeled; maintain local deterministic proposals and explicit human Apply/Reject. No new external AI API or tokens without approval.

### P2. Remaining backlog tasks — cover, don't fabricate

At completion, create a *task-ID-by-task-ID* evidence ledger for **all original 51 IDs** in `docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md`, including SRS-SEC-001/002, TEST-002/003/004, CODE-001/002 and the finished Codex baseline. Also account for any IDs introduced only in the later playbook (`SRS-INT-004/005`, `SRS-PUB-004`, `SRS-AI-002`) as `UNREGISTERED/NEEDS PRODUCT DECISION` rather than silently counting them as approved tasks.

Implement all *safe, local, practical* remaining features supported by current framework and acceptance matrix. For things requiring backend accounts, hosted services, commercial licences or a new product architecture, report **BLOCKED — REQUIRES OWNER AUTHORIZATION**, not `COMPLETED`. Specifically:
- `SRS-ROLE-001` real server authorization requires a server identity/permissions design; demo role switcher is not security.
- `SRS-MED-003` Cloudflare R2/Images require connection + credentials.
- `SRS-INT-001/002/003` Google Search Console, GA4/Ads/Tag Manager and provider connections require explicit owner approval, tokens and privacy plan.
- `SRS-FUT-001/002/003` multi-format bibliography, live collaboration, paid DOCX/OMML are optional; basic local citations *are* required, but no purchase/service activation without approval.
- `SRS-UX-001` sweeping multi-thousand-line refactor is NOT prerequisite. `SRS-TEST-005` performance may be benchmarked locally, but don't extrapolate to cloud production.

Do not write `DONE` for every future/optional ID as an easy substitute for a clearly enumerated residual list.

## 3. Mandatory end-to-end QA matrix

**Minimum goal:** Before calling S0–S7 COMPLETE, verify the full original committed E2E baseline (**28 cases on the last pre-Google-AI integrated branch**) PLUS new tests for genuinely new features. Respect the actual current test count; do not artificially target 28 if current suite grows.

| QA route / case | Checks required | Persistence/security oracle |
| --- | --- | --- |
| Editor mount, formatting, code | Link/Underline no duplicate warnings, block style, code block, sup/sub, align, undo, keyboard | Tiptap JSON + saved sanitized HTML after reload |
| Table insertion and controls | Empty 3×3 grid; row/column context persistent; keyboard, border visibility, caption, mobile overflow | Number/cell layout after edit, save, reload and revision |
| Math create/edit | Inline, display, nested fractions, broken TeX, unsafe macro, cancel/edit | Raw TeX identity and properly rendered math after source/reload |
| Citation order | Insert two + repeated source, reorder, remove linked source | Stable sourceId, regenerated bibliography, reload and restore |
| Figure upload | Upload licensed PNG, intentionally missing rights, restart same isolated browser context | Actual decoded pixel equality, no invented license, audit stale |
| HTML source + paste | Valid science nodes, unsupported widget, script canary, Markdown #, Word/Docs HTML | Schema diff/guard, no XSS, content survives 2 round-trips |
| Concurrency | Two tabs, same-tab in-flight edit, stale Quick Fix, stale restore, entity add/delete | Actual `root_snapshot_v1` after abort/release/reload |
| Publishing and SEO | Author Draft→Scheduled rejected, approved Editor only, DST gap/overlap, stale source DOI | Version/status and audit receipt after transaction/reload |
| Responsive/accessibility | 390/1024/1440 widths, both themes, modal focus, screen reader labels | No page overflow / keyboard dead ends / HTML mutation |
| Backup/import/reset | Valid/invalid versioned backup, retained media, queued writes, empty list | Complete restored bytes/metadata and no unexpected reseed |

**Test commands** (use scripts in current `package.json`): 
```bash
bun install --frozen-lockfile
bun run test:unit
bun run typecheck
bun run lint
bun run build
bun run test:e2e:install
bun run test:e2e
```
Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only for an actually existing executable. `playwright.config.ts` uses port 4175 and 2 workers; don't overlap suites on same machine. Avoid ports 3000/3100. Isolated disposable Brave/Chromium contexts; no production/personal user data; preserve failure traces. If remote CI is unavailable, report precise environment limitation. Manual click-through of one editor screen is NOT equivalent to passing the suite.

**Science fixtures:** exact symbols µ, ±, α, β, Δ, ≤, ≥, H₂O / CO₂, 10⁻⁶, p = 0.003, DOI `10.1038/s41586-024-00000-0` (clearly **synthetic, not verified**), Greek/Turkish titles, equation `\frac{a+b}{c}` and a malicious inert marker test. Never present fabricated references or specimen data as real clinical outcomes.

## 4. Delivery/parallelism policy — no unnecessary iteration

- Owner explicitly **permits one substantial execution run** across multiple tasks, rather than forcing a response/pause after every S0–S7 slice. Use internal recoverable checkpoints, deterministic tests and one final integrated QA review.
- Prioritize data contracts → schema/renderer dependencies → editor behavior → regression → report. Parallel isolated work only when ownership doesn't overlap; do not let separate agents concurrently overwrite `lib/studio-context.tsx` or `components/editor/article-tiptap-editor.tsx`.
- Do not begin a new generic architecture audit. Investigate concrete issues with code evidence, reproduce when possible, repair, retest. Respect user-visible demo styling and independent editor research hold.
- Do not implement wholesale editor replacement or imitate Filament's backend. Filament's rich editor also uses Tiptap; the quality problem may be extension configuration and interaction design rather than engine choice.
- Do not claim completion merely by changing checkboxes in `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md`.

## 5. Google AI ↔ owner reporting protocol (repo-local)

The owner's preference: if the agent has substantial additional evidence, blockers, architectural recommendations or screenshots, **write them as optional files**, not as an overlong end-of-chat summary. Use `docs/google-ai-reports/README.md`.

At minimum update the **existing implementation ledger** accurately and create **one consolidated run report** at `docs/google-ai-reports/COMPLETION_AUDIT.md` containing:
- exact imported base SHA, current/exported SHA, whether GitHub `main` was actually updated;
- every original task ID and evidence-based status `VERIFIED / IMPLEMENTED-NOT-E2E-VERIFIED / PARTIAL / BLOCKED / DEFERRED`;
- modified files per task group, key behavior and before/after failure evidence;
- exact test commands, exit codes, unit/E2E counts, browser screenshots or trace locations, security cases, and failed/blocked gates;
- unsolved reproducible bugs and concrete priorities, without falsely marking them DONE.

Only write additional documents (`BUGS.md`, `ARCHITECTURE_NOTES.md`, `TEST_EVIDENCE.md`, `DECISIONS.md`) **when they contain substantive evidence**. Don't generate empty/template filler files. Do not commit sensitive logs, real research records, secrets, screenshots with private data or large transient screenshots/artifacts.

## 6. Exact completion condition

The current Google AI delivery's `READY` status is **not accepted as full S0–S7 completion yet**. The goal is to finish all feasible local remaining features, verify them, clearly separate authorization-gated future work and sync the actual source.

Only declare `READY` for a bounded tested result if:
1. the imported baseline and any GitHub synchronization are exact and verified;
2. no known critical false-save, data-loss, XSS, source/fingerprint or invalid publishing path is left unaddressed;
3. all prior regression tests plus all material new feature tests pass on the **same exact final code revision**;
4. editor UX correctness (including tables and code blocks) is at least usable, without premature framework replacement;
5. unresolved external-service-dependent work is explicitly labeled `BLOCKED / OWNER DECISION`, not hidden under `COMPLETE`;
6. an accurate report exists at `docs/google-ai-reports/COMPLETION_AUDIT.md`.

If a gate fails, report `REQUIRES REPAIR` and show evidence. **Continue working in the imported repository; do not reset, clone an older main, or replace the current source**. Keep scientificradar.com and production systems untouched.
