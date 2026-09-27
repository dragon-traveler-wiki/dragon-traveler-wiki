import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSavedBuilderItemKey,
  withSavedTimestamp,
} from '../../src/features/builders/saved-builder-item.ts';

test('saved builder items share key and timestamp normalization', () => {
  assert.equal(
    getSavedBuilderItemKey('  My Example Build  '),
    'my_example_build',
  );
  assert.equal(getSavedBuilderItemKey('   '), 'untitled');

  const item = { name: 'Example', last_updated: 10, entries: ['one'] };
  assert.deepEqual(withSavedTimestamp(item, 42), {
    name: 'Example',
    last_updated: 42,
    entries: ['one'],
  });
  assert.equal(item.last_updated, 10);
});
