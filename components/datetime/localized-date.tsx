'use client';

import React from 'react';
import { useStudio } from '@/lib/studio-context';
import {
  DateTimePreferences,
  formatDeterministicUtc,
  formatLocalizedInstant,
  resolveEffectiveDatePrefs,
} from '@/lib/datetime/format';

interface LocalizedDateProps {
  iso?: string | null;
  mode?: 'datetime' | 'date' | 'time';
  includeZoneName?: boolean;
  useReaderLocale?: boolean;
  fallback?: string;
  className?: string;
}

export function LocalizedDate({
  iso,
  mode = 'date',
  includeZoneName = false,
  useReaderLocale = false,
  fallback = '—',
  className,
}: LocalizedDateProps) {
  const { isHydrated, dateTimePreferences } = useStudio();

  if (!iso) {
    return <span className={className}>{fallback}</span>;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return <span className={className}>{fallback}</span>;
  }

  // Deterministic SSR & initial client hydration output — eliminates hydration mismatch
  if (!isHydrated) {
    return (
      <time dateTime={parsed.toISOString()} className={className}>
        {formatDeterministicUtc(iso, mode)}
      </time>
    );
  }

  let effectivePrefs: DateTimePreferences = resolveEffectiveDatePrefs(dateTimePreferences);
  if (useReaderLocale && typeof window !== 'undefined') {
    const readerLocale = window.navigator?.language || effectivePrefs.locale;
    const readerZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || effectivePrefs.timeZone;
    effectivePrefs = resolveEffectiveDatePrefs({
      locale: readerLocale,
      timeZone: readerZone,
      hourCycle: 'auto',
    });
  }

  const formatted = formatLocalizedInstant(iso, effectivePrefs, {
    mode,
    includeZoneName,
  });

  return (
    <time
      dateTime={parsed.toISOString()}
      title={`${parsed.toISOString()} (${effectivePrefs.timeZone})`}
      className={className}
    >
      {formatted}
    </time>
  );
}
