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
  'start', 'target', 'title', 'value', 'width', 'data-knowledge-term',
];

const COMMON_ATTRS = new Set(['id', 'title']);
const ELEMENT_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'rel', 'target', 'data-knowledge-term']),
  img: new Set(['alt', 'height', 'src', 'width']),
  li: new Set(['value']),
  ol: new Set(['start']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
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
    // The explicit ALLOWED_ATTR entry above permits only data-knowledge-term;
    // arbitrary data-* attributes remain disallowed.
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // DOMPurify's URI policy handles known-dangerous schemes; the stricter
    // per-attribute application policy is applied in the post-pass below.
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

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
        (name !== 'id' || /^[A-Za-z][A-Za-z0-9_:.-]{0,127}$/.test(attribute.value));
      if (!keep) element.removeAttribute(attribute.name);
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

  const holder = fragment.ownerDocument.createElement('div');
  holder.appendChild(fragment);
  return {
    html: holder.innerHTML,
    demotedH1Count,
    removedUnsafeCount: DOMPurify.removed.length,
  };
}
