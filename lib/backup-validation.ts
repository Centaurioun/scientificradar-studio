import { z } from 'zod';
import { sanitizeEditorialHtml, trustedMediaSourceSet } from './html-security';

const id = z.string().trim().min(1).max(256);
const strings = z.array(z.string().max(4096)).max(50_000);
const html = z.string().max(1_048_576);
const locale = z.enum(['en', 'tr']);
const role = z.enum(['owner', 'editor', 'author', 'reviewer']);
const safeBackupUrl = z.string().max(4096).refine((value) => {
  const normalized = value.trim();
  if (!normalized || normalized.startsWith('//') || (normalized.startsWith('/') && normalized[1] === '\\')) return false;
  if (normalized.startsWith('/')) return true;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, 'must be an HTTP(S) URL or same-application path');

const article = z.object({
  id,
  locale,
  title: z.string().max(20_000),
  slug: z.string().max(2_000),
  summary: z.string().max(100_000),
  body: z.record(z.string(), z.unknown()),
  bodyHtml: html,
  status: z.enum(['idea', 'draft', 'in_review', 'revision_requested', 'approved', 'scheduled', 'published', 'archived']),
  primaryCategoryId: id.optional(),
  categoryIds: strings,
  tagIds: strings,
  seriesId: id.optional(),
  authorId: id.optional(),
  sourceIds: strings,
  featuredMediaId: id.optional(),
  seo: z.object({
    title: z.string().max(20_000).optional(),
    description: z.string().max(100_000).optional(),
    canonical: z.string().max(4096).optional(),
    noindex: z.boolean().optional(),
  }).passthrough(),
  scheduledAt: z.string().max(100).optional(),
  publishedAt: z.string().max(100).optional(),
  createdAt: z.string().max(100),
  updatedAt: z.string().max(100),
  version: z.number().int().min(1),
  reviewNotes: z.array(z.object({
    id, articleId: id, authorName: z.string().max(20_000), role,
    note: z.string().max(100_000),
    action: z.enum(['submit', 'approve', 'request_revision', 'return_to_draft', 'comment']).optional(),
    createdAt: z.string().max(100), resolved: z.boolean().optional(),
  }).passthrough()).max(10_000).optional(),
}).passthrough();

const page = z.object({
  id,
  title: z.string().max(20_000),
  slug: z.string().max(2_000),
  locale,
  summary: z.string().max(100_000),
  body: z.record(z.string(), z.unknown()),
  bodyHtml: html,
  status: z.enum(['draft', 'published', 'archived']),
  template: z.enum(['standard', 'policy', 'landing']),
  navigationVisibility: z.boolean(),
  seo: z.object({
    title: z.string().max(20_000).optional(),
    description: z.string().max(100_000).optional(),
    noindex: z.boolean().optional(),
  }).passthrough(),
  updatedAt: z.string().max(100),
}).passthrough();

const media = z.object({
  id,
  filename: z.string().max(4096),
  title: z.string().max(20_000),
  kind: z.enum(['photograph', 'scientific_figure', 'chart', 'diagram', 'screenshot', 'illustration']),
  src: z.string().max(12_000_000),
  mime: z.string().regex(/^image\/(?:png|jpeg|webp|avif|svg\+xml)$/i).max(256),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
  byteSize: z.number().finite().nonnegative(),
  altText: z.string().max(20_000),
  humanReviewedAlt: z.boolean().optional(),
  caption: z.string().max(100_000).optional(),
  credit: z.string().max(20_000).optional(),
  licence: z.string().max(20_000).optional(),
  sourceUrl: safeBackupUrl.optional(),
  layout: z.enum(['auto', 'manual', 'locked']),
  focalPoint: z.object({ x: z.number().finite(), y: z.number().finite() }).passthrough().optional(),
  createdAt: z.string().max(100),
}).passthrough();

const knowledgeLink = z.object({
  id,
  term: z.string().min(1).max(2_000),
  targetType: z.enum(['internal', 'wikipedia']),
  targetUrl: safeBackupUrl,
  targetArticleId: id.optional(),
  locale: z.enum(['en', 'tr']),
  previewTitle: z.string().max(20_000),
  previewExcerpt: z.string().max(100_000),
  sourceAttribution: z.string().max(20_000),
  reviewStatus: z.enum(['approved', 'suggested', 'rejected']),
  isSampleDemoData: z.boolean(),
}).passthrough();

const menuItem: z.ZodType<Record<string, unknown>> = z.lazy(() => z.object({
  id,
  label: z.string().max(20_000),
  href: safeBackupUrl,
  targetType: z.enum(['category', 'page', 'external', 'custom']),
  openInNewTab: z.boolean().optional(),
  children: z.array(menuItem).max(1_000).optional(),
}).passthrough());

const menu = z.object({
  id,
  name: z.string().max(2000),
  location: z.enum(['primary', 'footer']),
  dropdownBehavior: z.enum(['both', 'hover', 'click']),
  items: z.array(menuItem).max(10_000),
}).passthrough();

const source = z.object({
  id,
  articleId: id.optional(),
  title: z.string().max(20_000),
  authors: z.string().max(100_000),
  journal: z.string().max(20_000),
  year: z.number().int().min(0).max(9999),
  doi: z.string().max(4096).optional(),
  url: safeBackupUrl,
  sourceType: z.enum(['peer_reviewed', 'preprint', 'dataset', 'institutional', 'institutional_report', 'book']),
  accessDate: z.string().max(100),
  verificationStatus: z.enum(['unverified', 'syntax_checked_only', 'human_checked', 'verified_metadata', 'url_checked', 'needs_review', 'broken_url']),
}).passthrough();

const category = z.object({
  id, name: z.string().max(20_000), slug: z.string().max(2000),
  parentId: id.optional(), description: z.string().max(100_000).optional(), locale,
}).passthrough();
const tag = z.object({
  id, name: z.string().max(20_000), slug: z.string().max(2000), aliases: strings.optional(),
}).passthrough();
const series = z.object({
  id, title: z.string().max(20_000), slug: z.string().max(2000), description: z.string().max(100_000),
  locale, articleIds: strings, updatedAt: z.string().max(100),
}).passthrough();
const author = z.object({
  id, displayName: z.string().max(20_000), slug: z.string().max(2000), biography: z.string().max(100_000),
  expertise: strings, affiliation: z.string().max(20_000).optional(), orcid: z.string().max(256).optional(),
  avatarSvg: z.string().max(100_000).optional(), locale, role,
}).passthrough();
const homepageBlock = z.object({
  id, type: z.enum(['hero', 'featured_grid', 'recent_feed', 'topical_highlight', 'editorial_banner']),
  title: z.string().max(20_000), enabled: z.boolean(), order: z.number().int(), articleIds: strings,
  categoryFilterId: id.optional(), bannerText: z.string().max(100_000).optional(),
}).passthrough();
const auditEvent = z.object({
  id, timestamp: z.string().max(100), actor: z.string().max(20_000), role,
  action: z.string().max(20_000),
  targetType: z.enum(['article', 'page', 'taxonomy', 'media', 'navigation', 'review', 'assistant', 'system']),
  targetTitle: z.string().max(20_000), details: z.string().max(100_000),
}).passthrough();
const integration = z.object({
  id: z.enum(['codex', 'cloudflare_r2', 'cloudflare_images', 'google_adsense', 'google_analytics_4', 'google_search_console', 'google_tag_manager']),
  name: z.string().max(2000), category: z.enum(['ai', 'media_cloud', 'google_services']),
  status: z.enum(['not_connected', 'configured', 'error']), intendedUse: z.string().max(20_000),
  p0Behavior: z.string().max(20_000), lastCheckedAt: z.string().max(100).optional(),
  statusDetail: z.string().max(20_000), requiredEnvVars: strings,
}).passthrough();
const navigation = z.object({
  preset: z.enum(['balanced', 'show_all', 'minimal', 'custom']),
  visibleItems: z.record(z.enum([
    'dashboard', 'articles', 'pages', 'categories', 'media', 'series', 'homepage', 'videos',
    'review', 'calendar', 'authors', 'revisions', 'assistant', 'seo', 'knowledge_links',
    'search_performance', 'settings_general', 'settings_navigation', 'settings_defaults',
    'settings_integrations', 'settings_roles', 'settings_audit',
  ]), z.boolean()),
  collapsedGroups: z.record(z.string(), z.boolean()),
  sidebarCollapsed: z.boolean(),
  dashboardWidgets: z.object({
    metrics: z.boolean(), continueEditing: z.boolean(), requiresAttention: z.boolean(),
    upcomingCalendar: z.boolean(), recentActivity: z.boolean(),
  }).passthrough(),
}).passthrough();

const auditFinding = z.object({
  id: z.string().min(1), ruleId: z.string().min(1), status: z.enum(['pass', 'warning', 'error', 'unverified']),
  title: z.string(), description: z.string(), checkOrigin: z.enum(['local', 'site', 'external']),
  origin: z.enum(['local_deterministic', 'external_unverified', 'human_required']),
  canQuickFix: z.boolean(), quickFixAvailable: z.boolean(), canSuggestWithAI: z.boolean(),
  aiFixEligible: z.boolean(), isPublicationBlocker: z.boolean(), blocksPublish: z.boolean(),
}).passthrough();
const auditReport = z.object({
  articleId: id, articleFingerprint: z.string(), executedAt: z.string(), generatedAt: z.string(),
  findings: z.array(auditFinding).max(10_000),
  counts: z.object({ pass: z.number(), warning: z.number(), error: z.number(), unverified: z.number() }).passthrough(),
  blockerCount: z.number(), checkedScope: z.array(z.enum(['local', 'site', 'external'])),
  overallLabel: z.string(), overallTone: z.enum(['emerald', 'amber', 'red', 'slate']),
}).passthrough();

const revision = z.object({
  id,
  articleId: id,
  version: z.number().int().min(1),
  snapshot: article,
  source: z.enum(['editor', 'assistant_review', 'review', 'publish', 'restore']),
  createdAt: z.string().max(100),
  summary: z.string().max(100_000),
}).passthrough();

const snapshotSchema = z.object({
  schemaVersion: z.literal(1).optional(),
  articles: z.array(article).max(50_000),
  pages: z.array(page).max(50_000),
  categories: z.array(category).max(50_000),
  tags: z.array(tag).max(50_000),
  series: z.array(series).max(50_000),
  authors: z.array(author).max(50_000),
  media: z.array(media).max(50_000),
  sources: z.array(source).max(50_000),
  knowledgeLinks: z.array(knowledgeLink).max(50_000),
  revisions: z.array(revision).max(100_000),
  homepageBlocks: z.array(homepageBlock).max(50_000),
  menus: z.array(menu).max(1_000),
  navigation,
  auditEvents: z.array(auditEvent).max(100_000),
  integrations: z.array(integration).max(10_000),
  activeRole: z.enum(['owner', 'editor', 'author', 'reviewer']),
  theme: z.enum(['light', 'dark']),
  dateTimePreferences: z.object({
    locale: z.string().min(1).max(100).optional(),
    timeZone: z.string().min(1).max(256).refine((timeZone) => {
      try { new Intl.DateTimeFormat('en', { timeZone }); return true; } catch { return false; }
    }, 'must be a recognized time zone').optional(),
    hourCycle: z.enum(['auto', '24', '12']).optional(),
  }).passthrough().optional(),
  auditReportsByArticleId: z.record(z.string(), auditReport).optional(),
}).passthrough();

export type ValidatedSnapshot = z.infer<typeof snapshotSchema> & Record<string, unknown>;

export function validateAndSanitizeSnapshot(
  rawJson: string,
  trustedMediaSources: ReadonlySet<string> = new Set()
): { snapshot?: ValidatedSnapshot; error?: string } {
  if (rawJson.length > 25 * 1024 * 1024) return { error: 'Backup exceeds the 25 MiB size limit' };
  let decoded: unknown;
  try {
    decoded = JSON.parse(rawJson);
  } catch {
    return { error: 'Backup is not valid JSON' };
  }
  const result = snapshotSchema.safeParse(decoded);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { error: `Invalid backup schema at ${issue.path.join('.') || 'root'}: ${issue.message}` };
  }

  const value = result.data;
  const media = value.media.map((item) => ({
    ...item,
    // Untrusted external and unsupported data sources are never restored as media.
    src: isAllowedStoredMediaSource(item.src) || trustedMediaSources.has(item.src) ? item.src : '',
  }));
  const sources = trustedMediaSourceSet([
    ...trustedMediaSources,
    ...media.map((item) => item.src).filter(Boolean),
  ]);
  const normalized = {
    ...value,
    schemaVersion: 1 as const,
    articles: value.articles.map((item) => ({
      ...item,
      bodyHtml: sanitizeEditorialHtml(item.bodyHtml, { demoteBodyH1: true, trustedImageSources: sources }).html,
    })),
    pages: value.pages.map((item) => ({
      ...item,
      bodyHtml: sanitizeEditorialHtml(item.bodyHtml, { trustedImageSources: sources }).html,
    })),
    revisions: value.revisions.map((item) => ({
      ...item,
      snapshot: {
        ...item.snapshot,
        bodyHtml: sanitizeEditorialHtml(item.snapshot.bodyHtml, { demoteBodyH1: true, trustedImageSources: sources }).html,
      },
    })),
    media,
    dateTimePreferences: {
      locale: value.dateTimePreferences?.locale || 'tr-TR',
      timeZone: value.dateTimePreferences?.timeZone || 'Europe/Istanbul',
      hourCycle: value.dateTimePreferences?.hourCycle || '24',
    },
    auditReportsByArticleId: value.auditReportsByArticleId || {},
  };

  for (const field of [
    'articles', 'pages', 'categories', 'tags', 'series', 'authors', 'media', 'sources',
    'knowledgeLinks', 'revisions', 'homepageBlocks', 'menus', 'auditEvents', 'integrations',
  ]) {
    const ids = normalized[field as keyof typeof normalized] as Array<{ id: string }>;
    if (new Set(ids.map((item) => item.id)).size !== ids.length) {
      return { error: `Backup contains duplicate identifiers in ${field}` };
    }
  }
  return { snapshot: normalized as unknown as ValidatedSnapshot };
}

function isAllowedStoredMediaSource(source: string): boolean {
  if (source.startsWith('/') && !source.startsWith('//')) return true;
  if (/^data:image\/(?:png|jpeg|webp|avif);base64,[A-Za-z0-9+/=]+$/i.test(source)) return true;
  return false;
}
