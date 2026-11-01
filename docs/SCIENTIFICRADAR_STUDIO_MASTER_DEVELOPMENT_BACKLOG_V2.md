# ScientificRadar Studio — Master Development Backlog v2.0 (Proposed)

**Status:** OWNER REVIEW / PLANNING ONLY — no implementation authorization or production sign-off.  
**Generated against `main`:** `0a26268503008aab78437ef4186c05ffa1a43123` (2026-11-01, Europe/Istanbul).  
**Implementation code baseline for all audits:** `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d` (audits and merge commits are documentation-only).  
**Task registry:** 49 original stable IDs preserved verbatim + 2 independently identified new tasks = **51 explicitly tracked tasks**. The `SRS-RT-*`, `SRS-UXA-*`, and `SRS-UXB-*` audit identifiers are evidence/proposal links, **not** duplicate implementation tickets.

> This is the proposed successor plan. The original [49-task Development Backlog](SCIENTIFICRADAR_STUDIO_DEVELOPMENT_BACKLOG.md) is unchanged and remains an historical audit snapshot. All inherited implementation/workflow statuses in Section 8 are copied exactly, not silently promoted to Done. Current runtime evidence and recommended *execution order* are tracked separately in this document. Do not infer product acceptance from successful tests of isolated subsets.

## 1. Consolidated evidence and audit closure

| Source | Merged report | Evidentiary weight |
|---|---|---|
| First independent technical audit | [Independent Audit](SCIENTIFICRADAR_STUDIO_INDEPENDENT_AUDIT.md) and [original backlog](SCIENTIFICRADAR_STUDIO_DEVELOPMENT_BACKLOG.md) | Source/specification review; initial 49 tasks; not itself a runtime proof |
| Independent UX Phase 1 | [UI/UX Audit](SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT.md) | Genuine but limited preview screenshots; UX recommendations labeled as verified or speculative |
| UX Phase 2 | [Phase 2 Audit](SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT_PHASE2.md) | Further screenshots and partial interactions; some exact viewport/focus tests were outstanding at the time |
| Independent architecture second opinion | [Code Architecture Second Opinion](SCIENTIFICRADAR_STUDIO_CODE_ARCHITECTURE_SECOND_OPINION.md) | Independent source-based evidence, counterevidence, two genuinely new tasks |
| Real Brave + isolated Playwright execution | [Runtime Verification Audit](SCIENTIFICRADAR_STUDIO_RUNTIME_VERIFICATION_AUDIT.md) and [evidence](audits/scientificradar-runtime/20261101-final-brave/) | 12 scenarios: **4 PASS / 8 FAIL / 0 BLOCKED**; PASS/FAIL is limited to actual exercised conditions; **partial verification**, not production acceptance |

