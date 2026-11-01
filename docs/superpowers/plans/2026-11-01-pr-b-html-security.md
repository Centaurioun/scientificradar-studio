# PR-B HTML Security and Safe Backup Import Implementation Plan

> **For agentic workers:** Execute this plan in order in the isolated PR-B worktree. Keep every security test adversarial and evidence-producing; do not weaken expectations to make the suite green.

**Goal:** Close SRS-RT-005 by making one parser-based HTML allowlist authoritative across paste, save, restore, backup import, persisted snapshots and all current raw-HTML rendering sinks, while validating complete backup snapshots before any durable restore.

**Architecture:** Use `isomorphic-dompurify` with a narrow explicit HTML element/attribute allowlist, strict URL checks, and H1 demotion performed through parsed DOM nodes. Use Zod schemas to validate the entire `StudioDatabaseSnapshot`, preserve unknown optional record fields, sanitize every HTML-bearing known field, then write one complete candidate snapshot to IndexedDB before exposing it in React state. Reject import when durable IndexedDB persistence is unavailable; rely only on the atomicity of this one IndexedDB object-store write, not on global write serialization.

**Tech Stack:** Bun 1.4.0; Next.js 15 / React 19; Playwright 1.64.1; DOMPurify via `isomorphic-dompurify` 4.5.0; Zod 4.6.7; existing `idb` IndexedDB wrapper.

**Spec:** PR-B task in the user-provided ScientificRadar Studio implementation request; `docs/TESTING.md`; SRS-RT-005 evidence in `docs/SCIENTIFICRADAR_STUDIO_RUNTIME_VERIFICATION_AUDIT.md`.

## Security Approach Decision

1. **Selected — DOMPurify parser plus explicit allowlist (`isomorphic-dompurify` 4.5.0).** Its HTML parser handles browser-style malformed markup; its isomorphic package exposes separate browser and Node entrypoints. The same allowlist protects article, page and knowledge-link HTML. Styles, SVG/MathML elements and foreign content are excluded; only the explicit `data-knowledge-term` attribute is retained. The Node entry uses `jsdom`, adding server bundle weight that is checked by production build.
2. **Rejected — ProseMirror schema parse/serialize as the global boundary.** It closely matches Tiptap article semantics, but would couple static-page and knowledge-link HTML to editor schema details, reject otherwise supported document HTML, and create a separate server parsing contract. It remains appropriate inside the editor, not as the sole security boundary.

## File Responsibilities

- `lib/html-security.ts`: shared parser-based sanitizer, tag/attribute/URL policy, safe H1 demotion metadata, snapshot-wide HTML normalization helpers.
- `lib/backup-validation.ts`: version-aware Zod runtime schemas for the complete snapshot and candidate preparation.
- `lib/editorial-rules.ts`: preserve existing public sanitizer contract while delegating to the shared policy.
- `lib/studio-context.tsx`: sanitize save/load/revision boundaries and perform validate → normalize → durable single-record IndexedDB write → state exposure for imports.
- `components/editor/article-tiptap-editor.tsx`: sanitize clipboard HTML before ProseMirror parses it; preserve plain text/Markdown behavior.
- `app/pages/[id]/preview/page.tsx`, `components/editor/article-preview-view.tsx`, `components/knowledge/knowledge-link-popover.tsx`: sanitize immediately at every current raw HTML sink; keep knowledge-link recognition on sanitized markup.
- `lib/editorial-rules.test.ts`, new backup schema tests, and `tests/e2e/security.spec.ts`: adversarial HTML, whole-snapshot validation, scientific-content preservation, import atomicity, and isolated browser rendering regressions.
- `package.json`, `bun.lock`: exact sanitizer/schema runtime dependencies only.
- `docs/TESTING.md`: update SRS-RT-005 from pending to verified for the bounded local workflow; document import version compatibility and PR-C concurrency boundary.

## Execution Tasks

### Task 1 — Red browser reproduction

- Add an isolated Playwright test that obtains a real exported local snapshot through Settings, modifies it with a disposable static page containing an inert same-origin `img onerror` marker, and imports it through the visible import form.
- Attach the resulting preview DOM and exported application snapshot, and assert whether the marker executes. Confirm this test fails on current `origin/main` for the expected execution marker before changing production code.

### Task 2 — Shared HTML policy

- Add failing unit cases for supported scientific markup, H1 demotion, event handlers, active elements, protocol obfuscation, malformed nesting, SVG/foreign content, CSS/style attributes, and escaped text.
- Implement an explicit allowlist and URL attribute checks with DOMPurify; do not enable SVG, MathML, style, arbitrary data attributes, `blob:` or `data:` globally.
- Preserve valid Unicode, DOI text, citations, inline formatting, tables, code, figure captions/alt text and recognized knowledge-link attributes where safe.

### Task 3 — Whole snapshot validation and durable import

