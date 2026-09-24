import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import test from 'node:test';

const crossFeatureTypeModules = [
  'asset-manifest.ts',
  'changes.ts',
  'faction.ts',
  'quality.ts',
];

test('src/types contains only explicit cross-feature primitives', async () => {
  const typesDirectory = new URL('../../src/types/', import.meta.url);
  const entries = await readdir(typesDirectory);
  const typeModules = entries.filter((entry) => entry.endsWith('.ts')).sort();

  assert.deepEqual(typeModules, crossFeatureTypeModules);
});
