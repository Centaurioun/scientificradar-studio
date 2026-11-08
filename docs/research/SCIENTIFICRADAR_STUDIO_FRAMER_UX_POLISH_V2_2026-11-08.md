# ScientificRadar Studio — Framer Visual UX Polish V2, Six-Cycle Review

**Date:** 2026-11-08  
**Scope:** Research, critique, visual UX prototyping, responsive screenshot inspection, docs-only handoff.  
**Status:** **Owner-review prototype, not production implementation or runtime-verified release.**  
**References:** Existing 2026-11-01 `docs/SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT.md`, Studio current `main`, Tiptap official menu documentation, W3C WAI-ARIA toolbar practices.  
**Source snapshot:** `docs/research/framer-reference/ScientificRadarStudioUXPolishLab.tsx.txt`. This is an **inert text copy** of the exact Framer code; do not import it into the Studio app.

## 1. Design decision and honest scope

**Keep the real scientific editors. Improve their visual organization.** Current Studio `components/editor/article-tiptap-editor.tsx` includes ProseMirror/Tiptap features for H2/H3, LaTeX math, inline/block equations, scientific tables, figures, citation nodes, superscript/subscript, alignment, and HTML source. Current `components/editor/article-workspace.tsx` additionally exposes a **CKEditor 5 + Math pilot** alongside Tiptap 3. Do not confuse earlier inactive staging of CKEditor code with the current source's existing pilot selection. Neither engine is reimplemented in Framer.

The Framer `textarea` is **a layout-only placeholder**, not a real rich-text editor. Buttons in the new menus demonstrate grouped discoverability; they explain they are mock controls rather than pretending to insert LaTeX or citations.

**Prohibited:** Replacing Tiptap/CKEditor, simplifying away scientific functionality, modifying scholarly HTML/figure/Math nodes, disabling publication safeguards, rewriting the Studio app with the Framer component, or claiming that demo state is saved/published.

## 2. Concrete Framer results

| Variant | Page ID | Preview |
| --- | --- | --- |
| **Editor UX Polish V2** | `usk8t_GeM` | https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=usk8t_GeM&view=preview |
| **Workbench / Dashboard V2** | `W3NmKOy5y` | https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=W3NmKOy5y&view=preview |
| **Focused Writing V2** | `y7Hd7GQZp` | https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=y7Hd7GQZp&view=preview |
| **Previous Studio baseline** (untouched) | `AsP_1qfpL` | https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=AsP_1qfpL&view=preview |

Each new variant has breakpoints 1200 / 810 / 390 / 320; `visible=false`, `noIndex=true`, `noIndexSite=true`. All reference the same code export `codeFile/iyskW8h:default` from `ScientificRadarStudioUXPolishLab.tsx`. Starting screen/focus is a Framer component property. Earlier Studio labs and original production code remain untouched.

### A. A more focused writing workspace
- Existing Studio identity/sidebar retained with restrained teal, off-white background, manuscript typography and clearly grouped navigation.
- A `Focus writing` button removes desktop sidebar and the metadata inspector **temporarily**, widening the article surface. `Exit focus` restores the workbench. Contextual source/figure/quality shortcuts intentionally exit focus before opening their inspector.
- Article title and article-body visual placeholders auto-grow with entered text: no hidden final word at 320px and no inner textarea scroll concealing a paragraph in the static demo. This is *not* a Tiptap implementation prescription; real editor layout must be measured independently.
- No fake “autosaved to server” notification. Label states **in-memory Framer preview; not saved to Studio**.

### B. Grouped science/editing menus
- **Structure:** Paragraph / H2 / H3 selector (visual layout study).
- **Text:** Bold, Italic, Link as common visible controls.
- **Science:** LaTeX inline, display equation, superscript, subscript, scientific table and HTML source in a grouped expandable menu.
- **Insert:** scientific figure, citation/DOI, Knowledge Link, table, quote/callout and math block.
- Menu content is labeled **demonstration only**; selection shows a contextual local message rather than mutating scholarly HTML.
- Escape closes the concept menu. `aria-controls` only points to a rendered menu while open; buttons expose `aria-expanded`.
- Real Studio adaptation should reuse the current editor's actual command chain, undo/redo, selection and contextual active-state logic; **do not merely paste UI labels**. WAI-ARIA's true `toolbar` pattern also requires roving keyboard focus; the Framer menu is deliberately marked as groups rather than falsely claiming a fully implemented `role=toolbar`.

