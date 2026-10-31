export type FindingStatus = 'pass' | 'warning' | 'error' | 'unverified';

export type FindingCategory =
  | 'content'
  | 'metadata'
  | 'taxonomy'
  | 'links'
  | 'images'
  | 'scientific_integrity'
  | 'structured_data'
  | 'international'
  | 'technical'
  | 'seo_metadata'
  | 'heading_structure'
  | 'sources_citations'
  | 'figures_alt_text'
  | 'links_knowledge'
  | 'schema_indexing'
  | 'publishing_readiness';

export interface AuditFinding {
  id: string; // e.g. metadata.seo_title.length
  ruleId: string; // Alias for id
  category: FindingCategory;
  status: FindingStatus;
  title: string;
  description: string; // Factual, non-marketing
  observed?: string; // Evidence, never hallucinated
  recommendation?: string;
  fieldPath?: string; // e.g. seo.title, tagIds, primaryCategoryId, bodyHtml
  targetField?: string; // DOM element ID or field identifier to focus
  inspectorTab?: 'taxonomy' | 'sources' | 'figures' | 'seo' | 'revisions' | 'metadata' | 'media' | 'versions';
  focusElementId?: string;
  checkOrigin: 'local' | 'site' | 'external';
  origin: 'local_deterministic' | 'external_unverified' | 'human_required';
  verifiedAt?: string;
  canQuickFix: boolean;
  quickFixAvailable: boolean;
  quickFixLabel?: string;
  canSuggestWithAI: boolean;
  aiFixEligible: boolean;
  isPublicationBlocker: boolean;
  blocksPublish: boolean;
}

export interface AuditReport {
  articleId: string;
  articleFingerprint: string;
  executedAt: string;
  generatedAt: string;
  findings: AuditFinding[];
  counts: Record<FindingStatus, number>;
  blockerCount: number;
  checkedScope: ('local' | 'site' | 'external')[];
  overallLabel: string;
  overallTone: 'emerald' | 'amber' | 'red' | 'slate';
}

export interface FixProposal {
  findingId: string;
  ruleId: string;
  articleId: string;
  baselineFingerprint: string;
  baseFingerprint: string;
  path: string;
  targetPath: string;
  label: string;
  before: string;
  after: string;
  explanation: string;
  rationale: string;
  risk: 'mechanical' | 'metadata' | 'editorial';
  source: 'local_rule' | 'connected_ai';
  requiresHumanApproval: true;
}
