# ScientificRadar Studio — Master Product & Engineering Specification

> **Document:** `SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md`  
> **Status:** Approved direction, **implementation specification for a SAFE PROTOTYPE**; not production authorization  
> **Version:** 4.1 · 31 October 2026  
> **Target:** Google AI Studio Build Mode, **Next.js** option  
> **Project name:** ScientificRadar Studio  
> **Repository suggestion:** `scientificradar-studio`  
> **Website context:** https://scientificradar.com  
> **Language of this specification:** English; application UI defaults to English and is designed for English/Turkish content  

## 0. Instructions to the Implementing Agent

Read this **entire file** before changing code. Treat it as the authoritative source of functional requirements. The chat's brief instruction refers to this document; do not replace these requirements with a generic CRM, marketplace dashboard, e-commerce demo, or analytics template.

**The single most important distinction:** the user writes and pastes their own scientific articles. The future Codex Assistant **prepares existing articles for publication**: structural formatting, spelling/punctuation, SEO metadata, tags, image handling, links and source checks. It must **not write, replace, summarize, embellish, delete, or reinterpret the user's science content** by default. Every proposed change must be reviewable and reversible.

**Delivery contract:** Build an excellent interactive prototype before attempting real cloud integrations. Fully implement the P0 vertical slice; keep P1/P2 architecture ready and demonstrate only what works. Clearly label unavailable connections, and never present simulation as successful live verification. Deliver the actual Next.js source tree, README, tests, and this spec in the GitHub-exportable project. Do not publish or connect to the production domain automatically.

Read the implementation order in §17 and the acceptance tests in §18. Work vertically: functional routes, records, and behaviors, rather than a large number of beautiful but dead screens. Do not ask for credentials in the first prototype. Avoid vendor lock-in and paid dependencies where equivalent maintained, suitable open-source components suffice.

### Non-negotiable safety constraints

- **No changes to** `scientificradar.com`, DNS, its current CMS, published pages, production data, live analytics/ads, or existing integrations.
- **No production publishing** in the first build. `Publish` changes only internal demo-state; the public website remains untouched. Make this conspicuous in the interface.
- **No live secrets in client code**, localStorage, git, screenshots, or logs. Use server-only secrets and `.env.example` placeholders if future integration requires credentials.
- **No Codex/ChatGPT credential scraping**, copying login sessions, automating an unauthorized OAuth flow, or pretending ChatGPT-subscription usage is universally available. Keep a provider adapter disabled until a supported mechanism has been explicitly configured and verified.
- **No fake DOI verification, broken-link checks, AI review, Cloudflare upload, Google data, or publication success.** Simulation must be explicitly marked `Demo` and never imply that external services were contacted.
- **Never silently alter scientific meaning**. Missing evidence is a finding, not permission to invent evidence.
- No arbitrary shell access, unrestricted server-side URL fetches, or arbitrary code execution from editorial content or assistant instructions.
- Use dependency and integration versions compatible with the environment at build time; consult official docs rather than guessing APIs.

---

## 1. Product Vision and Success Criteria

**ScientificRadar Studio** is a modern, fast, accessible, editorial CMS for a science news and research publication. It should feel like a lightweight scientific newsroom—not a sales dashboard. It supports everyday article creation, structured content metadata, taxonomy, revision/review, reusable site pages, homepage/navigation configuration, media management, scientific references, SEO checks, and optional AI-assisted finishing.

### Primary users

1. **Owner/Admin:** configures modules, sites, integrations, roles, taxonomy, navigation, and publication settings.
2. **Editor:** pastes/edits articles, manages sources, reviews proposed AI changes, previews, schedules/publishes if authorized.
3. **Author/Contributor:** creates drafts and submits for review without bypassing approval.
4. **Reviewer:** provides editorial feedback and signs off under role policy.

Roles may overlap. A public author profile is separate from a staff login account.

### Success metrics (qualitative plus testable)

- A new editor can discover **Articles → New Article** without instructions.
- Pasting a 2,000-word article results in an uncluttered, wide editing surface; no duplicate visible H1 in the published preview.
- Create → edit → autosave → preview → refresh → reopen works in prototype state.
- Each sidebar module can be shown/hidden through **Settings → Dashboard & Navigation** with settings preserved across reloads.
- Source links, glossary popovers, media metadata, and article state persist in the prototype's local data store.
- Every action responds, navigates to a real route, or clearly states `Not connected yet` and why.
- Light/dark modes, keyboard access, and desktop/tablet layouts work; narrow screens remain usable.

### Anti-goals

- Do **not** introduce CRM leads, customers, pipelines, sales KPIs, invoices, orders, or product catalogues.
- Do **not** treat Filament, Tabler, AdminLTE, Gentelella, Refine, or Payload as mandatory source dependencies. They are references only.
- Do **not** implement an elaborate page builder, chat messenger, CRM, content-generation agent, expensive automation system, or unlimited taxonomy in the first vertical slice.
- Do **not** add a colorful 12-card KPI dashboard solely to fill space.
- Do **not** force an editor to adjust each image's pixel dimensions manually.

---

## 2. Decisions & Alternatives (Brainstorming Outcome)

### Architecture chosen

**Next.js (App Router) + React + TypeScript**, Tailwind CSS, shadcn/ui/Radix-style accessible primitives, Tiptap editor, modular persistence adapters. This fits Google AI Studio's Next.js option, gives route handlers and application APIs, and supports both an interactive prototype and later full-stack development.

### Alternatives considered and rejected as the primary stack

- **React-only SPA:** fine for visual demos but would require extra assembly for server-side operations, routing and publishing APIs; not preferable here.
- **Laravel + Filament:** excellent for server-side admin CRUD, but conflicts with the explicit Google AI Studio Next.js/React build direction and planned Tiptap/shadcn design. Inspiration only.
- **Payload CMS:** excellent ready CMS; potentially reconsider after prototype validation, but installing it now would shift the job from custom experience testing to a platform integration/migration.
- **Wagtail/Django:** serious future option for Python-heavy pipelines, but not the selected environment for this prototype.
- **Tabler, Gentelella, AdminLTE:** borrow visual patterns or interactions, not the entire CSS/JS packages.

### Visual references and intended borrowing

