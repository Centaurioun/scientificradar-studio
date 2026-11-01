# ScientificRadar Studio — Runtime Verification Audit

**Audit date:** 2026-11-01 (Europe/Istanbul)
**Repository:** `Centaurioun/scientificradar-studio`
**Audited baseline:** `main` / `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`
**Result:** **PARTIAL VERIFICATION — 3 PASS / 1 FAIL / 8 BLOCKED.** The authoritative scenario matrix follows immediately below.
**Scope:** Independent execution attempt and cross-examination of the prior audit, 49-task backlog, master specification, v5 and v6 specifications. No application source, tests, manifests, tracked lockfiles, configuration, production integration, live site or production data was intentionally changed.


## Current authoritative scenario matrix (2026-11-01; real Brave continuation)

| ID | Scenario | Current result | Evidence boundary |
|---|---|---|---|
| RT-01 | Tests, typecheck, lint and production build | **PASS (qualified)** | Retained from frozen Bun follow-up; manifest `npm test` runner remains unverified. |
| RT-02 | Tiptap initializes without duplicate extension warnings | **FAIL** | Real Brave console emitted the same duplicate `link` and `underline` warning on editor load and reload; exact evidence below. |
| RT-03 | Basic formatting survives save/reload | **PASS (tested subset)** | Retained from earlier isolated disposable-article test. |
| RT-04 | Failed save never gives false durable acknowledgment | **PASS (controlled QA path)** | Retained from earlier isolated simulated storage failure test. |
| RT-05 | Overlapping writes cannot overwrite newer text | **BLOCKED** | No deterministic write instrumentation; current Personal profile not mutated. |
| RT-06 | Uploaded image survives session restart | **BLOCKED** | No upload or browser restart performed against the user's persistent profile. |
| RT-07 | Unsupported publishing-role transition is rejected | **BLOCKED** | No state-changing role transition attempted against seeded records. |
| RT-08 | Calendar scheduling uses shared policy | **BLOCKED** | Calendar inspected read-only; no scheduling action submitted. |
| RT-09 | Unsafe HTML cannot execute through import or preview | **BLOCKED** | No canary/import was sent into the user's persistent browser store. |
| RT-10 | SEO fingerprint is consistent across screens and linked metadata | **BLOCKED** | SEO Center inspected read-only; no linked metadata mutation or cross-view fingerprint test. |
| RT-11 | Dates, time zones, DST and hydration behave as specified | **BLOCKED** | Istanbul label/date inspected; no timezone emulation or DST/hydration test. |
| RT-12 | Mobile/tablet/desktop interactions remain reachable | **BLOCKED** | Actual viewport measured 2520×1187; exact required viewport override is unavailable through the attached browser control. |

**Current counts:** 3 PASS / 1 FAIL / 8 BLOCKED / 0 NOT APPLICABLE. **Overall: PARTIAL VERIFICATION.** Historical stages below are chronology; this table is authoritative.

## 1. Executive summary

The initial run ended at 0 PASS / 0 FAIL / 12 BLOCKED because Bun was unavailable in that execution environment. A follow-up run in the existing isolated PR #4 worktree located a compatible managed Bun binary, installed only the committed `bun.lock` dependencies in frozen mode, and ran tests, typecheck, lint, build, and limited local browser journeys. The current authoritative matrix, after a read-only continuation in the user's already-open Brave browser, is **3 PASS / 1 FAIL / 8 BLOCKED**. The earlier 3 PASS / 0 FAIL / 9 BLOCKED result is retained below as a historical stage. A duplicate Tiptap extension warning was reproduced twice in the actual Brave editor console. The other eight remaining scenarios remain blocked because this attached browser uses the user's persistent Personal profile and does not provide an isolated disposable profile or exact viewport emulation; no application data was changed.

**Historical first-attempt environment record:** The local clone and remote `main` both resolved to `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`. At that time the initial runner did not find Bun; there was no `node_modules` and no `pnpm-lock.yaml`. A frozen pnpm install correctly refused to proceed. A subsequent attempt to invoke pnpm scripts unexpectedly auto-resolved package ranges, downloaded packages and generated a pnpm lock in the isolated worktree. That generated installation was stopped and its worktree-only artifacts removed; `package.json`, `bun.lock` and tracked TypeScript build metadata were checked back to baseline. Because that resolution was not bound to the committed Bun lock, outputs from those script attempts are **invalid as baseline evidence** and are not counted as passes.

Source review retains several high-priority **unverified hypotheses** that align with existing backlog items: mutation acknowledgment vs durable save, whole-snapshot write ordering, object-URL media storage, scheduling paths, and raw HTML preview/import boundaries. These are not called runtime-confirmed failures. No new `SRS-RT-*` finding is opened without a controlled reproduction.

## 2. Repository, isolation and safety record

| Check | Observed evidence |
|---|---|
| Repository identity | `git remote -v`: origin fetch/push is `https://github.com/Centaurioun/scientificradar-studio` |
| Local state before work | Branch `main`, HEAD `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`; owner checkout had modified `.gitignore` and untracked `.trail/`, `AGENTS.md`, `opencode.json` |
| Remote baseline | `git ls-remote origin refs/heads/main` returned `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d` |
| Existing worktrees | Owner checkout plus `/Users/yusuf/.codex/worktrees/scientificradar-ui-ux-audit` at `b46960dce4d029e9341bf4b1f2a689096434a929` |
| Isolated audit checkout | `/Users/yusuf/.codex/worktrees/scientificradar-runtime-verification`, new branch `audit/scientificradar-runtime-verification` based directly on audited main SHA |
| Concurrent session check | Multiple Codex app-server processes existed; process listing did not identify another `scientificradar-studio` dev server or command. The separate worktree prevents repository-file collisions. This process check cannot prove no other idle Codex session has the repo open. |
| Runtime access | No connection to scientificradar.com or external integrations was made. Local dev attempt used requested port 4175 but failed before binding; no server remained running. |
| Final allowed-file boundary | Only this report and the permitted audit evidence directory are intended for the PR. Trail generated untracked `graft/` files are excluded from staging and commit. |

