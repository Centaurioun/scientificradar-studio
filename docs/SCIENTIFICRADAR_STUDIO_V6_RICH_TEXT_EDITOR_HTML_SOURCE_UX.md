# ScientificRadar Studio v6 — Scientific Rich-Text Editor, HTML Source Mode and Toolbar UX

> **For AI Studio implementing agent:** Read this document AND the two existing product specifications before changing the editor. Work on the existing Next.js project rather than rebuilding it.
>
> Repository: https://github.com/Centaurioun/scientificradar-studio  
> Branch used for Google AI Studio import: `main`  
> Document: `docs/SCIENTIFICRADAR_STUDIO_V6_RICH_TEXT_EDITOR_HTML_SOURCE_UX.md`  
> Related: `docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md` and `docs/SCIENTIFICRADAR_STUDIO_V5_EDITORIAL_QUALITY_PUBLISHING_UX.md`  
> Scope: **Article BODY editor only**, its title input and existing preview compatibility; preserve current ScientificRadar Studio layout.  
> Status: Implementation specification, **not evidence of deployed functionality**.  
> Priority: v6-A → v6-B → v6-C → v6-D, with hard verification gates.  
> Date: 2026-11-01.

## 0. User goal, product decisions and constraints

The owner writes/pastes complete scientific manuscripts themselves. The interface should provide comfortable, fast editorial formatting, precise inline scientific notation, semantic headings, tables/figures, article-body HTML inspection, and safe source editing. The **AI Assistant is not an author** and must not rewrite scientific claims. Preserve the widely approved ScientificRadar UI: wide Tiptap writing canvas, left collapsible navigation, right metadata inspector, teal-accented light/dark layout, Wikipedia hover links, existing SEO/publishing workflow.

Do not add generic CRM, page-builder clutter, font-picker chaos, or an overwhelming Word-style ribbon. Use **compact controls with intelligently grouped primary actions and a “More / Insert” menu**. The user explicitly dislikes the doubled “H₂ H2” / “H₃ H3” appearance. Keep title as the **sole rendered H1**, body headings H2 and H3 only.

**No accidental live changes:** never touch scientificradar.com, DNS, production CMS, published content or external provider credentials. Preserve demo-only noindex and disconnected integrations. Do **not** upgrade Node.js, Next.js, React, TypeScript, Tailwind, or existing package versions during this phase. Compatible narrowly scoped additional Tiptap extensions/sanitizer packages may be added only if necessary for these editor features, pinned to the project's Tiptap 3 version family and documented; do not initiate a general dependency upgrade.

**Existing v5 quality gate must remain intact.** Any body edit (WYSIWYG or HTML) must mark the manuscript dirty, use the verified persistence flow, invalidate stale SEO audits and trigger existing pre-publish checks where relevant.

---

## 1. Investigation of the actual current repository (verified before writing this spec)

Relevant current file: `components/editor/article-tiptap-editor.tsx`. The existing component already supports Paragraph, H2/H3, bold, italic, underline, strike, ordered/bullet lists, blockquote, link, figure picker request, undo/redo and basic Markdown paste. It does NOT expose text alignment, superscript, subscript, tables, editable HTML body source, horizontal rule in toolbar, in-text mathematical notation or a polished toolbar responsive overflow pattern.

**Confirmed visual defect:** the toolbar uses Lucide `Heading2` plus a second explicit `<span>H2</span>` and likewise for H3. Therefore the screenshot renders a double heading label. Fix by replacing separate heading buttons with a single Paragraph/H2/H3 style selector (recommended), or if keeping buttons, use either the icon OR the text, never both duplicated.

**Confirmed technical defect:** current editor initializes `StarterKit.configure({ heading: { levels: [2, 3] } })` **and** separate `Underline` and `LinkExtension` imports. **Tiptap v3 StarterKit already bundles Link and Underline**, creating duplicate extension-name warnings. Use ONE of these mutually exclusive approaches:
- Preferred: `StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false })` plus existing individually configured `LinkExtension` and `Underline`, preserving the current link security attributes; or
- Configure the bundled StarterKit versions and remove separate imports.
Do not use both simultaneously. Assert duplicate extension warnings have disappeared in browser console.

