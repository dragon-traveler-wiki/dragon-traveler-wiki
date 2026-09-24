import assert from 'node:assert/strict';
import test from 'node:test';
import { getNoblePhantasmPreviewDescription } from '../../src/features/wiki/noble-phantasms/utils.ts';

test('noble phantasm previews prefer character-specific effects', () => {
  assert.equal(
    getNoblePhantasmPreviewDescription({
      effects: [{ description: 'Character-specific effect' }],
      skills: [{ level: 1, description: 'General effect' }],
    }),
    'Character-specific effect',
  );
});

test('noble phantasm previews support general skill effects', () => {
  assert.equal(
    getNoblePhantasmPreviewDescription({
      effects: [],
      skills: [{ level: 1, description: 'General effect' }],
    }),
    'General effect',
  );
});

test('noble phantasm previews are empty when no effect data exists', () => {
  assert.equal(
    getNoblePhantasmPreviewDescription({ effects: [], skills: [] }),
    null,
  );
});
