# ScientificRadar Studio testing

## Local commands

Use Bun 1.4.0 and Node.js 26.13.0 as pinned by CI, along with the committed lockfile:

```sh
bun install --frozen-lockfile
bun run test:unit
bun run typecheck
bun run lint
bun run build
bun run test:e2e:install
bun run test:e2e
```

The CI browser-install step uses `bun run test:e2e:install:ci` to install Playwright's matching Chromium build and its Linux system dependencies. The local `test:e2e:install` command installs only that matching browser build.

The E2E command expects the production build to exist because it copies the build's static/public assets into Next.js's generated standalone directory, then starts that standalone server on `127.0.0.1:4175`. These are ignored build outputs; no application source is changed. It never uses ports 3000 or 3100. The app runs only against disposable browser contexts and local demo data. Browser requests outside the local app origin are aborted. CI does not receive production credentials and the workflow has read-only repository permissions.

On macOS, Playwright uses `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser` when present; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to another installed Chromium-compatible executable if needed. This launches a fresh temporary Playwright browser context, not a personal Brave profile. On other systems Playwright's Chromium matching the locked Playwright package is used. The managed server and browser base URL are fixed to `127.0.0.1:4175`. If Bun is installed under `~/.bun` but not on `PATH`, add that directory to `PATH` before invoking the package scripts; CI provisions Bun on `PATH` automatically.

The project configuration uses 1440×900 as its baseline viewport. The smoke test changes the real browser viewport and checks `window.innerWidth`, `window.innerHeight` and a matching CSS media query at 1440×900, 1024×768 and 390×844. On failure, Playwright retains its trace and screenshot, and each test attaches captured console warnings/errors, uncaught page errors, failed and canceled local requests, and blocked external requests to the HTML report. Router prefetches canceled by navigation are reported separately from actual local network failures.

## Current smoke coverage

`tests/e2e/smoke.spec.ts` covers app startup, dashboard navigation/content, article editor writing controls, navigation from the article listing to an existing editor, local SEO audit UI, local scheduling UI, exact viewport readback, and the browser diagnostics capture contract. `tests/e2e/security.spec.ts` imports disposable backups through Settings and verifies static-page, article-preview, and knowledge-link canaries remain inert after storage reload; it also verifies invalid and simulated-failed imports preserve the saved snapshot. Both suites use isolated contexts and local routes only.

## Confirmed runtime defects reserved for later PRs

These are known failures from the 2026-11-01 isolated Brave runtime audit. PR-A does not run or close their acceptance tests. The list is an explicit pending regression inventory, not passing test evidence. Future implementation PRs should add the reproduction as an active Playwright test before fixing the corresponding defect; keep expected behavior assertions strong and do not conditionally weaken them.

| Finding | Pending regression contract | State in PR-A |
| --- | --- | --- |
| SRS-RT-001 | Mount/remount the editor and assert no duplicate Link/Underline extension registration warning while link and underline controls remain usable. | Pending; product behavior unchanged. |
| SRS-RT-002 | Attempt a Draft→Scheduled calendar transition as Author and Editor; assert the shared editorial transition policy rejects unsupported transitions and storage remains unchanged. | Pending; no scheduling action in smoke tests. |
| SRS-RT-003 | Use two same-origin tabs with ordered writes; after reload, assert the latest acknowledged value remains and stale writes are rejected or reconciled. | Pending; no cross-tab mutation in smoke tests. |
| SRS-RT-004 | Upload a licensed disposable PNG in a fresh profile, restart the browser with the same temporary profile, and assert decoded image pixels remain available. | Pending; no upload in smoke tests. |
| SRS-RT-005 | Import a disposable page containing an inert local event-handler canary; assert the canary never executes in static preview and unsafe markup is rejected or sanitized. | Active PR-B regression; parser-based sanitization is verified in isolated local browser previews. |
| SRS-RT-006 | Change linked source/media metadata, assert the SEO audit is marked stale, re-run it, then assert the updated report is fresh after reload. | Pending; no audit mutations in smoke tests. |
| SRS-RT-007 | Save a newer value in a second tab, apply an older Quick Fix proposal, and assert the newer value is not overwritten. | Pending; no Quick Fix mutation in smoke tests. |
| SRS-RT-008 | Render a 120+ character article title at the three required viewports and assert the full title stays visible without clipping. | Pending; layout remains unchanged. |

## PR-C persistence regressions

`tests/e2e/concurrency.spec.ts` covers cross-tab stale drafts and revision restores, a held same-tab save whose older successful receipt must preserve the later dirty draft and beforeunload guard, a held older transaction abort with scheduled retry, stale and fresh SEO Quick Fixes, and a native transaction abort that retains the editor draft and permits a later durable save. `tests/e2e/durability-operations.spec.ts` verifies sanitized fresh revision restore, aborted restore with an unsaved editor draft, transactional duplicate success/failure and unique slug, delete success/failure, unrelated concurrent-root-change preservation, and the distinction between an in-memory audit report and an IndexedDB-persisted report. The held-operation cases use real IndexedDB read/write transactions and keep them active until the test releases or aborts them. They read `root_snapshot_v1` directly; successful mutations are also checked after reload. `lib/studio-persistence.test.ts` checks concurrent read-modify-write ordering, transaction-completion acknowledgment, no-op conflict behavior, and failed writes.