The project README, manifest, `bun.lock`, supplied project instructions, prior audit, backlog and master/v5/v6 specifications were reviewed. The currently checked-in independent audit/backlog refer to an earlier source baseline; their source assessments are not runtime evidence for the newer `c099ae0` commit.

## 3. Toolchain and command results

| Command / observation | Result | Classification |
|---|---|---|
| `node --version` | `v26.12.1` | Observed |
| `pnpm --version` | `12.15.0` | Observed |
| `npm --version` | `11.20.0` | Observed |
| `bun --version` | Command unavailable | Environment blocker |
| `test -d node_modules` | `node_modules-absent` before installation attempt | Observed baseline |
| `pnpm install --frozen-lockfile --ignore-scripts` | Exit 1, `ERR_PNPM_NO_LOCKFILE`; frozen headless install requires `pnpm-lock.yaml` | Environment/dependency setup blocker; no install from this command |
| `pnpm run typecheck` | Script printed `$ tsc --noEmit`, command wrapper returned exit 0 while pnpm auto-resolution/install was occurring | **Invalid baseline result; not PASS** |
| `pnpm run lint` | Script invocation occurred during same auto-resolution; exit/result was not captured as an independently isolated run | **Invalid baseline result; not PASS** |
| `pnpm run build` | Next 15.5.28 began “Creating an optimized production build”; run overlapped auto-resolution and did not complete as a valid baseline check; process was stopped | **BLOCKED / invalid attempt; not PASS or application FAIL** |
| `pnpm run dev -- --hostname 127.0.0.1 --port 4175` | Exit 1: Next interpreted `--hostname` as a project path (`.../scientificradar-runtime-verification/--hostname`). No server started | Failed invocation / command argument issue, not application runtime failure |
| `npm test` | Not executed. Manifest invokes `npx --yes tsx` although `tsx` is undeclared; with no npm lock this could resolve an uncontrolled tool version | Safely withheld; test result BLOCKED |
| `npm run typecheck`, `npm run lint`, `npm run build` | Not run through npm because no npm lock or installed dependencies; no uncontrolled install attempted | BLOCKED |
| Browser automation / console / viewport checks | No app server or reproducible installed browser runtime was established | BLOCKED |
| `gh pr view 1` / `gh pr diff 1` | Read-only inspection succeeded; PR #1 is Draft, open, base `main`, head `012537fd4150ed3441be5949d3d55363c35be336`, base recorded by GitHub `ead9cba72e7c0a65f562b5b772d8e02c65208238` at inspection | Read-only evidence; no patch applied |

**Dependency resolution incident and containment:** `pnpm run` triggered pnpm's automatic dependency install because no pnpm lock was present. It downloaded/resolved semver-range versions (including Next 15.5.28, React 19.3.1 and others) and wrote `pnpm-lock.yaml` and ignored `node_modules/` in the isolated worktree. This violated the intended locked-toolchain precondition, so all resulting check outputs are rejected as evidence. The build was terminated. Generated `node_modules/` and `pnpm-lock.yaml` were removed from the audit worktree, and `tsconfig.tsbuildinfo` was restored to its clean baseline. `git diff -- package.json bun.lock pnpm-lock.yaml tsconfig.tsbuildinfo` was empty afterward. No corresponding files in the owner's main checkout were touched. No package upgrades are retained or proposed.

## 4. Initial environment-blocked stage matrix (historical; superseded)

At this first stage, the scenarios below were **not executed acceptance tests**. Source presence or a declared script does not count as execution.

| ID | Required scenario | Result | Evidence / blocker |
|---|---|---|---|
| RT-01 | Tests, typecheck, lint and production build | **BLOCKED** | No Bun; frozen pnpm install refused; pnpm auto-resolution invalidated overlapping script attempts; `npm test` would invoke undeclared `tsx` via npx. |
| RT-02 | Tiptap initializes without duplicate extension warnings | **BLOCKED** | No browser runtime/console. Prior audit's source hypothesis remains to verify. |
| RT-03 | Basic editor formatting survives save/reload | **BLOCKED** | No seeded disposable browser profile or app server. |
| RT-04 | Failed save never gives false durable acknowledgment | **BLOCKED** | Settings QA control and IndexedDB failure could not be exercised. |
| RT-05 | Overlapping writes cannot silently overwrite newer text | **BLOCKED** | No deterministic browser instrumentation or two-tab profile. |
| RT-06 | Uploaded image survives session restart | **BLOCKED** | No upload/session restart executed; source shows object URL construction, which alone is not a reproduction. |
| RT-07 | Unsupported publishing-role transition rejected | **BLOCKED** | Role/status combinations not exercised in UI. Demo role simulation would not certify production authorization in any case. |
| RT-08 | Calendar scheduling uses shared publication policy | **BLOCKED** | No calendar interaction; path comparison only at source level. |
| RT-09 | Unsafe HTML cannot execute through import or preview | **BLOCKED** | No canary was imported/rendered; no XSS claim. Source contains raw HTML sinks that warrant controlled follow-up. |
| RT-10 | SEO fingerprint consistent across screens and linked metadata | **BLOCKED** | No same-data screen comparison, linked metadata mutation or quick-fix staleness test. |
| RT-11 | Dates, zones, DST and hydration behave as specified | **BLOCKED** | No running browser/time-zone matrix. PR #1 inspected but not applied; its own description lists browser QA unexecuted. |
| RT-12 | Mobile, tablet and desktop interactions reachable | **BLOCKED** | Viewports 390×844, 1024×768 and 1440×900 not rendered. |

