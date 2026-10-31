export type HourCycleOption = 'auto' | '24' | '12';

export interface DateTimePreferences {
  locale: string;
  timeZone: string;
  hourCycle: HourCycleOption;
}

export const DEFAULT_ADMIN_DATETIME_PREFS: DateTimePreferences = {
  locale: 'tr-TR',
  timeZone: 'Europe/Istanbul',
  hourCycle: '24',
};

/**
 * Formats an ISO 8601 timestamp into a deterministic UTC string for SSR and initial client render.
 * Guarantees zero React hydration mismatches across differing server and browser time zones.
 */
export function formatDeterministicUtc(
  iso: string | undefined | null,
  mode: 'datetime' | 'date' | 'time' = 'datetime'
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return 'Invalid date';
  }
  const isoStr = d.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
  const datePart = isoStr.slice(0, 10);
  const timePart = isoStr.slice(11, 16);

  if (mode === 'date') {
    return `${datePart} UTC`;
  }
  if (mode === 'time') {
    return `${timePart} UTC`;
  }
  return `${datePart} ${timePart} UTC`;
}

/**
 * Resolves effective locale, IANA timeZone, and hourCycle from user preferences or browser environment.
 */
export function resolveEffectiveDatePrefs(
  prefs?: Partial<DateTimePreferences> | null
): {
  locale: string;
  timeZone: string;
  hourCycle: 'auto' | '24' | '12';
} {
  const browserLocale =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'tr-TR';
  const deviceTz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC';

  const locale =
    !prefs?.locale || prefs.locale === 'browser' ? browserLocale : prefs.locale;
  const timeZone =
    !prefs?.timeZone || prefs.timeZone === 'device' ? deviceTz : prefs.timeZone;
  const hourCycle = prefs?.hourCycle || '24';

  return { locale, timeZone, hourCycle };
}

/**
 * Formats an ISO 8601 instant according to explicit locale, IANA timeZone, and 12/24-hour preference.
 * Never mutates the underlying UTC instant.
 */
export function formatLocalizedInstant(
  iso: string | undefined | null,
  prefs: {
    locale: string;
    timeZone: string;
    hourCycle: 'auto' | '24' | '12';
  },
  modeOrOptions:
    | 'datetime'
    | 'date'
    | 'time'
    | { mode?: 'datetime' | 'date' | 'time'; includeZoneName?: boolean } = 'datetime',
  includeZoneNameArg = false
): string {
  const mode =
    typeof modeOrOptions === 'string' ? modeOrOptions : modeOrOptions.mode || 'datetime';
  const includeZoneName =
    typeof modeOrOptions === 'string'
      ? includeZoneNameArg
      : Boolean(modeOrOptions.includeZoneName);

  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: prefs.timeZone || 'UTC',
    };

    if (mode === 'date' || mode === 'datetime') {
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
    }

    if (mode === 'time' || mode === 'datetime') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      if (prefs.hourCycle === '24') {
        options.hour12 = false;
        options.hourCycle = 'h23';
      } else if (prefs.hourCycle === '12') {
        options.hour12 = true;
        options.hourCycle = 'h12';
      }
    }

    if (includeZoneName) {
      options.timeZoneName = 'short';
    }

    return new Intl.DateTimeFormat(prefs.locale || 'tr-TR', options).format(date);
  } catch {
    return formatDeterministicUtc(iso, mode);
  }
}
