import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_CHARACTER_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
  sortCharactersByQuality,
} from '../../src/features/characters/filters.ts';

function makeCharacter(overrides = {}) {
  return {
    slug: overrides.slug ?? 'athena_ssr',
    name: 'Athena',
    quality: 'SSR',
    character_class: 'mage',
    factions: [],
    is_global: true,
    subclasses: [],
    skills: [],
    recommended_noble_phantasm: [],
    skins: [],
    last_updated: 0,
    ...overrides,
  };
}

test('filterCharacters with empty filters returns everything', () => {
  const characters = [makeCharacter(), makeCharacter({ slug: 'b', name: 'B' })];
  assert.equal(filterCharacters(characters, EMPTY_CHARACTER_FILTERS).length, 2);
});

test('filterCharacters matches search case-insensitively against name', () => {
  const characters = [makeCharacter({ name: 'Athena' })];
  const found = filterCharacters(characters, {
    ...EMPTY_CHARACTER_FILTERS,
    search: 'ATH',
  });
  assert.equal(found.length, 1);

  const missing = filterCharacters(characters, {
    ...EMPTY_CHARACTER_FILTERS,
    search: 'zzz',
  });
  assert.equal(missing.length, 0);
});

test('filterCharacters filters by quality, class, and faction', () => {
  const a = makeCharacter({
    slug: 'a',
    quality: 'SSR',
    character_class: 'mage',
    factions: ['solar'],
  });
  const b = makeCharacter({
    slug: 'b',
    quality: 'SR',
    character_class: 'warrior',
    factions: ['lunar'],
  });
  const characters = [a, b];

  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      qualities: ['SSR'],
    }),
    [a],
  );
  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      classes: ['warrior'],
    }),
    [b],
  );
  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      factions: ['solar'],
    }),
    [a],
  );
});

test('filterCharacters requires attack range/type when that filter is active', () => {
  const withRange = makeCharacter({ slug: 'a', attack_range: 'melee' });
  const withoutRange = makeCharacter({ slug: 'b', attack_range: null });
  const characters = [withRange, withoutRange];

  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      attackRanges: ['melee'],
    }),
    [withRange],
  );
});

test('filterCharacters honors globalOnly tri-state (null = no filter)', () => {
  const global = makeCharacter({ slug: 'a', is_global: true });
  const upcoming = makeCharacter({ slug: 'b', is_global: false });
  const characters = [global, upcoming];

  assert.equal(filterCharacters(characters, EMPTY_CHARACTER_FILTERS).length, 2);
  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      globalOnly: false,
    }),
    [upcoming],
  );
});

test('filterCharacters upcomingOnly keeps characters with a future release date', () => {
  const future = makeCharacter({ slug: 'a', release_date: '2099-01-01' });
  const past = makeCharacter({ slug: 'b', release_date: '2000-01-01' });
  const none = makeCharacter({ slug: 'c' });
  const characters = [future, past, none];

  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      upcomingOnly: true,
    }),
    [future],
  );
});

test('filterCharacters tier filter falls back to "N/A" when a character is unranked', () => {
  const ranked = makeCharacter({ slug: 'a' });
  const unranked = makeCharacter({ slug: 'b' });
  const tierLookup = new Map([['a', 'S']]);
  const characters = [ranked, unranked];

  assert.deepEqual(
    filterCharacters(
      characters,
      { ...EMPTY_CHARACTER_FILTERS, tiers: ['S'] },
      tierLookup,
    ),
    [ranked],
  );
  assert.deepEqual(
    filterCharacters(
      characters,
      { ...EMPTY_CHARACTER_FILTERS, tiers: ['N/A'] },
      tierLookup,
    ),
    [unranked],
  );
});

test('filterCharacters statusEffects filter matches parsed {effect} refs in skill descriptions', () => {
  const withBurn = makeCharacter({
    slug: 'a',
    skills: [{ name: 'Fire', description: 'Applies {Burn}.', cooldown: 1 }],
  });
  const withoutBurn = makeCharacter({
    slug: 'b',
    skills: [{ name: 'Ice', description: 'Applies {Freeze}.', cooldown: 1 }],
  });
  const characters = [withBurn, withoutBurn];

  assert.deepEqual(
    filterCharacters(characters, {
      ...EMPTY_CHARACTER_FILTERS,
      statusEffects: ['Burn'],
    }),
    [withBurn],
  );
});

test('filterCharacters ownedOnly and star-level range require ownership data', () => {
  const owned = makeCharacter({ slug: 'a' });
  const unowned = makeCharacter({ slug: 'b' });
  const characters = [owned, unowned];
  const ownedCharacters = { a: '3-star' };
  const starLevelOrder = ['1-star', '2-star', '3-star', '4-star', '5-star'];

  assert.deepEqual(
    filterCharacters(
      characters,
      { ...EMPTY_CHARACTER_FILTERS, ownedOnly: true },
      undefined,
      ownedCharacters,
    ),
    [owned],
  );

  assert.deepEqual(
    filterCharacters(
      characters,
      {
        ...EMPTY_CHARACTER_FILTERS,
        minStarLevel: '4-star',
      },
      undefined,
      ownedCharacters,
      starLevelOrder,
    ),
    [],
  );

  assert.deepEqual(
    filterCharacters(
      characters,
      {
        ...EMPTY_CHARACTER_FILTERS,
        minStarLevel: '2-star',
        maxStarLevel: '4-star',
      },
      undefined,
      ownedCharacters,
      starLevelOrder,
    ),
    [owned],
  );
});

test('extractAllEffectRefs collects unique, sorted effect names across all characters', () => {
  const characters = [
    makeCharacter({
      slug: 'a',
      skills: [
        { name: 'Fire', description: '{Burn} then {Stun}', cooldown: 1 },
      ],
    }),
    makeCharacter({
      slug: 'b',
      skills: [{ name: 'Ice', description: '{Burn}', cooldown: 1 }],
    }),
  ];
  assert.deepEqual(extractAllEffectRefs(characters), ['Burn', 'Stun']);
});

test('sortCharactersByQuality sorts rarest-first, then alphabetically', () => {
  const sr = makeCharacter({ slug: 'a', name: 'Zeta', quality: 'SR' });
  const ssr = makeCharacter({ slug: 'b', name: 'Alpha', quality: 'SSR' });
  const sorted = sortCharactersByQuality([sr, ssr]);
  assert.deepEqual(
    sorted.map((c) => c.name),
    ['Alpha', 'Zeta'],
  );
});
