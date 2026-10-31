# ScientificRadar Studio v5 — Editorial Quality, SEO Auditing, Locale-Aware Time & Publishing UX

> **Target:** ScientificRadar Studio (Next.js App Router / React / TypeScript / Tiptap)  
> **Repository:** https://github.com/Centaurioun/scientificradar-studio  
> **Path:** `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md`  
> **Status:** Approved product direction; implementation-ready *incremental* change specification, **NOT** production release approval  
> **Edition:** v5.0 — 2026-11-01  
> **Depends on:** `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` (v4.1). **Read both documents in full.**  
> **Execution context:** Google AI Studio with the repository imported from **main**, and separate development verification before acceptance.  
> **User's central objective:** A fast, attractive, easy-to-use scientific editorial workspace. Users author their own articles; optional AI edits formatting and technical metadata **without rewriting scientific content**.

---

## 0. How to apply this document (mandatory)

1. Preserve the existing functioning **ScientificRadar Studio** design, routes, sample records, wide Tiptap editor, Wikipedia concept popovers, navigation presets, revision history and demo-only safety protections. This is an improvement pass, not a rebuild.
2. Read `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` first. This v5 document **extends and overrides the v4.1 requirements only where explicitly different** (dates, audit result semantics, publication readiness, tags, save lifecycle, and named UI controls). Otherwise v4.1 remains authoritative.
3. Review the actual existing source before editing. Do not invent paths or assume a new project structure. The confirmed files are listed in §2.
4. Implement in narrow independently testable vertical slices; **do not** deliver screenshots or superficial "finished" widgets while the underlying actions are broken. Report unimplemented and unverified features explicitly.
5. The actual ScientificRadar public website, domain, DNS, CMS, analytics, and production data are **out of scope**. Publish in the prototype changes *local demo state only*. No external service, payment, credential, or release operation is authorized.
6. **Do not upgrade Node.js, Next.js, React, Tiptap, Tailwind, TypeScript, or dependencies as part of this change.** Maintain package-lock compatibility. Version upgrades will be evaluated after the Google AI Studio development phase.
7. There is an earlier **draft PR #1** at https://github.com/Centaurioun/scientificradar-studio/pull/1 containing a *temporary UTC-only* hydration/scheduling approach. Do **not** blindly merge or cherry-pick it. Its fixes must be reconciled with the user-locale/time-zone design below. Keep main as the source of truth for the imported AI Studio workspace. Avoid losing other people's changes.
8. Keep features such as Codex, Cloudflare R2/Image Transformations, Google AdSense, GA4, Search Console, and GTM **visibly disconnected** until genuine authorized integration exists. "Fix with AI" must never pretend that local deterministic checks were performed by Codex.
9. Separate **design specified**, **code implemented**, **tests executed**, and **browser verified** in the final report. Never claim that a build or screenshot validates an untested flow.
10. Protect the author's exact scientific meaning, evidence, and sources; do not invent DOIs, change numerical results, silently delete paragraphs, or auto-publish.

### Explicit scope of v5

- Hydration bug and date/time formatting: **must fix and verify**.
- Locale/time-zone preferences (editor and reader) with explicit 12/24-hour selection.
- Honest, centralized multi-category SEO + scientific publishing audit engine.
- Dedicated per-article SEO audit results, accessible from the editor and SEO overview.
- Visible "Check SEO" action, result detail and contextual "Fix with AI" proposals.
- Meaningful warnings versus blockers and safe pre-publish readiness.
- Tags/editorial taxonomic limits and relevant missing-field checks.
- Autosave reliability and protection against losing unsaved work.
- Small focused correctness/usability repairs discovered in the current screens.
- Tests, fallbacks, responsive interaction and proof, without production integration.

### Non-goals (still prohibited)

A generic SEO ranking predictor; a fictional "Google score"; mass article generation; CRM/sales UI; wholesale theme replacement; unnecessary extra dashboards; all external services connected in P0; changing production SEO/noindex; suppressing hydration warnings as a workaround; swapping the stack; version upgrade campaigns.

---

## 1. Design intent and approved visual direction

The current screenshots establish a **good baseline**: compact light sidebar, restrained teal accent, editorial dashboard cards, wide writing area, collapsible metadata inspector, Tiptap toolbar, localized article preview, Media Library, Pages, source panel, review queue, and Smart Knowledge Links popovers.

**Keep:** the overall layout, content density, font sizes, professional newsroom feel, card/border vocabulary, sensible status colors and keyboard navigation. Do not redesign the entire UI because an SEO page becomes more capable.

**Improve:** informative validation states; less accidental green "Verified"; one-click contextual issue resolution; more readable title field; accurate save indicators; confirmation at the right moments; clear "demo only"; stable time formatting.

### Reader and author mental model

- The **human** writes/pastes the science.
- The **editor** formats, checks and publishes according to policy.
- The **app** performs deterministic validation and navigates to actionable problems.
- **AI**, when actually connected later, may *propose* targeted corrections; the editor must approve them.
- A green "Passed" means a check was *actually performed*, not merely that a field was populated.
- The admin UI should present **decisions and actions**, not a wall of arbitrary SEO rules.

---

## 2. Verified code findings and file-level change map

Confirmed on GitHub `main` as of the review that produced this specification:

| Current path | Observed behavior | v5 requirement |
|---|---|---|
| `app/seo/page.tsx` | "Complete" if both SEO title and description are non-empty; does not inspect warnings, length, duplicates, indexing, etc. | Consume a central typed audit report; add status filtering and deep links. |
| `components/editor/article-workspace.tsx` | SEO title one-line `input`; description `textarea`; 1.5s debounce autosave; "Saved" indicator changes after a timer; scheduling uses local `Date` conversion. | Auto-resizing title field, granular warning states, reliable save lifecycle, explicit time zone and navigation guard. |
| `app/dashboard/page.tsx` | Server/client date string can vary under ambient locale/time zone, causing hydration error. | Deterministic first render followed by user-pref display. |
| `app/calendar/page.tsx` | Ambient datetime-local parsing and `toLocaleString()`; hardcoded sample schedule default. | Explicit publication TZ, valid parsing, human-friendly 24-hour option, no accidental time shifts. |
| `app/articles/page.tsx` | Ambient date formatting. | Shared date component/service. |
| `components/editor/article-preview-view.tsx` | Ambient update date formatting; demo preview semantics. | Safe localized reader date and truthful preview-only metadata. |
| `lib/editorial-rules.ts` | Mechanical/local checks; DOI syntax and tags; not a complete SEO audit engine. | Retain low-level functions; compose into shared audit rules with separate evidence states. |
| `lib/studio-context.tsx` | Article save and local persistence are primarily state-driven; `seo.noindex` forced `true` for demo. | Explicit repository save acknowledgement, revision snapshot and stale-update protection; keep demo noindex guard. |
| `app/review/page.tsx` | Approval actions broadly visible across draft/review/approved states. | Only valid state/role actions shown; still enforce in service. |
| `app/homepage/page.tsx` | Editorial/home preview can include nonpublished seeded articles. | Label editorial preview and filter published articles for any simulated public view. |
| `components/assistant/codex-assistant-drawer.tsx` | Honest disconnected Codex with deterministic local checks. | Preserve honesty; add audit-linked suggestion context without inventing AI responses. |
| `lib/types.ts` | Well-defined Article, sources, media, status fields. | Extend minimally with audit-result types, preferences, saved-version semantics. |
| `lib/editorial-rules.test.ts` | Existing unit tests. | Add regression tests for status severity, title warnings, tags, timezone, saving and publication. |

**Recommended new modules**, subject to checking repository conventions:

