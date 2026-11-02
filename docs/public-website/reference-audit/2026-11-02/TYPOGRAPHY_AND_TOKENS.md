# Typography and design tokens

## Observed on the Quanta article

Computed styles came from visible DOM nodes in the isolated Playwright capture; they are measurements of this page only.

| Role | Computed declaration | Viewport evidence |
|---|---|---|
| Article H1 | `"Noe Display", Merriweather, Georgia, serif`; 40 px / 46 px, weight 700 on desktop and tablet | PW-001, PW-002 |
| Article H1 | Same stack; 24.96 px / 28.704 px, weight 700 on 390 and 320 px | PW-003, PW-004 |
| Running body paragraph | `Merriweather, Georgia, serif`; 16 px / 30 px | PW-001–PW-004 |
| Small article metadata/caption samples | Merriweather 13 px / 21.45 px | PW-001–PW-004 |
| UI sample | Pangram 10 px / 18.75 px | PW-001–PW-004 |

`document.fonts` reported loaded faces from **Noe Display, Merriweather and Pangram** during the page capture. The observed network list included font requests on `www.quantamagazine.org` and `c.disquscdn.com`, with a sum of 434,548 bytes where response `content-length` was available across the recorded page-and-scroll session. This is not a per-font file inventory or a critical-path/LCP measurement.

## Owner-approved ScientificRadar choices

The source-of-truth blueprint sets **Merriweather** for editorial title/body and **Inter** for interface; self-host the font files from same-origin static assets, keep licenses, test Turkish glyphs, and use easy-to-change CSS tokens. These are owner decisions. Quanta's additional display/sans families are evidence about one reference, not a reason to replace them.

## Original adjustable tokens for the handoff

Keep the blueprint's provisional token model centralized and tune from original demo content. In particular, separate `--font-display` from `--font-editorial` and `--font-interface`, even if the first two both resolve to Merriweather. Keep `--reading-max: 700px` (blueprint starting value), fluid 17–19 px body type, 1.65–1.75 line-height and `--figure-max: 1100px` as starting decisions, not measurements of Knowable. Compare with the observed Quanta 560 px / 16 px / 30 px column at 1440, 1024 and mobile sizes. Do not copy the third-party display face or fetch its assets for the new site.
