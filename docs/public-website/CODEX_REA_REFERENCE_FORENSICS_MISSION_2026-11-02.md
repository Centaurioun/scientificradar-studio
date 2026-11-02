# CODEX — SCIENTIFICRADAR WEB PUBLICATION DESIGN FORENSICS (REA + PLAYWRIGHT)

**Date:** 2026-11-02 · **Type:** Research, read-only website observation and documentation. **Do NOT implement or edit app code.**
**Report destination:** Centaurioun/scientificradar-studio → docs/public-website/reference-audit/2026-11-02/
**Related project:** A NEW ScientificRadar Web reader website will be created in Google AI Studio and a DIFFERENT GitHub repository, NOT in the existing admin repository.

## 0. Operating mandate

Act as Principal Frontend Architect, Browser Reverse Engineering Investigator, UX/A11y Researcher, Scientific Publishing Specialist and Evidence Reviewer. Reverse engineer the PUBLICLY VISIBLE LAYOUT, RESPONSIVE BEHAVIOR, and NON-DESTRUCTIVE INTERACTIONS of selected science-magazine sites for an ORIGINAL design specification. Do NOT copy source code, full CSS/JS, protected article text, trademarks, images, audiovisual assets or paid content. Do not reproduce a pixel-identical clone. Never bypass paywalls/login or capture credentials.

**Only tracked changes permitted:** original Markdown/CSV/JSON research and original self-drawn diagrams inside docs/public-website/reference-audit/2026-11-02/. The current Studio app, package.json, tests, workflows, existing spec, deployed site, DNS, secrets and local IndexedDB must be UNCHANGED.

Keep third-party page screenshots/HAR/full bundle extracts OUTSIDE public git in a private local evidence directory; only commit safe measurements and evidence hashes/metadata. If owner asks later, user can attach own screenshots directly in AI Studio. No network exfiltration of user/browser secrets.

## 1. Source of truth: read and reconcile first

From current origin/main of Centaurioun/scientificradar-studio, read FULL files:
- docs/public-website/SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md — v2.0.
- docs/public-website/GOOGLE_AI_STUDIO_NEW_WEB_APP_MISSION_2026-11-02.md — independent website build mission.
- docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md — only content taxonomy, science semantics, safe prototype boundaries.
- docs/GOOGLE_AI_STUDIO_CKEDITOR_INTEGRATION_MISSION_2026-11-02.md — only implications of canonical sanitized bodyHtml, source IDs, figure IDs and TeX. Do not read full vendor trees without a reason.
- Inspect actual available AGENTS.md, skill index, docs/superpowers and Codex skills before declaring Superpowers or REA available.

User decisions NOT TO OVERRIDE: Knowable Magazine-inspired homepage; Knowable and Quanta narrow editorial long-reads; Nature-like scholarly metadata where honest; Merriweather editorial font, Inter interface font, same-origin font hosting; hybrid desktop category link + separate chevron dropdown; mobile menu; clean ORIGINAL ScientificRadar brand; NEW standalone AI Studio app and new GitHub repository, no production services.

## 2. Target websites — exact URLs

Primary homepage:
https://knowablemagazine.org/

Primary long-form article:
https://knowablemagazine.org/content/article/living-world/2026/why-animal-blood-comes-in-different-colors

Secondary long-form article:
https://www.quantamagazine.org/how-spiders-spin-silk-dope-into-natures-toughest-material-20261028/

Optional semantic-only science reference (NOT a full visual teardown):
https://www.nature.com/

If a page is blocked, redesigned, geo-restricted or no longer accessible, mark BLOCKED and rely on supplied reference screenshots ONLY with SCREENSHOT-ONLY attribution; do not invent pixel measurements or claim interactive verification.

## 3. Superpowers and six-cycle method

Discover available installed Codex skills and read applicable instructions. Use when available:
- superpowers:using-superpowers
- superpowers:brainstorming
- superpowers:writing-plans
- superpowers:verification-before-completion
- superpowers:systematic-debugging only if diagnosing observed tool/browser errors.
- REA: reverse-engineer-anything, or the actually installed REA browser guide.

Do not claim a skill was invoked if unavailable. This is RESEARCH, not a feature implementation and not a license to change target application code.

