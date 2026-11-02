# Research plan — public science magazine references

**Baseline:** `origin/main` at `f88d7416505a00f3c3a41a78722af1d92364de7e` (2026-11-02)
**Purpose:** Collect bounded, reproducible evidence about the named reference pages to refine an original ScientificRadar Web handoff.

## Questions and evidence

1. Can each supplied URL be reached without authentication or a security challenge? Record final URL/status; stop at any challenge.
2. What are the observable homepage and long-read geometry, type, figures, source links, and responsive states? Use Playwright DOM rectangles and computed styles at 1440×900, 1024×768, 390×844 and 320×700.
3. What non-destructive navigation, focus, cookie-preference and menu behavior can be exercised? Record the action, resulting visible state, and scope.
4. Which source-specific patterns fit the owner-approved design direction, and which remain blocked or unknown? Keep observation, inference, and recommendation separate.
5. What new uncertainty appears when the observations are challenged in six sequential review cycles?

## Method and boundaries

- Tool: isolated Playwright 1.64.1 with a newly created, empty, headless Google Chrome context (reported version 155.0.8059.80), locale `en-US`, DPR 1; no existing browser profile, user tabs, or authentication.
- The actual Codex tool catalog advertises `mcp__rea__list_browser_targets`, `inspect_web_page`, and scenario tools. The REA provider is registered in this session. REA was not attached: its documented user-browser route requires an exact loopback CDP endpoint and origin allowlist. The prompt names the public target origins but supplies no endpoint. To honor the mission's explicit gate, use its permitted Playwright fallback and label all resulting evidence `PLAYWRIGHT`.
- Do not evade a bot/security challenge, access a login/paywall, save article copy, retain credentials, or reuse original site media. Raw screenshots and bounded DOM/resource metadata remain at `/tmp/scientificradar-reference-evidence-2026-11-02/`, outside Git; only measurements and SHA-256 digests are committed.
- Do not change application code, dependencies, tests, source documents, browser storage in the user's profile, or deployment state.

## Execution sequence

1. Confirm fetched `origin/main`, dirty primary checkout, mission, reference blueprint, new-site mission, Studio master spec, and CKEditor integration mission.
2. Attempt the two Knowable URLs at all four required viewports; stop observation at Cloudflare verification.
3. Observe the Quanta article at all four viewports, recording top/middle/end screenshots, DOM/style metrics and bounded resource counts.
4. Exercise only public, reversible article-page interactions in disposable contexts; do not inspect cross-site/private state.
5. Review findings against the owner-approved blueprint in six explicit self-review cycles; record contradictions, revisions, confidence and unknowns.
6. Write original Markdown/CSV/JSON only in this folder. Check the file list, validate CSV/JSON, verify only this folder changed, run `trail check`, then commit documentation and verify the exact GitHub contents.

## Exit rule

A site is reported fully compared only when matching page types were observed. With Knowable blocked, this mission can produce a useful Quanta-only numeric baseline and a bounded reconciliation, but cannot claim a completed Knowable/Quanta visual comparison. `Nature.com` is optional and not visited.
