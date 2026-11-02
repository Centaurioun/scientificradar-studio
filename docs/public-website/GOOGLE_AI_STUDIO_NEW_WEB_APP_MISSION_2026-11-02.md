# Google AI Studio — ScientificRadar Web: New Isolated Public Site Prototype

**Date:** 2026-11-02
**Mode:** NEW Google AI Studio Build app, NOT existing ScientificRadar Studio.
**Goal:** A working, responsive, browser-testable public science-magazine website prototype.
**Primary spec:** docs/public-website/SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md in the existing Studio repository.
**Future GitHub repository:** Centaurioun/scientificradar-web (new, separate; owner will connect when ready).

## 0. Source and access gate

Read the ENTIRE public website blueprint attached or pasted into this NEW AI Studio conversation. Do not pretend you read it just because you received a GitHub URL. If the file is not accessible, explicitly ask the owner to upload the Markdown or paste the raw content.

Review the owner-uploaded Knowable homepage and article images as visual REFERENCES (not deployable image assets). Quanta screenshots may provide a secondary article layout reference. If images have not been attached in this AI Studio conversation, say so and proceed only from the written spec, explicitly recording the limitation.

Reference URLs:
- https://knowablemagazine.org/
- https://knowablemagazine.org/content/article/living-world/2026/why-animal-blood-comes-in-different-colors
- https://www.quantamagazine.org/how-spiders-spin-silk-dope-into-natures-toughest-material-20261028/

Do not scrape and republish articles, copyrighted photographs, logos, licensed editorial illustrations or source code. Build an original ScientificRadar interface inspired by their layout patterns.

## 1. Project isolation is mandatory

Create NEW app "ScientificRadar Web". Do not import or overwrite existing ScientificRadar Studio. Do not connect this new app's GitHub sync to Centaurioun/scientificradar-studio, and do not modify that existing repository's main branch, CMS, IndexedDB, Tiptap/CKEditor or docs during prototype implementation.

Google AI Studio Build defaults are acceptable for the first visual experiment. Prefer a runnable Next.js App Router + React + TypeScript project when sandbox proves it works. If only a React/TypeScript client-side prototype runs reliably, produce that as an explicitly TEMPORARY design prototype. Never claim client-only rendering provides final server-side article SEO. Use small, clean modular source, not a large copied CKEditor codebase.

Do not deploy to scientificradar.com, change DNS, add production auth, Cloudflare, R2, Images, Google analytics/ads, or paid API integrations.

## 2. Required working pages and interactions

Homepage "/" must feature a distinct original centered ScientificRadar wordmark, a clean category navigation row, an optional large but controlled Knowable-like story hero, three-column desktop editorial cards, responsive category spotlights, latest stories, a demo-labeled most-read panel, restrained multimedia placeholders, demo-only newsletter invitation and a useful footer.

Article page "/article/[slug]" must have centered one-and-only-one H1, category, summary/dek, byline/date, large lead image with accurate caption/credit, narrow Merriweather reading column, headings/paragraphs/quotes, at least one properly captioned figure, source links, author box, tags and related stories. Use Quanta's generous margins and Knowable's visual reading hierarchy. Keep article body about 680–720px on desktop initially; let figures extend wider when suitable.

Topics index "/topics" and topic page "/topics/[slug]" should work and show relevant filtered cards; search "/search?q=..." must find actual local demo articles and support empty results; "/about" should present original ScientificRadar mission, not copied publisher text. Handle 404 gracefully.

Desktop navigation must use separate accessible CATEGORY LINK and chevron BUTTON (submenu toggle), with keyboard use, Escape, visible focus, meaningful aria-expanded and outside-click closing. Mobile navigation must use a functional drawer/accordion; do not make hover the sole access path.

Include at least eight completely ORIGINAL DEMO story records over varied disciplines, and at least two substantive sample long-read pages with different media/heading arrangements. Mock news stories, study claims, sources, stats and subscriptions must be clearly labeled as illustration/demo; no invented real DOI or fake peer-review badges. Data should be held in a separate typed fixture/content adapter rather than hardcoded repeatedly in components.

## 3. Typography and layout direction

Merriweather Variable = editorial headings and body article text. Inter Variable = navigation, tags and metadata.

Website fonts should be self-hosted from the SAME origin. Prefer Next.js next/font/local plus legitimately licensed WOFF2 files (with OFL notices), or Next.js next/font/google which downloads fonts at build-time and self-hosts at runtime. If running a temporary stack without font assets, document a temporary system-font fallback rather than silently relying on visitor-to-Google runtime requests. Test Turkish ı/İ/ğ/Ğ/ş/Ş characters.

Choose calm neutral paper, dark ink and a restrained teal accent as editable initial CSS tokens; the owner has NOT locked exact colors, content-width or spacing values. Default editorial width around 700px; wider site container around 1320px. Maintain Quanta/Knowable whitespace, hierarchy, carefully cropped hero, and responsive figures. Preserve math glyph rendering and any KaTeX stylesheet if math is used.

Do NOT include original Knowable brand strip/logo, Quanta wordmark, third-party photos, reference-site articles or their page CSS/HTML.

## 4. UX quality and accessibility

Render at desktop 1440×900, tablet 1024×768, mobile 390×844; test all three. Avoid horizontal overflow except controlled table scrolling. Show consistent focus styles; keyboard-accessible menus; sensible mobile hit targets; meaningful figure alt/captions; functional search and navigation; low layout shift with fixed image aspect ratios. Keep visible buttons functional or mark as unavailable. If you include a "Listen" audio player, it must actually have licensed audio; otherwise omit it.

For public SEO, single H1, meaningful meta and structured content must be present where stack supports them; demo must be noindex. If using client-only rendering, plainly report missing SSR/SSG, not a fake success.

## 5. Build, test and iterate; do not stop at planning

Create actual files, launch preview and inspect real renders. Capture screenshots of the actual homepage and long-form article at desktop/mobile. Check working link navigation, separate category label/chevron behavior, Escape, mobile menu, search results/empty states and two article journeys.

Run the available lockfile install, typecheck, lint, build and browser tests; report actual commands, exit codes, tested routes, counts and unresolved problems. Don't invent PASS. Compare screenshots to the owner-provided reference screenshots to assess hierarchy, whitespace and readability; do not aim for a pixel-perfect clone.

Provide at least one first-pass visual design that can be revised through AI Studio annotations. Maintain central design tokens for easy later owner adjustments.

Required project report: docs/WEBSITE_PROTOTYPE_AUDIT.md in the NEW app. Include run commands, design decisions, known limitations, browser test matrix, font delivery mode, image licensing, SEO/SSR status and screenshots/evidence.

## 6. Acceptance and safe sync

Apply the blueprint's WEB-HOME-01 through WEB-PUBLISH-01 checks, with actual PASS/PARTIAL/FAIL and evidence.

Do not claim the project is connected to the existing CMS. Do not invent published article API endpoints, live newsletters, analytics metrics or cloud storage.

The owner will create/link a new GitHub repository (proposed Centaurioun/scientificradar-web) through AI Studio's GitHub sync UI when the prototype is useful. Sync ONLY to that repository. After actual export, provide its verified SHA and GitHub URL. Do not fabricate these before export. Keep ScientificRadar Studio main untouched.

Final response in Turkish: show working design, browser screenshots, functional routes and controls, stack actually used, test outcome, current gaps, font and image strategy, and verified new-repo commit only when available.

**Success:** a high-quality, interactive, original scientific magazine website prototype ready for design review, not a vague plan and not a change to the existing admin panel.
