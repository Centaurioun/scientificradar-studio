# Blueprint v2.0 reconciliation from external evidence

**Input:** owner-approved `docs/public-website/SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md` on `origin/main` at `f88d7416505a00f3c3a41a78722af1d92364de7e`. This audit does not modify that document or override owner decisions.

| Blueprint decision | Disposition | Evidence | Priority / rationale |
|---|---|---|---|
| Knowable-inspired homepage visual direction and centered publication identity | **KEEP; external validation deferred** | BK-001–BK-004: Knowable security challenge; no layout observed | High. Do not pretend reference measurements support this decision. Revisit with a permitted accessible page or owner-supplied screenshots. |
| Knowable + Quanta narrow editorial long-read | **KEEP; UPDATE measurement note** | PW-001–PW-004: Quanta H1 760 px desktop, prose 560 px desktop/tablet, 350 px at 390, 280 px at 320 | Medium. Keep the approved 680–720 px initial ScientificRadar measure as a flexible design decision; compare to observed narrower column in the new app. Knowable side remains unverified. |
| Merriweather article body and Inter interface fonts | **KEEP** | PW-001–PW-004: Quanta body Merriweather 16/30 px, UI sample Pangram; Noe Display H1 | Medium. Evidence supports an editorial serif + distinct sans split. It does not test the owner's exact font pair. Add separate display token as an optional tweak only. |
| Figure can exceed prose measure with visible rights/credit/caption | **KEEP; make fields testable** | PW-001–PW-004: 10 `figure`s exceed 560 px on desktop; 10 have `figcaption` | High. Do not copy images. Validate ScientificRadar's own model preserves media ID, caption, credit and rights on mobile. |
| Nature-like author/source/DOI transparency where genuine | **KEEP; scope honestly** | Quanta DOM: four `doi.org` links; no DOI meta field; Nature not visited | High. DOI/link observation does not prove DOI validity or Nature practice. Keep genuine-only and no invented scholarly claims. |
| Desktop category links plus separate accessible submenu chevron; mobile accordion | **KEEP; test implementation independently** | Knowable blocked; Quanta exposes an article page menu control; one Escape attempt did not dismiss its role=menu | High. Reference interaction is not a basis to weaken approved keyboard requirements. |
| Fluid responsive media / mobile without page overflow | **KEEP; ADD 320 px regression case** | PW-001–003 no overflow; PW-004 initial width 326 vs 320, but later interaction run 320 vs 320 | Medium. Cause/state unresolved; verify target app at 320, 390, tablet and desktop. |
| Self-hosted fonts and no runtime dependency on reference CDNs | **KEEP** | Quanta font responses observed from source hosts; rights/terms not audited | High. No third-party typeface or media download/reuse. Same-origin delivery remains the owner decision. |
| Performance claims | **DEFER** | Page-scroll resource totals are incomplete; no Core Web Vitals lab was run | Medium. Do not infer LCP/INP from request totals or screenshots. |
| Nature semantic reference | **DEFER until optional dedicated pass** | Not visited | Low for this current report; blueprint semantics remain unchanged. |

## Priority changes proposed

No owner-approved requirement needs reversal. Add 320 px as a stress regression viewport and make menu Escape/focus restoration acceptance explicit in the eventual app test matrix. Keep comparison targets adjustable, especially 560 px reference prose versus 680–720 px product default. All layout claims for Knowable remain blocked rather than revised.
