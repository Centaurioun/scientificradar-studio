# ScientificRadar Public Website — Design, UX & Architecture Blueprint

**Version:** 2.1 · 2026-11-02 (six-cycle + Codex REA reconciliation; Europe/Istanbul)
**Document owner:** ScientificRadar
**Repository containing this decision record:** https://github.com/Centaurioun/scientificradar-studio
**Project:** ScientificRadar Web — reader-facing website, separate from ScientificRadar Studio
**Status:** Owner-approved visual direction and implementation specification. Phase 1 and Phase 2 forensic reports now reviewed at commit 690e2fc8a0f9d5cb6f0e254ee5650f5762637250. No built website or production deployment certified.

## 0. Executive decision

Build an ORIGINAL, responsive, attractive public science magazine website, inspired principally by the visual language of Knowable Magazine, with selected long-read ideas from Quanta Magazine and accurate scientific metadata conventions from Nature.

**First deliverable: a complete, responsive first-version website in a NEW Google AI Studio app and ultimately a SEPARATE GitHub repository, proposed name Centaurioun/scientificradar-web.** It can use honest fictional demo content until publication integration. Avoid a giant visible prototype banner or using 'prototype' as the public brand. The existing ScientificRadar Studio application and its GitHub main MUST NOT be overwritten, imported wholesale, redeployed or restructured during the experiment.

Integrate the two apps in a separately accepted future phase through a controlled publishing/data interface. Studio's IndexedDB prototype does not automatically publish to a separate web application or server. Do not pretend it does.

### 0.1 Decision provenance and confidence

| Item | Status | Decision |
| --- | --- | --- |
| Audience | Confirmed | Readers of science journalism, explainers and research-oriented articles; accessible, credible, long-form presentation |
| Homepage reference | Confirmed | Knowable Magazine visual direction; large editorial hero, centered publication identity, orderly categories and image-led grids |
| Article reference | Confirmed | Knowable Magazine + Quanta Magazine for the reading page; narrow type column and generous whitespace |
| Scholarly content conventions | Confirmed | Nature-like transparent author/date, scientific citations, DOI only when authentic, figures/credits, structured sources |
| Main serif | Confirmed for first prototype | Merriweather (headlines and running article body) |
| UI sans serif | Confirmed for first prototype | Inter (navigation, controls, metadata) |
| Font delivery | Confirmed | Host with the website's own static assets/CDN; no browser dependency on Google Fonts or separate Cloudflare R2 font bucket |
| Navigation | Direction selected | Visible desktop categories plus accessible, click/keyboard-operated subcategory dropdowns; touch-friendly mobile accordion |
| Colors, exact widths, component spacing | Provisional tokens | Start from neutral paper/ink and restrained teal; centralize tokens for owner review, do NOT treat numerical defaults as irreversible |
| Hero | Provisional | Large editorial feature when a featured image exists, with a fallback without image; avoid permanently over-tall, obstructive hero |
| Tech/build | Proposed | New lightweight AI Studio web app; prefer Next.js App Router + TypeScript if sandbox supports it end-to-end, else an explicitly temporary React/TypeScript prototype |
| Data, domain and Cloudflare | Deferred | No live CMS link, publishing, authentication, analytics, ads, R2, domain change or production deploy in prototype |
| Admin appearance | Not in scope | Keep ScientificRadar Studio's current fonts and working Tiptap + CKEditor editors unchanged |

## 1. Reference websites — interpret structure, do not clone content

### Knowable homepage (PRIMARY)
https://knowablemagazine.org/

Take inspiration from:
- Prominent centered publication identity on a calm white background, followed by readable topic navigation.
- One deliberate feature-story hero with clear category, title, summary and credit; not an endless billboard.
- Subsequent three-column editorial cards, varied page rhythm, smaller featured collections and balanced whitespace.
- Distinct but tasteful editorial category labels; large serif article titles, compact sans-serif metadata.
- Flexible multimedia / thematic modules and an optional newsletter invitation.

Adapt for ScientificRadar:
- Original ScientificRadar wordmark, distinct proportions, no Knowable logo or multicolor brand strip.
- English-first categories derived from Studio's science taxonomy; bilingual support can be added later.
- A header with hybrid navigation: category TEXT is an accessible link, chevron BUTTON opens the nested menu. Do not trap a category behind hover only.
- The hero may be full editorial width but must preserve headline readability, correct text contrast, and good mobile cropping.
- Replace the source site's fundraising/membership calls to action with an appropriate optional ScientificRadar subscription/newsletter demo module; do not claim a real mailing list exists.

### Knowable article (PRIMARY)
https://knowablemagazine.org/content/article/living-world/2026/why-animal-blood-comes-in-different-colors

Take inspiration from:
- Centered category, publication headline, succinct dek, byline and date.
- Large lead image/caption followed by a notably narrower text column.
- Serif reading paragraphs, spacious line-height, restrained colored links.
- Figures wider than the paragraph measure when necessary, with clear caption, author/rights and source attribution.
- Visually separate contextual recommendations from the article body.
- Clear article-end author box, tags and related reading.