**Historical stage counts:** executed to acceptance: 0; PASS 0; FAIL 0; BLOCKED 12; NOT APPLICABLE 0. This stage was superseded first by the locked Bun follow-up and then by the real Brave continuation above. No screenshots, browser console logs or run artifacts were fabricated.

## 5. Prior P0 claims: current disposition

Prior independent audit and backlog are documentation/source review, not runtime proof. Their major claims are reclassified as follows against the audit target:

| Claim / backlog IDs | Current disposition | Reason and next evidence needed |
|---|---|---|
| Save acknowledgment and out-of-order whole-snapshot persistence (`SRS-DATA-001/002/003`) | **Source-confirmed risk; not reproduced** | `lib/studio-context.tsx` contains async persistence and mutation flows. Must run delayed/reordered IndexedDB writes, failure control, reload and competing-tab tests on a disposable browser DB. |
| Uploaded media durability (`SRS-MED-001`) | **Source-confirmed risk; not reproduced** | `app/media/page.tsx` constructs `URL.createObjectURL(file)` and stores `src`; a browser restart experiment is required before classifying observed data loss. |
| Scheduling/publishing authorization (`SRS-PUB-001/002`) | **Source-confirmed risk; not reproduced** | Calendar source calls `saveArticle` directly after date/status checks; actual behavior must be compared with shared policy across role/status cases. Client demo role selection is not a server security boundary. |
| HTML sanitization/import/preview boundaries (`SRS-SEC-001/002`, `SRS-HTML-002`) | **Source-confirmed risk; not reproduced** | Prior source review identifies raw HTML rendering paths, including `app/pages/[id]/preview/page.tsx` and `components/knowledge/knowledge-link-popover.tsx`; no canary was executed. Need harmless inert cases across import, article preview, static preview and smart links. |
| SEO fingerprint consistency (`SRS-SEO-001/002`) | **Not investigated at runtime** | Both overview and detail compute shared audit logic in source, but linked media/source fingerprint freshness and editor panel parity were not exercised. |
| Hydration/time-zone/DST (`SRS-DATE-001`) | **Not investigated at runtime; PR #1 remains unmerged** | PR #1 proposes UTC deterministic display and schedule changes, but itself leaves test/build/browser checks unchecked. Its patch was read only, not applied. |
| Single H1/editor features/duplicate extension warning (`SRS-ED-001/002/003/007`) | **Source/spec review only** | No Tiptap initialization, formatting, figure insertion, long title or viewport test ran. |

No prior P0 item is marked complete, disproven, or runtime-confirmed by this audit. Existing task IDs remain the right place for follow-up; **no new `SRS-RT-*` finding is justified yet**.

## 6. Source-grounded observations (not runtime defects)

These observations direct the next controlled test pass; they are not bug reproduction claims:

- `lib/studio-context.tsx`: IndexedDB initialization, persistence, fallback mode and mutation callbacks are client-side. The source exposes `simulateSaveFailure` in Settings, but its visible acknowledgment behavior and recovery are untested here.
- `app/media/page.tsx`: file input creates a browser object URL and passes it as media `src`. Object URLs are scoped to their browser storage context and do not constitute stored image bytes; whether current user-facing recovery is truthful remains untested.
- `app/calendar/page.tsx`: the visible schedule handler sets status to `scheduled` and calls `saveArticle` after time/status checks. Whether other shared guards are invoked elsewhere needs full call-path runtime coverage.
- `lib/audit/publish-policy.ts`: a shared gate evaluates role, transition, blockers and dirty/failed-save inputs when those values are passed. UI callers must be checked for supplying real current state.
- `app/pages/[id]/preview/page.tsx` renders `page.bodyHtml` through `dangerouslySetInnerHTML`; article preview and knowledge-link rendering also have HTML sinks. The sanitizer/import path may constrain inputs, so these sinks alone do not prove exploitability.
- Source and specs do not implement expected v6 Sup/Sub, tables, editable HTML Source, or KaTeX features as a delivered runtime claim. These remain feature gaps from specs/backlog, not failed current acceptance tests.

## 7. Security and data-integrity conclusions

- **Data integrity:** Runtime confidence is **low / unverified**. No persistent edit, failed write, delayed write, cross-tab conflict, backup restore or revision restore was executed. Source-level risk remains high priority due the potential impact and existing P0 task criteria.
- **HTML security:** Exploitability is **unverified**. No script or event handler executed, and no malicious canary was submitted. Raw HTML rendering is a reason for an isolated, inert test, not grounds to assert XSS.
- **Authorization:** The prototype is local/demo only; production server-side authorization is explicitly deferred in the master spec. Runtime enforcement of demo role transitions and calendar policy remains unverified. Do not infer production RBAC from the role selector.
- **Production isolation:** No production domain, cloud account, external provider credential, live article, deployment or remote data store was contacted or modified.

## 8. Six-Cycle Iterative Refinement record

