# Scientific Article Rendering

## What the captured Quanta article establishes

The sample is a long-form science story rendered inside `main > div.post`; it has one H1, eight H2s, seven H3s, 52 paragraphs, 12 figure nodes, seven figcaptions, two videos, 13 images, five asides in total, and multiple embedded frames. Counts describe the selected article DOM and include nested media wrappers; they are not a site-wide template guarantee. No article copy or imagery is reproduced here.

The reading measure is the strongest reusable structural finding: a 688 px section includes 64 px of horizontal padding on each side, leaving a 560 px prose column at desktop and tablet. At 390 px the section uses 20 px gutters and leaves 350 px for prose; at 320 px it leaves 280 px. Prose measured 16 px Merriweather at 30 px line-height. These are observations for that story and font environment, not ScientificRadar's mandatory tokens.

## Metadata, author and citations

- The HTML includes article Open Graph metadata. The runtime sample contained four links whose host is `doi.org` and 34 external links total within the post. This shows DOI-bearing source links; it does not show a dedicated reference section.
- A single ordered list exists in the post, but its use as bibliography was not verified. The exact mapping of in-text claims to the four DOI links was not audited.
- The DOM scan found no `<time>`, `<address>`, `[rel=author]`, or author/date `itemprop` selectors. Author and date information may be shown as ordinary text, but this sample is not a good semantic template for publication metadata.
- Recommendation/category and comments sections follow the article body; a next-story panel precedes the footer.

For ScientificRadar, make metadata explicit and structured: canonical URL, title, description, author records, publication and update dates with ISO `datetime`, topic, reviewed status only when verified, DOI/citation URL, and rights/source fields. Never fabricate affiliation, peer review, DOI, dates, or sources.

## Figure and media model

The page interleaves figures, images, video, and iframes with text. Captions exist on seven of twelve `<figure>` nodes in the captured DOM; at least some figures lack `figcaption`. Preserve role distinctions rather than copying that inconsistency:

- Use `<figure>` only for content that is a self-contained illustration, diagram, chart, or media item.
- Put a concise explanatory caption in `<figcaption>`; keep source and rights attribution as separate structured display fields.
- Provide meaningful `alt` text for informative images and empty `alt` for decorative ones. Do not convert a caption into an alt string automatically.
- Use a responsive image component with intrinsic dimensions, width/height or aspect ratio, `srcset`/`sizes`, and lazy loading below the fold. Keep the LCP/lead image eager only if it is genuinely above fold.
- Use a poster and explicit consent/loading behavior for external video. Do not embed an iframe solely because the reference did.
- For charts, include a short text summary and a nearby data table or accessible equivalent when the chart encodes important values.

## Long-form readability specification

1. A single H1 followed by ordered H2/H3 headings; do not skip levels for visual styling.
2. Article prose target 680–720 px maximum measure as specified in blueprint v2.0; a 65–75 character line length is a heuristic to validate with the chosen font and actual content.
3. Body size 17–19 px with 1.65–1.75 line-height, using licensed self-hosted fonts. Reference's 16/30 is a measured comparator, not the target.
4. Keep figures wider than prose where useful, but cap them within the site shell and avoid layout shift using known dimensions.
5. Provide a structured citation/ref list where the editor has authentic sources; link DOIs using their actual DOI URLs and include access date only when the data source requires it.
6. Tables must preserve header associations and offer a labelled horizontal scroll region on narrow screens; do not let the whole document overflow.
7. Author panel, references, related reading, and update history need meaningful headings and programmatic names.
8. Support keyboard access to figures that open detail views, embedded media controls, inline citations, footnotes, and bibliography backlinks.

## Accessibility observations and caveats

This was a DOM/layout inspection, not a WCAG audit. The absence of semantic author/time elements and inconsistent figure captions are concrete inspection findings; they do not prove screen-reader failure. The menu's `role="menu"` requires keyboard behavior consistent with that pattern, but Escape did not dismiss it in the tested sequence. No screen reader, contrast audit, motion sensitivity beyond reduced-motion setting, or zoom test was performed.
