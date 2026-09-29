import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getHeartTrialShardsPerDay,
  HEART_TRIAL_RATES,
  SHARDS_PER_DUPE,
} from '../../src/features/calculators/star-upgrade/star-upgrade-model.ts';

test('getHeartTrialShardsPerDay uses the base rate for most qualities', () => {
  for (const quality of Object.keys(HEART_TRIAL_RATES)) {
    if (quality === 'SSR EX') continue;
    assert.equal(
      getHeartTrialShardsPerDay(quality, false),
      HEART_TRIAL_RATES[quality],
    );
    assert.equal(
      getHeartTrialShardsPerDay(quality, true),
      HEART_TRIAL_RATES[quality],
    );
  }
});

test('getHeartTrialShardsPerDay boosts SSR EX only with affection level 20', () => {
  assert.equal(
    getHeartTrialShardsPerDay('SSR EX', false),
    HEART_TRIAL_RATES['SSR EX'],
  );
  assert.equal(getHeartTrialShardsPerDay('SSR EX', true), 2);
});

test('SHARDS_PER_DUPE is a positive constant', () => {
  assert.ok(SHARDS_PER_DUPE > 0);
});
