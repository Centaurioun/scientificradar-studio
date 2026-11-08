# ScientificRadar Studio — Independent UX Audit, Framer MVP, Six-Cycle Refinement

**Date:** 2026-11-08  
**Work type:** Repo-grounded UX research, source/documentation audit, MVP brainstorming, responsive Framer prototype, six-cycle iterative critique.  
**State:** Prototype and docs for OWNER review; **not** a production implementation or a new CMS backend.  
**Production boundary:** No Studio or Web app source modification, data mutation, Framer publication, GitHub merge, or production deployment.

## 0. Executive decision

**Preserve ScientificRadar Studio's current architecture and scientific editorial strengths; improve task completion rather than redesigning a working CMS from scratch.** A science editor needs to (1) locate the next manuscript, (2) write a long scientific title/body without losing context, (3) find source/media/SEO problems and return to the exact field, (4) submit for human review, and (5) later publish through an audited, versioned Studio→Web contract. Decorative analytics, invented AI authority, and wholesale editor replacement do not help this journey.

The Framer MVP explores this through four synchronized starting pages, all using **one** self-contained code component with in-memory state:

| Surface | Framer page/node | Main interaction |
| --- | --- | --- |
| Editorial Dashboard | [Studio Workbench Lab](https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=bI7Y8B7nF&view=preview) / `bI7Y8B7nF` | Open drafts, attention reasons, review queue; live demo counts only |
| Article List | [Studio Article List Lab](https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=QTiy32Trz&view=preview) / `QTiy32Trz` | Search, status filter, clear per-row Edit; card adaptation on phone |
| Manuscript Editor | [Studio Manuscript Editor Lab](https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=AsP_1qfpL&view=preview) / `AsP_1qfpL` | Content-driven growing H1, compact writer toolbar, on-demand inspector, source/figure/quality demo |
| Review Queue | [Studio Review Queue Lab](https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=xfbLOyQTr&view=preview) / `xfbLOyQTr` | Manuscript stage + next action, role/transitions clearly demo-only |

Source/export: Framer `ScientificRadarStudioWorkbenchLab.tsx`, `codeFile/fleTX7g:default`. Exact inert snapshot: `docs/research/framer-reference/ScientificRadarStudioWorkbenchLab.tsx.txt`.

All four lab pages have 1200px/810px/390px/320px breakpoints, remain **visible=false**, **noIndex=true** and **noIndexSite=true**. A separate earlier Article CMS Template Lab exists for Key Concept/DOI field authoring; this workbench **complements it** and does not replace its scope.

## 1. Source and evidence boundary

### Read-only current `main` inspected
- `README.md`: P0 IndexedDB isolated prototype; remote DB, server RBAC, R2, Codex integration and analytics are **not connected**. Never treat these as live services.
- `components/layout/app-shell.tsx`: existing grouped sidebar, mobile navigation, command search, theme/role affordances.
- `app/dashboard/page.tsx`: counts from articles/sources/media and recent activity; do not invent traffic metrics.
- `app/articles/page.tsx`: saved editorial filters, search, locale/category filters, bulk actions and a wide table.
- `components/editor/article-workspace.tsx`: substantial Tiptap-centered manuscript editor, inspector tabs `taxonomy | sources | figures | seo | revisions`, local autosave/revision controls, audit/preview/publish UI.
- `app/review/page.tsx`: current role-checked editorial status transitions and notes.
- `app/settings/navigation/page.tsx`: Balanced/Show All/Minimal presets, widget/sidebar preferences (already present).
- `docs/SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT.md`: previous **2026-11-01** browser-captured Studio visual audit, which documented clipped long titles, dense editor toolbar, inspector space conflict, article-table row actions, duplicate demo activity and untested focus/keyboard flows.
- `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md` and earlier independent audits: preserve rich editor, scientific figure rights, explicit local/demo status, honest SEO/publish blockers and compatibility.

