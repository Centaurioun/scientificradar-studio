# Google AI Studio — ScientificRadar Web: New Standalone Reader Website v1.1 — evidence-informed

**Date:** 2026-11-02
**Mode:** NEW Google AI Studio Build app, NOT existing ScientificRadar Studio.
**Goal:** A polished working, responsive, browser-testable ScientificRadar public website first version (with honest isolated demo data until Studio publishing is connected).
**Primary spec:** Attached file SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md, version 2.1, sourced from docs/public-website/ in the existing Studio repository.
**GitHub export:** Use Google AI Studio's supported NEW repository creation/sync workflow and verify the actual resulting URL; proposed name Centaurioun/scientificradar-web. NEVER point this app at the existing Studio repository.

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

Required project report: docs/WEBSITE_BUILD_AUDIT.md in the NEW app. Include run commands, design decisions, known limitations, browser test matrix, font delivery mode, image licensing, SEO/SSR status and screenshots/evidence.

## 6. Acceptance and safe sync

Apply the blueprint's WEB-HOME-01 through WEB-PUBLISH-01 checks, with actual PASS/PARTIAL/FAIL and evidence.

Do not claim the project is connected to the existing CMS. Do not invent published article API endpoints, live newsletters, analytics metrics or cloud storage.

The owner will create/link a new GitHub repository (proposed Centaurioun/scientificradar-web) through AI Studio's GitHub sync UI when the prototype is useful. Sync ONLY to that repository. After actual export, provide its verified SHA and GitHub URL. Do not fabricate these before export. Keep ScientificRadar Studio main untouched.

Final response in Turkish: show working design, browser screenshots, functional routes and controls, stack actually used, test outcome, current gaps, font and image strategy, and verified new-repo commit only when available.

**Success:** a high-quality, interactive, original scientific magazine website prototype ready for design review, not a vague plan and not a change to the existing admin panel.

---

## 7. Priority and phase gates: BUILD, not a plan or a fake backend

Implement the owner-selected aesthetic faithfully at the level of ORIGINAL layout and hierarchy. Prioritize:
- **P0-A:** Homepage, article page, navigation and mobile responsiveness (the visual experience should be compelling on first opening).
- **P0-B:** Science reading fidelity: headings, links, figures, credits, references, tables and at least two substantive original example articles.
- **P0-C:** Search, topics, 404, responsive fixtures, working controls and accessibility.
- **P1:** Article-end author panel, section spotlights, restrained multimedia where actual demo assets exist, fine design-token tuning.
- **P2/future only:** True publication backend, Studio data sync, production SEO indexability, cloud images/ads/newsletters, analytics and real hosting.

**Do not stop when P0 is still broken.** The dashboard app is a completely separate project and must remain unchanged. The new public website must not embed CKEditor, Tiptap or a rich-text editing toolbar.

### Site appearance and demo honesty

The owner wants a genuine website experience, **not a giant visible placeholder banner or product called "Prototype"**. Name the app/site ScientificRadar. Let all navigation operate on demo articles without inventing a production backend. Keep developer documentation transparent: demo fixtures and no real publication. If a subtle demo notice is necessary, make it non-intrusive, truthful, and not a replacement for real UI.

### Verify that all attachments were actually read

Input set from the owner:
1. Refined blueprint v2.0, Markdown attachment.
2. THIS implementation mission, Markdown attachment.
3. Knowable homepage screenshot.
4. Knowable article screenshot.
5. Quanta article screenshot.
6. Optionally Codex reference-audit Markdown reports from docs/public-website/reference-audit/2026-11-02/.

If any are absent, specifically name what is absent; do not pretend the new chat retains ChatGPT image uploads, repository mounted files or previous Google AI Studio state. Proceed from what is actually supplied. If Codex reports were not yet written, the design spec remains authoritative; later research can correct measured defaults without wholesale changes.

## 8. Recommended project modules (adapt to actual framework)

Keep the architecture clear enough that a human can later move the website into a shared monorepo if desired. Do not execute that move now.