| Reference | URL | Borrow | Do not borrow |
|---|---|---|---|
| Filament | https://github.com/filamentphp/filament | Compact CRUD, clear actions, responsive data editing | Laravel dependencies, shop dashboard |
| Tabler | https://preview.tabler.io/ | Clean spacing/typography, tables, status badges, activity lists | Wholesale Bootstrap theme |
| Gentelella | https://preview.colorlib.com/theme/gentelella/production/index.html | Command palette, Kanban ideas, file manager, settings patterns | Whole template and sales UI |
| AdminLTE | https://adminlte.io/themes/v4/index3.html | Calendar, tables, project navigation, multi-step forms | Commerce sections, generic stats |
| shadcn Dashboard | https://demos.shadcndashboard.dev/ | Navigation architecture, blog/table/forms patterns | Generic demo menu pages |
| Tiptap | https://tiptap.dev/ | Rich editing, modular extensions | Unnecessary premium extensions |
| Wikipedia Page Previews | https://www.mediawiki.org/wiki/Extension:Popups | Linked-term on-hover summaries | Rehosting Wikipedia as authoritative science evidence |

Review upstream licenses before copying code/assets. A *pattern* may be reimplemented without copying copyrighted imagery/brand assets.

---

## 3. Information Architecture & Personalized Navigation

Use one left sidebar and one coherent application, with grouped items. The balanced preset is the starting navigation; advanced items can remain hidden by default.

### Recommended sidebar

```text
ScientificRadar Studio

GENERAL
  Dashboard

CONTENT
  Articles
  Pages
  Categories & Tags
  Media Library
  Series & Collections
  Homepage & Menus
  Videos [optional module]

EDITORIAL
  Review Queue
  Publishing Calendar
  Authors & Editors
  Revision History [advanced; primarily contextual]

TOOLS
  Codex Assistant [disconnected until configured]
  SEO & Quality Center
  Smart Knowledge Links [can live inside editor/settings]
  Search Performance [optional]

ADMINISTRATION
  Settings
    General
    Dashboard & Navigation
    Content Defaults
    Integrations
       Cloudflare R2 / Image Transformations
       Codex / Sign in with ChatGPT
       Google AdSense
       Google Analytics 4
       Google Search Console
       Google Tag Manager
    Roles & Permissions
    Audit Logs
```

**Global search** should be available at the top or with `Cmd/Ctrl+K`, not occupy a full sidebar item by default.

### Settings → Dashboard & Navigation

- Two switches/presets: `Balanced` and `Show All`; optionally `Minimal`.
- Individual **show/hide** toggles per item; enable later without deleting implementation or content.
- Persist navigation preferences per user when auth exists; per local demo profile before auth.
- Optional reorder by dragging in a later phase; not required for P0.
- Sidebar groups collapse independently; selected item remains obvious.
- Hiding a menu does **not** revoke authorization; RBAC must be enforced in data access/actions when backend is real.
- Critical admin safety controls must remain accessible through Settings regardless of navigation visibility; include `Restore defaults`.
- Don't duplicate `Source Management`, `Revision History`, `SEO` as top-level destinations if contextual article inspector serves the editor more simply. Separate overview pages may be added later.

### Page/route inventory (App Router)

```text
/                               -> redirects to /dashboard
/dashboard
/articles
/articles/new
/articles/[id]/edit
/articles/[id]/preview
/pages
/pages/new
/pages/[id]/edit
/pages/[id]/preview
/categories
/media
/series
/homepage
/menus
/review
/calendar
/authors
/seo
/assistant
/settings
/settings/navigation
/settings/integrations
/settings/roles          [P1]
/settings/audit          [P1]
/preview/articles/[id]   -> mock public article preview, isolated
/preview/pages/[id]
```

Avoid deep nesting for common tasks; route names can be adjusted as long as semantics stay stable.

---

## 4. Overall UI Design System

### Personality

Calm, trustworthy science newsroom: professional editorial workspace, minimal clutter, no crypto/commerce clichés. Preserve the previous approved concept: light neutral surfaces, teal accents, clear typography, compact left navigation, broad editor and adjustable right inspector. Dark mode should retain readability, not depend on black-on-black contrast.

### Layout defaults

- Desktop sidebar expanded ~232–256 px, collapsible to icon rail ~60–72 px.
- Desktop top bar ~56–64 px with breadcrumbs, global search/command access, autosave/status, preview and primary article actions.
- Article editor is the **main visual priority**. Use available width flexibly; prefer an editable reading measure of ~70–95 characters, but allow broader writing layouts without a fixed narrow card.
- Right-hand inspector ~288–340 px, independently collapsible. The editor expands when the inspector is hidden.
- Codex Assistant opens as a drawer/overlay or swap for the inspector; **do not shrink the editor into a tiny central column**. On compact screens use a full-height sheet.
- Phone: sidebar becomes a navigation drawer, inspector becomes a tab or bottom sheet; primary actions remain reachable.
- Tablet: collapsible sidebar and optionally collapsed inspector.
- Avoid carousels and excessive chart animations in admin.

### Tokens

```css
/* Indicative design tokens, not a mandate to copy exact colors */
:root {
  --sr-primary: #087f83;
  --sr-primary-hover: #086b70;
  --sr-bg: #f7f9fa;
  --sr-surface: #ffffff;
  --sr-border: #e1e7e9;
  --sr-text: #15222a;
  --sr-muted: #64737a;
  --sr-radius: 10px;
}
```

- UI font: accessible sans-serif (Inter or system fallbacks).
- Article body: strongly readable type, 16–18 px; optional editorial serif for rendered article H1; editor UI itself remains sans.
- Semantic status colors, never status-by-color alone.
- Reduced-motion support, high-contrast focus rings, predictable keyboard navigation, minimum 44 px touch controls where appropriate.
- UI language EN initially; design for TR labels/strings without breaking layout.

### Shared building blocks

`AppShell`, `SidebarGroup`, `Topbar`, `CommandPalette`, `DataTable`, `StatusBadge`, `EmptyState`, `SaveStateIndicator`, `ArticleEditor`, `MetadataInspector`, `SourceList`, `MediaPicker`, `PreviewShell`, `DiffReview`, `IntegrationStatus`, `SettingsSection`.

---

## 5. Dashboard (Editorial, Not Sales)

Above the fold: editorial work, not monetization. Display only metrics relevant to publishing:

