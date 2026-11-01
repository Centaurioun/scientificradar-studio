# ScientificRadar Studio — Runtime Verification Audit

**Audit date:** 2026-11-01 (Europe/Istanbul)
**Repository:** `Centaurioun/scientificradar-studio`
**Audited baseline:** `main` / `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`
**Result:** **PARTIAL VERIFICATION — locked CLI checks passed; 3 of 12 scenarios passed, 9 remain blocked or unexecuted.**
**Scope:** Independent execution attempt and cross-examination of the prior audit, 49-task backlog, master specification, v5 and v6 specifications. No application source, tests, manifests, tracked lockfiles, configuration, production integration, live site or production data was intentionally changed.

## 1. Executive summary

The initial run ended at 0 PASS / 0 FAIL / 12 BLOCKED because Bun was unavailable in that execution environment. A follow-up run in the existing isolated PR #4 worktree located a compatible managed Bun binary, installed only the committed `bun.lock` dependencies in frozen mode, and ran tests, typecheck, lint, build, and limited local browser journeys. The updated matrix is **3 PASS / 0 FAIL / 9 BLOCKED**. This is partial verification: persistence on a stable article route and the controlled QA save-failure acknowledgment were observed; broad race, security, publishing-policy, timezone, and responsive scenarios remain unverified.

The local clone and remote `main` both resolved to `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`. The repository has `bun.lock`, but Bun is unavailable. There is no `node_modules` at baseline and no `pnpm-lock.yaml`. A frozen pnpm install correctly refused to proceed. A subsequent attempt to invoke pnpm scripts unexpectedly auto-resolved package ranges, downloaded packages and generated a pnpm lock in the isolated worktree. That generated installation was stopped and its worktree-only artifacts removed; `package.json`, `bun.lock` and tracked TypeScript build metadata were checked back to baseline. Because that resolution was not bound to the committed Bun lock, outputs from those script attempts are **invalid as baseline evidence** and are not counted as passes.

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

## 4. Twelve-scenario matrix

The scenarios below are **not executed acceptance tests**. Source presence or a declared script does not count as execution.

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

**Scenario counts:** executed to acceptance: 0; PASS 0; FAIL 0; BLOCKED 12; NOT APPLICABLE 0. No screenshots, browser console logs or run artifacts were fabricated.

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

## 11. Evidence and report limitations

No screenshot, generated test fixture, browser log or claim of external service isolation beyond the observed local-only commands is included because no app browser session was established. Evidence available for independent inspection is the GitHub baseline, local isolated worktree history/status, captured command outputs recorded above, and the read-only PR #1 diff. No new runtime artifacts are needed to substantiate the BLOCKED classifications.

---

# Runtime follow-up: locked Bun environment and local browser checks

