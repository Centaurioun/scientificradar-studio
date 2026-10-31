'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { FindingStatus } from '@/lib/audit/types';

export type DisplayAuditStatus = FindingStatus | 'stale';

interface AuditStatusBadgeProps {
  status: DisplayAuditStatus;
  label?: string;
  size?: 'xs' | 'sm';
}

export function AuditStatusBadge({ status, label, size = 'xs' }: AuditStatusBadgeProps) {
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  if (status === 'pass') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold ${padding} bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label || 'Passed (Local)'}</span>
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold ${padding} bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800`}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label || 'Advisory Warning'}</span>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold ${padding} bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-200 border border-red-300/60 dark:border-red-800`}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label || 'Blocker Error'}</span>
      </span>
    );
  }

  if (status === 'stale') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-semibold ${padding} bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-300/60 dark:border-indigo-800`}
      >
        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label || 'Stale — Recheck Needed'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold ${padding} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}
    >
      <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label || 'Unverified (External / Human)'}</span>
    </span>
  );
}
