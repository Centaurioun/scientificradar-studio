# ScientificRadar Web — reference research

**Test date:** 2026-11-02, Europe/Istanbul. **Research source baseline:** ScientificRadar Studio `origin/main` `f88d7416505a00f3c3a41a78722af1d92364de7e`.

This folder records an independent public-page audit for the separate, original ScientificRadar Web design. It does not implement a site, reuse third-party assets, reproduce article text, or alter the approved blueprint.

## Tooling and access

- REA is registered in the active Codex tool catalog, including its browser target, inspection and scenario tools. It was not connected to a browser because the mission requires exact authorization of both origins and a loopback CDP endpoint; no CDP endpoint was supplied. The mission-authorized fallback was used: isolated Playwright 1.64.1 with a fresh empty headless Chrome 155.0.8059.80 context, `en-US`, DPR 1. Evidence is labeled **PLAYWRIGHT**.
- Knowable's homepage and article returned a Cloudflare “Performing security verification” interstitial in the isolated browser. No bypass was attempted. Their visual, DOM, typographic, interaction and responsive findings are therefore **BLOCKED**; the interstitial is not treated as the target design.
- The specified Quanta article returned HTTP 200 and was observed at 1440×900, 1024×768, 390×844 and 320×700. Top, midpoint and end viewport captures were taken at each width.
- `Nature.com` was not visited (optional, semantic-only source). No live accessibility conformance, LCP, INP, screen-reader, paywall, authenticated or cross-browser testing is claimed.

## Pages tested

- [Knowable homepage](https://knowablemagazine.org/) — attempted; blocked by security verification.
- [Knowable animal-blood article](https://knowablemagazine.org/content/article/living-world/2026/why-animal-blood-comes-in-different-colors) — attempted; blocked by security verification.
- [Quanta spider-silk article](https://www.quantamagazine.org/how-spiders-spin-silk-dope-into-natures-toughest-material-20261028/) — observed.

## Reading order

1. [Turkish executive summary](EXECUTIVE_SUMMARY_TR.md)
2. [Homepage layout](HOME_PAGE_LAYOUT.md)
3. [Long-form layout](LONG_FORM_ARTICLE_LAYOUT.md)
4. [Navigation and interactions](NAVIGATION_AND_INTERACTIONS.md)
5. [Typography and tokens](TYPOGRAPHY_AND_TOKENS.md)
6. [Scientific semantics](SCIENTIFIC_SEMANTICS.md)
7. [Responsive, accessibility and performance limits](RESPONSIVE_A11Y_PERFORMANCE.md)
8. [Implementation handoff](IMPLEMENTATION_HANDOFF.md)
9. [Blueprint reconciliation](WEBSITE_SPEC_RECONCILIATION.md)
10. [Six-cycle adversarial review](SIX_CYCLE_REVIEW.md)
11. [Structured safe observations](OBSERVATIONS.json)
12. [Evidence ledger CSV](EVIDENCE_LEDGER.csv)
13. [Private evidence inventory and hashes](EVIDENCE_INDEX.md)

## Completeness

Quanta has reproducible geometry, computed typography, semantic element counts, coarse resource metadata and a limited menu/focus exercise. Knowable-dependent questions remain unresolved. The numeric comparison is intentionally incomplete. Each measurement states its method; screenshot inspection is not presented as computed CSS. All original screenshots and raw browser JSON remain in the local private evidence directory named in `EVIDENCE_INDEX.md`, not this public repository.
