import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHeadEntriesFromMarkup, inspectHeadEntries, type HeadEntry } from './head-quality';

const m = (name: string, content: string): HeadEntry =>
  ({ tag: 'meta', attributes: { name, content } });
const p = (property: string, content: string): HeadEntry =>
  ({ tag: 'meta', attributes: { property, content } });
const l = (rel: string, href: string): HeadEntry =>
  ({ tag: 'link', attributes: { rel, href } });
const t = (text: string): HeadEntry =>
  ({ tag: 'title', text, attributes: {} });
const ids = (entries: HeadEntry[], url = '') =>
  inspectHeadEntries(entries, url).map((finding) => finding.id);

test('legacy ScientificRadar head reports duplicated description/twitter and conflicting og:type', () => {
  const entries = [
    t('Scientific Radar'), m('description', 'Science news'), m('description', 'Science news'),
    m('keywords', 'science'), m('keywords', 'science'), m('twitter:title', 'Radar'),
    m('twitter:title', 'Radar'), m('twitter:description', 'Science'),
    m('twitter:description', 'Science'), p('og:type', 'article'),
    p('og:type', 'website'), l('canonical', 'https://scientificradar.com/'),
  ];
  const found = ids(entries, 'https://scientificradar.com/');
  for (const rule of [
    'head.duplicate.description', 'head.duplicate.twitter:title',
    'head.duplicate.twitter:description', 'head.duplicate.og:type',
    'head.og.type.conflict', 'head.duplicate.keywords', 'head.keywords.legacy',
  ]) assert.ok(found.includes(rule), 'Missing rule ' + rule);
});

test('a healthy single metadata head produces no issues', () => {
  assert.deepEqual(ids([
    t('Article title'), m('description', 'A precise article description'),
    m('robots', 'index, follow'), m('twitter:card', 'summary_large_image'),
    p('og:type', 'article'), l('canonical', 'https://scientificradar.com/post/example'),
  ], 'https://scientificradar.com/post/example'), []);
});

test('indexable on-site search requires noindex, without rejecting legitimate canonical changes', () => {
  const entries = [t('Search'), m('description', 'Search stories'), l('canonical', 'https://scientificradar.com/search')];
  assert.ok(ids(entries, 'https://scientificradar.com/search?q=physics').includes('head.search.noindex'));
  assert.ok(!ids([...entries, m('robots', 'noindex, follow')], 'https://scientificradar.com/search?q=physics')
    .includes('head.search.noindex'));
});

test('missing, duplicate and invalid canonical URLs are reported independently', () => {
  const common = [t('Article'), m('description', 'Content')];
  assert.ok(ids(common).includes('head.canonical.count'));
  assert.ok(ids([...common, l('canonical', '/relative')]).includes('head.canonical.invalid'));
  assert.ok(ids([...common, l('canonical', 'https://example.com'), l('canonical', 'https://example.com')])
    .includes('head.canonical.count'));
});

test('multiple og:image properties remain permitted (gallery images)', () => {
  assert.deepEqual(ids([
    t('Article'), m('description', 'Article excerpt'),
    p('og:image', 'https://scientificradar.com/a.png'),
    p('og:image', 'https://scientificradar.com/b.png'),
    l('canonical', 'https://scientificradar.com/article'),
  ]), []);
});

test('pasted legacy HTML head is parsed as inert text with duplicate metadata preserved', () => {
  const html = '<head><title>ScientificRadar</title>' +
    '<meta name="description" content="One &amp; Two">' +
    '<meta name="description" content="One &amp; Two">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:type" content="website">' +
    '<link rel="canonical" href="https://scientificradar.com/"></head>' +
    '<body><meta name="description" content="Out of head"></body>';
  const entries = extractHeadEntriesFromMarkup(html);
  assert.equal(entries.filter((entry) => entry.attributes.name === 'description').length, 2);
  assert.ok(ids(entries).includes('head.duplicate.description'));
  assert.ok(ids(entries).includes('head.og.type.conflict'));
  assert.ok(!entries.some((entry) => entry.attributes.content === 'Out of head'));
});
