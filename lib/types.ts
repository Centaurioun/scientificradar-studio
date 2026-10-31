export type Locale = 'en' | 'tr';

export type ArticleStatus =
  | 'idea'
  | 'draft'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export type UserRole = 'owner' | 'editor' | 'author' | 'reviewer';

export type MediaKind =
  | 'photograph'
  | 'scientific_figure'
  | 'chart'
  | 'diagram'
  | 'screenshot'
  | 'illustration';

export type MediaLayout = 'auto' | 'manual' | 'locked';

export type SourceVerificationStatus =
  | 'unverified'
  | 'syntax_checked_only'
  | 'human_checked'
  | 'verified_metadata'
  | 'url_checked'
  | 'needs_review'
  | 'broken_url';

export interface Article {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  summary: string;
  body: Record<string, unknown>; // Tiptap JSON
  bodyHtml: string; // Sanitized HTML representation for fast preview/search
  status: ArticleStatus;
  primaryCategoryId?: string;
  categoryIds: string[];
  tagIds: string[];
  seriesId?: string;
  authorId?: string;
  sourceIds: string[];
  featuredMediaId?: string;
  seo: {
    title?: string;
    description?: string;
    canonical?: string;
    noindex?: boolean;
  };
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  reviewNotes?: ReviewNote[];
}

export interface ReviewNote {
  id: string;
  articleId: string;
  authorName: string;
  role: UserRole;
  note: string;
  action?: 'submit' | 'approve' | 'request_revision' | 'return_to_draft' | 'comment';
  createdAt: string;
  resolved?: boolean;
}

export interface EditorialPage {
  id: string;
  title: string;
  slug: string;
  locale: Locale;
  summary: string;
  body: Record<string, unknown>;
  bodyHtml: string;
  status: 'draft' | 'published' | 'archived';
  template: 'standard' | 'policy' | 'landing';
  navigationVisibility: boolean;
  seo: {
    title?: string;
    description?: string;
    noindex?: boolean;
  };
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  locale: Locale;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  aliases?: string[];
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string;
  locale: Locale;
  articleIds: string[];
  updatedAt: string;
}

export interface AuthorProfile {
  id: string;
  displayName: string;
  slug: string;
  biography: string;
  expertise: string[];
  affiliation?: string;
  orcid?: string;
  avatarSvg?: string;
  locale: Locale;
  role: UserRole;
}

export interface ScientificSource {
  id: string;
  articleId?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  url: string;
  sourceType: 'peer_reviewed' | 'preprint' | 'dataset' | 'institutional' | 'institutional_report' | 'book';
  accessDate: string;
  verificationStatus: SourceVerificationStatus;
  humanClaimVerified?: boolean;
  notes?: string;
  linkedClaim?: string;
}

export interface KnowledgeLink {
  id: string;
  term: string;
  targetType: 'internal' | 'wikipedia';
  targetUrl: string;
  targetArticleId?: string;
  locale: Locale;
  previewTitle: string;
  previewExcerpt: string;
  sourceAttribution: string;
  reviewStatus: 'approved' | 'suggested' | 'rejected';
  isSampleDemoData: boolean;
}

export interface MediaAsset {
  id: string;
  filename: string;
  title: string;
  kind: MediaKind;
  src: string;
  mime: string;
  width: number;
  height: number;
  byteSize: number;
  altText: string;
  humanReviewedAlt?: boolean;
  caption?: string;
  credit?: string;
  licence?: string;
  sourceUrl?: string;
  layout: MediaLayout;
  focalPoint?: { x: number; y: number };
  createdAt: string;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  version: number;
  snapshot: Article;
  source: 'editor' | 'assistant_review' | 'review' | 'publish' | 'restore';
  createdAt: string;
  summary: string;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  targetType: 'category' | 'page' | 'external' | 'custom';
  openInNewTab?: boolean;
  children?: MenuItem[];
}

export interface MenuConfig {
  id: string;
  name: string;
  location: 'primary' | 'footer';
  dropdownBehavior: 'both' | 'hover' | 'click';
  items: MenuItem[];
}

export interface HomepageBlock {
  id: string;
  type: 'hero' | 'featured_grid' | 'recent_feed' | 'topical_highlight' | 'editorial_banner';
  title: string;
  enabled: boolean;
  order: number;
  articleIds: string[];
  categoryFilterId?: string;
  bannerText?: string;
}

export type NavItemId =
  | 'dashboard'
  | 'articles'
  | 'pages'
  | 'categories'
  | 'media'
  | 'series'
  | 'homepage'
  | 'videos'
  | 'review'
  | 'calendar'
  | 'authors'
  | 'revisions'
  | 'assistant'
  | 'seo'
  | 'knowledge_links'
  | 'search_performance'
  | 'settings_general'
  | 'settings_navigation'
  | 'settings_defaults'
  | 'settings_integrations'
  | 'settings_roles'
  | 'settings_audit';

export type NavPreset = 'balanced' | 'show_all' | 'minimal' | 'custom';

export interface NavigationPreference {
  preset: NavPreset;
  visibleItems: Record<NavItemId, boolean>;
  collapsedGroups: Record<string, boolean>;
  sidebarCollapsed: boolean;
  dashboardWidgets: {
    metrics: boolean;
    continueEditing: boolean;
    requiresAttention: boolean;
    upcomingCalendar: boolean;
    recentActivity: boolean;
  };
}

export type ChangeCategory = 'mechanical' | 'metadata' | 'editorial' | 'unverified';
export type AssistantTask = 'format' | 'images' | 'seo' | 'sources' | 'knowledge';

export interface EditorialChange {
  id: string;
  articleId: string;
  baseVersion: number;
  task: AssistantTask;
  category: ChangeCategory;
  targetPath: 'title' | 'summary' | 'slug' | 'bodyHtml' | 'seo.title' | 'seo.description' | 'tagIds' | 'media.altText' | 'sources' | 'knowledgeLinks';
  label: string;
  before: string;
  after: string;
  reason: string;
  requiresApproval: true;
  safeToAutoSelect: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  targetType: 'article' | 'page' | 'taxonomy' | 'media' | 'navigation' | 'review' | 'assistant' | 'system';
  targetTitle: string;
  details: string;
}

export interface IntegrationConnection {
  id: 'codex' | 'cloudflare_r2' | 'cloudflare_images' | 'google_adsense' | 'google_analytics_4' | 'google_search_console' | 'google_tag_manager';
  name: string;
  category: 'ai' | 'media_cloud' | 'google_services';
  status: 'not_connected' | 'configured' | 'error';
  intendedUse: string;
  p0Behavior: string;
  lastCheckedAt?: string;
  statusDetail: string;
  requiredEnvVars: string[];
}

export type SaveState = 'clean' | 'dirty' | 'saving' | 'failed';

export interface SaveReceipt {
  ok: boolean;
  savedAt: string;
  version: number;
  demotedH1Count: number;
  volatileMemoryOnly: boolean;
  error?: string;
}


