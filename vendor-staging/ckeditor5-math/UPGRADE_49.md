# CKEditor 5 Math fork — 49.0.1 compatibility and verification record

**Date:** 2026-11-01 (Europe/Istanbul)  
**Repository:** https://github.com/Centaurioun/ckeditor5-math  
**Pull request:** https://github.com/Centaurioun/ckeditor5-math/pull/1  
**Target:** CKEditor 5 **49.0.1** (not alpha/nightly).  
**Status at document authoring:** Integration branch tested; not yet merged. This file records bounded evidence and does not assert ScientificRadar integration or release readiness.

## Migration summary

- Modern plugin imports use the public `ckeditor5` entrypoint (NIM), replacing CKEditor 43-era deep import paths.
- Peer dependency `ckeditor5: ^49.0.1`; development test package locked to `ckeditor5: 49.0.1` in the committed npm `package-lock.json` (lockfile version 3).
- Use `npm ci --ignore-scripts --no-audit --no-fund` in CI; the obsolete CKEditor 43 `yarn.lock` was removed. A temporary workflow created the lockfile and was removed.
- TypeScript 5.9.3, ESM browser bundling and declaration compilation pass on the tested Node 22/24 CI matrix. The maintained source and licences remain in the fork; no npm publication has occurred (`private: true`).
- Direct programmatic math insertion now defaults to **span** output. The legacy `<script type="math/tex">` output and import remain explicitly supported for compatibility, but script output is not recommended for an untrusted HTML publishing boundary.
- Fix CKEditor observable binding: preserve inherited observable `Command.value`, add observable Math command display mode, and expose Math input field value through `set()` rather than a plain class field. Test editing existing math, display toggle, cancel/save and focus.
- AutoMath now listens for `ClipboardPipeline#contentInsertion` at lowest priority and uses the actual `resultRange` rather than guessing from the pre-paste selection. This fixes real CKEditor 49 paste-to-equation transformation regression; undo and multi-equation/plain-text guards are tested.
- KaTeX displays real mathematical structures with `trust: false`; malformed/untrusted macros do not create executable links or injected HTML in tested editor paths. Never claim this proves every possible TeX/HTML edge case is safe.

## Reproducible gates

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build:smoke
npm run build
npx playwright install --with-deps chromium
npm run test:browser
```

**Exact tested branch revision:** `696fa0505d937c43584232ed7b853bfbbc0235c2` (before this documentation update).

**Hosted Actions evidence:** https://github.com/Centaurioun/ckeditor5-math/actions/runs/41348381193

- Node **22**: npm ci, typecheck, browser bundle, declaration build and legacy-import path guard **PASS**; real Playwright Chromium **49/49 passed** in 50.2s.
- Node **24**: npm ci, typecheck, browser bundle, declaration build and import guard **PASS**; browser suite is intentionally Node 22-only in this workflow.
- Previous successful intermediate SHA `f863cd9aa35ce841d259053213f1a4cc674b94b3`: **32/32** Chromium behavior cases, https://github.com/Centaurioun/ckeditor5-math/actions/runs/41348211982.
- Prior red/green evidence: 19-case run at `75a7347` failed because default output was old script mode, then `e923064` ran **19/19 PASS**; 32-case run at `e9ad816` failed 3 tests for reactive UI properties and AutoMath paste; successive code repairs made those cases green. These were *real executed browser regressions*, not hypothetical defects.

### Historical CKEditor 43 suite: exact status

The historical source files remain in `tests/index.ts` (**2 original tests**), `tests/math.ts` (**6**), `tests/automath.ts` (**11**) and `tests/mathui.ts` (**30**), totaling **49 historical `it(...)` cases**. They are tied to the old package-tools/deep-import test runner, **were not directly executed** in this modern CI, and must not be described as "49 original tests passed." Their original CKEditor 43-style imports have deliberately not been silently rewritten or run under the obsolete toolchain.

Instead, we implemented and executed **49 new CKEditor 49 real-browser behavior scenarios**:

| File | Cases | Coverage families |
| --- | ---: | --- |
| `tests/browser/ckeditor49-math.spec.mjs` or earlier equivalent smoke file | 2 | CKEditor initialization, toolbar, inline/display TeX round-trip |
| `tests/browser/ckeditor49-regression.spec.mjs` | 17 | plugin registration; span/script output; edit; import from script/CKEditor 4/Quill; undo/redo; cancel; security/KaTeX |
| `tests/browser/ckeditor49-math-ui-compat.spec.mjs` | 13 | UI command bindings; display switch; enable/disable; form close; escape; AutoMath inline paste |
| `tests/browser/ckeditor49-legacy-coverage.spec.mjs` | 17 | Ctrl+M; selection; edit/cancel/focus; display mode; AutoMath display paste, undo, two equations, ordinary text, context preservation |

**Important:** The numeric equality (49 historical vs 49 new) does **not** certify one-to-one test correspondence. The new suite covers key historical behaviors at the real-browser integration level, often more meaningfully than mocks, but some granular legacy implementation-specific assertions have been replaced with user-observable contracts. For full source-level legacy parity a future reviewer can build a line-by-line case map or port a dedicated CKEditor 49 unit runner.

## Known limitations and integration boundary

1. This fork is compatible with the tested CKEditor **49.0.1** and browser sample; it is **not** yet installed or activated in ScientificRadar Studio. Next.js client-only integration, licensing, editorial HTML conversion, stored citations, table/figure semantics, and actual manuscript data preservation require a **separate** acceptance suite.
2. Only Chromium was exercised in hosted Playwright; Firefox, WebKit, screen-reader navigation and all possible malformed equation cases are **not** certified.
3. Old script output can be requested for legacy compatibility; never treat raw saved script HTML as trusted when rendering public manuscript content. The receiving CMS must sanitize/convert according to its own HTML policy.
4. Math plugin is ISC licensed; CKEditor core has distinct GPL/commercial licensing considerations. Preserve applicable notices and evaluate obligations before distributing or exposing editor code.
5. The package is intentionally `private: true` and no npm package release or ScientificRadar integration has been performed.

**Separate future task:** When authorized, stage both CKEditor core and Math fork source snapshots in ScientificRadar `vendor-staging/` with immutable SHA provenance. This is not part of the Math upgrade PR.
