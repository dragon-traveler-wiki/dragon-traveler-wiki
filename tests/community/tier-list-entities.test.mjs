import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTierEntrySlug,
  getTierListEntityType,
  isCharacterTierEntry,
  isNoblePhantasmTierEntry,
} from '../../src/features/tier-list/types.ts';

test('legacy tier lists default to character entries', () => {
  assert.equal(getTierListEntityType({}), 'character');
  assert.equal(
    getTierListEntityType({ entity_type: 'noble_phantasm' }),
    'noble_phantasm',
  );
});

test('tier entry helpers distinguish character and Noble Phantasm slugs', () => {
  const character = { character_slug: 'zeus_ssr_ex', tier: 'S' };
  const noblePhantasm = {
    noble_phantasm_slug: 'dwarven_axe',
    tier: 'A',
  };

  assert.equal(isCharacterTierEntry(character), true);
  assert.equal(isNoblePhantasmTierEntry(character), false);
  assert.equal(getTierEntrySlug(character), 'zeus_ssr_ex');
  assert.equal(isNoblePhantasmTierEntry(noblePhantasm), true);
  assert.equal(getTierEntrySlug(noblePhantasm), 'dwarven_axe');
});
