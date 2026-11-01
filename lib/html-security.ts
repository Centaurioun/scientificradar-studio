import DOMPurify from 'isomorphic-dompurify';

/**
 * The shared HTML boundary for stored and rendered editorial fragments.
 * It deliberately excludes styles, SVG/MathML, embedded documents and data URLs.
 */
const ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'caption', 'code', 'del', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'hr', 'img', 'li', 'ol', 'p', 'pre',
  's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
];

const ALLOWED_ATTR = [
  'alt', 'colspan', 'height', 'href', 'id', 'rel', 'rowspan', 'scope', 'src',
  'start', 'target', 'title', 'value', 'width',
  'data-knowledge-term',
  'data-text-align',
  'data-math-tex',
  'data-math-display',
  'data-citation-source-id',
  'data-media-id',
  'data-figure-layout',
];

const COMMON_ATTRS = new Set(['id', 'title']);
const SAFE_TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);
const SAFE_MATH_DISPLAY_VALUES = new Set(['inline', 'block']);
const SAFE_FIGURE_LAYOUT_VALUES = new Set(['locked', 'auto', 'manual']);
const SAFE_ENTITY_ID_REGEX = /^[A-Za-z0-9_.:-]{1,128}$/;

const ELEMENT_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'rel', 'target', 'data-knowledge-term']),
  div: new Set(['data-text-align', 'data-math-tex', 'data-math-display']),
  figure: new Set(['data-media-id', 'data-figure-layout']),
  h1: new Set(['data-text-align']),
  h2: new Set(['data-text-align']),
  h3: new Set(['data-text-align']),
  h4: new Set(['data-text-align']),
  img: new Set(['alt', 'height', 'src', 'width']),
  li: new Set(['value']),
  ol: new Set(['start']),
  p: new Set(['data-text-align']),
  span: new Set(['data-math-tex', 'data-math-display']),
  sup: new Set(['data-citation-source-id']),
  td: new Set(['colspan', 'rowspan', 'data-text-align']),
  th: new Set(['colspan', 'rowspan', 'scope', 'data-text-align']),
};
const SAFE_REL_TOKENS = new Set([
  'author', 'bookmark', 'external', 'help', 'license', 'next', 'nofollow',
  'noopener', 'noreferrer', 'prev', 'search', 'sponsored', 'tag', 'ugc',
]);

export interface SanitizeEditorialHtmlOptions {
  demoteBodyH1?: boolean;
  /** Exact source strings from already validated local media records. */
  trustedImageSources?: ReadonlySet<string>;
}

export interface SanitizedEditorialHtml {
  html: string;
  demotedH1Count: number;
  removedUnsafeCount: number;
}

export function trustedMediaSourceSet(sources: Iterable<string>): ReadonlySet<string> {
  return new Set(Array.from(sources).filter((source) =>
    (source.startsWith('/') && !source.startsWith('//')) ||
    source.startsWith('blob:') ||
    /^data:image\/(?:png|jpeg|webp|avif|svg\+xml);/i.test(source)
  ));
}

function isSafeHref(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || normalized.startsWith('//') || (normalized.startsWith('/') && normalized[1] === '\\')) return false;
  if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./')) {
    return true;
  }
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeImageSource(value: string, trusted: ReadonlySet<string>): boolean {
  const normalized = value.trim();
  if (trusted.has(normalized)) return true;
  // Content paths owned by this application are permitted. Protocol-relative URLs are not.
  return normalized.startsWith('/') && !normalized.startsWith('//') && normalized[1] !== '\\';
}

