import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_TIER_LIST_VIEW_FILTERS,
  matchesTierListFilters,
} from '../../src/features/tier-list/filters.ts';

function makeTierList(overrides = {}) {
  return {
    name: 'Best DPS Tier List',
    slug: 'best-dps-tier-list',
    content_type: 'PvE',
    entries: [],
    last_updated: 0,
    ...overrides,
  };
}

test('matchesTierListFilters with no search/filters matches everything', () => {
  assert.ok(
    matchesTierListFilters(makeTierList(), '', EMPTY_TIER_LIST_VIEW_FILTERS),
  );
});

test('matchesTierListFilters searches name, author, and description', () => {
  const tierList = makeTierList({
    description: 'Ranks every SSR for arena',
    author: 'Nova',
  });
  assert.ok(
    matchesTierListFilters(tierList, 'best dps', EMPTY_TIER_LIST_VIEW_FILTERS),
  );
  assert.ok(
    matchesTierListFilters(tierList, 'arena', EMPTY_TIER_LIST_VIEW_FILTERS),
  );
  assert.ok(
    matchesTierListFilters(tierList, 'nova', EMPTY_TIER_LIST_VIEW_FILTERS),
  );
  assert.ok(
    !matchesTierListFilters(
      tierList,
      'nonexistent',
      EMPTY_TIER_LIST_VIEW_FILTERS,
    ),
  );
});

test('matchesTierListFilters defaults entity_type to character when absent', () => {
  const tierList = makeTierList();
  assert.ok(
    matchesTierListFilters(tierList, '', {
      ...EMPTY_TIER_LIST_VIEW_FILTERS,
      entityTypes: ['character'],
    }),
  );
  assert.ok(
    !matchesTierListFilters(tierList, '', {
      ...EMPTY_TIER_LIST_VIEW_FILTERS,
      entityTypes: ['noble_phantasm'],
    }),
  );
});

test('matchesTierListFilters filters by entity type and content type', () => {
  const npList = makeTierList({
    entity_type: 'noble_phantasm',
    content_type: 'PvP',
  });
  assert.ok(
    matchesTierListFilters(npList, '', {
      ...EMPTY_TIER_LIST_VIEW_FILTERS,
      entityTypes: ['noble_phantasm'],
      contentTypes: ['PvP'],
    }),
  );
  assert.ok(
    !matchesTierListFilters(npList, '', {
      ...EMPTY_TIER_LIST_VIEW_FILTERS,
      entityTypes: ['noble_phantasm'],
      contentTypes: ['Boss'],
    }),
  );
});
