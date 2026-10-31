/**
 * Stable, explicit UTC date rendering for SSR and first client render.
 * The P0 demo intentionally uses UTC until a publication timezone setting exists.
 * Never use ambient toLocaleString()/toLocaleDateString() while rendering SSR markup.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const two = (number: number): string => String(number).padStart(2, '0');

function validDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function formatUtcDate(value: string): string {
  const d = validDate(value);
  if (!d) return 'Invalid date';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatUtcDateTime(value: string): string {
  const d = validDate(value);
  if (!d) return 'Invalid date';
  return `${formatUtcDate(value)}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`;
}

/** Converts stored ISO instants to the UTC convention of a datetime-local field. */
export function toUtcDateTimeInput(value?: string): string {
  if (!value) return '';
  const d = validDate(value);
  if (!d) return '';
  return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}T${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
}

/** Parse a UTC-labelled datetime-local field without applying the viewer's timezone. */
export function parseUtcDateTimeInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
    ? date
    : null;
}