Local PR-C verification on Bun 1.4.0 / Node.js 26.12.1, macOS Brave 156.1.98.60 (`/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`):

| Command | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Pass; no lockfile changes |
| `bun run test:unit` | 29 passed, 0 failed |
| `bun run typecheck` | Pass |
| `bun run lint` | Pass, 0 errors; one pre-existing `<img>` warning in `components/editor/article-workspace.tsx:1454` |
| `bun run build` | Pass |
| `bun run test:e2e` (isolated Brave) | 27 passed, 0 failed on `127.0.0.1:4175` |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=... bun run test:e2e` (pinned Playwright Chromium) | 27 passed, 0 failed on `127.0.0.1:4175` |

The original stale cross-tab and Quick Fix regressions were copied unchanged to an isolated worktree at baseline `4f756294a81531b39d1fd9dfc68c68e29b3dd668`; both failed there because the stale editor save and old Quick Fix were acknowledged without a conflict. The same-tab receipt regression also failed on the committed editor implementation: IndexedDB held the first title while the UI incorrectly showed `Saved (Local)` instead of `Unsaved changes`. The final isolated Brave and pinned Playwright Chromium suites each pass all 27 cases, including PR-B HTML security and backup import coverage. The first clean hosted CI run passed unit, TypeScript, lint, build, and GitGuardian but exposed that the new direct IndexedDB test reader did not create the version-1 object store when it opened a fresh database. The helper now applies the same store-creation upgrade as the application; both full local browser suites pass after that correction. Hosted CI must check the final exact head.

### Durable mutation boundary

The audited article operations covered here—draft saves, status transitions, assistant changes, Quick Fix, revision restore, duplicate, delete, calendar scheduling, backup import, and SEO audit report storage—return or display successful completion only after their authoritative IndexedDB mutation commits. Restore rejects a stale expected article version; failure and abort leave the stored article and editor draft unchanged. SEO audit receipts distinguish calculated reports from reports persisted in IndexedDB.

This PR does **not** claim app-wide SRS-DATA-003 completion. Supporting-entity and other generic `updateState` actions outside the audited article paths still optimistically update React state and do not all expose awaited durable receipts. In particular, media library mutations and linked-media durability are outside this repair's scope; taxonomy, author, source, page deletion, and preference CRUD also retain separate generic contracts. Those paths need their own bounded contract and failure/UI coverage before they can be represented as universally durable. PR-F1's fingerprint calculation and PR-F2's SEO Center freshness redesign remain separate ownership.

## PR-C six-cycle refinement record

1. **Cycle 1 — reproduce:** Read the independent review and confirmed each positive receipt path against source. Held/aborted browser transactions reproduced early duplicate and audit success messages; restore abort and stale-revision tests exposed missing receipts/conflict rejection.
2. **Cycle 2 — contracts:** Restore now requires the caller's expected current article version and validates it against the latest root inside the transaction. Duplicate identity is generated once per operation and slug is chosen against the latest committed articles. Delete and audit return explicit commit/failure receipts.
3. **Cycle 3 — transactional operations:** Restore sanitizes with the existing PR-B policy and creates the new revision atomically with the restored article. Duplicate, delete, and restore update React context only after `tx.done`; aborted operations leave authoritative state unchanged.
4. **Cycle 4 — audit receipt and feedback:** Audit calculation and IndexedDB persistence are distinct receipt fields. Single and batch audit messages report saved reports only after commit; memory-only calculations are explicitly labeled, and pre-publish UI does not proceed on an unsaved audit report.
5. **Cycle 5 — full verification:** Frozen Bun install, 29 unit tests, TypeScript, lint, build, and full E2E each passed. Isolated Brave and pinned Playwright Chromium each passed 27 tests, including prior 18, the new operations, PR-B security, and backup import coverage.
6. **Cycle 6 — call-site and failure-path review:** Reviewed both restore callers, article list duplicate/delete handlers, all audit callers, conflict/abort receipts, IndexedDB reload reads, and final diff. The duplicate transaction preserved a concurrent unrelated theme update in a second tab. Explicitly retained the non-covered generic `updateState`/supporting-entity boundary; SRS-DATA-003 is not marked fully complete app-wide. GitHub Actions and GitGuardian remain required on the final pushed exact head.

## PR-A refinement record

1. **Cycle 1 — baseline and architecture:** fetched `origin/main` at `0a26268503008aab78437ef4186c05ffa1a43123`; frozen Bun 1.4.0 install succeeded; native `bun test` passed all 14 existing cases. Chose Bun for unit tests because it runs the existing Node-style tests without an extra TSX package or altered semantics. Retained Node for Next.js and selected Playwright Test only for browser automation.
2. **Cycle 2 — deterministic unit tests:** replaced the `npx --yes tsx` script with `bun test lib`, and provided explicit `test:unit`/`test:e2e` commands. Playwright is an exact development dependency (`@playwright/test` 1.64.1) recorded in `bun.lock`; no uncontrolled package resolution remains in the declared test commands. The first verification attempt exposed that this host's Bun directory is missing from `PATH`; it failed before running tests (127). The suite was rerun with Bun's installed directory added to `PATH`, as required by the documented shell setup.
3. **Cycle 3 — browser automation:** added a managed standalone production server on port 4175, isolated Playwright contexts, local Brave executable selection, version-matched CI Chromium, three CSS viewport readbacks, and per-test diagnostics/screenshots/traces. External browser requests are intercepted and aborted. The first browser run exposed that Next standalone does not include its static assets by default; the test-only preparation script copies those generated files without editing product source. The same run exposed wrong selectors and normal Next route-prefetch cancellation; selectors now match the actual labeled `<aside>` and searchbox, and cancellations are retained separately from network failures.
4. **Cycle 4 — regression design:** mapped all eight confirmed SRS-RT findings to concrete future reproduction/acceptance contracts above. Kept the current smoke suite read-only so no existing defect is silently changed or made a permanent failing CI job.
5. **Cycle 5 — CI reliability:** added pull-request-only CI with exact triggering head SHA, read-only permissions, immutable action SHAs, pinned Bun 1.4.0/Node.js 26.13.0, frozen installation, matching Chromium/system dependencies, bounded job time, no cache, no secrets, and failure-only diagnostic artifact upload. Node 22 had reached end of support on 2026-10-20, so CI uses the currently supported Node 26 LTS line rather than the earlier provisional Node 22 choice.
6. **Cycle 6 — adversarial verification:** the final local run on Node 26.12.1/Bun 1.4.0 reported 14/14 unit tests, successful TypeScript, lint with 0 errors and the one baseline `<img>` warning, a successful production build, and 8/8 browser smoke tests. The same 8/8 suite also passed against Playwright-managed Chromium; Brave is used by default on this Mac. All three reported CSS viewport pairs matched exactly. Independent review found and led to removal of a misleading base-URL override and addition of diagnostics to the viewport test; all local gates and both browser engines passed again afterward. Review confirmed no application source, persistence, sanitization, publish, UI, or integration files changed; the lockfile diff contains only Playwright's exact 1.64.1 records. Workflow YAML parses and the diff passes `git diff --check`. `trail check` found no conflicts but surfaced the personal reminder about connecting to an already-open Brave tab; that alternative is inapplicable here because this test foundation must use disposable profiles with no personal data, so the installed executable launches an isolated Playwright context. GitHub's actual PR checks remain pending until the branch is pushed.

## Baseline at implementation start

On Node 26.12.1 and Bun 1.4.0: `bun install --frozen-lockfile` succeeded; `bun test lib/editorial-rules.test.ts` reported 14 passed / 0 failed; `bun run typecheck` succeeded; `bun run lint` exited 0 with one pre-existing `@next/next/no-img-element` warning at `components/editor/article-workspace.tsx:1454`; `bun run build` succeeded. These results describe the PR-A base before its edits, not the final branch.

## PR-B HTML security and backup import

The supported backup format is schema version 1. Versionless snapshots from PR-A are accepted as version 1; unknown future versions are rejected. Previously optional `dateTimePreferences` and `auditReportsByArticleId` receive defaults. Unknown optional record fields are retained. Import validates and sanitizes the complete candidate before a single IndexedDB root-record write, and reports success only after that write resolves. Failed validation or the simulated persistence-failure path leaves the prior saved state intact. This is atomic for that single IndexedDB write, but concurrent same-tab/cross-tab stale writes are not serialized here and remain PR-C acceptance work. Import is rejected when IndexedDB is unavailable.

The HTML allowlist uses DOMPurify's parser in both browser and Node builds. It retains common scientific formatting, Unicode, DOI/link text, table/code semantics, and figure metadata while removing active elements, event attributes, styles, SVG/MathML markup, foreign content, and unsafe or untrusted media sources. Images may use same-application paths or exact registered local media sources; remote HTML media is not enabled by this policy.

The PR-B browser regression first reproduced the baseline `img onerror` execution (the unique marker ran twice), then passed after sanitizer and import validation changes. Post-fix checks cover imported static-page and article-preview HTML, recognized knowledge-link markup, storage reload, and invalid/simulated-failed restore behavior. This is evidence for those controlled cases, not a claim that every future renderer or production system was tested.
