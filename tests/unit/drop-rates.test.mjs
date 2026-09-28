import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateConditionalGuaranteedValue,
  calculateExpectedValue,
  calculateGuaranteedDropValue,
} from '../../src/features/calculators/mythic-summon/drop-rates.ts';

const RATES = [
  { chance: 0.1, amount: 10 },
  { chance: 0.2, amount: 5 },
];

test('calculateExpectedValue sums chance-weighted amounts', () => {
  assert.equal(calculateExpectedValue(RATES), 0.1 * 10 + 0.2 * 5);
});

test('calculateGuaranteedDropValue normalizes chances to sum to 1', () => {
  const total = 0.1 + 0.2;
  const expected = (0.1 / total) * 10 + (0.2 / total) * 5;
  assert.ok(Math.abs(calculateGuaranteedDropValue(RATES) - expected) < 1e-9);
});

test('calculateConditionalGuaranteedValue blends guaranteed and regular EV by pity probability', () => {
  const dropChance = 0.1 + 0.2;
  const pityProbability = Math.pow(1 - dropChance, 4);
  const expected =
    pityProbability * calculateGuaranteedDropValue(RATES) +
    (1 - pityProbability) * calculateExpectedValue(RATES);
  assert.ok(
    Math.abs(calculateConditionalGuaranteedValue(RATES) - expected) < 1e-9,
  );
});

test('an empty drop table has zero expected value', () => {
  assert.equal(calculateExpectedValue([]), 0);
});
