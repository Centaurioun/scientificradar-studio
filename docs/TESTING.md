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

`tests/e2e/smoke.spec.ts` covers app startup, dashboard navigation/content, article editor writing controls, navigation from the article listing to an existing editor, local SEO audit UI, local scheduling UI, exact viewport readback, and the browser diagnostics capture contract. It performs no publish action, external service call, or durable content mutation.

## Confirmed runtime defects reserved for later PRs

These are known failures from the 2026-11-01 isolated Brave runtime audit. PR-A does not run or close their acceptance tests. The list is an explicit pending regression inventory, not passing test evidence. Future implementation PRs should add the reproduction as an active Playwright test before fixing the corresponding defect; keep expected behavior assertions strong and do not conditionally weaken them.

| Finding | Pending regression contract | State in PR-A |
| --- | --- | --- |
| SRS-RT-001 | Mount/remount the editor and assert no duplicate Link/Underline extension registration warning while link and underline controls remain usable. | Pending; product behavior unchanged. |
| SRS-RT-002 | Attempt a Draft→Scheduled calendar transition as Author and Editor; assert the shared editorial transition policy rejects unsupported transitions and storage remains unchanged. | Pending; no scheduling action in smoke tests. |
| SRS-RT-003 | Use two same-origin tabs with ordered writes; after reload, assert the latest acknowledged value remains and stale writes are rejected or reconciled. | Pending; no cross-tab mutation in smoke tests. |
| SRS-RT-004 | Upload a licensed disposable PNG in a fresh profile, restart the browser with the same temporary profile, and assert decoded image pixels remain available. | Pending; no upload in smoke tests. |
| SRS-RT-005 | Import a disposable page containing an inert local event-handler canary; assert the canary never executes in static preview and unsafe markup is rejected or sanitized. | Pending; do not exercise the known unsafe sink in PR-A. |
| SRS-RT-006 | Change linked source/media metadata, assert the SEO audit is marked stale, re-run it, then assert the updated report is fresh after reload. | Pending; no audit mutations in smoke tests. |
| SRS-RT-007 | Save a newer value in a second tab, apply an older Quick Fix proposal, and assert the newer value is not overwritten. | Pending; no Quick Fix mutation in smoke tests. |
| SRS-RT-008 | Render a 120+ character article title at the three required viewports and assert the full title stays visible without clipping. | Pending; layout remains unchanged. |

## PR-A refinement record

1. **Cycle 1 — baseline and architecture:** fetched `origin/main` at `0a26268503008aab78437ef4186c05ffa1a43123`; frozen Bun 1.4.0 install succeeded; native `bun test` passed all 14 existing cases. Chose Bun for unit tests because it runs the existing Node-style tests without an extra TSX package or altered semantics. Retained Node for Next.js and selected Playwright Test only for browser automation.
2. **Cycle 2 — deterministic unit tests:** replaced the `npx --yes tsx` script with `bun test lib`, and provided explicit `test:unit`/`test:e2e` commands. Playwright is an exact development dependency (`@playwright/test` 1.64.1) recorded in `bun.lock`; no uncontrolled package resolution remains in the declared test commands. The first verification attempt exposed that this host's Bun directory is missing from `PATH`; it failed before running tests (127). The suite was rerun with Bun's installed directory added to `PATH`, as required by the documented shell setup.
3. **Cycle 3 — browser automation:** added a managed standalone production server on port 4175, isolated Playwright contexts, local Brave executable selection, version-matched CI Chromium, three CSS viewport readbacks, and per-test diagnostics/screenshots/traces. External browser requests are intercepted and aborted. The first browser run exposed that Next standalone does not include its static assets by default; the test-only preparation script copies those generated files without editing product source. The same run exposed wrong selectors and normal Next route-prefetch cancellation; selectors now match the actual labeled `<aside>` and searchbox, and cancellations are retained separately from network failures.
4. **Cycle 4 — regression design:** mapped all eight confirmed SRS-RT findings to concrete future reproduction/acceptance contracts above. Kept the current smoke suite read-only so no existing defect is silently changed or made a permanent failing CI job.
5. **Cycle 5 — CI reliability:** added pull-request-only CI with exact triggering head SHA, read-only permissions, immutable action SHAs, pinned Bun 1.4.0/Node.js 26.13.0, frozen installation, matching Chromium/system dependencies, bounded job time, no cache, no secrets, and failure-only diagnostic artifact upload. Node 22 had reached end of support on 2026-10-20, so CI uses the currently supported Node 26 LTS line rather than the earlier provisional Node 22 choice.
6. **Cycle 6 — adversarial verification:** the final local run on Node 26.12.1/Bun 1.4.0 reported 14/14 unit tests, successful TypeScript, lint with 0 errors and the one baseline `<img>` warning, a successful production build, and 8/8 browser smoke tests. The same 8/8 suite also passed against Playwright-managed Chromium; Brave is used by default on this Mac. All three reported CSS viewport pairs matched exactly. Independent review found and led to removal of a misleading base-URL override and addition of diagnostics to the viewport test; all local gates and both browser engines passed again afterward. Review confirmed no application source, persistence, sanitization, publish, UI, or integration files changed; the lockfile diff contains only Playwright's exact 1.64.1 records. Workflow YAML parses and the diff passes `git diff --check`. `trail check` found no conflicts but surfaced the personal reminder about connecting to an already-open Brave tab; that alternative is inapplicable here because this test foundation must use disposable profiles with no personal data, so the installed executable launches an isolated Playwright context. GitHub's actual PR checks remain pending until the branch is pushed.

## Baseline at implementation start

On Node 26.12.1 and Bun 1.4.0: `bun install --frozen-lockfile` succeeded; `bun test lib/editorial-rules.test.ts` reported 14 passed / 0 failed; `bun run typecheck` succeeded; `bun run lint` exited 0 with one pre-existing `@next/next/no-img-element` warning at `components/editor/article-workspace.tsx:1454`; `bun run build` succeeded. These results describe the PR-A base before its edits, not the final branch.
