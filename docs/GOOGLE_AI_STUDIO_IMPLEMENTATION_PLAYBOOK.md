# ScientificRadar Studio — Google AI Studio / Antigravity Implementation Playbook

**Document type:** Self-contained implementation brief and acceptance contract for a repository imported into Google AI Studio's own workspace or sandbox.  
**Status:** Owner-requested handoff; this document specifies work, it does **not** certify implementation of pending tasks.  
**Snapshot verified:** 2026-11-01, GitHub `main` at commit `6039acc23e8aefcf7f79a7380531d8a247fdc4ce`.  
**Repository:** `Centaurioun/scientificradar-studio`.  
**How to use:** Read this file **from the local imported repository**. No GitHub Pull Request, GitHub Issue, prior chat, live connector, or external link is required to understand the assigned work.

> **START HERE — AGENT EXECUTION INSTRUCTION**
>
> You are improving the **existing** ScientificRadar Studio application, NOT creating another application or rewriting it. Treat this file as the operational brief for the imported local checkout. Read and examine actual local source before writing code. Record the exact loaded repository commit and compare it with the baseline above. Preserve completed security and persistence repairs. Work through the numbered delivery slices and their acceptance tests; do not claim a slice is finished until actual tests and application behavior confirm it. Give the owner a progress report after each meaningful slice. If your sandbox cannot push to GitHub, export the changed files/patch and a complete test report; **never imply that sandbox changes automatically reached GitHub**.

---

## 0. Purpose and priorities

The owner wants two outcomes:

1. **Finish genuine remaining reliability gaps** in the existing prototype without restarting endless generic audits, particularly the outstanding application-wide durable mutation contract described in Section 5 below.
2. **Implement the previously designed NEW scientific publishing features** (mathematics, scientific tables, figure insertion, citations, HTML body-source editing, standard text tools, better paste, usability and related editorial functions) using Google AI Studio / Antigravity. These features were *planned*, not completed by the preceding Codex repair work.

The preceding development work deliberately stopped after merging its existing approved changes. **Do not repeat those repairs**. This document transfers both the remaining targeted fixes and the detailed product feature requirements into the files that a sandbox importer will actually read.

**Execution priority:** P0 trust/durability dependencies before dependent persistence features; independent low-risk editor/UX changes may be completed as separately tested slices. Do not demand completion of every long-term, optional integration before building the planned editor features. Keep changes small, reversible, attributable and independently verifiable.

**Not a production release instruction:** `scientificradar.com` and all actual publishing infrastructure remain untouched. The local “Publish (Demo)” workflow is not authorization to publish publicly.

## 1. Read order inside the imported repository

Begin with these actual relative file paths; do **not** assume they are present in a partial import. If any file is absent, report it and work only from verified materials.

1. **This file** — current handoff, execution sequence, technical requirements and open work.
2. `docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md` — canonical registry of **51 stable task IDs** (49 original plus two separately established CODE tasks). **Historical status cells are from before the completed repairs**; use Section 4 here for the current effective status.
3. `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` — foundational product vision, users, visual system, scientific publishing constraints.
4. `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md` — approved SEO, locale/time, editorial checks, publishing and revision rules.
5. `docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md` — in-depth scientific editor and body-only HTML mode specification. This specification predates PR-B security and PR-G1 extension repairs; **do not reimplement or replace completed components**.
6. `docs/TESTING.md` — actual Bun, build and browser setup and regression map.
7. `docs/SCIENTIFICRADAR_STUDIO_RUNTIME_VERIFICATION_AUDIT.md` and `docs/SCIENTIFICRADAR_STUDIO_CODE_ARCHITECTURE_SECOND_OPINION.md` — historical evidence, **not** present-day defect status.
8. Source under `app/`, `components/`, `lib/` and `tests/e2e/`, especially the files listed below.

Resolve contradictory older comments in favor of **actual current source + current tests + this updated handoff**. A source-based historical audit is not evidence that a defect remains after a verified fix.

## 2. What exists today — architecture and verified baseline

| Area | Actual location / contract | Preserve |
| --- | --- | --- |
| App | Next.js 15 App Router; React 19; TypeScript; Tailwind v4 | Existing routes, responsive editorial UI, dark/light modes |
| Editor | `components/editor/article-tiptap-editor.tsx`; `components/editor/article-workspace.tsx`; Tiptap 3 | Existing Link/Underline deduplication, editor callbacks, undo/redo, selection |
| Types and data | `lib/types.ts`, `lib/studio-context.tsx`, `lib/studio-persistence.ts`, `lib/seed-data.ts` | Existing `Article`, `ScientificSource`, `MediaAsset`, `ArticleRevision`; historical snapshot compatibility |
| Local persistence | IndexedDB database `scientificradar-studio-p0-db`, store `studio_state`, key `root_snapshot_v1`; monotonic `storageRevision` | Storage-authoritative transaction commit before success acknowledgment on covered article operations |
| HTML security | `lib/html-security.ts`, `lib/editorial-rules.ts`, `lib/backup-validation.ts` | Parser-based DOMPurify allowlist, Zod backup validation, H1 demotion, safe display |
| Audit | `lib/audit/run-article-audit.ts`; `lib/audit/publish-policy.ts`; `lib/audit/types.ts` | Deterministic linked source/media fingerprint, safe/stale Quick Fix rejection, honest local checks |
| Primary UI | `app/articles/`, `app/pages/`, `app/seo/`, `app/review/`, `app/calendar/`, `app/revisions/`, `app/media/`, `app/settings/` | Existing navigation and truthful demo-only state |
| Test harness | `lib/*.test.ts`, `tests/e2e/*.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml` | Bun frozen install, source security and cross-tab regressions, isolated Chromium |

