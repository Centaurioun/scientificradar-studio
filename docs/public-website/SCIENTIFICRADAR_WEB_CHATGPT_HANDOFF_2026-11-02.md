# ScientificRadar — ChatGPT Continuity Handoff: Studio + Standalone Web

**Date:** 2026-11-02 (Europe/Istanbul)
**Document type:** Conversation handoff / decision record, not an implementation order.
**Canonical storage:** Centaurioun/scientificradar-studio, under docs/public-website/.
**Main context:** The previous AdminPanel conversation was titled “Belgeyi Okuma Onayı” and reached the ChatGPT conversation-length limit.
**Previous chat URL:** https://chatgpt.com/g/g-p-6ae62c58414481918f1cb682e5197a4d-adminpanel/c/6ae79c34-a5dc-83eb-ae21-98c555587692

> **FIRST-RESPONSE CONTRACT FOR THE NEXT CHATGPT SESSION:** Read this entire handoff and the linked primary documents before making proposals. Briefly acknowledge in Turkish that ScientificRadar Studio and ScientificRadar Web are separate, summarize the current open-PR/conditional-accept situation, and say that you can continue. Do NOT invent missing messages from the inaccessible prior chat. Do NOT automatically create a new prompt, PR, code change, integration, deployment, or merge. Wait for the owner's next concrete question.

## 1. Provenance, evidence standard and deliberate limitation

This handoff was reconstructed on 2026-11-02 from (a) earlier conversation context, (b) the earlier 2026-11-01 Studio handoff, and (c) the directly retrieved GitHub files, PR metadata and latest repository commit records. The previous chat was visible as an open browser tab, but the browser host blocked access to ChatGPT tab *message contents*. Therefore this is an evidence-based reconstruction, NOT a verbatim export of the entire old conversation.

**Evidence tiers:**
1. **Verified GitHub metadata/content (2026-11-02):** Repository identity, main branch, PR statuses/head SHAs, content of the PR #2 audit and the Studio website specs.
2. **Previously documented owner decisions:** Architecture, preferred tools and visual choices documented in the old handoff and public website blueprint.
3. **Open / not verified:** Whether new browser-side or AI Studio work occurred after those GitHub snapshots, exact complete last message from the blocked chat, production deployment state, and locally saved screenshots that are not in GitHub.

**Never upgrade** a plan, self-reported sandbox success, old screenshot or local-only test into a fresh independent production acceptance. Before any action, re-read current remote branch SHA and relevant changed files.

## 2. Product map: two distinct repositories, not one monolithic app

### A. ScientificRadar Studio — admin/editorial CMS
- GitHub: https://github.com/Centaurioun/scientificradar-studio
- Existing AI Studio app: https://aistudio.google.com/app/u/1/apps/4792ee46-2342-45a3-ae8e-3a88787826c5?showPreview=true&showAssistant=true
- Purpose: article-centered scientific editorial CMS, taxonomy, author/editor workflows, scientific rich-text editing, references, figures, math, media, SEO and editorial publishing workflow.
- Current architecture described in prior handoff: Next.js 15, React 19, TypeScript, Tailwind 4, Tiptap/ProseMirror, IndexedDB, DOMPurify. CKEditor 5 and Math were being evaluated as a reversible editor candidate; do not falsely say Studio's editor has already been replaced.
- Existing Studio handoff: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/SCIENTIFICRADAR_STUDIO_CHATGPT_HANDOFF_2026-11-01.md
- Existing Google AI Studio implementation playbook: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md
- Prior outstanding reliability questions include Issue #14 persistence receipts/transaction coverage, editor JSON-vs-HTML preservation, scientific math fidelity, and unverified real external integrations. Refer to the earlier handoff and **recheck the newest code** rather than assuming these are still unresolved.

### B. ScientificRadar Web — separate public reader-facing website
- **Actual verified new repository:** https://github.com/Centaurioun/ScientificRadar-web (case-sensitive as linked).
- Actual Google AI Studio app URL: https://aistudio.google.com/app/u/1/apps/1f3779af-b55b-4275-84c1-57a4b9eccfb8?showPreview=true&showAssistant=true
- Purpose: original scientific magazine website and long-form article reading UX, not a replacement admin panel and not the existing production site.
- Source design authority: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/public-website/SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md (v2.1).
- Original AI Studio implementation mission: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/public-website/GOOGLE_AI_STUDIO_NEW_WEB_APP_MISSION_2026-11-02.md (v1.1).
- Implementation-reported build audit in Web main: https://github.com/Centaurioun/ScientificRadar-web/blob/main/docs/WEBSITE_BUILD_AUDIT.md
- The new repository was created and contains a real Next.js App Router + React + TypeScript app, with actual article fixture/routes. Thus the older website blueprint statements saying “no built website yet” are **historical pre-build statements**, not the current status. Preserve the original approval decisions, but update status from the Web repository and its independent audit.
- No confirmed live publishing/data connection from Studio's IndexedDB to Web. Do not invent one. Production domain/DNS, authentication, cloud storage and advertising integrations are deferred unless explicitly approved.

