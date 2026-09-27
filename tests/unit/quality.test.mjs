import assert from 'node:assert/strict';
import test from 'node:test';
import { QUALITY_ORDER } from '../../src/constants/quality.ts';
import {
  compareQuality,
  compareQualityThenName,
  getQualityRank,
  UNKNOWN_QUALITY_RANK,
} from '../../src/utils/quality.ts';

test('quality ranking follows the canonical rarest-first order', () => {
  for (const [index, quality] of QUALITY_ORDER.entries()) {
    assert.equal(getQualityRank(quality), index);
  }
  assert.ok(compareQuality('UR+', 'SSR') < 0);
  assert.ok(compareQuality('C', 'SSR') > 0);
});

test('unknown qualities sort last and tie by name', () => {
  assert.equal(getQualityRank('Unknown'), UNKNOWN_QUALITY_RANK);
  assert.equal(getQualityRank(undefined), UNKNOWN_QUALITY_RANK);
  assert.ok(compareQuality('Unknown', 'C') > 0);
  assert.equal(compareQuality('Unknown', undefined), 0);
  assert.ok(compareQualityThenName('SSR', 'SSR', 'Alpha', 'Beta') < 0);
  assert.ok(compareQualityThenName('Unknown', 'C', 'Alpha', 'Beta') > 0);
});