**Evidence distinction:** The 2026-11-01 audit contains historical AI Studio preview screenshot observations at a specific earlier commit. The new study inspected repo source and its audit plus rendered **our own Framer prototype**; it did **not** operate the current running Studio UI via a live browser. Code presence is not proof a feature works end to end today.

### Current external reference checks
- [Tiptap Custom Menus](https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus): fixed/bubble/floating editor menus are compatible with Tiptap's command API. **Do not replace Tiptap** to improve toolbar organization.
- [Sanity field groups](https://www.sanity.io/docs/studio/field-groups): organizing context fields into tabs can reduce visual overload without changing the content model. This is a comparison pattern, **not** a reason to adopt Sanity.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): 320px reflow, visible keyboard focus and obscured-focus constraints are objective QA targets; a screenshot does not certify accessibility.

### Historical high-priority findings relevant to this project
- `SRS-UXA-001`: long title clipped at narrow widths and a desktop editor state.
- `SRS-UXA-002`: toolbar width and grouping.
- `SRS-UXA-003`: inspector competes with manuscript space; existing collapse already present.
- `SRS-UXA-004`: clipped article table row actions in earlier screenshot.
- `SRS-UXA-006/007`: media insertion handoff and finding→field navigation, **unverified interaction**.
- `SRS-UXA-008/009`: mobile navigation focus and theme contrast need separate real-browser tests.

Do **not** count an old finding as newly reproduced in current Studio merely because this audit cites it.

## 2. Brainstorming: three alternative directions, critical selection

| Direction | Value | Cost/risk | Decision |
| --- | --- | --- | --- |
| **A. Completely new admin product** with a new editor/router/design system | Visually dramatic but duplicates existing Tiptap, rules, sidebar, media, taxonomy, IndexedDB and publication logic | Very high regression and scientific-integrity risk; little evidence it improves common tasks | **Reject** |
| **B. Visual polish only** (new dashboard colors/cards/charts/animations) | Low implementation effort, weak measurable editorial return | Obscures known title/toolbar/inspector problems and can create fake analytics | **Reject as primary direction** |
| **C. Incremental editorial workbench**: preserve shell, reduce writing friction, progressive inspector, visible status+next action, responsive list | Highest likely benefit to existing users, supports the shared article reader CMS contract | Moderate UI/behavior QA and cross-repo contract work later | **Select as MVP** |

Design debt to avoid: duplicate article field schemas, alternative text editor engines, fabricated provider connections, destructive format conversions, invented SEO ranking scores, AI-authoritative scientific judgments, always-open narrow inspectors, and auto-publication.

## 3. MVP scope: what is actually in Framer

### Global shell
- Existing ScientificRadar language: quiet teal on off-white, sans controls, serif manuscript titles, grouped editorial sidebar. Visible labels instead of icon-only primary navigation.
- Sidebar desktop; at tablet/phone, a navigation menu appears. The unintended extra hamburger at desktop was discovered in screenshots and corrected.
- Visual dark-mode toggle in the prototype, but **dark mode has not undergone screenshot/contrast QA**. Real Studio already has a dual theme; preserve it.
- Explicit `Framer UX lab · no real CMS data` and `in-memory demo · no publishing`. No invented revenue/performance metrics.

### Dashboard
- Only meaningful editorial counts derived from its illustrative in-memory article array.
- Three task-centric regions: continuation, requires attention and distinct recent activity. Sample records are **not claimed to be current Studio data**.
- Buttons open the relevant prototype editor/inspector/review screen. No fake route/link to nonexistent production endpoints.

### Article inventory
- Functional local search and status filter.
- On wide desktop, a table with an explicit fixed action column and wrapped long manuscript titles.
- On phones, intentionally switches to stacked cards with visible status and an `Edit manuscript` action; no silently cropped far-right controls.
- Real Studio's existing bulk actions are **not reimplemented** in Framer; production must preserve them when adopting improved narrow layouts.

### Manuscript writing
- Demonstrates 120+ character Bennu title and live `textarea.scrollHeight` resizing. Initial 320px screenshot **failed** to show the final word; the title field was changed to auto-grow, then the 320px screenshot was recaptured and the final word “System” visibly rendered.
- Main writing area receives width priority; common formatting actions remain compact and scientific insertion commands are grouped. Simple Markdown-style button behavior is a **mock**, not Tiptap.
- Article editor keeps Tiptap, source citations, figures, tables, LaTeX, undo/redo and saved revision history in the **real** implementation; nothing here replaces them.
- `Details & checks` launches a responsive inspector. The initial tablet treatment placed it after a long document and was **revised** to an on-demand fixed side drawer with explicit close, Escape and focus-restoration code. Live keyboard testing remains outstanding.
- Quality section shows the difference between a blocker (e.g. missing alt / rights approval) and an advisory (SEO text); the editor can navigate to source/figure/quality fields. “Publish · unavailable” stays disabled in Framer.
- Clicking a local figure preview records selection intent, never claims actual Media Library upload or asset insertion.

### Review / Media
- Review displays real-world editorial notions: current status, required action, review notes; clearly labels a demo role and never sends real transitions.
- Media emphasizes alt, caption, credit and rights; actual bytes, source IDs and license gates remain owned by Studio's Media Library. Figure-thumbnail visuals are CSS placeholders, **not** observational Bennu samples.

### Integration invariants
- The Studio editor is the **source of editable article metadata**. ScientificRadar Web remains a separate publishing consumer through a validated, versioned snapshot. The earlier `ARTICLE_READER_STUDIO_CMS_HANDOFF_2026-11-08.md` already documents Key Concepts, references/DOI, KnowledgeLinks, Series and `relatedIds` gap.
- This new workbench makes those fields easier to reach; it does not implement any new immutable contract, backend or live library.
- The Framer `article-workbench` + earlier `Article CMS Template Lab` should be reviewed together, not adopted as two competing production editors.

## 4. Six-cycle iterative refinement (actions and findings)

### D1 — Actual product inventory and goals
**Question:** Is a rebuild necessary?  
**Evidence:** Studio source, previous comprehensive visual audit, master/v5 documents. Existing grouped navigation, Tiptap, article filters, metadata inspector, media rights and role-based review are real code capabilities.  
**Decision:** Preserve the current system; no backend or stack rewrite. Primary goal = **article-editing task efficiency**, not visual novelty.

### D2 — Information architecture and cognitive load
**Prototype:** Task-oriented dashboard, articles, editor, review, media in a single reusable code component, with per-screen Framer canvases.  
**Critique:** An always-open inspector competes with the manuscript; generic dashboard widgets create noise.  
**Refinement:** Dashboard exposes continuation/attention, not unsourced analytics; inspector is on-demand. Existing low-frequency settings/sidebar controls stay elsewhere.

### D3 — Editor and responsive hierarchy
**Evidence:** First screenshots of 1200/810/390/320.  
**Finding:** Hamburger unexpectedly appeared even with desktop sidebar because inline styles won over initial CSS; fixed with explicit breakpoint display rules. On the articles view, phone stack preserves visible actions; table does not need a document-wide horizontal scroll.  
**Decision:** Distinguish desktop table from mobile cards; do not hide row edit behind unexplained icon-only menu.

### D4 — Progressive inspector and accessibility
**Evidence:** Source inspection after first static pass.  
**Finding:** Narrow inspector appeared *below* a long manuscript, forcing substantial scroll before a user could resolve a blocker.  
**Refinement:** Overlay right drawer on widths <=1280, close button, Esc handler, visible focus restoration, aria-controls/aria-expanded and selected inspector tabs. **Real-browser interaction remains unverified.**  
**Decision:** Keep existing desktop inspector design and adapt its presentation, not replace its business logic.

### D5 — Scientific integrity, state and publishing
**Question:** Could the prototype imply a real publish, source approval or verified analytics?  
**Finding:** Those are high-risk misrepresentations for a scientific CMS.  
**Refinement:** All demo status explicitly labeled. “Publish” disabled. DOI research sources remain distinct from editorial content, correction listed separately, image rights are a human gate, AI does not certify claims. A selected figure is only a local placeholder.  
**Decision:** Keep truth labels prominent even if visually less sleek. No real role transitions or source verification.

### D6 — End-to-end visual critique and responsive title repair
**Evidence:** Final refreshed editor screenshots at 1200, 810, 390, 320 plus dashboard/articles/review representative desktop/mobile.  
**Finding:** At 320, the long Bennu title **still clipped its last word** in the first rendered editor screenshot.  
**Repair:** Textarea height tracks its content `scrollHeight` (with cleanup-free layout effect). In the next 320px capture, title ends visibly with “System” and no deliberate truncation.  
**Remaining:** Exact DOM document overflow, input focus, mobile menu keyboard cycling, inspector focus trap/Escape, Tiptap source compatibility, live save/refresh, dark contrast and end-to-end publisher contract are **BLOCKED / NOT IMPLEMENTED**, not falsely passed.

## 5. Final static evidence index

### Workbench Dashboard
- [1200 desktop — final](https://framerusercontent.com/screenshots/on-demand/ddfaa186-1b25-4621-b5d3-4af68f354f6e.jpg)
- [390 phone — final](https://framerusercontent.com/screenshots/on-demand/98c05f05-feb2-4d7f-bf35-b1309d9d1177.jpg)

### Manuscript Editor
- [1200 desktop — final](https://framerusercontent.com/screenshots/on-demand/71ab9ee4-90b6-431c-b13c-5bb4e7846fd6.jpg)
- [810 tablet — final](https://framerusercontent.com/screenshots/on-demand/3a199559-220f-4b04-8a03-de144ac65d96.jpg)
- [390 phone — final](https://framerusercontent.com/screenshots/on-demand/3572447f-93a8-4f6d-adf6-ccffbdf7347f.jpg)
- [320 narrow — **after title fix**](https://framerusercontent.com/screenshots/on-demand/e26e504a-2898-4a1d-904b-1f4f474e1b46.jpg)

### Article list
- [1200 desktop](https://framerusercontent.com/screenshots/on-demand/de6acbcd-276e-4ed5-b4a9-b46158c37fa8.jpg)
- [390 phone](https://framerusercontent.com/screenshots/on-demand/21d4a535-53b9-4ad3-90bc-6ca1f7560f4d.jpg)
- [320 narrow](https://framerusercontent.com/screenshots/on-demand/d18a8221-38b9-42db-b58c-6a1a6f4537c7.jpg)

### Review queue
- [1200 desktop](https://framerusercontent.com/screenshots/on-demand/2f05d171-be0b-48d3-8f32-79f67908f160.jpg)
- [390 phone](https://framerusercontent.com/screenshots/on-demand/13efad9f-b30c-4eb3-b7cc-77bbbbbb879f.jpg)

The captures are **accepted visual screenshots of the Framer demo**, not a live-browser audit of current Studio itself.

## 6. Prioritized actions, value and gates

| Priority | Work item | User value | Likely effort | Product decision |
| --- | --- | --- | --- | --- |
| **P1** | Auto-growing 120+ char title and correct wrapping | High: editorial identity fully visible | Low–medium | Recommend Studio adaptation after current regression check |
| **P1** | Responsive toolbar and optional inspector drawer | High: manuscript width and focused authoring | Medium | Preserve existing Tiptap/inspector state; test keyboard and focus |
| **P1** | Article list responsive actions | High: can edit without hidden row controls | Low–medium | Adapt existing list rather than replace bulk operations |
| **P1** | Quality finding → exact field with blockers/advisories | High: faster review and scientific compliance | Medium | Keep existing audit engine/publishing gates; verify first |
| **P2** | Media Library → insert into same manuscript position | Medium-high: fewer context switches | Medium | Existing media/model should be reused; rights must travel with asset |
| **P2** | Multi-concept Article Insights workflow | High for scholarly explanatory stories | Medium–high; requires publisher vNext | Coordinate with Web article reader design contract |
| **P2** | Duplicate demo activity grouping | Medium trust improvement | Low | Only after verifying event identifiers; do not discard valid events |
| **P3** | More animations, extra dashboard graphs, new generic “AI score” | Low/negative | High distraction/security risk | Reject |
| **Release gate** | Real save/reload, review/RBAC, published Web parity | Necessary for production | High across both repos | Separate owner-approved implementation plan, never Framer alone |

### MVP acceptance tests for Codex, initially READ-ONLY
1. Reproduce actual editor H1 clipping (if still present) with a 120+ character Unicode title at **320/390/810/1200/1440**; compare screenshots and DOM `scrollWidth`, H1 display dimensions and focus.
2. Verify real toolbar actions in Tiptap do not lose undo, math, figures, tables, citation nodes or selection when the inspector closes.
3. Test existing inspector desktop collapse and tablet/mobile transition; compare proposed drawer only if current behavior actually harms workflow.
4. Test article list at 320/390 and keyboard: all Edit/bulk/row controls reachable, no document-wide unintended overflow.
5. Check source/figure/quality issue selection focuses the exact field; blocked publication is never circumvented by cosmetic UI.
6. Test keyboard-only mobile nav/drawer: Tab sequence, Escape, focus restoration, background scroll, role/aria semantics and WCAG 2.2 reflow/focus.
7. Preserve IndexedDB demo isolation, existing role-based review rules and local save-state truth. No newly fabricated provider connection.
8. Evaluate Web compatibility separately via Studio public snapshot adapter for Key Concepts, References/DOI and Related Reading.

## 7. Technical risk register

| Risk | Status | Why it matters |
| --- | --- | --- |
| The current Studio app may have moved since the 2026-11-01 audit | **Unverified** | Recheck live current main/preview before making a source PR |
| Framer Code Component compiles | **PASS** | `files.write` diagnostics were empty after layout/title revisions |
| All 4 Framer pages remain isolated/noindex | **PASS, source tree** | `visible=false` and `noIndex`/`noIndexSite` true |
| Real Framer click/search/dialog/tab/dark-state behavior | **NOT LIVE-TESTED** | Static screenshot and source are weaker evidence |
| WCAG 2.2 AA | **NOT CERTIFIED** | Requires real DOM/keyboard/screen reader/color metrics |
| Inspector drawer on 320px and modal focus trapping | **SOURCE PROTOTYPE ONLY** | Need actual keyboard and scroll checks |
| Real Studio saves and publishes CMS data to Web | **NOT IMPLEMENTED** | Prototype state is purely in memory |
| Production image/source rights | **HUMAN REVIEW GATE** | Figure credit and license metadata need independent verification |
| Dark-mode contrast | **BLOCKED** | Functional demo toggle exists but color metrics/QA not performed |

## 8. Future collaboration and governance

- **This study's Framer project is the already connected ScientificRadar project**, not a new deployed Studio website. All four new lab pages are unpublished and no-index.
- **Studio draft PR #28** is the companion docs-only CMS editor/publishing handoff. This report and the exact `.tsx.txt` Framer source snapshot are added to the same PR; do not merge.
- Public Web design reference remains [Web draft PR #54](https://github.com/Centaurioun/ScientificRadar-web/pull/54). Don't copy the reader page styles into Studio admin CSS.
- Recommended implementation order after independent Codex review: real Studio editor title and responsive behavior → list actions/quality navigation → scientific media insertion → CMS multi-concept and publication-contract changes in coordinated Studio/Web PRs.
- No owner approval for deployment, publishing, merge, source rewrite or production database migration was inferred from permission to explore Framer.

**Final verdict:** The MVP design is appropriate for owner feedback and Codex inspection; production integration and live interaction acceptance remain separate tasks.