### Quanta article (SECONDARY)
https://www.quantamagazine.org/how-spiders-spin-silk-dope-into-natures-toughest-material-20261028/

Take inspiration from:
- Meaningful margin space on desktop, focused article reading measure.
- A large lead image and an intentionally structured headline/dek/byline section.
- Optional left rail for author information, article sections, print/share, and related context; on mobile move rails BELOW or ABOVE the body rather than constricting it.
- Carefully chosen typographic hierarchy without an over-busy news portal feel.

### Nature scientific publication conventions (SEMANTIC reference, not a visual clone)
https://www.nature.com/

Apply only as appropriate for the content type:
- Meaningful author affiliations and dates, primary source links and DOI references when genuinely supplied.
- Figures with credits/licensing, bibliographies, equations and scientific tables.
- Clear distinction between a science-news story, explainer and actual research article/research digest.
- Never invent peer-review status, DOI identifiers, author credentials, citation metadata or publishing licences.

### Copyright and evidence rules
The reference URLs and owner-provided screenshots are **visual design references**. Do NOT scrape and republish their articles, text, illustrations, logos, CSS bundles, paid content, embedded videos, or photographic assets. Do NOT generate a pixel-identical clone. Use original components, brand assets, placeholder imagery with verified rights or carefully designed CSS placeholders, and **synthetic clearly labeled demo science articles**.

Do not assume the AI Studio project automatically has access to screenshots provided in a different ChatGPT conversation. The owner should attach 1 Knowable homepage screenshot and 1 Knowable/Quanta article screenshot in AI Studio as image input. The URL alone may not allow the AI to fetch a dynamically rendered site.

## 2. Product boundaries & stages

### Stage A — public-facing first-version website with isolated demo content, NOW
- Create a fresh app named ScientificRadar Web, separate from existing ScientificRadar Studio.
- Keep it light, with no CKEditor/Tiptap dependency and no monorepo/vendor-staging import.
- Use static original demonstration data shaped like real content so navigation, article cards, filtering and reader pages actually work.
- Build complete responsive primary routes and prove with browser interactions/screenshots.
- Work solely inside AI Studio sandbox and a NEW distinct GitHub repository when owner connects it.
- No real publishing, no cross-app state, no production DNS/deployment.

### Stage B — owner design iteration, NEXT
- Compare homepage and long-read against references at 1440×900, 1024×768 and 390×844.
- Fine-tune hero proportions, spacing, serif weights and typography, cards, dropdowns, footer, multimedia, and ads placeholder locations.
- Allow CSS design tokens (colors, max width, body width, fluid sizes) to be adjusted without rewriting page markup.

### Stage C — integration planning, LATER
- Define shared content contract between Studio and Web; ensure Studio's canonical sanitized bodyHtml and linked scientific metadata are faithfully renderable.
- Establish a server-side publishing adapter, public draft/published separation, auth boundaries, media delivery, cache invalidation and SEO lifecycle.
- Consider a single monorepo with apps/studio and apps/web + shared packages **after** the prototype is approved and proven; do not perform that migration now.
- Never directly use Studio's browser IndexedDB as the public website's server database.

### Stage D — production migration, owner approval required
- Domain, DNS, Cloudflare, storage, image services, analytics, ads, RBAC and any paid services are separate authorization gates.
- Enforce accessible routes, SSR/SSG/ISR where appropriate, canonical URLs, robots/sitemaps, safe HTML and public asset delivery before deployment.

## 3. Website information architecture — Stage A

Required working routes (choose exact slug names consistently):
- / — homepage: editorial hero, latest items, category collections, popular, selected multimedia, newsletter placeholder, footer.
- /article/[slug] — long-form science article: headline, dek, genuine metadata, lead figure, rich body, related stories, citations and credits.
- /topics — topic/category directory.
- /topics/[slug] — category landing page with featured story, related cards and working pagination/filter UI.
- /search?q= — local mock-data search with meaningful empty and results states.
- /about — short original ScientificRadar mission and transparent demo status.
- /404 or framework equivalent — elegant missing-page experience.

Do not create fake editorial sections as inert buttons. Every visible navigational element should have a real local route, a valid dropdown, or a visibly honest demo-state behavior.

### Header/navigation
- Centered distinctive ScientificRadar brand identity.
- Main categories from an editable local taxonomy fixture. Suggested demo set: Physics, Biology, Medicine & Health, Chemistry, Technology, Earth & Climate, Society & Research.
- Category link goes to its listing; adjacent chevron button opens nested subcategories, using accessible state (aria-expanded / aria-controls), Escape close, keyboard navigation, outside-click close, focus styles and no hover-only traps.
- Search icon to working search. Desktop categories visible; tablet may collapse selectively; mobile menu opens drawer/accordion. Never copy third-party navigation labels and order verbatim when not relevant to ScientificRadar.
- Optional language switch displayed only when the route actually has another locale. Otherwise omit or truthfully label as not yet available.