- Drafts; Needs Review; Scheduled; Published (small, restrained metric strip).
- `Continue editing` list of recent drafts.
- `Requires attention` list: missing source URLs, unpublished drafts, failed link checks when actually executed, empty alt text, unresolved review notes.
- Upcoming publication dates (small calendar/list, not giant analytics chart).
- Quick action: **New Article** and **New Page**.
- `Recent Activity` log in a compact feed.
- All counts calculated from demo records; no fake traffic or AdSense revenue.
- Configurable widget visibility, later per-user reordering. Dashboard menus and widget customization are related but separate settings.

---

## 6. Articles — List & CRUD

### Articles list

- Search by title, slug, author, category, tag, language, source DOI (if stored).
- Sort, filter, paginate, select rows, bulk state changes subject to permissions.
- Columns: checkbox, Title, Category, Language, Author, Status, Source Status, Updated, Schedule, Actions.
- Saved filters: All, My Drafts, In Review, Scheduled, Published, Needs Attention.
- Row actions: Open/Edit, Preview, Duplicate, Archive; Delete only with confirmation.
- `New Article` button always visible, not buried in kebab menu.
- Empty-state guidance and seeded 8–12 illustrative science articles.

### Lifecycle

```text
Idea -> Draft -> In Review -> Revision Requested -> In Review
                          -> Approved -> Scheduled -> Published -> Archived
Draft -> Archived
Approved -> Published (authorized publisher only)
```

Transitions validated by role; never let drag-and-drop silently bypass permissions. A status change updates the list, dashboard counts, calendar, and audit history. In the isolated prototype `Published` means **published inside the demo**, not live to scientificradar.com.

### Article content model

- **Title**, used as **the one and only rendered H1**.
- Stable ID; unique slug per language/locale, with collision validation.
- `summary/dek`, optional excerpts; body in **Tiptap JSON document** (source of truth), sanitized HTML output for preview.
- Primary category, optional secondary categories, tags (deduplicated, normalized).
- Author profile; language `en` or `tr`; optional linked translation record.
- Featured media, inline media blocks, figure captions/credits/alt text.
- Source relations and verified/unverified labels.
- SEO title, meta description, canonical URL (only when public integration is configured), index setting, optional social share image.
- Status, created/updated, scheduled/published, change version, review notes.

### Article editor: mandatory interaction

1. Create article; title separate from body.
2. Paste text or Markdown; preserve paragraphs, inline marks, links, lists, tables where reasonable.
3. Editor supports **Paragraph, H2, H3**, bold, italic, underline, strike, bullets, numbered lists, blockquote, link, image/media, table, undo/redo. Keep advanced extras in a `+` menu.
4. Do **not** expose H1 in body toolbar. Convert pasted Markdown `# Heading` or imported body H1 into a proposed H2 (or plain text as appropriate) and warn; never silently rewrite semantic meaning.
5. Toolbar can be sticky in the large editor; use accessible tooltips and keyboard shortcuts.
6. Autosave with visible `Saving...`, `Saved`, `Unsaved changes`, `Save failed`. Debounce and guard against overwriting edits; offer manual Save Draft.
7. Metadata inspector right rail: Status, Category, Language, Tags, Author, Featured Image, Sources, SEO, Schedule.
8. Preview renders the **actual draft** with correct H1, images, knowledge-link cards, responsive layout; Desktop/Mobile preview toggles. It must never claim the preview is live on scientificradar.com.
9. Sticky top actions: Save Draft, Preview, Prepare with Codex, Submit for Review, Schedule/Publish (permission-gated).
10. Version snapshots and restore; later node-level diff and multi-user conflict controls.

### Tiptap/Next.js example (illustrative; adapt to installed versions)

```tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function ArticleBodyEditor({ content, onChange }: {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });
  return <EditorContent editor={editor} aria-label="Article body" />;
}
```

A `title` field is rendered by the public/preview article template as `<h1>…</h1>`. **Never** add a second body H1. For production use, debounce onUpdate, include proper editor extensions/typing and autosave conflict handling; this snippet expresses intent, not complete app code.

---

## 7. Pages, Homepage & Navigation

### Pages

Manage static or semi-static pages in the same broad Tiptap editor:

- Home, About Us, Contact, Editorial Policy, Corrections Policy, Authors, Privacy Policy, Terms of Use, Accessibility Statement, optional Services and custom pages.
- Not all example pages need seeded published content. Support add/edit/preview/archive and safe slug/URL management.
- Page model: `id`, `title`, `slug`, `locale`, `body`, `seo`, `template`, `status`, `navigationVisibility`, timestamps.
- Public contact form and legal text must not be invented as actual live data; use placeholders in demo.

### Homepage & Menus

- Homepage sections are **predefined manageable blocks**, not a free-form site-builder: hero article, featured articles, recent articles, topical highlights, editorial banner.
- The user can choose content and reorder blocks, using representative previews.
- Primary navigation and footer menus: create groups/items, assign internal target, optional safe external URL, reorder and nested dropdown.
- Both **hover-to-open** and **click-to-open** dropdown supported on desktop; touch/click and keyboard equivalent on mobile.
- Link destination remains clickable for parent categories (provide separate toggle control to avoid hover vs click ambiguity).
- Do not publish menu changes to the live site until an explicit later migration/publishing contract exists.

---

## 8. Categories, Tags, Series, Authors

### Starting taxonomy, editable from admin

Seven suggested top-level categories with twenty-five illustrative subcategories; **audit existing scientificradar.com URLs before adopting**; these are NOT instructions to rename live URLs:

| Category | Subcategories |
|---|---|
| Space | Astronomy, Astrophysics, Cosmology, Planetary Science |
| Earth | Climate, Geology, Oceans, Environment |
| Life | Biology, Genetics, Ecology, Neuroscience |
| Humans | Medicine, Psychology, Anthropology, Public Health |
| Physics | Quantum Physics, Particle Physics, Classical Physics |
| Chemistry & Materials | Chemistry, Biochemistry, Materials Science |
| Technology | Artificial Intelligence, Engineering, Energy |

`Videos` is a content type, not necessarily a primary science discipline. Categories may have `parentId`; prevent cycles, duplicates, orphaned slugs; preserve historic URLs and redirects if migrated later. Use tags for cross-disciplinary topics, avoid 100s of unstructured categories.

### Tags

