const DAY_SECONDS = 86400;

/** Handled (resolved or dismissed) reports are kept this long, then removed. */
export const REPORT_RETENTION_DAYS = 90;

/** Oldest `resolved_at` a handled report may have and still be kept. */
export function reportCutoff(now: number): number {
  return now - REPORT_RETENTION_DAYS * DAY_SECONDS;
}

/**
 * Daily housekeeping: drops handled reports past their retention window
 * (open reports are never removed; the moderation log keeps the lasting
 * record of what was decided) and expired sessions and sign-in states.
 */
export async function purgeExpired(db: D1Database, now: number) {
  await db.batch([
    db
      .prepare(
        "DELETE FROM reports WHERE status != 'open' AND resolved_at IS NOT NULL AND resolved_at < ?",
      )
      .bind(reportCutoff(now)),
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM oauth_states WHERE expires_at < ?').bind(now),
  ]);
}