## 3. Owner-approved ScientificRadar Web visual/UX baseline

Preserve rather than casually redesign:
- Warm neutral/paper background **#FAFAF8**; Merriweather editorial typography, Inter for navigation/interface/metadata; calm credible science magazine visual language.
- Original ScientificRadar branding, restrained teal, good whitespace; Knowable Magazine as the primary visual *inspiration*, Quanta Magazine for scientific long-form reading, and Nature for authentic scholarly metadata conventions. Do not scrape/copy their images, logos, CSS, article text or layouts pixel-for-pixel.
- Compact Cover hero is the desired homepage default; Standard Cover must remain selectable at **/?hero=standard**. Avoid an oversized fixed hero.
- Preserve approved first-paragraph drop cap, equation card styles, references, captions, scientific figures/tables, original illustrative SVG assets, and existing type/content hierarchy.
- Article reading measures include 700/600/560 variants for comparison. Final widths require actual rendered measurement; labels in controls are not proof of effective CSS widths.
- Real category links and separate chevron disclosure buttons; accessible keyboard focus/Escape behavior, mobile accordion/drawer, functional search/topic links, proper 404.
- Scientific article semantics: main > article, exactly one H1, logical H2/H3, figure/figcaption, verified sources, honest demo notices, no fabricated DOI, author credentials, scientific licenses or peer-review claims.
- Safe canonical HTML, citations/source IDs, figures/media rights, mathematical TeX, scientific tables and accessible KaTeX/MathML representation are strategically important. Web's demo renderer is not automatically the final lossless Studio HTML publishing adapter.
- The user wants real visible and interactive improvements, not just another design audit. Do not discard already accepted visuals in favor of generic dashboards.

## 4. Verified GitHub state on 2026-11-02

**ScientificRadar Web main baseline:** 41a73b49f69c1310eca819d1ad2cdb1c712da89a (verified from latest main commit search and PR base).

**PR #1 — OPEN, not merged, not draft:**
https://github.com/Centaurioun/ScientificRadar-web/pull/1
- Title: “fix(web): harden scientific reader, add KaTeX, default compact hero”.
- Branch: fix/reader-foundation-compact-default-2026-11-02.
- Latest retrieved HEAD: **7fd59800d9305e2b39364e4989d2bf1ecff942bb**.
- Replaces regex-only sanitizer with parser-backed DOMPurify restrictions, adds controlled KaTeX, makes compact hero default and retains Standard query override. PR body references successful static/unit/build CI for an earlier commit; independent audit refers to the later exact head.
- The PR is open: do **not** call this code merged, deployed or accepted for production.

**PR #2 — OPEN/DRAFT, not merged:**
https://github.com/Centaurioun/ScientificRadar-web/pull/2
- Title: “docs(qa): independent acceptance audit for ScientificRadar Web PR #1”.
- Branch: codex/pr1-acceptance-report-2026-11-02.
- Latest retrieved HEAD: **4fa9bb6e91cc1fe3b0e9337d0a7471cb2c67d65d**.
- Changed-file list: documentation-only audit at docs/qa/SCIENTIFICRADAR_WEB_PR1_ACCEPTANCE_REPORT.md.
- Source of the decision: https://github.com/Centaurioun/ScientificRadar-web/blob/codex/pr1-acceptance-report-2026-11-02/docs/qa/SCIENTIFICRADAR_WEB_PR1_ACCEPTANCE_REPORT.md
- **Verdict: CONDITIONAL ACCEPT for PR #1 exact head**, not unconditional merge authorization. No app code changes are in PR #2.

## 5. Independent PR #2 audit — do not lose or overstate these findings

**Evidence reported in audit:**
- Candidate lint, TypeScript, **14/14 unit tests** and Next production build passed in local checked worktrees.
- Candidate served **25/25 route × viewport test requests at HTTP 200** in its stable matrix.
- Compact default and /?hero=standard override work; approved color/font/first-paragraph drop cap persisted.
- KaTeX HTML + accessible MathML visible on representative article routes; basic DOMPurify synthetic Node probes passed.
- These are constrained checks, not a production release certificate or exhaustive accessibility/security/browser QA.

