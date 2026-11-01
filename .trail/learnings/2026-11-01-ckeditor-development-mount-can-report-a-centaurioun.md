---
title: CKEditor development mount can report a React update-depth loop while production stays clean
author: Centaurioun
date: 2026-11-01
branch: audit/ckeditor5-runtime-forensic-2026-11-02
id: l-9ec16a96
scope: repo
status: active
src: agent
---

## Decided
Treat the observed maximum-update-depth condition as a confirmed CKEditor development runtime symptom, while keeping its exact trigger mechanism provisional. Do not generalize the development stack to production: three seeded article routes in the standalone production runtime showed no console/page errors.

## Tried and ruled out
A fresh browser context reproduced the stack at the external-content sync callback and parent `setBodyJson` path. A clean Tiptap context did not show the same error. Three different seeded articles mounted CKEditor in production without logged errors. These controls do not establish behavior for every article representation.

## Watch out
`ArticleWorkspace` constructs new `Set` and filtered-array props on render, and the CKEditor sync effect depends on those values. Its `onSyncJson` callback updates `bodyJson` state. This is a plausible feedback path, but this audit did not capture the exact runtime HTML inequality that causes the sync guard to continue. Keep the root-cause mechanism at medium confidence until that value is instrumented.

In the code:
- `components/editor/article-ckeditor.tsx:446-488`
- `components/editor/article-workspace.tsx:1024-1050`
- Audit report: `docs/audits/ckeditor5-runtime-2026-11-02/ROOT_CAUSE_ANALYSIS.md`
