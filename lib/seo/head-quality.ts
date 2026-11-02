/**
 * Advisory audit of already-rendered HTML <head> entries.
 * The data comes from a locally pasted HTML document, not a live crawl.
 * This is not a sanitizer, publishing adapter or assertion about response headers.
 */
export interface HeadEntry {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
}

export interface HeadQualityFinding {
  id: string;
  severity: 'error' | 'warning';
  title: string;
  details: string;
  recommendation: string;
}

/**
 * Extracts only metadata tags from a pasted head/document as inert text.
 * Unlike DOMParser, this never creates resource-bearing nodes or initiates fetches.
 * This bounded metadata parser is advisory (NOT a browser/HTML sanitizer).
 */
export function extractHeadEntriesFromMarkup(markup: string): HeadEntry[] {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(markup)?.[1] || markup;
  const matches = head.match(/<title\b[^>]*>[\s\S]*?<\/title\s*>|<(?:meta|link)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi) || [];
  const entities = (value: string) =>
    value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
  return matches.map((markupTag): HeadEntry => {
    const tag = /^<\s*([a-z]+)/i.exec(markupTag)?.[1]?.toLowerCase() || '';
    if (tag === 'title') {
      return {
        tag,
        attributes: {},
        text: entities(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(markupTag)?.[1] || ''),
      };
    }
    const attributes: Record<string, string> = {};
    const rawAttributes = markupTag.replace(/^<\s*(?:meta|link)\b/i, '').replace(/\/?>$/, '');
    const pattern = /([^\s=\/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(rawAttributes))) {
      attributes[match[1].toLowerCase()] = entities(match[2] ?? match[3] ?? match[4] ?? '');
    }
    return { tag, attributes };
  });
}