export function sanitizeEditorialHtml(
  rawHtml: string,
  options: SanitizeEditorialHtmlOptions = {}
): SanitizedEditorialHtml {
  const raw = typeof rawHtml === 'string' ? rawHtml : '';
  const fragment = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only explicit ALLOWED_ATTR data-* attributes above are permitted;
    // arbitrary data-* attributes remain disallowed.
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  let postFilterRemovedCount = 0;
  // Enforce per-element attribute and URL rules after parser-based sanitization.
  for (const element of Array.from(fragment.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const tag = element.localName.toLowerCase();
      const allowedForElement = ELEMENT_ATTRS[tag];
      const allowed = COMMON_ATTRS.has(name) || Boolean(allowedForElement?.has(name));
      const keep =
        allowed &&
        (name !== 'href' || isSafeHref(attribute.value)) &&
        (name !== 'src' || isSafeImageSource(attribute.value, options.trustedImageSources || new Set())) &&
        (name !== 'target' || attribute.value === '_blank' || attribute.value === '_self') &&
        (name !== 'id' || /^[A-Za-z][A-Za-z0-9_:.-]{0,127}$/.test(attribute.value)) &&
        (name !== 'data-text-align' || SAFE_TEXT_ALIGN_VALUES.has(attribute.value.toLowerCase())) &&
        (name !== 'data-math-display' || SAFE_MATH_DISPLAY_VALUES.has(attribute.value.toLowerCase())) &&
        (name !== 'data-math-tex' || (attribute.value.trim().length > 0 && attribute.value.length <= 2000)) &&
        (name !== 'data-citation-source-id' || SAFE_ENTITY_ID_REGEX.test(attribute.value)) &&
        (name !== 'data-media-id' || SAFE_ENTITY_ID_REGEX.test(attribute.value)) &&
        (name !== 'data-figure-layout' || SAFE_FIGURE_LAYOUT_VALUES.has(attribute.value.toLowerCase()));
      if (!keep) {
        element.removeAttribute(attribute.name);
        postFilterRemovedCount += 1;
      }
    }
    if (element.localName.toLowerCase() === 'a' && element.hasAttribute('rel')) {
      const rel = Array.from(new Set(
        (element.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter((token) => SAFE_REL_TOKENS.has(token)),
      )).join(' ');
      if (rel) element.setAttribute('rel', rel);
      else element.removeAttribute('rel');
    }
    if (element.localName.toLowerCase() === 'a' && element.getAttribute('target') === '_blank') {
      const rel = new Set((element.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      element.setAttribute('rel', Array.from(rel).join(' '));
    }
  }

  let demotedH1Count = 0;
  if (options.demoteBodyH1) {
    for (const h1 of Array.from(fragment.querySelectorAll('h1'))) {
      const h2 = h1.ownerDocument.createElement('h2');
      while (h1.firstChild) h2.appendChild(h1.firstChild);
      for (const attr of Array.from(h1.attributes)) h2.setAttribute(attr.name, attr.value);
      h1.replaceWith(h2);
      demotedH1Count += 1;
    }
  }

  const domPurifyRemovedCount = (DOMPurify.removed || []).filter((item) => {
    if ('attribute' in item && item.attribute) return true;
    const nodeName = 'element' in item ? item.element?.nodeName?.toLowerCase() : undefined;
    return Boolean(nodeName && nodeName !== 'head' && nodeName !== 'body');
  }).length;

  const holder = fragment.ownerDocument.createElement('div');
  holder.appendChild(fragment);
  return {
    html: holder.innerHTML,
    demotedH1Count,
    removedUnsafeCount: domPurifyRemovedCount + postFilterRemovedCount,
  };
}

/**
 * Normalizes clipboard HTML from Word, Google Docs, or web pages before sanitizing (SRS-ED-008).
 * Unwraps Google Docs non-bold `<b style="font-weight:normal">` wrappers, maps safe
 * vertical-align super/sub spans to `<sup>`/`<sub>`, maps safe `text-align` to `data-text-align`,
 * and strips MSO/XML wrapper noise before running `sanitizeEditorialHtml`.
 */
export function cleanClipboardPasteHtml(
  rawClipboardHtml: string,
  trustedImageSources?: ReadonlySet<string>
): SanitizedEditorialHtml {
  let cleaned = typeof rawClipboardHtml === 'string' ? rawClipboardHtml : '';
  // Remove Word/Clipboard comments and XML/O:P tags
  cleaned = cleaned
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:o:p|xml|meta|link|style)\b[^>]*>/gi, '');

  // Unwrap Google Docs `<b style="font-weight:normal..." id="docs-internal-guid-...">...</b>`
  cleaned = cleaned.replace(
    /<b\b[^>]*style=["'][^"']*font-weight\s*:\s*normal[^"']*["'][^>]*>([\s\S]*?)<\/b>/gi,
    '$1'
  );

  // Convert `<span style="...vertical-align: super...">text</span>` -> `<sup>text</sup>`
  cleaned = cleaned.replace(
    /<span\b[^>]*style=["'][^"']*vertical-align\s*:\s*super[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    '<sup>$1</sup>'
  );
  cleaned = cleaned.replace(
    /<span\b[^>]*style=["'][^"']*vertical-align\s*:\s*sub[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    '<sub>$1</sub>'
  );

  // Map inline `style="...text-align: center..."` on block/table elements to `data-text-align`
  cleaned = cleaned.replace(
    /<(p|h1|h2|h3|h4|td|th)\b([^>]*?)\bstyle=["'][^"']*text-align\s*:\s*(left|center|right|justify)\b[^"']*["']([^>]*)>/gi,
    '<$1$2 data-text-align="$3"$4>'
  );

  return sanitizeEditorialHtml(cleaned, {
    demoteBodyH1: true,
    trustedImageSources,
  });
}