| Cycle | Initial evidence and competing explanations | Experiment / outcome | Reclassification and remaining uncertainty |
|---|---|---|---|
| 1 — Baseline validity | Local `main` could have drifted from remote; lockfile/toolchain may not match manifest. | Verified origin, local HEAD and `git ls-remote`; inspected package scripts and lockfiles. Bun missing, `bun.lock` present, no pnpm lock or installed dependencies. Frozen pnpm install exited `ERR_PNPM_NO_LOCKFILE`. | Baseline identity is valid; reproducible install is blocked. No runtime claim can be based on default scripts. |
| 2 — Reproduction reliability | A script returning zero or printing a build banner might indicate success, or might reflect install/process interference. | Invoked pnpm scripts in parallel; pnpm auto-installed current semver-range resolutions, commands overlapped; build did not complete and was terminated. Verified generated install artifacts were removed and tracked package/lock metadata returned to baseline. | All script outputs from this attempt are rejected, including typecheck's exit 0. No failure is attributed to application code. A clean retry requires Bun matching `bun.lock` or another explicitly pinned, safe environment. |
| 3 — Data safety and security | Static async writes/object URLs/raw HTML may indicate actual data loss or execution, but may be guarded by receipts/sanitization. | Inspected persistence, media, preview, knowledge-link and publication-policy source context. No browser could be started after rejecting dependency auto-resolution. | Retain as source-confirmed risks only; reject runtime loss/XSS assertions. Reproduction and negative canary tests remain open. |
| 4 — Edge-case expansion | Multi-tab, long text, interrupted saves, imports and DST might reveal independent failures. | No executable app/browser environment existed, so no state-mutating edge case was attempted. Source paths and backlog acceptance criteria were mapped for later tests. | All edge cases remain blocked. Do not report a negative test or infer race behavior from asynchronous code alone. |
| 5 — Cross-examination | Earlier audit may overstate current main or conflate spec gaps, source risks and observed defects. | Compared prior audit, 49-task backlog and master/v5/v6 requirements; inspected open PR #1 metadata and patch. PR #1 remains Draft/open and explicitly leaves tests/build/browser unchecked. | Existing IDs/priority order retained; no finding reclassified as pass/fail. PR #1's proposed UTC approach is not acceptance evidence and patch was not applied. |
| 6 — Independent final verification | Report could accidentally inflate attempted commands into passes or include accidental worktree changes. | Rechecked exact HEAD, GitHub PR #1 state, process list and `git status`; verified no active app process and no package/lock diff. Allowed report is the only intended tracked change. | Final result stays PARTIAL VERIFICATION; 12 scenarios blocked, zero runtime failures/passes. Uncommitted Trail cache output is excluded from staging. |

## 9. Recommended implementation and verification order

This audit changes **evidence priority**, not backlog status:

1. **Restore reproducible test setup first (`SRS-TEST-001`).** Run with Bun matching `bun.lock` in an isolated environment, or establish an authorized pinned environment. Keep test outputs separate and capture exit codes before app behavior tests.
2. **Data durability (`SRS-DATA-001/002/003`) and HTML trust boundary (`SRS-SEC-001/002`)** remain first safety investigations. Use instrumented IndexedDB delay/failure and harmless, non-executing HTML canaries; record exact before/after values.
3. **Publication (`SRS-PUB-002` then `SRS-PUB-001`)** must test actual UI paths and compare modal, editor action, calendar action, review queue and awaited persistence outcomes.
4. **Media durability (`SRS-MED-001`)** should establish whether the current product is explicitly session-only or survives a fresh browser session.
5. **SEO and editor usability** follow with shared fixture parity (`SRS-SEO-001/002`) and Tiptap warning/round-trip/mobile tests.
6. **Time-zone acceptance (`SRS-DATE-001`)** must include the actual PR #1 patch only after separately authorized merge/apply workflow; this audit does not recommend merging it without its own test evidence.

No backlog workflow status was changed. No bug fix is included in this verification branch.

## 10. Remaining blockers and required follow-up

- Run in an isolated macOS environment with Bun available and `bun install --frozen-lockfile` (or another owner-approved pinned environment). Do not use ambient `pnpm run` without a pnpm lock.
- Re-run tests, typecheck, lint and production build **sequentially**, capture each exit code/log, and confirm dependency versions against `bun.lock`.
- Start the app bound to loopback on 4175–4190; use a fresh disposable browser profile and capture real console output/screenshots.
- Execute the twelve scenarios, recording exact expected/actual values and repeated reproduction for any claimed failure.
- Verify backup import, saved-data failure/recovery, revision restore, role/status combinations, raw HTML preview/import, SEO fingerprints and DST/hydration.
- Inspect resulting report/evidence-only git diff, run `trail check`, commit only allowed documentation, push this new branch and open a separate PR to `main`. Leave PR #1/#3 unchanged and do not merge the verification PR.

## 11. Evidence and report limitations (initial stage; historical)

No screenshot, generated test fixture, browser log or claim of external service isolation beyond the observed local-only commands is included because no app browser session was established. Evidence available for independent inspection is the GitHub baseline, local isolated worktree history/status, captured command outputs recorded above, and the read-only PR #1 diff. No new runtime artifacts are needed to substantiate the BLOCKED classifications.

---

# Runtime follow-up: locked Bun environment and local browser checks