**Completed and merged before handoff, with bounded test evidence:**

- **PR-A (historical #7):** Bun/Playwright/CI test foundation.
- **PR-B (historical #8):** Parser-based HTML trust boundary, import validation, source/render sanitization; historical injected `img onerror` test no longer executes on tested paths.
- **PR-C (historical #9):** Article-focused transactional and version-aware persistence; cross-tab stale article saves, in-flight autosave races, stale SEO Quick Fix proposals, revision restoration, article duplication/deletion, and stored-vs-in-memory SEO audit receipts tested. **Not an application-wide durable-CRUD certification.**
- **PR-F1 (historical #13):** Expanded and canonicalized linked SEO source/media fingerprint inputs.
- **PR-G1 (historical #12):** Removed Tiptap StarterKit duplicate Link/Underline registrations while preserving standalone configured marks.
- **Master Backlog v2 (historical #6):** Merged documentation-only task registry.

The final accepted G1 integration workflow passed **28/28 managed Chromium E2E tests**, unit/static/build checks and GitGuardian on its tested branch head; the final `main` is the merge commit cited at top. This is **not** proof that all features below exist or that a production website is secure.

**Old closed/not merged proposals:** historical PR #1 (UTC-only draft, old and not validated) and ImgBot PR #2 (binary audit evidence edits) are **not part of the accepted source**. Do not cherry-pick them or undo working date/time handling on speculation.

## 3. Hard requirements that every implementation slice must preserve

1. **Scientific authorship:** The human writes and approves the article. Do not invent research results, authors, citations, DOI registration, ethics approval, source verification, figures, licences, or numerical values. AI may *suggest* changes with a human Apply/Reject decision and a recoverable diff.
2. **Manuscript integrity:** Preserve UTF-8 / Turkish / Greek / Unicode, numbers, units, quotation marks, equations, Tiptap JSON, sanitized `bodyHtml`, sources, citations, media metadata and revision history. No invisible dropping of unsupported nodes.
3. **Sole H1:** Article title is the only rendered `<h1>`. Body editor permits paragraphs, H2 and H3; pasted body H1 is explicitly demoted to H2. Keep title and body content separate.
4. **Safe HTML:** Never treat user-supplied HTML as trusted. Use existing DOMPurify-based policy and validate it at paste, source Apply, import, save, revision restore and preview boundaries. No regex-only security gate, executable content, arbitrary iframe/SVG/MathML, unsafe URL, script/event handler or unapproved remote media.
5. **Real persistence:** A “Saved (Local)” or “Restored” receipt for persisted content requires a completed IndexedDB transaction; a computed report or optimistic React update is not durable. Abort/conflict must preserve the user's unsaved draft.
6. **Cross-tab correctness:** The latest committed snapshot is authoritative. A stale tab must not silently overwrite another tab's acknowledged manuscript edit; version/expected-value checks belong inside the transaction.
7. **Demo-only publishing:** Existing role switcher is a simulation, not server-side security. Local published/scheduled states do not deploy an article. Keep `noindex` safeguards and explicit integration-disconnected labels.
8. **Visual continuity:** Keep restrained teal + neutral editorial styling, wide writing canvas, serif article heading, existing sidebars, light/dark themes and professional scientific newsroom feel. Avoid redesigning into a sales/CRM or colorful dashboard.
9. **Safety and cost:** No production connection, DNS, real user database, Cloudflare R2, analytics/advertising/SEO providers, API keys, server RBAC or paid conversion product without explicit owner authorization. Never silently upload local article content to external services.
10. **Regressions:** Maintain all established tests. Failed tests are reasons to diagnose, not to weaken assertions, suppress errors, rewrite test baselines or falsely declare success.

## 4. Current task registry — original 51 IDs, effective handoff state

This is a **current scoped status overlay**; it does not erase the historical backlog. `DONE (bounded)` means the specific stated repair passed relevant prior tests, not that its larger parent capability is production-ready. `PARTIAL` means remaining acceptance is explicitly listed. `NEW` means planned work absent or not sufficiently implemented. `DEFER` requires separate permission or product decision.

| IDs | Effective handoff state | Google AI action |
| --- | --- | --- |
| `SRS-TEST-001` | DONE (test foundation) | Preserve frozen Bun and CI; extend tests for newly added functions |
| `SRS-SEC-001`, `SRS-SEC-002` | DONE (tested HTML/import boundaries) | Preserve sanitizer/schema and add regression cases when adding new source/math/figure renderers |
| `SRS-TEST-003` | PARTIAL (adversarial tests exist) | Extend for each new content format rather than redoing PR-B |
| `SRS-DATA-001`, `SRS-DATA-002` | DONE for covered article paths | Preserve current transactional and stale-save guarantees; see next row |
| `SRS-DATA-003` | PARTIAL — **Section 5 is mandatory** | Complete supporting-entity receipts, stable IDs, reset/import ordering |
| `SRS-ED-001` | DONE (duplicate Link/Underline) | Never reinstall the same extension twice |
| `SRS-SEO-001` | PARTIAL (pure fingerprint fixed) | Wire freshness consistently through stored reports and views; Section 6.5 |
| `SRS-PUB-001`, `SRS-PUB-002` | OPEN (known calendar bypass) | Shared role/status/persisted policy and real negative browser tests |
| `SRS-MED-001` | OPEN (known binary durability defect) | Store actual bytes/handles; no persistent bare blob URL |
| `SRS-HTML-002` | OPEN/PARTIAL | Canonical Tiptap JSON/HTML contract and lossless supported round-trips |
| `SRS-DATE-001` | UNVERIFIED full matrix | Preserve working TZ tests; test hydration/DST, no speculative UTC-only rewrite |
| `SRS-ED-002`, `SRS-ED-003` | OPEN | One body style selector; long title safely wraps at all required widths |
| `SRS-ED-004`, `SRS-ED-005` | NEW | Alignment, sup/sub; scientific tables/captions |
| `SRS-ED-006`, `SRS-ED-007`, `SRS-ED-008` | PARTIAL/OPEN | Formatting controls; real figure insert; loss-aware Word/Docs/Markdown paste |
| `SRS-ED-009`, `SRS-ED-010`, `SRS-ED-011` | NEW/UNVERIFIED | Manuscript find-replace; scientific symbols; accessible shortcuts/selection |
| `SRS-HTML-003`, `SRS-HTML-001` | NEW | Safe body-only HTML inspector; then validated editable source Apply/Discard |
| `SRS-MATH-001`, `SRS-MATH-002` | NEW | Tiptap inline/block LaTeX, KaTeX, edit dialog, accessible fallback |
| `SRS-SEO-002`, `SRS-SEO-003` | OPEN | Severity/guidance parity; canonical/structured-data contract, demo-safe |
| `SRS-MED-002` | OPEN | Figure caption, credit, licence, alt, non-crop positioning/rights |
| `SRS-MED-003` | DEFER | Cloudflare R2: only with separate authorization |
| `SRS-SCI-001`, `SRS-SCI-002` | OPEN | DOI syntax vs verification; stable source-linked citation marks and numbering |
| `SRS-REV-001` | PARTIAL | Durable restoration implemented for covered article operation; broader reviewer approvals/corrections pending |
| `SRS-ROLE-001` | DEFER | Real server authorization: production project only |
| `SRS-AI-001` | PARTIAL | Human-approved local suggestions and honest AI disconnection; no fabricated claims |
| `SRS-UX-001` | DEFER | Refactor oversized components only against measured tests, not a prerequisite for features |
| `SRS-UX-002`, `SRS-UX-003` | UNVERIFIED | Keyboard/modal/screen reader QA; dashboard/navigation correctness |
| `SRS-INT-001`, `SRS-INT-002`, `SRS-INT-003` | DEFER | Provider inventory, Google analytics/ads and Codex sign-in only with authorization |
| `SRS-TEST-002`, `SRS-TEST-004`, `SRS-TEST-005` | OPEN/DEFER by scope | Add behavior tests, timezone/mobile/a11y gates, measured performance profiling |
| `SRS-FUT-001`, `SRS-FUT-002`, `SRS-FUT-003` | DEFER | Multi-style bibliography, collaboration, paid DOCX/OMML import only after demand and authorization |
| `SRS-CODE-001` | OPEN, source-confirmed | Preserve intentional empty article list instead of re-seeding it on reload |
| `SRS-CODE-002` | OPEN, source-confirmed | Validate / replace missing sample figure with attributed safe fixture |

**No duplicate IDs:** Runtime identifiers `SRS-RT-001..008` refer to original audit evidence, not additional tasks. **Known fixed subset:** RT-001 duplicate extensions; RT-003 stale article overwrite; RT-005 imported HTML execution tested sink; RT-007 stale Quick Fix. **Known unresolved:** RT-002 publishing bypass, RT-004 media URL durability, RT-006 report freshness integration, RT-008 title clipping.

## 5. Critical remaining data-integrity assignment — complete SRS-DATA-003

The next agent must be able to implement this **without opening a GitHub issue**. This section embeds the outstanding technical requirements previously documented separately as an issue.

### 5.1 Proven source-level weakness

In `lib/studio-context.tsx`, the generic `updateState` currently:

1. Applies an updater optimistically to `stateRef.current`, immediately updating React.
2. Queues a later IndexedDB read-modify-write mutation with the **same** updater against the latest persisted snapshot.
3. Does not make most supporting-entity callers await and inspect the durable result.
4. In some failed writes may leave the UI looking updated although no durable commit happened.

This is distinct from the **covered article-specific** transactional operations, which already await commit.

**Additional source-level hazards (verify with tests before claiming runtime failure):**

- Entity creators `addCategory`, `addTag`, `saveSeries`, `saveAuthor`, `saveSource`, `saveKnowledgeLink` and `addMediaAsset` generate IDs, timestamps or result objects *inside the replayed updater*. Optimistic returned ID/slug and committed ID/slug can disagree, especially when `Date.now()` or `Math.random()` executes twice.
- `deletePage`, `deleteCategory`, `deleteTag`, `updateSource`, `deleteSource`, `updateMediaAsset`, `deleteMediaAsset`, `updateHomepageBlocks`, `updateMenus` and navigation/date-time preferences expose void or optimistic behavior without a consistent durability receipt.
- `deleteSource` mutates article `sourceIds` as well as source entities. Determine effects on article version, existing editor drafts, audit freshness and citation anchors.
- `importSnapshotJson` replaces the root record; `resetDemoDatabase` calls `persistState(seed)`. Test whether pending same-tab writes or stale tabs can silently recreate removed content, undo an import or reset revision tracking.
- Intentionally empty collections may be reseeded on reload. This is separately tracked as `SRS-CODE-001`, but must not invalidate data guarantees.

### 5.2 Target transaction and receipt contract

Prefer the existing `commitSnapshotMutation` in `lib/studio-persistence.ts` over creating another unrelated repository implementation. The helper begins an IndexedDB `readwrite` transaction, loads the current root record, applies a **synchronous pure mutation**, writes it, awaits `tx.done`, then returns the committed snapshot, result and storage revision.

Suggested discriminated receipt shape (DESIGN EXAMPLE — adapt to actual code, do not blindly paste):

```ts
type DurableResult<T> =
  | { ok: true; value: T; storageRevision: number; durable: true }
  | { ok: false; reason: 'conflict' | 'not_found' | 'aborted' | 'unavailable' | 'validation'; message: string };

type EntityWriteIntent<T> = {
  id: string;                 // created once, before optimistic and durable stages
  expectedVersion?: number;   // required for versioned content
  input: T;                   // immutable snapshot of user's intent
};
```

**Design rule:** Generate an ID **once per user intent**, not inside a function called twice. A safe adaptation can prepare an immutable intent, then transactionally apply it to the latest stored snapshot. Only after the transaction commits may callers display “saved” or return a durable entity. Existing `commitSnapshotMutation` is an available building block, not blanket proof that every caller uses it correctly.

Illustrative flow (PSEUDOCODE; current context helpers and types must be verified):

```ts
async function saveSupportingEntity(intent: EntityWriteIntent<SourceInput>) {
  const db = await getDb();
  if (!db) return { ok: false, reason: 'unavailable', message: 'Not saved' };

  try {
    const committed = await commitSnapshotMutation(
      db, STORE_NAME, STATE_KEY, getInitialSeedSnapshot(),
      (latest) => {
        // Do not perform await, random-ID generation, network calls or side effects here.
        const next = upsertSourcePurely(latest, intent);
        return { snapshot: next, result: next.sources.find(s => s.id === intent.id) };
      },
    );
    // Only here is a durable success justified.
    publishCommittedState(committed.snapshot);
    return { ok: true, durable: true, value: committed.result,
             storageRevision: committed.storageRevision };
  } catch (error) {
    keepUnsavedUserIntent(intent);
    return { ok: false, reason: 'aborted', message: 'Storage failed; changes not saved' };
  }
}
```

Never copy this illustration wholesale if it would fight the existing component lifecycle or introduce a second concurrent mutation queue. Keep transaction mutators synchronous and deterministic. Do not rely on BroadcastChannel, `stateRef`, an in-memory mutex or a UI timestamp as the only protection against a second tab.

### 5.3 Required tests — controlled browser storage, not mocked success

Add targeted **red-before-green** unit and Playwright cases:

1. **Tag / source / media identity:** create an entity while the first IndexedDB transaction is held; confirm that the identity shown to the caller equals `root_snapshot_v1` after commit and reload. Verify no duplicate ID, timestamp or slug from updater replay.
2. **Abort:** inject a real transaction abort; UI must not show a durable success; existing storage must remain intact, and user-provided changes must be recoverable.
3. **Cross-tab independent fields:** Tab A saves an article or source; Tab B changes a preference from a stale snapshot; both committed fields remain after both reload.
4. **Source linkage:** delete/update a scientific source linked to an article; preserve unrelated sources, apply explicit link/version/audit semantics, and reject a stale article draft if the content identity changed.
5. **Preferences/navigation:** save/abort/reload results must match the user-visible outcome.
6. **Reset/import race:** hold a pending write, initiate explicit reset or backup import, release operations in controlled order, and verify no stale replay silently resurrects deleted data. Keep the existing valid-backup schema and sanitization unchanged.
7. **Historical/empty state:** a valid intentionally empty list remains empty after reload; first-run seed still loads on a truly missing record; invalid/corrupt backup follows explicit error flow.
8. **No regressions:** retain cross-tab save, Quick Fix, revision restore, duplicate/delete, SEO audit receipt, XSS canary, and safe backup tests.

**Done only when:** all relevant UI callers expose truthful commit/failure states; records read back from actual IndexedDB agree with receipts; expected revisions advance without stale snapshot overwrite; full reload confirms data; and relevant negative tests execute and pass.

### 5.4 How to scope this without uncontrolled expansion

Treat this as a **single bounded reliability slice or several tightly dependent sub-slices**. Do not start an all-app rewrite. If some supporting-entity screens are not yet wired to the new contract, label them `PARTIAL` with exact paths and preserve the task as open. If the local imported snapshot lacks the already-merged persistence helper, stop and synchronize the correct repo snapshot instead of replacing it with a new implementation.

## 6. Planned NEW scientific editing and publishing features

Each subsection below is an **implementation assignment** with acceptance requirements, not merely an idea. Refer to the v5/v6 specs for UI detail, but the essentials are included here.

### 6.1 Core editor ergonomics — SRS-ED-002/003/006/010/011

**Target:** `components/editor/article-tiptap-editor.tsx` and minimal relevant title/UI components; `components/editor/article-workspace.tsx` for the title field and dirty-state integration.

- Replace redundant paragraph/H2/H3 buttons with one accessible style selector containing **Paragraph, H2, H3**. Do not offer body H1.
- Make the article title an **auto-growing, full-width textarea** retaining a single logical line. Normalize entered/newline pasted whitespace without dropping Greek letters, µ, ± or numerical notation. The rendered title stays one `<h1>`.
- Add/verify horizontal rule, inline code, code block and selection-only clear formatting; preserve undo, link edits and canonical HTML.
- Add an insert-at-caret scientific Unicode menu: `± µ Δ α β γ ≤ ≥ × − →` (real characters, not lossy substitutions).
- Keyboard: accurately show Mac `⌘` and Windows/Linux `Ctrl` shortcuts, correct `aria-pressed`/labels and focus return; no toolbar traps.
- Responsive: titles of **90/120/160 characters** wrap at **390×844**, **1024×768**, and **1440×900** in both themes. The editor should not cause page-wide horizontal scrolling.

**Accept:** editor DOM behavior, title save/reload, screenshot/viewport assertions and no duplicate Link/Underline warnings. Existing Link/Underline standalone extensions from the merged fix must remain configured once.

### 6.2 Text alignment and scientific sup/sub — SRS-ED-004

- Offer left/center/right/justify explicitly; default prose should not be forcibly justified.
- Add compatible Tiptap 3 Superscript and Subscript marks. Where marks conflict, remove the opposing mark or show a predictable rule.
- Preserve semantic `<sup>`/`<sub>` and alignment across visual editor, sanitized HTML, article preview, revision restore and HTML source mode.
- **Security design:** Existing HTML sanitizer does **not** allow arbitrary `style` attributes. Introduce a narrow, validated structural alignment representation or explicit trusted mapping; do NOT simply add `style` to the global HTML allowlist.

Illustrative scientific fixtures:

```html
<p>CO<sub>2</sub> was measured at 10<sup>−6</sup> mol/L.</p>
<p>Water is H<sub>2</sub>O; area is m<sup>2</sup>.</p>
```

Tiptap API illustration (verify installed extension package/API before using it):

```ts
TextAlign.configure({
  types: ['paragraph', 'heading'],
  alignments: ['left', 'center', 'right', 'justify'],
});
```

**Accept:** semantic marks survive save→reload→preview→revision and conflicting marks do not corrupt adjacent text.

### 6.3 Scientific tables — SRS-ED-005 and canonical SRS-HTML-002

Create real table nodes and controls, not toolbar decoration.

- Insert bounded table (reasonable default 3×3); header row toggle; add/delete row/column; delete table; optional merge/split only when correctly supported.
- Preserve precise scientific numbers, decimal points, negative exponents, significant figures, special symbols, and column ordering.
- Support semantic `<table>`, `<thead>`/`<tbody>` where appropriate, `<tr>`, `<th scope="col">`, `<td>`, and an optional caption by a supported schema extension or controlled adjacent metadata.
- Table must scroll **inside its own container** at 390px; the entire article page must not overflow horizontally.
- Unsupported pasted HTML must not silently destroy cells or captions; compare canonical Tiptap JSON/HTML before applying source changes.

**Acceptance fixture:** a 4-column table including `p = 0.003`, `10⁻⁶`, `α = 0.05` and `95% CI` survives editor→save→reload→preview→revision→source without data or cell loss. Keyboard focus reaches each table control.

### 6.4 Scientific mathematics / LaTeX — SRS-MATH-001/002

Implement inline and block mathematical constructs using a **verified compatible** Tiptap 3 mathematics extension and KaTeX, or an equally safe open-source approach. Verify actual package APIs from installed versions/official documentation rather than guessing.

- Store the **raw TeX string** as canonical node attribute; do not use KaTeX-generated HTML as the only persisted data.
- Inline expression example: `E = mc^2`; display example: `\frac{a+b}{c}`.
- Add **Insert Equation**, inline/block selection, edit existing TeX, cancel/apply, live bounded preview and visible parse-error feedback.
- Protect the current caret/selection and nearby content when editing an equation.
- Keep rendering safe with an explicit KaTeX `trust: false` policy, no arbitrary HTML, no remote image macros and no untrusted script execution.
- Preserve TeX through JSON/HTML representation, preview, backup/export, version history and reload. If the existing DOMPurify policy strips math output, **do not loosen it globally**; either render safe math directly from trusted structured nodes or create narrowly scoped verified serialization with raw TeX.
- Provide accessible source text or math description/fallback for assistive technology. Equations should scroll or wrap safely on mobile without clipping.

Suggested canonical model (adapt to schema):

```ts
type ScientificMathAttrs = {
  latex: string;                       // canonical user-entered TeX
  displayMode: 'inline' | 'block';
  accessibilityLabel?: string;         // optional editor-provided wording
};
```

**Acceptance fixtures:** valid `E=mc^2` and `\frac{a+b}{c}`; invalid `\frac{a}{` must show an error without destroying the old equation; malicious HTML-like TeX must remain inert; repeated edit/source/reload/revision preserves raw TeX byte-for-byte unless the editor explicitly approves normalization.

### 6.5 SEO report freshness / scientific provenance — SRS-SEO-001/002/003 and SRS-SCI-001

The merged F1 calculates a deterministic linked-entity fingerprint in `lib/audit/run-article-audit.ts`; **do not rebuild it**.

Complete the missing application-level freshness wiring:

1. Treat a persisted audit report as current **only if its stored fingerprint matches** the fingerprint of the current persisted article and linked media/source inputs.
2. Changing linked source title/DOI/verification, or figure title/filename/caption/alt/rights, where audit-relevant, marks the old report **stale**.
3. A fresh re-audit updates storage only after commit; stale status clears after actual reload.
4. SEO Center, article SEO detail and editor inspector show consistent stale/current counts and guidance.
5. An older Quick Fix proposal is rejected transactionally if the persisted article or relevant linked inputs differ. Never revert newer title/summary.
6. DOI **syntax valid** is not equal to **DOI registered**; a URL or a filled form field is not external verification. Human claim signoff is separate from metadata checks.
7. Avoid unverified “Google ranking score” or fabricated analytics. SEO severity recommendations should be explicitly advisory.

**Acceptance test:** modify a linked source DOI in another tab; after reload the report shows stale; run and durably save a fresh audit; report becomes current; the old Quick Fix cannot write; no scientific source is fabricated.

### 6.6 Real manuscript figure insertion + media byte durability — SRS-MED-001/002, SRS-ED-007

**Known defect:** old browser runtime audit showed a persisted media record with a `blob:` URL whose actual uploaded pixels disappeared after a same-profile browser restart.

- Store media bytes in an appropriate durable IndexedDB object store, or an explicitly approved durable local storage mechanism. A `blob:` object URL is **temporary view state**, not a permanent storage pointer.
- Keep stable media ID and metadata separate from transient display URL; create/revoke object URLs according to component lifecycle. Handle quota/transaction failures honestly.
- Insert a chosen Media Library asset into the manuscript at the selected caret using the supported Tiptap schema.
- Preserve figure identity, caption, alt text, credit, licence, source URL, and scientific diagram non-crop/contain/locked positioning. No invented default licence or source attribution on genuinely uploaded content.
- Define backup/export behavior for media bytes (explicitly include verified assets or clearly state when bytes are excluded); never falsely claim complete backups that only store transient URLs.
- Show meaningful missing-asset error when bytes or rights are absent.

**Acceptance:** upload a disposable licensed PNG, insert it, save and reload, close/restart the **same disposable profile**, reopen article and verify actual decoded pixel content and identical alt/caption/licence. Test quota exhaustion, missing asset, deletion and backup restore.

### 6.7 Scientific citations / source linking — SRS-SCI-002; future SRS-FUT-001

- Provide **Insert Citation** from existing `ScientificSource` records (source ID, not just free-form formatted text).
- Use stable source-linked inline markers so reordering text or removing an unrelated source does not irreversibly break anchors.
- Generate local, deterministic bibliography numbering for the selected article when supported; never manufacture DOIs, journal titles, authors, year, page numbers or claim verification.
- Editing a source must mark affected reports stale and not overwrite concurrent article changes.
- Deleting a cited source should warn about affected anchors and offer a non-destructive review flow rather than silently leaving false references.
- Vancouver/APA/advanced footnotes are **deferred enhancements**, after basic stable citation linking and explicit owner approval.

**Acceptance:** insert two sources, reorder their citation appearance, update one source's metadata, save/reload/restore; anchors and bibliography remain consistent and all human-provided source fields are unchanged.

### 6.8 Body-only HTML Source and safe inspector — SRS-HTML-003 then SRS-HTML-001

The owner explicitly wants HTML for **the manuscript body**, **not** the entire application shell or page source.

**First ship a read-only escaped inspector** showing sanitized body-only HTML with copy support. Then add editable `Visual | HTML Source` mode when round-trip tests prove safety.

Editable source mode must:

1. Snapshot current WYSIWYG body, Tiptap JSON, selection and article base version.
2. Keep a separate source draft buffer; incomplete HTML must **not** autosave.
3. Display accessible monospace source editor with `Validate`, `Copy`, `Apply Changes`, `Discard`, and `Back to Visual`.
4. Parse/sanitize using existing security module; validate supported node nesting and URLs, body H1→H2, registered local media and math/citation schema.
5. Convert into **the same Tiptap extension schema** as visual mode and serialize back to HTML.
6. Perform semantic comparison of required elements/attributes: reject silent loss of `sup/sub`, tables, citations, math TeX, figure metadata, nested lists, links, important numbers or unsupported nodes. Show a human-readable warning or diff.
7. Apply only on explicit approval, mark dirty, invalidate old audit fingerprint and use the existing durable save/version contract. Reject stale source edits rather than overwriting another tab.
8. Escape code displayed in the inspector; never execute raw source in `dangerouslySetInnerHTML` before sanitization.

Illustrative source-session contract (not a replacement for actual types):

```ts
type BodySourceSession = {
  baselineArticleVersion: number;
  baselineHtml: string;
  draftHtml: string;           // user may type invalid/incomplete HTML here
  dirty: boolean;
  validationErrors: string[];
};
```

**Acceptance:** visual→source→visual→save→reload→preview→revision→source preserves all supported scientific content; invalid markup never runs; Apply is blocked when nodes would disappear; Discard restores unchanged visual content.

### 6.9 Word / Google Docs / Markdown paste — SRS-ED-008

- Ingest clipboard `text/html` only after sanitization and editor-schema validation. Preserve supported headings H2/H3, lists, bold/italics, links, source references, tables, sup/sub and Greek characters.
- Markdown `#` becomes body H2 with a visible notice; preserve scientific numbers and Unicode.
- Unsupported or structurally lossy content produces a clear warning and non-destructive fallback (e.g., sanitized plain text), not silent truncation.
- No paid DOCX converter is required to support ordinary clipboard paste; file-based DOCX/OMML conversion remains deferred.

**Acceptance:** fixtures from word processor rich HTML, Google Docs and Markdown; compare supported semantic output after save, reload and preview, including DOI links, table values, units and subscripts.

### 6.10 Manuscript Find/Replace — SRS-ED-009

- Search is scoped to current manuscript body, not sidebar, page shell or metadata.
- Find next/previous with focus and selection preservation; replace selected occurrence or all only after explicit action; support accurate Unicode case handling.
- Undo/redo must reverse replacements. Never silently replace a research term across citations/equations without context checks.
- No automatic scientific rewriting.

**Acceptance:** find and selectively replace a phrase while another copy exists in figure alt/citation or article title; only selected body occurrences change, and undo restores previous text.

### 6.11 Editorial policy / review, accessibility, and UI — SRS-PUB-001/002, REV/UX/TEST

**Known publishing bypass:** earlier Calendar allowed an Author demo role to transition Draft→Scheduled despite shared editor gate restrictions. Fix by enforcing a single role/status/readiness policy in the actual durable transition path across Calendar, Editor and Review Queue. Hide or disable impossible actions in UI **and** reject them in the domain operation; do not treat disabled buttons as authorization enforcement.

- Test all role/status pairs: owner/editor/author/reviewer against idea/draft/in_review/revision_requested/approved/scheduled/published/archived. Only valid approved, reviewed, saved content may schedule in the demo; exact policy must match v5's rule definitions.
- Require a valid future local wall time with explicit IANA time zone conversion to stored ISO UTC instant. Test DST overlap/gap and 12/24-hour views. Do not force old PR #1's UTC-only approach.
- Reviewer decisions and correction trail must preserve identity/note/version semantics; protect pending dirty editor work.
- Accessibility tests cover focus containment/return, keyboard navigation, screen reader announcements, contrast where measurable, and 390px responsive usage.
- Preserve homepage/menu/dashboard current features and taxonomy; no CRM-like redesign.
- `SRS-CODE-002`: if a sample scientific figure references a missing file, use an actually bundled, provenance-safe fixture and add an existence test. Do not invent publication rights.

## 7. Implementation slices, dependencies and merge order

These slices deliberately separate **repair gates** from **new feature delivery** while staying in the same imported AI Studio project. Do not implement the entire roadmap as one giant unreviewable code diff.

| Slice | Priority | Task IDs | Minimum outcome / checkpoint |
| --- | --- | --- | --- |
| **S0 — Sandbox baseline & test readiness** | First, no feature rewrite | `SRS-TEST-001` | Confirm imported commit, source files, existing 28 browser scenarios, baseline typecheck/lint/build; report missing tools honestly |
| **S1 — Supporting-entity durability** | P0 before new persistent scientific schema | `SRS-DATA-003`, `SRS-CODE-001` | Stable IDs + awaited durable receipts; abort/cross-tab/empty snapshot/reset-import fixtures in Section 5 |
| **S2 — Publishing and media primitives** | P0 before real new figures/publishing | `SRS-PUB-001/002`, `SRS-MED-001`, `SRS-DATE-001` | Shared publish policy; real media pixel durability; existing date matrix remains good |
| **S3 — Canonical body / safe editor UX** | P1, may start independently if no shared file collision | `SRS-HTML-002`, `SRS-ED-002/003/006/010/011` | Lossless supported body schema; long title; toolbar, symbols, shortcuts |
| **S4 — Core new science tools** | P1 after S1 + S3 schema gate | `SRS-ED-004/005`, `SRS-MATH-001/002` | Alignment, sup/sub, tables, inline/block math; full content round-trip |
| **S5 — Scientific figures and references** | P1 after media/schema gate | `SRS-ED-007`, `SRS-MED-002`, `SRS-SCI-001/002` | Real figures with rights + stable linked citations |
| **S6 — HTML source / imports / editing quality** | P1 after S4/S5 node support | `SRS-HTML-003/001`, `SRS-ED-008/009` | Safe editable body-only HTML, paste fidelity, Find/Replace |
| **S7 — SEO/review and quality coherence** | P1; some pure checks parallelizable | `SRS-SEO-001/002/003`, `SRS-REV-001`, `SRS-AI-001`, `SRS-UX-002/003`, `SRS-TEST-002/003/004`, `SRS-CODE-002` | Durable freshness, truthful evidence, review receipts, responsive/accessibility checks |
| **S8 — optional later work** | DEFER | `SRS-ROLE-001`, `SRS-MED-003`, `SRS-INT-001/002/003`, `SRS-UX-001`, `SRS-TEST-005`, `SRS-FUT-001/002/003` | Authorization, budget, production privacy/cost plan required before starting |

**Parallelism policy:** A low-risk toolbar/title-only slice may proceed alongside source-level data repairs **only with exclusive file ownership**. The giant `lib/studio-context.tsx` and `components/editor/article-workspace.tsx` must not be edited simultaneously by agents with divergent schema contracts. If Google AI Studio offers only a single sandbox state, work sequentially there and commit stable checkpoints.

**First useful implementation milestone:** complete S0, then the smallest valid S1 supporting-entity durability vertical slice. At each milestone the user should be able to see a working changed interface, a test artifact and an exact list of what remains; do not claim that all S1 is done merely because one Tag test passes.

## 8. Commands and browser verification inside the sandbox

Follow the actual `package.json` and `docs/TESTING.md`; do not copy the older README's outdated `npm test` counts.

```sh
bun install --frozen-lockfile
bun run test:unit
bun run typecheck
bun run lint
bun run build
bun run test:e2e:install
bun run test:e2e
```

Baseline CI pinned Bun 1.4.0 and Node.js 26.13.0; the committed Playwright package is 1.64.1. Use the existing dependency lockfile, do not upgrade framework/dependencies wholesale. If the sandbox lacks Bun, Playwright browser download capability or system permissions, report the exact missing gate and do not pretend the command passed.

**Local Playwright details:** `playwright.config.ts` and test server currently use `127.0.0.1:4175`. Do not run two suites concurrently on the same port; do not use ports 3000 or 3100. Use isolated disposable Chromium/Brave contexts, never the owner's personal browser profile. Abort outbound requests in test browsers; do not access production. Test the viewport pairs 390×844, 1024×768, 1440×900 as specified. Preserve screenshots/traces and meaningful diagnostics on failure.

**Security canary:** test with a harmless local-only marker; no external endpoint, credential access or real XSS payload delivery. Confirm the marker does not execute in imported static-page and article previews or source mode.

**Coverage baseline:** The previous integrated G1 PR head's **28 Playwright cases passed** on hosted Chromium (after inclusion of its own Tiptap case). A sandbox importer must confirm its own current baseline rather than silently inheriting this number as proof.

**Incremental gates:** each slice must run focused RED/GREEN tests, then all relevant unit/typecheck/lint/build, and the full E2E suite whenever content serialization, persistence, HTML, media, routes or editorial workflows change. An existing single `<img>` lint warning was tolerated in prior CI, but no new lint errors/warnings should be introduced.

## 9. Code review / security checklist for every slice

Before calling a slice DONE, explicitly answer:

- Which exact task IDs? What was missing before? Which local source functions/files actually changed?
- Does the proposed schema parse **existing historic IndexedDB snapshots**, or do users need a tested migration?
- Are generated IDs stable across optimistic display and committed data, and are receipts truly post-`tx.done`?
- Can two tabs or a delayed older save overwrite current manuscript content?
- Can failed save, transaction abort, quota failure or offline/memory-only fallback deceptively show `Saved`?
- Can any pasted/imported HTML, equation, media URL or source preview execute active content?
- Does the Tiptap node survive editor↔preview↔HTML source↔save↔reload↔revision↔backup/export?
- Are exact scientific text and numbers preserved? Are DOI syntax, human checking and actual remote verification clearly different?
- Are role/publishing restrictions checked in the domain/persistence layer, not just disabled buttons?
- Does the work preserve visual design, responsive layout, keyboard behavior and source attribution?
- Was the test executed in the actual sandbox? Which commands and test counts? Which gates were blocked and why?
- Is there any unapproved production or external provider contact? If yes, stop and request owner authorization.

## 10. How to return sandbox changes to GitHub — essential

**Google AI Studio may import source into its OWN isolated workspace.** This means editing files there does **not automatically update** the GitHub repository. Avoid loss and false completion:

1. **At start:** record local repository HEAD or imported source revision, the timestamp and whether Git is functional. Check whether this playbook exists inside `docs/`. If it does not, this imported snapshot is incomplete/stale; do not assume any later fixes were loaded.
2. **During work:** preserve existing source files and their exact relative paths. Commit each working tested slice locally if Git is available. If Git cannot commit, preserve a complete change set rather than relying on chat transcript.
3. **At export:** use Google AI Studio's actual GitHub integration, if installed and authorized, to push a branch/commit; otherwise export a zip of changed source **plus tests and any lockfile**, or a valid unified patch against the recorded base revision. Name exact changed files and commit IDs. Never claim GitHub was updated without verifying it.
4. **Before import/merge back:** compare the exported base with latest remote `main`. Integrate divergent commits without deleting unrelated code, run required tests again, and never force-push or overwrite user's checkout.
5. **Keep documentation current:** update the **implementation ledger in Section 11** with verified status, not mere intention. Save/export the updated playbook with changed code.
6. **After transfer:** the owner or reviewer should verify changed files, browser behavior and CI on the exact integrated revision. Only then mark a slice `DONE`.

If the imported project appears to be a React-only replica or lacks `lib/studio-persistence.ts`/`lib/html-security.ts`, **stop implementation and replace the imported snapshot with the current repository**, not a guessed rebuild.

## 11. Implementation ledger — update after each actual delivery

The entries below are *planned*; they are NOT checked off merely because this document exists.

| Delivery | Status at handoff | Actual files / local commit or export | Evidence and next blocker |
| --- | --- | --- | --- |
| S0 import / baseline | NOT STARTED in Google AI sandbox | — | Confirm imported SHA and runnable tools |
| S1 durable supporting entities | NOT STARTED | — | Section 5, actual IndexedDB identity/abort tests |
| S2 publish / media foundations | NOT STARTED | — | Role matrix and restarted-profile pixels |
| S3 canonical editor UX | NOT STARTED | — | H1/title, toolbar, formatting regression |
| S4 tables / math / sup-sub | NOT STARTED | — | Supported schema and lossless roundtrip |
| S5 figures / citations | NOT STARTED | — | Asset rights, source identity and anchors |
| S6 HTML source / paste / search | NOT STARTED | — | Sanitizer + semantic diff + safe Apply |
| S7 SEO, workflows, accessibility | NOT STARTED | — | Cross-tab audit freshness, role/human evidence |
| S8 optional connections | DEFERRED / NO AUTHORIZATION | — | Explicit separate owner signoff |

**Per-slice report template:**

```text
ScientificRadar Studio — S[NUMBER] / SRS-[TASK-ID]
Imported baseline: <exact local commit/revision>
Changed files: <relative paths>
Implementation: <real behavior change, no marketing description>
Regression reproduced first: <yes/no and evidence>
Unit/typecheck/lint/build: <commands, exit codes, test count>
Browser: <engine, viewport, isolated profile, exact tests>
Durable state: <IndexedDB/preview/reload result>
Security/compatibility: <sanitizer and migration checks>
Remaining blockers: <named IDs, no invented closure>
GitHub synchronized? <verified branch/SHA, or explicitly NO>
Recommendation: READY / REQUIRES REPAIR / BLOCKED
```

## 12. Immediate execution request to the receiving AI agent

**Do not answer with another long generic audit or a rewritten feature brainstorm.** Start from the imported code:

1. Identify the imported `main` revision and read this playbook plus v5/v6 specs.
2. Run the baseline checks possible in the sandbox, recording exact results.
3. Inspect `lib/studio-context.tsx:updateState` and its supporting-entity callers; implement and test the smallest safe **S1 durability slice** with a post-transaction receipt and stable identity. Retain current article/version/HTML contracts.
4. If the owner explicitly selects an independent **new scientific editor feature** first, implement that chosen slice instead, following its dependencies and tests; do not spend a new research phase recreating the 51-task plan.
5. At the end of that slice, show the functioning UI path, exact files, tests, open items and how to export the changes to GitHub. Continue subsequent slices only from an accepted stable checkpoint.

**Owner acceptance rule:** New functionality is valuable only if existing scientific articles, citations, equations, security gates and acknowledged saves cannot be silently damaged by it.

---

### Internal references bundled with the repository

- `docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md` — 51 task IDs and historic acceptance wording.
- `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md` — time/SEO/editorial workflow details.
- `docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md` — detailed editor UX and safe source-mode model.
- `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` — product vision and publication isolation.
- `docs/TESTING.md` — existing commands, real suite and prior evidence.
- `docs/SCIENTIFICRADAR_STUDIO_RUNTIME_VERIFICATION_AUDIT.md` — dated baseline failure reproduction; do not confuse old results with current code.

This file intentionally describes the remaining Issue #14 data work **within the document**; no access to the GitHub issue or PR system is required to act on it.
