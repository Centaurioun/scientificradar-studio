import test from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from '../types';
import { runArticleAudit } from './run-article-audit';

const base: Article = {
  id: 'article-1',
  locale: 'en',
  title: 'Long-Form Scientific Publishing Quality Standards',
  slug: 'long-form-scientific-publishing-quality-standards',
  summary: 'Quality standards for scientific publishing.',
  body: {},
  bodyHtml: '<h2>Standards</h2><p>Human editorial review and scientific provenance are necessary for credible long-form scientific communication and transparent reproducibility.</p>',
  status: 'draft',
  categoryIds: [],
  tagIds: [],
  sourceIds: [],
  seo: { title: 'Scientific Publishing Quality Standards', description: 'Evidence-based editorial quality for scientific publishing.', noindex: true },
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T11:00:00Z',
  version: 1,
};
const rule = (article: Article, allArticles: Article[] = [article]) =>
  runArticleAudit({ article, allArticles, categories: [], tags: [], media: [], sources: [] })
    .findings.find((finding) => finding.id === 'metadata.canonical.planned');

test('planned canonical check does not claim an absent public URL is verified', () => {
  const finding = rule(base);
  assert.equal(finding?.status, 'warning');
  assert.equal(finding?.isPublicationBlocker, false);
});

test('valid canonical passes local syntax check without claiming live output', () => {
  const article = { ...base, seo: { ...base.seo, canonical: 'https://scientificradar.com/post/quality-standards' } };
  const finding = rule(article);
  assert.equal(finding?.status, 'pass');
  assert.match(finding?.description || '', /not live HTML output/i);
});

test('unsafe or non-absolute canonicals produce actionable warnings', () => {
  for (const canonical of ['/post/example', 'javascript:alert(1)', 'https://user:pass@example.com/article', 'https://example.com/article#section']) {
    const finding = rule({ ...base, seo: { ...base.seo, canonical } });
    assert.equal(finding?.status, 'warning', canonical);
  }
});

test('unintentional reuse of the same canonical is flagged across articles', () => {
  const canonical = 'https://scientificradar.com/post/quality-standards';
  const first = { ...base, seo: { ...base.seo, canonical } };
  const second = { ...first, id: 'article-2', slug: 'different-article' };
  assert.equal(rule(first, [first, second])?.status, 'warning');
});
