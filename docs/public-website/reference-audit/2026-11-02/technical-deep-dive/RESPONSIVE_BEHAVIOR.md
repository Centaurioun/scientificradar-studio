# Responsive Behavior

## Capture matrix

Measurements used isolated Chromium 155 / Playwright 1.64.1, English locale, light color scheme, reduced motion, blocked service workers, device scale factor 1. The captured route loaded at all four viewport sizes. A width sweep was performed from 1024 down to 320 px. Quanta REA launch evidence at 1440×900: `ev_c706695240da8462a198d60557a6be8e708616409bf5b8a082928ac2ca836d6c`.

| Width / height | Header | Title / reading measure | Body layout | Rails | Horizontal overflow |
|---|---|---|---|---|---|
| 1440×900 | 80 px | title 760 px; prose 560 px | 3-column composition: 236 + 688 + 236 | visible | none, document width 1440 |
| 1024×768 | 80 px | title 760 px; prose 560 px | row wrapper; centered 688 px reading section | not visible in sampled body segment | none |
| 390×844 | 60 px | title 350 px; prose 350 px | one column, 20 px side gutters | `display:none` | none, width 390 |
| 320×700 | 60 px | title 280 px; prose 280 px | one column, 20 px side gutters | `display:none` | 6 px: `scrollWidth=326` |

## Measured responsive transition

- At 600 px, `.post__content` remains `flex-direction:row`; the flex row remains selected while the available reading section narrows with the viewport; document width still matches the viewport. At 540 px, it becomes `column`, the reading section uses 20 px horizontal padding, and header height changes from 80 to 60 px.
- Therefore the transition is in the interval `(540, 600]` for this sampled layout. The precise CSS media-query threshold was not extracted.
- At 390 px the title font is 24.96 px with 28.704 px line-height; at 1440 and 1024 it is 40/46 px. H2 changes from 22/30.8 px to 18/25.2 px.
- Body prose remained 16/30 px at all four requested widths; available line measure changed from 560 px desktop to 350 px at 390 and 280 px at 320.
- Footer height changes from 248 px at desktop/tablet to 543 px at 390 px, consistent with content stacking.
- Article sequence remains intact. Side rails are removed rather than inserted between article paragraphs on mobile. Newsletter, category/recommendations, comments, next story, and footer remain after the body.

## 320 px stress finding

The document width reached 326 px at a 320 px viewport (six-pixel overflow). An element scan found tooltip descendants extending beyond the right edge even while their wrappers carry a `hidden` class and zero height. The largest overrun was in off-screen tooltip subtree content; the exact element responsible for the root scrolling width is not proven. A fresh context had no visible Reject All consent button, so consent was not the cause in that test. Record this as observed overflow with unresolved attribution, not as a definite layout bug in the article content itself.

## Responsive interaction implications for our design

- Keep navigation trigger and action icons in the 60 px mobile header without overlapping the 20 px content gutter.
- Collapse sidebars into a deliberate sequence: article body first; related resources after a meaningful section or at the article end. Avoid inaccessible hidden sticky widgets.
- Make all decorative/tooltip content `position:fixed` or clipped to a safe viewport boundary when closed; hidden descendants must not widen the scrollable document.
- Use a content-driven breakpoint around the point where the reading shell plus rails no longer fit; do not copy the observed interval as a required token. The initial ScientificRadar blueprint uses CSS grid and responsive 1-column collapse.
- At 320 px, test title wrapping, icon hit targets, citation/table overflow, captions, and no horizontal document overflow.

## Evidence limits

Only one article route and four specified sizes plus a coarse width sweep were measured. No tablet landscape, high zoom, browser text enlargement, RTL locale, or operating-system font scaling was tested. No Knowable responsive behavior was observed.
