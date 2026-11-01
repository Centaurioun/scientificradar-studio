# ScientificRadar Studio — Editor Experience Research HOLD

**Status:** Research reference and reported usability observations. **NOT** authorization to replace the editor or launch a second editor rewrite. Continue the remaining scientific publishing completion work separately.

## What the owner actually experienced

1. `Insert Table` instantly adds a populated/example-looking table, rather than a genuinely blank clear table.
2. Contextual `Add Row` / `Add Column` controls show briefly then disappear, preventing understandable table editing.
3. Grid boundaries, cell selection and visual affordances are unclear compared with the Filament demo.
4. Code-block insertion/editing seems unreliable and requires reproduction.
5. Symbols are acceptable for now; other scientific features are partly present and should be completed first.

## Reference environments

- Our AI Studio app (may require authenticated user session): https://aistudio.google.com/app/u/1/apps/4792ee46-2342-45a3-ae8e-3a88787826c5?showPreview=true&showAssistant=true
- Filament sample editor: https://demo.filamentphp.com/blog/posts/74/edit

Browser tab inspection confirmed that Filament exposes Table, contextual column controls and actual table cells; its documented editor is **also Tiptap**:
- https://github.com/filamentphp/filament/blob/4.x/packages/forms/docs/10-rich-editor.md
- https://tiptap.dev/docs/editor/extensions/nodes/table

**Critical distinction:** Filament is a PHP/Laravel admin product, NOT a drop-in React component. The underlying rich-text editor tech is Tiptap. Comparing the framework stack and editor-level UX separately avoids an unnecessary Next.js rewrite.

## Authorized now vs held for independent comparison

**Authorized now:** fix broken table controls/selection, insert truly empty tables, make borders/cells/caption legible, repair broken code-block behavior and test round-trips. Keep current Tiptap architecture unless a small, verified extension replacement is needed for basic correctness.

**HELD:** selecting a replacement rich-text engine, adopting an entire new toolbar design, migrating all saved JSON/HTML, switching to a paid plugin or product. Another independent ChatGPT will research community adoption, maintainers, table UX, mathematical editing, citations, migrations, licensing and Reddit/GitHub feedback. Do not preempt its findings.

## Future research acceptance questions

Compare Tiptap official TableKit vs the custom `lib/editor-extensions.ts` table engine, plus alternatives such as CKEditor 5, TinyMCE, Lexical, Plate/Slate, ProseMirror ecosystem, BlockNote, Milkdown and scientific-document tools where justified. Evaluate actual community usage, project health, licensing, plugins, security, migration cost and demonstrable UX, not just star counts or marketing claims. Request one primary recommendation and one fallback, with a proof-of-concept only after explicit owner approval.

Do not falsely describe the Filament demo as proof that its exact interaction component can be transplanted unchanged into a Next.js/Tiptap project.