- Search/create from article editor; case-insensitive deduplication; aliases/normalization.
- Codex may suggest **~3–6 relevant tags** as a flexible editorial starting point, **not** a Google SEO requirement.
- Tag relevance and taxonomy consistency matter more than count; no arbitrary keyword stuffing.
- A user's tag choices always override suggestions after review.

### Series & Collections

A named editorial series with description, language, optional cover and ordered member articles. Series appear in article metadata and in optional public preview. Can be hidden from sidebar yet remain accessible through article metadata.

### Author profiles

`displayName`, biography, avatar/media, expertise, affiliation (optional and truthful), social URLs, published articles, language, optional staff account link. Do not fabricate credentials or affiliations.

---

## 9. Sources & Scientific Integrity

### Per-article source list

Fields: source title, author names, journal, publication year, DOI, canonical URL, source type, access date, verification status, notes, linked claim/section.

Statuses: `Unverified`, `Verified (metadata)`, `URL checked`, `Needs review`, `Broken URL`—only use verified states after an actual successful check. DOI syntax validation is **not** external DOI registration verification. A successful HTTP status is **not** proof that the cited source supports a claim.

### Quality checks

- Detect malformed URLs and `javascript:`/unsafe link protocols.
- Distinguish URL reachability from scientific source reliability/claim support.
- Identify unsupported scientific claims as editorial review notes, not automatically delete them.
- Deduplicate source URLs/DOIs and show possible contradictions.
- Present source links and original article text side by side for editing when possible.
- Never invent DOI, journal, scientist, author, study finding, statistics, or quotation.
- **Outbound editorial sources:** ordinary crawlable links permitted. Don't default every external editorial link to `nofollow`.
- Sponsored and user-generated links receive correct `rel` attributes in applicable contexts; external links opening in new tabs use `rel="noopener noreferrer"` for safety.

### Prototype fallback

Without network connectivity or configured providers, perform deterministic offline syntax and duplication checks only; label `External verification not run`. A Sources section must not claim scholarly validation based on local string checks.

---

## 10. Smart Knowledge Links — Signature Feature

### Desired reader experience

In a public preview/article, selected terms appear as ordinary readable linked text (subtle blue/teal underline). **Hover** on desktop or **focus** by keyboard opens a compact popover in place, showing:

- Exact linked concept title (e.g. **Quantum entanglement**).
- A succinct, faithful intro/summary of the linked page (and optional thumbnail when licensing/policy permits).
- Source label and `Read on Wikipedia` external link, opening a new tab.
- If an authoritative relevant ScientificRadar article exists, prefer an **internal article preview** instead of Wikipedia.

Mobile: tap term to show the popover; the card includes a separate link to open the destination. No hover-only essential functionality. Dismiss by Escape, outside click, or close button. Keep hover card open when pointer moves to it. Prevent clipping at viewport edges, minimize layout shift, avoid excessive animations.

### Suggested linking workflow

- Codex (when connected) **suggests**, never bulk-inserts without review, which less-common scientific concepts merit explanation.
- First check relevant ScientificRadar internal pages; then valid Wikipedia article for the correct concept and language; then omit if ambiguous.
- Do not link every technical word or every repetition. Prefer the first contextually meaningful occurrence. Avoid ambiguous terms, missing Wikipedia pages, and junk link networks.
- Store `term`, `targetType`, `targetUrl`/`targetRecordId`, `locale`, `previewTitle`, `previewExcerpt`, `thumbnail`, `sourceAttribution`, `reviewStatus`.
- A hover summary is *educational context*, not a citation establishing scientific evidence.
- Optionally prefetch/populate a server-side cached summary on save or hover to avoid one request per link on page load. Apply rate limits, TTL, attribution and applicable Wikimedia API policies.
- Only allow trusted internal routes or validated Wikimedia HTTPS hosts in automatically generated knowledge links; allow approved external editorial links separately.
- **Never** take HTML from a third-party API and inject it into the page without sanitization.

### Preview interaction implementation sketch

```tsx
// Conceptual pattern only: use an accessible Popover/HoverCard primitive.
<KnowledgeLink
  term="quantum entanglement"
  href="https://en.wikipedia.org/wiki/Quantum_entanglement"
  preview={{
    title: 'Quantum entanglement',
    excerpt: 'A quantum phenomenon involving correlations between systems.',
    source: 'Wikipedia',
  }}
  external
/>
```

The displayed excerpt above is **illustrative**, not a replacement for a fetched and attributed live Wikipedia summary. Provide a visible `Demo preview` indication if using sample content.

---

## 11. Media Library, Cloudflare R2 & Automated Images

### Goals

An editor uploads an image **once**. The system selects appropriate responsive sizes and format by usage context; the editor does **not** manually resize every file. The image keeps attribution, licensing, alt text, and scientific integrity.

### Media item fields

`id`, original file key, URL/location, MIME, width, height, byte size, media kind (`photograph`, `scientific_figure`, `chart`, `diagram`, `screenshot`, `illustration`), caption, altText, credit, sourceUrl, licence, focalPoint, createdBy, createdAt, usage references, status.

### Required behaviors

1. Media Library grid/list, search, upload, media detail/edit, select-in-article.
2. File upload validates type/size and prevents executable/SVG injection paths; process files server-side where necessary.
3. Retain original in **Cloudflare R2 Standard** in future production. Never overwrite originals when making variants.
4. Cloudflare Image Transformations serves responsive variants from originals when configured. Define a **small finite preset set** (e.g. hero 1600×900, article max 1200w, card 640×360, thumb 320×180); real sizes should follow public templates and be tuned empirically.
5. For modern browsers use a negotiated optimal format (`format=auto` where supported); do **not** force WebP exclusively if AVIF is suitable. Preserve fallbacks.
6. Photo crop: `cover` with editable focal point/auto gravity, but allow manual override.
7. Scientific figure/chart/microscopy/graphs: default **contain/scale-down**, no destructive cropping, preserve labels and axes, no fabricated content or AI repainting.
8. Inline controls: `Auto Layout`, `Manual Layout`, `Lock Position`. Locks prevent assistants and reflow suggestions from changing that placement.
9. Layout recommendation may consider section headings and adjacent paragraphs; never assume the system can understand scientific content without review.
10. Alt text suggestions must accurately describe visible information and avoid invented claims. Credit/licence may be required before live publication.
11. Lazy-load below-fold images with width/height/aspect ratio to reduce cumulative layout shift; prioritize relevant hero image.
12. Unconfigured demo uses image files or local object URLs with actual visible CRUD and labels `Local demo storage`—not a pretend R2 upload.

