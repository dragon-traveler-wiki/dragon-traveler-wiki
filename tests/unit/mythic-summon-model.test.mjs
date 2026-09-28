import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateExpectedValue,
  calculateGuaranteedDropValue,
} from '../../src/features/calculators/mythic-summon/drop-rates.ts';
import {
  DIAMOND_RATES,
  GUARANTEED_WISHING_LILIES_PER_SUMMON,
  MILESTONES,
  MYTHIC_LUMINARY_SHARD_RATES,
  SUBSTITUTE_DOLL_FRAGMENT_RATES,
  WISHING_LILY_BONUS_MAX,
  WISHING_LILY_BONUS_MIN,
  WISHING_LILY_RATES,
} from '../../src/features/calculators/mythic-summon/mythic-summon-data.ts';
import {
  calculateGuaranteedPulls,
  calculateMilestoneRewards,
  calculateRegularPulls,
  computePityTriggerProbability,
  findSummonsForTarget,
  normalizeDropTable,
  rollDropTable,
  simulateOnce,
} from '../../src/features/calculators/mythic-summon/mythic-summon-model.ts';

test('calculateGuaranteedPulls counts one guaranteed pull per completed group of 5', () => {
  assert.equal(calculateGuaranteedPulls(0, 4), 0);
  assert.equal(calculateGuaranteedPulls(0, 5), 1);
  assert.equal(calculateGuaranteedPulls(0, 9), 1);
  assert.equal(calculateGuaranteedPulls(0, 10), 2);
  // Starting mid-group: 3 pulls in, next guarantee is 2 pulls away.
  assert.equal(calculateGuaranteedPulls(3, 1), 0);
  assert.equal(calculateGuaranteedPulls(3, 2), 1);
});

test('calculateRegularPulls is the complement of guaranteed pulls', () => {
  assert.equal(calculateRegularPulls(0, 10), 8);
  assert.equal(calculateRegularPulls(3, 2), 1);
});

test('calculateMilestoneRewards sums shards for reached milestones only', () => {
  assert.equal(calculateMilestoneRewards(MILESTONES, 0), 0);
  assert.equal(calculateMilestoneRewards(MILESTONES, 10), 2);
  assert.equal(calculateMilestoneRewards(MILESTONES, 29), 2);
  assert.equal(calculateMilestoneRewards(MILESTONES, 30), 5);
});

test('normalizeDropTable rescales chances to sum to 1', () => {
  const normalized = normalizeDropTable([
    { chance: 0.1, amount: 1 },
    { chance: 0.3, amount: 2 },
  ]);
  const total = normalized.reduce((sum, r) => sum + r.chance, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test('rollDropTable always returns an amount from a table that sums to 1', () => {
  const rates = [
    { chance: 0.5, amount: 10 },
    { chance: 0.5, amount: 20 },
  ];
  for (let i = 0; i < 200; i++) {
    const result = rollDropTable(rates);
    assert.ok(result === 10 || result === 20);
  }
});

test('computePityTriggerProbability is 1 when conditional pity is off', () => {
  assert.equal(
    computePityTriggerProbability(MYTHIC_LUMINARY_SHARD_RATES, false),
    1,
  );
});

test('computePityTriggerProbability matches (1 - dropChance)^4 when conditional pity is on', () => {
  const dropChance = MYTHIC_LUMINARY_SHARD_RATES.reduce(
    (sum, r) => sum + r.chance,
    0,
  );
  const expected = Math.pow(1 - dropChance, 4);
  assert.ok(
    Math.abs(
      computePityTriggerProbability(MYTHIC_LUMINARY_SHARD_RATES, true) -
        expected,
    ) < 1e-9,
  );
});

test('findSummonsForTarget finds the smallest input reaching a monotonic target', () => {
  assert.equal(
    findSummonsForTarget((summons) => summons * 2, 10),
    5,
  );
  assert.equal(
    findSummonsForTarget((summons) => summons, 1),
    1,
  );
});

test('findSummonsForTarget returns null when the target is unreachable within the cap', () => {
  assert.equal(
    findSummonsForTarget(() => 0, 1, 1000),
    null,
  );
});

test('simulateOnce milestone shards match the deterministic milestone formula', () => {
  const result = simulateOnce({
    currentPulls: 0,
    numSummons: 30,
    conditionalPity: false,
    shardRates: MYTHIC_LUMINARY_SHARD_RATES,
    wishingLilyRates: WISHING_LILY_RATES,
    substituteDollRates: SUBSTITUTE_DOLL_FRAGMENT_RATES,
    diamondRates: DIAMOND_RATES,
    milestones: MILESTONES,
    wishingLilyBonusMin: WISHING_LILY_BONUS_MIN,
    wishingLilyBonusMax: WISHING_LILY_BONUS_MAX,
  });
  assert.equal(
    result.milestoneShards,
    calculateMilestoneRewards(MILESTONES, 30),
  );
  assert.equal(
    result.totalShards,
    result.shardsFromDrops + result.milestoneShards,
  );
});

test('simulateOnce wishing lilies always include the per-summon bonus range', () => {
  const numSummons = 20;
  const result = simulateOnce({
    currentPulls: 0,
    numSummons,
    conditionalPity: false,
    shardRates: MYTHIC_LUMINARY_SHARD_RATES,
    wishingLilyRates: WISHING_LILY_RATES,
    substituteDollRates: SUBSTITUTE_DOLL_FRAGMENT_RATES,
    diamondRates: DIAMOND_RATES,
    milestones: MILESTONES,
    wishingLilyBonusMin: WISHING_LILY_BONUS_MIN,
    wishingLilyBonusMax: WISHING_LILY_BONUS_MAX,
  });
  assert.ok(result.wishingLilies >= numSummons * WISHING_LILY_BONUS_MIN);
});

// Cross-checks the Monte-Carlo simulator against the closed-form expected
// value math used by the page, per the code review's suggestion that the two
// independently-verifiable calculations should agree.
test('simulateOnce average over many runs converges to the closed-form expected value', () => {
  const currentPulls = 0;
  const numSummons = 50;
  const conditionalPity = false;
  const runs = 4000;

  const guaranteedPulls = calculateGuaranteedPulls(currentPulls, numSummons);
  const regularPulls = calculateRegularPulls(currentPulls, numSummons);
  const expectedShards =
    calculateExpectedValue(MYTHIC_LUMINARY_SHARD_RATES) * regularPulls +
    calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES) *
      guaranteedPulls +
    calculateMilestoneRewards(MILESTONES, numSummons);

  let totalShardsSum = 0;
  for (let i = 0; i < runs; i++) {
    const result = simulateOnce({
      currentPulls,
      numSummons,
      conditionalPity,
      shardRates: MYTHIC_LUMINARY_SHARD_RATES,
      wishingLilyRates: WISHING_LILY_RATES,
      substituteDollRates: SUBSTITUTE_DOLL_FRAGMENT_RATES,
      diamondRates: DIAMOND_RATES,
      milestones: MILESTONES,
      wishingLilyBonusMin: WISHING_LILY_BONUS_MIN,
      wishingLilyBonusMax: WISHING_LILY_BONUS_MAX,
    });
    totalShardsSum += result.totalShards;
  }

  const averageShards = totalShardsSum / runs;
  // Generous tolerance: this is a statistical convergence check, not an exact
  // equality, and shard amounts are small integers with visible variance.
  assert.ok(
    Math.abs(averageShards - expectedShards) < 1.5,
    `expected average ~${expectedShards}, got ${averageShards}`,
  );
});
