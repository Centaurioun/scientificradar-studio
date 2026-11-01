import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndSanitizeSnapshot } from './backup-validation';
import { SEED_MEDIA } from './seed-data';
import { trustedMediaSourceSet } from './html-security';

const validSnapshot = () => ({
  schemaVersion: 1,
  articles: [], pages: [], categories: [], tags: [], series: [], authors: [], media: [],
  sources: [], knowledgeLinks: [], revisions: [], homepageBlocks: [], menus: [],
  navigation: { preset: 'balanced', visibleItems: Object.fromEntries([
    'dashboard', 'articles', 'pages', 'categories', 'media', 'series', 'homepage', 'videos',
    'review', 'calendar', 'authors', 'revisions', 'assistant', 'seo', 'knowledge_links',
    'search_performance', 'settings_general', 'settings_navigation', 'settings_defaults',
    'settings_integrations', 'settings_roles', 'settings_audit',
  ].map((key) => [key, true])), collapsedGroups: {}, sidebarCollapsed: false,
    dashboardWidgets: { metrics: true, continueEditing: true, requiresAttention: true, upcomingCalendar: true, recentActivity: true } },
  auditEvents: [], integrations: [], activeRole: 'editor', theme: 'light',
});

test('backup validation accepts a complete, intentionally empty snapshot and legacy optional fields', () => {
  const value = validSnapshot();
  delete (value as Partial<typeof value>).schemaVersion;
  const result = validateAndSanitizeSnapshot(JSON.stringify(value));
  assert.equal(result.error, undefined);
  assert.equal(result.snapshot?.schemaVersion, 1);
  assert.deepEqual(result.snapshot?.articles, []);
  assert.deepEqual(result.snapshot?.auditReportsByArticleId, {});
  assert.equal(result.snapshot?.dateTimePreferences?.timeZone, 'Europe/Istanbul');
});

test('backup validation rejects malformed JSON, root types, missing collections and malformed records', () => {
  assert.match(validateAndSanitizeSnapshot('{').error || '', /valid JSON/);
  assert.match(validateAndSanitizeSnapshot('[]').error || '', /schema/);
  const missing = validSnapshot() as Record<string, unknown>;
  delete missing.pages;
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(missing)).error || '', /pages/);
  const malformed = validSnapshot();
  malformed.articles = [null] as unknown as typeof malformed.articles;
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(malformed)).error || '', /articles/);
});

test('backup validation sanitizes article, page and revision HTML while retaining supported text', () => {
  const value = validSnapshot() as Record<string, any>;
  const now = '2026-11-01T00:00:00.000Z';
  const html = '<h1>Section</h1><p>Ω and DOI 10.1038/example</p><img src="/local.png" onerror="window.pwned=1">';
  const article = {
    id: 'article-1', locale: 'en', title: 'Scientific title', slug: 'scientific-title', summary: '',
    body: { type: 'doc', content: [] }, bodyHtml: html, status: 'draft', categoryIds: [], tagIds: [],
    sourceIds: [], seo: {}, createdAt: now, updatedAt: now, version: 1,
  };
  value.articles = [article];
  value.pages = [{
    id: 'page-1', title: 'Static page', slug: 'static-page', locale: 'en', summary: '',
    body: { type: 'doc', content: [] }, bodyHtml: html, status: 'draft', template: 'standard',
    navigationVisibility: false, seo: {}, updatedAt: now,
  }];
  value.revisions = [{ id: 'rev-1', articleId: 'article-1', version: 1, snapshot: article,
    source: 'editor', createdAt: now, summary: 'initial' }];

  const result = validateAndSanitizeSnapshot(JSON.stringify(value));
  assert.equal(result.error, undefined);
  assert.match(result.snapshot!.articles[0].bodyHtml, /<h2>Section<\/h2>/);
  assert.match(result.snapshot!.articles[0].bodyHtml, /Ω and DOI 10\.1038\/example/);
  assert.doesNotMatch(result.snapshot!.articles[0].bodyHtml, /onerror/);
  assert.doesNotMatch(result.snapshot!.pages[0].bodyHtml, /onerror/);
  assert.doesNotMatch(result.snapshot!.revisions[0].snapshot.bodyHtml, /onerror/);
});

