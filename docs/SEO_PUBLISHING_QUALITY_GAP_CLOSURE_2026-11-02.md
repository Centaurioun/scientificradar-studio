# ScientificRadar Studio — SEO & Publishing Quality: Verified Capabilities and Incremental Closure

Date: 2026-11-02
Baseline: Studio main b160accd89c8d24b9e5b726e70158d73cc2176d1
Scope: Local prototype only. No production changes, no external integrations, no deployment.

## What already exists in Studio

- Centralized \`/seo\` quality center and article-level \`/articles/[id]/seo\` audit.
- Deterministic article checks: title and single H1; heading sequence; descriptive body; SEO title and description presence, length, and duplicates across articles; localized slug collision; tags and taxonomy; links; figures and human alt approval; sources, DOI syntax and human verification; timestamps and prototype indexing guard.
- \`lib/audit/publish-policy.ts\` pre-publish gate and \`components/audit/pre-publish-dialog.tsx\` with blockers, warnings and human override notes for local demo publication.
- Local IndexedDB persistence, stale report fingerprints, manual quick-fix proposals.
- Prototype preview noindex, with live Search Console, real public publishing, and connected integrations explicitly unverified.

These are REAL existing features. Do not build a second SEO dashboard or misrepresent them as missing.

## Gaps addressed in this PR

1. Rendered Head Quality Inspector added inside existing \`/seo\`. Editors can paste output HTML of a **specific page** and optionally its original URL; browser DOMParser extracts inert head entries and local deterministic checks detect:
   - Duplicate meta description, keywords, robots, Twitter title/description/card, Open Graph title/description/type/url.
   - Contradictory Open Graph page types, missing/duplicate/invalid canonical, canonical path/host mismatches.
   - Missing title/description, obsolete keywords and X-UA-Compatible declarations.
   - Missing noindex on \`/search\` when a page URL is supplied.
   - Duplicate \`hreflang\` language codes.
   - Multiple \`og:image\` tags remain permitted (intentional multi-image previews).
2. Additional article-level *planned canonical* advisory warns when canonical input is blank, malformed, unsafe (non-HTTPS, credentials, fragment), or reused across another article. **It validates the editorial input, not emitted HTML.**
3. Targeted \`bun test\`-style unit tests for old ScientificRadar duplicate meta head and article canonical cases.

No pasted code is executed or rendered, sent to a server, or stored in IndexedDB. There is no live crawl. This is an advisory editor tool, NOT an HTML sanitizer or an automatic repair of current scientificradar.com.

## Still missing — separate, explicit production release gate

The Studio and ScientificRadar Web repositories are still disconnected prototypes. Before turning on public indexing, implement and independently verify a unified **public-side publishing adapter** and **server-rendered metadata** for website routes, not just Studio UI checks:

- Canonical URL strategy for one locale/slug, correct public domain/path, routing/migration and redirect map (old /post/ and /tr/ URLs, AMP handling), including non-200/410 behavior for missing content.
- Exactly one rendered title/description/canonical and appropriate Open Graph/Twitter values per page; never both \`og:type=website\` and \`og:type=article\`.
- Consistent robots policy: \`noindex\` for search, drafts/previews/admin; index eligible published pages only; never globally flip the prototype noindex without route-by-route safeguards.
- XML sitemap only for canonical published URLs; robots.txt and redirect/status tests; hreflang bidirectionality when both languages genuinely exist.
- Schema.org JSON-LD supported by verified author/source/publication facts only. No invented credentials, DOIs, review claims or dates.
- Site-wide automated SSR HTML head tests and Playwright assertions with production-like responses, including malformed search parameters, duplicate tags, long URLs, 404 and soft 404, redirects, 5xx and mobile pages.
- Migration from the legacy site's live 34 AMP alternate canonicals, 15 soft 404, 4 5xx and query-indexed search URLs based on Search Console evidence and server access.
- Optional GSC/GA4/AdSense integration only after separate approval; preserve existing property/tracking identifiers if migration authorized.

The present change does NOT claim any of these production actions are done.

## Verification

Run on an isolated worktree:
- \`bun install --frozen-lockfile\`
- \`bun run test:unit\`
- \`bun run typecheck\`
- \`bun run lint\`
- \`bun run build\`
- Browser: open \`/seo\`, paste legacy head excerpt, inspect duplicate warnings and ensure neither input nor scripts execute; check light/dark layout and keyboard access.

Do not claim checks passed without actual run logs. No merge or deploy before review.
