import DOMPurify from "isomorphic-dompurify";
import { renderScientificMath } from "./math";
import {
  ArticleBlock,
  ArticleHeadingOutlineItem,
  PublicArticle,
  PublicSource,
} from "./types";

/**
 * Diacritic-tolerant public search for English and Turkish editorial content.
 */
export function normalizeSearchText(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugifyHeadingText(input: string): string {
  const normalized = normalizeSearchText(input)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64)
    .replace(/^-|-$/g, "");
  return normalized ? `section-${normalized}` : "section-heading";
}

// This boundary protects *published* Studio bodyHtml from HTML/script injection.
// Do not replace it with regex matching or treat content HTML as already trusted.
const ALLOWED_TAGS = [
  "a", "blockquote", "br", "caption", "code", "del", "div", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "hr", "img",
  "li", "ol", "p", "pre", "s", "small", "span", "strong",
  "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead",
  "tr", "u", "ul",
];

const ALLOWED_ATTR = [
  "alt", "colspan", "height", "href", "id", "rel", "rowspan",
  "scope", "src", "start", "target", "title", "value", "width",
  "data-knowledge-term", "data-text-align", "data-math-tex",
  "data-math-display", "data-citation-source-id", "data-media-id",
  "data-figure-layout", "data-figure-credit", "data-figure-licence",
  "data-figure-source-url",
];

const PER_TAG_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(["href", "rel", "target", "data-knowledge-term", "data-citation-source-id"]),
  caption: new Set(["data-text-align"]),
  div: new Set(["data-text-align", "data-math-tex", "data-math-display"]),
  figure: new Set([
    "data-media-id", "data-figure-layout", "data-figure-credit",
    "data-figure-licence", "data-figure-source-url",
  ]),
  h1: new Set(["data-text-align"]),
  h2: new Set(["data-text-align"]),
  h3: new Set(["data-text-align"]),
  h4: new Set(["data-text-align"]),
  img: new Set(["alt", "height", "src", "width"]),
  li: new Set(["value"]),
  ol: new Set(["start"]),
  p: new Set(["data-text-align"]),
  span: new Set(["data-math-tex", "data-math-display"]),
  sup: new Set(["data-citation-source-id"]),
  td: new Set(["colspan", "rowspan", "data-text-align"]),
  th: new Set(["colspan", "rowspan", "scope", "data-text-align"]),
};

const ENTITY_ID = /^[A-Za-z0-9_.:-]{1,128}$/;
const HTML_ID = /^[A-Za-z][A-Za-z0-9_:.-]{0,127}$/;
const REL_TOKENS = new Set([
  "author", "bookmark", "external", "help", "license", "next",
  "nofollow", "noopener", "noreferrer", "prev", "search", "sponsored",
  "tag", "ugc",
]);

function safeHref(value: string): boolean {
  const href = value.trim();
  if (!href || href.startsWith("//") || href.startsWith("/\\")) return false;
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./")) return true;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function safeSrc(value: string, trustedSources: ReadonlySet<string>): boolean {
  const src = value.trim();
  if (src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/\\")) {
    return true;
  }
  return trustedSources.has(src);
}

/**
 * Parser-based sanitizer for article bodyHtml.
 *
 * All attributes are filtered on their specific tag, even after DOMPurify.
 * An image is limited to same-origin local paths unless it appears in an
 * explicit, separately verified list of published media asset URLs.
 * React must receive only this sanitized output, not raw draft HTML.
 */
export function sanitizeCanonicalBodyHtml(
  rawHtml: string,
  trustedImageSources: ReadonlySet<string> = new Set<string>()
): string {
  if (!rawHtml) return "";

  const fragment = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  for (const element of Array.from(fragment.querySelectorAll("*"))) {
    const tag = element.localName.toLowerCase();
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      const permitted = name === "id" || name === "title" || Boolean(PER_TAG_ATTRS[tag]?.has(name));
      const valid =
        permitted &&
        (name !== "href" || safeHref(value)) &&
        (name !== "src" || safeSrc(value, trustedImageSources)) &&
        (name !== "id" || HTML_ID.test(value)) &&
        (name !== "target" || value === "_blank" || value === "_self") &&
        (name !== "data-text-align" || ["left", "center", "right", "justify"].includes(value)) &&
        (name !== "data-math-display" || ["inline", "block"].includes(value)) &&
        (name !== "data-math-tex" || (value.trim().length > 0 && value.length <= 2000)) &&
        (name !== "data-citation-source-id" || ENTITY_ID.test(value)) &&
        (name !== "data-media-id" || ENTITY_ID.test(value)) &&
        (name !== "data-knowledge-term" || (value.trim().length > 0 && value.length <= 200)) &&
        (name !== "data-figure-layout" || ["locked", "auto", "manual", "wide", "column"].includes(value)) &&
        (name !== "data-figure-credit" || value.length <= 500) &&
        (name !== "data-figure-licence" || value.length <= 500) &&
        (name !== "data-figure-source-url" || (!value.trim() || safeHref(value)));
      if (!valid) element.removeAttribute(attr.name);
    }

    if (tag === "a") {
      const rel = (element.getAttribute("rel") || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => REL_TOKENS.has(token));
      if (element.getAttribute("target") === "_blank") {
        rel.push("noopener", "noreferrer");
      }
      const unique = [...new Set(rel)];
      if (unique.length) element.setAttribute("rel", unique.join(" "));
      else element.removeAttribute("rel");
    }

    // A genuine article H1 is always the page title, not inner user HTML.
    if (tag === "h1") {
      const replacement = element.ownerDocument.createElement("h2");
      for (const attr of Array.from(element.attributes)) {
        replacement.setAttribute(attr.name, attr.value);
      }
      while (element.firstChild) replacement.appendChild(element.firstChild);
      element.replaceWith(replacement);
    }
  }

  const root = fragment.ownerDocument.createElement("div");
  root.appendChild(fragment);
  return root.innerHTML;
}

