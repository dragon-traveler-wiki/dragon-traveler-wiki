import assert from 'node:assert/strict';
import test from 'node:test';
import { getNewestActiveCharacterKeys } from '../../src/features/characters/utils/new-character-keys.ts';

test('removed latest additions do not hide the newest active re-added batch', () => {
  const result = getNewestActiveCharacterKeys(
    {
      removed_zeus: {
        added: 500,
        changes: [{ timestamp: 600, type: 'removed' }],
      },
      gudong: {
        added: 100,
        changes: [
          { timestamp: 200, type: 'removed' },
          { timestamp: 450, type: 'readded' },
        ],
      },
      perseus: {
        added: 150,
        changes: [{ timestamp: 450, type: 'readded' }],
      },
      older_active: { added: 400, changes: [] },
    },
    ['gudong', 'perseus', 'older_active'],
  );

  assert.deepEqual([...result].sort(), ['gudong', 'perseus']);
});

test('ordinary latest additions remain new', () => {
  const result = getNewestActiveCharacterKeys(
    {
      older: { added: 100 },
      newest_one: { added: 200 },
      newest_two: { added: 200 },
    },
    ['older', 'newest_one', 'newest_two'],
  );

  assert.deepEqual([...result].sort(), ['newest_one', 'newest_two']);
});

test('history entries absent from the active roster are ignored', () => {
  const result = getNewestActiveCharacterKeys(
    {
      stale: { added: 300 },
      current: { added: 200 },
    },
    ['current'],
  );

  assert.deepEqual([...result], ['current']);
});
