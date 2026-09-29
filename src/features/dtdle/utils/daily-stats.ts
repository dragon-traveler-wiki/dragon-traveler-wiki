import { addDaysIso } from './daily-answer.ts';
import type { DtdleStats } from '../types';

export const DEFAULT_STATS: DtdleStats = {
  currentStreak: 0,
  maxStreak: 0,
  gamesPlayed: 0,
  lastPlayedDate: null,
};

export function isValidStats(value: unknown): value is DtdleStats {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Partial<DtdleStats>;
  return (
    typeof v.currentStreak === 'number' &&
    typeof v.maxStreak === 'number' &&
    typeof v.gamesPlayed === 'number' &&
    (v.lastPlayedDate === null || typeof v.lastPlayedDate === 'string')
  );
}

/**
 * A streak survives a gap of exactly one day (today or yesterday's win keeps
 * it alive); anything older resets the displayed streak to 0 without
 * touching the persisted `stats` until the next win.
 */
export function withCurrentStreak(
  stats: DtdleStats,
  todayStr: string,
): DtdleStats {
  const streakIsCurrent =
    stats.lastPlayedDate === todayStr ||
    stats.lastPlayedDate === addDaysIso(todayStr, -1);
  return streakIsCurrent || stats.currentStreak === 0
    ? stats
    : { ...stats, currentStreak: 0 };
}

/** Records a win for `todayStr`, extending the streak if yesterday was the last win. */
export function applyWin(stats: DtdleStats, todayStr: string): DtdleStats {
  if (stats.lastPlayedDate === todayStr) return stats;
  const isConsecutive = stats.lastPlayedDate === addDaysIso(todayStr, -1);
  const currentStreak = isConsecutive ? stats.currentStreak + 1 : 1;
  return {
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    gamesPlayed: stats.gamesPlayed + 1,
    lastPlayedDate: todayStr,
  };
}
