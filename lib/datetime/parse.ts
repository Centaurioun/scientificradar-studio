export type ScheduleInterpretation =
  | {
      kind: 'unique';
      ok: true;
      utcIso: string;
      timeZone: string;
      isInPast: boolean;
      message?: string;
    }
  | {
      kind: 'ambiguous';
      ok: boolean;
      reason: 'ambiguous';
      utcIso: string;
      earlierUtcIso: string;
      laterUtcIso: string;
      timeZone: string;
      isInPast: boolean;
      message: string;
    }
  | {
      kind: 'nonexistent';
      ok: false;
      reason: 'nonexistent';
      utcIso: '';
      timeZone: string;
      message: string;
    }
  | {
      kind: 'invalid';
      ok: false;
      reason: 'invalid';
      utcIso: '';
      timeZone: string;
      message: string;
    };

interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Extracts wall-clock components (year, month, day, hour, minute) of a UTC timestamp in a given IANA timeZone.
 */
export function getWallPartsInZone(epochMs: number, timeZone: string): WallClockParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date(epochMs));
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (
      p.type === 'year' ||
      p.type === 'month' ||
      p.type === 'day' ||
      p.type === 'hour' ||
      p.type === 'minute'
    ) {
      map[p.type] = Number.parseInt(p.value, 10);
    }
  }
  if (map.hour === 24) map.hour = 0;

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
  };
}

/**
 * Formats a stored UTC ISO timestamp into a `YYYY-MM-DDTHH:mm` wall-clock string
 * in the specified IANA timeZone for `<input type="datetime-local">`.
 */
export function formatIsoToWallTimeInput(
  utcIso: string | undefined | null,
  timeZone: string
): string {
  if (!utcIso) return '';
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return '';

  try {
    const p = getWallPartsInZone(d.getTime(), timeZone || 'UTC');
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
  } catch {
    return d.toISOString().slice(0, 16);
  }
}

function partsMatch(a: WallClockParts, b: WallClockParts): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/**
 * Validates calendar date and converts a wall-clock string ("YYYY-MM-DDTHH:mm")
 * paired with an explicit IANA timeZone into a single UTC ISO instant.
 * Detects DST spring-forward gaps ('nonexistent') and fall-back overlaps ('ambiguous').
 */
export function interpretWallTime(
  wallTime: string,
  timeZone: string,
  disambiguate?: 'earlier' | 'later',
  nowMs: number = Date.now()
): ScheduleInterpretation {
  if (!wallTime || typeof wallTime !== 'string') {
    return {
      kind: 'invalid',
      ok: false,
      reason: 'invalid',
      utcIso: '',
      timeZone,
      message: 'Please provide a valid publication date and time (YYYY-MM-DDTHH:mm).',
    };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(wallTime.trim());
  if (!match) {
    return {
      kind: 'invalid',
      ok: false,
      reason: 'invalid',
      utcIso: '',
      timeZone,
      message: 'Invalid date/time format. Expected YYYY-MM-DDTHH:mm.',
    };
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return {
      kind: 'invalid',
      ok: false,
      reason: 'invalid',
      utcIso: '',
      timeZone,
      message: 'Calendar date or clock time is out of bounds.',
    };
  }

  // Verify real calendar day (e.g. reject 2026-02-30)
  const utcReference = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  if (
    utcReference.getUTCFullYear() !== year ||
    utcReference.getUTCMonth() + 1 !== month ||
    utcReference.getUTCDate() !== day
  ) {
    return {
      kind: 'invalid',
      ok: false,
      reason: 'invalid',
      utcIso: '',
      timeZone,
      message: `Invalid calendar date: ${match[1]}-${match[2]}-${match[3]} does not exist.`,
    };
  }

  // Validate IANA time zone
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(utcReference);
  } catch {
    return {
      kind: 'invalid',
      ok: false,
      reason: 'invalid',
      utcIso: '',
      timeZone,
      message: `Unrecognized IANA time zone: "${timeZone}".`,
    };
  }

  const desired: WallClockParts = { year, month, day, hour, minute };
  const baseUtcMs = utcReference.getTime();

  const probeOffsetsMs = [-6 * 3600_000, -2 * 3600_000, 0, 2 * 3600_000, 6 * 3600_000];
  const candidateInstants = new Set<number>();

  for (const delta of probeOffsetsMs) {
    const probeMs = baseUtcMs + delta;
    const zoned = getWallPartsInZone(probeMs, timeZone);
    const zonedAsUtcMs = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      0,
      0
    );
    const offsetMs = zonedAsUtcMs - probeMs;
    const candidateUtcMs = baseUtcMs - offsetMs;
    const checkParts = getWallPartsInZone(candidateUtcMs, timeZone);
    if (partsMatch(checkParts, desired)) {
      candidateInstants.add(candidateUtcMs);
    }
  }

  const matches = Array.from(candidateInstants).sort((a, b) => a - b);

  if (matches.length === 0) {
    return {
      kind: 'nonexistent',
      ok: false,
      reason: 'nonexistent',
      utcIso: '',
      timeZone,
      message: `The local time ${wallTime.replace('T', ' ')} does not exist in ${timeZone} due to a daylight saving time forward transition. Please choose another time.`,
    };
  }

  if (matches.length > 1) {
    const earlierIso = new Date(matches[0]).toISOString();
    const laterIso = new Date(matches[matches.length - 1]).toISOString();
    const chosenMs = disambiguate === 'later' ? matches[matches.length - 1] : matches[0];
    const chosenIso = new Date(chosenMs).toISOString();

    return {
      kind: 'ambiguous',
      ok: Boolean(disambiguate),
      reason: 'ambiguous',
      utcIso: chosenIso,
      earlierUtcIso: earlierIso,
      laterUtcIso: laterIso,
      timeZone,
      isInPast: chosenMs < nowMs - 60_000,
      message: `The local time ${wallTime.replace('T', ' ')} occurs twice in ${timeZone} when clocks move back. Please select whether you mean the earlier (${earlierIso.slice(11, 16)} UTC) or later (${laterIso.slice(11, 16)} UTC) occurrence.`,
    };
  }

  const finalMs = matches[0];
  return {
    kind: 'unique',
    ok: true,
    utcIso: new Date(finalMs).toISOString(),
    timeZone,
    isInPast: finalMs < nowMs - 60_000,
  };
}
