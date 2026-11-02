# Expected Rendering & Visual Comparison Procedure

**This is an inspection specification, not a screenshot or proof of matching preview.** Public Web source revision: `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7`.

At **desktop 1440×900**, **tablet 768×1024** and **mobile 390×844 and 320px wide**, render the same deterministic article in public Web and Studio preview with comparable fonts and browser scale. Capture screenshots only when both renderers actually run; include commit SHA, viewport, test fixture, URL/environment, timestamp and any font loading differences. Compare pixel/visual output and semantic DOM; ignore Studio's surrounding admin controls and preview security banner when measuring the article surface.

| Area | Web target | Verification |
|---|---|---|
| Page color | `#FAFAF8` warm paper; `#15747B` teal accents | Scoped preview only, not global admin CSS |
| Fonts | Merriweather editorial; Inter UI | No fallback-font layout shift once fonts settle |
| Article header | Single H1, dek, byline and publication date | No second H1 in rich body |
| Text measure | 700px default, 600/560 comparison choices | Match paragraph length and rhythm |
| Scientific layout | Main body H2/H3, 1100px max wide figure, responsive tables | No horizontal page overflow |
| Navigation | Desktop outline + mobile disclosure TOC | TOC links target true headings in both blocks and HTML |
| References | Citation anchor and bibliography return link | All source IDs stable; illustrative sources never assigned fictitious DOIs |
| Formulae | KaTeX and accessible math semantics | Long equations scroll safely, no injection |
| Media rights | Alt, caption, credit, licence and VERIFIED rights | Unverified asset is blocked at actual publish boundary |
| Privacy | Draft/preview is never public or indexable | No unsafe route, sitemap or metadata leaks |

**Acceptance evidence required later:** Studio CI (lint/typecheck/build), adapted fixture contract tests, live *preview* screenshot comparison and access isolation test. Web GitHub E2E 85/85 does not replace Studio integration tests.
