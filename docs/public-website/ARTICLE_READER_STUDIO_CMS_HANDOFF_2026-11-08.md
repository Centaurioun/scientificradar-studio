# ScientificRadar Studio — Article Reader CMS Integration Handoff (docs-only)

**Date:** 2026-11-08  
**State:** DRAFT specification for owner/Codex review; **no Studio or Web application code modifications**.  
**Companion public Web PR:** https://github.com/Centaurioun/ScientificRadar-web/pull/54  
**Canonical cross-repo audit:** https://github.com/Centaurioun/ScientificRadar-web/blob/docs/article-reading-experience-three-phase-roadmap-20261107/docs/public-website/ARTICLE_READER_CODEX_READY_AUDIT_2026-11-08.md  
**Design standard:** https://github.com/Centaurioun/ScientificRadar-web/blob/docs/article-reading-experience-three-phase-roadmap-20261107/docs/public-website/ARTICLE_READER_DESIGN_SYSTEM.md  
**CMS/UI proposal:** https://github.com/Centaurioun/ScientificRadar-web/blob/docs/article-reading-experience-three-phase-roadmap-20261107/docs/public-website/ARTICLE_READER_CMS_EDITORIAL_CONTRACT.md

## 1. Two repos; one publication contract, not a repo merge

- **ScientificRadar Studio** (this repo): create/review/publish science editorial content and evidence metadata.
- **ScientificRadar Web** (`Centaurioun/ScientificRadar-web`): render a safely validated immutable publication snapshot.
- **Framer**: unpublished visual design laboratory. It is not the production CMS, does not save Studio records, and is not a replacement for existing article editing.

The owner requested standardization so editing another scientific article **never requires hand-coding a new page or asking AI to format it**. Studio editors choose and review content; the Web reader handles reusable fonts, A−/A/A+, alignment, TOC, figure modal, DOI references, related carousel, scroll/focus behaviors.

## 2. Read-only inventory verified on current main

- `lib/types.ts`: `Article` already has `title`, `dek`, `summary`, `editorialType`, `primaryCategoryId`, `categoryIds`, `tagIds`, `seriesId`, `authorId`, `sourceIds`, `featuredMediaId`, `bodyHtml`, status and SEO.
- `ScientificSource`: authors, journal, year, DOI, URL, type and verificationStatus, but **not full volume/issue/pages/articleNumber** as independent fields.
- `KnowledgeLink`: term, `targetType:'internal'|'wikipedia'`, targetUrl/targetArticleId, locale, title/excerpt/attribution, reviewStatus and demo flag. Reuse rather than making another dictionary.
- Media Library and Article editor already manage figures and rich content; investigate actual figure/table round-trip and rights gates rather than replacing them.
- `lib/publishing/web-contract-v1.ts` current serializer emits `relatedIds: []` even when Studio Series exists. Current version `1.0.0`; do **not** silently append fields to published snapshots.
- Web has `PublicArticle.relatedIds`, `PublicSource.doi`, `ArticleHeader`, `ArticleReader`, `RelatedStories`, `CitationList`, `CitationInteractions`. Adapt the existing consumer.
- Existing `bodyHtml` sanitization, figure/table/math source integrity, publish guards and URL validators must be preserved.

## 3. Proposed Studio editorial UI

Editor interface proposal (interactive demonstration, NOT connected):
https://framer.com/projects/Scientific-Radar--boKLyC3EXgf7Nhs9yoC7-3fySI?node=Kr4RQUn1q&view=preview

