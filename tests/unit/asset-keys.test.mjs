import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeTypeKey } from '../../scripts/generate-route-pages.mjs';
import { normalizeKey } from '../../src/utils/asset-utils.ts';

test('asset keys strip accents like the data pipeline slugs', () => {
  assert.equal(normalizeKey('Arsène Robin'), 'arsene_robin');
  assert.equal(normalizeKey('Sweetheart Soufflé'), 'sweetheart_souffle');
  assert.equal(normalizeKey("King's Gift"), 'kings_gift');
  assert.equal(normalizeKey('SSR+'), 'ssr_plus');
  assert.equal(normalizeTypeKey('Crème Brûlée'), 'creme_brulee');
});