### C. Quick evidence navigation
A small status strip beneath the toolbar gives direct access to:
- Two **demo** linked research records → existing sources inspector.
- Figure-rights review → existing media inspector.
- Two **demo** publication/readiness blockers → existing quality inspector.

The strip shows **illustrative data**. Production must derive actual counts from current Studio source/link and audit state, not hardcode them or bypass a blocker. Quick checks are navigation helpers, **not** a second scientific-trust scoring system.

### D. Responsive improvements
- At 1200/810, the writing area has more space and menu groups reduce toolbar line noise.
- At 390/320, the top edit actions use a clear two-column grid; core formatting stays visible and science/insertion tools remain one discoverable menu step away.
- The manuscript body placeholder grows to avoid internal clipping. The workbench sidebar folds away on tablet/mobile; a labeled mobile navigation remains available.
- The existing `Details & checks` inspector is still a separate responsive drawer with Escape/close and focus-return source behavior. Focus mode must not make it unreachable.

## 3. Six-cycle iterative design refinement

| Cycle | Question | Finding | Change / rejection |
| --- | --- | --- | --- |
| **D1 — Baseline** | Do we need a new rich-text editor? | Real Studio already implements a complex scientific authoring stack and the previous audit found **UI hierarchy** problems. | **Reject** editor replacement. Limit Framer to layout and navigation. |
| **D2 — Brainstorm / MVP** | All buttons, a hidden command palette, or grouped menus? | All-visible toolbar is crowded; only hidden commands hurt discovery. | Keep common controls visible; group specialized **Science** and **Insert** menus, test layout rather than behavior. |
| **D3 — First prototype** | Does writing have enough space? | Prior permanent inspector and long top controls compete with the manuscript. | Introduce focus layout and grouped menu bar; preserve dashboard/list/review as the same component. |
| **D4 — Responsive critique** | Can small phones reach actions without clipping? | 320/390 screenshot showed top action wrapping and body-area scroll risk. | Replace action wrapping with two-column grid; auto-grow body and title placeholders. |
| **D5 — Interaction / consistency review** | Can focus mode accidentally hide access to required evidence? | Initially quick checks could open an inspector CSS-hidden in focus mode; closed `aria-controls` targets could be missing. | Inspector shortcuts **exit focus**, menu targets become conditional, Escape handler added; source diagnostics empty. |
| **D6 — Final visual QA** | Is there a coherent visual hierarchy across sizes? | In screenshots common controls are visible; long title wraps; evidence strip and draft disclaimers distinguish content from tools; focus variant removes desktop sidebar. | Retain V2 for **owner comparison**, not production approval. Actual browser interactions/accessibility/performance still unknown. |

## 4. Final screenshot evidence (Framer static, not live browser E2E)