/**
 * Prepares canonical bodyHtml for public reader rendering while extracting
 * a deterministic heading outline (H2s) for the Table of Contents, rendering
 * controlled KaTeX math (`data-math-tex`), and wiring citation back-links
 * (`data-citation-source-id`).
 */
export function prepareCanonicalBodyHtml(
  rawHtml: string,
  options?: {
    sources?: PublicSource[];
    trustedImageSources?: ReadonlySet<string>;
  }
): {
  html: string;
  headings: ArticleHeadingOutlineItem[];
} {
  const sanitized = sanitizeCanonicalBodyHtml(
    rawHtml,
    options?.trustedImageSources
  );
  if (!sanitized) {
    return { html: "", headings: [] };
  }

  const fragment = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  const headings: ArticleHeadingOutlineItem[] = [];
  const usedIds = new Set<string>();
  const sourceMap = new Map((options?.sources ?? []).map((s) => [s.id, s]));

  // First pass: collect existing valid IDs
  for (const el of Array.from(fragment.querySelectorAll("[id]"))) {
    const existingId = el.getAttribute("id");
    if (existingId) usedIds.add(existingId);
  }

  for (const element of Array.from(fragment.querySelectorAll("*"))) {
    const tag = element.localName.toLowerCase();

    if (tag === "h2" || tag === "h3") {
      const text = (element.textContent ?? "").trim();
      if (!text) continue;

      let headingId = element.getAttribute("id") ?? "";
      if (!headingId || !HTML_ID.test(headingId)) {
        const base = slugifyHeadingText(text);
        headingId = base;
        let counter = 2;
        while (usedIds.has(headingId)) {
          headingId = `${base}-${counter}`;
          counter += 1;
        }
        element.setAttribute("id", headingId);
        usedIds.add(headingId);
      }

      if (tag === "h2") {
        headings.push({
          type: "heading",
          id: headingId,
          level: 2,
          text,
        });
      }
    }

    if ((tag === "div" || tag === "span") && element.hasAttribute("data-math-tex")) {
      const tex = element.getAttribute("data-math-tex") ?? "";
      const displayAttr = element.getAttribute("data-math-display");
      const isDisplay = displayAttr === "block" || (tag === "div" && displayAttr !== "inline");
      const renderedMath = renderScientificMath(tex, isDisplay);

      element.setAttribute("role", "math");
      element.setAttribute("aria-label", tex);
      if (renderedMath) {
        element.innerHTML = renderedMath;
      } else {
        element.textContent = tex;
      }
    }

    if (tag === "sup" && element.hasAttribute("data-citation-source-id")) {
      const srcId = element.getAttribute("data-citation-source-id") ?? "";
      if (srcId && !element.querySelector("a")) {
        const src = sourceMap.get(srcId);
        const rawText = (element.textContent ?? "").replace(/^\[|\]$/g, "").trim();
        const label = src?.label ?? (rawText || "?");
        const anchor = element.ownerDocument.createElement("a");
        anchor.setAttribute("id", `cite-${srcId}`);
        anchor.setAttribute("href", `#ref-${srcId}`);
        anchor.setAttribute("data-citation-source-id", srcId);
        anchor.setAttribute("aria-label", `Reference ${label}`);
        anchor.textContent = `[${label}]`;
        element.textContent = "";
        element.appendChild(anchor);
      }
    }
  }

  const root = fragment.ownerDocument.createElement("div");
  root.appendChild(fragment);
  return {
    html: root.innerHTML,
    headings,
  };
}

export function extractHeadingsFromBodyHtml(
  rawHtml: string,
  trustedImageSources?: ReadonlySet<string>
): ArticleHeadingOutlineItem[] {
  return prepareCanonicalBodyHtml(rawHtml, { trustedImageSources }).headings;
}

/**
 * Resolves the canonical H2 outline for an article whether it is backed by
 * structured `blocks` or a sanitized `bodyHtml` snapshot.
 */
export function resolveArticleHeadings(
  article: Pick<PublicArticle, "blocks" | "bodyHtml" | "sources">
): ArticleHeadingOutlineItem[] {
  if (article.bodyHtml && article.bodyHtml.trim().length > 0) {
    const fromHtml = prepareCanonicalBodyHtml(article.bodyHtml, {
      sources: article.sources,
    }).headings;
    if (fromHtml.length > 0) {
      return fromHtml;
    }
  }

  return article.blocks.filter(
    (b): b is Extract<ArticleBlock, { type: "heading" }> & { level: 2 } =>
      b.type === "heading" && b.level === 2
  );
}