test('backup validation enforces version, duplicate identifiers, content and total-size limits', () => {
  const unsupported = validSnapshot() as Record<string, unknown>;
  unsupported.schemaVersion = 99;
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(unsupported)).error || '', /schemaVersion/);
  assert.match(validateAndSanitizeSnapshot(' '.repeat(25 * 1024 * 1024 + 1)).error || '', /25 MiB/);

  const duplicated = validSnapshot() as Record<string, any>;
  duplicated.tags = [
    { id: 'same', name: 'Tag one', slug: 'tag-one' },
    { id: 'same', name: 'Tag two', slug: 'tag-two' },
  ];
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(duplicated)).error || '', /duplicate identifiers/);
});

test('backup validation rejects active URLs in knowledge links, sources and nested menus', () => {
  const value = validSnapshot() as Record<string, any>;
  value.knowledgeLinks = [{
    id: 'knowledge-1', term: 'quantum', targetType: 'wikipedia', targetUrl: 'JaVaScRiPt:alert(1)',
    locale: 'en', previewTitle: 'Quantum', previewExcerpt: '', sourceAttribution: 'test',
    reviewStatus: 'approved', isSampleDemoData: false,
  }];
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(value)).error || '', /targetUrl/);

  value.knowledgeLinks = [];
  value.menus = [{ id: 'menu-1', name: 'Primary', location: 'primary', dropdownBehavior: 'both',
    items: [{ id: 'item-1', label: 'bad', href: '//attacker.invalid', targetType: 'external' }] }];
  assert.match(validateAndSanitizeSnapshot(JSON.stringify(value)).error || '', /href/);
});

test('backup validation clears untrusted remote and arbitrary SVG media sources', () => {
  const value = validSnapshot() as Record<string, any>;
  const base = {
    filename: 'figure.svg', title: 'Figure', kind: 'scientific_figure', mime: 'image/svg+xml',
    width: 640, height: 480, byteSize: 100, altText: 'Scientific figure', layout: 'auto',
    createdAt: '2026-11-01T00:00:00.000Z',
  };
  value.media = [
    { ...base, id: 'remote', src: 'https://remote.invalid/figure.png', mime: 'image/png' },
    { ...base, id: 'svg', src: 'data:image/svg+xml;utf8,%3Csvg%20onload%3D%22alert(1)%22%3E%3C%2Fsvg%3E' },
  ];
  value.pages = [{
    id: 'page-1', title: 'Page', slug: 'page', locale: 'en', summary: '', body: { type: 'doc' },
    bodyHtml: '<p>Figure</p><img src="https://remote.invalid/figure.png"><img src="data:image/svg+xml;utf8,%3Csvg%20onload%3D%22alert(1)%22%3E%3C%2Fsvg%3E">',
    status: 'draft', template: 'standard', navigationVisibility: false, seo: {}, updatedAt: '2026-11-01T00:00:00.000Z',
  }];
  const result = validateAndSanitizeSnapshot(JSON.stringify(value));
  assert.equal(result.error, undefined);
  assert.equal(result.snapshot!.media[0].src, '');
  assert.equal(result.snapshot!.media[1].src, '');
  assert.doesNotMatch(result.snapshot!.pages[0].bodyHtml, /src=/i);
});

test('backup validation preserves an exact registered local scientific figure source', () => {
  const value = validSnapshot() as Record<string, any>;
  const asset = SEED_MEDIA[0];
  value.media = [asset];
  const now = '2026-11-01T00:00:00.000Z';
  value.articles = [{
    id: 'article-1', locale: 'en', title: 'Scientific figure article', slug: 'figure-article', summary: '',
    body: { type: 'doc', content: [] },
    bodyHtml: `<figure><img src="${asset.src}" alt="${asset.altText}"><figcaption>${asset.caption}</figcaption></figure>`,
    status: 'draft', categoryIds: [], tagIds: [], sourceIds: [], seo: {}, createdAt: now, updatedAt: now, version: 1,
  }];
  const trusted = trustedMediaSourceSet([asset.src]);
  const result = validateAndSanitizeSnapshot(JSON.stringify(value), trusted);
  assert.equal(result.error, undefined);
  assert.equal(result.snapshot!.media[0].src, asset.src);
  assert.ok(result.snapshot!.articles[0].bodyHtml.includes(`src="${asset.src}"`));
  assert.ok(result.snapshot!.articles[0].bodyHtml.includes(asset.caption || ''));
});
