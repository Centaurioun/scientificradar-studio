# Original Implementation Examples

The following code is newly authored illustrative React/CSS, not copied from either publication. It demonstrates the handoff's typed content, semantic structure, and responsive behavior. It is intentionally small and is not a complete application.

## Typed article renderer

```tsx
import type { Article, ArticleBlock } from "./article-types";

function RenderBlock({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "heading":
      return block.level === 2
        ? <h2 id={block.id}>{block.text}</h2>
        : <h3 id={block.id}>{block.text}</h3>;
    case "figure":
      return (
        <figure id={block.id}>
          <img
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
          {block.credit && <p className="figure-credit">{block.credit}</p>}
        </figure>
      );
    case "quote":
      return (
        <blockquote id={block.id}>
          <p>{block.text}</p>
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      );
    case "table":
      return (
        <div className="table-scroll" role="region" aria-label={block.caption} tabIndex={0}>
          <table>
            <caption>{block.caption}</caption>
            <thead><tr>{block.headers.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
            <tbody>{block.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      );
    case "citation":
      return <sup><a href={`#source-${block.citationId}`} aria-label="Open cited source">[{block.citationId}]</a></sup>;
    case "callout":
      return <aside className="article-callout"><h2>{block.title}</h2><p>{block.text}</p></aside>;
  }
}

export function ArticleView({ article }: { article: Article }) {
  return (
    <main id="main-content">
      <article className="article-page">
        <header className="article-header">
          <a href={`/topics/${article.topic.slug}`}>{article.topic.label}</a>
          <h1>{article.title}</h1>
          <p className="article-dek">{article.description}</p>
          <address>{article.authors.map(person => person.name).join(", ")}</address>
          <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
          {article.updatedAt && <time dateTime={article.updatedAt}>Updated {article.updatedAt.slice(0, 10)}</time>}
        </header>
        <div className="article-layout">
          <div className="article-body">{article.blocks.map(block => <RenderBlock key={block.id} block={block} />)}</div>
          <aside className="article-context" aria-label="Article resources">Related resources go here.</aside>
        </div>
        <section aria-labelledby="sources-heading" className="article-sources">
          <h2 id="sources-heading">Sources</h2>
          <ol>{article.citations.map(source => (
            <li id={`source-${source.id}`} key={source.id}>
              <a href={source.url} rel="noreferrer">{source.label}</a>
              {source.rights && <span className="source-rights"> {source.rights}</span>}
            </li>
          ))}</ol>
        </section>
      </article>
    </main>
  );
}
```

Render actual author/date metadata only after schema validation. For localized dates, use the application's date formatter; the example's ISO slice is only a structural placeholder.

## Header disclosure behavior

```tsx
"use client";
import { useId, useRef, useState } from "react";

export function SiteMenu() {
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <div className="site-menu">
      <a href="/topics">Topics</a>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => { if (event.key === "Escape" && open) close(); }}
      >
        Browse topics
      </button>
      <nav
        id={panelId}
        hidden={!open}
        aria-label="Topics"
        onKeyDown={event => { if (event.key === "Escape" && open) close(); }}
      >
        <button type="button" onClick={close}>Close navigation</button>
        <a href="/topics/biology" onClick={() => setOpen(false)}>Biology</a>
        <a href="/topics/physics" onClick={() => setOpen(false)}>Physics</a>
      </nav>
    </div>
  );
}
```

This sketch omits outside-click handling and inert background management because a non-modal disclosure nav does not need to trap focus. If the final design chooses a modal drawer, implement those behaviors with a tested dialog primitive, preserve page scroll, and return focus when dismissed.

## Responsive CSS

```css
:root {
  --page-max: 82.5rem;
  --reading-max: 43.75rem;
  --figure-max: 68.75rem;
  --gutter: clamp(1rem, 3vw, 2.5rem);
}

.page-shell {
  width: min(calc(100% - 2 * var(--gutter)), var(--page-max));
  margin-inline: auto;
}

.article-header { max-width: 55rem; margin-inline: auto; }
.article-layout {
  display: grid;
  grid-template-columns: minmax(0, var(--reading-max)) minmax(12rem, 16rem);
  justify-content: center;
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}
.article-body { min-width: 0; font-size: clamp(1.0625rem, 1.3vw, 1.1875rem); line-height: 1.7; }
.article-body figure { width: min(calc(100vw - 2 * var(--gutter)), var(--figure-max)); margin: 2.5rem 50% 2.5rem; transform: translateX(-50%); }
.article-body img { display: block; width: 100%; height: auto; }
.article-body figcaption { margin-top: .75rem; line-height: 1.45; }
.table-scroll { max-width: 100%; overflow-x: auto; }

@media (max-width: 60rem) {
  .article-layout { grid-template-columns: minmax(0, var(--reading-max)); }
  .article-context { margin-block-start: 2rem; }
}

@media (max-width: 40rem) {
  .article-layout { display: block; }
  .article-context { margin-block-start: 3rem; }
  .article-body figure { width: calc(100vw - 2 * var(--gutter)); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

The wide-figure breakout above is original and should be tested in the target grid; a simpler containment strategy is preferable if the editorial layout does not require edge-to-edge media. Never solve page overflow with a blanket `overflow-x:hidden`, because it can conceal broken controls and cut off focus rings.

## Integration rules

- Keep examples as code snippets in docs only until a separately approved implementation task.
- Use original photography, illustrations, icons, and brand assets with recorded rights.
- Use Next Image or equivalent with remote-host allowlists only for authorized sources.
- Sanitize any imported rich text at ingestion and prefer rendering typed blocks; do not use unchecked HTML.
- Content and layout acceptance must use original synthetic demo data, not copied article text.