### Homepage sections
1. Header + category navigation.
2. Lead editorial feature, optional original science hero art or licensed image; overlaid title only when contrast is robust; text-below-image option.
3. Optional compact subscription invitation, clearly DEMO unless functional.
4. Latest science stories: responsive 3→2→1 cards with responsive images, category, title, summary and byline.
5. Editors' picks / Most read (DEMO ranking explicitly labeled; no fictitious analytics).
6. 1–2 thematic category spotlights with varied rhythm.
7. Multimedia block only using valid, owner-owned / permissively licensed media; otherwise demo thumbnails with no fake video playback.
8. Newsletter demo, about/mission, transparent footer.

Important: the **large Knowable-style hero is selected**, but do not lock all designs to a full-height hero. Provide a compact or text-led presentation token/variant, to review later.

### Long-form article
- Article category and subcategory above title; centered title (sole H1) with Merriweather serif; separate dek and byline/date.
- Hero image can be wider than body, with visible caption, verified credit and license.
- Main readable text measure initial 680–720 px (tune later), font ~17–19 px, line-height ~1.65–1.75; measure by character count, not width alone.
- Distinct H2/H3, blockquotes, footnotes, reference hyperlinks and optional drop-cap only if robust and accessible.
- Figures and comparison tables may extend wider than body to ~1000–1100 px on desktop while remaining fluid and scrollable on mobile.
- Equation/KaTeX presentation respects text baseline, horizontal overflow and accessibility; no automatic reinterpretation of source TeX.
- Citations/bibliography display real source links/DOIs when available. Provide back-reference affordances when supported.
- Sidebar widgets or related-story recommendations must NOT shrink article body below comfortable width or interrupt screen reader order; move below content on narrow screens.
- At end: optional scientific references, editorial author card, tags, article rights/license and contextually related stories.
- Print mode and reading progress can be planned for a later release; do not pretend they are complete if not built.
- The demo must render at least one long article containing paragraphs, H2/H3, source links, one captioned figure and a references section. Use original synthetic text, not copied Knowable/Quanta articles.

## 4. Tokens and editorial typography — first-pass defaults, easy to change

Typography:
- --font-editorial = Merriweather Variable: titles, article copy, selected card titles.
- --font-interface = Inter Variable: navigation, tags, timestamps, UI buttons and form controls.
- Keep KaTeX mathematical glyphs and its stylesheet intact; do not force Merriweather into math layout.
- Load font files from SAME-ORIGIN versioned static assets, ideally optimized WOFF2. Preferred production route is Next.js next/font/local with checked-in licensed font files; Next.js next/font/google also self-hosts the downloaded font at build time. If AI Studio cannot retrieve font files, use a declared temporary browser fallback, do not silently use runtime Google Fonts as a permanent requirement.
- Include appropriate OFL license files for fonts and test latin-ext / Turkish glyphs (ı İ ğ Ğ ş Ş ö Ö ü Ü ç Ç).
- display: swap or appropriate metric-aware fallback, minimize preloaded weights and avoid layout shift.

Tokens (suggestions, NOT locked owner decisions):
- --page-max: 1320px
- --reading-max: 700px
- --figure-max: 1100px
- --paper: #FAFAF8
- --ink: #181C21
- --accent: #15747B (subdued science teal)
- --border: #DCE2E4
- --font-body-size: clamp(17px, 1.15vw, 19px)
- --font-body-leading: 1.7
- --heading-weight: 700 (test Merriweather weight and optical sizing before locking)
- spacing scale / fluid container gutters / radii centrally documented.

Dark mode is OPTIONAL for the first public prototype, unlike the admin. If visible, it must fully work (including menu, article, contrast, reload), not be decorative.

Do not copy Knowable Magazine's brand logo, multicolor identity stripe or original card imagery.

## 5. Provisional content model and no-fake-data contract

Proposed TypeScript shape, no permanent API commitment:
- id, slug, locale, type ('news'|'feature'|'explainer'|'research-digest'), status ('demo'|'draft'|'published')
- title, dek, summary, categoryId, subcategoryIds, tagIds, authorIds, publishedAt, updatedAt
- heroMedia { src, alt, caption, credit, verifiedRights, license? }
- canonicalBodyHtml or trusted structured blocks, figures [{mediaId, caption, credits}], scientificSources [{sourceId, title, url, doi?}]
- relatedArticleIds and optional seo fields including description, robots and canonicalUrl.

All fixture stories must be explicitly labeled illustrative / demo in repository docs, with original writing and imagery permissions. Never invent actual scientific studies or DOI records. Reuse domain-specific taxonomy concepts from the Studio master spec without claiming a real API integration exists.

Safe rendering:
- Do not pass arbitrary unsafe HTML to dangerouslySetInnerHTML. Use a documented sanitizer + allowlist / typed portable blocks, preserve scientific inline attributes and protect links.
- External links with target blank require proper rel values.
- Source references are clickable but do not imply verified citation metadata.
- Respect image rights (no unsourced Google Images scraping).
- No live CMS API, no production domain, no credentials.

## 6. Performance, accessibility and SEO

