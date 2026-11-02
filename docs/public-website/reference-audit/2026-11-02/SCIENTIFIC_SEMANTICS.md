# Scientific semantics, sourcing and figure practice

## Quanta page evidence

The inspected article DOM had one H1, 10 H2s, 7 H3s, 12 `figure` elements and 10 `figcaption` elements. Four links in the article/main subtree matched a DOI URL pattern (`doi.org`); the sampled metadata keys included article published/modified time but no DOI-named metadata field. This confirms only that matching links and metadata keys were present in that browser DOM. It does not validate DOI resolution, source accuracy, peer review, references' completeness, figure rights, alt-text quality or the external destination content.

The browser pass retained counts, link hostnames, and element lengths rather than article body text. Figures were counted structurally; the labels and rights/license records were not copied. The page had many linked references but this audit did not judge the scientific validity of any paper.

## Knowable and Nature

Knowable's article could not be inspected behind the security verification response. Nature was optional and not visited. No statement here attributes Quanta's semantics to either site.

## ScientificRadar recommendations (original design advice)

- Keep story kind explicit: science news, explainer, feature, or research digest. Do not imply primary research or peer review for a journalism piece.
- Model sources as linked records with title, destination URL, publisher/author where supplied, publication date when known, and DOI only if authentic. Preserve stable `sourceId` values and allow repeated references.
- Model every figure with a stable media identifier, alt text, caption, creator/credit, rights/license verification state and source. Never infer permission from public visibility.
- Permit full-width/bleed figures while keeping prose at a controlled reading width; ensure mobile media remains fluid and a caption remains attached.
- Preserve headings as a single title H1 with an ordered H2/H3 outline; optionally provide a contents index for long reads.
- Display transparent update/publication dates and primary-source links where genuinely available. Use DOI claims and structured metadata only from verified editorial data.

These are **RECOMMENDED**, grounded in the owner's approved blueprint and the bounded Quanta DOM observations; they are not statements that Quanta or Knowable meet an external publication standard.