**Confirmed title usability issue:** current `components/editor/article-workspace.tsx` renders the article title as a `type="text"` input with large font. Long titles get horizontally clipped. Use a height-growing, full-width title textarea (or proven equivalent), with no H1 in Tiptap body.

**Confirmed HTML security boundary:** `sanitizeAndDemoteBodyH1()` in `lib/editorial-rules.ts` currently performs regex-based removals of dangerous HTML. Regex alone is inadequate as a security boundary for an **editable raw HTML source**. Expand to a parse/allowlist-based sanitization and enforce URL, node, attribute and style rules for all HTML input routes. Add adversarial tests.

**Current content storage:** `article-workspace.tsx` uses `bodyHtml` state and `onChangeHtml`; Tiptap exposes `getJSON()` but does not currently persist it as article's canonical store. **Do not silently change the repository-wide data model in v6.** Maintain existing sanitized body HTML persistence with schema-aware validation and reversible source-mode editing; a future JSON canonical migration may be planned separately. **Round-trip must prove no semantic loss** for supported structures.

---

## 2. Design alternatives considered (Six-Cycle brainstorming decision)

A. **Add 20+ buttons directly** to the current toolbar: straightforward but cramped, low usability on laptops and impossible on mobile. **Reject.**

B. **Replace Tiptap with another editor** (TinyMCE/CKEditor/BlockNote): large migration, loses validated H1, article metadata and existing popovers. **Reject.**

C. **Keep current Tiptap, use grouped controls and a safe HTML source mode:** minimal change to existing architecture, appropriate for scientists, scalable without clutter. **Select C.**

### Proposed toolbar hierarchy

**Primary row (always visible when space permits):**

`[Paragraph ▾] | [B] [I] [U] [S] | [x²] [x₂] | [Align Left ▾] | [• List] [1. List] | [Link] [Figure] | [Undo] [Redo] | [<> HTML]`

**More / Insert menu or second row only at wide viewports:**

`[Table] [Quote] [Horizontal Rule] [Inline Code] [Code Block] [Special Character] [Equation (if safely available)] [Source/Citation] [Clear Formatting]`

Do not show text and redundant heading icon simultaneously. The Paragraph dropdown options are:
- Normal text (Paragraph)
- Heading 2 — section
- Heading 3 — subsection

No “Heading 1” body option. If current selection is inside H2/H3, reflect that active style. Keyboard shortcuts should be familiar and discoverable with short labels/tooltips. Controls must provide `aria-label`, `title` / accessible tooltip, `aria-pressed` or selected state, and `disabled` when command cannot execute.

### Layout

- Toolbar must be **sticky relative to writing area** when scrolling a long manuscript where practical without obscuring focus.
- At 1440px it may wrap in **two organized rows**, never into random jagged fragments.
- At 1024px hide secondary labels and move overflow tools to **More**.
- At 390px use scrollable/grouped toolbar or overflow popover; HTML toggle remains reachable.
- Preserve the full-width writing canvas and existing right inspector/collapsible assistant drawer.
- Maintain readable body content measure (~70–95 chars per line); toolbar width need not equal manuscript text measure.
- No surprising toolbars covering scientific content or Wikipedia hover cards.

---

## 3. v6-A: extension hygiene, heading UI and long-title fix (first gate)

### 3.1 Clean duplicate extensions

In `components/editor/article-tiptap-editor.tsx`:

~~~tsx
// Illustrative Tiptap v3 configuration: adjust imports to installed exports.
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
    underline: false,
  }),
  LinkExtension.configure({
    openOnClick: false,
    HTMLAttributes: { rel: 'noopener noreferrer' },
  }),
  Underline,
  ImageExtension,
  Placeholder.configure({ placeholder: 'Write or paste the scientific article…' }),
];
~~~

Do not blindly copy this configuration if the existing package's actual API differs; confirm installed exports. Stop if duplicate names remain.

### 3.2 H2/H3 selector

Render one accessible style menu, not doubled icons. Example semantics:

~~~tsx
const styleOptions = [
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'h2', label: 'Heading 2' },
  { id: 'h3', label: 'Heading 3' },
] as const;

