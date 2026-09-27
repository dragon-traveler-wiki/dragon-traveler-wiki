import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sharedBarrels = [
  '../../src/components/index.ts',
  '../../src/contexts/index.ts',
  '../../src/hooks/index.ts',
  '../../src/utils/index.ts',
];

test('shared barrels do not re-export feature-owned modules', async () => {
  for (const barrelPath of sharedBarrels) {
    const barrelUrl = new URL(barrelPath, import.meta.url);
    const source = await readFile(barrelUrl, 'utf8');

    assert.doesNotMatch(
      source,
      /@\/features\//,
      `${barrelPath} must not re-export feature-owned modules`,
    );
  }
});