- Define compatible current/legacy version rules from actual exported snapshot shape; validate all required root collections, records, identifiers, preferences and references without requiring optional historical fields.
- Normalize every article/page/revision HTML field with the shared sanitizer and reject malformed critical structure, oversized input and invalid record types.
- Make import asynchronous: prepare candidate without side effects, require IndexedDB, await one complete `db.put`, and only then update React state/return success. Failed parse, validation or write leaves prior state untouched and visible error status intact.
- Add unit tests for valid exported snapshots, legacy optional fields, empty arrays, invalid JSON/schema/records, unsafe HTML, size boundaries and failed durable write.

### Task 4 — All boundary enforcement

- Sanitize HTML at paste, domain save, loaded stored snapshot, revision restore, import, and raw-HTML rendering boundaries.
- Keep one shared policy and avoid repeated lossy normalization beyond idempotent sanitizer application.
- Browser-test imported page preview, article preview and knowledge-link rendering; use isolated contexts and local routes only.

### Task 5 — Verification and review

- Run frozen Bun installation, targeted unit tests, all unit tests, typecheck, lint, build, and full E2E suite in local Brave; repeat E2E in CI Chromium.
- Test malformed encodings and alternate element/namespace cases in browser, inspect every raw HTML sink, and compare safe scientific content before/after import and reload.
- Record current CI, exact changed paths, dependency lock delta, and the remaining cross-tab/write-serialization limitation assigned to PR-C.

## Global Constraints

- Base is latest fetched `origin/main` `193a584904bfa9a1d8879bc0844ba867a7c986c1`; verify again before PR creation.
- Keep primary checkout, PR #1, PR #6, and any PR-C work untouched.
- Use isolated Playwright browser contexts and local ports 4175–4190; never use ports 3000 or 3100.
- No production services, external callbacks, secrets, or personal Brave profiles.
- No global IndexedDB concurrency redesign, media durability work, publishing changes, SEO changes, or unrelated UI changes.
- Do not claim the import is concurrency-safe across tabs; PR-C owns serialized/stale-write handling.

## Six-Cycle refinement evidence

1. **Cycle 1 — attack-surface map and reproduction:** inspected the HTML-bearing article/page/revision/knowledge-link paths, the six `dangerouslySetInnerHTML` source sites, and snapshot import/load. Added `tests/e2e/security.spec.ts` first. The pre-fix standalone build ran the imported local `img onerror` marker twice, matching the historical SRS-RT-005 report. No production service or external host was involved.
2. **Cycle 2 — architecture choice:** compared shared parser-based DOMPurify with a ProseMirror schema-only sanitizer. Chose exact allowlists plus URL post-validation because static pages, imported content, and knowledge fragments do not all pass through the Tiptap schema. Zod 4.6.7 validates backup records at runtime. Rejected a handwritten regex security engine and a schema-only global boundary.
3. **Cycle 3 — sanitizer TDD:** added adversarial unit coverage before implementation; the old regex sanitizer failed the active SVG/foreign-content and unsafe media-source cases. Replaced it with DOMPurify fragment parsing, attribute/URL post-validation, and parsed-node H1 demotion. Final unit result is 24 passed / 0 failed. The post-fix local browser canary test passed in static and article previews, with safe Greek text retained.
4. **Cycle 4 — backup validation and restore:** added version-1 schemas for every snapshot collection, bounded sizes/counts/HTML fields, safe URLs for knowledge links/sources/menus, ID checks, legacy optional defaults, and HTML sanitization for article/page/revision records. Import now awaits one atomic IndexedDB record write before publishing React state; validation and the simulated-failure UI path preserve the existing record. A forced low-level IndexedDB transaction abort has not been injected. Empty article collections remain subject to the existing SRS-CODE-001 bootstrap behavior, and cross-tab write ordering remains PR-C work.
5. **Cycle 5 — browser boundaries:** after rebuilding the standalone output, the full 10-test Playwright suite passed on the installed Brave executable and again on Playwright-managed Chromium. This covers imported static-page and article-reader canaries, recognized knowledge-link markup, reload, invalid backup rejection, simulated persistence failure, app smoke regions, and measured viewport sizes. E2E fixtures stay on `127.0.0.1:4175` and intercept external requests.
6. **Cycle 6 — adversarial final pass:** final verification on Bun 1.4.0: frozen install exit 0; unit 24/24; TypeScript exit 0; ESLint exit 0 with the existing `article-workspace.tsx:1454` image warning; production build exit 0; Playwright 10/10 on Brave and 10/10 on managed Chromium. An explicitly invalid executable path failed fast with its path in the diagnostic. One initial parallel run produced a typecheck failure because `next build` concurrently recreated `.next/types`; rerunning typecheck after build completed passed. Hosted CI and `trail check` remain pending before publishing the branch.