**Follow-up date:** 2026-11-01 (Europe/Istanbul)
**Execution checkout:** `/Users/yusuf/.codex/worktrees/scientificradar-runtime-verification`
**Audited code SHA:** `083b30a6ea9070372ca86484994ca5ccb0bef12d` (PR #4 head, based on `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`)
**Historical follow-up result before connecting to the user's Brave:** **PARTIAL VERIFICATION — 3 PASS / 0 FAIL / 9 BLOCKED**
**Supersedes:** the earlier environment-blocked runtime statements and matrix above. Historical install incident remains documented as chronology only; its outputs remain excluded.

## Follow-up environment and reproducibility

- Reconfirmed origin `https://github.com/Centaurioun/scientificradar-studio`; worktree branch `audit/scientificradar-runtime-verification`; `HEAD` is the SHA above and merge-base with `origin/main` is `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`.
- Worktree status before final report editing showed generated `tsconfig.tsbuildinfo` modification and untracked Trail `graft/`. The build metadata was restored to the checked-in version. `graft/` is excluded from all staging. Owner checkout was not modified.
- Existing managed Bun binary: `/Users/yusuf/.bun/bin/bun`, version `1.4.0`; Node `v26.12.1`; pnpm `12.15.0`; npm `11.20.0`. No system tooling installation was needed.
- `bun.lock` is the repository lockfile. `package.json` and tracked lockfile stayed unchanged. `bun install --frozen-lockfile` completed with exit 0 and installed 926 packages from the frozen lock. It ran pinned dependency postinstall scripts, including `re2`; no tracked dependency file changed.
- `tsx` is not declared in `bun.lock` and `node_modules/.bin/tsx` was absent. Therefore `npm test` / its `npx --yes tsx` command was deliberately not run. Existing test file was run using Bun's built-in test runner instead; no uncontrolled npx download occurred.
- Browser session was the empty Codex in-app browser session, with app at `http://127.0.0.1:4175` and a disposable local demo article. Existing personal Brave profile was not used. A separate Chrome backend/profile was unavailable. CUA exposed accessibility trees and screenshots, but not a browser console API or exact viewport control. No request to `scientificradar.com`, external provider, or production service was made.

## Actual sequential command results

All four commands ran sequentially after the successful frozen install, in the isolated worktree:

| Command | Exit | Result and evidence |
|---|---:|---|
| `/Users/yusuf/.bun/bin/bun test lib/editorial-rules.test.ts` | 0 | **PASS** — 14 tests passed, 0 failed. Uses Bun's built-in Node test compatibility; does not prove the manifest's `tsx` launcher. |
| `/Users/yusuf/.bun/bin/bun run typecheck` | 0 | **PASS** — TypeScript completed without reported errors. It updated tracked build metadata during execution; that generated change was restored before report-only staging. |
| `/Users/yusuf/.bun/bin/bun run lint` | 0 | **PASS with warning** — 0 errors; one `@next/next/no-img-element` warning at `components/editor/article-workspace.tsx:1454`. |
| `/Users/yusuf/.bun/bin/bun run build` | 0 | **PASS with warning** — Next.js 15.5.28 production build compiled and generated 28 static pages/routes. Node emitted `DEP0205` (`module.register()` deprecated). |

`bun run dev --hostname 127.0.0.1 --port 4175` started the development server successfully; the correct Next CLI argument form here is without an extra `--`. The browser reached local `/dashboard` and `/articles/...` routes with HTTP 200 in server output. Server was stopped after browser testing. Ports 3000 and 3100 were not used.

## Updated required scenario matrix

| ID | Scenario | Result | Observed evidence / limit |
|---|---|---|---|
| RT-01 | Baseline tests, typecheck, lint and production build | **PASS (qualified)** | Frozen Bun install succeeded; 14/14 test file checks, typecheck, lint and build exited 0. The package script's `npx --yes tsx` path remains unverified because `tsx` is not locked. |
| RT-02 | Tiptap initializes without duplicate extension warnings | **FAIL** | Superseded by the real Brave console reproduction documented below: duplicate `link` and `underline` warning emitted twice. |
| RT-03 | Basic editor formatting survives save and reload | **PASS (tested subset)** | Created local disposable article, observed `Saved (Local)` and History(1), opened its stable `/articles/{id}/edit` route after reload/navigation, and saw title, H2/H3, bold, italic, list, and blockquote content retained. Subscript was stripped to plain `CO2`; superscript/subscript remain a known feature gap. |
| RT-04 | Failed save never produces a false durable acknowledgment | **PASS (controlled QA path)** | Enabled Settings → “Simulate Storage Write Failure” and, while provider state remained mounted, edited the disposable article summary. UI explicitly showed `Save failed — changes not persisted`, Retry controls, and `Changes remain unsaved`; it did not say Saved. Retry/recovery persistence was not tested. |
| RT-05 | Overlapping writes do not silently overwrite newer text | **BLOCKED** | No deterministic delay/reordering instrumentation or reproducible competing write test was available. One write-failure control does not test write races. |
| RT-06 | Uploaded image survives appropriate session restart | **BLOCKED** | No file chooser/upload automation or isolated fresh-profile asset round-trip was completed. Existing source object-URL risk remains unconfirmed at runtime. |
| RT-07 | Unsupported publishing-role transition is rejected | **BLOCKED** | On Draft article, switching the demo selector to Author removed the `Publish (Demo)` action; Reviewer showed `Submit for Review` but no publish action. This is UI affordance evidence only, not an attempted shared-policy transition or production authorization test. |
| RT-08 | Calendar scheduling respects shared publication policy | **BLOCKED** | Calendar/editor/review transition matrix was not exercised; the later Brave inspection was read-only. |
| RT-09 | Unsafe HTML cannot execute through import or preview | **BLOCKED** | No HTML canary was sent through import or preview. The accessibility tree cannot establish DOM attribute safety or script execution. No exploit is claimed. |
| RT-10 | SEO fingerprint consistent across screens and linked metadata | **BLOCKED** | SEO Center was later inspected read-only, but no controlled same-data comparison or linked source/media mutation/fingerprint check was completed. |
| RT-11 | Dates, time zones, DST and hydration behave as specified | **BLOCKED** | The app displayed local demo dates and Istanbul zone labeling, but no timezone matrix, DST boundary, UTC round trip, or browser console/hydration warning inspection. PR #1 was not applied. |
| RT-12 | Mobile/tablet/desktop interactions remain reachable | **BLOCKED** | Later measurement in actual Brave was 2520×1187; exact 390×844, 1024×768 and 1440×900 overrides remain unavailable. No responsive acceptance claim. |

At the historical follow-up stage no scenario was classified FAIL. The later actual-Brave console reproduction changes RT-02 to FAIL. Overall status remains **PARTIAL VERIFICATION**; counts treat only explicitly exercised acceptance subsets as PASS, not whole-product acceptance.

## Browser reproductions and evidence

### RT-03 — saved content restored on stable article route (PASS, high confidence for tested content)

1. Local app at `127.0.0.1:4175`, fresh Codex IAB local session, seed list initially contained nine articles.
2. Created disposable draft titled `SRS QA disposable — Unicode αβ 2026-11-01` with body containing H2 Methods, strong/emphasis text, H3 Subsection, a two-item unordered list, blockquote, and CO2 subscript markup.
3. Waited for visible `Saved (Local)` and `History (1)` acknowledgment.
4. Reloading `/articles/new` produced a blank new draft because that route allocates a new fallback ID on each mount. Initially this looked like possible loss; checking the Articles list found the original saved article at stable ID `art-1793492478398`. This is a **negative test against the data-loss hypothesis**: it was not lost. The distinct `/new` route is not a reopen route.
5. Opened `/articles/art-1793492478398/edit`; the stored title, heading hierarchy, bold/italic, list items, and quote were present in the browser accessibility tree and rendered screenshot. CO2 rendered as plain `CO2`, consistent with unsupported Sup/Sub markup.
6. Deleted only this local QA article using the app's explicit “Delete Permanently” confirmation. Article list returned to 9. No seeded article was modified.

Coverage limit: the tested save was a single successful write, not concurrent writes or browser-profile restart. Confidence is high only for the observed content round-trip on the stable-ID route.

### RT-04 — configured storage failure receipt (PASS, high confidence for visible acknowledgment)

1. Opened Settings and enabled the explicit QA control “Simulate Storage Write Failure”.
2. Navigated within the SPA to the disposable draft so the provider-scoped QA flag remained active. A full page navigation remounts the provider and resets that flag; that first attempt was not a valid failure run and was excluded.
3. Changed the draft's summary to `FAILURE-CANARY-SECOND-UNSAVED` and waited for autosave.
4. Browser displayed `DRAFT · V1 · Save failed — changes not persisted`, retry controls, and an explicit message that changes remain unsaved. No `Saved` acknowledgment appeared.
5. After leaving the failed editor and reopening the local article with the failure flag disabled, its summary was `FAILURE-CANARY-UNSAVED-ONLY` from the prior successful write, not the failed second value. This confirms the failed value was not persisted in the observed store. The temporary draft was then deleted.

Expected: failed write is visibly distinguished from durable save and unsaved value is not represented as durable. Actual: observed as expected. We did not activate Retry or verify successful recovery after disabling failure; retry/recovery remains open.

## Failure and negative-test register

- **Historical follow-up:** no runtime-confirmed failure. **Real Brave continuation:** one reproducible console-warning failure is recorded as `SRS-RT-001` below; its underlying extension-registration cause is not yet identified.
- **Rejected apparent data-loss hypothesis:** Reloading `/articles/new` yielded a blank editor, but the saved article was present in the list and reopened with its content at its stable ID. This does not reproduce loss. Route identity needs to be part of future reload test setup.
- **Confirmed UI behavior, not a defect:** QA write-failure control showed explicit failed/not-persisted status and the old durable summary survived. This negative test supports the acknowledgment behavior for the controlled failure path.
- **Role observation is limited:** Author did not see a Publish action on a Draft article; this is not proof of policy enforcement against alternate callers or production RBAC.
- **Long-title observation:** the 43-character title appeared clipped in the title field at the default, non-measured viewport. This is exploratory only; it does not independently reproduce the backlog's exact long-title case or establish mobile clipping.

## Original P0 re-assessment after runtime evidence

| Prior claim | Updated classification | Priority implication |
|---|---|---|
| Save acknowledgment may falsely report durable save (`SRS-DATA-001`) | **Runtime-confirmed pass for one controlled simulated write failure**, while other failure modes remain source risks and untested | Retain high priority until failed real IndexedDB operation, retry, crash/navigation and receipt semantics are covered. Narrow the test claim; do not close backlog. |
| Overlapping whole-store writes may lose latest edit (`SRS-DATA-002/003`) | **Source-confirmed risk, not reproduced** | No priority reduction; deterministic write-order test still first data-integrity follow-up. |
| Media object URLs may not survive reload (`SRS-MED-001`) | **Source-confirmed risk, not reproduced** | No priority reduction. |
| Schedule path may bypass common publication validation (`SRS-PUB-001/002`) | **Source-confirmed risk, not reproduced** | No priority reduction; calendar path remains untested. |
| Raw HTML paths may accept unsafe content (`SRS-SEC-001/002`, `SRS-HTML-002`) | **Source-confirmed risk, not reproduced** | No priority reduction; no sanitizer or preview canary was tested. |
| SEO consistency/fingerprint (`SRS-SEO-001/002`) | **Not investigated at runtime** | Unchanged. |
| Time-zone/hydration (`SRS-DATE-001`) | **Not investigated at runtime** | Unchanged; PR #1 remains unmerged/unapplied. |
| Editor initialization/round trip (`SRS-ED-*`) | **Runtime-confirmed duplicate-extension warning (`SRS-RT-001`); basic formatting subset remains a prior isolated PASS** | Keep editor integration issue open; do not infer data corruption from the warning alone. Existing unsupported Sub/Sup, tables, source editing and KaTeX are feature gaps, not runtime failures. |

### Security and data-integrity confidence

- **Data integrity: medium confidence** that a single saved draft's tested formatting survived stable-route reload and that the explicit QA simulated failure was not durably acknowledged. **Low confidence** about races, interruptions, retry/revision recovery and cross-tab behavior because they were not exercised.
- **HTML security: low confidence / unverified.** No unsafe canary was executed. No XSS vulnerability is asserted; no negative security test is counted.
- **Authorization: low confidence / unverified.** The local demo role selector and absence of a publish button are UI behavior, not enforcement evidence for alternate entry points or production.
- **Production isolation: high confidence for observed run**: app was bound to loopback, UI identified local IndexedDB and said production untouched, and no external integration was configured or visited.

## Six-Cycle Iterative Refinement (follow-up)

| Cycle | Initial evidence / competing explanations | Experiment and actual outcome | Retained/rejected conclusions; remaining uncertainty |
|---|---|---|---|
| 1 — Baseline validity | Previous attempt concluded no compatible Bun; possibility that only package-manager resolution was blocked. | Inspected existing isolated PR worktree, HEAD/base and clean tracked dependency files; found managed Bun 1.4.0 and tracked `bun.lock`; `bun install --frozen-lockfile` exited 0. | Reclassified setup from blocker to reproducible locked environment. Initial pnpm auto-resolution outputs remain invalid. Bun installation does not make unpinned `tsx` part of the lock. |
| 2 — Reproduction reliability | A green command could still use an untracked runner or contaminated install. | Ran frozen Bun install, then one test file, typecheck, lint and build sequentially; checked exit outputs and warnings. | Retained 14/14 native Bun test pass, typecheck pass, lint pass with warning, build pass with Node warning. Rejected the claim that `npm test` was verified. |
| 3 — Data safety and security | Blank editor after reload could indicate loss; save-error UI could falsely say saved; raw HTML/security risk is static-only. | Created local fixture, waited for save receipt, reopened via stable ID; enabled QA failure control and submitted a distinct summary; inspected visible result and subsequent stored value. | Rejected data-loss assertion for the `/new` blank route; retained controlled failure-acknowledgment pass. Retry and HTML boundary remain untested. |
| 4 — Edge-case expansion | Role affordances might differ by editor role; data failure QA state could reset on navigation and invalidate reproduction. | Switched Draft fixture to Author and Reviewer; observed publish action absent; compared full navigation (QA flag resets) with SPA navigation (flag retained); checked failed value against durable old value. | Kept role evidence as limited UI observation, not policy pass. First non-failing edit was excluded because full navigation reset the injected QA state. No race, media, DST or viewport edge test was available. |
| 5 — Cross-examination | Earlier P0 hypotheses may be overstated; successful smoke checks might falsely close backlog tasks. | Compared limited runtime evidence with prior source review/backlog and the already-read master/v5/v6 specs; checked the app's own local-only banner; deleted the disposable article and confirmed nine seed rows remain. | Narrowed only editor roundtrip and simulated-save acknowledgment claims. No source-risk backlog item marked complete; no new runtime defect ID justified. |
| 6 — Independent final verification | Report could preserve obsolete 12-blocked language, miscount scenarios, or include test artifacts. | Rechecked HEAD, PR #4 open/unmerged, report-only intended edit boundary, stopped dev server, removed local QA article, restored `tsconfig.tsbuildinfo`, and recounted RT matrix. | Historical follow-up state at this cycle: 3 PASS / 0 FAIL / 9 BLOCKED (before the real Brave continuation). The `npm test` runner, console warnings, deterministic races, uploads, policy paths, sanitizer/import, SEO, timezone/DST and exact viewport checks remain explicitly unverified. |

## Remaining blockers and recommended next verification order

1. Build deterministic IndexedDB delayed/reordered/failure/retry and two-tab tests with temporary instrumentation outside tracked source; keep `SRS-DATA-002/003` high priority.
2. Exercise calendar, editor and review queue transitions against the same policy for author/reviewer/editor, blockers, dirty changes and previously published status; keep `SRS-PUB-*` high.
3. Test imported and previewed inert HTML canaries and inspect actual DOM/console behavior, including static pages and Smart Knowledge Links; keep `SRS-SEC-*` high until evidence exists.
4. Upload a generated local image and test its URL/bytes after a fresh isolated browser session; keep `SRS-MED-001` open.
5. Add coverage for SEO fingerprint parity, metadata invalidation, timezone/DST/UTC round-trips, hydration console, exact responsive viewports, editor undo/redo/figure insertion and duplicate extension warnings.
6. Determine a reproducible locked test launcher for the manifest test script. `tsx` is not in the Bun lock; do not use `npx --yes` or resolve an unpinned tool. The direct Bun test run is useful evidence but not proof that `npm test` or the package's declared runner works.

PR #4 remains open and unmerged. This follow-up is documentation-only; application code, tests, `package.json`, `bun.lock`, existing backlog/specifications and production systems were not changed.


---

# Real Brave continuation — existing user session (read-only)

**Observation time:** 2026-11-01 03:58 Europe/Istanbul (00:58 UTC)
**Browser:** installed Brave Browser, PID 58945, `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`, app 156.1.98.60 / Chromium 156.0.8078.48 (version previously verified from this running installation).
**Automation:** existing Brave extension tab control (Playwright-compatible tab API); attached to the already-open user tab `http://127.0.0.1:4175/dashboard`. No browser process/profile was launched or closed. The same tab was returned to `/dashboard` at the end.
**Application source SHA:** `083b30a6ea9070372ca86484994ca5ccb0bef12d` (PR #4 application code baseline; report-only head is `453bc1a3cf49f5f19b1cb04c98caac01493f3bd2`). Local server remained loopback-only at 127.0.0.1:4175 (listener PID 29105).
**Profile/isolation:** Brave browser metadata identified profile `Personal`. The profile already contained the app's nine seeded articles and persisted IndexedDB. Because this is not the requested disposable browser profile, this continuation performed only route navigation, DOM reads, console reads and screenshots; it did not edit article fields, change the role selector, schedule, upload, import, or trigger save/publish actions. This safety limitation is why mutation scenarios remain BLOCKED.

## Reproduced finding — SRS-RT-001 (RT-02 FAIL)

- **Starting state:** local development server at `127.0.0.1:4175`; existing Brave Personal profile; dashboard tab open; Editor (Demo) selected.
- **Steps:** navigate the same tab to `/articles/art-amoc-mooring-2026/edit`; read browser console warning entries; reload the same editor route; read console entries again.
- **Expected:** Tiptap editor initializes without duplicate extension-name warnings.
- **Actual:** editor content and toolbar mounted, but the real Brave console emitted `[tiptap warn]: Duplicate extension names found: ['link', 'underline']. This can lead to issues.` at `2026-11-01T00:58:05.691Z` and again at `2026-11-01T00:58:29.506Z` (UTC). The second independent mount/reload reproduces the warning.
- **Confidence:** high that the warning is emitted on repeated editor mount in this environment; low that it causes a user-visible editing or persistence defect because no such effect was tested.
- **Source link / candidate cause:** [`components/editor/article-tiptap-editor.tsx` (lines 57–72)](https://github.com/Centaurioun/scientificradar-studio/blob/083b30a6ea9070372ca86484994ca5ccb0bef12d/components/editor/article-tiptap-editor.tsx#L57-L72) registers `Underline` and `LinkExtension` alongside `StarterKit`. This is consistent with the runtime warning but is not by itself proof of the resolved duplicate source; extension defaults/composition still need controlled confirmation.
- **Competing explanations:** an app bundle configuration issue is more likely than browser-extension interference because the warning source is the app bundle's `@tiptap/core` module; however, this does not identify which configured extensions register duplicate names or prove functional breakage.
- **Regression test proposal:** mount the article editor in a browser test twice (fresh navigation/reload) and assert no duplicate-extension warning is emitted while Link and Underline commands remain functional.
- **Backlog relation:** editor extension initialization (`SRS-ED-*`); new runtime evidence ID `SRS-RT-001`. Do not close any editor/backlog task based only on warning absence after a code change.

## Other observations from the same session

- Browser tab remained the user's existing Brave tab. The visible dashboard, article editor, calendar and SEO Center all rendered from `127.0.0.1:4175`; no production route or external service was opened.
- Editor route exposed the seeded draft's title, existing body, formatting toolbar, metadata inspector and `Saved (Local)` status. No content was changed.
- Calendar showed `Europe/Istanbul`, a selected `IN_REVIEW` article, a future local date input and an enabled-looking `Assign Publication Slot` control in the DOM. No click was made; this is not evidence of a policy bypass or a policy pass.
- SEO Center rendered its nine-row audit and article-level links. This was not a same-input comparison with the editor SEO panel or an audit freshness test.
- Exact measured CSS viewport was `window.innerWidth=2520`, `window.innerHeight=1187`, `document.documentElement.clientWidth=2520`, `scrollWidth=2520` on the dashboard. This does not exercise the requested 1440×900, 1024×768 or 390×844 sizes. The attached browser API advertised no viewport override capability.
- Actual Brave screenshots of the editor and final dashboard were captured in the live session and displayed to the user. No screenshot file is attached to this report because the supported existing-tab capture returned an in-memory image only; no fabricated or unrelated prior temporary-profile screenshot is cited as evidence.

## Six-Cycle Iterative Refinement — existing Brave continuation

| Cycle | Initial evidence and competing hypotheses | Experiment and outcome | Conclusion and remaining uncertainty |
|---|---|---|---|
| 1 — Browser tooling | Prior CUA could inspect accessibility trees but not console; possible user Brave was still inaccessible. | Enumerated already-open Brave tabs through its installed browser extension; attached to the existing dashboard tab; `tab.dev.logs` returned actual page console entries. | Reclassified console access from unavailable to available through the user's existing Brave extension. No new browser was launched. |
| 2 — Environment isolation | The attached profile might be disposable, or might share the user's local app DB. | Inspected browser metadata, tab URL, app banner, visible nine seeded records and editor state. Profile identified as Personal and app states local IndexedDB. | Rejected the disposable-profile assumption. Kept all further actions read-only; isolated mutation tests remain blocked. |
| 3 — Data and HTML | Earlier source hypotheses might be runtime defects, but testing them here could mutate persistent user data. | Read editor/Calendar/SEO DOM and logs; did not edit, upload, import or submit actions. | No new IndexedDB/media/HTML claim is made. These tests remain blocked for this session, rather than being reported as passes or failures. |
| 4 — Editorial workflows | Calendar and SEO pages could reveal policy/fingerprint behavior without mutation, but UI visibility alone may overstate acceptance. | Inspected calendar status/date and SEO table; compared no state transitions and modified no metadata. | Kept RT-08 and RT-10 blocked. DOM affordances and displayed dates are not policy or freshness verification. |
| 5 — Adversarial rechecking | A single warning might be transient or caused by one-time hydration. | Reloaded the same article editor route and read captured console again; same warning appeared at two distinct UTC timestamps. | Reclassified RT-02 from blocked to reproducible FAIL. Root cause and functional impact remain unknown. |
| 6 — Final independent verification | Route testing could leave the user on a changed app screen or accidentally alter records. | Confirmed measured viewport, returned the same tab to `/dashboard`, took a final screenshot and checked report-only worktree plus existing server PID. | Browser remains open on its original dashboard route; no app data was mutated by this continuation. Current authoritative result is 3 PASS / 1 FAIL / 8 BLOCKED. |

## Updated priority implication

The editor duplicate-extension warning is now runtime-confirmed and should be investigated before declaring Tiptap initialization clean. It does **not** by itself prove lost content, broken links, unsafe HTML or failed saves. Data-race, media durability, publication authorization, HTML security, SEO freshness and time-zone risks remain unverified and retain their earlier priorities. The user's persistent Brave profile is not a safe substitute for the isolated test profile required for those mutation scenarios.
