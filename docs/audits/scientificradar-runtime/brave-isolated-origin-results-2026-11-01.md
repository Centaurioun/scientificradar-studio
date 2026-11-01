# Sanitized live Brave test evidence — isolated ScientificRadar origin

Observation window: 2026-11-01 01:04–01:14 UTC (04:04–04:14 Europe/Istanbul).

- Browser: already-running Brave Browser; Chromium 156.0.8078.48. Browser automation attached to the existing Brave instance. One second tab was opened inside that same Brave instance to test same-origin stale writes; it was not a new browser process.
- App: `http://srs-audit-20261101.localhost:4175`; local Next server on permitted port 4175. This test origin is distinct from `http://127.0.0.1:4175` and has a separate local IndexedDB origin. The UI stated `Local IndexedDB Store · scientificradar.com untouched`.
- App source baseline: `c099ae0a78bf69a4b5f58785dcf2c3512e9b270d`. The prior audit snapshot `083b30a6ea9070372ca86484994ca5ccb0bef12d` differs only in documentation; the worktree app source had no non-documentation changes. Documentation branch before this continuation: `f8a73ba02623e75f8eca02148d0a283489f4a4d7`.
- Only generated `SRS QA` articles in this origin were mutated. Production and seeded articles were not targeted. Three generated QA records remain in this origin. `/tmp/srs-runtime-canary.png` is a generated 1×1 PNG, not a personal file.

## Browser console

Latest actual Brave editor console sample:

```text
2026-11-01T01:14:05.952Z warn [tiptap warn]: Duplicate extension names found: ['link', 'underline']. This can lead to issues.
```

No other local app warnings/errors were present in the latest filtered sample. Earlier two actual Brave occurrences at 00:58 UTC are retained in `brave-existing-session-console-and-viewport.md`.

## RT-05 stale two-tab write reproduction

Article: `art-1793495484303`, `SRS QA Author Schedule 20261101 Charlie`.

1. Load the same article in two tabs on the same exact local origin; confirm both tabs show the same title, summary and body after hydration.
2. In tab A, change title to `SRS QA Author Schedule 20261101 Charlie TAB-A`; wait for `Saved (Local)`.
3. In stale tab B, change summary to `Tab B summary write from stale snapshot.`; wait for `Saved (Local)`.
4. Reload tab A. It now shows the original title `SRS QA Author Schedule 20261101 Charlie` and tab B's summary.
5. Repeat with title `... Charlie TAB-A2` in A and summary `Tab B summary write repeat 2 from stale snapshot.` in B. Both tabs again show `Saved (Local)`; reloading A restores the original title and retains tab B's latest summary.

Result: **FAIL, reproduced twice**. This is a lost field update across tabs. The supported Playwright evaluation scope did not expose `window.indexedDB`; stored values were independently confirmed through page reload, not raw object-store inspection.

## RT-07 / RT-08 Calendar policy bypass

Shared policy in `lib/editorial-rules.ts`: Draft may transition only to `in_review` or `archived`; Authors cannot target `scheduled`.

- Editor demo: select local Draft `art-1793495066954`, assign a future slot from Publishing Calendar. Calendar and article editor then show `SCHEDULED`.
- Repeat with a second Draft `art-1793495402547`; it also persists as `SCHEDULED`.
- Author demo: create local Draft `art-1793495484303`, set role to `author`, choose `2026-11-08T11:00` with the accessibility form input, and click `Assign Publication Slot`. Calendar reports `Scheduled "SRS QA Author Schedule 20261101 Charlie" for 08.11.2026 11:00 GMT+3 (UTC: 2026-11-08T08:00:00.000Z)` and displays `Status: SCHEDULED`.

Result: **RT-07 FAIL and RT-08 FAIL**, with both Draft→Scheduled and Author scheduling reproduced in the local demo. No production publishing or storage integration was called.

## RT-09 safe-link negative subcase

On the disposable Charlie article, select plain canary text and enter `javascript:void(0)` in the app's safe-link dialog. UI returns:

```text
Unsafe URL protocol detected (javascript/data/file prohibited)
```

No anchor was added and no script executed. Import, event-handler, SVG and reader/static preview paths were not tested; RT-09 remains BLOCKED overall.

## RT-10 SEO parity subcase

For `art-1793495484303`, editor SEO panel displayed 1 error, 6 warnings and 10 passed. SEO Center and article-level audit showed the same findings, with 2 unverified checks also explicit in the full audit. Missing SEO title/description and sole-H1 validity matched. Linked source/media changes, audit fingerprint invalidation and Quick Fix staleness were not tested.

## RT-11 local Istanbul UTC conversion subcase

- Calendar input `2026-11-06T14:45` in `Europe/Istanbul` reported UTC `2026-11-06T11:45:00.000Z`.
- Editor reloaded the value as local `2026-11-06T14:45` and showed `Stored UTC: 2026-11-06T11:45:00.000Z`.
- Separate local slot `2026-11-08T11:00` round-tripped to `2026-11-08T08:00:00.000Z`.

UTC/New York browser emulation, DST gap/repeated-hour validation and hydration checks were not run.

## RT-06 media upload blocker

A harmless 1×1 PNG was generated locally. The app Media Library showed `Storage Adapter: Local Demo Storage (IndexedDB)` and stated that R2 is not connected. Brave's file chooser rejected the operation before upload:

```text
To enable file upload, go to brave://extensions in Brave Browser, click Details under the ChatGPT extension, and enable "Allow access to file URLs." See [here] for details.
```

No extension permission was changed and no file was uploaded; media durability remains BLOCKED.

## RT-12 viewport measurements

After requested browser viewport override attempts (1440×900, 1024×768, 390×844), Brave continued reporting:

```text
innerWidth=2520
innerHeight=1187
clientWidth=2520
scrollWidth=2520
scrollHeight=1187
```

These are actual observed dimensions, not the requested target viewports. No horizontal overflow was present at this wide default size; mobile/tablet target layouts remain untested. The live screenshot was shown during this session but not saved as a file: existing tab capture returned image bytes in memory, and no supported export-to-file method was exposed.