Prototype acceptance goals:
- Semantic single-H1 and accessible headings/landmarks.
- Keyboard usable navigation + dropdowns + search; visible focus indicators and WCAG-oriented contrast.
- Mobile 390px without horizontal overflow (except controlled large-table scroll).
- Layout with proper responsive image aspect ratio, alt texts and restrained effects.
- Self-hosted fonts; no font requests to fonts.googleapis.com/fonts.gstatic.com at runtime when configured for production.
- On meaningful Next.js public pages: server-rendered titles/descriptions, article JSON-LD where fully truthful, robots/sitemap/canonical planned and validated.
- No faux publication claims: prototype should remain noindex and must not present owner-unapproved live stories.
- Measure Lighthouse Core Web Vitals later on an actual deployment; do not claim production LCP/CLS scores based only on a local mock.

## 7. Visual handoff to Google AI Studio

New Build app: **ScientificRadar Web**. Source-of-truth is this specification; owner attaches recommended reference screenshots directly in the NEW AI Studio conversation. Start by viewing:
1. Knowable homepage screenshot: centered masthead, category row, large hero and grid.
2. Knowable article screenshot: title, lead image and narrow serif body.
3. Optional Quanta article screenshot: wide lead figure, readable serif body and optional side rail.

These screenshots are **analysis-only reference attachments**. Do not add the original copyrighted screenshots to a public GitHub repo or use them as public website art assets.

For an autonomous first pass: read the spec, make a clean independent app with no connection to current Studio, implement all Stage A routes and functional interactions, run tests and inspect browser screenshots. If full Next.js cannot be executed reliably in AI Studio sandbox, create a well-modularized React+TypeScript design prototype, say so explicitly and mark server SEO/SSR as deferred. Do not claim Vite CSR alone is the final public production SEO architecture.

After first pass, owner chooses improvements by comparing actual desktop and mobile screenshots. Connect to a **new distinct repository**, proposed Centaurioun/scientificradar-web. Never link the existing Centaurioun/scientificradar-studio repo as the target for new-app direct main sync.

## 8. Acceptance matrix (Stage A)

| ID | Required proof |
| --- | --- |
| WEB-HOME-01 | Home hero, card grids and modular layout render original demo data correctly |
| WEB-NAV-01 | Category links navigate; arrows open nested dropdowns; keyboard/Escape/outside click behavior passes |
| WEB-MOB-01 | 390px mobile menu, cards and article body work without accidental overflow |
| WEB-ARTICLE-01 | Long-read is legible, metadata truthful, lead image/caption, sources and related reading visible |
| WEB-FONT-01 | Merriweather/Inter applied and Turkish text displays correctly; font delivery mode documented |
| WEB-SEARCH-01 | Mock data search/filter works, including empty result state |
| WEB-SEO-01 | Correct single-H1, title/description and noindex demo; SSR/SSG status honestly documented |
| WEB-ACCESS-01 | Basic tab navigation, screen-reader labels, contrast/focus checks |
| WEB-LIC-01 | No copied commercial reference-site images/text/logos in public app |
| WEB-ISOLATE-01 | Studio GitHub repo, storage, CKEditor/Tiptap and production domain unmodified |
| WEB-TEST-01 | Actual runtime/browser, test commands, failures, screenshots, exact commit recorded |
| WEB-PUBLISH-01 | Clearly no live publication or pretend Cloudflare/newsletter integration |

## 9. Non-goals and hard safeguards

- Not building the actual publication backend or moving Studio to apps/studio now.
- Not deploying to scientificradar.com.
- Not introducing login, payments, paid AI API calls, Cloudflare R2, Cloudflare Images, GA4/GSC/AdSense, or live email subscriptions.
- Not copying external site source code, third-party design assets, or copyrighted long-form articles.
- Not writing to current ScientificRadar Studio main or altering the dual editor.
- No assumptions that Google AI Studio can fetch all third-party pages; attached screenshots and this spec are the dependable design input.

## 10. Future shared-system contract (not to implement now)

A public website should consume explicit, server-authorized published article snapshots; it must not inspect Studio browser IndexedDB across origins. Proposed later components:
- Studio publish adapter and authenticated role/review workflow.
- Sanitized, versioned article publication payload including figures, sources, media/rights and locale.
- Content API or database plus cache/revalidation, immutable published revision IDs and rollback.
- Separate public rendering app with SEO/SSR and CDN delivery; replace illustrative JSON fixtures only after verified integration.
- Site design settings: controlled theme/font/reading-width/hero variants whose publish action updates website settings after preview and authorization.
- Cloudflare is a delivery/cache choice after hosting architecture is selected; no special font bucket required.
- Gradual migration into monorepo apps/studio + apps/web + packages/content,publishing,design if warranted by actual shared code. Preserve revision history and existing tests.

**Stop condition:** If implementing agent attempts to import all current Studio source or edit the existing CMS, abort that work and keep the new website standalone. If images/rights or font downloads are unavailable, provide original accessible placeholders and clearly list substitutions.

## 11. References (external context, not assets)