Suggested source ownership by responsibility:
- app/(public)/layout: global fonts, metadata and server shell (if Next.js).
- app/(public)/page: homepage assembled from content repository.
- app/(public)/article/[slug]/page: semantic scientific article reader with error state.
- app/(public)/topics/page and app/(public)/topics/[slug]/page: topic directory and listings.
- app/(public)/search/page: shareable query URL and accessible results.
- components/site: masthead, desktop+mobile navigation, footer.
- components/editorial: lead story, card, article header, body renderer, figure, references, author panel, related stories.
- lib/content: immutable typed mock article source behind an eventual published-content adapter.
- styles or lib/design: named tokens, theme typography.
- tests: route and interaction scripts.

Use practical equivalents in a Vite/React preview. The public website should have no editor dependency, no indexedDB publication semantics and no imported Studio source.

### Anti-degradation rules

- Do NOT render only a static screenshot instead of actual route components.
- Do NOT add fake hover elements that cannot be clicked by keyboard/touch.
- Do NOT fetch and hotlink copyrighted Knowable/Quanta articles or asset URLs for live design.
- Do NOT hide inaccessible links behind overlay elements or use arbitrary global z-index fixes.
- Do NOT claim SEO/SSR functionality when using a client-only framework.
- Do NOT assert tested LCP/INP/CLS without a real measured deployment.
- Do NOT use externally collected email addresses in a fake newsletter.
- Do NOT use an unrelated generated brand logo resembling Knowable.

## 9. Realistic end-to-end checks (document failed and skipped honestly)

| Test ID | Expected behavior |
| --- | --- |
| WEB-01 | Desktop home masthead, hero, first grid and lower modules render from typed fixtures |
| WEB-02 | Category label navigates to filtered topic landing page |
| WEB-03 | Independent chevron opens submenu; Escape closes; keyboard focus and outside click work |
| WEB-04 | Mobile menu/accordion works at 390px and 320px without overflow |
| WEB-05 | Article H1 title is unique, body contains readable long paragraphs, H2/H3 and author metadata |
| WEB-06 | Captioned figure includes accurate demo/original credits; no image distortion or missing alt |
| WEB-07 | References are actionable only if known; never synthetic DOI represented as true |
| WEB-08 | Search returns matching stories, empty state and handles accented/Turkish strings |
| WEB-09 | Topic filter, related story and footer links reach the expected URLs |
| WEB-10 | Merriweather/Inter actual font loading or clearly reported fallback; inspect network |
| WEB-11 | No HTML/JavaScript errors at desktop/tablet/mobile; screenshot review for visual hierarchy |
| WEB-12 | Safe noindex/preview semantics, separate new app, no live services or Studio writes |

For each test write observed PASS, FAIL, PARTIAL, SKIPPED and evidence details into docs/WEBSITE_BUILD_AUDIT.md; don't merely enumerate planned tests.

## 10. Six-cycle iterative refinement (run on the ACTUAL new build)

After initial implementation, use six review/refinement cycles, each with an inspectable before/after assessment:
1. **Brand / aesthetics** — Compare actual site screenshots to owner references for large visual rhythm, tasteful serif typography, image positioning and editorial feel. Do not clone.
2. **Information architecture** — Navigate ALL routes, headers, categories, dropdowns, hamburger menus, search and 404.
3. **Long-read/scientific integrity** — Inspect two lengthy articles with heading hierarchy, wide figures, credits, tables, references, and narrow prose measure.
4. **Responsive accessibility** — Test 1440, 1024, 390 and 320 widths, keyboard-only flow, touch targets, focus/contrast, text zoom.
5. **Performance/security/SEO honesty** — Verify actual font/image network, bundle/build warnings, no copy-rights violations, noindex demo, safe links/HTML.
6. **Adversarial verification** — Evaluate first load, reload, missing/empty fields, long headings, zero search results, broken image fixture and absent production connections; then re-run all applicable checks.

This is not permission to claim a six-cycle PASS without a documented test run and visual evidence. Keep genuine blocked requirements explicitly listed rather than quietly changing the goalposts.

## 11. Delivery gate and order of operations

1. Read the BLUEPRINT v2.1 and this mission fully.
2. Read Codex forensic reports if supplied (measurements are evidence, not authority to copy reference code).
3. Implement the entire feasible new site in AI Studio sandbox.
4. Run six cycles and actual browser verification.
5. Show desktop and mobile screenshots from the rendered website and transparent audit.
6. Create/sync to **a different new GitHub repository** (owner says the AI Studio GitHub export can create its own new repo). Suggested Centaurioun/scientificradar-web; confirm exact resulting repo URL from provider, do NOT infer.
7. Report actual GitHub SHA and tested commit if export succeeded. Do not push the new site into Centaurioun/scientificradar-studio.
8. Stop before public deployment or production integration, awaiting later owner decision.