Run six explicit iterative refinements; each records question, evidence, contradictions, revisions, confidence, unknowns in SIX_CYCLE_REVIEW.md:
1. TARGET VALIDITY: URLs, site versions, capture permission, exact page types and dynamic variations.
2. VISUAL GEOMETRY: actual masthead, nav, hero, card grids, fonts, spacing and centered reading measures.
3. INTERACTION: dropdown/link semantics, hover/click/keyboard, mobile menu, search, sticky header, Escape and focus.
4. ARTICLE + SCIENCE: captioned figures, citations/DOIs, article metadata, author rail, typography and long-form readability; synthesize relevance to ScientificRadar.
5. IMPLEMENTATION/PERFORMANCE/RISKS: fonts/assets, CDN, responsive images, evidence limits, copyright, accessibility, SEO, feasibility in standalone AI Studio.
6. ADVERSARIAL AUDIT: attempt to falsify every important claim; identify screenshot-inference errors, access failures, unmeasured fonts/widths, viewport gaps, contradictions with owner decisions, and revise final recommendations.

The six passes are self-review, not six fake independent people or a claim that the website was implemented or browser-tested by other agents.

## 4. REA use — must be authorized and genuinely available

Official source: https://github.com/morluto/rea
Owner's guide: https://rea.tools/guides/browser/
Versioned working references:
https://github.com/morluto/rea/blob/main/docs/browser-observation.md
https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md
https://github.com/morluto/rea/blob/main/docs/web-runtime.md
https://github.com/morluto/rea/blob/main/.agents/skills/reverse-engineer-anything/SKILL.md

Check real Codex plugin and MCP registrations first. A standalone REA skill instruction does NOT register tools; a Codex plugin may register REA server independently. Do not blindly invoke rea setup/doctor if existing plugin is registered. If absent or broken, do not silently install globally or mutate agent configuration without user approval. Use existing Playwright/CDP capability as the fallback and label evidence PLAYWRIGHT, not REA.

**Consent gate:** Before first REA browser connection or capture, get explicit authorization of exact origins (knowablemagazine.org, www.quantamagazine.org, optionally www.nature.com) AND exact loopback CDP endpoint, per REA browser policies. The owner-supplied URLs alone do not authorize inspecting ALL the user's browser tabs or a live authenticated session. Prefer a NEW isolated Chrome-family browser profile, with no private browsing data. Bind CDP ONLY to loopback, not an exposed external interface; no arbitrary tabs.

Discover currently advertised tool signatures. For an existing user-approved browser use list_browser_targets followed by inspect_web_page; for declared agent click/navigation scenarios use capture_browser_scenario when available. Use capture_web_screenshot, compare_web_captures, analyze_web_bundle or web execution observations ONLY if supported and necessary; never invent tools, never treat static JS evidence as proof a click occurred. Do not use decompilation/full bundle extraction for ordinary page layout measurements.

If REA is not installed, permission is unavailable, or CDP is blocked: record precise blocker; continue safe, bounded Playwright headless public-page observation. Ask for installation/consent only when genuinely necessary. Do not let tooling difficulty prevent a useful evidence-backed report.

## 5. Browser measurement plan

Use dedicated isolated browser, not owner's personal authenticated profile. Record browser version, date/time Europe/Istanbul, locale, page URL, redirects, viewport, DPR and screenshot digest.

Viewports: 1440x900 desktop; 1024x768 tablet; 390x844 mobile; 320x700 stress if feasible.

For Knowable homepage, capture top/mid/end and inspect:
- Logo masthead X/Y/size, utilities, topic row, hero position/crop/contrast, headline overlay, card grid widths/gaps/ratios, category labels, multimedia/newsletter and footer.
- Hover vs click behavior of nav, mobile accordion/hamburger, responsive breaking point and overall content gutters.
- Major section vertical rhythm and comparative white space.

For Knowable article, capture at top, first actual text, middle image/caption or side recommendation, and end:
- Article H1 placement, dek, author/date, lead image and rights, paragraph max width, computed font-family/font-size/line-height/letter spacing; H2/H3, link color, paragraph spacing.
- Where a figure becomes wider than body; caption/source/rights; author bio, tags, related blocks. Real DOI presence or absence, no invention.
- Left recommendation rail effect on reading width; observe whether it floats or sits outside text column.

For Quanta article, similarly capture top/first paragraph/left author rail/mid/end:
- Title/dek/hierarchy, wide hero picture relative to text, actual narrow prose measure, author profile left rail, optional first-paragraph drop cap, section headings, figures, related cards and responsive behavior.

For Nature, only surface documented scientific metadata differences if relevant and publicly accessible: source DOI/link/date/author/figure/reference conventions, distinguish news from research article.

For each site, measure bounding boxes using DOM rectangles where allowed; computed style values, top-level grid count, overflow and actual visible navigation results. A screenshot-only estimate must be labeled SCREENSHOT-ONLY, NOT computed measurement. Never invent exact CSS unit values from an image.

Interactions: navigate category LABEL vs toggle/dropdown; test visible focus and Escape, click outside and mobile menu, if site supports them. Observe rather than assume: source sites may use different navigation than our planned hybrid implementation.

