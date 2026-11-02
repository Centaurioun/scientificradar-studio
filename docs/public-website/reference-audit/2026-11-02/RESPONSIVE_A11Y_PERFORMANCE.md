# Responsive, accessibility and performance evidence

## Viewports and geometry

The Quanta article was captured at 1440×900, 1024×768, 390×844 and a 320×700 stress width, DPR 1. At the first three widths the page document width equaled the viewport; the 320 px initial metric reported 326 px scroll width (6 px excess). A separate interaction run at 320 px later reported equal document and viewport widths after settling/menu interaction. This state-sensitive discrepancy is unresolved; do not claim that 320 px is reliably overflow-free or that the six-pixel difference is reproducible in every state.

The H1 scaled from 40 px at desktop/tablet to about 25 px on mobile. The main text measure was 560 px at desktop/tablet and filled the 350 px / 280 px mobile inner width. At 390 px the body and captions remained within the document width. Main document height ranged from about 14,207 px at 1440 to 20,826 px at 320 in the recorded initial runs; content flow and paragraph wrapping cause the difference.

## Accessibility: limited interaction evidence only

A keyboard Tab produced a visible 2 px blue outline on the currently focused Close button. A menu control was clickable and produced a visible `role=menu` at desktop/mobile/stress widths. Escape did not remove that menu in the captured sequence. No full accessibility tree audit, keyboard matrix, screen reader, contrast calculation, touch-target measurement, reduced-motion audit, WCAG conformance or accessible-name completeness audit was performed. The explicit selector/sample counts are not an accessibility score.

## Resource sampling

Playwright response listeners recorded sampled font/image/stylesheet/script response metadata across initial load and the subsequent top/middle/end scroll screenshots; lazy content could load during that window. At desktop the records contained 10 font responses, 30 image responses, 6 stylesheets and 39 scripts. Response `content-length` values summed to about 434,548 bytes for fonts and 5,756,316 bytes for images where present. Tablet: 10/27/6/38 and about 434,548 / 3,851,817 bytes; 390 mobile: 10/29/6/37 and about 434,548 / 1,629,821 bytes; 320 stress: 10/32/6/39 and about 434,548 / 1,632,834 bytes. Missing lengths are excluded; these page-and-scroll totals are not complete transfer bytes or a request waterfall.

Image response content types included JPEG, PNG, WebP, GIF and SVG (some SVG MIME values had charset suffixes). Images were served from Quanta and fonts from Quanta/Disqus hosts in these captures. The exact file URL list stays private. No full page bundle, cookies, headers with values, or response bodies are part of the public evidence record.

## Not measured

No LCP, INP, CLS, Lighthouse score, cache-hit behavior, actual first-contentful paint, bandwidth throttling, device CPU, JavaScript cost, font licensing, HTML validation or production performance was measured. Cloudflare's challenge prevented the required Knowable responsive/accessibility comparison. These gaps are explicit and remain open.
