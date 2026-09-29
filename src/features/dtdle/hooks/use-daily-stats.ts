import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyWin,
  DEFAULT_STATS,
  isValidStats,
  withCurrentStreak,
} from '../utils/daily-stats';
import type { DtdleStats } from '../types';

/** Shared win-streak tracking, persisted under `storageKey`. A "day" is `todayStr`. */
export function useDailyStats(storageKey: string, todayStr: string) {
  const [stats, setStats] = useState<DtdleStats>(() =>
    readStoredJson(storageKey, DEFAULT_STATS, isValidStats),
  );

  useEffect(() => {
    writeStoredJson(storageKey, stats);
  }, [storageKey, stats]);

  const displayedStats = useMemo(
    () => withCurrentStreak(stats, todayStr),
    [stats, todayStr],
  );

  const recordWin = useCallback(() => {
    setStats((prev) => applyWin(prev, todayStr));
  }, [todayStr]);

  return { stats: displayedStats, recordWin };
}
