export type ReportStatus = 'open' | 'resolved' | 'dismissed';

/**
 * How a report's outcome is shown. "Resolved" and "dismissed" are worded and
 * colored as clearly different results: something was done, or nothing was.
 */
export const REPORT_STATUS_DISPLAY: Record<
  ReportStatus,
  { label: string; color: string }
> = {
  open: { label: 'Open', color: 'yellow' },
  resolved: { label: 'Action taken', color: 'teal' },
  dismissed: { label: 'No action', color: 'gray' },
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  broken: 'Broken or invalid data',
  abusive: 'Abusive content',
  other: 'Other',
};

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