**RESP-01 — P1, pre-existing:** Two scientific article routes have a **1248px document width** at tablet/mobile viewports (1024, 768, 390, 320). The 1200px scientific figure asset/container overflows from a left offset; the defect was also reproduced on main and is **NOT a PR #1 regression**. Correct responsive figure sizing/container behavior with real measurements; do not camouflage by setting global overflow-x: hidden. This matters to scientific reading quality.

**PERF-01 — P2, PR-introduced:** Article JS route budget rose from approximately **5.86KB to 94.5KB** and first-load JS **120KB to 209KB** following KaTeX integration, an approximately 89KB addition. Establish owner-approved performance threshold or reduce/lazily partition before claiming the cost is acceptable. Bundle-size deltas are not equivalent to measured user-device loading times.

**REPRO-01 — P2:** npm lockfile is not committed; CI uses npm install rather than frozen npm ci. Different dependency resolution can change the installed packages across runs.

**Unverified:** Comprehensive keyboard Tab/Enter/Space/Escape and focus restoration; browser-based XSS injection, sanitizer fuzz, advanced/nested/invalid/oversized TeX browser cases; screen readers, contrast and full WCAG; full screenshot source/artefact upload; article 700/600/560 effective reading width on all breakpoints; real mobile device performance. Report explicitly says its screenshots were stored **only in /tmp/scirad-pr1-evidence/** and are not GitHub artifacts.

**Decision boundary:** PR #1 is **CONDITIONAL ACCEPT**, not FAIL and not unconditional ACCEPT. No verified P0 or PR-introduced P1 at that exact HEAD; pre-existing responsive defect still urgently affects public reading. New HEAD requires new audit.

## 6. Two workflow modes — maintain the owner's distinctions

### Google AI Studio implementation
The owner uses Google AI Studio's **working sandbox** and its preview, then can export code **directly to GitHub main**, without a PR. In the Studio repo, GitHub CI previously used pull_request-only triggering, so an AI Studio direct push may not trigger hosted CI. Do not characterize absence of CI as failed sandbox compilation; equally do not call a successful preview a complete security/E2E/data-integrity acceptance.

For the public Web app, it is a SEPARATE AI Studio app and a SEPARATE repository. Before future sync/import/export, verify which repository and SHA the sandbox is using. Never overwrite Studio's main with Web or vice versa. Existing Web PRs could become stale when main is directly changed; explicitly rebase/re-audit when applicable. The user prefers substantive implementation to happen in Google AI Studio where appropriate, with comprehensive **repository-local Markdown task documents**, rather than vague issue-only pointers.

### Codex / independent review
Use Codex for genuine independent, evidence-based read-only source/browser evaluation when the owner requests it. Prior explicit requirements include verified remote code, real local browser interactions (Brave/Playwright), clicked flows, screenshots, and an auditable findings register. A documentation-only Draft PR can be used if requested; that is not permission to edit app code or quietly merge it. Do not repeatedly commission reviews with no implementation progress.

### Anti-Gravity Teamwork / Argon
Earlier in the longer AdminPanel workstream, the owner planned to exploit a limited Antigravity Gemini Argon allowance using **Teamwork**, with Argon as coordinator and cheaper agents for bounded execution. They wanted Superpowers brainstorming, independent website improvement analysis and six-cycle iterative refinement before implementation. This is a **historical workflow preference**, not proof any remaining model quota or a pending Teamwork session exists on 2026-11-02. When asked to resume Teamwork, verify the current task and time budget first rather than restart old analyses automatically.

## 7. Studio editor work retained as context, not a Web change request

The separate Studio project includes an existing Tiptap-based scientific editor. The owner wishes to examine professional CKEditor 5 and their own CKEditor Math source fork:
- Core: https://github.com/Centaurioun/ckeditor5
- Math: https://github.com/Centaurioun/ckeditor5-math
- The previous handoff records source-copy/staging and legacy test-porting questions, CKEditor 5 licensing considerations, and a reversible approach rather than assuming a completed migration. Do not transplant editors into the public Web reader.
- Important long-term Studio behavior: exact H1/H2/H3 rules, scientific citations, safe HTML source, source traceability, media rights, durable publishing, taxonomy, SEO preflight and non-destructive AI suggestions.
- If the owner switches back to Studio implementation, first read the comprehensive **2026-11-01 Studio handoff** and latest Studio main. Do not use the Web PR audit as evidence for Studio editor acceptance.

## 8. Recommended resumption protocol — not automatic execution

1. **Listen to the owner's next instruction first.** The previous-chat URL is context, not a command to scrape inaccessible ChatGPT messages.
2. Identify whether the requested work is **Studio admin/editor**, **Web reader**, or **cross-app integration planning**.
3. Check actual current repository main SHA, open PR statuses, latest modified files and newest applicable audit; identify any post-handoff drift.
4. For Web: retain visual approvals; call out RESP-01, PERF-01, REPRO-01 and unverified accessibility/security gaps. If directed to implement, create a bounded change proposal, preferably in the owner's chosen AI Studio workflow, avoiding unexpected unrelated redesign and auto-merges.
5. For Studio: preserve existing editor/data and consult the earlier handoff; do not assume Tiptap replacement or production integration is done.
6. Produce precise **VERIFIED / IMPLEMENTED-BUT-NOT-TESTED / PARTIAL / DEFERRED / UNKNOWN** status labels and SHA-linked evidence.
7. On any new work, document exact SHA, browser/device viewports, commands/tests and results. Do not claim a Six-Cycle code test just because a written report has six review sections.
8. Never modify production domains, DNS, external paid APIs, Cloudflare, AdSense, publisher content, or merge PRs without explicit authorization.

**Potential next subject, NOT an instruction:** The owner may want to decide how PR #1's conditional acceptance should be resolved and where RESP-01/mobile figures, KaTeX performance and lockfile tasks belong; or may instead return to Antigravity design work. Do not force a decision before hearing the next message.

## 9. Primary evidence index

- Previous Studio handoff (most comprehensive admin/editor context): https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/SCIENTIFICRADAR_STUDIO_CHATGPT_HANDOFF_2026-11-01.md
- Public Web design blueprint v2.1: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/public-website/SCIENTIFICRADAR_PUBLIC_WEBSITE_DESIGN_BLUEPRINT_2026-11-02.md
- Web AI Studio build mission v1.1: https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/public-website/GOOGLE_AI_STUDIO_NEW_WEB_APP_MISSION_2026-11-02.md
- Web build audit (self-reported initial build evidence): https://github.com/Centaurioun/ScientificRadar-web/blob/main/docs/WEBSITE_BUILD_AUDIT.md
- Web PR #1 code and metadata: https://github.com/Centaurioun/ScientificRadar-web/pull/1
- Web PR #2 source-linked independent acceptance report: https://github.com/Centaurioun/ScientificRadar-web/pull/2
- Original previous chat URL: https://chatgpt.com/g/g-p-6ae62c58414481918f1cb682e5197a4d-adminpanel/c/6ae79c34-a5dc-83eb-ae21-98c555587692

## 10. Superpowers-style brainstorming and six-cycle editorial refinement ledger

This is **a documented six-pass critical review of the handoff content**, not a claim that the Superpowers tool or six automated code/browser runs executed during this handoff.

1. **Scope discovery:** Separate Studio admin/editor, Web public reader and future integration. Prevent the historical Studio handoff from being misapplied to the new repo.
2. **Evidence reconciliation:** Resolve the old blueprint's “no built website” phrasing against the newly created Web GitHub repository and build audit; date the facts and source them.
3. **Ownership and design constraints:** Preserve paper/serif/caption/figure/drop-cap hero approvals, original copyright-safe content, and the owner's AI Studio direct-main workflow.
4. **Adversarial defect review:** Keep exact PR base/head and conditional status; distinguish inherited 1248px overflow from PR-added JS cost and unfrozen install; retain omitted browser security/a11y tests.
5. **Continuity usability:** Put an explicit read-first order, two-repo map, verified links, and a first-response contract so the next ChatGPT does not immediately flood the owner with a generic new task list.
6. **Final uncertainty audit:** Mark chat tab text unavailable; omit invented final user decisions and remaining Argon quota; disallow silent merges, deployment and unverified PASS labels; require refresh on next turn.

**Review output:** Documentation-only context bridge. This handoff does not change any application source, PR, production environment or user configuration.

## 11. Suggested short prompt for a new ChatGPT conversation

Read this entire GitHub handoff and the linked primary documents, including the 2026-11-01 Studio handoff and the Web PR #2 independent acceptance audit. Understand both projects, the owner's decisions, PR #1 CONDITIONAL ACCEPT and the exact open issues. Do not make changes or draft a new implementation prompt yet. Respond briefly in Turkish that you have read the context and are ready for my next question.

**Read this document first:** https://github.com/Centaurioun/scientificradar-studio/blob/main/docs/public-website/SCIENTIFICRADAR_WEB_CHATGPT_HANDOFF_2026-11-02.md
