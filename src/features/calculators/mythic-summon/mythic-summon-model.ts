import type { DropRate } from '@/features/calculators/mythic-summon/drop-rates';
import type { Milestone } from '@/features/calculators/mythic-summon/mythic-summon-data';

export function calculateGuaranteedPulls(
  currentPulls: number,
  summons: number,
): number {
  if (summons < 1) {
    return 0;
  }

  const firstGuaranteedPull = 5 - (currentPulls % 5);

  if (summons < firstGuaranteedPull) {
    return 0;
  }

  return 1 + Math.floor((summons - firstGuaranteedPull) / 5);
}

export function calculateRegularPulls(
  currentPulls: number,
  summons: number,
): number {
  return summons - calculateGuaranteedPulls(currentPulls, summons);
}

export function calculateMilestoneRewards(
  milestones: Milestone[],
  summons: number,
): number {
  return milestones
    .filter((m) => m.summons <= summons)
    .reduce((sum, m) => sum + m.shards, 0);
}

/** Normalizes a drop table's chances to sum to 1, for use on a guaranteed roll. */
export function normalizeDropTable(rates: DropRate[]): DropRate[] {
  const total = rates.reduce((sum, rate) => sum + rate.chance, 0);
  if (total <= 0) {
    return rates;
  }

  return rates.map((rate) => ({ ...rate, chance: rate.chance / total }));
}

/** Rolls once against a drop table. Returns 0 if the roll misses every entry. */
export function rollDropTable(rates: DropRate[]): number {
  const roll = Math.random();
  let cumulative = 0;

  for (const rate of rates) {
    cumulative += rate.chance;
    if (roll < cumulative) {
      return rate.amount;
    }
  }

  return 0;
}

/**
 * Probability that the 5th-pull guarantee actually fires. Always 1 unless
 * conditional pity is enabled, in which case it only fires when the first 4
 * pulls in the group of 5 all missed the shard drop table.
 */
export function computePityTriggerProbability(
  shardRates: DropRate[],
  conditionalPity: boolean,
): number {
  if (!conditionalPity) {
    return 1;
  }

  const dropChance = shardRates.reduce((sum, rate) => sum + rate.chance, 0);
  return Math.pow(1 - dropChance, 4);
}

export interface SimulateOnceInputs {
  currentPulls: number;
  numSummons: number;
  conditionalPity: boolean;
  shardRates: DropRate[];
  wishingLilyRates: DropRate[];
  substituteDollRates: DropRate[];
  diamondRates: DropRate[];
  milestones: Milestone[];
  wishingLilyBonusMin: number;
  wishingLilyBonusMax: number;
}

export interface SimResult {
  shardsFromDrops: number;
  wishingLilies: number;
  substituteDolls: number;
  diamonds: number;
  milestoneShards: number;
  totalShards: number;
}

export function simulateOnce({
  currentPulls,
  numSummons,
  conditionalPity,
  shardRates,
  wishingLilyRates,
  substituteDollRates,
  diamondRates,
  milestones,
  wishingLilyBonusMin,
  wishingLilyBonusMax,
}: SimulateOnceInputs): SimResult {
  let shardsFromDrops = 0;
  let wishingLilies = 0;
  let substituteDolls = 0;
  let diamonds = 0;

  const guaranteedShardRates = normalizeDropTable(shardRates);
  const bonusLilySpread = wishingLilyBonusMax - wishingLilyBonusMin + 1;

  // posInGroup tracks where we are within the current group of 5 (0-indexed).
  // Position 4 is the guaranteed pull.
  let posInGroup = currentPulls % 5;
  let groupHadShard = false;

  for (let i = 0; i < numSummons; i++) {
    const isGuaranteedPull = posInGroup === 4;

    // The 5th pull "uses up" the slot for other resources only when pity fires.
    // In conditional pity mode pity only fires if no shard dropped in pulls 1-4.
    const pityFires = isGuaranteedPull && (!conditionalPity || !groupHadShard);

    if (isGuaranteedPull) {
      shardsFromDrops += pityFires
        ? rollDropTable(guaranteedShardRates)
        : rollDropTable(shardRates);
      groupHadShard = false;
    } else {
      const shardAmount = rollDropTable(shardRates);
      if (shardAmount > 0) groupHadShard = true;
      shardsFromDrops += shardAmount;
    }

    // Other drops only roll on pulls that aren't locked by a pity guarantee
    if (!pityFires) {
      wishingLilies += rollDropTable(wishingLilyRates);
      substituteDolls += rollDropTable(substituteDollRates);
      diamonds += rollDropTable(diamondRates);
    }
    wishingLilies +=
      Math.floor(Math.random() * bonusLilySpread) + wishingLilyBonusMin;

    posInGroup = (posInGroup + 1) % 5;
  }

  const milestoneShards =
    calculateMilestoneRewards(milestones, currentPulls + numSummons) -
    calculateMilestoneRewards(milestones, currentPulls);

  return {
    shardsFromDrops,
    wishingLilies,
    substituteDolls,
    diamonds,
    milestoneShards,
    totalShards: shardsFromDrops + milestoneShards,
  };
}

/**
 * Finds the smallest number of summons for which `getValue` reaches `target`,
 * via exponential search + binary search. Returns null when `target` is not
 * reachable within `maxSummons` (getValue is assumed non-decreasing).
 */
export function findSummonsForTarget(
  getValue: (summons: number) => number,
  target: number,
  maxSummons = 1_000_000,
): number | null {
  if (getValue(maxSummons) < target) {
    return null;
  }

  let low = 1;
  let high = 1;

  while (getValue(high) < target && high < maxSummons) {
    high *= 2;
  }
  high = Math.min(high, maxSummons);

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (getValue(mid) >= target) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}