| Inspector group | Reuse current | New or clarified behavior |
| --- | --- | --- |
| **Article** | Headline, dek, author, category/subcategory, editorialType, Series, reviewed summary | One At a Glance from reviewed summary/takeaways; no second duplicate summary |
| **Contextual Key Concepts** | Reviewed knowledge entry records where helpful | Optional ordered 0–3 `{id,title,definition,afterHeadingId}`. Add, edit, remove. H2 anchor must exist and be **unique per concept**; preserve text editor heading IDs. No image, Why it matters or Key points fields. Desktop scroll states and mobile inline formatting are automatic reader behaviors. |
| **Knowledge Links** | Existing Wikipedia/internal KnowledgeLink records | Editor attaches a reviewed term to an explicit occurrence in article body. Internal target must be published; Wikipedia exact HTTPS URL and attribution validated. No network request on hover, and never confuse concept preview with scholarly citation. |
| **Evidence / Scientific Media** | Existing source IDs, MediaAsset fields and Tiptap content | Editor can insert multiple figures/tables with semantic captions, units, uncertainty, credit, license, rights status and source DOI. Validate actual editor ↔ bodyHtml ↔ published snapshot round-trip. |
| **Sources** | Existing ScientificSource | Optional verified volume, issue, pages, articleNumber and correction-of link for complete DOI bibliography. Publisher DOI belongs to research paper, NOT ScientificRadar editorial. |
| **What underpins this story?** | editorialType, verificationStatus, linked ScientificSource, reviewer notes | Generated source-transparency disclosure plus optional reviewed caveat. Never arbitrary peer-reviewed flag or fabricated trust score. |
| **Related Reading** | Series membership, category/tag and existing public relatedIds | Editor-approved ordered article IDs; use public-only Series fallback and reviewed category/tag matches. Exclude self, duplicate, draft, withdrawn, wrong-locale. Empty recommendations → hide section. |

**The Framer mock allows duplicate-H2 prevention in its local state, but that is NOT actual Studio validation.** Implement validators in the versioned editor/save/publish pipeline if owner later approves.

## 4. Publication contract transition — proposal, not code

Plan one backward-compatible, versioned producer/consumer migration. Do not change Web reader and Studio producer independently without compatibility tests.

Possible `VNext` optional published shapes (illustrative only, must reconcile existing schemas):
```ts
interface ContextualKeyConcept {
  id: string;
  title: string;
  definition: string;
  afterHeadingId: string; // existing unique canonical H2 ID
}
interface SourceCitationExtras {
  volume?: string;
  issue?: string;
  pages?: string;
  articleNumber?: string;
  correctionOfSourceId?: string;
}
interface ArticleReaderSnapshotExtras {
  contextualConcepts?: ContextualKeyConcept[];
  knowledgePreviews?: Array<{ occurrenceId:string; targetType:'wikipedia'|'internal'; href:string; title:string; excerpt:string; sourceAttribution:string }>;
  series?: { id:string; title:string; slug:string };
  evidenceNote?: string;
  relatedIds: string[]; // already in PublicArticle; producer fills only approved public destinations
}
```

Constraints: allow older snapshots to render, use explicit schema version and parse/validation at both ends, sanitize user-provided text, validate URLs and DOI normalization, resolve public IDs to valid canonical slugs, check demo flags/publication status and image rights; prevent draft data leakage.

## 5. Prioritized Codex tasks when user's allowance resets

**Read-only investigation first, not auto-implementation.**

1. Inspect Studio current main, this doc, companion Web PR #54, and source snapshots under Web `docs/public-website/framer-reference/`. Report drift and duplicate implementation risk.
2. Verify existing Studio UI's exact capability to add/edit figures and tables, review MediaAsset rights, attach bibliography, and use Knowledge Links; do not infer end-to-end behavior merely from TypeScript types.
3. Define and testable-design an Article Insights / Contextual Key Concepts editor: stable H2 IDs, no duplicate anchors, handling deleted headings/reordering, editorial approval and locale.
4. Address `relatedIds: []` serializer gap in an owner-approved future implementation plan, including visibility filtering and Series mapping; don't show made-up draft recommendations.
5. Plan full DOI bibliography metadata and correction support across Studio source types and Web citation component with validation.
6. Propose a split Studio/Web PR sequence with migration, unit/contract/security/E2E tests; prioritize existing components and incremental compatibility.

### Explicit acceptance gates for eventual implementation

- **No AI dependency for ordinary editorial authoring**.
- Draft/publish/withdrawal visibility respected in all public previews and related links.
- No fabricated bibliographic identifiers or hidden third-party rights problems.
- Table units, sample-specific denominators, scientific figure captions, DOI attribution persist through save/reload and publish-to-Web.
- Both desktop and mobile reader show 0/1/2/3 concepts correctly without forcing a sticky panel to remain visible after the relevant science section.
- Real browser keyboard, touch, hover, reduced motion, hash/history and performance checks occur **after** real implementation; Framer static screenshots are not proof.

## 6. Current work boundary

- Only this documentation file is part of the Studio branch/PR.
- No app components, schema, tests, backend, editor data, production site, deployment, Framer publish or GitHub merge were changed.
- Pending owner authorization: Studio and Web application implementation in separately reviewed future PRs.

**Do not merge this docs PR or treat it as authorization to implement.**
