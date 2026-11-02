# Implementation handoff for a new, original ScientificRadar Web

This handoff describes design decisions to test in the separately scoped AI Studio app. No application code was changed here.

## Page structure

- **Header:** original centered ScientificRadar identity; desktop science-topic links; each category remains a real link with a separate, accessible submenu button; mobile menu exposes nested categories. The Quanta page has an `open the menu` control, but this audit did not verify the owner's hybrid category interaction.
- **Homepage:** retain the owner-selected editorial lead, latest/story cards, topic spotlights, optional newsletter demo and useful footer. Knowable's real homepage could not be observed, so treat all geometry as provisional. Use original brand, original writing and verified-licensed or placeholder imagery.
- **Article:** single title H1, dek, author/date, lead figure and metadata, then readable prose, headings, figures, source links and related content. Keep body measure independently adjustable; start with the owner-approved 700 px token and compare to Quanta's 560 px observed measure.
- **Figure model:** figure may span up to the existing provisional 1100 px figure token, independently of article prose, with stable media ID, alt, caption, credit and explicit rights state.
- **Sources:** render only authentic source/DOI metadata supplied by editorial data; do not fabricate a DOI or peer-reviewed badge. Nature-like scholarly conventions remain a semantic recommendation, not a visual/site audit result.

## Responsive starting points

The reference measurement suggests testing a narrow 560 px reading column alongside the owner's 680–720 px target at 1440×900 and 1024×768. On 390×844 and 320×700, let article prose use the available inner width and verify the full page, menus, figure captions, equations and tables without page-level horizontal overflow. No breakpoint was derived from Knowable; establish it from original ScientificRadar usability checks rather than copying a third-party breakpoint.

## Interaction and verification notes

Build menu semantics from the approved blueprint: category anchor plus adjacent chevron button with `aria-expanded`/`aria-controls`, keyboard operation, Escape and click-outside behavior, visible focus, and touch accordion. Quanta's tested `role=menu` remained visible after one Escape sequence; implement and verify the desired state independently rather than reproducing that behavior. Test within original ScientificRadar components after implementation. The current audit is not evidence that any new route or interaction was built.

## Architecture and safety constraints

Follow the existing owner-approved standalone New AI Studio app / new repository plan. Do not connect Studio's IndexedDB, production publishing, authentication, analytics, ads, domain, CDN storage, DNS or live CMS. Use Next.js App Router + TypeScript if the sandbox supports the full workflow; otherwise report the prototype limitation. Keep only original demo science content and licensed/self-hosted fonts with their licenses. The Studio source-of-truth is not altered by this forensic task.