### Important quota/cost constraints (verify immediately before launch)

- Cloudflare R2 Standard free allowance currently includes 10 GB-month of storage, 1 million Class A, and 10 million Class B requests monthly; do not assume unlimited storage.
- Cloudflare Images Free currently includes 5,000 **unique transformations/month**, not unlimited distinct image-size URLs. Exceeding free quota can cause new transforms to fail; design graceful fallbacks and observability.
- R2 storage and Cloudflare Images storage are distinct products; the prototype chooses **R2 + transformations of externally stored images**, not paid Cloudflare Images storage.
- Read current official pricing before enabling billing.

### Image output example (not a working live URL)

```html
<img
  src="/media/ARTICLE_IMAGE_ID?preset=article"
  srcset="/media/ARTICLE_IMAGE_ID?preset=card 640w, /media/ARTICLE_IMAGE_ID?preset=article 1200w"
  sizes="(max-width: 768px) 100vw, 900px"
  width="1200" height="675" loading="lazy"
  alt="A descriptive, verified caption"
/>
```

Route handlers need robust caching and a secured image origin/proxy in production; do not blindly concatenate arbitrary remote URLs into an image transformation endpoint.

---

## 12. Codex Assistant — Editorial Finishing, NOT Content Generation

### Philosophy

The user authors the article, then clicks `Prepare with Codex`. Codex's job is **polish, checks and metadata**, not content creation. The AI drawer must feel optional. The app remains useful without Codex connected.

### Assistant checklist

- [x] **Format Article:** heading levels H2/H3, punctuation, spacing, paragraphs, appropriate bold/italic, lists, quotes, existing links.
- [x] **Optimize Images:** suggest position, display size, photo crop/focal point, alt text, caption, source/credit; respect `Lock Position` and scientific-image non-crop rules.
- [x] **Optimize for SEO:** metadata title, description, slug review, canonical/hreflang suggestions, related internal links, meaningful tags (flexible 3–6 starting suggestion), structured article data review.
- [x] **Check Sources & Links:** syntactic and actual checks when network available, DOI metadata when configured, broken links, duplicate sources, source-to-claim caution flags.
- [x] **Smart Knowledge Links:** selective terms, Wikipedia/internal link targets and hover previews.

### Contract for proposed changes

- Assistant receives **article snapshot and structured metadata**, no production credentials or arbitrary application filesystem.
- Returns structured **change proposals**: field-level replacements, Tiptap node transformations, link insertions, media placement suggestions, annotations, warnings, confidence/explanations.
- Categorize proposals: `Mechanical`, `Metadata`, `Editorial review required`, `Unable to verify`.
- Present side-by-side/inline **Review Changes** with before/after and individual Accept/Reject, Select all safe changes, Reject all, Re-run selection.
- On acceptance, save a **new version**; original is recoverable, Undo/Restore supported, publish remains separate.
- Avoid blind entire-body replacement; prefer anchored node-level edits to reduce accidental content loss.
- If editor changed after AI request was sent, detect version conflict and refuse stale patch; offer rebase/re-run.
- **Never silently change scientific statements, terms with scientific significance, data, units, causal claims, cited quotations, or statistical outcomes.** Flag ambiguous corrections.
- Do not remove an allegedly 'unnecessary' paragraph; removing whitespace/duplicate tags is okay when reviewed.
- Never generate citations/DOIs or assert factual verification that didn't occur.
- Allow user to write supplemental plain-language instructions, still subject to safety restrictions.

### Core interaction

```text
Paste/enter article -> Save Draft -> Prepare with Codex
 -> Select checks -> Run (if connected)
 -> Structured findings + diff -> Accept selected changes
 -> New version saved -> Preview -> Submit/Publish separately
```

### Codex integration constraints

- **Prototype phase:** show assistant UI, checklist, and a **deterministic local proof-of-concept** for structural checks (e.g. duplicate tags, unsafe URLs, missing alt). Label results `Local checks (not Codex)`. `Connect Codex` shows honest `Not configured` state; do not fake a model conversation.
- **Later local/private phase:** evaluate official Codex app-server/SDK and supported sign-in flows. CLI `codex login --device-auth` is for an authorized local environment; DO NOT copy the user's historical `/private/tmp/...` CODEX_HOME or SQLite paths or access existing local tokens.
- **Later hosted phase:** only use an explicitly supported Sign in with ChatGPT/OAuth integration with appropriate partner eligibility and subscription-sharing permissions where available. ChatGPT login identity alone does not grant inference usage. Verify availability rather than claiming it.
- App-server may require a **persistent authenticated service/worker**, not just short-lived Next.js serverless functions. Expose a clean `AssistantProvider` interface so transport can change later.
- Do not use unofficial token scraping, reverse-engineered private endpoints, shared host session files or an API key by default; user prefers ChatGPT plan where properly supported.
- Server must validate user, article access, input size, allowed operations, scopes, rate limits, and audit all accepted edits.

### Proposed interfaces (TypeScript-level, illustrative)

```ts
type ChangeCategory = 'mechanical' | 'metadata' | 'editorial' | 'unverified';
type AssistantTask = 'format' | 'images' | 'seo' | 'sources' | 'knowledge';

interface EditorialChange {
  id: string;
  articleId: string;
  baseVersion: number;
  category: ChangeCategory;
  targetPath: string;       // field path or stable Tiptap node ID
  before: unknown;
  after: unknown;
  reason: string;
  requiresApproval: true;
}

interface EditorialAssistant {
  status(): Promise<'connected' | 'disconnected' | 'unavailable'>;
  review(articleId: string, tasks: AssistantTask[], instructions?: string): Promise<EditorialChange[]>;
}
```

Do not accept arbitrary `targetPath` writes on the server; validate every patch against a schema and allowlist.

---

## 13. SEO & Publishing Quality

### In-editor SEO inspector

- SEO title, meta description, slug, canonical, status, social preview, alt text, article type, relevant internal links and source health.
- Show sensible guidance, **not a fake numerical ranking guarantee**. No automatic search ranking promises.
- H1 derives from article title; headings in body H2/H3 only.
- Missing/duplicate/ambiguous titles and meta summaries flagged.
- Tags are for editorial taxonomy; `<meta name="keywords">` is **not** a Google ranking requirement.
- Use proper semantic headings, link text and responsive images.
- `noindex` for admin, preview and unpublished routes; any live public URLs require deliberate indexability decisions.

