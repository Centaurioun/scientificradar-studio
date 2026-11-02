# ScientificRadar Web — Studio Preview Reference Pack

**Purpose:** Supply Google AI Studio (ScientificRadar Studio application) with the *actual pinned source code* that determines the accepted ScientificRadar Web article appearance and published document contract.

This folder is read-only research material. **No application functionality is changed by the presence of the files.**

## Reading order for the Studio agent

1. `SOURCE_MANIFEST.md` — exact Web source SHA and file checksums/limits.
2. `specs/DESIGN_TOKENS.md`, `styles/globals.css.txt`, `styles/tokens.ts.txt` — approved public-reader design; scope styles to preview only.
3. `examples/EXPECTED_RENDERING.md`, `examples/published-html-en.json`, `examples/published-blocks-tr.json`, `examples/draft-not-public.json` — synthetic compatibility fixtures.
4. `specs/CONTENT_CONTRACT.md`, `content-model/types.ts.txt`, `content-model/contract-v1.ts.txt` — versioned immutable Web public snapshot, separate from Studio editable source.
5. `components/ArticleHeader.tsx.txt`, `components/ArticleReader.tsx.txt`, `components/ScientificFigure.tsx.txt`, `components/CitationList.tsx.txt`, `components/AuthorProfile.tsx.txt`, `content-model/math.ts.txt`, `content-model/sanitizer.ts.txt` — rendering/safety rules and component relations.
6. `routes/article-page.tsx.txt`, `routes/layout.tsx.txt`, `content-model/repository.ts.txt` — Web-only wiring, not components to install verbatim in Studio.
7. `tests/*.txt` — contract, sanitizer, scientific body and SEO expectations, to be adapted and extended with Studio-specific assertions.

## Why `.tsx.txt` and `.ts.txt`

Studio `tsconfig.json` includes `**/*.ts` and `**/*.tsx` by default. Adding raw Web TypeScript to `docs/` would risk compiling unrelated Web imports and breaking the Studio app. The appended `.txt` deliberately prevents TypeScript treating the sources as Studio modules while Google AI Studio can still read their content. Do not rename, import, bundle or serve them.

## Required Studio outcome

The Studio **PREVIEW**, not the Studio EDITOR shell, must closely match the current Web article reading experience across desktop, tablet and mobile. Authoring stays in Studio and preserves Tiptap/CKEditor rich text JSON, HTML, source/media records, review workflow, revisions and future real RBAC. A **versioned producer/serializer** should build `PublishedSnapshotRecordV1` payloads compatible with the pinned Web validator, without dropping unsupported scientific nodes. Draft and review content stays private/noindex. No fake production publishing claims.

**Safety:** Do not import Web `globals.css` into Studio's admin root, use the Web's in-memory fixtures as production storage, or assume anything here connects real infrastructure. Scoped preview CSS, approved font loading and a distinct Studio→Web projection layer are required.

**Design parity acceptance:** Check 1 H1; H2/H3 TOC with working anchors; citation/reference round-trip; KaTeX; figure credits and permission; table layout; Turkish `İ/ı/ğ/ş`, Unicode and sub/superscript; no mobile overflow at 320/390px; 700px default text width; no regressions in Studio sidebar/editor tools.

**Source limitation:** No screen captures were transferred, because the current connector's content API cannot produce trustworthy PNG screenshot assets for the pinned run. Follow the documented preview/screenshot procedure in `examples/EXPECTED_RENDERING.md` after Studio code has been adapted.

**Refresh:** A new Web commit does NOT automatically update this folder. Re-pin and review via a new documentation PR, updating manifest and tests.
