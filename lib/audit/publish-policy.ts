import { ArticleStatus, UserRole } from '../types';
import { canTransitionStatus } from '../editorial-rules';
import { AuditFinding, AuditReport } from './types';

export interface PublishGateEvaluation {
  canPublish: boolean;
  requiresWarningConfirmation: boolean;
  canPublishImmediately: boolean;
  canPublishWithWarningOverride: boolean;
  canPublishWithConfirmation: boolean;
  isBlocked: boolean;
  roleError?: string;
  saveError?: string;
  blockers: AuditFinding[];
  warnings: AuditFinding[];
  unverified: AuditFinding[];
  passedCount: number;
}

/**
 * Evaluates whether an article can transition to `published` or `scheduled`
 * according to the centralized Pre-Publish Check policy (Spec v5 §8).
 * Accepts either an AuditReport directly or a full options object.
 */
export function evaluatePublishGate(
  input:
    | AuditReport
    | {
        report: AuditReport;
        currentStatus?: ArticleStatus;
        targetStatus?: 'published' | 'scheduled';
        activeRole?: UserRole;
        isDirtyOrFailedSave?: boolean;
      }
): PublishGateEvaluation {
  const isReportDirect = 'findings' in input && 'articleFingerprint' in input;
  const report = isReportDirect ? input : input.report;
  const currentStatus = isReportDirect ? 'approved' : input.currentStatus || 'approved';
  const targetStatus = isReportDirect ? 'published' : input.targetStatus || 'published';
  const activeRole = isReportDirect ? 'editor' : input.activeRole || 'editor';
  const isDirtyOrFailedSave = isReportDirect ? false : Boolean(input.isDirtyOrFailedSave);

  const roleCheck = canTransitionStatus(currentStatus, targetStatus, activeRole);
  const blockers = report.findings.filter(
    (f) => f.isPublicationBlocker && (f.status === 'error' || f.status === 'warning')
  );
  const nonBlockerErrors = report.findings.filter(
    (f) => !f.isPublicationBlocker && f.status === 'error'
  );
  const allBlockers = [...blockers, ...nonBlockerErrors];

  const warnings = report.findings.filter(
    (f) => !f.isPublicationBlocker && f.status === 'warning'
  );
  const unverified = report.findings.filter((f) => f.status === 'unverified');

  const saveError = isDirtyOrFailedSave
    ? 'Unsaved changes or failed persistence detected. Draft must be saved before publishing.'
    : undefined;

  const isBlocked = !roleCheck.allowed || Boolean(saveError) || allBlockers.length > 0;
  const canPublishImmediately = !isBlocked && warnings.length === 0;
  const canPublishWithWarningOverride = !isBlocked && warnings.length > 0;

  return {
    canPublish: !isBlocked,
    requiresWarningConfirmation: canPublishWithWarningOverride,
    canPublishImmediately,
    canPublishWithWarningOverride,
    canPublishWithConfirmation: !isBlocked,
    isBlocked,
    roleError: roleCheck.allowed ? undefined : roleCheck.reason,
    saveError,
    blockers: allBlockers,
    warnings,
    unverified,
    passedCount: report.counts.pass,
  };
}
