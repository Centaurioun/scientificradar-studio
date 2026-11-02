# ScientificRadar Web — Pinned Reference Source Manifest

**Status:** Read-only exported source, NOT Studio integration or runtime code.  
**Source repository:** https://github.com/Centaurioun/ScientificRadar-web  
**Exact source commit:** `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7` (DO NOT silently follow moving `main`).  
**Destination:** https://github.com/Centaurioun/scientificradar-studio, `docs/references/scientificradar-web/`.  
**Source contract:** `PUBLICATION_CONTRACT_VERSION = "1.0.0"`.  
**Export date:** 2026-11-03.  
**Web CI evidence:** [Quality](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384305) PASS; [Playwright](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384497) PASS, 85/85 tests from that SHA.  
**Integrity convention:** The source Git **blob SHA-1** below is the exact blob identifier returned by GitHub at the pinned commit; each destination text file must have the same Git blob SHA. This is not a SHA-256 digest or code-signing assertion.

| Original Web path | Studio relative destination | Source Git blob SHA-1 | Intended reference |
|---|---|---|---|
| `components/editorial/ArticleReader.tsx` | `components/ArticleReader.tsx.txt` | `58439ebf3d28b5cfda762bbaeeda4d6aad277dbd` | TOC, bodyHtml/blocks reader, math, citations |
| `components/editorial/ArticleHeader.tsx` | `components/ArticleHeader.tsx.txt` | `e007c3119ae601e210cd67f95467b70495a8e44f` | H1, dek and editorial byline |
| `components/editorial/ScientificFigure.tsx` | `components/ScientificFigure.tsx.txt` | `d586ceaa598f5c3e22635d92b359d4e0effdfb04` | figure, caption, media rights presentation |
| `components/editorial/CitationList.tsx` | `components/CitationList.tsx.txt` | `c97b22741cf35efcdc9fa216be3a2d9919a0e71c` | reference-list anchors and source display |
| `components/editorial/AuthorProfile.tsx` | `components/AuthorProfile.tsx.txt` | `d998db40d5be2542486ab721ec400da8d1af02e9` | author identity panel |
| `app/article/[slug]/page.tsx` | `routes/article-page.tsx.txt` | `653344ddc45f505e083001fd1f3ddf47c4aae271` | composed public article route |
| `app/layout.tsx` | `routes/layout.tsx.txt` | `cf11ecf3a9721a5117a65182d4f5a3c140f217cc` | font setup and Web-only shell |
| `lib/content/types.ts` | `content-model/types.ts.txt` | `e3b9d9ec925352401961f0e3ae560a248d37fe2f` | PublicArticle and PublishedSnapshotRecordV1 |
| `lib/content/contract-v1.ts` | `content-model/contract-v1.ts.txt` | `dbcd28eac2396c30acf6b352ef49da8e8c8a1aea` | contract validator and projection adapter |
| `lib/content/sanitizer.ts` | `content-model/sanitizer.ts.txt` | `45e7e6547e17fcfaa7536dcd4e6ddd9f98f9664f` | safe HTML, canonical headings, math/citation processing |
| `lib/content/math.ts` | `content-model/math.ts.txt` | `ad16199c9c80ffc776b3a57925a6dc9cf6aa16fb` | KaTeX rendering |
| `lib/content/repository.ts` | `content-model/repository.ts.txt` | `efe23f563e828a6826a6543942e9bbe17896568d` | demo-only repository adapter boundary |
| `lib/design/tokens.ts` | `styles/tokens.ts.txt` | `062f1a6916298fb9c2f929cb87c9d260d8864d42` | typed reading/layout design tokens |
| `app/globals.css` | `styles/globals.css.txt` | `1f338444d03b4b459938fdf24fc98adfd736d540` | Web CSS reference; NEVER globally import in Studio |
| `lib/content/contract-v1.test.ts` | `tests/contract-v1.test.ts.txt` | `eaad88925c2108495bc2994296bde67d1f707c80` | contract tests and render examples |
| `lib/content/sanitizer.security.test.ts` | `tests/sanitizer.security.test.ts.txt` | `a576c71b89d078e54d666e56341083cd2e2dbdb2` | HTML sanitizer security tests |
| `tests/e2e/scientific-content-integrity.spec.ts` | `tests/scientific-content-integrity.spec.ts.txt` | `cd7825c5abf9ac1a7848905c06d45d1abe2c07c8` | scientific E2E visual/semantic expectations |
| `tests/e2e/m1-m7-seo-and-routes.spec.ts` | `tests/m1-m7-seo-and-routes.spec.ts.txt` | `e38de69900a6792ec76f86c6c8cfdbfab087ad02` | SEO/head/noindex safety |
| `docs/design/CONTENT_CONTRACT.md` | `specs/CONTENT_CONTRACT.md` | `39a3183aba6429f7d50f5ed756f675c3c322abd9` | public snapshot contract narrative |
| `docs/design/DESIGN_TOKENS.md` | `specs/DESIGN_TOKENS.md` | `0713b52e6446bf94f82420b30cde67bd367f6e95` | approved typography and palette specs |

## Visual and editorial invariant

The **public Web reader** sets the target appearance; the Studio editor remains its own application. Preserve 700px default prose width, 600px/560px comparison options, max 880px heading width, max 1100px wide figures, Merriweather serif editorial font, Inter UI font, current teal `#15747B` and warm paper `#FAFAF8`, responsive TOC, heading hierarchy (single page H1, body H2/H3), scientific tables, formulae, source/citation anchors, and media credits.

## Dependency notes

The references are *not* standalone modules. They contain imports pointing to the Web repository, including `@/...`, Next.js App Router, KaTeX, DOMPurify, design tokens, other components and fonts. Source file dependencies need deliberate adaptation; do not paste all Web files into the Studio runtime or change Studio's whole admin CSS. `app/layout.tsx` is context for Web font settings only. `repository.ts` demonstrates fixtures, not a real Studio connection. Renderer outputs have separate HTML and block paths. Read the source tests as references, but rerun relevant adapted tests in Studio.

## Important verified limitations / unresolved questions

1. Source Web still loads `lib/content/fixtures.ts` in its runtime. No authenticated Studio publishing service or production persistent storage is live.
2. The current Web validator checks media URL and descriptive metadata but does **not visibly reject `rightsVerified === false` in `validateMediaRecord`** at this source SHA. Future Studio publish gate MUST reject unverified media rights; raise contract discrepancy before any real release.
3. `GoogleServicesGate` exists in Web, but its activation and live consent wiring were NOT included in this ref export and are not a claim of production Google integration.
4. Current Web's reader works for its supported HTML and block representations; no actual cross-repository Studio authoring payload has been round-trip tested yet.
5. No trustworthy rendered screenshot artifacts were captured in this transfer. `examples/EXPECTED_RENDERING.md` defines a visual/semantic verification checklist, NOT an actual screenshot baseline. Capture controlled desktop and mobile screenshots when Studio's preview is implemented and compare to Web at the pinned SHA.

## Example provenance

`examples/` records are **new, independently authored synthetic compatibility fixtures** matching the identified TypeScript shape; they are NOT copied from a real article, NOT Web Git blobs, and NOT automatically known to pass the real TypeScript validators until tested in Studio. None may be published or indexed as real editorial work.

## Refresh policy

Re-export only after Web code/CI review. Pin a new SHA, compare every source blob, update README and fixtures/visual checks, rerun Studio CI, then merge a reviewed documentation PR. No silent automatic synchronization.
