# ScientificRadar Studio — Development Backlog

**Source baseline:** 6ba8028a1b26773992a4e19631446bded5595cc4 | **Reviewed:** 2026-11-01 (Europe/Istanbul) | **Branch:** main  
**Full rationale and evidence:** [Independent Audit](SCIENTIFICRADAR_STUDIO_INDEPENDENT_AUDIT.md). **Scope: documentation-only, no feature implementation.**

## Backlog Summary

**49 tracked tasks.** Implementation status describes *source and specification assessment* at the audited commit; no item is marked Done and **no browser/build/automated test passed during this audit**. Specifically, *Partially Implemented* means real source exists but acceptance criteria are outstanding; *Missing* means requested functionality is absent in inspected modules; *Proposed* is a new or optional recommendation; *Unverified* means available evidence is insufficient to judge behavior. *Verified Implemented* would require relevant fresh execution/acceptance evidence; its count may therefore be zero.

| Implementation Status | Count |
|---|---:|
| Verified Implemented | 0 |
| Partially Implemented | 26 |
| Missing | 14 |
| Proposed | 6 |
| Unverified | 3 |
| **Total** | **49** |

| Priority | Count | Meaning |
|---|---:|---|
| P0 | 12 | Security, content/data integrity, authorization, foundational reliability |
| P1 | 25 | High-value core scientific editorial workflows |
| P2 | 9 | Dependent features and integrations |
| P3 | 3 | Optional or premature |

**Status semantics:** Implementation Status and Workflow Status are independent. Only the exact labels in these tables are allowed. Move a task to *Review* when changes and associated evidence exist, and to *Done* only after acceptance tests pass and a reviewer confirms them. Update status in the same PR that delivers the fix; never infer it from a specification, screenshot, generated completion claim or GitHub merge alone. **Preserve IDs indefinitely; split work with new IDs rather than renumbering existing rows.**

**Verification limitation:** GitHub source, documentation, PRs, commits and repository layout were inspected; npm test/typecheck/lint/build, browser and security reproduction were **not run**. All tasks are initially Done=0. Product release remains an isolated local/demo system; main's standalone v5 functionality does not imply production readiness.

## Recommended Next 10 Tasks

The following order is chosen for dependency and risk, not visual appeal. Several tasks can run in parallel once shared test infrastructure exists; **do not start feature implementation merely by reading this file.**

1. **SRS-TEST-001 —** Make deterministic tests and CI executable from pinned tooling, capture actual baseline failures.
2. **SRS-DATA-001 —** Serialize and acknowledge store writes; stop optimistic saves and stale overwrite.
3. **SRS-SEC-001 —** Install a schema/allowlist HTML trust boundary before rich-source expansion.
4. **SRS-SEC-002 —** Validate/migrate/sanitize imported snapshots with rollback, using the new sanitizer.
5. **SRS-DATA-002 —** Prove overlapping autosaves and multi-tab changes cannot silently lose text.
6. **SRS-DATA-003 —** Make quick-fix/review/publish success receipts durable instead of optimistic.
7. **SRS-PUB-002 —** Use actual role/state/dirty in the publication gate and ensure UI reflects the transition result.
8. **SRS-PUB-001 —** Route scheduling through that shared policy and awaited persistence.
9. **SRS-MED-001 —** Preserve the uploaded image bytes across session restart or mark uploads session-only.
10. **SRS-HTML-002 —** Establish one tested canonical body/preview format, so future tables/figures/math cannot silently disappear.

**Immediately after the P0 safety gate:** SRS-SEO-001 (audit fingerprint), SRS-ED-001/002/003/007 (quick editor usability), SRS-ED-004/005 (scientific semantics), then the explicit P1 LaTeX requirement SRS-MATH-001; read-only source inspection SRS-HTML-003 before editable SRS-HTML-001. Complete pending hydration/DST verification SRS-DATE-001 before any real scheduling. Server roles, Cloudflare, Google and live Codex remain deferred and require separate authorization.

## Backlog Tables

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

## Maintenance Protocol

- **On starting work:** take the task ID, check *Dependencies*, compare its evidence in the audit against the latest main HEAD, write a failing regression first where appropriate; set Workflow Status to *In Progress* only when work actually begins.
- **On submitting work:** link commit/PR and the exact acceptance-test command/output under the PR or issue using the stable ID; use *Review*, never assume Done from a merged change.
- **On finishing:** verify persisted state and browser behavior, close only that task's tested acceptance scope; keep unmet tests as *Blocked* or *Backlog*. Any new risk receives a new ID and corresponding evidence in the audit, not a silent status flip.
- **Every audit refresh:** record the new commit baseline, review open PR #1 independently against updated main, reconcile changed files and retain the history of existing IDs. Do not overwrite user decisions or original Master/v5/v6 specifications.
- **Evidence:** use exactly these classes in reports: Confirmed by source code; Confirmed by executed test; Confirmed by browser reproduction; Probable / requires reproduction; Specification-only requirement; New recommendation; Unable to verify. A report claiming tests must include executed commands and outcomes.

**No implementation, dependency change, external provider connection, deployment, PR merge or production publication was performed when this backlog was authored.**
