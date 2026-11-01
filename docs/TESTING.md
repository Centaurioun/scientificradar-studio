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

`tests/e2e/concurrency.spec.ts` covers cross-tab stale drafts, a held same-tab save whose older successful receipt must preserve the later dirty draft and beforeunload guard, a held older transaction abort with scheduled retry, stale and fresh SEO Quick Fixes, and a native transaction abort that retains the editor draft and permits a later durable save. The held-save cases use a real IndexedDB read/write transaction and keep it active until the test releases or aborts it. Each case reads `root_snapshot_v1` directly from IndexedDB; the same-tab success and retry cases reload and assert that the newest title remains durable. `lib/studio-persistence.test.ts` checks concurrent read-modify-write ordering, transaction-completion acknowledgment, no-op conflict behavior, and failed writes.

Local PR-C verification on Bun 1.4.0 / Node.js 26.12.1, macOS Brave 156.1.98.60 (`/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`):

| Command | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Pass; no lockfile changes |
| `bun run test:unit` | 29 passed, 0 failed |
| `bun run typecheck` | Pass |
| `bun run lint` | Pass, 0 errors; one pre-existing `<img>` warning in `components/editor/article-workspace.tsx:1454` |
| `bun run build` | Pass |
| `bun run test:e2e` (isolated Brave) | 18 passed, 0 failed on `127.0.0.1:4175` |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=... bun run test:e2e` (pinned Playwright Chromium) | 18 passed, 0 failed on `127.0.0.1:4175` |

The original stale cross-tab and Quick Fix regressions were copied unchanged to an isolated worktree at baseline `4f756294a81531b39d1fd9dfc68c68e29b3dd668`; both failed there because the stale editor save and old Quick Fix were acknowledged without a conflict. The new same-tab receipt regression was also run against the committed editor implementation at that baseline and failed as expected: IndexedDB held the first title while the UI incorrectly showed `Saved (Local)` instead of `Unsaved changes`. The corrected code passes on both local browser engines. Hosted Chromium CI is required after the implementation branch is pushed and is reported separately from these local results.

## PR-C six-cycle refinement record

1. **Cycle 1 — reproduce:** Confirmed the source guarded article drafts and Quick Fixes against tab-local state. The regression tests failed on the exact fetched baseline in both reported stale-write scenarios.
2. **Cycle 2 — persistence design:** Compared a transactional read-modify-write operation with a versioned storage mutation service. Selected a small transaction helper over the existing `idb` abstraction: one authoritative `root_snapshot_v1` read, synchronous validation/mutation, one write, and acknowledgment only after `tx.done`. No additional dependency or BroadcastChannel lock was needed.
3. **Cycle 3 — persistence tests:** Added deterministic tests for serialized concurrent mutation, transaction completion, rejected no-op behavior, and aborted writes. Added browser regressions before the repair and confirmed baseline failures.
4. **Cycle 4 — application integration:** Article draft saves now compare an exact persisted article version and increment that version on every committed save; Quick Fix checks its complete article fingerprint against persisted article/media/source data and records a revision only after a successful commit. Page and calendar saves, status transitions, and assistant changes await their durable transaction before reporting success. Other root mutations replay their functional updater against the latest stored snapshot instead of writing stale full-root copies.
5. **Cycle 5 — adversarial verification:** Brave exercised two-tab stale writes, stale and valid SEO proposals (including linked media/source fingerprints), direct persisted-state checks after reload, and a controlled native IDB abort. Existing backup-security and smoke suites passed in the same run.
6. **Cycle 6 — final review:** Reviewed all root-record write sites, transaction acknowledgment, article-version/history separation, historical records, import revision handling, empty-collection loading, and PR-B sanitizer/import behavior. The first hosted Chromium run exposed a race in an existing test helper that could create the versioned database without its object store; the helper now creates the same store as the application during upgrade. Independent review then identified a same-tab race: a successful older save receipt could mark a newer unsaved edit clean. The deterministic held-transaction test failed on the committed implementation, confirming the defect. The editor now compares the draft generation for both success and failure receipts; a failed transaction no longer forces memory fallback, allowing the already-scheduled retry to commit durably. The final local run passed 29 unit tests, TypeScript, lint (0 errors and one pre-existing warning), build, and all 18 E2E cases in isolated Brave and pinned Playwright Chromium. Hosted CI for the new exact head is tracked separately from these local results.

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
