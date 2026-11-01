# ScientificRadar Studio dependency upgrade experiment

**Status:** isolated experimental branch. **DO NOT MERGE** until Google AI Studio implementation is complete and a separate owner approval is given.
**Created:** 2026-11-01.
**Baseline main SHA:** `13b45bafb1d07f5a1ea3d9ae0cd10859907fea4c`.
**Branch:** `experiment/dependency-upgrade-2026-11-01`.

## Objective
Independently test upgrading ScientificRadar Studio's dependency graph to current stable releases while Google AI Studio continues working on main, without touching `main`, Vercel/production deployments or stored editorial data. This is a disposable experiment, NOT a dependency migration acceptance decision.

## Baseline findings
- `next`: `^15.4.9`, while `eslint-config-next`: `16.0.8` (framework and ESLint config major versions mismatch).
- `@tiptap/*`: `^3.32.2` (currently already modern).
- `react` and `react-dom`: `^19.2.1`.
- `@google/genai`: `^2.4.0`; `bun.lock` is the existing lockfile.
- CI uses Node 26.13.0 + Bun 1.4.0 and runs unit tests, TypeScript, ESLint, production build and Chromium Playwright smoke for PRs.
- Next.js 16 migration concerns: former `next.config.ts` `eslint` setting removed; custom Webpack configuration must be handled explicitly because Turbopack is now default. Official guide: https://nextjs.org/docs/app/guides/upgrading/version-16

## Evidence requirements
1. Record baseline CI for this branch (before upgrade).
2. Upgrade dependency versions **on this branch only**, regenerate and commit the Bun lockfile.
3. Run the same CI checks, including Chromium E2E. Compare results with baseline.
4. Identify necessary compatibility patches separately; don't weaken tests or disable security checks to make CI green.
5. Report version changes, failures, fixes, remaining risks, and exact Git SHAs.

## Explicit scope exclusions
- No PR merge, no updates to `main`, no CKEditor import, no `vendor-staging`, no editor-engine swap, no production deployment.
- Do not claim the successful branch will automatically apply to later `main`; Google AI Studio may change its dependency tree after this snapshot.
