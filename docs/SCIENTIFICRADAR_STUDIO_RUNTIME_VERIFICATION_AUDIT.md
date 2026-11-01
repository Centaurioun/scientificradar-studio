# ScientificRadar Studio — Runtime Verification Audit

**Audit date:** 2026-11-01 (Europe/Istanbul)
**Repository:** `Centaurioun/scientificradar-studio`
**Audited baseline:** `main` / `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`
**Result:** **PARTIAL VERIFICATION — 3 PASS / 4 FAIL / 5 BLOCKED.** The authoritative scenario matrix follows immediately below.
**Scope:** Independent execution attempt and cross-examination of the prior audit, 49-task backlog, master specification, v5 and v6 specifications. No application source, tests, manifests, tracked lockfiles, configuration, production integration, live site or production data was intentionally changed.


## Current authoritative scenario matrix (2026-11-01; real Brave continuation)

| ID | Scenario | Current result | Evidence boundary |
|---|---|---|---|
| RT-01 | Tests, typecheck, lint and production build | **PASS (qualified)** | Retained from frozen Bun follow-up; manifest `npm test` runner remains unverified. |
| RT-02 | Tiptap initializes without duplicate extension warnings | **FAIL — SRS-RT-001** | Actual Brave console emitted the duplicate `link` and `underline` warning on repeated editor mounts. |
| RT-03 | Basic formatting survives save/reload | **PASS (tested subset)** | Separate-origin test article title, summary and Unicode body survived actual Brave reload. |
| RT-04 | Failed save never gives false durable acknowledgment | **PASS (controlled QA path)** | Retained from earlier isolated simulated storage failure test. |
| RT-05 | Overlapping writes cannot overwrite newer text | **FAIL — SRS-RT-003** | Two same-origin Brave tabs each showed `Saved (Local)`; a stale second-tab write reverted a newer title after reload. Repeated twice. |
| RT-06 | Uploaded image survives session restart | **BLOCKED** | Generated local PNG upload was blocked because the Brave extension cannot access local file URLs; no permission was changed and no upload occurred. |
| RT-07 | Unsupported publishing-role transition is rejected | **FAIL — SRS-RT-002** | Author (Demo) scheduled a disposable Draft from the calendar; shared transition policy forbids Author→scheduled. |
| RT-08 | Calendar scheduling uses shared policy | **FAIL — SRS-RT-002** | Calendar changed disposable Draft records to Scheduled without shared transition validation; repeated across Editor and Author demo roles. |
| RT-09 | Unsafe HTML cannot execute through import or preview | **BLOCKED (negative subcase passed)** | Safe-link dialog explicitly rejected inert `javascript:void(0)`; import, preview, SVG/event attributes and knowledge-link rendering remain untested. |
| RT-10 | SEO fingerprint is consistent across screens and linked metadata | **BLOCKED (parity subcase passed)** | Editor panel, SEO Center row and article audit matched at 1 error / 6 warnings / 10 passed / 2 unverified; linked metadata freshness and Quick Fix staleness remain untested. |
| RT-11 | Dates, time zones, DST and hydration behave as specified | **BLOCKED (Istanbul round-trip subcase passed)** | `2026-11-06 14:45 Europe/Istanbul` round-tripped to `2026-11-06T11:45:00.000Z`; UTC/New York/DST/hydration matrix not run. |
| RT-12 | Mobile/tablet/desktop interactions remain reachable | **BLOCKED** | Brave measured 2520×1187; requested viewport overrides returned no effective resize, so 1440×900, 1024×768 and 390×844 were not exercised. |

**Current counts:** 3 PASS / 4 FAIL / 5 BLOCKED / 0 NOT APPLICABLE. **Overall: PARTIAL VERIFICATION.** Historical stages below are chronology; this table is authoritative.

## 1. Executive summary

