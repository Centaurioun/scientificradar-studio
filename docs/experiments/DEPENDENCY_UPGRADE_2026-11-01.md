# ScientificRadar Studio — Latest Stable Dependency Upgrade Experiment

**Date:** 2026-11-01 (Europe/Istanbul)
**Branch:** `experiment/dependency-upgrade-2026-11-01`
**Draft / DO NOT MERGE PR:** https://github.com/Centaurioun/scientificradar-studio/pull/16
**Immutable starting main SHA:** `13b45bafb1d07f5a1ea3d9ae0cd10859907fea4c`
**Scope:** dependency+compatibility experiment only. **Not approved for merge, production deployment, or integration into ongoing Google AI Studio work.** No CKEditor, editor swap or vendor-staging changes.

## Executive result

**Feasible with a compatibility restriction, not a clean all-latest migration.**

- `bun update --latest` upgraded all direct dependencies against the registry and regenerated the committed `bun.lock`.
- The newest TypeScript `7.0.2` is **NOT** currently compatible with the `typescript-eslint` code loaded by `eslint-config-next`: CI stops in ESLint with `typescript-eslint does not support TS 7.0`. TypeScript 7 also removed the old `compilerOptions.baseUrl` setting. We retained the actual red CI evidence before the fallback.
- The tested, compatible candidate selects **TypeScript 6.0.3**, the latest 6.x supported by typescript-eslint as of the experiment; all other latest-package upgrades listed below remain.
- With that fallback, frozen Bun install, **49/49 unit tests**, TypeScript check, ESLint check, **Next.js 16 production Webpack build** all passed.
- Full Chromium Playwright E2E: **31/33 passed; 2 failed**. On a separately run, immutable pre-upgrade snapshot, **those same 2 tests failed in the same places with the same symptoms**. Treat them as **existing editor defects/test contracts**, not new Next 16 regressions on this evidence.
- Separate isolated `next dev --webpack` smoke with `DISABLE_HMR=true` returned **GET /dashboard 200** on port 4182.
- No new browser/E2E failures observed beyond those reproduced on the baseline, but this is not exhaustive cross-browser/production acceptance.

## Version changes (declared package manifest)

| Dependency | Baseline | Experiment |
| --- | --- | --- |
| Next.js | `^15.4.9` | **`^16.4.3`** |
| React / ReactDOM | `^19.2.1` | **`^19.3.1`** |
| TypeScript | `5.9.3` | **`6.0.3`** (7.0.2 rejected by ESLint toolchain) |
| ESLint | `9.39.1` | **`10.14.0`** |
| eslint-config-next | `16.0.8` | **`16.4.3`** |
| @google/genai | `^2.4.0` | **`^2.32.0`** |
| motion | `^12.23.24` | **`^14.9.0`** |
| lucide-react | `^0.553.0` | **`^1.66.0`** |
| @hookform/resolvers | `^5.2.1` | **`^7.0.1`** |
| isomorphic-dompurify | `4.5.0` | **`4.6.0`** |
| Tailwind CSS / @tailwindcss/postcss | `4.1.11` | **`4.3.3`** |
| @types/node | `^20` | **`^26.6.6`** |
| firebase-tools | `^15.0.0` | **`^15.34.2`** |

Additional latest compatible updates include `autoprefixer`, `postcss`, `tailwind-merge`, `@types/react`, `@types/react-dom` and `@tailwindcss/typography`. All seven `@tiptap/*` packages were already at `^3.32.2` and did not need changes; `@playwright/test` remained `1.64.1`; `zod` remained `4.6.7`.

**Reproducibility:** All candidate dependencies are pinned through the committed `bun.lock` and installed by CI with `bun install --frozen-lockfile`. The package ranges alone do not guarantee identical resolutions if the lock is ignored.

## Minimal Next 16 / TypeScript compatibility changes