The audit PRs [#3](https://github.com/Centaurioun/scientificradar-studio/pull/3), [#5](https://github.com/Centaurioun/scientificradar-studio/pull/5), and [#4](https://github.com/Centaurioun/scientificradar-studio/pull/4) have been merged as **documentation only**. The app source was not repaired by those merges. Retain all genuine failures as open until implementation and fresh regression evidence are reviewed.

**Scope guard:** the current application is a locally stored editorial CMS prototype. Demo role controls do not certify real identity/authorization, and no production publication or third-party integration is authorized. The renderer/SEO outputs do not constitute external scientific or indexing validation.

## 2. Authoritative runtime acceptance ledger (12 scenarios)

| Scenario | Final audit result | Interpretation / linked implementation work |
|---|---|---|
| RT-01 — Pinned toolchain, tests, typecheck, lint, build | **PASS (qualified)** | Bun 1.4.0 frozen install, 14 tests, TS, lint and Next build succeeded; manifest `npm test` calls undeclared `tsx` and CI is not established. Keep `SRS-TEST-001` open. |
| RT-02 — Tiptap initialization warnings | **FAIL** | `SRS-RT-001`: duplicate `link` and `underline` warnings on editor mount. Implement `SRS-ED-001`; warning is **not** proof of text loss. |
| RT-03 — Basic editor save/reopen | **PASS (tested subset)** | Stable-ID article preserves tested H2/H3/strong/emphasis/list/blockquote. Sup/sub remain an unimplemented feature; `SRS-HTML-002`, `SRS-ED-004` remain open. |
| RT-04 — Simulated save failure receipt | **PASS (controlled QA path)** | UI reports non-persistence, preserves prior stored summary. Does not cover delayed writes, crash, retries or recovery; `SRS-DATA-001/003` remain open. |
| RT-05 — Concurrent edits | **FAIL** | `SRS-RT-003`: two same-origin stale tabs show `Saved (Local)`, but later write reverts previously saved title (twice reproduced). `SRS-DATA-001/002/003`. |
| RT-06 — Media restart durability | **FAIL** | `SRS-RT-004`: IndexedDB record retains `blob:` URL but uploaded pixels fail to load after same-profile Brave restart. `SRS-MED-001`. |
| RT-07 — Forbidden editorial-role transition | **FAIL** | `SRS-RT-002`: Author demo role can schedule Draft through Calendar. `SRS-PUB-002/001` (not proof of production RBAC). |
| RT-08 — Calendar shared policy | **FAIL** | Same `SRS-RT-002`: Draft→Scheduled bypass persists after reload. Do not create another duplicate bug task. `SRS-PUB-001/002`. |
| RT-09 — HTML/import/preview trust boundary | **FAIL** | `SRS-RT-005`: local static-page preview executes an inert `img onerror` canary imported through backup. Article preview and Smart Knowledge Links tested inputs were inert; other paths not certified. `SRS-SEC-001/002`, `SRS-TEST-003`. |
| RT-10 — SEO freshness/Quick Fix | **FAIL** | `SRS-RT-006`: stale report after linked metadata update and re-audit; `SRS-RT-007`: stale Quick Fix overwrites newly saved second-tab title/summary. `SRS-SEO-001`, `SRS-DATA-002/003`, `SRS-AI-001`. |
| RT-11 — Time-zone/DST/hydration | **PASS (tested matrix)** | UTC, Europe/Istanbul, New York, 12/24h and selected DST cases worked; one transient mismatch was not reproduced in 36 retries. `SRS-DATE-001` remains a broader acceptance gate, **not a proven current P0 bug**. |
| RT-12 — Measured responsive UX | **FAIL** | `SRS-RT-008`: long H1 clips at exact 390×844 and in desktop title area; 18 route/viewport checks found no general page-wide horizontal overflow. `SRS-ED-003`, `SRS-TEST-004`. Article-list action worked through horizontal scrolling; **do not file an unproven row-action defect**. |

**Important distinction:** the eight scenario FAIL entries reduce to eight `SRS-RT-001…008` evidence IDs, some sharing a root cause. No audit ID is automatically a new development task. **Release readiness: NOT APPROVED.**

## 3. Non-negotiable development invariants

1. **Preserve scientific content.** Any acknowledged save, revision, media upload or Quick Fix must be durable or explicitly labeled volatile/failed. Never silently discard or rewrite manuscript text, raw TeX, references, figure metadata or Unicode.
2. **Enforce trust boundaries on entry and display.** Import, paste, source HTML, static/reader preview and knowledge links must reject or safely sanitize untrusted inputs while round-tripping allowed scientific content. Avoid unsafe regex-only security gates.
3. **Centralize editorial transition policy.** Author/Reviewer/Editor/Owner demo paths and Calendar/Editor/Review Queue must use the same state/role/blocker logic and awaited persistence. Real server RBAC is separately scoped for a future production release.
4. **Treat cross-tab state as untrusted/stale.** Use storage-level version-aware transaction/concurrency handling or explicit conflict detection; a per-tab React snapshot is insufficient.
5. **Keep the existing architecture where feasible.** Preserve Next.js/React/Tiptap and the teal/neutral dual-theme, serif article heading, sidebar and visible scientific media rights metadata. No speculative framework replacement.
6. **No external production side effects.** No Cloudflare R2, Google Search Console, GA4, AdSense, GTM, paid services or live credentials without separate explicit authorization.
7. **Regression before closure.** A source diff, passing build, screenshot, or CI badge alone cannot set a task to Done. Require relevant browser/system-level negative and reload tests with exact SHA and a reviewer.
8. **Isolation.** Use distinct Codex worktrees; do not modify the owner's personal Brave data or existing IndexedDB. Use Bun frozen lockfile; do not use uncontrolled `npx --yes`. Never use local ports 3000 or 3100.

## 4. Prioritized implementation waves

Execution should be organized as **small independent PRs** with stable task IDs, explicit acceptance gates, and no automatic merging. Priorities here reflect new runtime evidence; original table statuses below are left as historical snapshots.

| Wave | Implementation scope | Concrete failure to eliminate | Gate before next dependent work |
|---|---|---|---|
| **W0 — Test foundation** | `SRS-TEST-001` plus focused `SRS-TEST-002/003` fixtures | Incomplete reproducible test launcher/CI and lack of committed browser regressions | Frozen Bun install; declared/pinned test runner; unit/typecheck/lint/build + isolated Playwright/Brave tests reproducible locally and in authorized CI |
| **W1 — HTML trust boundary (P0)** | `SRS-SEC-001`, `SRS-SEC-002`, `SRS-TEST-003` | **RT-09 / SRS-RT-005** event handler executed in static page preview | Inert `onerror`, SVG, disallowed URL and import canaries cannot execute in *any* tested sink; valid allowed manuscript/figure markup round-trips; failed import rolls back |
| **W2 — Durable, conflict-safe editing (P0)** | `SRS-DATA-001`, `SRS-DATA-002`, `SRS-DATA-003`; protect Quick Fix as part of same transaction contract | **RT-05 / SRS-RT-003** two-tab overwrite; **RT-10 / SRS-RT-007** stale Quick Fix reverts newer work | Two tabs and delayed/reordered writes never silently lose newer acknowledged fields; stale proposal rejected or explicitly reconciled; real write failure/retry/reopen receipts are honest |
| **W3 — Shared publishing policy (P0)** | `SRS-PUB-002` then `SRS-PUB-001` | **RT-07/08 / SRS-RT-002** Draft and Author scheduling bypass | Draft→Scheduled rejected; Author and Reviewer cannot schedule; approved Editor/Owner transitions only if all gates pass; reload confirms rejected state unchanged |
| **W4 — Durable media (P0)** | `SRS-MED-001`; integrate with `SRS-DATA-001` storage model | **RT-06 / SRS-RT-004** persisted `blob:` URL points to missing bytes | Upload image in isolated profile, close/reopen same profile, verify actual pixels and alt/caption metadata; quota/failure honest; backup policy explicit |
| **W5 — SEO validity and source integrity (P1, P0 for stale-write path)** | `SRS-SEO-001`, `SRS-SEO-002`; `SRS-AI-001` suggestion receipt guard; `SRS-CODE-001` | **RT-10 / SRS-RT-006** stale fingerprint, misleading reports; existing assistant body-change handling; empty-snapshot bootstrap risk | Linked media/source changes deterministically mark audit stale and fresh re-audit clears stale; Quick Fix cannot overwrite other tab; true empty collection stays empty after restart |
| **W6 — Core editor + layout (P1)** | `SRS-ED-001/002/003`, `SRS-UX-002`, `SRS-TEST-004`; `SRS-UXB-002` folded into `SRS-SEO-002` criteria | **RT-02 / SRS-RT-001** duplicate extensions; **RT-12 / SRS-RT-008** clipped title | Zero duplicate warnings after mount/reload; Link/Underline still work; titles 90/120/160 chars wrap at exact 390/1024/1440; no regression to editor caret, focus or sole H1 |
| **W7 — Canonical science content** | `SRS-HTML-002`, `SRS-ED-004/005/006/007/008`, `SRS-MATH-001/002`, `SRS-HTML-003/001`, `SRS-SCI-002`, `SRS-MED-002` | Feature gaps; scientific formula/table/figure/source loss risk | Structured content and raw LaTeX survive edit→save→reload→preview→revision→export; all imported HTML passes W1 trust boundary; editor approval retained |
| **W8 — Broader workflow/optional** | `SRS-SCI-001`, `SRS-REV-001`, `SRS-ED-009/010/011`, `SRS-UX-003`, `SRS-CODE-002` | Scientific provenance and usability polish | Per-task fixture and human editorial acceptance; missing bundled example asset replaced with attribution-safe fixture |
| **Deferred / separately authorized** | `SRS-ROLE-001`, `SRS-MED-003`, `SRS-INT-001/002/003`, `SRS-FUT-001/002/003`, speculative performance refactors | Production RBAC, cloud providers, paid conversions, collaborative editing | Explicit product/owner authorization, threat model, cost and roll-back plan before connecting any service |

**Dependency clarification:** W0 establishes the *minimum* test framework; W1 and W2 can be developed in parallel on separate worktrees only after their shared contracts are agreed. W2 durable receipts precede W3/W4 final acceptance. W5 Quick Fix stale-write safety is **P0 within W2**, even if broader SEO calibration remains P1. W6 independent low-risk UI fixes may start in parallel after test isolation, but must not delay P0 gates. Scientific features in W7 are valuable and approved product requirements; they are postponed, not removed.

## 5. First implementation PR packages and exact acceptance contracts

**PR-A — Test harness / `SRS-TEST-001`.** Establish pinned Bun/Playwright or equivalent test-only tooling with no uncontrolled package resolution. Replace or safely pin the undeclared `tsx` test launcher in an approved code PR. Record `bun install --frozen-lockfile`, test count, typecheck/lint/build, browser version and source SHA; integrate actionable CI, not a decorative badge. Do not close W0 simply because 14 tests passed once.

**PR-B — HTML security / `SRS-SEC-001/002`.** Add schema/allowlist sanitizer at all trust boundaries; test backup imported page `img onerror`, unsafe URL, SVG and event attributes, plus valid scientific tables/links/images. Negative canary must not execute in preview or source; failed import cannot corrupt existing snapshot. No hidden production credentials.

**PR-C — Concurrency / `SRS-DATA-001/002/003`.** Define durable storage contract; make writes awaited/version-checked at the persistence boundary (not just the current tab). Reproduce and then eliminate `SRS-RT-003` with two same-origin tabs; reproduce and eliminate stale Quick Fix `SRS-RT-007`. On conflict show a user-recoverable choice; never display a false durable Saved status.

**PR-D — Publishing / `SRS-PUB-002/001`.** Route Calendar, Editor and Review through common `canTransitionStatus` / publishing policy and awaited mutation. Tests cover Draft, in_review, approved, scheduled, published, roles, dirty/failed save, blocked SEO, future scheduling, and state after reload. No external publication.

**PR-E — Media / `SRS-MED-001`.** Store real binary or approved durable handle; reference assets by stable ID, not persistent object URL. Same-profile restart renders pixel data; revoke temporary URLs; fixture licence/attribution and backup/restore behavior explicit.

**PR-F — SEO / `SRS-SEO-001` + source and Quick Fix acceptance.** Linked source/media mutations invalidate the fingerprint in a reproducible manner; re-audit is fresh; editor/overview/detail counts match; stale proposal is rejected transactionally. Preserve distinction between external verification and local deterministic checks.

**PR-G — Editor/UX / `SRS-ED-001/003`.** Deduplicate Link/Underline, retain functionality; multiline 160-character scientific title wraps without input loss at exact viewport sizes in both themes; preserve selected editor text/caret and metadata inspector behavior.

**Review discipline:** one or two related mechanisms per PR; source regression first when feasible; peer review and CI after changes; no merge on failures, unexpected bundle/lock change, production contact, or unapproved dependency addition.

## 6. UX decision register — do not create duplicate tickets

| Audit proposal | Disposition in v2 |
|---|---|
| `SRS-UXA-001`, `SRS-UXB-001` | **Adopt as `SRS-ED-003` acceptance**; runtime H1 clipping is confirmed (`SRS-RT-008`). |
| `SRS-UXA-002` | **Extend `SRS-ED-002`**; toolbar grouping is conditional on measured space, not an unconditional redesign. |
| `SRS-UXA-003` | **Evaluate in `SRS-UX-002/SRS-ED-002`**; inspector already collapses manually; drawer proposal only if measured breakpoints warrant it. |
| `SRS-UXA-004` | **Reject as a confirmed defect**: horizontal scroll action was successfully exercised; improve discoverability only with further UX evidence. |
| `SRS-UXA-005` | **Do not deduplicate audit events blindly**; first distinguish repeated seed noise from distinct legitimate events within `SRS-UX-003`. |
| `SRS-UXA-006` | **Extend `SRS-ED-007/SRS-MED-002`**; preserve editor cursor and media rights metadata. |
| `SRS-UXA-007` | **Existing function, verify focus** in `SRS-SEO-002/SRS-UX-002`; source navigation already exists. |
| `SRS-UXA-008`, `SRS-UXA-009` | **Extend `SRS-UX-002/SRS-TEST-004`**; keyboard/contrast verification, no unsupported WCAG compliance claim. |
| `SRS-UXA-010`, `SRS-UXB-004` | **Do not initiate another general audit**; attach remaining scenarios to E2E and actual feature acceptance tests. |
| `SRS-UXB-002` | **Fold into `SRS-SEO-002` acceptance**: passed checks without applicable guidance render no blank guidance panel. |
| `SRS-UXB-003` | **Fold into `SRS-PUB-001`**: ineligible calendar statuses disabled or rejected with an explanation; verified policy bypass is already tracked. |

Preserve the present teal/neutral surfaces, light/dark themes, serif article title, grouped navigation, text-supported state labels and visible alt/caption/source/licence/crop controls unless demonstrated user harm or a necessary accessibility correction warrants change.

## 7. New independent tasks (two only)

| ID | New task | Priority | Depends on | Owner-review acceptance |
|---|---|---|---|---|
| **SRS-CODE-001** | Distinguish valid intentionally empty stored article collection from missing/first-run database | **P1** | `SRS-TEST-002`; coordinate with `SRS-SEC-002` import schema | Fresh profile seeds demo; deleting final article then reopening remains empty; importing a valid empty list remains empty; corrupt snapshot follows explicit recovery; no unrelated reset |
| **SRS-CODE-002** | Replace missing bundled scientific sample figure with valid, appropriately attributed fixture | **P2** | `SRS-ED-007` / test fixture availability | Referenced static asset exists and loads in editor and reader after refresh; alt/caption/rights are not fabricated; automated asset existence check |

Both are **source-confirmed**, not independently browser-reproduced. Their source details and counterevidence are in [Second Opinion §17](SCIENTIFICRADAR_STUDIO_CODE_ARCHITECTURE_SECOND_OPINION.md). Neither is a replacement for existing `SRS-DATA-*`, `SRS-MED-*`, or `SRS-SEC-*` work.

## 8. All 49 original tasks — exact historical rows, stable IDs

These are imported *verbatim* from the original backlog. Their `Implementation Status`, `Priority`, `Workflow Status` and `Dependencies` reflect the source-audit snapshot, **not a current execution-verified workflow**. The evidence and stage overlays above govern proposed execution; change these rows only in an approved implementation PR after acceptance.

### Critical Fixes & Reliability

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-TEST-001 | Deterministic tests, dependency pinning, CI gates | Testing | Partially Implemented | P0 | Ready | None | CI runs unit, typecheck, lint and production build using pinned tooling; report exits; no application feature changes in audit. |
| SRS-SEC-001 | Replace regex HTML trust boundary | Security | Partially Implemented | P0 | Blocked | SRS-TEST-001 | Allowlist sanitizer blocks adversarial SVG/event/URL payloads at paste, save, import and render; supported content roundtrips. |
| SRS-SEC-002 | Validate and safely restore imported snapshots | Reliability | Partially Implemented | P0 | Blocked | SRS-SEC-001; SRS-TEST-001 | Malformed/oversize/schema-invalid backups rejected unchanged; HTML sanitized; rollback and version migration tested. |
| SRS-DATA-001 | Await and serialize all durable store mutations | Persistence | Partially Implemented | P0 | Ready | SRS-TEST-001 | Delayed A/B writes persist latest B after restart; no success indication on failed IndexedDB put. |
| SRS-DATA-002 | Protect concurrent editor edits from lost updates | Persistence | Partially Implemented | P0 | Blocked | SRS-DATA-001 | Out-of-order autosaves and two-tab conflicts never silently overwrite newer manuscript text; user receives recovery choice. |
| SRS-DATA-003 | Unify mutation receipts with durable revision claims | Persistence | Partially Implemented | P0 | Blocked | SRS-DATA-001 | Publish, quick fix, review and import report success only after durable confirmation; simulated failure leaves prior snapshot intact. |
| SRS-MED-001 | Persist uploaded media bytes or explicitly disable durability | Media | Partially Implemented | P0 | Ready | SRS-TEST-001 | Uploaded PNG remains viewable after new browser session; quota failure shown; Blob URLs revoked; backup policy explicit. |
| SRS-PUB-001 | Enforce workflow gates when scheduling | Publishing | Partially Implemented | P0 | Blocked | SRS-PUB-002; SRS-DATA-001 | Draft/reviewer unauthorized schedule rejected; approved editor schedules only after checks; durable ISO and DST roundtrip. |
| SRS-PUB-002 | Pass real role, status and save state to publish gate | Publishing | Partially Implemented | P0 | Ready | SRS-TEST-001 | Modal and transition agree for every role/status; unsaved and error states block; overrides recorded. |
| SRS-HTML-002 | Canonical body content and preview parity | Data Integrity | Partially Implemented | P0 | Blocked | SRS-SEC-001; SRS-TEST-001 | Title H1 invariant and all supported block/inline types survive edit, save, reload, preview and restore; no stale body JSON. |
| SRS-DATE-001 | Hydration, zone and DST regression gate including PR #1 review | Date/Time | Partially Implemented | P0 | Blocked | SRS-TEST-001 | No hydration warnings on UTC/Türkiye/US profiles; DST overlap/gap and 12/24h roundtrips; PR #1 remains unmerged until independently reconciled. |

### Rich Text Editor

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-ED-001 | Deduplicate bundled Link and Underline Tiptap extensions | Editor | Partially Implemented | P1 | Ready | SRS-TEST-001 | Unique extension names; zero duplicate warnings; existing underline and link behavior persists. |
| SRS-ED-002 | Unify heading selector and responsive toolbar | UX | Partially Implemented | P1 | Ready | SRS-ED-001 | Single Paragraph/H2/H3 selector, no duplicated labels; keyboard accessible; controlled overflow at 390/1024/1440px. |
| SRS-ED-003 | Auto-growing long article title field | UX | Partially Implemented | P1 | Ready | SRS-TEST-001 | 120+ char title wraps on mobile without clipping; newlines normalized; Greek characters and sole rendered H1 preserved. |
| SRS-ED-004 | Alignment, superscript and subscript | Editor | Missing | P1 | Blocked | SRS-HTML-002; SRS-ED-001 | Four alignments and semantic sup/sub persist through WYSIWYG, source, preview and reload; conflicting marks handled. |
| SRS-ED-005 | Accessible scientific tables and captions | Editor | Missing | P1 | Blocked | SRS-HTML-002; SRS-ED-001 | Header cells, numeric precision, optional caption and bounded insert/edit; only table scrolls on 390px; restore is lossless. |
| SRS-ED-006 | Horizontal rule, inline code, code block and clear formatting | Editor | Partially Implemented | P1 | Ready | SRS-ED-001 | Each control edits intended selection/block only and survives save, preview, source, undo/redo. |
| SRS-ED-007 | Enable actual article-body scientific figure insertion | Editor | Partially Implemented | P1 | Blocked | SRS-MED-001; SRS-HTML-002 | Figure button opens media chooser; trusted asset ID, alt/caption and non-crop layout survive reload/preview. |
| SRS-ED-008 | Word, Google Docs and Markdown paste fidelity | Editor | Partially Implemented | P1 | Blocked | SRS-SEC-001; SRS-HTML-002 | Fixture content (nested lists, sup/sub, tables, DOI links, headings) either survives or produces explicit non-destructive warning. |
| SRS-ED-009 | Find and Replace inside manuscript | Editor | Missing | P1 | Backlog | SRS-ED-001 | Find next/previous, selected/all controlled replace; exact Unicode; no edits outside body; undo supported. |
| SRS-ED-010 | Scientific character insertion menu | Editor | Missing | P2 | Backlog | SRS-ED-002 | Insert ± µ Δ α β γ ≤ ≥ × and minus at caret without corrupting selection; keyboard accessible. |
| SRS-ED-011 | Toolbar shortcut/selection accessibility audit | Accessibility | Unverified | P1 | Blocked | SRS-ED-002; SRS-TEST-002 | Active/disabled states announced by screen reader; shortcut hints accurate on Mac/Windows; no toolbar keyboard trap. |

### HTML Source & Security

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-HTML-003 | Safe read-only body HTML inspector | HTML | Missing | P1 | Blocked | SRS-SEC-001 | Escaped body HTML can be viewed/copied without execution, editing or changing dirty state; no surrounding page shell. |
| SRS-HTML-001 | Editable body-only HTML source with Apply/Discard | HTML | Missing | P1 | Blocked | SRS-SEC-001; SRS-HTML-002; SRS-HTML-003 | Invalid or unsupported source cannot silently apply; approved source roundtrips, preserves equations and revisions; changes mark dirty. |

### Scientific Mathematics / LaTeX

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-MATH-001 | Tiptap 3 inline and block math with KaTeX | Mathematics | Missing | P1 | Blocked | SRS-SEC-001; SRS-HTML-002; SRS-ED-001 | Raw LaTeX nodes render inline/display, preserve source through save/reload/preview/revision/HTML, trust=false, errors bounded. |
| SRS-MATH-002 | Equation edit dialog, preview and accessibility | Mathematics | Proposed | P1 | Blocked | SRS-MATH-001 | Edit existing TeX without losing selection; visible error state; MathML or accessible source fallback; mobile overflow safe. |

### SEO & Publishing Quality

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-SEO-001 | Use complete consistent audit fingerprints | SEO | Partially Implemented | P1 | Ready | SRS-TEST-001 | Unchanged linked source/media keeps report fresh; changing DOI/alt invalidates; quick fixes reject only true stale proposals. |
| SRS-SEO-002 | Calibrate shared SEO severities and guidance | SEO | Partially Implemented | P1 | Backlog | SRS-SEO-001 | Same results on overview/detail/editor; title/description thresholds labeled advisory; no false Google ranking guarantees. |
| SRS-SEO-003 | SEO metadata/heading/canonical/structured-data contracts | SEO | Partially Implemented | P2 | Backlog | SRS-SEO-002; SRS-HTML-002 | Canonical, heading order, JSON-LD preview, noindex and hreflang warnings match published artifact fixture; no production indexing. |

### Media & Images

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-MED-002 | Scientific figure captions, positioning and image rights | Media | Partially Implemented | P1 | Blocked | SRS-MED-001; SRS-ED-007 | Figures remain contain/locked; credible credit/licence supplied by editor, not invented defaults; caption/alt tied to asset. |
| SRS-MED-003 | Cloudflare R2 storage and image transform adapter | Integration | Missing | P2 | Deferred | SRS-MED-001; SRS-ROLE-001 | Only with separate authorization; mock upload/transform/quota failures, licence retention, secret-safe config, rollback. |

### Editorial Workflow

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-SCI-001 | DOI registration vs claim evidence distinction | Integrity | Partially Implemented | P1 | Backlog | SRS-TEST-001 | Syntax passes do not imply registered DOI or verified claims; human signoff includes source locator and reviewer record. |
| SRS-SCI-002 | Insert and renumber linked scientific citations | Integrity | Partially Implemented | P1 | Blocked | SRS-ED-008; SRS-HTML-002 | Stable source-ID citation marks; reorder/restore preserve anchors, bibliography numbering and editor-approved provenance. |
| SRS-REV-001 | Durable reviewer approvals, revisions and corrections | Publishing | Partially Implemented | P1 | Blocked | SRS-DATA-003; SRS-PUB-002 | Restore of any manual or review revision is durable; approval identity and note persisted; correction trail test. |
| SRS-ROLE-001 | Production server-side roles and real publish authorization | Security | Missing | P2 | Deferred | SRS-PUB-001; SRS-DATA-001 | Separate production approval; server rejects unauthorized review/publish by all clients, audit immutable and roles verified. |
| SRS-AI-001 | Local suggestion review and optional AI approval | AI | Partially Implemented | P1 | Backlog | SRS-DATA-003; SRS-SCI-001 | Suggestion diff needs human Apply, cannot invent study claims; stale proposal refused; revision receipt durable. |

### Navigation & UX

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-UX-001 | Rationalize oversized editor and context responsibilities | Architecture | Proposed | P2 | Deferred | SRS-TEST-002; SRS-DATA-001 | Refactor only behind regression tests; same route outputs and save semantics, measured render/click improvements. |
| SRS-UX-002 | Keyboard, sidebar, modal and screen-reader audit | Accessibility | Unverified | P1 | Blocked | SRS-TEST-002 | WCAG 2.2 AA issues documented/reproduced/fixed, focus restored, dialogs operable without mouse. |
| SRS-UX-003 | Verify dashboard and customizable navigation behavior | UX | Unverified | P1 | Backlog | SRS-TEST-002 | Counts equal seeded data and updates; presets survive refresh; hide/show remains navigable at 390px. |

### Integrations

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-INT-001 | Audit provider adapter readiness and truthful statuses | Integration | Partially Implemented | P2 | Deferred | SRS-ROLE-001; SRS-DATA-001 | Disconnected state always clear; no external requests/tokens without authorization; mock adapter negative paths. |
| SRS-INT-002 | Google Search Console, GA4, AdSense and GTM adapters | Integration | Missing | P2 | Deferred | SRS-INT-001; SRS-SEO-003 | Each provider independently consented; test authorization failure, missing metric, privacy, token revocation; no demo fake numbers. |
| SRS-INT-003 | Codex authenticated suggestion adapter | Integration | Missing | P2 | Deferred | SRS-INT-001; SRS-AI-001 | Only authorized sign-in; bounded suggestions, no silent text edits, user approval and versioned receipts; no API keys in client. |

### Testing & Maintenance

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-TEST-002 | Browser E2E for edit/reload/review/publish/preview | Testing | Missing | P1 | Blocked | SRS-TEST-001 | Playwright covers real user journeys with storage faults and reload; no console errors at desktop/mobile. |
| SRS-TEST-003 | Adversarial HTML and cross-format content regression | Security QA | Missing | P0 | Blocked | SRS-SEC-001; SRS-HTML-002; SRS-TEST-001 | Malicious HTML does not execute and allowed scientific content survives import, paste, render, save, revision, export. |
| SRS-TEST-004 | Time-zone, responsive and accessibility automated gates | Quality | Missing | P1 | Blocked | SRS-TEST-002; SRS-DATE-001 | UTC/Europe-Istanbul/New-York hydration tests, 390px focus order and table/math layout pass. |
| SRS-TEST-005 | Profile large-editor rerenders and IndexedDB quotas | Performance | Proposed | P2 | Deferred | SRS-TEST-002; SRS-DATA-001 | Measured baseline saved; regressions bounded by declared performance target; optimize only observed bottlenecks. |

### Future Enhancements

| ID | Feature / Task | Category | Implementation Status | Priority | Workflow Status | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| SRS-FUT-001 | Multi-style bibliography and advanced footnotes | Research | Proposed | P3 | Deferred | SRS-SCI-002 | Chosen Vancouver/APA style fixture passes, no fabricated citation data or silent renumbering. |
| SRS-FUT-002 | Real-time multi-user collaborative editing | Collaboration | Proposed | P3 | Deferred | SRS-ROLE-001; SRS-DATA-002 | Only if collaboration demand justified; no conflict/data loss under two-user merge suite. |
| SRS-FUT-003 | Paid DOCX/OMML conversion and advanced imports | Import | Proposed | P3 | Deferred | SRS-MATH-001; SRS-ED-008 | Demand and cost validated first; complex equations recoverable, no lock-in or silent loss. |

## 9. Workflow / evidence governance

- **Audit closure:** stop new broad audits. Any uncovered edge case becomes an acceptance test for its existing task, not another large report.
- **Authoritative delivery:** v2 is a proposal for owner review; the original 49-task document is not modified. Once approved, designate one canonical tracking document or migrate tasks without duplicate IDs.
- **Task lifecycle:** `Ready → In Progress → Review → Done` only on actual implementation, test execution, reviewer acceptance and merge. Existing `Blocked`, `Backlog`, and `Deferred` values remain until genuine dependencies change.
- **Each PR must record:** stable task IDs, exact baseline/source SHA, files changed, threat/rollback analysis if data/security is touched, failing test before fix where feasible, executed commands and exit codes, Playwright/Brave disposable profile details, and acceptance evidence.
- **Severity:** confirmed local static-preview event execution is an immediate security **P0** for any untrusted import path. Cross-tab overwrites and unauthorized demo scheduling are **P0** correctness defects. Distinguish these from unproven production compromise or real RBAC failure.
- **No remote claims:** the test suite is local and 4/8 outcome is bounded. A successful CI badge or demo role test must never imply secure hosted multiuser release.
- **Date PR #1:** leave the unrelated draft unmerged until its UTC/hydration change is reconciled against the presently passing zone/DST matrix. Do not overwrite working date code on speculative grounds.
- **Verification exit gate:** all relevant security/data/media/publishing acceptance tests pass; no known reproducible P0 failures remain; production launch remains separately gated on authorization, deployment, privacy and service configuration.
- **Ownership:** user retains merge decisions for implementation PRs. No bot/agent silently authorizes production, changes cost-bearing integrations, or changes the original scientific data.

## 10. Final completion criteria for this planning PR

1. Exactly **49** original IDs are preserved unchanged and counted; exactly **2** truly new task IDs are added: total **51**.
2. Every `SRS-RT-001…008` finding maps to an existing implementation task (no evidence ID duplicated as a new task).
3. Final matrix equals **4 PASS + 8 FAIL + 0 BLOCKED = 12** and preserves qualified PASS scope.
4. SEO report stale and stale Quick Fix are kept separate; draft/author scheduling is one common failure even though two runtime scenarios failed.
5. Existing UI style and scientific editorial requirements remain; risk-first sequence does not delete LaTeX/KaTeX, tables, source HTML or citations.
6. No application code, original backlog, old reports, dependencies or lockfiles are modified by the planning PR.
7. The document is marked **proposed**, and no implementation task is silently moved to Done.

**Proposed next action after human review:** start **PR-A**, test foundation, then **PR-B (HTML security)** and **PR-C (data concurrency)** as the first constrained implementation packages. Do not start them automatically as part of this documentation deliverable.
