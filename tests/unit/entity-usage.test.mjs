import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEntityUsage,
  compareEntityUsage,
  filterUsageCharacters,
} from '../../src/features/wiki/usage/entity-usage.ts';

const characters = [
  { name: 'Alpha', quality: 'UR', references: ['legacy-a', 'legacy-a'] },
  { name: 'Beta', quality: 'SSR+', references: ['b', ' a '] },
  { name: 'Gamma', quality: 'SSR', references: ['a'] },
  { name: 'Delta', quality: 'SR', references: ['b'] },
];

test('usage quality filters share the canonical quality thresholds', () => {
  const charactersWithUnknown = [
    ...characters,
    { name: 'Unknown', quality: '???', references: [] },
  ];
  assert.deepEqual(
    filterUsageCharacters(characters, 'ssr-plus').map(({ name }) => name),
    ['Alpha', 'Beta'],
  );
  assert.deepEqual(
    filterUsageCharacters(characters, 'ssr').map(({ name }) => name),
    ['Alpha', 'Beta', 'Gamma'],
  );
  assert.equal(filterUsageCharacters(charactersWithUnknown, 'ssr').length, 3);
  assert.equal(filterUsageCharacters(charactersWithUnknown, 'all').length, 5);
});

test('usage aggregation resolves aliases, trims references, and deduplicates', () => {
  const usage = buildEntityUsage({
    items: [
      { slug: 'a', name: 'A', aliases: ['a', 'legacy-a'] },
      { slug: 'b', name: 'B', aliases: ['b'] },
      { slug: 'unused', name: 'Unused', aliases: ['unused'] },
    ],
    characters: characters.slice(0, 3),
    getCharacterReferences: (character) => character.references,
    getItemReferences: (item) => item.aliases,
  });

  assert.deepEqual(
    usage.map(({ item, characters: users, count, percentage }) => ({
      slug: item.slug,
      users: users.map(({ name }) => name),
      count,
      percentage,
    })),
    [
      {
        slug: 'a',
        users: ['Alpha', 'Beta', 'Gamma'],
        count: 3,
        percentage: 100,
      },
      { slug: 'b', users: ['Beta'], count: 1, percentage: 33 },
      { slug: 'unused', users: [], count: 0, percentage: 0 },
    ],
  );
});

test('usage aggregation can preserve grouped character recommendation behavior', () => {
  const groupedCharacters = [
    { name: 'Variant', quality: 'UR', references: ['a'] },
    { name: 'Variant', quality: 'SSR+', references: [] },
  ];
  const [usage] = buildEntityUsage({
    items: [{ slug: 'a', name: 'A' }],
    characters: groupedCharacters,
    getCharacterReferences: (character) => character.references,
    getCharacterGroupKey: (character) => character.name,
  });

  assert.equal(usage.count, 2);
});

test('usage comparison centralizes name, count, direction, and custom columns', () => {
  const alpha = {
    item: { slug: 'a', name: 'Alpha', rank: 2 },
    characters: [],
    count: 1,
    percentage: 10,
  };
  const beta = {
    item: { slug: 'b', name: 'Beta', rank: 1 },
    characters: [],
    count: 3,
    percentage: 30,
  };
  const custom = (left, right, column) =>
    column === 'rank' ? left.item.rank - right.item.rank : null;

  assert.ok(compareEntityUsage(alpha, beta, 'name', 'asc', custom) < 0);
  assert.ok(compareEntityUsage(alpha, beta, 'count', 'desc', custom) > 0);
  assert.ok(compareEntityUsage(alpha, beta, 'rank', 'asc', custom) > 0);
  assert.equal(compareEntityUsage(alpha, beta, 'unknown', 'asc', custom), 0);
});
