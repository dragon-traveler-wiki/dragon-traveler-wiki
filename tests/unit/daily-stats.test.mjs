import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyWin,
  DEFAULT_STATS,
  isValidStats,
  withCurrentStreak,
} from '../../src/features/dtdle/utils/daily-stats.ts';

test('isValidStats accepts a well-formed record and rejects malformed ones', () => {
  assert.ok(isValidStats(DEFAULT_STATS));
  assert.ok(
    isValidStats({
      currentStreak: 3,
      maxStreak: 5,
      gamesPlayed: 10,
      lastPlayedDate: '2026-08-01',
    }),
  );
  assert.ok(!isValidStats(null));
  assert.ok(!isValidStats({ currentStreak: '3' }));
  assert.ok(
    !isValidStats({
      currentStreak: 1,
      maxStreak: 1,
      gamesPlayed: 1,
      lastPlayedDate: 123,
    }),
  );
});

test('applyWin starts a new streak from a cold start', () => {
  const result = applyWin(DEFAULT_STATS, '2026-08-01');
  assert.deepEqual(result, {
    currentStreak: 1,
    maxStreak: 1,
    gamesPlayed: 1,
    lastPlayedDate: '2026-08-01',
  });
});

test('applyWin extends the streak when the last win was yesterday', () => {
  const stats = {
    currentStreak: 3,
    maxStreak: 5,
    gamesPlayed: 10,
    lastPlayedDate: '2026-08-01',
  };
  const result = applyWin(stats, '2026-08-02');
  assert.equal(result.currentStreak, 4);
  assert.equal(result.maxStreak, 5);
  assert.equal(result.gamesPlayed, 11);
  assert.equal(result.lastPlayedDate, '2026-08-02');
});

test('applyWin resets the streak to 1 after a gap of more than a day', () => {
  const stats = {
    currentStreak: 5,
    maxStreak: 5,
    gamesPlayed: 10,
    lastPlayedDate: '2026-07-20',
  };
  const result = applyWin(stats, '2026-08-02');
  assert.equal(result.currentStreak, 1);
  assert.equal(result.maxStreak, 5);
});

test('applyWin raises maxStreak when the new streak beats it', () => {
  const stats = {
    currentStreak: 5,
    maxStreak: 5,
    gamesPlayed: 10,
    lastPlayedDate: '2026-08-01',
  };
  const result = applyWin(stats, '2026-08-02');
  assert.equal(result.currentStreak, 6);
  assert.equal(result.maxStreak, 6);
});

test('applyWin is a no-op if today was already recorded', () => {
  const stats = {
    currentStreak: 3,
    maxStreak: 3,
    gamesPlayed: 5,
    lastPlayedDate: '2026-08-02',
  };
  assert.equal(applyWin(stats, '2026-08-02'), stats);
});

test('withCurrentStreak keeps the streak when the last win was today or yesterday', () => {
  const stats = {
    currentStreak: 4,
    maxStreak: 4,
    gamesPlayed: 4,
    lastPlayedDate: '2026-08-01',
  };
  assert.equal(withCurrentStreak(stats, '2026-08-01').currentStreak, 4);
  assert.equal(withCurrentStreak(stats, '2026-08-02').currentStreak, 4);
});

test('withCurrentStreak zeroes a stale streak without mutating other fields', () => {
  const stats = {
    currentStreak: 4,
    maxStreak: 4,
    gamesPlayed: 4,
    lastPlayedDate: '2026-07-01',
  };
  const displayed = withCurrentStreak(stats, '2026-08-01');
  assert.equal(displayed.currentStreak, 0);
  assert.equal(displayed.maxStreak, 4);
  assert.equal(displayed.gamesPlayed, 4);
});

test('withCurrentStreak leaves an already-zero streak untouched', () => {
  assert.equal(withCurrentStreak(DEFAULT_STATS, '2026-08-01'), DEFAULT_STATS);
});
