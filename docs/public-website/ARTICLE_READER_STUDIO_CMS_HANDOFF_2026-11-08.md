# ScientificRadar Studio — Article Reader CMS Integration Handoff

**Updated:** 2026-11-08

**Repository model:** two independent applications and repositories, connected by the versioned Studio → Web publication snapshot contract. No monorepo or repository move is planned.

**Studio implementation PR:** [#31](https://github.com/Centaurioun/scientificradar-studio/pull/31)

**Web implementation PR:** [#58](https://github.com/Centaurioun/ScientificRadar-web/pull/58)
**Related Web reader documentation:** [PR #54](https://github.com/Centaurioun/ScientificRadar-web/pull/54)

## 1. Operational shape

- **ScientificRadar Studio** is the editorial CMS. It stores private editor drafts and revisions in a durable SQLite database when server publishing is configured, and manages authenticated users, roles, review, approval, publication, withdrawal and restoration.
- **ScientificRadar Web** consumes validated, immutable publication snapshots and renders the public article reader. It does not read Studio's private editor-draft records.
- **Framer** remains an unpublished visual design workspace. Its dated design and QA materials are research references, not runtime or publication evidence; those files and snapshots remain unchanged by this handoff update.

The normal workflow is reusable: editors create and save an article in Studio, reload/recover the candidate, submit it for review, an authorized reviewer approves it, and an owner/editor publishes the approved revision. Web then renders the approved public snapshot. Withdrawal removes that revision from public surfaces; restoration makes the approved publication visible again.

## 2. Current shared contract and editorial metadata

The current contract remains **v1.0.0**. A VNext schema transition is not needed for the capabilities verified in PRs #31 and #58. `PublishedSnapshotRecordV1` carries article identity and revision, locale, taxonomy, author/source metadata, body HTML and typed content blocks, media, SEO, and the following editorial fields:

- `relatedIds`: selected related article IDs.
- `keyConcepts`: up to three title/definition pairs, each attached to a unique existing H2 heading ID.
- `editorialNotices`: correction, retraction, and updated-information notices, with validated optional source URL and related-article link.
- Source bibliography fields include volume, issue, pages and article number as well as DOI and year.

Studio's article model and editor persist these fields. The serializer writes the article's actual `relatedIds` (it no longer emits an unconditional empty array). Before publication, the server filters related IDs to active public revisions and excludes self-links and withdrawn content. Web validates and consumes the v1.0.0 fields for the article reader and related-article surfaces. This supersedes the earlier `relatedIds: []` gap statement in this document's prior revision.

The client-side `authorizationReceipt` is not an authorization mechanism: a browser can forge it. The server publication service is the authority. It authenticates server-managed actors, enforces role checks, accepts publication only for an approved candidate revision, validates registered media-rights evidence, stores immutable publication revisions in SQLite, and applies withdrawal/restoration state. Never treat a Studio UI status or a client-supplied receipt as permission to make a revision public.

## 3. CMS and reader behavior

The existing Studio editor is the authoring interface; ordinary article creation does not require hand-coded Web pages or AI formatting. The editor supports the established Tiptap/CKEditor writing flows, scientific content and references, figures/tables, taxonomy, sources, related articles, key concepts and editorial notices. Server-side draft recovery and revision history are separate from public publication records.

The Web reader reuses the contract-backed article route and existing components for citations, related reading, key concepts, notices, figure presentation and article navigation. Search, topic/category and home surfaces use public repository methods. The public API and page adapters filter for publicly visible content; withdrawn or private revisions are not treated as published content.

The Framer proposal remains useful for visual review of concepts and interactions, but it is not evidence that a live interface behavior works. Runtime acceptance comes from source-level validation and browser/HTTP tests described below.

## 4. Verification record

### Local cross-repository lifecycle

The full local HTTP integration passed **1/1 lifecycle scenario** on the exact combined candidates:

- Studio: `b8ecce006f8cbb75f130f8bd5c6aa781741bd4ce` (PR #31 implementation plus Node 24 modernization).
- Web application code: `8583ede2648d47be963dbf7c863cf716343b9d28` (PR #58 implementation plus the empty-catalog fix used by the local integration).

The run used Node.js 24 and a temporary SQLite database over real local HTTP. It exercised save, reload/recovery, role-separated review and approval, publish, Web server-rendered article/search/topic/home/sitemap surfaces, withdrawal exclusion, and restoration. It also verified that the public response did not expose the private `editorDraft` record. Web ran in `stage-a-demo` with the Next.js development server for this HTTP integration because production mode disables the loopback HTTP test path. The production build and empty-catalog regression were checked separately; the development-server integration is not a production deployment test.

### Application checks

- Studio at `b8ecce0`: Node 24.22.2 clean frozen Bun install; RE2 native module loaded and executed; SQLite test 1/1; unit tests 88/88; TypeScript, ESLint and production build passed; browser suite 40/40 with the publishing UI flow separately passing 1/1; CKEditor development mount regression passed with zero console errors.
- Web at `8583ede2648d47be963dbf7c863cf716343b9d28`: Node 24 production build and empty-catalog regression passed as separate checks; see the integration record above for combined HTTP rendering and visibility behavior. Its child commit `9d6f0d79dfffc8cdb62330eebe02d0adf2d4c508` changes only test harness and CI isolation: a dedicated empty-catalog Playwright config/spec and its workflow step, with no application source changes.
- Hosted GitHub checks now pass on the updated PR heads: Studio #31 `b8ecce006f8cbb75f130f8bd5c6aa781741bd4ce` (CKEditor regression, test foundation, GitGuardian) and Web #58 `9d6f0d79dfffc8cdb62330eebe02d0adf2d4c508` (two responsive Playwright runs, quality, GitGuardian). The earlier implementation heads, Studio `5f0dae2c790ff9d8236ba36ee7d124e9fb75122a` and Web `7d011aef08c2456048af916cfd34101a009b2986`, also had passing checks, but they are superseded by the currently hosted heads above. The cross-repository lifecycle remains an application-code test of Studio `b8ecce0` plus Web `8583ede`; because Web `9d6f0d7` only adds test harness/CI isolation, the local lifecycle was not rerun for that test-only commit.

These are local and hosted checks for the stated revisions. They do not establish readiness on the owner's live server, real production credentials, DNS, HTTPS configuration, deployment, or live content indexing.

## 5. Design and implementation references

- [Studio Framer UX polish V2 research](../research/SCIENTIFICRADAR_STUDIO_FRAMER_UX_POLISH_V2_2026-11-08.md)
- [Studio Framer workbench six-cycle research](../research/SCIENTIFICRADAR_STUDIO_FRAMER_WORKBENCH_MVP_SIX_CYCLE_2026-11-08.md)
- [Web article reader design system](https://github.com/Centaurioun/ScientificRadar-web/blob/docs/article-reading-experience-three-phase-roadmap-20261107/docs/public-website/ARTICLE_READER_DESIGN_SYSTEM.md)
- [Web article reader CMS editorial contract](https://github.com/Centaurioun/ScientificRadar-web/blob/docs/article-reading-experience-three-phase-roadmap-20261107/docs/public-website/ARTICLE_READER_CMS_EDITORIAL_CONTRACT.md)

Keep Studio and Web changes independently reviewable and tested against the same contract. Preserve public visibility rules, scientific metadata and evidence, and backward-compatible v1.0.0 snapshot validation when evolving either application.

## 6. Scope and deployment boundary

This PR changes this handoff document only. It does not modify the Studio or Web applications, the dated Framer research/snapshots, either live site, deployment settings, DNS, HTTPS, or Cloudflare. The owner has authorized the separate application implementation PRs and the requested PR consolidation; this document is an operational record, not the source of that authorization.