~~~text
lib/audit/types.ts                # issue IDs, status, evidence, scopes
lib/audit/rules/*.ts              # pure targeted rules
lib/audit/run-article-audit.ts    # canonical orchestration and aggregation
lib/audit/publish-policy.ts       # blockers vs warnings
lib/audit/audit-fixtures.test.ts  # deterministic regression cases
lib/datetime/format.ts           # safe ISO -> locale/timezone display
lib/datetime/parse.ts            # explicit wall time + IANA zone -> instant
components/datetime/localized-date.tsx
components/audit/audit-status.tsx
components/audit/issue-row.tsx
components/audit/seo-audit-summary.tsx
components/audit/pre-publish-dialog.tsx
app/articles/[id]/seo/page.tsx    # dedicated per-article audit view
~~~

Keep abstractions focused; do not blindly create every file if simpler boundaries already exist. Existing helpers are retained and reused, not copied into competing implementations.

---

## 3. Locale-aware date/time — exact functional contract

### 3.1 Different contexts, one instant

All stored publication/schedule timestamps remain ISO 8601 UTC instants (e.g. `2026-11-04T12:00:00.000Z`). Date presentation depends on context:

| Context | Preferred behavior |
|---|---|
| Admin user in Türkiye | Default locale `tr-TR`, IANA time zone `Europe/Istanbul`, **24-hour** clock. User may override settings. |
| Other admin editors | Per-user locale/time zone and 12/24-hour preference; persisted. |
| Public article pages | Automatically display in reader's browser locale/time zone **when client hydration is ready**; support explicit preference if the reader changes it. |
| Scheduling form | Explicit time zone label and conversion to a single UTC instant. |
| Sitemaps/JSON-LD/meta dates | Stable absolute ISO 8601 timestamps independent of viewer locale. |
| Server-rendered initial HTML | **Stable/deterministic** across server and client; never a locale-dependent mismatch. |

Example: `2026-11-04T12:00:00Z` is 15:00 in Istanbul on that date, and 07:00 in New York on that date. The stored instant and SEO structured data remain unchanged even though viewers see different clocks.

### 3.2 Preferences

Implement `Settings → General → Date & Time` (or a clearly labeled group on General Settings):

- Language/locale: `Browser default`, `Turkish (Türkiye)`, `English (US)`, `English (UK)`; extendable without hard-coding all world locales.
- Time zone: `Device default` or explicit IANA zone, e.g. `Europe/Istanbul`, `Europe/London`, `America/New_York`.
- Clock: `Automatic`, `24-hour`, `12-hour`.
- Optional display sample with date, time and time zone abbreviation.
- Save per demo user profile in IndexedDB; after real auth, store server-side per user.
- Locale and clock format are independent choices. A US browser user may prefer 24-hour time.

### 3.3 Rendering and hydration (HIGH PRIORITY)

Existing hydration error example: `app/dashboard/page.tsx` rendered `new Date(art.scheduledAt).toLocaleString()` and the server and browser produced different time strings. Do not hide or silence the error with `suppressHydrationWarning`. Root cause must be fixed.

**Acceptable designs:**

- If server knows an authenticated user's locale/time zone, format with explicitly supplied locale/time zone and deterministic formatting parameters on both sides; or
- For browser-only locale/time zone, first render an identical stable UTC value or placeholder in SSR and first client render. Then resolve `navigator.language` and `Intl.DateTimeFormat().resolvedOptions().timeZone` after mount and replace display. Render a stable `dateTime` attribute (the stored ISO instant).

Example sketch (illustrative; fit into actual project architecture):

~~~tsx
'use client';
import { useEffect, useState } from 'react';

type DatePrefs = {
  locale: string;
  timeZone: string;
  hourCycle: 'auto' | '12' | '24';
};

function formattedInstant(iso: string, p: DatePrefs): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: p.timeZone,
  };
  if (p.hourCycle !== 'auto') options.hour12 = p.hourCycle === '12';
  return new Intl.DateTimeFormat(p.locale, options).format(new Date(iso));
}

export function LocalizedDate({ iso }: { iso: string }) {
  const [prefs, setPrefs] = useState<DatePrefs | null>(null);
  useEffect(() => {
    setPrefs({
      locale: navigator.language || 'en-GB',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      hourCycle: 'auto',
    });
  }, []);
  // Identical server and first client text. Replace only after mount.
  const text = prefs
    ? formattedInstant(iso, prefs)
    : new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  return <time dateTime={iso}>{text}</time>;
}
~~~

In the real component, consume **saved preferences** rather than overwriting them unconditionally with `navigator`; avoid flicker where possible, and include a readable invalid-date fallback. If first-render UTC text flashes briefly, a localized skeleton is also acceptable if identical server/client and accessible.

### 3.4 Publication schedule input and DST safety

Never assume that the wall-clock string inside `<input type="datetime-local">` is an absolute time. It has no time zone. Pair it with a selected IANA zone; convert to UTC **exactly once**, and reverse convert when re-opening the saved record.

- Show the zone next to the input, e.g. `Publication time (Europe/Istanbul)`.
- Show the computed UTC instant in a quiet confirmation line before saving.
- Validate real calendar date, not just regex syntax.
- If local time is nonexistent because clocks move forward, **reject** with a clear error and ask for another time.
- If local time is ambiguous because clocks move back, require explicit offset/earlier-later choice or reject pending confirmation; **never silently choose**.
- No hardcoded `2026-11-06T10:00` field default. Prefer blank or a fresh user-selected value.
- Do not change an already published timestamp through incidental edits.
- Keep published date and updated date conceptually distinct.

Example signatures, not a demand for a new dependency:

~~~ts
type ScheduleInterpretation =
  | { ok: true; utcIso: string; timeZone: string }
  | { ok: false; reason: 'invalid' | 'nonexistent' | 'ambiguous' };

function interpretWallTime(
  wallTime: string,   // "YYYY-MM-DDTHH:mm"
  timeZone: string,   // IANA
): ScheduleInterpretation;
~~~

Use a well-tested standards-compliant time-zone conversion strategy compatible with the installed runtime; if one is not available without a dependency change, implement a clearly labelled UTC-only interim mode and **do not pretend local zone scheduling works**. Date-format preferences may still work for display.

### 3.5 Required date tests

- Same ISO instant: Istanbul 24-hour and New York 12-hour show different local strings but same stored instant.
- Two render passes in different Node/browser time-zone environments produce identical initial markup.
- `tr-TR` produces day-first formatting; `en-US` produces month-first as appropriate.
- User choosing 24-hour overrides locale's usual hour cycle.
- Scheduling form round trip preserves exact instant after reopen and resave.
- DST gap and overlap do not silently schedule wrong instants.
- Invalid ISO returns safe fallback; no crash.
- Calendar, dashboard, articles list, revision history, article preview all use the shared display approach.
- Run browser console check for hydration warning on desktop and mobile.

---

## 4. One canonical SEO + editorial quality audit engine

**Current concrete defect:** `app/seo/page.tsx` currently calculates `hasSeo = Boolean(art.seo.title && art.seo.description)`; therefore an overly long title can show "Complete". Different screens must never use distinct definitions of "SEO healthy".

Build a **single deterministic audit orchestration service** used by:
1. SEO & Quality Center overview (many articles),
2. each article's SEO inspector summary,
3. the per-article SEO Audit page,
4. the Pre-Publish Check gate,
5. the optional assistant suggestion UI.

Do not directly couple audit rules to React components or network calls.

### 4.1 Rule result model

~~~ts
type FindingStatus = 'pass' | 'warning' | 'error' | 'unverified';
type FindingCategory =
  | 'content'
  | 'metadata'
  | 'taxonomy'
  | 'links'
  | 'images'
  | 'scientific_integrity'
  | 'structured_data'
  | 'international'
  | 'technical';

type AuditFinding = {
  id: string;                   // Stable; e.g. seo.title.too_long
  category: FindingCategory;
  status: FindingStatus;
  title: string;
  description: string;          // Non-marketing, factual
  observed?: string;            // Evidence, never hallucinated
  recommendation?: string;
  fieldPath?: string;           // e.g. seo.title, tagIds
  checkOrigin: 'local' | 'site' | 'external';
  verifiedAt?: string;          // Only if that check genuinely ran
  canQuickFix: boolean;         // Deterministic correction exists
  canSuggestWithAI: boolean;    // Only if adapter actually connected
  isPublicationBlocker: boolean;
};

type AuditReport = {
  articleId: string;
  articleFingerprint: string;   // Detects stale report
  executedAt: string;
  findings: AuditFinding[];
  counts: Record<FindingStatus, number>;
  checkedScope: ('local' | 'site' | 'external')[];
};
~~~

**Rules:**
- `pass` = the indicated check actually ran and passed within its documented scope.
- `warning` = missing or improvable item, editorial guideline exceeded, likely snippet truncation; **not automatically a Google error**.
- `error` = invalid configuration, unsafe URL, a real technical defect or enforced publishing contract violation.
- `unverified` = requires data/service/tool unavailable, or no true validation was executed. NEVER turn this green merely because a field is not empty.
- Publication blocker is **independent** from severity; not all errors must block a local demo publish, and some mandatory checks may be blockers. Define a centrally governed policy.
- A score like "SEO 96/100" must **not** be displayed as a Google ranking predictor. Prefer transparent issue counts and categories.
- Do not store verdicts without the source record version/fingerprint; stale results should say "Recheck required".
- Results must not overwrite the original article.

### 4.2 Checks inventory — explicit identifiers, triggers, semantics

Implement local checks immediately where the data exists; mark external-only checks `unverified` until validated. Rules may return multiple findings (including one per image/link).

| Rule ID | What to check | Severity on failure | Feasible in P0? |
|---|---|---|---|
| `content.h1.single` | One rendered H1 from Article Title; no H1 inside article body | error, blocker | Yes |
| `content.headings.order` | H2/H3 nesting, empty headings and skipped levels where applicable | warning | Yes |
| `content.title.present` | Actual title non-empty and meaningful | error, blocker | Yes |
| `content.body.present` | Body contains non-whitespace text | error, blocker | Yes |
| `metadata.seo_title.present` | Explicit SEO title or documented template fallback | warning | Yes |
| `metadata.seo_title.length` | Advisory target around 50–65 characters; label truncation *risk*, not hard Google limit | warning | Yes |
| `metadata.seo_title.duplicate` | Same title across existing content locales/URLs | warning | Yes |
| `metadata.description.present` | Meta description/fallback exists | warning | Yes |
| `metadata.description.length` | Approx 120–160 as *editorial guidance*; not a guaranteed snippet limit | warning | Yes |
| `metadata.description.duplicate` | Duplicate summary/description where content should differ | warning | Yes |
| `metadata.slug.valid` | Non-empty, safe, unique localized slug | error, blocker for actual publish | Yes |
| `taxonomy.primary_category.present` | Primary scientific discipline exists and is valid | error, blocker | Yes |
| `taxonomy.subcategory.valid` | All selected subcategories belong to correct parent | error if invalid; absent may be warning | Yes |
| `taxonomy.tags.count` | 0 warning, 1–2 advisory, 3–6 recommended, >6 disallowed by policy | warning/error | Yes |
| `taxonomy.tags.duplicate` | Duplicates/case variants/synonym collisions | warning | Yes |
| `links.internal.target` | Local known targets exist and are in correct publication state | warning/error | P0 local |
| `links.external.syntax` | Safe HTTPS URL, safe anchor, meaningful visible label | warning/error | Yes |
| `links.external.http` | Actual remote status, redirect chains, dead link | unverified until allowed network validation | Not offline |
| `links.rel.attributes` | Sponsored/ad/UGC links have appropriate `rel` values; ordinary editorial citations need not be nofollow | warning | Where metadata exists |
| `metadata.canonical.valid` | Production canonical URL points to correct authorized URL | unverified in isolated demo; error if demonstrably malformed | Limited |
| `metadata.robots.indexing` | Published page not inadvertently noindexed; previews/drafts stay noindex | error in production, demo must remain noindex | Environment-specific |
| `discovery.sitemap` | Published URL included when site publishing engine exists | unverified | Not in P0 |
| `images.featured.present` | Relevant featured image if publication policy requires one | warning | Yes |
| `images.alt.present` | Meaningful alt text; decorative image may use explicit decorative flag | warning | Yes |
| `images.alt.human_review` | Human verified accurate scientific axes/labels/credit | unverified until actual editor review | Yes with workflow |
| `images.social.preview` | OG/social image fields and suitable crop/permitted size | warning/unverified | Partial |
| `integrity.sources.present` | Research report references source record(s); policy-based not universal for all page types | warning/blocker by article type | Yes |
| `integrity.doi.syntax` | DOI shape where supplied | warning/error | Yes |
| `integrity.doi.registered` | DOI resolves/metadata match via trusted external provider | unverified until network check | No offline |
| `integrity.claim_supported` | Claim-source alignment and citation trust | unverified until human verification; AI never self-certifies | Not automatic |
| `integrity.image_licence` | Figure credit and rights data when needed | warning/blocker by media policy | Yes |
| `structured_data.article` | Article or NewsArticle JSON-LD structure valid for the actual public page | unverified until public renderer available; local shape test permitted | Partial |
| `structured_data.dates` | Valid publish/modified ISO timestamps; no future date passed as historical publication | warning/error | Yes |
| `international.hreflang` | Reciprocal alternate language URLs where equivalent translations exist | unverified until public URLs exist | Partial |
| `international.locale` | Content language and URL locale metadata match | warning | Yes |
| `performance.web_vitals` | Real CWV/field data rather than guessed load speed | unverified | No offline |
| `search_console.indexed` | Google actual index status | unverified | No offline |

**Interpretation of "SEO Complete":** a group is fully passed only when *all applicable implemented checks* pass with no warning/error and all required external checks in scope were verified. If network checks are unavailable, use "Local checks passed · external verification pending", not absolute "Complete".

### 4.3 Title and meta description: honest guidance

Do not convert editorial display thresholds into Google's formal maximum lengths. Google may truncate title/snippet by viewport, and may generate snippets from body text.

Specific UI example:
- SEO title = **73 / 65 advisory** -> amber "May be truncated"; show full text, suggested shorter title, editor can retain it.
- Meta description = **116 / 160 advisory** -> acceptable if descriptive and not duplicated.
- Empty title/description -> amber missing-field guidance, subject to templated fallback.
- Invalid canonical or intentionally noindex published public page -> red critical once real publication context exists.
- Different colors must carry icons and text, never color only.

### 4.4 Avoid SEO superstition

Do not enforce keyword density, a universal article word count, arbitrary outbound-link quotas or a magic number of tags as Google ranking rules. 3–6 tags is a **ScientificRadar editable editorial rule** only.

---

## 5. Article SEO inspector and dedicated results page

### 5.1 Keep current editor layout

Existing right-hand tabs `Taxonomy | Sources | Figure | SEO | History` remain. SEO gets:

- A visibly discoverable **Check SEO** button at top (primary accent but not giant).
- Current status: "Not checked", "Checking", "X checks passed", "X warnings", "Y errors", "Z not verified".
- "Last checked" timestamp and "Recheck after changes" status.
- Full SEO title displayed in an **auto-growing textarea** (minimum two lines / expands with content). Do not truncate an input to one line.
- Auto-growing description field with full content visible.
- Small advisory character counters; warn when outside editorial suggested ranges but do not prevent saving.
- SEO title snippet preview using example site label "ScientificRadar" and URL, labelled *illustrative*.
- A **View Full Audit** link to `/articles/[id]/seo` preserving article ID.
- Unsaved changes remain intact when opening audit; persist first or warn.

### 5.2 Per-article route

Create `/articles/[id]/seo` (or reuse appropriate existing route style) for a full report. Layout:

~~~text
Article SEO Audit                         [Run SEO Audit]   [Back to Editor]
Article title and locale                   Last run / stale state
Passed: N   Warnings: N   Errors: N   Unverified: N
[ All | Warnings | Errors | Unverified ]   [Category filter]
Content & Metadata
  [✓] Article heading hierarchy                     Passed
  [!] SEO title 73 / 65 (advisory)                   Fix in Editor | Suggest with AI
  [✓] Meta description                               Passed
Links & Discovery
  [?] External HTTP status                          Not verified
Scientific Integrity
  [?] DOI registry and claim support                Human/external review
...
[ Fix Eligible Issues with AI ]                      [Open Pre-Publish Check]
~~~

Each issue row includes: category, severity icon + text, observed evidence, exact remedy, verification scope, **Go to Field**, **Quick Fix** if deterministic, and **Fix with AI** only if connected and a safe proposal is possible.

When the editor clicks a row, open the relevant tab, focus the field, and position without losing draft data. No dead buttons.

### 5.3 Summary overview screen

On `/seo`, show all articles with aggregate severity from **the same audit engine**. Replace "SEO Title & Summary: Complete" if the title has an outstanding advisory warning. Show links to the specific `/articles/[id]/seo` result, not just a generic article edit page. Allow filtering: errors / warnings / unverified / ready. Retain compact scientific editorial table styling.

### 5.4 Event sequence

1. User edits title/body/tags/links.
2. Audit status becomes **Needs recheck** if fingerprint changes.
3. User presses **Check SEO**: local validations run synchronously/offloaded as appropriate; external checks remain unverified.
4. Report shows total and per-rule results.
5. User reviews/edit fields; may click a local deterministic Quick Fix.
6. If future AI adapter is connected, "Fix with AI" requests a **proposal**, not a mutation.
7. On explicit approval of selected diff, changes are applied to a new recoverable draft revision and report goes stale.
8. Re-run audit; only actual improvements become green.

---

## 6. "Fix with AI" — safe, optional, auditable, no false claims

Rename top-level visible label **AI Assistant** (provider-neutral); identify Codex in the adapter settings as **Codex / Sign in with ChatGPT**. Existing assistant functionality and v4 design preserved. No provider change or credentials during v5.

Two kinds of fixes:

1. **Quick Fix (local):** deterministic safe modifications such as duplicate-tag normalization, empty-space cleanup, accidental body H1 demotion; show preview, preserve revision.
2. **Fix with AI:** only if authorized provider genuinely connected. Ask for a *structured suggestion* for a selected finding, with exact target field, original value, candidate, rationale, risk, and no fabricated claims.

For **Fix All Eligible Issues with AI**:
- Include only outstanding relevant warnings/errors, not passing checks.
- Skip external-only/unsupported checks (Google indexing, DOI registry verification, CWV).
- Preserve author article body, quotes, empirical values, numerical claims and scientific conclusions.
- Bundle proposals into a review screen, grouped by risk, with **Accept**, **Reject**, **Accept Selected**, **Undo** and revision checkpoint.
- Do not silently apply results or automatically publish.
- Avoid AI for fixed deterministic transformations when it adds cost and risk.

Suggested contract:

~~~ts
type FixProposal = {
  findingId: string;
  articleId: string;
  baselineFingerprint: string;
  path: string;
  before: unknown;
  after: unknown;
  explanation: string;
  risk: 'mechanical' | 'metadata' | 'editorial';
  source: 'local_rule' | 'connected_ai';
  requiresHumanApproval: true;
};
~~~

If no actual Codex link: show **Not Connected — Connect under Settings → Integrations**. Local checks can still run; never label them "Codex success".

---

## 7. Tags and discipline categories (editable editorial policy)

### Tags

- 3–6 is a *recommended* tag count, not a Google policy.
- **Default maximum 6 selectable tags**, configurable in Settings → Editorial Rules in a later phase (initial P0 can use a constant).
- 0 tags -> amber "No tags selected"; saved draft allowed.
- 1–2 -> amber "Consider additional relevant tags"; saved draft allowed.
- 3–6 -> within ScientificRadar guideline.
- Attempt to choose or add a seventh -> do not add it; show polite inline notice ("Maximum 6 tags for this article. Remove one before adding another.").
- Duplicate aliases or case variations -> do not count twice. Ensure normalization in the central mutation/service, not just UI.
- Exact article type or role may justify exception later, but never mislabel guidelines as Google ranking requirements.

### Categories

- One valid **primary discipline** required for publishing.
- Subcategory selection should show *only* children of the chosen primary discipline. Missing subcategory may generate suggestion, not mandatory across all science topics.
- Switching primary category clears or reconciles unrelated subcategory selections, after showing a polite notice if necessary.
- Selecting a subcategory should never silently remap primary category without communicating it.
- Broken/orphaned category IDs are audit errors. Category rename should preserve referential IDs and stable URLs as appropriate.

### Data invariants

~~~ts
const MAX_EDITORIAL_TAGS = 6;
const tagCountIsValid = (ids: string[]) => new Set(ids).size <= MAX_EDITORIAL_TAGS;
// The policy service must ALSO reject 7th tag on save/import/AI proposal.
~~~

Add tests for click 7th tag, inline creation, API/repository write, imported snapshot and Codex proposal applying too many tags.

---

## 8. Pre-Publish Check — mandatory safety gate, proportionate friction

The author can still Save Draft at any time. Publishing is deliberately distinct from saving.

When user clicks `Publish (Demo)` or schedule/publish in future:
1. Flush pending save or block with retry.
2. Run fresh central SEO + editorial audit for the current article snapshot.
3. Evaluate publication policy against the intended status, real current content and environment.
4. Show **Ready to Publish?** summary with actionable links.
5. If blockers: disable publish transition; show how to fix; never call state transition.
6. If warnings only: allow **Publish Anyway** with optional/required reason depending on policy and role; audit-log the decision. The warning is not hidden from the report.
7. If unverified external checks: state explicitly which checks weren't run. Determine whether human sign-off is required based on article type and policy.
8. If all configured gates pass: editor confirms the action.
9. Demo publish affects local demo store **only**, with clear confirmation.

### Default blockers (demo contract)

- Empty article title, empty article body or forbidden body H1 violating invariant.
- Invalid/duplicate slug preventing a unique article route.
- Invalid primary category or inconsistent category relationship.
- Unsafe URL scheme in published article.
- Missing required author/permission or prohibited role transition.
- A failed persistence operation; cannot publish unsaved state.
- Attempted publish from a disallowed workflow state.
- In a **real** production renderer: canonical/indexing invariant failure can block release; in P0 the intentional demo noindex MUST remain and cannot be treated as a blocker that makes all demo publishing impossible.

### Warnings (normally do not block)

- SEO title > suggested 65 chars, description out of recommended range.
- 0–2 relevant tags, missing optional subcategory.
- No featured image if not required by editorial type.
- No verified citation in a type that allows a draft but requires human review before real scientific publication.
- External DOI metadata or HTTP status not yet checked.
- Missing optional OG customization where template fallback exists.

### Distinguish reviewer approval from SEO

A scientifically inaccurate article can have structurally perfect SEO. SEO Passed does **not** imply scientifically verified, editor-approved or published. Source verification and editorial status remain separate dimensions.

---

## 9. Autosave, dirty tracking, navigation safety and revisions

The current demo has a 1.5 second debounce. **Keep the fast UX** but replace timer-based *claimed success* with genuine store acknowledgement.

### 9.1 Save state machine

~~~ts
type SaveState =
  | { kind: 'clean'; savedVersion: number }
  | { kind: 'dirty'; draftRevision: number }
  | { kind: 'saving'; draftRevision: number }
  | { kind: 'failed'; draftRevision: number; message: string };
~~~

- The first edit (even one character/space) marks dirty immediately.
- Debounce save (e.g. ~1–2 seconds) after last edit.
- "Saving…" while the repository write is genuinely pending.
- "Saved" **only after** IndexedDB or server persistence resolves successfully.
- Failed save -> red error, retry button, unsaved content remains in editor, no misleading green indicator.
- Monotonic revision counter/operation ID prevents an earlier save completion from overwriting newer edits.
- Explicit **Save Draft** remains.
- Autosave is not identical to a meaningful version-history snapshot on every keystroke; preserve checkpoints at important actions and authorized review/AI changes.

### 9.2 Navigation / tab-close protection

- If the user clicks another internal route while dirty or save fails: **Save & Leave / Leave Without Saving / Cancel** dialog, but don't pop a dialog when there is no actual risk.
- When navigating normally and autosave can finish safely, prefer flushing save and continuing without interruption.
- Browser refresh/close while unsaved: install `beforeunload` only while dirty/pending; use browser-native warning; custom message text is not reliable.
- Preserve draft across accidental unmounts and restore if possible. Do not discard a newly created unsaved article.
- Save failure cannot be masked by closing a drawer or navigating to SEO audit.
- Prevent an edited stale article from overwriting changes made in another tab/user; in P0 use revision token or conflict notice, in P1 server compare-and-swap.
- Ask before discard; do not add a nagging modal for every harmless action.

### 9.3 Proposed repository API, adapted to current state architecture

~~~ts
type SaveReceipt =
  | { ok: true; articleId: string; savedRevision: number; persistedAt: string }
  | { ok: false; reason: 'quota' | 'storage' | 'conflict' | 'validation' };

async function persistArticleDraft(
  article: Article,
  expectedRevision: number
): Promise<SaveReceipt>;
~~~

Do **not** claim this is an already implemented API. It is a target contract. Under IndexedDB memory fallback, label that data as **volatile**, not durable; a successful write to memory is not equivalent to persistent saved data. Add backup-export guidance if storage is unavailable.

### 9.4 Tests

- First keystroke -> dirty immediately; save state only becomes clean on fulfilled persistence.
- Failed IndexedDB write -> no "Saved"; retry succeeds without lost text.
- Two quick revisions -> late first response does not overwrite newer text.
- Navigate away before debounce -> save/leave confirmation.
- New unsaved article and browser refresh -> safety warning.
- Delete selected text, paste very long manuscript -> no stale values after reload.
- SEO Audit navigation preserves current draft.
- AI approved changes generate recoverable revision without erasing user work.

---

## 10. Additional correctness repairs (small, high-value)

### 10.1 Review queue actions

The current review queue shows actions including `Approve` on a broad set of draft/in-review/approved records. Introduce a transition table and role-based actions. UI filtering is for usability; **service enforcement is mandatory**.

Example permitted transitions (subject to actual policy):
- `idea → draft`
- `draft → in_review`
- `in_review → approved | revision_requested`
- `revision_requested → draft | in_review`
- `approved → scheduled | published` with publish gate
- `scheduled → published | approved` with authorization
- `published → archived` or create revision, never silently demote/re-date
- `archived → draft` through explicit restore + confirmation

Reviewers may request revision/approve as policy allows; authors cannot self-approve/publish; editor/owner capabilities remain explicit. Prohibit impossible direct hops in the domain policy, not just hide buttons. Tests cover each allowed/disallowed role/transition combination.

### 10.2 Homepage: preview versus public state

The editorial preview may show unpublished articles with unmistakable **Internal Preview** labels. A simulated public homepage should include only legitimately published demo items; never accidentally expose drafts or in-review articles in generated public feeds. Links to draft-only articles remain under guarded preview routes.

### 10.3 Accurate scientific/media statuses

- `DOI Syntax Valid` ≠ `DOI Registered` ≠ `DOI Supports Claim`.
- `Alt Text Present` ≠ `Scientifically Accurate & Human Reviewed`.
- `Source Linked` ≠ `Source Validated`.
- `SEO Local Passed` ≠ `Google Indexed`.
- Distinguish article type, source type, licensing and editorial reviewer confirmation.
- Human-verified badges require real recorded human decision (even in demo), not simply a minimum character count.

### 10.4 Remove development-only controls

Remove `Test Markdown # H1 Paste` and similar QA widgets from normal editor toolbar; keep tests in test suite/developer-only surfaces. Preserve actual Markdown paste support and H1 demotion.

### 10.5 Knowledge preview polish

Keep Wikipedia-style hover/focus/tap preview exactly as liked by the user. Improve viewport-aware positioning, popover hoverability and mobile tap/close behavior; don't introduce auto-loading every preview at page start. Make external links `target="_blank" rel="noopener noreferrer"` and retain legal attribution requirements. Internal links should normally be same tab.

### 10.6 Accessibility & responsive details

- Icon and color together for error/warning.
- Field errors linked with `aria-describedby`.
- Automatic focus of first failed publish field when requested.
- ESC dismisses popover/drawer; focus returns to triggering control.
- Sticky right inspector collapses on medium/small screens; no editor width squeeze when assistant drawer opens.
- Audit table usable at 390px wide, preferably responsive cards instead of horizontal scroll for critical actions.
- No animated status that distracts from writing.

---

## 11. Shared data flow and edge conditions

### Source of truth

~~~text
Article editing state (unsaved revision)
    ↓ persist and confirm
Versioned Article repository
    ↓ snapshot/fingerprint
Central Audit Engine
    ├── SEO & Quality Center overview
    ├── Per-article SEO results
    ├── Metadata Inspector summary
    ├── Pre-Publish Check / workflow policy
    └── AI suggestion context (optional)
         ↓
     Proposed diff → explicit review → approved revision → rerun audit
~~~

Do not persist an audit "Passed" forever after the underlying article changes. If rule inputs change, invalidate or recompute. Snapshot hash should cover title, locale, slug, content, metadata, tags/categories, linked media/source IDs and relevant records. Beware false pass from an article with no featured image: "not applicable" may be preferable to "verified".

### Failure behaviors to design explicitly

- Article removed while Audit page is open -> Not Found, back to Articles.
- Missing source/media record -> unverified/error as appropriate; never crash.
- Imported malformed tags or article metadata -> safe validation, no XSS.
- AI not connected -> contextual unavailable message, no fake results.
- Interruption during save -> retain in-memory draft, retry.
- Two tabs editing same article -> conflict warning.
- Browser timezone unavailable -> UTC fallback.
- External links inaccessible -> unverified, **not** "broken" without network proof.
- Invalid/expired audit finding -> "Run SEO Audit again".
- No results -> legitimate empty state; no dummy scores.
- No public front-end connected -> production indexing/schema checks unverified.

---

## 12. Exact user journeys & acceptance scenarios

**Scenario A — Long SEO title not incorrectly green**
1. Open article with filled title 73 characters, description 116.
2. Existing SEO overview must NOT display unconditional Complete.
3. Run Check SEO.
4. Title row: amber truncation risk (editorial), full title visible in auto-growing field.
5. Meta description row: pass if content is valid; no forced 160-character fill.
6. Jump to SEO title focuses correct input.
7. After shortening title and rechecking, warning resolves; report fingerprint updates.

**Scenario B — 7th tag**
1. Select six distinct tags.
2. Click seventh tag or create new inline tag.
3. Selection stays at six; inline warning appears.
4. Save/import/AI proposal cannot bypass the limit.
5. Remove one -> seventh can now be selected.

**Scenario C — No tags, no subcategory**
1. Create article with valid title, body, primary category, but no tags/subcategory.
2. Save Draft succeeds.
3. Check SEO produces advisory warnings.
4. Publish gate displays those warnings but does not falsely claim Google's policy requires fixed counts.
5. Editor can explicitly acknowledge if policy permits.

**Scenario D — Offline external checks**
1. Run audit with disconnected Google and DOI provider.
2. All locally run checks show truthful statuses.
3. External HTTP, Google index and DOI registry checks show Not Verified.
4. No fabricated Google traffic, ranking or verified DOI label.

**Scenario E — Lost save**
1. Edit one character, then navigate immediately.
2. Dirty state persists and navigation flushes save or asks.
3. Simulate persistence rejection.
4. Saved indicator never goes green; unsaved text remains.
5. Retry persists exact content; article preview reflects confirmed saved version.

**Scenario F — Different readers and editors**
1. Same ISO article timestamp displayed in `tr-TR / Europe/Istanbul / 24h` and `en-US / America/New_York / 12h`.
2. Site publishedAt remains identical.
3. No hydration mismatch when server TZ differs from browser TZ.
4. Scheduled time round trip preserves stored instant, including DST boundary test.

**Scenario G — Publish gate**
1. Clear article body -> blocker.
2. Click Publish (Demo) -> clear issue summary; state unchanged.
3. Restore body, retain a 73-char SEO title -> warning, explicit continue permitted.
4. Keep preview/draft noindex in isolated demo. Production indexing checks never pretend to validate public site.
5. No real production change.

**Scenario H — AI connection unavailable**
1. Click Fix with AI.
2. If provider not configured, show "AI Assistant is not connected" and integration link.
3. Local deterministic Quick Fix remains available where safe.
4. No artificial Codex token usage or fabricated response.

**Scenario I — Review workflow**
1. Author sees Submit for Review but not Approve/Publish.
2. Reviewer sees actions supported by current state, cannot publish.
3. Already approved article cannot be "approved" again as a meaningful new review.
4. Forbidden transition rejected even if invoked directly in service.

**Scenario J — Public preview**
1. Internal homepage can explicitly preview an in-review article.
2. Simulated public homepage lists only demo-published articles.
3. Tiptap page preview remains noindex in this isolated prototype.

---

## 13. Priority plan for Google AI Studio (NOT all-at-once redesign)

### Gate V5-A — First: structural defects and data safety

- [ ] Implement shared deterministic SSR-safe date display; remove ambient direct formatting in initial render at affected routes.
- [ ] Introduce per-user locale/time format prefs and explicit schedule zone contract; if timezone conversion unsupported, do honest UTC-only interim.
- [ ] Reconcile existing draft PR #1 instead of silently merging it; prevent conflicting date implementations.
- [ ] Fix primary-category/subcategory filtering and stale selections.
- [ ] Replace false autosave success with persistence receipt; navigation guard, retry, stale-save prevention.
- [ ] Test browser hydration, saved drafts, 24h/12h, time zone and DST edge cases.
- [ ] **No dependency/version upgrades.**

**Gate A deliverable:** time/saving problems fixed and verified without visual regression. Do not proceed if this gate fails.

### Gate V5-B — Central audit foundation

- [ ] Define types, rule registry, article fingerprint and four honest statuses.
- [ ] Implement available local rules using existing editorial functions.
- [ ] Add fixtures for: title 73/65, missing fields, invalid categories, 0/2/6/7 tags, links, image alt and missing sources.
- [ ] Update SEO Center and metadata inspector to read same engine.
- [ ] Add auto-growing SEO title and description, counters and evidence tooltips.

### Gate V5-C — Audit action and publication workflow

- [ ] Add Check SEO, per-article audit route, group filters, actionable issue rows, jump-to-field.
- [ ] Add deterministic Quick Fix only for safe mechanical operations.
- [ ] Add Pre-Publish Check with blocker/warning/unverified separation.
- [ ] Ensure Publish (Demo) only changes demo store after valid transition and confirmed save.
- [ ] Scope review queue actions by state+role; fix public preview published-only.
- [ ] Maintain real revision snapshots and audit events.

### Gate V5-D — Optional assistant UX and polish, without live integration

- [ ] Rename visible assistant to **AI Assistant** while retaining Codex provider in settings.
- [ ] Per-finding Fix with AI and Fix All Eligible Issues **disabled with informative Not Connected** until connection.
- [ ] Reuse existing non-destructive diff/review UX for deterministic fixes.
- [ ] Refine knowledge popovers, responsive SEO table, keyboard focus, tooltip semantics.
- [ ] Keep tests/QA buttons out of editor UI.

### Gate V5-E — Honest handoff

- [ ] Run existing tests plus new targeted unit tests.
- [ ] Run typecheck, lint and production build if tools/environment allow.
- [ ] Execute Playwright desktop/mobile route tests, publish/save tests and hydration regression if supported.
- [ ] Document commands with actual exit codes; mark unexecuted tests "Not run".
- [ ] Produce detailed changed-files list and P0/P1/P2 feature status.
- [ ] No deploy, no production migration, no new secrets, no automatic dependency updates.

### Suggested test commands (use repository scripts as actually available)

~~~bash
npm test
npm run typecheck
npm run lint
npm run build
~~~

If npm dependencies are unavailable in AI Studio, record the precise blocker and never claim tests passed. Do not introduce arbitrary new build tools just to satisfy an unverified claim.

---

## 14. Six-Cycle Iterative Refinement record

### Cycle 1 — Intent fidelity
Removed CRM, SEO vanity score, AI article-generation ambitions. Central focus remains editorial writing and safe publishing. Kept accepted original design.

### Cycle 2 — Information architecture
Rather than a sprawling SEO menu, retain slim right inspector and an optional deep audit page. No new unrelated dashboards; results must be reachable in one or two clicks.

### Cycle 3 — Correctness and evidence
Stopped "Complete" and "Verified" labels from overstating field presence, DOI syntax, alt text length, or SEO confidence. Introduced four honest states and separate check origins.

### Cycle 4 — Recovery and autonomy
Prioritized autosave reliability and proper user confirmation. AI acts only as suggestion engine; even batch fixes remain reversible and editor-approved. Kept fast draft workflow.

### Cycle 5 — Internationalization and search semantics
Separated UTC storage from localized human display, explicit scheduling zone, structured ISO metadata, advisory snippet length vs true errors, 3–6 tags as *house policy* only.

### Cycle 6 — Buildability and test gates
Reused current Next.js, Tiptap, IndexedDB and dashboard components; defined focused files, typed contracts, specific failure tests, no version upgrades, isolated demo boundary, A→E gates.

**Decision:** build V5-A first, then V5-B and V5-C. V5-D must not block local quality controls. Integration work remains a later explicitly authorized phase.

---

## 15. Completion report template for the implementing agent

Use this exact structure in the AI Studio completion message:

~~~text
ScientificRadar Studio — v5 Implementation Report
Base repository/ref:
Specification read: v4 master + v5 delta
Completed gates: [A/B/C/D/E with proof]
Changed files:
User-visible behaviors demonstrated:
Unit tests: command / passed-failed count / actual output
Typecheck: command / result
Lint: command / result
Build: command / result
Browser QA: routes, viewport sizes, hydration console results
Unverified or disconnected capabilities:
Known remaining risks/bugs:
Data or production changes: NONE (expected)
GitHub commit/reference:
Next safe action:
~~~

**No action involving a production website is granted by this specification.**

---

## 16. Source and implementation notes

- Existing authoritative master spec: `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md`.
- Current repository code: https://github.com/Centaurioun/scientificradar-studio.
- Earlier temporary UTC-only fix (review and reconcile; do not merge blindly): https://github.com/Centaurioun/scientificradar-studio/pull/1.
- Date display API: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat.
- Next.js hydration mismatch guidance: https://nextjs.org/docs/messages/react-hydration-error.
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide.
- Google title links and snippets: https://developers.google.com/search/docs/appearance/title-link and https://developers.google.com/search/docs/appearance/snippet.
- Google Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article.
- Google international/language pages: https://developers.google.com/search/docs/specialty/international/localized-versions.
- Google canonicalization: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls.
- Google image guidance: https://developers.google.com/search/docs/appearance/google-images.
- Tiptap existing rich text: https://tiptap.dev/.
- This doc is a project-specific change specification, **not** a claim that those external services have already been integrated.

**END OF V5 ADDENDUM — IMPLEMENT IN ORDER, PRESERVE THE EXISTING EDITORIAL DESIGN, AND KEEP THE PRODUCTION SITE UNTOUCHED.**
