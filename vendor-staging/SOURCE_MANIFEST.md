# ScientificRadar Studio — CKEditor 5 source-reference snapshots

**Status:** INACTIVE / NO RUNTIME INTEGRATION / NOT A DEPENDENCY / NOT A PUBLISHED BUNDLE.

These snapshots are stored only to let Google AI Studio inspect the **actual original source code** of two *separate* owned forks locally. Importing the ScientificRadar main branch is intended to make both available in its workspace. Their presence must not change ScientificRadar's editor, production runtime, dependencies or stored manuscripts.

## Immutable upstream refs

| Directory | Repository | Exact pinned commit | Version / license |
| --- | --- | --- | --- |
| `vendor-staging/ckeditor5/` | https://github.com/Centaurioun/ckeditor5 | `fc80e6091c1df4753fbbc82888bafdc6a4871f62` (`master`) | CKEditor 5 **49.0.1**; core GPL/commercial terms; `COPYING.GPL`, root and package license notices preserved |
| `vendor-staging/ckeditor5-math/` | https://github.com/Centaurioun/ckeditor5-math | `6d8a39a181d1a0b233b8676eb47847c9b506ef53` (`master`; merged PR #1) | `@centaurioun/ckeditor5-math` **49.0.1-dev.0**, ISC; package `private: true`, not npm-published |

**These two directories are not connected as Git submodules.** A source snapshot does not modify the upstream forks. ScientificRadar retains its existing Tiptap 3 editor until the owner authorizes and accepts a separate, reversible integration.

## Source layout and intentionally bounded extraction

The CKEditor core fork is a substantial monorepo: observed **8,685 tracked files** across **60 packages**, approximately **165 MB** of worktree contents (excluding Git history), and approximately **685 MB** of repository size reported by GitHub including stored history. A blind full-repository copy would unnecessarily burden GitHub and AI Studio import.

The core snapshot therefore includes **all 60 CKEditor packages' relevant text-formatted source, TypeScript, JavaScript, styles, SVG, package manifests, license files, HTML/XML test fixtures, and text tests**, plus its root manifest/workspace, licensing, README, TypeScript/build configuration and types/build helpers. It excludes nonessential large binary assets, generated bundles, Git metadata/history, `node_modules`, extensive upstream manual/documentation assets, local caches and secrets. The selection is a **complete relevant text-source reference**, not a promise of a bit-for-bit full upstream monorepo or buildable standalone distribution. Recreate the full original tracked tree from the above pinned upstream commit when needed.

The Math snapshot includes **all relevant tracked project source and regression tests** from the pinned Math fork, including `src/`, `tests/`, `UPGRADE_49.md`, package manifests/lock, sample source, and ISC license; it excludes only `.git` and generated/local caches. The full original repo remains retrievable by the pinned upstream commit.

### Expected directory tree

```text
vendor-staging/
├── SOURCE_MANIFEST.md
├── ckeditor5/
│   ├── COPYING.GPL
│   ├── LICENSE.md
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── packages/
│   │   ├── ckeditor5/
│   │   ├── ckeditor5-core/
│   │   ├── ckeditor5-engine/
│   │   ├── ckeditor5-ui/
│   │   ├── ckeditor5-table/
│   │   ├── ckeditor5-image/
│   │   ├── ckeditor5-source-editing/
│   │   └── ... all other core packages ...
│   └── typings/
└── ckeditor5-math/
    ├── src/
    ├── tests/
    ├── UPGRADE_49.md
    ├── package.json
    └── LICENSE
```

## Isolation and safe integration contract

- `tsconfig.json` excludes `vendor-staging/`; `eslint.config.mjs` globally ignores it; `app/globals.css` explicitly excludes it from Tailwind 4 class extraction.
- Do **not** import these paths in live Next.js code until the future integration mission. No implicit `bun install` or `npm install` runs in these directories. No production access or secret values are embedded.
- CKEditor 5 core and Math have **separate licensing obligations**. The Math fork's ISC license does **not** remove core GPL/commercial considerations. Preserve original notices.
- Before editor replacement, prove manuscript-safe **HTML ↔ model ↔ revision ↔ IndexedDB ↔ export/import** round trips: equations/raw TeX, scientific tables, bibliography sourceId/citation numbering, figures/mediaId/rights, title-only H1, code, Unicode. Keep Tiptap rollback until owner accepts CKEditor.
- The future Google AI Studio integration mission should reference these exact local directories and the pinned upstream refs; it must not silently move the entire snapshot into a Next.js import/bundle path or rewrite existing human scientific articles.

## Snapshot verification ledger

Snapshots are copied as **tracked source** on a separate staging branch and verified against this manifest. Confirm both directories actually exist, contain expected source and license files, count all 60 packages and retain Math's CKEditor 49 upgrade evidence. After the staging commit, require a full ScientificRadar CI run on the exact staged SHA before merging to main. **Do not mark verification PASS merely because this manifest was committed.**

Reference Math test result: https://github.com/Centaurioun/ckeditor5-math/actions/runs/41348611588 (49 new Chromium scenarios passed); the 49 old CKEditor 43 test cases are preserved but were not independently executed under their old runner.

Reference source-size audit: https://github.com/Centaurioun/scientificradar-studio/actions/runs/41352555760 (filtered source-reference simulation approximately 69 MB CKEditor + 0.6 MB Math).