- Knowable: https://knowablemagazine.org/
- Knowable article: https://knowablemagazine.org/content/article/living-world/2026/why-animal-blood-comes-in-different-colors
- Quanta article: https://www.quantamagazine.org/how-spiders-spin-silk-dope-into-natures-toughest-material-20261028/
- Nature: https://www.nature.com/
- Google AI Studio Build docs: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Next.js fonts: https://nextjs.org/docs/app/getting-started/fonts
- Merriweather license/metadata: https://github.com/google/fonts/tree/main/ofl/merriweather
- Studio architecture: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md

---

## 12. Implementation-ready design contract — version 2.0

This appendix strengthens sections 0–11 without overruling the owner's aesthetic choices. Exact values are initial defaults, not irrevocable owner approvals. Centralize values as theme tokens rather than embedding them in components.

### 12.1 Responsive geometry and composition

| Region | Desktop >=1200px | Tablet 768–1199px | Mobile <=767px |
| --- | --- | --- | --- |
| Header | Centered original ScientificRadar wordmark, utilities and visible category row | Compact branding and selective nav collapse | Accessible compact header, menu toggle and search |
| Home hero | Editorial large cover, headline contrast assured; compact variant supported | Scaled image, title remains legible | Full-bleed or inset crop with title BELOW image when overlay fails contrast |
| Home cards | 3-column editorial grid | 2 columns | 1 column |
| Reading page | 680–720px prose, centered or with a separate left/right rail OUTSIDE reading measure | Rail beneath body or collapsed | Full safe-width prose, no side rail |
| Scientific figure | Natural flow or wider figure up to ~1100px; captions/rights | Fluid | Fluid; tables/code scroll independently |
| Related cards | 3 columns | 2 | 1 |

At 1440x900, 1024x768, 390x844 and a 320px stress width, verify that text, menus, tables, images and pagination are actually usable. Minimum body gutters ~16px; do not make sidebar widgets shrink the reading column.

### 12.2 Component boundaries and behaviors

Build small original reusable components: SiteHeader, PrimaryNavigation, CategoryDropdown, MobileMenu, LeadStory, EditorialCard, StoryCollection, ArticleHeader, ArticleReader, ScientificFigure, CitationList, AuthorProfile, RelatedStories, SearchResults, TopicsDirectory, Footer.

Key UI contracts:
- A category LABEL is a regular anchor to its category landing page. A SEPARATE chevron BUTTON toggles nested links. Hover may assist but never be required.
- Menu toggle supports aria-expanded, aria-controls, keyboard Enter/Space, Escape, visible focus, outside click, focus return; submenu does not remain invisibly focusable.
- The centered masthead is DISTINCT ScientificRadar branding. Do not reproduce Knowable's logo, brand stripe, image identity, card photography or category labels wholesale.
- Use a generous but not permanently oversized first-story hero. Provide compact hero variant through a token/prop. High-contrast editorial text can appear on image only when verified; fallback text below image.
- Empty image/metadata fields show graceful fallbacks rather than blank frames or fictitious credits. Card image area should have a consistent aspect ratio and alt text.
- Category navigation, search, related stories and footer links must lead to real local routes; no dead interactive-looking elements.
- Reusable article reading components preserve heading hierarchy and figure captions, source lists and DOI ONLY when real.

### 12.3 Suggested tokens — all reviewable after screenshots

| Token | Initial value | Purpose |
| --- | --- | --- |
| --sr-page-max | 1320px | Homepage and grids |
| --sr-reading-max | 700px | Long-form body |
| --sr-heading-max | 880px | Article title and dek |
| --sr-figure-max | 1100px | Wide scientific artwork |
| --sr-gutter | clamp(16px, 3vw, 40px) | Responsive outer padding |
| --sr-body-size | clamp(17px, 1.3vw, 19px) | Long-read text |
| --sr-prose-leading | 1.7 | Paragraph line-height |
| --sr-paper | #FAFAF8 | Background |
| --sr-ink | #181C21 | Body text |
| --sr-accent | #15747B | Links and small accents |
| --sr-rule | #DCE2E4 | Borders |

Example CSS guidance for AI Studio (illustrative, not a demand to copy exact styling):

    :root {
      --sr-page-max: 1320px;
      --sr-reading-max: 700px;
      --sr-heading-max: 880px;
      --sr-figure-max: 1100px;
      --sr-gutter: clamp(16px, 3vw, 40px);
      --sr-prose-leading: 1.7;
    }
    .site-container {
      width: min(calc(100% - 2 * var(--sr-gutter)), var(--sr-page-max));
      margin-inline: auto;
    }
    .article-prose {
      width: 100%;
      max-width: var(--sr-reading-max);
      margin-inline: auto;
      font-size: clamp(17px, 1.3vw, 19px);
      line-height: var(--sr-prose-leading);
    }
    .article-prose :where(img, video, svg) { max-width: 100%; height: auto; }
    .article-prose :where(pre, table) { max-width: 100%; overflow-x: auto; }

Do not hardcode Merriweather into KaTeX/math typography. CSS theme tokens can evolve later through Studio's future website-settings publish workflow.

