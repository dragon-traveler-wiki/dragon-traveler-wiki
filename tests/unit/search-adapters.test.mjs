import assert from 'node:assert/strict';
import test from 'node:test';
import { addLinkedCharacterNames } from '../../src/features/search/noble-phantasm-search.ts';
import { rankAndLimitSearchResults } from '../../src/features/search/search-ranking.ts';

test('noble phantasm search items resolve linked character names', () => {
  const characters = new Map([
    ['athena_ssr_ex', { name: 'Athena' }],
    ['athena_legacy', { name: 'Athena' }],
  ]);
  const items = [
    { slug: 'aegis', character_slug: 'athena_ssr_ex' },
    { slug: 'legacy-aegis', character_slug: 'athena_legacy' },
    { slug: 'unlinked', character_slug: null },
  ];

  assert.deepEqual(addLinkedCharacterNames(items, characters), [
    { ...items[0], characterName: 'Athena' },
    { ...items[1], characterName: 'Athena' },
    { ...items[2], characterName: undefined },
  ]);
});

test('search results rank title matches while preserving category groups', () => {
  const results = [
    { type: 'character', title: 'Beta Knight' },
    { type: 'character', title: 'Alpha' },
    { type: 'page', title: 'The Alpha Guide' },
    { type: 'page', title: 'Alpha Database' },
    { type: 'gear', title: 'Unrelated' },
  ];

  assert.deepEqual(rankAndLimitSearchResults(results, 'alpha', 4), [
    results[1],
    results[0],
    results[3],
    results[2],
  ]);
});

test('search result ranking observes the global result limit', () => {
  const results = Array.from({ length: 5 }, (_, index) => ({
    type: `category-${index}`,
    title: `Result ${index}`,
  }));

  assert.equal(rankAndLimitSearchResults(results, 'result', 3).length, 3);
});
