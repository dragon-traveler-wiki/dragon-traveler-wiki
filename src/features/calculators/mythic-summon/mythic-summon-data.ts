import type { DropRate } from '@/features/calculators/mythic-summon/drop-rates';

export const MYTHIC_LUMINARY_SHARD_RATES: DropRate[] = [
  { chance: 0.07, amount: 5 },
  { chance: 0.13, amount: 3 },
  { chance: 0.06, amount: 2 },
  { chance: 0.14, amount: 1 },
];

export const WISHING_LILY_RATES: DropRate[] = [
  { chance: 0.015, amount: 30 },
  { chance: 0.05, amount: 25 },
  { chance: 0.1, amount: 10 },
  { chance: 0.035, amount: 5 },
];

export const SUBSTITUTE_DOLL_FRAGMENT_RATES: DropRate[] = [
  { chance: 0.02, amount: 10 },
  { chance: 0.1, amount: 8 },
  { chance: 0.273, amount: 5 },
];

export const DIAMOND_RATES: DropRate[] = [
  { chance: 0.0001, amount: 30000 },
  { chance: 0.001, amount: 8888 },
  { chance: 0.0059, amount: 3000 },
];

// Each summon guarantees 5-9 Wishing Lilies (average: 7).
export const WISHING_LILY_BONUS_MIN = 5;
export const WISHING_LILY_BONUS_MAX = 9;
export const GUARANTEED_WISHING_LILIES_PER_SUMMON = 7;

export type Milestone = {
  summons: number;
  shards: number;
};

export const MILESTONES: Milestone[] = [
  { summons: 10, shards: 2 },
  { summons: 30, shards: 3 },
  { summons: 60, shards: 4 },
  { summons: 90, shards: 6 },
  { summons: 150, shards: 10 },
  { summons: 240, shards: 15 },
  { summons: 300, shards: 20 },
];
