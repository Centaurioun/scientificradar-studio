# Frontend Architecture — Technical Deep Dive

## Scope and evidence

This report documents a bounded runtime inspection of one current Quanta Magazine article page and the Knowable Magazine public homepage. It separates observed browser output from reconstruction advice. It does not claim access to either publisher's source repository or complete application architecture.

- Quanta article: a public article route was available over HTTPS, HTTP 200, in an isolated Chromium 155 session. REA `capture_browser_scenario` launch evidence: `ev_c706695240da8462a198d60557a6be8e708616409bf5b8a082928ac2ca836d6c` (1440×900). A separate Playwright 1.64.1/Chrome 155 run measured 1440×900, 1024×768, 390×844, 320×700 and a width sweep.
- Knowable homepage: HTTP 403 and a Cloudflare “Just a moment…” challenge in the isolated browser. REA captures `ev_a0d911fb651a7d429d69dd5b2b8aac5dc37554af590b507f735bdc4e31a09a1a` and subsequent confirmation `ev_beb8f9fc959f02d1b3ffc346f0d70de8962f871eab8cbc573e1462c9b5f4dc96`. No protection was bypassed; this is not enough evidence to describe Knowable's frontend.
- Browser capture used REA `browser.mode="launch"`, provider-owned Chromium, temporary isolated context, and provider cleanup. No external CDP attachment or personal browser profile was used. The official scenario contract documents that launch mode owns and cleans up its browser profile: [REA browser scenario contract](https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md).

## Observed runtime architecture (Quanta sample)

The accessible page is a server-rendered article route enhanced by client-side controls. The evidence establishes the delivered DOM and interactions only; it does not identify the site's framework, component source boundaries, state library, or backend.

1. A fixed-position `header` contains a `.nav__inner` wrapper. The wrapper measures 1229×80 at 1440 px and fills the 1024 px tablet viewport at 80 px high. It becomes 60 px high on the tested 390 px and 320 px viewports. The global “open the menu” button points to a full-screen element with `role="menu"`.
2. The document has a `main`, but its first page-level content node is a `div.post`; the inspected route does not expose an `<article>` element. The post includes a title/header region, an article body/theme wrapper, newsletter promotion, category/recommendation area, comments area, and a next-story region.
3. The reading layout uses a flex row at widths 640 px and above in the measured sweep. It has a centered text section of 688 px including 64 px horizontal padding (560 px inner text measure), with two 236 px aside rails at 1440 px. At 1024 px the text section remains centered and the side rails are not presented as visible in the sampled first body section. At 540 px and below the wrapper switches to a column, 20 px side padding, and hides the rails.
4. Long-form media is interleaved as standalone figures. The captured sample contained 12 `<figure>` nodes, seven `<figcaption>` nodes, two videos and 13 images within `.post`; some of the 12 figure nodes are nested/paired wrappers. Do not treat each `figure` count as a count of independent illustrations.
5. The page also contains 5 asides across the complete post DOM; only two are the article-side rails, and they are hidden at mobile width. Do not infer all aside nodes are the same component.
6. The footer follows newsletter, category/recommendations, comments, and next-story regions. At 1440 px it measures 248 px tall; at 390 px it measures 543 px tall, reflecting reflow.
7. Runtime font faces include Merriweather, Pangram, and Noe Display; loaded face statuses are recorded in the matrix. These are observations, not assets to reuse. ScientificRadar should use its own licensed, self-hosted brand font choices.

## Inferred component boundaries

These are useful reconstruction seams, not claims about Quanta's internal React/Vue components:

- `SiteHeader` → brand/home link, primary navigation, search, menu button.
- `FullScreenNavigation` → topic/navigation group, close control, focus behavior.
- `ArticleHeader` → category, title, dek, byline, publication/update dates, reading/share actions.
- `ArticleLayout` → main body plus optional complementary rails.
- `ArticleBlock` variants → paragraph, heading, figure, video/embed, quotation, list, inline citation.
- `NewsletterCallout`, `RelatedStories`, `CommentsRegion`, `NextStory`, `SiteFooter`.

The original component specification is in [ORIGINAL_COMPONENT_SPEC.md](ORIGINAL_COMPONENT_SPEC.md). Runtime markup classes are not copied into the proposal.

## Design implications for ScientificRadar Web

Use semantic HTML first and keep layout components separate from scientific content data. Keep article body nodes typed (paragraph, heading, figure, citation, callout, table, reference list); render approved rich content from a schema rather than arbitrary HTML. Use a single primary `<article>` nested in `<main>`, predictable heading levels, `<figure>/<figcaption>`, `<time datetime>`, `<address>` or a labelled author list, and `<nav aria-label>`.

A full-viewport menu can suit desktop and mobile, but make its state explicit, expose `aria-expanded`/`aria-controls`, support Escape, return focus to the trigger, trap focus only if modal, and restore page scrolling. The reference's full-screen menu and observed Escape behavior are evidence about that page, not acceptance criteria for our implementation.

## Confidence

- High: captured Quanta DOM landmark counts and measured geometry at the declared viewport sizes.
- Medium: inferred component seams and role of page regions, because they are reconstructed from delivered DOM and layout rather than source components.
- Low/unavailable: Knowable architecture, unobserved routes, underlying framework, hydration strategy, and server/data APIs.