### 12.4 Font-loading performance and rights

- Merriweather Variable: prominent titles, H2/H3 and long-form article body; Inter Variable: menus, metadata, bylines, tags, form controls and figure credits.
- Prefer Next.js next/font/local + checked-in licensed WOFF2 and OFL notice, or next/font/google that downloads during build and serves from same origin at runtime. Do not add third-party Google Fonts CSS calls at visitor runtime.
- Load only required subsets/weights; confirm Turkish ı/İ, ğ/Ğ, ş/Ş and all English glyphs; test roman/italic and variable axis behavior.
- Use font-display swap or a correctly measured fallback; document preload decisions and CLS effect. Do not blindly preload every variant.
- No Cloudflare R2/font bucket needed. Use web host CDN/static cache and measure real delivery later. Never assert a performance win without tests.

### 12.5 Data model and future API contract (NOT implemented during this phase)

Proposed public content record fields: id, slug, locale, editorialType, publicationStatus, title, dek, excerpt, categorySlug, subcategorySlugs, tagSlugs, authors, publishedAt?, updatedAt?, hero? {src,alt,caption,credit,rightsVerified,license?}, bodyHtml or bodyBlocks, sources[] {id,title,url?,doi?}, relatedArticleIds[], seo?.

Illustrative TypeScript interfaces for the separate reader website:

    export type EditorialType = "news" | "feature" | "explainer" | "research-digest";
    export type PublicationStatus = "demo" | "draft" | "published";
    export interface PublicSource {
      id: string; title: string; href?: string; doi?: string;
    }
    export interface PublicMedia {
      src: string; alt: string; caption?: string; credit?: string;
      rightsVerified: boolean; license?: string;
    }
    export interface PublicArticle {
      id: string; slug: string; locale: "en" | "tr";
      editorialType: EditorialType; status: PublicationStatus;
      title: string; dek?: string; summary: string;
      categorySlug: string; subcategorySlugs: string[]; tagSlugs: string[];
      authorIds: string[]; publishedAt?: string; updatedAt?: string;
      hero?: PublicMedia; bodyHtml?: string;
      sources: PublicSource[]; relatedIds: string[];
    }
    export interface PublishedContentRepository {
      listPublicArticles(options?: {
        categorySlug?: string; query?: string; limit?: number;
      }): Promise<PublicArticle[]>;
      getPublicArticle(slug: string): Promise<PublicArticle | null>;
    }

Stage A should implement an in-memory typed fixture repository with ORIGINAL synthetic article examples, not direct IndexedDB access. Production must use a server-authenticated publishing pipeline and published snapshots; Studio's browser IndexedDB state is not a public server database. Any source or author metadata absent in the fixture MUST be omitted or explicitly labeled illustrative; never invent DOI, research outcome, author credentials or image license.

Make a publication state distinction in future design: draft-only content must NEVER leak into public HTML, route lists, JSON bundles, structured data or sitemap. Unknown or unpublished slug -> not found. Handle missing media, invalid dates, orphan citations, no articles in category and long titles gracefully.

### 12.6 Scientific content rendering invariants

Current Studio uses canonical sanitized bodyHtml plus ProseMirror JSON. Reader website should ultimately consume a versioned PUBLISHED content snapshot with safe HTML or typed portable blocks, NOT mount editor engines. Preserve:
- One visible H1 at article title surface, never another H1 in article body.
- H2/H3 semantic hierarchy, inline and display TeX, KaTeX math rendering when truly integrated, figure IDs/captions/credit/rights, bibliography source identities, data-citation-source-id, footnotes, scientific table thead/tbody/th/caption, colspan/rowspan as allowed, and code indentation.
- Stable sourceId/mediaId mapping, and no silent rewriting of citation targets.
- Sanitized allowed HTML tags/attributes. Avoid unsafe direct HTML injection; DOMPurify or trusted server allowlisting must not strip science semantics.
- If a citation source is missing, show an explicit conservative unavailable state, not a fabricated reference.
- Good reading measure even around equations/figures; wide tables scroll separately at mobile width.

This is a future integration contract, not a claim that the brand-new website is already connected to the CMS.

### 12.7 SEO, indexing and share metadata

**Stage A (demo content):** prevent preview indexing and production domain ownership, avoid real NewsArticle/Article schema claims for fictional content, use local route title/description where stack supports them, and do not assign the real scientificradar.com canonical prematurely.

**Production later:** SSR/SSG/ISR strategy for public article/category pages, correct canonical/hreflang, Open Graph assets, sitemap/robots lifecycle, structured data consistent with real published article types and truthful dates, cache/revalidation on publish, and no leaked drafts.

A React-only SPA can be a working first-version visual demo but DOES NOT by itself prove SEO-ready production architecture. Record that boundary explicitly if Google AI Studio sandbox cannot run Next.js.

### 12.8 Performance, privacy, accessibility and media