export function inspectHeadEntries(
  entries: readonly HeadEntry[],
  pageUrl = ''
): HeadQualityFinding[] {
  const findings: HeadQualityFinding[] = [];
  const attr = (entry: HeadEntry, name: string) =>
    Object.entries(entry.attributes).find(([key]) => key.toLowerCase() === name)?.[1]?.trim() || '';
  const meta = (name: string) =>
    entries.filter((entry) => entry.tag.toLowerCase() === 'meta' && attr(entry, 'name').toLowerCase() === name);
  const property = (name: string) =>
    entries.filter((entry) => entry.tag.toLowerCase() === 'meta' && attr(entry, 'property').toLowerCase() === name);
  const links = (rel: string) =>
    entries.filter((entry) =>
      entry.tag.toLowerCase() === 'link' &&
      attr(entry, 'rel').toLowerCase().split(/\s+/).includes(rel)
    );
  const add = (id: string, severity: 'error' | 'warning', title: string, details: string, recommendation: string) =>
    findings.push({ id, severity, title, details, recommendation });

  const titles = entries.filter((entry) => entry.tag.toLowerCase() === 'title');
  if (titles.length !== 1 || !(titles[0]?.text || '').trim()) {
    add('head.title', 'error', 'HTML title missing or duplicated',
      'Found ' + titles.length + ' title elements.',
      'Render one meaningful <title> for the requested page.');
  }

  for (const [key, matches] of [
    ['description', meta('description')],
    ['robots', meta('robots')],
    ['keywords', meta('keywords')],
    ['twitter:card', meta('twitter:card')],
    ['twitter:title', meta('twitter:title')],
    ['twitter:description', meta('twitter:description')],
    ['og:title', property('og:title')],
    ['og:description', property('og:description')],
    ['og:type', property('og:type')],
    ['og:url', property('og:url')],
  ] as const) {
    if (matches.length > 1) {
      const values = matches.map((entry) => attr(entry, key.startsWith('og:') ? 'content' : 'content'));
      add('head.duplicate.' + key, 'error', 'Duplicate ' + key,
        matches.length + ' declarations found. Values: ' + [...new Set(values)].join(' | '),
        'Emit this singleton metadata field once from the public page metadata renderer.');
    }
  }

  if (meta('description').length === 0) {
    add('head.description.missing', 'warning', 'Meta description missing',
      'No name="description" found.',
      'Write one page-specific summary; avoid stuffing keywords.');
  }

  if (meta('keywords').length > 0) {
    add('head.keywords.legacy', 'warning', 'Legacy meta keywords present',
      meta('keywords').length + ' meta keywords element(s) found.',
      'Remove unused meta keywords; Google does not use this tag for ranking.');
  }

  if (entries.some((entry) =>
    entry.tag.toLowerCase() === 'meta' && attr(entry, 'http-equiv').toLowerCase() === 'x-ua-compatible')) {
    add('head.legacy.compat', 'warning', 'Legacy browser compatibility metadata',
      'Detected a legacy http-equiv compatibility declaration.',
      'Remove obsolete X-UA-Compatible metadata when no legacy browser support is required.');
  }

  const ogTypes = property('og:type').map((entry) => attr(entry, 'content').toLowerCase()).filter(Boolean);
  if (new Set(ogTypes).size > 1) {
    add('head.og.type.conflict', 'error', 'Conflicting Open Graph types',
      'Found types: ' + [...new Set(ogTypes)].join(', '),
      'Use website on the homepage and article on editorial article pages, never both.');
  }

  const canonicals = links('canonical');
  if (canonicals.length !== 1) {
    add('head.canonical.count', canonicals.length > 1 ? 'error' : 'warning',
      'Canonical URL is ' + (canonicals.length === 0 ? 'missing' : 'duplicated'),
      canonicals.length + ' rel="canonical" elements found.',
      'Emit one absolute canonical URL for each public indexable page.');
  }
  const canonical = canonicals.length === 1 ? attr(canonicals[0], 'href') : '';
  let canonicalUrl: URL | undefined;
  if (canonical) {
    try {
      const url = new URL(canonical);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('not HTTP(S)');
      canonicalUrl = url;
    } catch {
      add('head.canonical.invalid', 'error', 'Invalid canonical URL',
        'Canonical href is not an absolute HTTP(S) URL.',
        'Use an absolute, valid HTTP(S) URL for the preferred public page.');
    }
  }
  let inspectedPage: URL | undefined;
  if (pageUrl.trim()) {
    try {
      inspectedPage = new URL(pageUrl.trim());
      if (!['https:', 'http:'].includes(inspectedPage.protocol)) throw new Error('not HTTP(S)');
    } catch {
      add('head.page-url.invalid', 'warning', 'Page URL cannot be compared',
        'Supplied page URL is not an absolute HTTP(S) URL.',
        'Paste the absolute address of the HTML page for route-level checks.');
    }
  }

  if (inspectedPage && canonicalUrl &&
      (inspectedPage.host !== canonicalUrl.host ||
        inspectedPage.pathname.replace(/\/+$/, '') !== canonicalUrl.pathname.replace(/\/+$/, ''))) {
    add('head.canonical.differs', 'warning', 'Canonical differs from inspected URL',
      'Page ' + inspectedPage.origin + inspectedPage.pathname + ' points to ' + canonicalUrl.origin + canonicalUrl.pathname,
      'Confirm that this is an intentional duplicate, redirect or cross-domain canonical; do not auto-rewrite.');
  }

  if (inspectedPage && /^\/search\/?$/.test(inspectedPage.pathname)) {
    const robotDirectives = meta('robots').map((entry) => attr(entry, 'content').toLowerCase()).join(',');
    if (!robotDirectives.split(/[\s,]+/).includes('noindex')) {
      add('head.search.noindex', 'error', 'Search results are indexable',
        'No robots noindex declaration was found for a /search page.',
        'Serve a crawlable search page with a real noindex directive; do not block it via robots.txt before Google can read noindex.');
    }
  }

  const alternates = links('alternate').filter((entry) => attr(entry, 'hreflang'));
  const seenLanguages = new Set<string>();
  for (const alternate of alternates) {
    const language = attr(alternate, 'hreflang').toLowerCase();
    if (seenLanguages.has(language)) {
      add('head.hreflang.duplicate.' + language, 'warning',
        'Duplicate hreflang declaration for ' + language,
        'Multiple language alternates use the same hreflang code.',
        'Keep one intended URL per language on this page, and verify reciprocal links on the other pages.');
    }
    seenLanguages.add(language);
  }

  return findings;
}
