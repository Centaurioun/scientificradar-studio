# ScientificRadar Public Website — Design, UX & Architecture Blueprint

**Version:** 1.0 · 2026-11-02 (Europe/Istanbul)
**Document owner:** ScientificRadar
**Repository containing this decision record:** https://github.com/Centaurioun/scientificradar-studio
**Project:** ScientificRadar Web — reader-facing website, separate from ScientificRadar Studio
**Status:** Approved visual direction + proposed build defaults. This document is a SPECIFICATION, not an implementation certificate or production deployment authorization.

## 0. Executive decision

Build an ORIGINAL, responsive, attractive public science magazine website, inspired principally by the visual language of Knowable Magazine, with selected long-read ideas from Quanta Magazine and accurate scientific metadata conventions from Nature.

**First deliverable: a visual and interactive, locally working PROTOTYPE in a NEW Google AI Studio app and ultimately a SEPARATE GitHub repository, proposed name Centaurioun/scientificradar-web.** The existing ScientificRadar Studio application and its GitHub main MUST NOT be overwritten, imported wholesale, redeployed or restructured during the experiment.

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

### Stage A — public-facing visual prototype, NOW
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