**Follow-up date:** 2026-11-01 (Europe/Istanbul)
**Execution checkout:** `/Users/yusuf/.codex/worktrees/scientificradar-runtime-verification`
**Audited code SHA:** `083b30a6ea9070372ca86484994ca5ccb0bef12d` (PR #4 head, based on `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`)
**Updated result:** **PARTIAL VERIFICATION — 3 PASS / 0 FAIL / 9 BLOCKED**
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
| RT-02 | Tiptap initializes without duplicate extension warnings | **BLOCKED** | Editor toolbar and content initialized in browser. Browser console was not available through CUA, so duplicate-extension warnings cannot be ruled out. |
| RT-03 | Basic editor formatting survives save and reload | **PASS (tested subset)** | Created local disposable article, observed `Saved (Local)` and History(1), opened its stable `/articles/{id}/edit` route after reload/navigation, and saw title, H2/H3, bold, italic, list, and blockquote content retained. Subscript was stripped to plain `CO2`; superscript/subscript remain a known feature gap. |
| RT-04 | Failed save never produces a false durable acknowledgment | **PASS (controlled QA path)** | Enabled Settings → “Simulate Storage Write Failure” and, while provider state remained mounted, edited the disposable article summary. UI explicitly showed `Save failed — changes not persisted`, Retry controls, and `Changes remain unsaved`; it did not say Saved. Retry/recovery persistence was not tested. |
| RT-05 | Overlapping writes do not silently overwrite newer text | **BLOCKED** | No deterministic delay/reordering instrumentation or reproducible competing write test was available. One write-failure control does not test write races. |
| RT-06 | Uploaded image survives appropriate session restart | **BLOCKED** | No file chooser/upload automation or isolated fresh-profile asset round-trip was completed. Existing source object-URL risk remains unconfirmed at runtime. |
| RT-07 | Unsupported publishing-role transition is rejected | **BLOCKED** | On Draft article, switching the demo selector to Author removed the `Publish (Demo)` action; Reviewer showed `Submit for Review` but no publish action. This is UI affordance evidence only, not an attempted shared-policy transition or production authorization test. |
| RT-08 | Calendar scheduling respects shared publication policy | **BLOCKED** | Calendar/editor/review transition matrix was not exercised. |
| RT-09 | Unsafe HTML cannot execute through import or preview | **BLOCKED** | No HTML canary was sent through import or preview. The accessibility tree cannot establish DOM attribute safety or script execution. No exploit is claimed. |
| RT-10 | SEO fingerprint consistent across screens and linked metadata | **BLOCKED** | No controlled same-data comparison or linked source/media mutation/fingerprint check. |
| RT-11 | Dates, time zones, DST and hydration behave as specified | **BLOCKED** | The app displayed local demo dates and Istanbul zone labeling, but no timezone matrix, DST boundary, UTC round trip, or browser console/hydration warning inspection. PR #1 was not applied. |
| RT-12 | Mobile/tablet/desktop interactions remain reachable | **BLOCKED** | Default CUA viewport was inspected only; exact 390×844, 1024×768 and 1440×900 sizing was unavailable. No responsive acceptance claim. |

No scenario is classified FAIL because no failure met the requested reproducible-failure bar. Overall status remains **PARTIAL VERIFICATION**. Counts treat only the explicitly exercised subsets above as PASS; they are not whole-product acceptance.

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

- **No runtime-confirmed failure.** Therefore no new `SRS-RT-*` finding is opened and no regression-test issue is proposed as a confirmed defect.
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
| Editor initialization/round trip (`SRS-ED-*`) | **Runtime pass for editor mount and basic formatting subset; warnings, full tool operations and layout remain unverified** | Narrowed, not closed. Existing unsupported Sub/Sup, tables, source editing and KaTeX are feature gaps, not runtime failures. |

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
| 6 — Independent final verification | Report could preserve obsolete 12-blocked language, miscount scenarios, or include test artifacts. | Rechecked HEAD, PR #4 open/unmerged, report-only intended edit boundary, stopped dev server, removed local QA article, restored `tsconfig.tsbuildinfo`, and recounted RT matrix. | Final state 3 PASS / 0 FAIL / 9 BLOCKED. The `npm test` runner, console warnings, deterministic races, uploads, policy paths, sanitizer/import, SEO, timezone/DST and exact viewport checks remain explicitly unverified. |

## Remaining blockers and recommended next verification order

1. Build deterministic IndexedDB delayed/reordered/failure/retry and two-tab tests with temporary instrumentation outside tracked source; keep `SRS-DATA-002/003` high priority.
2. Exercise calendar, editor and review queue transitions against the same policy for author/reviewer/editor, blockers, dirty changes and previously published status; keep `SRS-PUB-*` high.
3. Test imported and previewed inert HTML canaries and inspect actual DOM/console behavior, including static pages and Smart Knowledge Links; keep `SRS-SEC-*` high until evidence exists.
4. Upload a generated local image and test its URL/bytes after a fresh isolated browser session; keep `SRS-MED-001` open.
5. Add coverage for SEO fingerprint parity, metadata invalidation, timezone/DST/UTC round-trips, hydration console, exact responsive viewports, editor undo/redo/figure insertion and duplicate extension warnings.
6. Determine a reproducible locked test launcher for the manifest test script. `tsx` is not in the Bun lock; do not use `npx --yes` or resolve an unpinned tool. The direct Bun test run is useful evidence but not proof that `npm test` or the package's declared runner works.

PR #4 remains open and unmerged. This follow-up is documentation-only; application code, tests, `package.json`, `bun.lock`, existing backlog/specifications and production systems were not changed.
