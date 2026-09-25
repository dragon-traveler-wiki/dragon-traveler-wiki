export const SUSPENSION_DURATIONS = ['1d', '7d', '30d', 'permanent'] as const;
export type SuspensionDuration = (typeof SUSPENSION_DURATIONS)[number];

export interface Suspension {
  /** Unix seconds the suspension ends, or null when permanent. */
  until: number | null;
  permanent: boolean;
  reason: string;
}

const DAY_SECONDS = 86400;
const DURATION_DAYS: Record<
  Exclude<SuspensionDuration, 'permanent'>,
  number
> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
};

/** Unix seconds a suspension of the given length ends, or null when permanent. */
export function suspensionEnd(
  duration: SuspensionDuration,
  now: number,
): number | null {
  return duration === 'permanent'
    ? null
    : now + DURATION_DAYS[duration] * DAY_SECONDS;
}

/** The suspension currently in force for a user row, or null if none/expired. */
export function activeSuspension(
  row: {
    suspended_until: number | null;
    suspension_permanent: number;
    suspension_reason: string;
  },
  now: number,
): Suspension | null {
  if (row.suspension_permanent) {
    return { until: null, permanent: true, reason: row.suspension_reason };
  }
  if (row.suspended_until !== null && row.suspended_until > now) {
    return {
      until: row.suspended_until,
      permanent: false,
      reason: row.suspension_reason,
    };
  }
  return null;
}

/** Message returned to a suspended user who attempts a blocked action. */
export function suspensionMessage(suspension: Suspension): string {
  const base = suspension.permanent
    ? 'Your account has been banned'
    : `Your account is suspended until ${new Date((suspension.until ?? 0) * 1000).toUTCString()}`;
  return suspension.reason
    ? `${base}. Reason: ${suspension.reason}`
    : `${base}.`;
}