- [Editor desktop 1200, final](https://framerusercontent.com/screenshots/on-demand/928d8f9c-6a57-476b-a9ff-efcce7022d3e.jpg)
- [Editor tablet 810, final](https://framerusercontent.com/screenshots/on-demand/55311a1f-9865-4107-bde9-1417b17946c3.jpg)
- [Editor mobile 390, final](https://framerusercontent.com/screenshots/on-demand/0ee4a0fa-763f-46a9-a23c-e4999ff80a9a.jpg)
- [Editor narrow 320, final](https://framerusercontent.com/screenshots/on-demand/748a2238-a1bf-47ff-9b69-4172ed2e02f9.jpg)
- [Dashboard 1200](https://framerusercontent.com/screenshots/on-demand/b93af9fa-bef9-47c0-b708-56009852deb3.jpg)
- [Focused writing 1200](https://framerusercontent.com/screenshots/on-demand/c625aaeb-ea72-49df-977b-9ebc86643724.jpg)

Framer `api.files.write` returned `diagnostics=[]` after final changes. Static screenshots show no *obvious* horizontal clipping at captured sizes. Neither tool establishes DOM width parity, correct keyboard/focus behavior, contrast ratios, production article performance or scientific-node preservation.

## 5. Opportunity ranking and product judgment

| Priority | Candidate | Value | Cost/risk | Recommendation |
| --- | --- | --- | --- | --- |
| **P1** | Group current Tiptap/CKEditor toolbar without losing H2/H3, math, LaTeX, scientific table, citations, superscript/subscript | High editorial discoverability; narrower toolbar | Medium, selection/keyboard regressions possible | **Test against current production menus first**, then adopt visual grouping if genuinely better |
| **P1** | Focused writing layout with accessible exit | More manuscript space; fewer distracting panels | Low–medium; risk hiding required warnings | Introduce behind opt-in user control, never conceal release blockers |
| **P1** | Evidence/rights/quality issue deep-links in editor | Faster issue resolution; editorial integrity | Medium; requires stable exact field focus targets | Reuse existing `focusFieldById` and audit findings; do not duplicate audit engine |
| **P2** | Compact responsive toolbar/actions | Mobile reachability and title visibility | Low–medium | Validate at 320/390/810/1024/1200/1440 |
| **P2** | Harmonize Studio shell and public ScientificRadar visual identity without matching their exact typography | Consistent brand, less cognitive switching | Low–medium; contrast/localization | Reuse existing Studio tokens and theme, not copy Web article CSS |
| **P3** | Dashboards with new decorative analytics, AI quality score, auto-publish | Little proven value; can reduce trust | High | **Reject** without real data and approvals |
| **Reject** | Replace Tiptap/CKEditor with simple Framer textarea or third-party CMS | Would remove scientific fidelity and mature editor functionality | Critical | **Never treat V2 as executable editor replacement** |

**No measured user-study results, time savings, task success percentages or performance scores are asserted.** The ranking is engineering/design judgment, to be tested with real workflows.

## 6. Remaining QA / Codex handoff (read-only first)

**Critical checks before any actual Studio code change:**
1. Confirm current `main` Tiptap 3 and CKEditor 5 + Math pilot feature parity and selection/revision retention. Distinguish active pilot from inactive source staging history.
2. In a real Brave Studio session, reproduce current editor tool layout at 320, 390, 810, 1024, 1200, 1440; record actual overlap, wraps, text clipping and DOM horizontal overflow.
3. Verify that current quick actions can focus the exact source/media/quality field; use existing `focusFieldById`, not a duplicate watcher.
4. Test true keyboard/WAI toolbar behavior (Tab entry, arrow navigation if `role=toolbar`, active-state semantics, menu Escape and focus return), plus screen reader labels.
5. Test Focus Mode after an explicit implementation proposal: no lost unsaved data, no hidden critical audit/publish blocker, full keyboard return and durable preview/inspect links.
6. Verify figure/table/math/DOI/KnowledgeLink insertion, undo/redo and HTML sanitizer round-trip after any toolbar refactor. Never remove old functions merely because the Framer menu is small.
7. Test light/dark theme contrast, narrow inspector drawer, mobile nav/dialog focus trap, reduced motion, autosave behavior and one 120+ character Unicode title.
8. Coordinate any future Article Insights/Key Concepts and Sources/Related Reading data with Web PR #54 via a versioned Studio→Web publication contract. Separate owner authorization required for implementation/merge.

**Production gate:** A Framer screenshot is design evidence only. A proper Tiptap/CKEditor usability refactor must be a small, separately approved Studio app-code PR with unit/integration/E2E and scientific data preservation tests.

## 7. References and storage

- Studio `main`: `components/editor/article-tiptap-editor.tsx`, `components/editor/article-workspace.tsx`, `components/layout/app-shell.tsx`, `docs/SCIENTIFICRADAR_STUDIO_UI_UX_DESIGN_AUDIT.md`.
- W3C ARIA Authoring Practices, [Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
- Official Tiptap [Custom Menus](https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus).
- Studio companion CMS contract `docs/public-website/ARTICLE_READER_STUDIO_CMS_HANDOFF_2026-11-08.md`; Web design in [draft PR #54](https://github.com/Centaurioun/ScientificRadar-web/pull/54).

**Governance:** This artifact and the Framer snapshot are additions only to Studio docs-only draft PR #28. Current production Studio and Web app files, original Framer workbench, and content records were not modified. No branch was merged or site published.
