# Evidence and Limitations

## Evidence ledger

| ID / source | Target | Mode | Evidence | Limits |
|---|---|---|---|---|
| `ev_c706695240da8462a198d60557a6be8e708616409bf5b8a082928ac2ca836d6c` | Quanta article route | REA controlled browser launch, Chromium 155, 1440×900 | URL, DOM, accessibility, screenshot capture; provider-owned process and cleanup | Single article route and one viewport; screenshot/DOM are not source code |
| `ev_a0d911fb651a7d429d69dd5b2b8aac5dc37554af590b507f735bdc4e31a09a1a` | Knowable homepage | REA controlled browser launch, Chromium 155, 1440×900 | Challenge response, URL/DOM/accessibility attempt | Cloudflare 403 interstitial prevented page evidence |
| `ev_beb8f9fc959f02d1b3ffc346f0d70de8962f871eab8cbc573e1462c9b5f4dc96` | Knowable homepage | REA controlled browser launch | Second isolated capture; only short DOM/accessibility status | Confirms challenge obstruction, not underlying site structure |
| `PW-2026-11-02` | Quanta article route | Direct Playwright 1.64.1 / Chrome 155, new isolated contexts | Computed boxes/styles, DOM counts, width sweep, menu clicks/Escape, overflow scan | Measurements can vary with content, consent, time, fonts and third-party responses; no full-page screenshot committed |
| [Official REA scenario contract](https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md) | REA tooling protocol | Public documentation | Launch mode can own isolated browser and clean up temporary profile; differs from CDP passive attachment | Documentation describes tool contract, not a result about target websites |
| [Existing Phase 1 audit](../README.md) and accompanying reports | Prior research | Repository files | Earlier Quanta geometry and evidence; Knowable previously blocked | Historical observation; separate from current captures and may have drifted |

## REA authorization and browser origin

REA was connected in this Codex session: the `mcp__rea__capture_browser_scenario` tool appeared in the active tool catalog and returned completed normalized results. This investigation used its declared launch mode with the installed Chrome executable. The provider owned and cleaned up the process. It did not attach to a user's active browser, request CDP port access, or use personal profile cookies.

The earlier Phase 1 notes treated the absence of an external CDP endpoint as if it blocked all REA browser capabilities. The current run corrects that scope error: REA has at least two distinct browser paths. Passive observation may require a user-owned browser target/CDP, while `capture_browser_scenario` can launch its own isolated browser. The official contract describes both mode boundaries. This phase used the launch path.

## Cloudflare handling

Knowable returned HTTP 403 with a “Just a moment…” security verification page in both REA and Playwright attempts. No challenge-solving, proxy rotation, fingerprint modification, cookie replay, or bypass was attempted. Therefore homepage, article, DOM architecture, computed styles, interaction states, and responsive behavior for Knowable remain unobserved in this phase. The deliverables mark that gap rather than substituting generic assumptions.

## What was inspected and what was not

Inspected: rendered DOM structure and counts, computed element boxes/styles, heading/figure/media counts, font-face load status, a coarse width sweep, full-screen menu opening and Escape/Tab sequence, 320 px scroll width and off-screen descendants, public metadata and link counts.

Not inspected: either publisher's source repository, full CSS bundles, full JavaScript bundles, framework internals, server/data API, authentication, analytics payloads, user-specific content, all route templates, comprehensive navigation taxonomy, comments submission, search submission, video playback, every lazy-load boundary, screen-reader output, WCAG conformance, cross-browser behavior, performance budgets, or legal/license ownership.

No page text, imagery, logos, font files, source maps, or complete CSS/JS bundles are included in GitHub. Original implementation snippets and proposals are written independently.

## Confidence and falsification

- High: the HTTP status/challenge for Knowable; Quanta's measured boxes and font sizes at declared widths; DOM counts for the one loaded article; menu visibility values in the described sequence.
- Medium: semantic purpose assigned to page regions, inferred from visible DOM order and shape; responsive breakpoint interval; precise source of the 320 px overflow.
- Low or unknown: internal reusable component boundaries, hidden-state logic beyond the tested path, client-side route transitions, behavior on other pages, and all Knowable design/interaction assertions.

Major conclusions should be falsified by: (1) repeat the same route/viewport after a fresh browser capture and consent reset; (2) inspect a second article from a distinct topic; (3) test 600–540 px widths more finely; (4) click/close the menu with a separately identified close button and test focus restoration; (5) isolate the exact 320 px overflow root after disabling each hidden tooltip; (6) reattempt Knowable only through ordinary public browser access when its challenge is not present. Do not treat a future accessibility/security audit as covered by this visual/runtime inspection.