The initial run ended at 0 PASS / 0 FAIL / 12 BLOCKED because Bun was unavailable in that execution environment. A follow-up run in the existing isolated PR #4 worktree located a compatible managed Bun binary, installed only committed `bun.lock` dependencies in frozen mode, and ran tests, typecheck, lint, build, and local browser journeys. Subsequent verification used the user's already-open Brave against a separate local test origin, `srs-audit-20261101.localhost:4175`, and disposable QA articles. Current result is **3 PASS / 4 FAIL / 5 BLOCKED**. In addition to the repeated Tiptap warning, a two-tab stale-snapshot write lost a newer title twice, and the Calendar transitioned Draft articles to Scheduled for both Editor and Author demo roles despite the shared policy. Media upload remains blocked by extension file-URL access; no browser permission was changed. Several security, metadata freshness, DST and exact viewport subcases remain unverified. The earlier 3 PASS / 0 FAIL / 9 BLOCKED and 3 PASS / 1 FAIL / 8 BLOCKED stages remain historical only.

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
| Save acknowledgment and out-of-order whole-snapshot persistence (`SRS-DATA-001/002/003`) | **Runtime-confirmed multi-tab lost update (`SRS-RT-003`); simulated write-failure acknowledgment subset passed** | Stale second-tab write reverted a newer title twice after both tabs showed Saved. Raw object-store read and deterministic write-delay instrumentation remain unavailable. |
| Uploaded media durability (`SRS-MED-001`) | **Not investigated at runtime** | Generated PNG upload was blocked at file chooser by Brave extension file-URL access. No image was uploaded and object-URL durability remains unverified. |
| Scheduling/publishing authorization (`SRS-PUB-001/002`) | **Runtime-confirmed Calendar policy bypass (`SRS-RT-002`)** | Draft→Scheduled persisted through Calendar under both Editor and Author demo roles, against the shared transition table. This is demo workflow behavior, not production authentication evidence. |
| HTML sanitization/import/preview boundaries (`SRS-SEC-001/002`, `SRS-HTML-002`) | **Safe-link negative subcase passed; remaining boundaries unverified** | Safe-link dialog rejected `javascript:void(0)`. Import, inline handlers, SVG, article/static preview and Smart Knowledge Links remain untested; no XSS is claimed. |
| SEO fingerprint consistency (`SRS-SEO-001/002`) | **Cross-screen parity subcase passed; linked metadata freshness unverified** | Editor panel, SEO Center and article audit findings matched for one disposable article. No source/media metadata mutation or stale Quick Fix test ran. |
| Hydration/time-zone/DST (`SRS-DATE-001`) | **Istanbul UTC round-trip subcase passed; broader matrix unverified; PR #1 remains unmerged** | Two local Istanbul values round-tripped through UTC. UTC/New York emulation, DST boundaries and hydration warnings remain untested. PR #1 was read only, not applied. |
| Single H1/editor features/duplicate extension warning (`SRS-ED-001/002/003/007`) | **Runtime-confirmed duplicate-extension warning (`SRS-RT-001`); basic round-trip subset passed** | Warning repeated in actual Brave. Other formatting, figure insertion and exact responsive/long-title behavior remain partial or untested. |

No prior P0 task is closed. Three runtime findings (`SRS-RT-001`, `SRS-RT-002`, `SRS-RT-003`) are now open and should raise editor initialization, data integrity and publication-policy work in the implementation order below.

