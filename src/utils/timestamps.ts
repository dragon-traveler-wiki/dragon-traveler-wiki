export function getLatestTimestamp(
  items: { last_updated?: number | null }[],
): number {
  return items.reduce((max, item) => Math.max(max, item.last_updated ?? 0), 0);
}

/** Formats a unix timestamp (seconds) as a relative string: "2d ago", "3h ago", etc. */
export function formatRelativeTime(unixSeconds: number): string {
  if (!unixSeconds) return '';

  const diffMs = Date.now() - unixSeconds * 1000;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

/** Formats a unix timestamp (seconds) as a short date: "Jan 1, 2024". */
export function formatShortDate(unixSeconds: number): string {
  if (!unixSeconds) return '';
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a calendar date string like "2026-08-02" as "Aug 2, 2026". Date-only
 * strings parse as UTC midnight, so formatting in the viewer's timezone would
 * show the previous day west of UTC; format in UTC to keep the printed day.
 */
export function formatIsoDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Formats a unix timestamp (seconds) as a full locale date+time string. */
export function formatExactDate(unixSeconds: number): string {
  if (!unixSeconds) return '';
  return new Date(unixSeconds * 1000).toLocaleString();
}
