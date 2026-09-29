import type { Character } from '@/features/characters/types';
import { buildRing, fnv1aHash32, pickFromRing } from './ring-hash.ts';

const EXCLUDED_QUALITIES = new Set(['N', 'C']);
const LOOKBACK_DAYS = 14;
const MS_PER_DAY = 86_400_000;
// Anchored 14 days before the fixed-schedule cutover so the answer already
// served on 2026-07-19 remains unchanged while subsequent days share one history.
const SCHEDULE_EPOCH = '2026-07-05';

/** Characters eligible to be a daily answer: quality "R" or better. */
export function getEligibleCharacters(characters: Character[]): Character[] {
  return characters.filter((c) => !EXCLUDED_QUALITIES.has(c.quality));
}

/**
 * Uses the UTC calendar day, not the player's local day, so every player
 * worldwide gets the same puzzle at the same moment. The reset boundary a
 * player experiences is UTC midnight, not their local midnight.
 */
export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** UTC-based date math, safe for any positive or negative day offset. */
export function addDaysIso(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMilliseconds(date.getUTCMilliseconds() + days * MS_PER_DAY);
  return date.toISOString().slice(0, 10);
}

function pickForDate(
  dateStr: string,
  ring: ReturnType<typeof buildRing>,
  excludedSlugs: ReadonlySet<string>,
  modeSalt = '',
): string {
  const dateHash = fnv1aHash32(modeSalt ? `${modeSalt}:${dateStr}` : dateStr);
  return pickFromRing(ring, dateHash, excludedSlugs);
}

/**
 * Derives today's answer with no stored schedule by replaying from a fixed
 * epoch. A fixed origin is required: replaying only a moving lookback window
 * can reconstruct different prior answers on consecutive days.
 *
 * `modeSalt` namespaces the hash so different game modes each get their own
 * independent daily answer from the same ring. Leaving it empty preserves
 * Classic mode's original (already-live) hash input exactly.
 */
export function getTodayAnswerSlug(
  todayStr: string,
  eligibleSlugsSorted: string[],
  modeSalt = '',
): string {
  const ring = buildRing(eligibleSlugsSorted);
  const history: string[] = [];
  let dayStr = SCHEDULE_EPOCH;
  while (dayStr < todayStr) {
    const excluded = new Set(history.slice(-LOOKBACK_DAYS));
    history.push(pickForDate(dayStr, ring, excluded, modeSalt));
    dayStr = addDaysIso(dayStr, 1);
  }

  const excluded = new Set(history.slice(-LOOKBACK_DAYS));
  return pickForDate(todayStr, ring, excluded, modeSalt);
}