## 6. Initial source-only observations (historical; not runtime conclusions)

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
| Overlapping whole-store writes may lose latest edit (`SRS-DATA-002/003`) | **Runtime-confirmed stale-tab lost update (`SRS-RT-003`)** | Raise immediate priority; repeatable stale write reverted title after both local save acknowledgments. Delayed/reordered write instrumentation and direct object-store inspection remain untested. |
| Media object URLs may not survive reload (`SRS-MED-001`) | **Source-confirmed risk, not reproduced** | No priority reduction. |
| Schedule path may bypass common publication validation (`SRS-PUB-001/002`) | **Runtime-confirmed local Calendar policy bypass (`SRS-RT-002`)** | Raise priority; Editor and Author demo roles scheduled Draft fixtures. No production authentication inference. |
| Raw HTML paths may accept unsafe content (`SRS-SEC-001/002`, `SRS-HTML-002`) | **Safe-link UI rejected one inert `javascript:` URL; other raw HTML boundaries remain unverified** | Keep high priority; no import or preview XSS claim. |
| SEO consistency/fingerprint (`SRS-SEO-001/002`) | **One editor/center/article-audit parity subset passed; linked metadata fingerprint freshness unverified** | Keep tasks open until source/media invalidation and Quick Fix staleness are tested. |
| Time-zone/hydration (`SRS-DATE-001`) | **Two Europe/Istanbul UTC conversion subcases passed; UTC/New York/DST/hydration remain unverified** | Keep task open; PR #1 remains unmerged/unapplied. |
| Editor initialization/round trip (`SRS-ED-*`) | **Runtime-confirmed duplicate-extension warning (`SRS-RT-001`); basic formatting subset remains a prior isolated PASS** | Keep editor integration issue open; do not infer data corruption from the warning alone. Existing unsupported Sub/Sup, tables, source editing and KaTeX are feature gaps, not runtime failures. |

### Security and data-integrity confidence

- **Data integrity: high confidence** that the tested same-origin stale-tab sequence lost a newer title twice after both tabs displayed `Saved (Local)`; medium confidence on the broader storage mechanism because raw IndexedDB records and deterministic delayed-write instrumentation were unavailable. The separate controlled failed-write UI acknowledgment subset remains a pass.
- **HTML security: low confidence / mostly unverified.** The safe-link dialog rejected one inert `javascript:` URL. Import and rendered HTML paths were not tested; no XSS vulnerability or exploit is asserted.
- **Authorization: high confidence** that the demo Calendar path permits a forbidden Draft→Scheduled transition and Author scheduling in the local prototype; **no production authentication/security conclusion** follows from its demo role selector.
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

The editor duplicate-extension warning, cross-tab stale-write loss and Calendar policy bypass are now runtime-confirmed. Prioritize data integrity and publication-policy enforcement ahead of media durability and full sanitizer coverage. The unsafe-link subcase passed and the tested Istanbul UTC conversion round-tripped; neither closes its broader scenario. See the latest Brave continuation below; older continuation sections are historical stages.

## Latest real-Brave continuation — isolated local test origin

**Observation time:** 2026-11-01 04:04–04:14 Europe/Istanbul (01:04–01:14 UTC).

**Browser:** the already-running user's installed Brave, Chromium 156.0.8078.48. No Brave process was launched or closed. Automation used the existing Brave extension tab API with Playwright-compatible locators plus the extension's accessible form `setValue` input for native `datetime-local`/role controls.

**Application:** existing local Next dev server, loopback port 4175, opened through `http://srs-audit-20261101.localhost:4175`; this is a distinct browser origin from the user's earlier `http://127.0.0.1:4175` tab, so its IndexedDB store was independently seeded. Tested application source matches audited `main` baseline `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`; comparison against prior audit code snapshot `083b30a6ea9070372ca86484994ca5ccb0bef12d` found no non-documentation differences. Audit docs branch head before this continuation was `f8a73ba02623e75f8eca02148d0a283489f4a4d7`.
**Test data:** only generated QA articles with `SRS QA` titles were changed. Seeded articles and production were not modified. Test origin now contains three disposable QA articles; cleanup was not attempted because a safe recoverable deletion path was not established. A generated 1×1 PNG stayed at `/tmp/srs-runtime-canary.png`; the browser did not upload it.

### New verified finding — SRS-RT-003 (RT-05 FAIL, high confidence)