### Public integration later

- `Article`/`NewsArticle` JSON-LD fields only when data verified and appropriate; valid author/organization names, dates, images.
- Sitemap/robots and indexability only in the real public frontend integration—not by toggling flags in a disconnected admin demo.
- English and Turkish versions may be linked; add hreflang only if actual alternate URLs exist.
- Publishing slugs should retain redirects on change after live publication, not create broken links.
- Copyright/license of media and third-party snippets must be retained.

### Internal/external links

- Prefer relevant ScientificRadar internal links when beneficial.
- External Wikipedia links can open new tab with `target="_blank" rel="noopener noreferrer"`; don't automatically add `nofollow` to editorial links.
- Sponsored placements use appropriate `rel` and consent/policy logic.
- Validate unsafe schemes, dangling internal routes and duplicate knowledge links.

---

## 14. Editorial Workflow, Versioning & Access Control

### Review Queue

- Compact list by status, assigned editor/reviewer, comments, author, modified time.
- Review action `Approve`, `Request revision`, `Return to draft` permission-controlled.
- Review note/context recorded; author receives in-app notice in future phase.
- P0 demo can simulate team roles from an explicit role switcher **labeled Demo**; don't claim secure roles without backend enforcement.

### Publishing Calendar

- Month/week/list views as needed; minimal P0 calendar, richer DnD later.
- Drafts scheduled via `scheduledAt`; reschedule updates record and visible calendar; schedule cannot be set in the past without warning.
- Already published articles cannot be silently dragged to new publication dates.

### Version history

- Autosaves not necessarily each a full revision. Explicit snapshots at publish, review submission and accepted assistant changes.
- Restore creates a new version (never destroys past history). Version diffs show content and metadata separately.

### Production authorization (P1)

- Real authentication session managed server-side.
- Role/ownership checks must run in server actions and route handlers, not merely hidden buttons.
- CSRF/session protections, secure cookies, safe redirects, rate limits and audit logs.
- Least privilege for connections; no production integration keys on preview instances.

---

## 15. Google Services & Integrations (Under Settings, NOT Main Navigation)

Settings → Integrations has individual cards showing `Not connected`, `Configured`, `Error`, `Test connection` with truthful health checks.

| Integration | Intended future use | P0 behavior |
|---|---|---|
| Google AdSense | Display publisher ads on public website; define automatic/excluded placements | Settings card only; no real ads in admin |
| Google Analytics 4 | Page/content metrics via proper measurement | Disconnected card; dashboard uses editorial records only |
| Search Console | Query and index/performance overview | Disconnected card |
| Google Tag Manager | Measurement/container integration | Disconnected card |
| Cloudflare R2 | Media object storage | Local media adapter with future config form |
| Cloudflare Image Transformations | Automatic image variants | Preset preview; not pretend live transformation |
| Codex | Editorial finishing tasks | Disconnected adapter + local deterministic checks |

Distinguish **Google AdSense** (publisher monetization) from **Google Ads** (advertiser buying ads). No paid advertising CRM or Google Ads campaign management in this product.

For future public deployment follow consent management for relevant regions, respect Content Security Policy and security needs, avoid duplicate trackers, and test performance/CLS. Ad placements should never obstruct editing or reading. Preview can show labeled sample ad placeholders without loading ad scripts.

---

## 16. Data Models, State & Services

### Suggested normalized data model

```ts
type Locale = 'en' | 'tr';
type ArticleStatus =
  | 'idea' | 'draft' | 'in_review' | 'revision_requested'
  | 'approved' | 'scheduled' | 'published' | 'archived';

type MediaKind = 'photograph' | 'scientific_figure' | 'chart' | 'diagram' | 'screenshot' | 'illustration';
type MediaLayout = 'auto' | 'manual' | 'locked';

interface Article {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  summary: string;
  body: Record<string, unknown>; // Tiptap JSON
  status: ArticleStatus;
  primaryCategoryId?: string;
  categoryIds: string[];
  tagIds: string[];
  authorId?: string;
  sourceIds: string[];
  featuredMediaId?: string;
  seo: { title?: string; description?: string; canonical?: string; noindex?: boolean };
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface EditorialPage {
  id: string;
  title: string;
  slug: string;
  locale: Locale;
  body: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  template: 'standard' | 'policy' | 'landing';
  seo: { title?: string; description?: string; noindex?: boolean };
  updatedAt: string;
}

interface MediaAsset {
  id: string;
  filename: string;
  kind: MediaKind;
  src: string;
  mime: string;
  width: number;
  height: number;
  altText: string;
  caption?: string;
  credit?: string;
  licence?: string;
  sourceUrl?: string;
  layout: MediaLayout;
  focalPoint?: { x: number; y: number };
  createdAt: string;
}

interface ArticleRevision {
  id: string;
  articleId: string;
  version: number;
  snapshot: Article;
  source: 'editor' | 'assistant_review' | 'review' | 'publish' | 'restore';
  createdAt: string;
  summary?: string;
}
```

Further models: `Category`, `Tag`, `Source`, `KnowledgeLink`, `AuthorProfile`, `Series`, `Menu`, `MenuItem`, `HomepageBlock`, `ReviewNote`, `NavigationPreference`, `AuditEvent`, `IntegrationConnection` (no plain credentials).

### Persistence

**P0:** `ContentRepository` interface with a browser-side IndexedDB adapter (e.g. maintained `idb` helper), seeded records, deterministic IDs, and export/import JSON for backup. Memory fallback is allowed only with a visible warning when browser persistence unavailable. Avoid storing large binary media directly in localStorage. No fake database API responses. **Never** misrepresent local demo persistence as multi-user/production-grade storage.

**P1:** PostgreSQL with a migration layer and server repository implementation. Keep UI/API interfaces independent of whether adapter is `indexeddb` or `postgres`; do not hard-code browser storage calls throughout components.

### Service boundaries

