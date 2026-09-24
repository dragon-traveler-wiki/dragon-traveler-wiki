import assert from 'node:assert/strict';
import test from 'node:test';
import { getCommunityPaginationTotal } from '../../src/features/community/pagination.ts';

test('pagination spans the server total while more pages remain', () => {
  assert.equal(
    getCommunityPaginationTotal({
      visibleCount: 24,
      loadedCount: 24,
      total: 55,
      hasMore: true,
    }),
    55,
  );
});

test('pagination falls back to loaded items once fully loaded', () => {
  assert.equal(
    getCommunityPaginationTotal({
      visibleCount: 55,
      loadedCount: 55,
      total: 55,
      hasMore: false,
    }),
    55,
  );
});

test('client-side filters narrow pagination below the server total', () => {
  assert.equal(
    getCommunityPaginationTotal({
      visibleCount: 9,
      loadedCount: 24,
      total: 55,
      hasMore: true,
    }),
    9,
  );
});

test('an unknown server total uses the loaded count', () => {
  assert.equal(
    getCommunityPaginationTotal({
      visibleCount: 24,
      loadedCount: 24,
      total: null,
      hasMore: true,
    }),
    24,
  );
});
