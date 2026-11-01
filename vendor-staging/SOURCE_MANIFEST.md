# ScientificRadar Studio — Compact CKEditor 49 Reference Snapshots

**Status:** INACTIVE reference files. Not installed, built, or loaded in the running ScientificRadar editor. Tiptap remains active.

## Why the staging folders are intentionally small

The previous reference-only staging contained **7,859 files**, including upstream tests, samples, screenshots, CI workflows, development helpers and extensive CKEditor test fixtures. Google AI Studio could not import the ScientificRadar repository after they were added. The exact importer error and threshold are not known, so file count and size reduction is a mitigation, **not proof of the cause**.

A one-time cleanup removed **7,808 files** from the **ScientificRadar copies only**, retaining **51 tracked vendor files, totaling 743,479 bytes** (31 CKEditor core references and 20 Math references). Neither upstream repository was altered, and Git history preserves the earlier complete staging if ever needed.

## Immutable provenance and licensing

| Local reference path | Original repository and full source | Pinned upstream commit |
| --- | --- | --- |
| `vendor-staging/ckeditor5/` | https://github.com/Centaurioun/ckeditor5 | `fc80e6091c1df4753fbbc82888bafdc6a4871f62` |
| `vendor-staging/ckeditor5-math/` | https://github.com/Centaurioun/ckeditor5-math | `6d8a39a181d1a0b233b8676eb47847c9b506ef53` |

CKEditor core: **49.0.1** with GPL/commercial terms; root `COPYING.GPL`, `LICENSE.md`, package `LICENSE.md` preserved. Math fork: CKEditor **49.0.1** compatible, ISC licensed; `LICENSE` preserved, `package.json` has `private: true`. Do not treat the Math ISC licence as overriding CKEditor core licensing, remove notices, or assume production commercial rights.

## Exactly what is included

### `vendor-staging/ckeditor5/` — 31 curated reference files

Contains root provenance/license documentation and selected *original* CKEditor 5 source files: the public `ckeditor5` entry point, core `Plugin`/`Command`, engine model/writer/conversion helpers, UI component and contextual balloon, clipboard pipeline, widget helpers, tables/captions, HTML support and source editing, plus Classic Editor and image package entry points. Each selected file retains the original content and directory path.

**This is NOT the 60-package CKEditor monorepo.** Most other package implementation files, tests, examples, lockfiles, CI workflows, large fixtures and build metadata were deliberately omitted. These 31 files are an API reference, **not a self-contained compilable copy** of the editor. For other classes/functions, inspect the original pinned commit using the upstream GitHub link above. For actual integration, prefer a compatible licensed `ckeditor5@49.0.1` runtime dependency resolved through ScientificRadar's own Bun lockfile, subject to licence requirements.

### `vendor-staging/ckeditor5-math/` — 20 working-source/reference files

Preserved the Math fork's full `src/` tree, `theme/` CSS and icon, `typings/` SVG definition, `package.json`, `ckeditor5-metadata.json`, `README.md`, `UPGRADE_49.md`, and `LICENSE`. The raw TypeScript/CSS/SVG implementation needed to build a Math bridge is available, although the sample app, original and migrated test suites, `.github/workflows`, screenshots, package-lock and legacy developer configuration were removed **from this reference snapshot**.

The complete tests remain preserved in the upstream Math repository, e.g. [49 browser regression scenarios](https://github.com/Centaurioun/ckeditor5-math/tree/6d8a39a181d1a0b233b8676eb47847c9b506ef53/tests/browser) and their successful [CKEditor 49 CI run](https://github.com/Centaurioun/ckeditor5-math/actions/runs/41348611588).

### Unchanged ScientificRadar isolation

- `tsconfig.json` excludes `vendor-staging`.
- `eslint.config.mjs` ignores `vendor-staging/**`.
- `app/globals.css` excludes `../vendor-staging` from Tailwind extraction.
- No import of `vendor-staging` occurs in live ScientificRadar code.
- No runtime activation, editor switching, migration, licence purchase, production or external connector change is performed by this cleanup.

## Next Google AI Studio integration step

After successfully importing the reduced main branch, read `docs/GOOGLE_AI_STUDIO_CKEDITOR_INTEGRATION_MISSION_2026-11-02.md` (updated for this **curated** source layout), then use the local Math implementation plus appropriately licensed CKEditor 49.0.1 runtime. **Do not assume all CKEditor implementation files or the old Math tests are present locally.**

Preserve article `bodyHtml` and compatible ProseMirror JSON, stable citation `sourceId`, figure `mediaId` and rights, raw TeX, scientific tables, revisions, IndexedDB durability and the existing Tiptap fallback. No destructive source migration or automated switch without editor-specific acceptance tests.

**Import issue diagnostic:** If Google AI Studio still fails on the reduced repository, record its exact error message, importer limit, and the file/path it rejects before further deletion. A single `git` tree with fewer files does not guarantee the importer supports every archive, pathname or third-party licence.