Media/network: public resource size counts, font families actually requested, image format and rough critical resource waterfall where browser tooling exposes it. Never retain credential headers, cookie values, stored user data or private API bodies. Do not claim LCP/INP results without actual measured environment.

## 6. Evidence classification and minimum reproducibility

Every high-value finding marked:
- OBSERVED — actual browser action/DOM/computed style/network record; evidence ID and viewport.
- SCREENSHOT-ONLY — available owner-provided screenshot without live behavior proof.
- INFERRED — plausible interpretation, not verified.
- RECOMMENDED — original ScientificRadar design advice.
- UNKNOWN/BLOCKED — could not confirm.

Every numeric statement includes method and precision (DOM rectangle vs screenshot estimate); each cited evidence has page URL, timestamp, viewport, browser/tool, and redacted local capture ID/hash. Prefer representative measurements over gigantic asset inventories.

## 7. Required reports in the repository

Write meaningful, non-empty, independently useful files to EXACT folder:
docs/public-website/reference-audit/2026-11-02/

Recommended file contract:
- README.md — entrypoint, tested date, chosen tooling, tested URLs, completeness and link index.
- EXECUTIVE_SUMMARY_TR.md — short Turkish evidence-backed recommendation.
- HOME_PAGE_LAYOUT.md — Knowable anatomy, measured grid/hero/masthead, observed mobile states.
- LONG_FORM_ARTICLE_LAYOUT.md — Knowable vs Quanta compared in a numeric observation table with sourced widths/typography.
- NAVIGATION_AND_INTERACTIONS.md — step-by-step reproducible behavior, keyboard/mobile differences.
- TYPOGRAPHY_AND_TOKENS.md — computed reference fonts where known, versus OWNER'S Merriweather/Inter choices and suggested CSS tokens.
- SCIENTIFIC_SEMANTICS.md — citations, sources, rights, figures, tables, long-form requirements and Nature-like metadata.
- RESPONSIVE_A11Y_PERFORMANCE.md — audited viewports, accessibility, request/font/image findings and unknowns.
- IMPLEMENTATION_HANDOFF.md — original React/Next component map, exact routes, reading width targets, responsive breakpoints and feasible CSS/TS suggestions for AI Studio.
- EVIDENCE_LEDGER.csv — ID, target URL, viewport, timestamp, instrument, claim, class, measured value, method, confidence, local evidence digest, limitations.
- EVIDENCE_INDEX.md — local evidence paths/digests WITHOUT uploading third-party screenshots to public git.
- SIX_CYCLE_REVIEW.md — six-pass critique and changes.
- WEBSITE_SPEC_RECONCILIATION.md — evidence-based proposed changes to blueprint v2.0/mission with keep/update/defer, evidence ID and priority; do not edit those owner-approved docs.
Optional original schematic wireframe and OBSERVATIONS.json for structured measurements; never commit third-party logos, screenshots, copied code or article text.

Focus on evidence quality rather than blank template volume. If a page or section cannot be observed, explicitly record what was NOT tested.

## 8. Git/worktree, permission and completion gates

First inspect git status, remotes, branch, HEAD, origin/main and unrelated work. Never reset/clean/force-push, erase user changes or commit a dirty unrelated checkout. Prefer isolated documentation worktree from latest fetched origin/main, keep browser evidence outside repo.

Before commit: inspect diff and assert ONLY docs/public-website/reference-audit/2026-11-02/ has changed; run simple file/readability and CSV/JSON validation as applicable. No executable code changes; no new dependency installs inside repo.

Commit docs-only on appropriate branch. The user expressly wants this report IN Centaurioun/scientificradar-studio; a safe docs-only fast-forward push to main is acceptable if permitted, remote HEAD unchanged and local state clean. Otherwise open a DRAFT docs-only PR and provide link/SHA; no forced updates. Verify exact files exist on GitHub afterwards. Reports local-only are NOT a completed GitHub handoff.

Do NOT create the separate ScientificRadar Web app, alter current Studio or publish scientificradar.com in this mission.

## 9. Final answer requirements (Turkish)

Report actual REA status/consent/CDP scope (or Playwright fallback), pages visited, viewports, observed vs unverified features, meaningful measured layout ranges, main Knowable/Quanta differences, strongest 3–5 handoff recommendations, the six-cycle residual gaps and evidence limitations.

Include exact GitHub commit SHA and the README, evidence ledger, recommendations and reconciliation report URLs. Only claim successful pushes and browser actions after fresh verification. This is a forensic RESEARCH handoff, not a cloned website or implemented frontend.