// Selection handler:
function applyBlockStyle(style: 'paragraph' | 'h2' | 'h3') {
  if (style === 'paragraph') editor.chain().focus().setParagraph().run();
  if (style === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
  if (style === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
}
~~~

Keep the single-H1 audit invariant, paste demotion and Tiptap heading levels restricted to [2, 3]. Avoid accidentally stripping quotation marks or scientific notation when converting heading levels.

### 3.3 Long title auto-growing field

Replace one-line title input with a full-width auto-growing textarea, retaining the exact article title state, role, required validation, existing autosave and title-derived H1 semantics. A title such as:
"Heralded Quantum Entanglement Sustained Across 78 Kilometers of Deployed Metropolitan Fiber"
must wrap to two or more visible lines, with no horizontal clipping at common viewport widths. Enter should not produce hidden newlines in a title; normalize pasted newline into a single space. Keep scientific characters (Greek, ±, en dash) intact.

A textarea is an **editorial field**; the preview/template still renders a single `<h1>` element.

### Gate A tests

- Duplicate `link`/`underline` extension-name console warnings absent.
- H2/H3 style selector changes only body heading levels 2 or 3.
- Pasted body H1 downgraded, one public-preview H1 remains.
- Long title visually wraps without truncation.
- Save/load unchanged title and body; v5 SEO and revision handling still work.
- Desktop and 390px mobile checked.

---

## 4. v6-B: missing standard rich-text and scientific tools

Add **actual schema support and round-trip preservation**, not merely toolbar buttons.

### 4.1 Text alignment

Add Tiptap `TextAlign` (extension package compatible with Tiptap 3), configure `types: ['paragraph', 'heading']` and allowed `['left','center','right','justify']`.

- Left is default for scientific article prose.
- Center/right are legitimate formatting options, especially for short lines and figure captions.
- Justify should be **available by explicit editor choice**, not globally applied; forced justification can harm readability, especially narrow mobile columns.
- In preview, alignment must persist after save/reload and from approved HTML source.
- Do not allow unsafe arbitrary `style=` beyond a strictly validated `text-align` attribute.
- Note: Firefox + `white-space: pre-wrap` can have justify interoperability issues; verify the chosen editor CSS and real browser behavior.

Example:

~~~ts
// Example only; verify installed extension API.
TextAlign.configure({
  types: ['paragraph', 'heading'],
  alignments: ['left', 'center', 'right', 'justify'],
});
editor.chain().focus().setTextAlign('center').run();
~~~

### 4.2 Superscript and subscript

Add standard open-source Tiptap `Superscript` and `Subscript` extension marks. Support:
- Superscript: `x²`, `10⁻⁶`, `m²`, footnote numbers.
- Subscript: `H₂O`, `CO₂`, `Ca²⁺` (charge and index together).
- Input selected text to `<sup>…</sup>` / `<sub>…</sub>` semantically; keep markup through save and reader preview.
- Prevent both conflicting marks on the same selected text segment unless explicitly intentionally supported; toggling one should unset the other if necessary.
- Use keyboard shortcuts only if they do not collide with existing shortcuts, with Mac/Windows hint mapping.
- These are inline notation tools, **not a substitute for proper equation typesetting**.

Examples expected round-trip:
~~~html
<p>CO<sub>2</sub> concentration was assessed at 10<sup>−6</sup> mol/L.</p>
<p>Surface area was measured in m<sup>2</sup> and water was H<sub>2</sub>O.</p>
~~~

### 4.3 Tables (prioritize scientific integrity)

Enable Tiptap table support with semantic `<table>`, `<thead>/<tbody>` where supported, `<tr>`, `<th>`, `<td>`.

- Accessible insert table dialog with bounded rows/columns (initial sane default 3 × 3).
- Header row toggle; add/remove row or column; remove table; optional merge/split later.
- No arbitrary table HTML pasted into source without schema check.
- Preserve numbers exactly, including decimals, scientific notation, minus signs and superscripts.
- Responsive article preview: horizontal scrolling *for the table only*, not whole page.
- Each table should support optional caption via safe extension or adjacent caption field; if caption is outside Tiptap schema, keep it as managed metadata.
- No arbitrary cell colors/fonts required.

### 4.4 Other low-cost core tools

- Horizontal rule `<hr>` from existing StarterKit.
- Inline `<code>` and code block `<pre><code>` for code/data examples; prevent code block from being treated as paragraph heading.
- Clear formatting **for selection only**, without erasing scientific content or links unless explicitly requested.
- Optional keyboard-insertable symbols menu with `±`, `µ`, `Δ`, `α`, `β`, `γ`, ```, `→`, `≤`, `≥`, `×`, `−`. Inserting Unicode symbols should preserve the characters precisely; do not auto-convert special notation ambiguously.
- Link button remains; provide link edit/removal, target, safe protocol validation, external new-tab attributes and internal-link same-tab defaults.
- Figure insertion should be labelled **Figure** and use existing Media Library workflow, rather than accepting arbitrary remote image HTML.
- Optional context bubble menu for selected text **only if small and does not duplicate the full toolbar**.

### 4.5 Scientific features to plan, not overbuild immediately

- **Equation support (P1 opt-in):** Tiptap Mathematics + KaTeX for LaTeX inline and block math (e.g. `E=mc^2`), only after verifying compatible package, security and render consistency. Do not buy premium conversions just to satisfy this.
- **Footnote/citation marker integration (P1):** link to existing ScientificSource ID, use robust reference numbering and accessible bibliography. Must not invent DOI or alter scientific claims.
- **Advanced figures (P1):** captions, credit/licence, consistent figure numbering, alignment and position lock. Preserve non-crop policy for plots, microscopic images, maps and data graphics.
- **Find/Replace within manuscript:** recommended early P1 for long articles, with highlight, scoped replacement, undo and no automatic scientific term substitutions.
- **Word/Google Docs clipboard paste:** preserve supported headings, links, list/table cells and sup/sub safely; no need for paid DOCX importer. Unsupported formatting yields a warning instead of silent disappearance.

### Gate B tests

- Alignment, subscript/superscript, tables, rules, code formatting survive refresh, preview and HTML export.
- Header cells and numeric values intact.
- Toolbar commands enabled and usable from keyboard.
- No breaking changes in Wikipedia popovers, Smart Knowledge Links, SEO heading hierarchy, image metadata or history.

---

## 5. v6-C: Article BODY HTML Source (editable and safe)

**User's exact intent:** A button lets them view and optionally edit **only the HTML of the article text body**. It must NOT expose the entire website document, navigation, React layout, server secrets, article title H1, SEO side panel, or admin shell.

### 5.1 Views

Provide explicit editor modes:

`[Visual Editor] [HTML Source]` (segmented toggle) or a small `</> HTML` button. Keep the control discoverable near toolbar right edge. 

When HTML Source is opened:
1. Snapshot the current visual editor document, active cursor/selection and current saved/draft revision.
2. Read editor body only: `editor.getHTML()`.
3. Show a **monospace editable code area** filling the normal writing canvas, not a tiny modal. Syntax highlighting optional; an accessible textarea is acceptable for P0.
4. Show **Copy HTML**, **Format**, **Validate**, **Apply Changes**, **Discard Changes** and **Back to Visual**.
5. Inform the user: "Article body HTML only. The H1 is generated from Article Title."
6. In source mode avoid autosaving a half-typed invalid tag or incomplete HTML. Maintain a *separate source draft buffer* until validated and approved.
7. Leaving source mode with uncommitted changes prompts **Apply / Discard / Cancel**.
8. Clicking Copy HTML copies sanitized/generated supported source, not unsanitized malicious code.
9. After safe Apply, mark the article dirty, route through normal v5 autosave and generate a recoverable revision checkpoint; any prior SEO audit becomes stale.
10. Reopening source view should show the canonical supported, sanitized markup of the applied article body.

### 5.2 Safety contract

This is not an arbitrary HTML/CSS/script editor. **Never** evaluate user HTML in the privileged admin origin.

Reject or safely remove scriptable content and unsafe attributes:
- Block: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<input>`, interactive custom elements, event handler attributes (`onclick`, `onerror`, etc.), `javascript:`, dangerous `data:`/`blob:` URLs, inline event/JS payloads, `srcdoc`, unauthorized `<svg>` active content, deceptive or non-HTTPS external embeds.
- Do not admit arbitrary inline CSS, dangerous `url()`, or unsandboxed iframes. Only normalized whitelisted text alignment plus recognized attributes from supported Tiptap nodes.
- Whitelist supported semantics: `p`, `h2`, `h3`, `strong`, `em`, `u`, `s`, `sub`, `sup`, `a` (safe attrs only), `ul`, `ol`, `li`, `blockquote`, `hr`, `br`, `code`, `pre`, `table`, `tbody`, `thead`, `tr`, `th`, `td`, and managed figures/images only if correct policy and existing media IDs.
- Never allow body `<h1>` to become a second rendered H1. In HTML mode propose or normalize H1→H2 with a clear warning.
- Restrict `href` to safe HTTPS or approved local routes; maintain `target="_blank" rel="noopener noreferrer"` for external editorial links and appropriate sponsored/ugc attributes when marked. Reject spoofed localhost/private IP URLs where active fetches are involved; there should be no arbitrary active remote fetching here.
- Don't use `dangerouslySetInnerHTML` on untrusted raw input. Where rendering sanitized body HTML is necessary, use the project security sanitizer and tests; concept previews require separate safe handling.
- **Regex-only sanitization (current `sanitizeAndDemoteBodyH1`) is not acceptable as the single security boundary for raw-editable HTML.** Implement parser/allowlist sanitization with browser + server-consistent behavior, backed by tests, and integrate it at paste, source apply, import, save, and preview boundaries.
- If no safe sanitizer can be implemented/verified with the constraints, launch **read-only HTML viewer** first and leave Apply disabled with an explanation. Never ship an insecure writable HTML editor.

### 5.3 No silent data loss / round-trip behavior

Tiptap/ProseMirror uses a schema. **Unsupported tags, unsupported attributes or figures may be dropped by HTML→document conversion**. Never use blind `setContent(untrustedHtml)` as if arbitrary HTML could round-trip losslessly.

Source Apply pipeline:
1. Keep original body HTML and Tiptap JSON snapshot for rollback.
2. Parse and sanitize edited source with strict allowlist.
3. Validate permitted node structure, nesting, safe URLs, embedded media references and the H1 invariant.
4. Parse into Tiptap document with the **same registered extensions as Visual mode**, using strict validation options where supported.
5. Serialize the parsed document back to HTML.
6. Perform **semantic** comparison for supported elements and attributes (normalize whitespace/HTML serialization differences). Detect dropped tables, `sup/sub`, links, citation markers, alignment, figure attributes and unsupported nodes.
7. If content would be lost, **block Apply** and show a human-readable diff: "Unsupported element X would be removed"; allow Discard, or explicit documented normalization if semantically safe and requested. Never silently throw away scientific data, numbers or references.
8. On valid Apply, run one atomic update to editor + parent article draft, with no loop or stale `useEffect` reset, and a revision checkpoint.
9. Run sanitizer and verification again at persistence and preview boundaries; client-only security is insufficient in production.
10. Test the article-body snippet (NOT complete document) end-to-end: visual → source → visual → save → reload → public preview → source.

Tiptap v3 `setContent` API example (API semantics to verify in installed runtime):

~~~ts
// Illustrative only; call after sanitization + schema validation,
// preserving the original document for rollback and diff.
editor.commands.setContent(sanitizedValidatedHtml, {
  emitUpdate: true,
  errorOnInvalidContent: true,
});
~~~

**Caveat:** `errorOnInvalidContent` alone does not guarantee lossless import of arbitrary HTML. The semantic round-trip test remains mandatory.

### 5.4 Separate source draft state (illustrative)

~~~ts
type BodyEditorMode = 'visual' | 'source';

type HtmlSourceSession = {
  baselineHtml: string;          // From editor.getHTML() at mode switch
  draftHtml: string;             // User input; never render directly
  baselineArticleVersion: number;
  dirty: boolean;
  validationErrors: Array<{
    code: string;
    explanation: string;
    location?: string;
  }>;
};

type HtmlApplyResult =
  | { ok: true; html: string; normalized: boolean; revisionCreated: true }
  | { ok: false; errors: HtmlSourceSession['validationErrors'] };
~~~

The actual app uses `bodyHtml` as its persisted article body; don't replace it with an incompatible payload or silently drop knowledge-link metadata. Source edits should produce the same `onChangeHtml` semantics that the current WYSIWYG editor does.

### 5.5 Intended examples

Safe accepted source snippet:

~~~html
<p>
  A concentration of CO<sub>2</sub> was measured at
  10<sup>−6</sup> mol/L.
</p>
<h2>Experimental Methods</h2>
<p style="text-align: center">Calibration spectrum</p>
<ul>
  <li>Control group</li>
  <li>Treatment group</li>
</ul>
~~~

Body H1 should be demoted with notice:

~~~html
<h1>Methods</h1>
<!-- Normalize to <h2>Methods</h2> in body; title stays the only H1. -->
~~~

Unsafe source must reject and not execute:

~~~html
<img src="x" onerror="alert(1)">
<a href="javascript:alert(1)">Click me</a>
<iframe src="https://untrusted.example"></iframe>
~~~

A table with unsupported colspan/rowspan or figure nodes must **not** lose structure silently when switching modes.

### 5.6 Save, exit and audit behavior

- Switching between modes must not create duplicate saved versions for unchanged text.
- Edited source is dirty even if the visual article is otherwise saved; this participates in navigation guard.
- Invalid source cannot be published, cannot be automatically saved as canonical body.
- Save Draft while source has uncommitted modifications -> show Apply / Discard / Cancel; no silent overwrite.
- Editing in source with HTML snippet containing links may affect SEO/link checks; mark audit stale and refresh after valid Apply.
- Show validation error inline; focus error position if feasible.
- Copying HTML does not mark the article dirty.
- Don't confuse `View HTML Source` with browser Developer Tools or site-wide rendered HTML.

### Gate C tests (mandatory before claiming source mode complete)

- Opening source mode returns only current body HTML, not site layout, H1 title, navigation or secrets.
- Visual round-trip with align, sub/sup, tables, links, lists, quotes and managed figures preserves meaning, values and supported structure.
- Apply safe code changes exactly one body paragraph and records a new recoverable version.
- Discard changes leaves original editor untouched.
- Unsafe script/events/javascript URL/iframe are blocked and never executed.
- Source H1→H2 normalization adds visible notice; only one rendered title H1 in preview.
- Unsupported markup detected and not silently stripped.
- Interrupted source edit, navigation and save failure do not lose text.
- Clipboard Copy HTML strips unsafe inputs and copies the confirmed supported source.
- Apply works across browser refresh and no hydration mismatch.
- SEO audit becomes stale only after a real successful content mutation.
- Mobile source mode doesn't make entire app horizontally overflow.

---

## 6. v6-D: scientific polish and optional advanced features

Once Gates A–C are complete and tested, implement optional elements based on usefulness, *not novelty*.

### 6.1 Useful next additions (recommended)

1. **Find & Replace** within article, scoped to editable body (avoid replacing in citations without user confirmation).
2. **Insert citation/source reference** using the existing article Sources tab; source records link to human-vetted DOI. No fictitious DOI.
3. **Special characters** relevant to scientific writing: Greek, degree, micro, mathematical operators and ± signs.
4. **Figure caption / attribution** editing next to actual figure placement; avoid auto-cropping scientific figures.
5. **Table navigation and keyboard support**; correct header semantics.
6. **Paste handling** for Word/Google Docs and Markdown, preserving supported scientific formatting and reporting dropped unsupported styles.
7. **Optional character/word counts** (already word count present), improved keyboard shortcuts (Cmd/Ctrl+B/I/U, etc.).
8. **Equation (KaTeX) editor** as a separate gated enhancement; distinguish formulas from simple sup/sub marks.
9. **Table of contents / heading outline** from H2/H3, only if articles are long enough.
10. **Article spellcheck language** matching `en`/`tr` locale; browser spellcheck is an immediate baseline, optional later dictionary service.

### 6.2 Explicitly not required now

- Do not add 30 font-family/size options, arbitrary text/background colors, stickers, animations, complex nested grids, premium DOCX conversion, real-time coauthoring, or third-party AI writing.
- Do not insert a second H1 or let HTML source bypass publishing checks.
- Do not auto-adjust scientific claims while "formatting".
- Do not introduce paid licensing without user approval.
- Do not introduce broad dependency upgrades just to add a toolbar.

---

## 7. Implementation slices with concrete file changes

### Gate A — correctness & visual clarity

**Files:** `components/editor/article-tiptap-editor.tsx`, `components/editor/article-workspace.tsx`; relevant existing unit tests and browser coverage.

- [ ] Add baseline console regression for duplicate Tiptap extensions.
- [ ] Remove duplicated extensions via one of the mutually exclusive StarterKit configurations.
- [ ] Replace double H2/H3 labels with one accessible style dropdown.
- [ ] Replace horizontally clipped title input with multi-line auto-grow control.
- [ ] Verify heading hierarchy, title, autosave and current SEO audit.
- [ ] Test desktop/mobile, light/dark.

### Gate B — basic rich text + science notation

**Files:** current Tiptap editor, centrally defined compatible extension list, renderer CSS/preview, and targeted tests.

- [ ] Add text alignment extension and accessible menu (left/center/right/justify).
- [ ] Add superscript/subscript extensions and mutual-exclusion behavior.
- [ ] Add table schema/commands, responsive preview and accessible header controls.
- [ ] Add horizontal rule, inline code, code block and clear formatting from supported StarterKit commands.
- [ ] Preserve link safety and existing media picker.
- [ ] Verify save/reload round-trip, Smart Knowledge Links, SEO heading checks.
- [ ] Keep dependency changes scoped, pinned and documented; do not upgrade preexisting framework versions.

### Gate C — article BODY HTML source

**Files:** `components/editor/article-tiptap-editor.tsx`, a focused `html-source-panel` component, parser/validator/sanitizer utility, relevant central editorial sanitizer and tests.

- [ ] Implement body-only View/Edit HTML mode.
- [ ] Support separate source draft buffer and Apply/Discard/Cancel/Copy.
- [ ] Replace regex-only trust boundary with schema-aware allowlist sanitization.
- [ ] Preserve heading/link/figure/sup/sub/table alignment through semantic round-trip verification.
- [ ] Snapshot revision on successful change, call normal persistence and invalidate stale SEO.
- [ ] Include malicious inputs and unsupported-node loss tests.
- [ ] If security or round trip cannot be validated, explicitly ship **read-only source** instead and document why.

### Gate D — optional high-value writing tools

**Files:** isolated editor extensions/controls as needed.

- [ ] Add text Find/Replace with undo.
- [ ] Add common scientific symbols menu.
- [ ] Add existing-Source-linked citation insertion workflow.
- [ ] Optionally plan equation editor, figures and full tables, but only after explicit testing and approval.
- [ ] Keep advanced tools in More/Insert; no toolbar overload.

### Suggested command verification

Run actual available scripts with real output; add targeted tests to `package.json` test coverage if needed without upgrading toolchain:

~~~bash
npm test
npm run typecheck
npm run lint
npm run build
~~~

Inspect the deployed *preview* (not scientificradar.com) at 1440×900, 1024×768 and 390×844; test editing, copy/paste, content round-trips, console, autosave and reader preview. Don't claim browser tests from code compilation.

---

## 8. Exact acceptance scenarios and falsifiable tests

**AT-V6-01:** Select "Heading 2" — one H2 command applies. Toolbar does not show duplicate `H₂ H2`. Body never allows H1.

**AT-V6-02:** Paste 120-character headline — it wraps in title field, no horizontal clipping, published preview contains exactly one `<h1>`.

**AT-V6-03:** Select paragraph; choose center then justify then default left. Save, reload, switch to HTML, back to visual: supported alignments persist or visibly report a normalized unsupported input.

**AT-V6-04:** Type "CO2" and format only "2" as subscript; type "m2" and format "2" superscript. Save, preview, open source and return: the `<sub>` and `<sup>` survive.

**AT-V6-05:** Create a 3×3 table with header row; edit numbers, add a row; page preview remains narrow-device readable without cropping numeric values.

**AT-V6-06:** Add horizontal rule and code block; both survive save/reload and do not pollute article heading SEO audit.

**AT-V6-07:** Toggle HTML mode; source contains only `bodyHtml` and no surrounding layout/title H1/SEO/tokens.

**AT-V6-08:** Modify one safe paragraph in source; validate/apply; corresponding visual paragraph changes; version checkpoint exists; autosave and audit staleness behave correctly.

**AT-V6-09:** Modify source, click Discard; original visual body is exactly preserved and remains clean if it was clean before the source session.

**AT-V6-10:** Paste `<script>alert(1)</script>`, `<img onerror=...>`, `javascript:` link and iframe in source; Apply blocks or safely strips with explicit warning and NO script execution; no XSS in preview or saved article.

**AT-V6-11:** Body source containing `<h1>Methods</h1>` is rejected or demoted to H2 with explicit notice; preview remains one H1 total.

**AT-V6-12:** Source contains unsupported custom element or media attribute. System detects would-be data loss, blocks Apply or requests informed explicit normalization; never silently deletes scientific figure/citation data.

**AT-V6-13:** During incomplete HTML typing, navigating away produces appropriate unsaved-change guard; does not overwrite canonical body.

**AT-V6-14:** Invalid source cannot be saved as canonical article; valid source remains recoverable after refresh.

**AT-V6-15:** Clicking Copy HTML copies only sanitized canonical body HTML; no modified article or dirty marker.

**AT-V6-16:** Existing Smart Knowledge Link popovers, Figure positioning/locks, DOI/source metadata and v5 SEO quality rules continue working.

**AT-V6-17:** Link insertion rejects unsafe URL schemes, uses correct new-tab handling for external URLs and preserves internal navigation.

**AT-V6-18:** Two same-name Tiptap extension warnings `link`, `underline` are absent in real browser console after cleanup.

**AT-V6-19:** Toolbar stays accessible and usable at 1440px, 1024px and 390px, in light/dark, by keyboard and touch.

**AT-V6-20:** AI disconnected is honestly reported; the rich text editor works fully without AI connection or network privileges.

---

## 9. Six-Cycle Iterative Refinement trace

### Cycle 1 — Purpose
User writes articles. Editor tools serve human scientific formatting, not AI generation. Retain Tiptap and approved newsroom layout.

### Cycle 2 — Cognitive load
Rather than a large Word ribbon or 20 buttons, use one block style selector, grouped icons, contextual menus and overflow controls. Fix doubled H2/H3 immediately.

### Cycle 3 — Scientific integrity
Added sub/sup for chemical/mathematical notation, table integrity, numeric preservation, link and citation restrictions. Math/DOI verification is not implied by a toolbar.

### Cycle 4 — Source-mode safety
Raw HTML is an attack and data-loss boundary: strict allowlist, schema round-trip, explicit Apply/Discard, revision snapshots and unsaved-source protection. Fallback to read-only if safety is not proven.

### Cycle 5 — Compatibility and performance
Keep Next.js/Tiptap major versions, preserve bodyHtml data model and media/SEO workflow. Minimal compatible new extensions, no full dependency upgrade or new editor framework.

### Cycle 6 — Evidence and phased delivery
Each of Gates A/B/C/D has exact tests and falsifiable failure conditions. Gate A first; source editing is NOT considered complete until tests pass. Never infer successful QA from screenshots alone.

---

## 10. Implementation agent reporting contract

~~~text
ScientificRadar Studio — v6 Editor Implementation Report
Reference docs read: master / v5 / v6
Branch and base commit:
Gates implemented: A / B / C / D
File changes:
Tiptap extensions before/after (including duplicate-name verification):
Toolbar UX and viewport evidence:
HTML body source mode: read-only or editable, validation controls:
Supported-node round-trip coverage:
Sanitizer and adversarial tests executed:
Autosave/revision/SEO regression checks:
Commands and real results: test / typecheck / lint / build / browser QA
Known limitations and incomplete functionality:
External provider changes: NONE
Production site changes: NONE
Next action:
~~~

**Never claim v6-C complete if HTML source editing can silently drop unsupported scientific content or execute unsafe markup.**

---

## 11. Reference documentation (technical, not development authorization)

- Tiptap 3 StarterKit (Link/Underline included): https://tiptap.dev/docs/editor/extensions/functionality/starterkit
- Tiptap TextAlign: https://tiptap.dev/docs/editor/extensions/functionality/textalign
- Tiptap Superscript: https://tiptap.dev/docs/editor/extensions/marks/superscript
- Tiptap Subscript: https://tiptap.dev/docs/editor/extensions/marks/subscript
- Tiptap TableKit: https://tiptap.dev/docs/editor/extensions/nodes/table
- Tiptap HTML source and JSON transformations: https://tiptap.dev/docs/editor/api/utilities/html
- Tiptap setContent: https://tiptap.dev/docs/editor/api/commands/content/set-content
- Tiptap Mathematics: https://tiptap.dev/docs/editor/extensions/nodes/mathematics
- Existing master and v5 documents under `docs/` remain authoritative for all outside-editor behavior.

**END OF V6 EDITOR SPECIFICATION — AUTHOR-CONTROLLED SCIENCE, BODY-ONLY SAFE HTML, TESTED ROUND-TRIPS, NO PRODUCTION CHANGES.**