- Removed the removed `compilerOptions.baseUrl` from `tsconfig.json` (paths aliases remain).
- Set `jsx: react-jsx` explicitly: Next 16 had otherwise rewritten that setting automatically during the isolated dev smoke.
- Removed obsolete `eslint.ignoreDuringBuilds` from `next.config.ts` (ESLint remains an explicit CI gate; no lint checks were weakened).
- Retained the original custom Webpack configuration/AI Studio HMR behavior; set `build: next build --webpack` and `dev: next dev --webpack`. **Turbopack is NOT verified** in this experiment. A separate future migration would be needed before enabling it.
- Regenerated Bun lock under Bun `1.4.0`; temporary upgrade/lock/comparison/dev-smoke GitHub Actions workflows were removed after use.
- No edits were made to manuscript/editor source code, E2E assertion strength, or application persistence.

## Evidence and observed outcomes

### Unmodified baseline `13b45b...`

Baseline PR CI attempt: https://github.com/Centaurioun/scientificradar-studio/actions/runs/41349233900 — **failed before tests**, because `bun.lock` was not frozen-compatible with Bun 1.4.0. This was already true before upgrading any package.

Independent read-only snapshot comparison (using `bun install`, *non-frozen only within a disposable CI runner* to work around that pre-existing lock mismatch):
https://github.com/Centaurioun/scientificradar-studio/actions/runs/41350405151

- Baseline **49 unit tests passed**, static checks/build passed.
- Both targeted original scientific-editor E2E tests **failed**:
  - `S-ED-1`: missing visible table-caption placeholder after clicking `Table Caption`;
  - `S-MATH-1`: `Update Equation` stayed enabled after invalid LaTeX `\\frac{1}{2`.
- The non-frozen baseline dependency resolution is not identical to the original committed lock, and it does not replace a passing baseline frozen-lock CI. However, the same source SHA and matching browser assertions provide strong evidence these two failures pre-date this upgrade.

### All-latest TypeScript 7 candidate

https://github.com/Centaurioun/scientificradar-studio/actions/runs/41349466205 — after the raw `bun update --latest`, `bun install --frozen-lockfile` and unit tests passed; `tsc` reported removed `baseUrl`.

https://github.com/Centaurioun/scientificradar-studio/actions/runs/41349624371 — after addressing the TypeScript 7 config, unit tests and `tsc` passed, but **ESLint failed** with `typescript-eslint does not support TS 7.0`. This is a genuine ecosystem incompatibility, not proof that the editor source code is broken.

### TypeScript 6 compatibility fallback

https://github.com/Centaurioun/scientificradar-studio/actions/runs/41349985548

- Frozen Bun install: **PASS**
- Unit tests: **49 passed**
- `bun run typecheck`: **PASS**
- `bun run lint`: **PASS**
- `bun run build` (Next 16.4.3, `--webpack`): **PASS**
- Playwright Chromium: **31 passed, 2 failed**; failed cases match the baseline above.

### Development-server smoke

https://github.com/Centaurioun/scientificradar-studio/actions/runs/41350682903

- Next 16.4.3 Webpack dev, `DISABLE_HMR=true`, Node 26.13.0 and Bun 1.4.0.
- Isolated server returned **HTTP 200** for `/dashboard`; test job **SUCCESS**.
- This is a server-startup smoke, not a manual inspection of every editor UI interaction in Google AI Studio.

## What this experiment DOES NOT authorize

1. **Do not merge PR #16** while Google AI Studio continues implementing on `main`. These changes originated from a fixed main snapshot and may be outdated after AI Studio finishes.
2. Do not change `main`, CKEditor vendor code, production domain, deployed endpoints, or stored user manuscript state.
3. Do not claim TypeScript 7 production compatibility or Turbopack compatibility. The current practical candidate uses TypeScript 6 and Webpack.
4. Do not weaken/skip `S-ED-1` or `S-MATH-1` assertions merely to make CI green. They reveal genuine existing editor UX/validation issues and should be fixed by the ongoing product work with new source-specific evidence.
5. Do not extrapolate from the 31 passing E2E tests to cross-browser (Firefox/WebKit), accessibility, or full scientific-content data-migration safety.

## Later integration decision

After Google AI Studio finishes, compare current `main` against this experimental branch. Rebase or replay selected dependency and compatibility changes as a separate carefully reviewed operation; regenerate the Bun lock on the *then-current* code; run the full CI and interactive editor regression suite again. **No automatic merge.**

External primary references:
- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://typescript-eslint.io/users/dependency-versions/
- https://bun.sh/docs/pm/cli/update
