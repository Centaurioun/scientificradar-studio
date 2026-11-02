# Original Component Specification — ScientificRadar Web

## Product boundaries

Implement the separate ScientificRadar Web site described by website blueprint v2.0. This handoff is a fresh React/Next.js design proposal informed by, but not copied from, Quanta's observed geometry. Knowable's layout remains unobserved behind a public security verification. Do not change ScientificRadar Studio application code or configuration as part of this work.

## App routes and shell

Use Next.js App Router with TypeScript if the target sandbox supports it. Implement Stage A as static, original demo data and the agreed routes:

- `/` homepage
- `/article/[slug]` long-form article
- `/topics` and `/topics/[slug]`
- `/search?q=`
- `/about`
- not-found route

Shared shell: `SiteHeader`, `PrimaryNavigation`, `MobileNavigation`, `SearchDialog`, `SiteFooter`, `SkipLink`, and page-width containers. Header contains separate category link and chevron/disclosure control so a topic can be visited without toggling its submenu. Mobile topics are accordion disclosures.

## Component hierarchy

```text
RootLayout
├── SkipLink
├── SiteHeader
│   ├── BrandLink
│   ├── DesktopPrimaryNav
│   ├── TopicDisclosure[]
│   ├── SearchButton
│   └── MobileMenuButton
├── RouteView
│   ├── HomePage → LeadStory, StoryGrid, TopicRail, NewsletterSignup
│   ├── ArticlePage → Breadcrumbs, ArticleHeader, ArticleLayout
│   │                ├── ArticleBody → ArticleBlock[]
│   │                ├── AuthorCard / RelatedResources
│   │                ├── CitationList
│   │                └── RelatedStories
│   ├── TopicPage → TopicIntro, StoryGrid
│   ├── SearchPage → SearchForm, SearchResults, EmptyState
│   └── AboutPage
└── SiteFooter
```

`ArticleLayout` owns the responsive grid only; `ArticleBody` owns the article's semantic sequence. Figure and citation renderers consume typed data, not publisher markup. Keep external embeds behind explicit source/rights records and a no-embed fallback.

## Design tokens (blueprint v2.0, initial)

```css
:root {
  --sr-page-max: 82.5rem;        /* 1320px */
  --sr-reading-max: 43.75rem;    /* 700px */
  --sr-heading-max: 55rem;       /* 880px */
  --sr-figure-max: 68.75rem;     /* 1100px */
  --sr-gutter: clamp(1rem, 3vw, 2.5rem);
  --sr-body-size: clamp(1.0625rem, 1.3vw, 1.1875rem);
  --sr-body-leading: 1.7;
  --sr-space-1: .5rem;
  --sr-space-2: 1rem;
  --sr-space-3: 1.5rem;
  --sr-space-4: 2rem;
  --sr-space-5: 3rem;
  --sr-space-6: 4rem;
}
```

Use original ScientificRadar brand colors and self-hosted licensed Merriweather/Inter or final approved alternatives from the blueprint. Define font-face with `font-display: swap`; preload only the primary text face(s) needed above the fold. The values above are provisional blueprint decisions, not extracted Quanta tokens.

## Article data interfaces

```ts
export type Person = {
  id: string;
  name: string;
  role?: string;
  affiliation?: string; // render only when supplied and verified
  profileUrl?: string;
};

export type SourceCitation = {
  id: string;
  label: string;
  url: string;            // authentic source or DOI URL
  doi?: string;
  accessedAt?: string;    // ISO date only when relevant
  rights?: string;
};

export type ArticleBlock =
  | { type: "paragraph"; id: string; text: string }
  | { type: "heading"; id: string; level: 2 | 3; text: string }
  | { type: "figure"; id: string; src: string; alt: string; caption?: string;
      width: number; height: number; credit?: string; citationId?: string }
  | { type: "quote"; id: string; text: string; attribution?: string; citationId?: string }
  | { type: "table"; id: string; caption: string; headers: string[];
      rows: string[][]; citationId?: string }
  | { type: "citation"; id: string; citationId: string }
  | { type: "callout"; id: string; title: string; text: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  topic: { slug: string; label: string };
  authors: Person[];
  publishedAt: string;      // ISO-8601
  updatedAt?: string;
  readingMinutes?: number;
  blocks: ArticleBlock[];
  citations: SourceCitation[];
  canonicalUrl: string;
  imageRights?: string;
};
```

Validate block IDs, citation references, image dimensions, date format and canonical URL at content load. Avoid `dangerouslySetInnerHTML`; store article prose as text blocks or a reviewed structured document model. No fictional author, affiliation, review state, source, DOI, or rights line.

## Responsive behavior

- Desktop: page shell up to 1320 px with gutter; reading column 680–720 px; optional complementary rails only where they add navigation/context; figures max 1100 px.
- Tablet: reduce/omit rails before squeezing the prose. Keep a continuous 1-column article order.
- Mobile: one content column, 16–20 px minimum gutter; navigation topic disclosures become accordions; hide/reposition sticky rails; large figures scale to width with caption wrapping.
- 320 px stress: no horizontal document overflow. Tables get a labelled local scrolling wrapper; long URLs wrap; controls retain 44×44 CSS px targets where practical.
- Respect `prefers-reduced-motion`; preserve focus and scroll position when dialogs close.

## Browser acceptance tests

These are implementation gates for the future original application, not results from the reference websites:

1. At 1440×900, page width is ≤1320 px; prose width is 680–720 px; figures are ≤1100 px; one visible H1.
2. At 1024×768, content and header do not overlap; article stays one column or uses a sidebar only if prose remains 680 px minimum.
3. At 390×844 and 320×700, no horizontal overflow (`scrollWidth ≤ innerWidth`), order remains header → title → article → citations → related → footer, and captions wrap.
4. Keyboard: skip link receives focus; navigation links appear in logical order; menu opens from keyboard, Escape closes, focus returns to trigger; close button works; category link navigates while adjacent chevron toggles; mobile accordion uses `aria-expanded` and `aria-controls`.
5. Search: focus enters input on open; Enter submits URL-encoded query; empty/error results have announced labels; Escape closes and returns focus.
6. Article: valid structured block IDs and citations render; a 1000+ word fixture flows without empty columns; no duplicate H1; H2/H3 order is valid; `time[datetime]`, author names, figure alt/caption/credit, and citation links exist only when authentic data is present.
7. Fonts: self-hosted licensed Latin and Turkish glyph subsets load without missing `İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü` glyphs; fallback remains readable with font requests blocked.
8. Performance: reserve media aspect ratios to prevent layout shift; lazy-load below-fold images; do not preload third-party embeds; test LCP and CLS with realistic original demo content.
9. Metadata: unique title/description, canonical URL, OG image/alt from original licensed assets; static demo routes noindex until approved for publication.
10. Accessibility audit must be done separately using keyboard plus screen reader and automated checks; the visual reference inspection does not pass this gate.