Production targets to MEASURE, not claim now: mobile LCP <=2.5s, CLS <=0.1 and INP <=200ms at 75th percentile. Keep hero compressed and correctly sized, prioritize true LCP image; lazy load only lower images. Use responsive WebP/AVIF where licensed; set intrinsic width/height to control layout shifts. Avoid unnecessary UI/animation dependencies. Same-origin static font caching, Lighthouse lab checks and real-user field measures later.

Aim at WCAG 2.2 AA design: skip link, landmarks, semantic heading structure, focus-visible, meaningful alt, sufficient contrast, reduced-motion, 200/400% zoom and tested keyboard navigation. No fake audio playback, autoplay video, ad impression counts, subscribe completion or populated analytics. A newsletter demo must not accept and retain visitor email addresses without a real authorized service.

Image rights: keep a source/permission ledger for every non-original media asset. The reference screenshots, source-page articles, logo and illustrations are ANALYSIS evidence and must never become public application assets by default.

### 12.9 Browser test acceptance script

For each first-pass version verify in actual browser (not only compile):
1. At 1440x900: center masthead, active lead story, understandable first story grid without horizontal overflow.
2. At 1024x768: category row does not overlap, hero flows, 2-column cards.
3. At 390x844 and 320px stress: functional mobile menu, sane headings and figures, independent table overflow.
4. Category label navigates; separate chevron opens submenu WITHOUT triggering navigation; Escape closes and restores focus; Tab/Enter/Space and click outside work.
5. Search with query matching a demo title, uppercase/diacritic case and zero-result state; no fake spinner.
6. Two separate >1000-word (where feasible) ORIGINAL sample reads, including paragraphs, H2/H3, at least one captioned scientific figure, source list, related articles and different image layouts.
7. Unknown route shows 404; missing hero/media has legitimate fallback; credit not fabricated.
8. Font loading via actual network panel: self-hosted files or explicitly documented build-time/fallback mode; Turkish characters render.
9. Only one article H1; noindex demo correctly scoped; no fake published structured data.
10. Lighthouse/mobile metrics reported only when actually measured, with environment, audit output and reproducible commands.

Recommended artifacts in NEW web repository: docs/WEBSITE_BUILD_AUDIT.md, docs/design/DESIGN_TOKENS.md, docs/design/CONTENT_CONTRACT.md plus screenshots of the NEW original site. Do not place third-party reference screenshots into a public git repo without separate license review.

## 13. Codex external-site research and evidence precedence

A read-only reference investigation may be recorded at docs/public-website/reference-audit/2026-11-02/ under the EXISTING ScientificRadar Studio repository. Research may use REA with explicit browser permissions or Playwright/CDP fallback. Its purpose is to document OBSERVED structure, dimensions and interactions, not to acquire or reuse external source code/creative media.

Precedence:
1. Owner's final explicit decisions: Knowable-inspired homepage, Knowable/Quanta long read, Nature-like scientific metadata, Merriweather + Inter, separate app, no production changes.
2. Evidence-backed, source-dated reference observations, clearly tagged as observed vs inferred.
3. Proposed default tokens, further editable by owner.
4. Implementation agent's decisions, logged as provisional.

Codex should not modify the existing app or create a new website; it only writes evidence-based audit documents. A report in this folder is not automatically a design-approval decision.

## 14. Six-cycle iterative refinement — document critique record

The following are six SPECIFICATION critique passes, NOT actual browser tests or independent reviewer sign-off.

| Cycle | Attack question | Gap identified | Repair |
| --- | --- | --- | --- |
| 1. Intent & identity | Will a generic magazine look like a copied Knowable site? | Inspiration not bounded | Exact role of Knowable homepage, Quanta long read and Nature semantics; original brand and licensed assets only |
| 2. Navigation & experience | Are menus functional, accessible and distinct from category links? | One click surface for link+dropdown could conflict | Separate anchor + chevron; Escape, keyboard, mobile accordion, search, route tests |
| 3. Readability & science | Do long scientific articles, tables, math and citations survive? | Layout mostly described visually | Explicit prose measure, wide figures, scientific HTML/metadata invariants and renderer contract |
| 4. Architecture & publishing | Can Studio IndexedDB magically drive another app? | False assumption risk | Typed fixture adapter and later server-published snapshot contract; independent repository |
| 5. Performance, rights & SEO | Would first version be fast, legal and truthful? | Insufficient asset/font/SSR distinctions | Same-origin fonts and rights ledger, demo noindex, meaningful tests, future SSR and CDN gates |
| 6. Verification & handoff | Can an agent declare PASS after only a screenshot? | Weak evidence traceability | Concrete viewport routes, interaction matrix, console/network tests, audited results and REA provenance boundary |

**No production deployment or CMS integration approval is implied by this design document.**


---

## 15. Codex Phase 2: measured reference reconciliation (2026-11-02)

**Research SHA:** 690e2fc8a0f9d5cb6f0e254ee5650f5762637250.
**Evidence folder:** docs/public-website/reference-audit/2026-11-02/technical-deep-dive/.
The 10 files there contain a computed-style CSV, original DOM/layout and interaction descriptions, six refinement cycles, original React/Next suggestions and explicit limitations. This section summarizes the actionable findings so Google AI Studio can work from this attached blueprint even if it cannot read GitHub.