The desired end state is a usable public-facing website version for design evaluation with honest demo data, separate from the existing running editorial CMS.

---

## 12. Final research handoff and non-negotiable correction (2026-11-02)

Reference research **completed** in the existing ScientificRadar Studio repo at commit 690e2fc8a0f9d5cb6f0e254ee5650f5762637250, folder docs/public-website/reference-audit/2026-11-02/technical-deep-dive/. The attached blueprint **v2.1**, section 15, includes a concise evidence-aware digest; do not require direct GitHub access to all ten research files to build the new app. If those detailed Markdown/CSV files are attached as well, treat them as optional supporting evidence, not higher priority than owner decisions.

### Mandatory reading and input ordering

1. Read full owner-approved blueprint v2.1.
2. Read full mission v1.1.
3. Analyze the owner's Knowable homepage screenshot, Knowable article screenshot and Quanta article screenshot **if actually attached in THIS new AI Studio chat**. They are visual references, NOT website assets. If unavailable, use the written spec and disclose the gap, rather than pretending they were read.
4. Use measured Quanta facts from blueprint §15: desktop prose 560px, centered region 688px, optional side rails, mobile 350px prose and 20px gutters, responsive change between 540 and 600px, 320px stress overflow on reference. These are observations of ONE Quanta route, not mandatory ScientificRadar settings.
5. Knowable could not be inspected live due to Cloudflare HTTP 403. DO NOT invent its actual measured CSS or menu behavior; translate user-provided screenshots and design decisions into original ScientificRadar components.

### Technical success criteria refined by evidence

- Keep original ScientificRadar branding and high-quality Knowable-led magazine homepage, not a copied source site or a generic dashboard. **Never display the term "Prototype" as the public site brand or permanent giant banner.**
- Implement article reader with owner-selected Merriweather + Inter, initially 700px text measure and a simple internal 600px screenshot comparison (the reference's 560px is an optional benchmark). Let wide figures exceed text measure without breaking grid/overflow.
- HTML semantics: main > article, exactly one H1, natural heading order, semantic figures/captions, author/date when genuinely supplied, safe bibliographic links and no fabricated DOI or license.
- Navigation: real category link plus adjacent chevron disclosure, proper Escape/Tab/focus, keyboard/mobile. The Quanta reference menu did not close on Escape in the tested sequence: DO NOT copy that failure.
- Test viewport 1440x900, 1024x768, 390x844 and **320x700**, explicitly computing document scrollWidth versus viewport and identifying any overflow rather than hiding it globally.
- Preserve scientific content future-compatibility: Studio published snapshots will include canonical sanitized HTML, citation source IDs, figure IDs/media rights, TeX, tables and code. A simplified text-only mock article block type is fine for a design demo but MUST NOT be represented as a lossless Studio serializer. Keep a dedicated future adapter boundary, never implement an imaginary live CMS API.
- Implemented code must be runnable, linted, typechecked and browser-tested; Codex code snippets are illustrative and have NOT been tested as a complete implementation. If unable to run a browser or full Next.js under AI Studio sandbox, state which tests were NOT executed and why.
- Do not depend on being able to live-browse Knowable. Stop further third-party reverse engineering and build the original app now.

### Audit output and user-facing delivery

Create docs/WEBSITE_BUILD_AUDIT.md in the NEW website repository, with a transparent matrix of actual browser-tested route/interactions, screenshots, font network behavior, original media licensing, SEO/demo status, P0/P1 completeness, six implementation review cycles, known limitations and exact commands. It replaces an older audit filename that included the word prototype.

Let Google AI Studio create a **new** GitHub repository through its native flow if available, using proposed name ScientificRadar Web / scientificradar-web. Check resulting owner and exact URL; verify post-export commit. Keep all original Studio code unchanged. Do not deploy to the public scientificradar.com domain, Cloudflare services or live storage. The owner will review layout, typography and reading widths before later integration.

**End state: a functional reader website first version with original visual identity and clearly isolated demonstration data — not a documentation-only report, not an admin-panel rewrite, not a production publishing integration.**