```text
App UI (Next.js App Router)
  -> ContentRepository (Articles, Pages, Categories, Tags, Authors, Sources)
  -> MediaService (local demo -> R2 adapter)
  -> KnowledgePreviewService (local demo -> safe cached Wikimedia adapter)
  -> AssistantProvider (local structural checks -> official supported Codex adapter)
  -> PublishingService (demo state -> future public site publisher)
  -> IntegrationsService (disconnected states -> permissioned Google connectors)
```

Do not over-engineer microservices now. Service boundaries can be TypeScript modules/interfaces.

### Suggested code organization

```text
src/
  app/
    (admin)/dashboard/page.tsx
    (admin)/articles/page.tsx
    (admin)/articles/new/page.tsx
    (admin)/articles/[id]/edit/page.tsx
    (admin)/articles/[id]/preview/page.tsx
    (admin)/pages/page.tsx
    (admin)/categories/page.tsx
    (admin)/media/page.tsx
    (admin)/review/page.tsx
    (admin)/calendar/page.tsx
    (admin)/settings/navigation/page.tsx
    (admin)/settings/integrations/page.tsx
  components/
    layout/
    editorial/
    editor/
    media/
    knowledge/
    assistant/
    ui/
  domain/
    article.ts
    page.ts
    taxonomy.ts
    media.ts
    review.ts
  services/
    content-repository.ts
    media-service.ts
    knowledge-preview.ts
    assistant-provider.ts
    publishing-service.ts
  repositories/
    indexeddb/
    seed/
  lib/
    validation.ts
    urls.ts
    seo.ts
    sanitize.ts
  tests/
    unit/
    integration/
    e2e/
  styles/
docs/
  SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md
README.md
.env.example
```

File paths illustrate boundaries; follow the actual scaffold generated by AI Studio. Keep modules small and typed.

---

## 17. Implementation Plan & Priority Gates

### P0 — Excellent, working isolated prototype (build this FIRST)

1. Next.js app shell, navigation, visual tokens, responsive layout, light/dark mode, demo-state label.
2. Local typed data repository, 8–12 clearly illustrative articles, categories, authors, media metadata, 2–4 draft pages.
3. Functional Articles list CRUD with search/sort/filters/actions and persisted records.
4. Wide Tiptap article editor; one title/H1; body H2/H3; autosave; metadata inspector; draft/preview; a few version snapshots.
5. Functional Pages list/editor/preview; Categories & Tags; basic Media Library; Home & Menus basic controls.
6. Editable show/hide sidebar preferences persisted locally; balanced/show-all/reset.
7. Preview with realistic, interactive sample knowledge-link popover (clearly labeled if sample text).
8. Codex Assistant UI with selectable tasks; **real local deterministic checks only**, clearly disconnected Codex provider. Diff/Review UI for local checks; no fake AI call.
9. Minimal Dashboard, Review Queue and publication calendar using actual demo records.
10. Settings → Integrations showing truthful states and future required setup.
11. Keyboard/accessibility/responsive smoke tests, README, `.env.example`, GitHub-friendly project structure.

**P0 acceptance gate:** All P0 functionality works without billing, keys, OAuth, remote data or website changes. Every visible enabled control is functional or transparently labeled unavailable. No fake external service checks.

### P1 — Persistent production-capable backend, only after user approval

- PostgreSQL migrations, real auth/RBAC, audit trail, server-side validation, version history, content/preview protection.
- Actual R2 uploads and transformations via server-signed operations.
- Real integration-enabled Wikimedia preview service with cache and attribution.
- True automated link/DOI metadata checks, with verified provenance and failure paths.
- Page/homepage publication adapters only after public website architecture review.
- Expanded review workflows, notices, media rights rules.

### P2 — Authorized AI & publishing integrations, separate approval

- Supported Codex sign-in/plan-sharing integration or authorized alternative; assistant job engine, structured proposals, server-side guardrails, approval workflow.
- GA4, GSC, AdSense, GTM where credentials/permission are explicitly granted.
- Public website delivery or migration, canonical/redirect planning, staged verification, explicit release/rollback.

### Do not attempt in initial AI Studio run

Production DNS changes, connecting real site, Codex login using historical session paths, charging cloud accounts, Google Ads campaigns, creating fictitious traffic, full multi-tenant architecture, automatic research article writing, hidden publication by AI, or installing multiple competing CMS frameworks together.

---

## 18. Acceptance Tests & Definition of Done

Each test should be automated where practical (Vitest/Testing Library + Playwright), otherwise documented as a reproducible manual check. For P0, no test requires production credentials.

| ID | Test | Expected result |
|---|---|---|
| AT-01 | Open app on desktop | Clean sidebar, topbar, dashboard, no commerce labels |
| AT-02 | Hide `Series & Collections` in Settings | It disappears from sidebar but records remain accessible; persists on refresh |
| AT-03 | Reset navigation | Balanced preset restored |
| AT-04 | Create new article, enter title/body, save | Appears in Articles list and survives reload |
| AT-05 | Paste Markdown with `#`, `##` and `###` | Title is its own H1; body never renders a second H1; intended H2/H3 preserved or safely proposed |
| AT-06 | Paste rich text from another site | Scripts/event handlers removed; formatting retained where safe |
| AT-07 | Open draft preview | Exact draft content rendered; `Noindex — demo preview` guard present |
| AT-08 | Edit article then navigate away mid-save | Clear unsaved/change/error state; no silent loss |
| AT-09 | Duplicate article | New record and unique slug; original unchanged |
| AT-10 | Toggle article status via permitted demo controls | Dashboard and lists update; no real public publishing |
| AT-11 | Add a category and tag | Available in editor selectors, no code changes |
| AT-12 | Add a new static page | Page appears and preview works |
| AT-13 | Change homepage featured article/menu | Local preview responds and reload persists |
| AT-14 | Open Wikipedia knowledge link with mouse hover | Readable popover appears without navigation |
| AT-15 | Tab/focus and press Escape | Popover keyboard-accessible and dismissible |
| AT-16 | Tap knowledge link on mobile | Touch popover and separate external action accessible |
| AT-17 | External links | Open new tab safely; editorial outbound link not blanket nofollow |
| AT-18 | Upload/add media in demo | Library item appears with actual local state; Cloudflare not falsely marked connected |
| AT-19 | Scientific figure Auto Layout | No destructive crop by default; can lock placement |
| AT-20 | Format Article local check | Lists real detected H1/duplicate-tag/alt issues; no fabricated AI response |
| AT-21 | Review Changes accept/reject | Only selected changes apply; version recorded; restore available |
| AT-22 | Try to use unconfigured Codex | Clear integration state; no false ChatGPT session/usage claim |
| AT-23 | Click Google integrations in demo | Disconnected setup cards, no fake analytics/ads data |
| AT-24 | Change EN/TR content locale | Record locale changes, no fabricated automatic translation |
| AT-25 | Inspect responsive editor | Desktop wide editor; tablet/phone controls accessible, no horizontal overflow |
| AT-26 | Inject unsafe HTML / javascript URL | Sanitized or rejected |
| AT-27 | Build and run tests | Typecheck, lint, basic unit/e2e tests, production build pass |
| AT-28 | Export to GitHub | Source, README, spec, license/dependency metadata and no secrets committed |