### 15.1 OBSERVED: only one publicly accessible Quanta article

| Topic | Observed REA/Playwright evidence | Implication for ScientificRadar |
| --- | --- | --- |
| Prose width | 560 px inner text within a 688 px center section (64 px padding each side) at 1440 and 1024 viewport widths | Do not automatically replace the owner's 700 px initial reading token; compare 600 px and 700 px variants with actual article screenshots |
| Desktop layout | 1160 px body composition at 1440 = 236 px rail + 688 px center + 236 px rail | Optional rails belong outside text column; omit rather than squeeze on tablet/mobile |
| Mobile | At 390 px, prose 350 px, 20 px gutters, 60 px header, rails hidden; 320 px leaves 280 px prose | Prioritize one column, mobile reading order, safe gutters, no horizontal overflow |
| Transition | Flex row at 600 px; flex column at 540 px; precise CSS breakpoint not verified | Choose our own content-driven breakpoint; do not copy a guessed Quanta threshold |
| Typography | Body Merriweather 16 px / 30 px, Quanta H1 display Noe Display 40 / 46 px desktop | Preserve owner-approved Merriweather + Inter; keep optional independent display-font token |
| Menu | Full screen menu opens, tested Escape did not dismiss; only limited sequence sampled | Our menu MUST support Escape, focus return, overlay handling and keyboard/touch, rather than reproducing a reference limitation |
| HTML semantics | Observed main > div.post, no semantic article element in sampled route, one H1 | Implement our own semantic main/article hierarchy, proper time/author and caption markup |
| Figures | 12 figure nodes, 7 figcaptions, possible nested wrappers; some DOI-host links | Do not treat every figure wrapper as unique image; give original figures alt/caption/credit/rights and authentic references only |
| 320 px stress | Document scrollWidth 326 px; tooltip attribution remains unproven | Prevent our own overflow; do not mask it using blanket overflow-x hidden |

These observations do not establish Quanta's actual component source code, framework internals, data API or other routes. Do NOT copy full third-party source, fonts, content or visual assets.

### 15.2 Knowable: source page still blocked

Both Knowable homepage and example long-read returned Cloudflare HTTP 403 verification in isolated REA and Playwright. There is NO verified Knowable computed style, DOM tree, responsive breakpoint or menu behavior. The owner's previously provided screenshots remain SCREENSHOT-ONLY visual evidence of centered branding, category navigation, lead hero, editorial grid and article reading hierarchy. The original ScientificRadar implementation must meet its OWN route/accessibility requirements.

If AI Studio can lawfully access public reference URLs, document what it sees; if it cannot, use the owner-supplied screenshots. Do not attempt to bypass Cloudflare or pause the build for another reverse-engineering cycle.

### 15.3 Implementation choices

- Initial reading column: 700 px, configurable through one design token. Test a SECOND 600 px variant at 1440 and 1024 using real sample text; defer final owner selection. 560 px is a measured Quanta reference, NOT the required ScientificRadar width.
- Continue distinct fluid figure max width around 1100 px, but validate CSS breakout within any grid/sidebar. No global overflow-x:hidden workaround. Test article figures, scientific tables, long titles, math and citations at 320 px and 390 px.
- For visible normal website category links, prefer disclosure navigation with real anchor plus separate chevron button, normal Tab order, Escape and focus return. If designing a modal fullscreen drawer, add tested focus/scroll management. Avoid blindly using role=menu unless the full ARIA menu keyboard pattern is implemented.
- Quanta's DOM used no article element on sampled route; ScientificRadar should use semantic main > article, one H1, structured date, author and citation metadata and accessible figure/figcaption pairs.
- At least two original long-read demo articles must exercise real scientific structures, source links, missing metadata fallbacks and differing figure layouts. Do not invent verified study claims, DOIs, author credentials or media rights.
- Original typed block renderer is a good demo interface; later Studio adapter must consume approved sanitized canonical published bodyHtml preserving source IDs, figure media IDs, TeX, references and tables. Do not mistake a simple text-only mock block renderer for a production-compatible article serialization layer.
- Codex IMPLEMENTATION_EXAMPLES.md contains unexecuted illustrative React/CSS, NOT verified drop-in production components. Especially re-test wide figure positioning, citation source identity and mobile overflow.
- Same-origin licensed Merriweather and Inter remain the font decision. Refrain from using Quanta's display/UI font binaries or copying Knowable's brand identity.

### 15.4 Research-stop and build-start decision

The independent Codex research is sufficient to start the NEW ScientificRadar Web website build in Google AI Studio. The recorded six research cycles are not six successful website tests. The NEW website must run its own six implementation review cycles with real screenshots/controls/tests, create/sync to a DIFFERENT GitHub repository, and leave ScientificRadar Studio and production services unmodified.

**Precedence:** owner's design choices > proven measured reference observations > adjustable recommended tokens > implementation agent preference. Both Knowable references remain screenshot-only when inaccessible.

