import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPastedTierListPatch,
  isTierEntryLike,
  migrateStoredTierList,
  normalizeTierListFromPartial,
} from '../../src/features/tier-list/utils/tier-list-builder.ts';

const FALLBACK = {
  name: '',
  slug: '',
  entity_type: 'character',
  author: '',
  content_type: 'PvE',
  description: '',
  tiers: [{ name: 'S' }, { name: 'A' }],
  entries: [],
  last_updated: 0,
};

test('isTierEntryLike requires a tier plus one identity field, and a valid optional quality', () => {
  assert.ok(isTierEntryLike({ character_slug: 'athena', tier: 'S' }));
  assert.ok(isTierEntryLike({ character_name: 'Athena', tier: 'S' }));
  assert.ok(isTierEntryLike({ noble_phantasm_slug: 'excalibur', tier: 'S' }));
  assert.ok(!isTierEntryLike({ character_slug: 'athena' }));
  assert.ok(!isTierEntryLike({ tier: 'S' }));
  assert.ok(
    !isTierEntryLike({
      character_slug: 'athena',
      tier: 'S',
      character_quality: 'bogus',
    }),
  );
});

test('getPastedTierListPatch accepts a bare entries array', () => {
  const patch = getPastedTierListPatch([
    { character_slug: 'athena', tier: 'S' },
  ]);
  assert.deepEqual(patch, {
    entries: [{ character_slug: 'athena', tier: 'S' }],
  });
});

test('getPastedTierListPatch returns null for unusable input', () => {
  assert.equal(getPastedTierListPatch('nope'), null);
});

test('normalizeTierListFromPartial infers character entity type from legacy entries', () => {
  const list = normalizeTierListFromPartial(
    { entries: [{ character_slug: 'athena', tier: 'S' }] },
    FALLBACK,
  );
  assert.equal(list.entity_type, 'character');
  assert.equal(list.entries[0].character_slug, 'athena');
});

test('normalizeTierListFromPartial infers noble_phantasm entity type from legacy entries', () => {
  const list = normalizeTierListFromPartial(
    { entries: [{ noble_phantasm_slug: 'excalibur', tier: 'S' }] },
    FALLBACK,
  );
  assert.equal(list.entity_type, 'noble_phantasm');
  assert.equal(list.entries[0].noble_phantasm_slug, 'excalibur');
});

test('normalizeTierListFromPartial drops entries that mismatch the inferred entity type', () => {
  const list = normalizeTierListFromPartial(
    {
      entity_type: 'character',
      entries: [
        { character_slug: 'athena', tier: 'S' },
        { noble_phantasm_slug: 'excalibur', tier: 'S' },
      ],
    },
    FALLBACK,
  );
  assert.equal(list.entries.length, 1);
  assert.equal(list.entries[0].character_slug, 'athena');
});

test('normalizeTierListFromPartial deduplicates character entries by slug + quality', () => {
  const list = normalizeTierListFromPartial(
    {
      entity_type: 'character',
      entries: [
        { character_slug: 'athena', character_quality: 'SSR', tier: 'S' },
        { character_slug: 'athena', character_quality: 'SSR', tier: 'A' },
        { character_slug: 'athena', character_quality: 'UR', tier: 'S' },
      ],
    },
    FALLBACK,
  );
  assert.equal(list.entries.length, 2);
});

test('normalizeTierListFromPartial converts a legacy character_name to a slug', () => {
  const list = normalizeTierListFromPartial(
    { entries: [{ character_name: 'Vermilion Bird', tier: 'S' }] },
    FALLBACK,
  );
  assert.equal(list.entries[0].character_slug, 'vermilion_bird');
});

test('normalizeTierListFromPartial derives a slug from the name when none is given', () => {
  const list = normalizeTierListFromPartial({ name: 'My Cool List' }, FALLBACK);
  assert.equal(list.slug, 'my_cool_list');
});

test('normalizeTierListFromPartial keeps an explicit slug over a derived one', () => {
  const list = normalizeTierListFromPartial(
    { name: 'My Cool List', slug: 'custom-slug' },
    FALLBACK,
  );
  assert.equal(list.slug, 'custom-slug');
});

test('normalizeTierListFromPartial falls back to fallback tiers/entries when absent', () => {
  const list = normalizeTierListFromPartial({ name: 'Renamed' }, FALLBACK);
  assert.deepEqual(list.tiers, FALLBACK.tiers);
  assert.deepEqual(list.entries, FALLBACK.entries);
});

test('migrateStoredTierList produces a well-formed tier list from an empty patch', () => {
  const list = migrateStoredTierList({});
  assert.equal(list.name, '');
  assert.equal(list.entity_type, 'character');
  assert.deepEqual(list.entries, []);
  assert.ok(list.tiers.length > 0);
});
