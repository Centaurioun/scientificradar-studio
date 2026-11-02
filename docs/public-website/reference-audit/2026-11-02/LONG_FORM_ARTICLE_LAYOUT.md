# Long-form article layout — Knowable versus Quanta

## Scope

The supplied Knowable animal-blood article showed Cloudflare security verification in the isolated browser; its body was not observed. Quanta's supplied spider-silk article loaded at all four planned viewport widths. Thus the table below is a **partial, Quanta-only measurement** and is not a numeric two-site comparison.

## Reproducible Quanta measurements

Method: Playwright `getBoundingClientRect()` and `getComputedStyle()` in a fresh Chrome 155 context, DPR 1, English locale. Measurements refer to the specified current article capture, not the site's universal template. Viewport scroll width and page height were recorded after initial DOM content and a short settle. Captures are PW-001–PW-004.

| Viewport | H1 box (width × height) | H1 type | Main text block | Body type | Document width |
|---|---:|---|---:|---|---:|
| 1440×900 | 760×92 px | Noe Display, 40/46 px, 700 | 560 px | Merriweather, 16/30 px | 1440 px, no horizontal overflow |
| 1024×768 | 760×92 px | Noe Display, 40/46 px, 700 | 560 px | Merriweather, 16/30 px | 1024 px, no horizontal overflow |
| 390×844 | 350×86.1 px; x=20 | Noe Display, 24.96/28.704 px, 700 | 350 px | Merriweather, 16/30 px | 390 px, no horizontal overflow |
| 320×700 | 280×86.1 px; x=20 | Noe Display, 24.96/28.704 px, 700 | 280 px | Merriweather, 16/30 px | 326 px on initial metrics (6 px excess); later interaction-state scroll width was 320 px; cause unknown |

At desktop, the 760 px H1 is centered at x=340 on a 1440 px viewport; the 560 px text block is centered at x=440. At tablet, those boxes begin at x=132 and x=232 respectively. The lead image appears substantially wider than the text in the top screenshot; no exact hero-image DOM box is quoted here because the page image inventory contains lazy/decorative elements and a single-screen ratio should not be conflated with the source image dimensions.

The DOM contained one H1, 10 H2s, 7 H3s, 12 `figure` nodes and 10 figure captions. At desktop, 10 figures exceeded the measured 560 px reading width. At 390 px, figures fit within the 350 px content width. The observation is about this page's DOM, not a guarantee that every image is a scientific figure or has complete rights metadata.

A desktop author/sidebar candidate exists in the DOM, but its sampled visible state was not reliably measured; top/mid/end captures did not establish a persistent visible rail. At mobile the title byline element occupied a 350×43 px box below the title. The main article was approximately 14,207–20,826 CSS px high across the measured viewports; height varies with responsive layout and capture timing.

## Knowable status

The Knowable target returned a security interstitial. Headline placement, dek, byline/date, body measure, typography, lead image, captions, recommendation rail, endmatter, and responsive behavior remain UNKNOWN/BLOCKED. Do not infer them from the supplied article slug, site brand, or Quanta.

## Design handoff

Treat 560 px as one observed alternative, not as a universal ideal. The owner-approved initial ScientificRadar article measure is 680–720 px. Compare both against original demo copy, language choice and long captions in the new app. Keep figure width independent of prose width, stack optional author/recommendation modules outside the narrow reading measure, and preserve visible caption/credit/source fields.