- **Precondition:** two tabs in the same already-open Brave profile and exact same local origin, both editing disposable article `art-1793495484303` (`SRS QA Author Schedule 20261101 Charlie`). Both tabs hydrated the same starting title, summary and body.
- **Reproduction (first run):** in tab A change the title to `SRS QA Author Schedule 20261101 Charlie TAB-A`; let its save complete. In stale tab B replace the summary with `Tab B summary write from stale snapshot.`; let its save complete. Reload tab A. Tab A then showed the original title `SRS QA Author Schedule 20261101 Charlie` and tab B's new summary.
- **Reproduction (second run):** from the now-converged state, tab A changed the title to `... Charlie TAB-A2`; after both tabs showed `Saved (Local)`, stale tab B changed the summary to `Tab B summary write repeat 2 from stale snapshot.` and showed `Saved (Local)`. Reload tab A: title reverted to the original and the new tab-B summary remained. Both repetitions produced the same lost-field result.
- **Expected:** reject a stale revision with a conflict or preserve both independent field edits. **Actual:** each tab displayed `Saved (Local)`, but the later stale whole-article snapshot silently restored the old title while applying the new summary. The result was re-read after reload.
- **Competing explanations checked:** both tabs had the same origin and article ID; both were hydrated and the changed tab displayed a local save acknowledgment. A reload of tab A after tab B's acknowledgment confirmed the stored combined result differed from the latest value previously acknowledged by tab A. The browser evaluation bridge did not expose `window.indexedDB`, so the raw object-store record could not be independently queried; the reload behavior is the persistence oracle here.
- **Likely cause (not a proven sole cause):** `persistArticleDraft` checks `expectedVersion` against the current tab provider snapshot and writes a built database snapshot; `persistState` issues a whole-snapshot `db.put`. Separate provider snapshots have no demonstrated cross-tab coordination. Relevant source: [`lib/studio-context.tsx` (lines 256–278, 618–670)](https://github.com/Centaurioun/scientificradar-studio/blob/c099ae0a78bf69a4b5f58785dcf2c3512e9b270d/lib/studio-context.tsx#L256-L278) and [draft persistence (lines 618–670)](https://github.com/Centaurioun/scientificradar-studio/blob/c099ae0a78bf69a4b5f58785dcf2c3512e9b270d/lib/studio-context.tsx#L618-L670).
- **Focused regression test:** open two same-origin contexts from the same stored version; save disjoint fields in each; require a stale second write to return a version conflict or merge without reverting the first field; reload both tabs and assert title and summary equal the latest acknowledged values.
- **Backlog relation:** data snapshot concurrency/revision tasks (`SRS-DATA-*`); new verified runtime finding `SRS-RT-003`.

### New verified finding — SRS-RT-002 (RT-07 and RT-08 FAIL, high confidence)

- **Policy:** `ALLOWED_STATE_TRANSITIONS.draft` permits only `in_review` or `archived`; `canTransitionStatus` also rejects `scheduled` as an Author target. Source: [`lib/editorial-rules.ts` (lines 327–388)](https://github.com/Centaurioun/scientificradar-studio/blob/c099ae0a78bf69a4b5f58785dcf2c3512e9b270d/lib/editorial-rules.ts#L327-L388).
- **Calendar reproduction:** select disposable Draft `art-1793495066954`, choose a future slot and click `Assign Publication Slot`; the local calendar changed it from `DRAFT` to `SCHEDULED`. Repeated using separate disposable Draft `art-1793495402547`; the article status persisted on the editor route after hydration/reload.
- **Role reproduction:** create disposable Draft `art-1793495484303`, select `Author / Contributor (Demo)`, choose `2026-11-08T11:00` using the visible accessibility control, then assign the slot in the local calendar. The UI reported `Scheduled "SRS QA Author Schedule 20261101 Charlie" for 08.11.2026 11:00 GMT+3 (UTC: 2026-11-08T08:00:00.000Z)` and the calendar/editor showed `SCHEDULED · Saved (Local)`.
- **Expected:** Draft→Scheduled is rejected by the shared state transition table; an Author cannot schedule. **Actual:** calendar directly persisted `status: scheduled` for Draft content in both Editor and Author demo roles. This is local demo workflow evidence only, not a claim about production authentication.
- **Likely cause:** Calendar's `handleSchedule` writes `{...target, status: 'scheduled', scheduledAt}` through `saveArticle` rather than calling the shared transition validator. Source: [`app/calendar/page.tsx` (lines 59–105)](https://github.com/Centaurioun/scientificradar-studio/blob/c099ae0a78bf69a4b5f58785dcf2c3512e9b270d/app/calendar/page.tsx#L59-L105).
- **Competing explanations checked:** the test used a future Istanbul-local slot, not a past time; stored UTC and displayed GMT+3 agreed; the selected records were visibly `[DRAFT]`; the status change was observed in the calendar list and editor after hydration. The first two attempts used Playwright `fill()` for a `datetime-local` input and the UI submitted its default value; no date-bug finding is filed from those runs. Repeating with the actual accessibility `setValue` interaction preserved the entered time and reproduced the policy bypass.
- **Focused regression test:** parameterize Draft/Author/Reviewer/Editor/Owner against calendar assignment; assert denied combinations retain status and schedule time after reload, and allowed Editor scheduling starts from Approved. Compare calendar, editor and review-queue transition paths.
- **Backlog relation:** publication transition/policy tasks (`SRS-PUB-*`); new runtime finding `SRS-RT-002`.

### Additional Brave subcase results

- **RT-02:** the active local article editor emitted `[tiptap warn]: Duplicate extension names found: ['link', 'underline']. This can lead to issues.` at `2026-11-01T01:14:05.952Z`; earlier two Brave observations are recorded in `SRS-RT-001`. No other local-app warning/error was returned in the latest filtered console sample. Extension warning remains a confirmed initialization defect, with functional impact untested.
- **RT-03:** generated title, summary and Unicode Greek body survived an actual Brave reload at the stable article URL; a different test-origin article also reloaded with its local changes. This is a content round-trip subset, not proof for every editor extension/revision workflow.
- **RT-06:** file input is hidden under `Upload Local File`. The Brave extension file chooser failed with: `To enable file upload, go to brave://extensions in Brave Browser, click Details under the ChatGPT extension, and enable "Allow access to file URLs."` The requested upload was not completed; enabling this broader extension file access was not authorized or attempted. No media durability conclusion is drawn.
- **RT-09:** selecting the disposable body text and applying `javascript:void(0)` in the safe-link dialog returned `Unsafe URL protocol detected (javascript/data/file prohibited)` and produced no anchor. No script executed. Backup import, inline event handlers, SVG, article/static preview and Smart Knowledge Links remain untested, so RT-09 remains BLOCKED overall.
- **RT-10:** for disposable article `art-1793495484303`, editor SEO panel displayed 1 error, 6 warnings and 10 passed checks; the standalone SEO row showed the same findings and the article audit report showed 1 error / 6 warnings / 10 passed / 2 unverified. Missing title/description and valid sole-H1 findings matched. No linked source/media change, fingerprint invalidation, Quick Fix staleness or advisory/blocker transition was tested; RT-10 stays BLOCKED overall.
- **RT-11:** scheduling `2026-11-06T14:45` in Europe/Istanbul was reported as UTC `2026-11-06T11:45:00.000Z`; the editor returned to local `2026-11-06T14:45` and displayed `Stored UTC: 2026-11-06T11:45:00.000Z`. A second 2026-11-08 11:00 Istanbul test round-tripped to 08:00Z. This is a tested conversion subcase only. UTC/New York emulation, DST gap/repeated-hour cases and a hydration-warning audit remain blocked.
- **RT-12:** requested browser viewport capability calls for 1440×900, 1024×768 and 390×844 returned without error but had no effect. Brave continued reporting `innerWidth=2520`, `innerHeight=1187`, `clientWidth=2520`, `scrollWidth=2520`, `scrollHeight=1187`; thus no horizontal overflow was observed at that actual size, but exact target viewport interactions remain blocked. A screenshot was captured in the live session; the browser-control API returned it in memory only, so no screenshot file is attached.

### Six-Cycle Iterative Refinement — latest Brave verification

| Cycle | Initial evidence and competing hypotheses | Experiment and outcome | Retained/rejected conclusion; remaining uncertainty |
|---|---|---|---|
| 1 — Browser tooling | Prior browser binding had selected IAB once; user specifically asked to use their open Brave. | Re-enumerated browser inventory; selected existing Brave ID `2`, claimed existing AI Studio and local-app tabs, read Brave console, opened one second tab inside the same Brave profile. | Confirmed automation operated the installed Brave, not IAB. No Brave process/window was launched. CUA capture cannot export its screenshot bytes to a report asset through the exposed API. |
| 2 — Environment isolation | Could the app origin share the user's earlier seed store, and is the managed app still available? | Verified tab URL `srs-audit-20261101.localhost:4175`, app local-only banner, isolated seeded count and local server; all created records use `SRS QA` names. | Kept records separate from `127.0.0.1` origin/production. Three disposable QA records remain in this isolated origin. Browser profile itself remains Personal. |
| 3 — Data and HTML | A visible `Saved` label could be false, or a stale tab may overwrite another field; safe link UI may reject or accept active schemes. | Repeated two-tab disjoint-field saves twice and reloaded; tested inert `javascript:void(0)` through actual safe-link dialog; attempted local PNG upload using generated `/tmp` image. | Confirmed RT-05 stale overwrite twice and safe-link rejection. Upload blocker is extension local-file access; no browser permission change. Raw IndexedDB was unavailable through the evaluation world. |
| 4 — Editorial workflows | Calendar might share policy despite a different UI, and initial date mismatch might be an app bug. | Scheduled separate Draft fixtures under Editor and Author; compared outcomes with shared transition table; repeated date setting via accessible form input after Playwright `fill()` submitted the default date. | Confirmed RT-07/08 policy bypass. Rejected the initial date mismatch as an application finding: actual UI `setValue` produced the expected local/UTC slot; Playwright `fill()` had not updated app state in this bridge. |
| 5 — Adversarial rechecking | SEO mismatches or warning counts could come from route timing; media test could silently submit to remote storage. | Compared editor SEO panel, SEO Center row and article report after hydration; checked media page's Local Demo Storage banner before attempting upload; filtered actual local console. | Parity subset matched; no remote media upload occurred. SEO freshness, full sanitizer paths and hydration matrix remain open. Tiptap warning reproduced again. |
| 6 — Final independent verification | One sequence might be accidental timing; browser viewport override might silently report success despite no change. | Repeated stale tab write with different title/summary and waited for both `Saved (Local)` indicators; reloaded A and measured; attempted all three requested viewport sizes and read `window`/document dimensions after each. | RT-05 remains high-confidence FAIL after two same-outcome reproductions. Exact responsive sizes were not reached and remain BLOCKED. No direct object-store read, media restart, HTML imports, New York/DST or quick-fix freshness result is claimed. |

### Evidence and remaining blockers

Current Brave screenshots were displayed during the verification session but are not committed: the supported tab capture returned in-memory bytes only, and no supported export-to-file path was exposed. Sanitized textual evidence is in [`docs/audits/scientificradar-runtime/brave-existing-session-console-and-viewport.md`](audits/scientificradar-runtime/brave-existing-session-console-and-viewport.md) and the detailed reproductions above. Remaining blocked items are media upload/session durability, comprehensive HTML import/preview boundaries, linked-metadata SEO fingerprint invalidation/Quick Fix staleness, full UTC/New York/DST/hydration matrix, and exact target viewport testing. The exact browser automation limitation for media is the extension's file-URL permission; the exact responsive limitation is that its viewport override did not change CSS viewport values.

### Updated implementation priority based on measured failures

1. Fix and regression-test multi-tab concurrency/version conflicts (`SRS-RT-003`) before relying on the `Saved (Local)` acknowledgment for overlapping edits.
2. Route Calendar scheduling through the shared state/role policy and prove Draft/Author combinations reject after reload (`SRS-RT-002`).
3. Resolve duplicate Tiptap extension registration and assert warning-free repeated mounts (`SRS-RT-001`).
4. Continue storage durability/media and import/preview security checks once a disposable profile or authorized file-input route is available.
5. Complete SEO invalidation, timezone/DST/hydration and exact viewport testing; the tested parity, Istanbul conversion, safe-link and default wide viewport subsets do not close those scenarios.
