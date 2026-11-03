import type { Article, ArticleRevision, AuditEvent, MediaAsset, SaveReceipt } from '../types';
import type {
  PublicationAuthorizationReceipt,
  PublishedSnapshotRecordV1,
  SnapshotValidationResult,
} from './web-contract-v1';

/**
 * M5 — Storage, Media Transfer & Publication Transport Ports
 * Clean architectural port interfaces preparing ScientificRadar Studio for
 * Stage C server-side persistence and immutable snapshot delivery to
 * ScientificRadar Web without coupling the UI to local IndexedDB/memory state.
 */

export interface PublicationAuditReceipt {
  receiptId: string;
  snapshotId: string;
  articleId: string;
  contractVersion: '1.0.0';
  exportedAt: string;
  actor: string;
  role: 'owner' | 'editor' | 'author' | 'reviewer';
  transportMode: 'local_preview_only' | 'fixture_bundle_export' | 'remote_web_webhook';
  publicEligible: boolean;
  validation: SnapshotValidationResult;
}

export interface StudioPersistencePort {
  readonly mode: 'local_indexeddb_demo' | 'remote_postgres_api';
  loadArticles(): Promise<Article[]>;
  saveArticle(article: Article, expectedBaseVersion?: number): Promise<SaveReceipt>;
  listRevisions(articleId: string): Promise<ArticleRevision[]>;
  appendAuditEvent(event: AuditEvent): Promise<void>;
}

export interface MediaTransferPort {
  readonly provider: 'local_svg_demo' | 'cloudflare_r2';
  verifyMediaAssetReadyForPublish(asset: MediaAsset): Promise<{
    ready: boolean;
    publicUrl: string;
    rightsVerified: boolean;
    reason?: string;
  }>;
}

export interface PublicationTransportPort {
  readonly targetOrigin: 'local_preview_sandbox' | 'https://scientificradar.com';
  readonly isLiveConnected: boolean;
  exportSnapshotV1(
    snapshot: PublishedSnapshotRecordV1,
    authorization?: PublicationAuthorizationReceipt
  ): Promise<PublicationAuditReceipt>;
}