### Test tool expectations

- `npm run dev` starts the app.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` are defined and pass or clearly document build-mode tool limitations.
- E2E test runner (e.g., Playwright) covers creation/edit/save/preview/navigation and knowledge popovers when supported by environment.
- Inspect error states and empty states, not only successful seeded records.

### Definition of DONE for the AI Studio prototype

A visitor to the preview can **create and edit an article, manage basic metadata, view readable article preview, see an interactive Wikipedia-style hover card, hide/show menus, create a page, change category/tag, and reopen data after refresh**. The project exports a consistent Next.js repo without real production connections, and future integrations are honestly marked not yet connected.

---

## 19. Six-Cycle Iterative Refinement — Design Review Record

This section captures the six rounds used to refine user-requested features and eliminate weak implementations. **Do not regenerate feature creep from the rejected ideas.**

### Cycle 1 — Intent and audience
- Inputs: science publication, daily article workflow, user authors articles, avoid sales/CRM.
- Risk identified: generic admin template instead of useful CMS.
- Refinement: article-first navigation, writer's surface central, publication-centric dashboard.

### Cycle 2 — Experience and information architecture
- Inputs: previous approved Filament-like editor screenshot, preference for wider central canvas, balanced customizable menu.
- Risk: menus too sparse vs overloaded; editor squeezed by side panels.
- Refinement: configurable grouped sidebar, adaptable inspector, overlay Codex drawer, default balanced layout.

### Cycle 3 — Editorial integrity and assistant role
- Inputs: user pastes already authored scientific text; Codex only finishes and checks.
- Risk: AI accidentally rewrites science, deletes paragraphs, invents sources.
- Refinement: proposal/diff workflow, node-level patches, source checks with provenance, no automatic publication.

### Cycle 4 — Reader value, SEO and knowledge linking
- Inputs: Wikipedia hover-style concept cards, informative links, tags, source/DOI checks.
- Risk: spammy internal links, inaccurate summaries, SEO misconceptions.
- Refinement: selective verified knowledge targets, internal-first linking, accessible tooltip, metadata rather than ranking guarantees.

### Cycle 5 — Media and operations cost
- Inputs: zero-manual-resize preference, Cloudflare free tier, suitable auto-placement, image locking.
- Risk: crop scientific figures, transform quota exhaustion, false CDN claims.
- Refinement: original preserved, finite responsive presets, image-type crop policies, accurate integration states.

### Cycle 6 — Engineering feasibility and release safety
- Inputs: Google AI Studio Next.js, eventual GitHub export, ChatGPT-plan Codex preference.
- Risk: overambitious one-shot implementation, brittle login hacks, inadvertent production deployment.
- Refinement: build P0 first, isolate adapters, verify independently, defer live credentials/integrations to explicit follow-up.

**Final outcome:** One coherent, modular, science-editorial CMS prototype with an excellent article editing experience, not a bundle of unrelated dashboard widgets. Future features are planned and extensible, but *only implemented features may claim to work*.

---

## 20. Implementation Agent Final Checklist & Handoff

Before returning a result:

- [ ] Read the whole spec and note conflicts/uncertainties without altering confirmed intent.
- [ ] Confirm generated project uses **Next.js App Router** and TypeScript, not a React-only Vite SPA.
- [ ] Ensure no real scientificradar.com website changes or data imports.
- [ ] Deliver working P0 CRUD, editor, preview and per-user demo navigation preferences.
- [ ] Implement only legitimate local checks when Codex isn't connected; label live integrations disconnected.
- [ ] Ensure H1 exactly once and body headings limited to H2/H3.
- [ ] Show one interactive Wikipedia-like hover preview, and accessible keyboard/mobile variants.
- [ ] Include dedicated `Pages` and `Homepage & Menus` areas.
- [ ] Distinguish P0 demo and future P1/P2 integrations in UI and README.
- [ ] Add unit/e2e coverage for critical interactions and production build verification.
- [ ] Produce a final completion report: routes implemented; working features; limitations; tests actually run; next steps; explicit statement `Production website unchanged`.

---

## 21. Official Documentation Links for Implementation Verification

These are grounding references, not instructions to fetch paid assets or import unrelated admin themes:

- Google AI Studio Build Mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Next.js App Router: https://nextjs.org/docs/app
- Tiptap Next.js: https://tiptap.dev/docs/editor/getting-started/install/nextjs
- Tiptap heading levels: https://tiptap.dev/docs/editor/extensions/nodes/heading
- shadcn/ui: https://ui.shadcn.com/docs
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Images pricing: https://developers.cloudflare.com/images/pricing/
- Cloudflare Images transformations: https://developers.cloudflare.com/images/transform-images/
- Wikimedia page summaries: https://www.mediawiki.org/wiki/Page_Content_Service
- Wikipedia Page Previews: https://www.mediawiki.org/wiki/Extension:Popups
- Google Search Central link best practices: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google Search Central article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Codex app-server: https://learn.chatgpt.com/docs/app-server
- OpenAI Sign in with ChatGPT: https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt

---

## 22. Repository Metadata

**Application:** ScientificRadar Studio  
**Repository:** `scientificradar-studio`  
**GitHub description:** A modern, AI-assisted editorial CMS for ScientificRadar, featuring rich-text editing, scientific source verification, smart knowledge links, automated media optimization, and streamlined publishing workflows.

**Suggested README tagline:** *Write science. Refine with confidence. Publish with control.*

**Owner reminder:** This is a development prototype. Export to GitHub for review and iteration before authorizing any production migration, external credential connection, subscription use or release.
