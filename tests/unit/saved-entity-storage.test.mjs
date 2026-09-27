import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteSavedFromStorage,
  getSavedFromStorage,
  hasSavedInStorage,
  loadSavedFromStorage,
  upsertSavedInStorage,
} from '../../src/utils/saved-storage.ts';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const isSavedItem = (value) => typeof value.name === 'string';

test('saved entity loading validates, migrates, timestamps, and sorts items', () => {
  const storage = createStorage({
    saved: JSON.stringify({
      older: { name: 'Older', last_updated: 10 },
      legacy: { name: 'Legacy' },
      invalid: { title: 'Invalid' },
    }),
  });

  const items = loadSavedFromStorage(
    'saved',
    isSavedItem,
    (value) => ({ ...value, name: value.name.trim() }),
    storage,
    () => 20,
  );

  assert.deepEqual(items, [
    { name: 'Legacy', last_updated: 20 },
    { name: 'Older', last_updated: 10 },
  ]);
  assert.deepEqual(JSON.parse(storage.values.get('saved')), {
    older: { name: 'Older', last_updated: 10 },
    legacy: { name: 'Legacy', last_updated: 20 },
    invalid: { title: 'Invalid' },
  });
});

test('saved entity lookup validates and persists migrations', () => {
  const storage = createStorage({
    saved: JSON.stringify({ example: { name: ' Example ' } }),
  });

  const item = getSavedFromStorage('example', {
    storageKey: 'saved',
    isValid: isSavedItem,
    migrate: (value) => ({ ...value, name: value.name.trim() }),
    storage,
    now: () => 30,
  });

  assert.deepEqual(item, { name: 'Example', last_updated: 30 });
  assert.deepEqual(JSON.parse(storage.values.get('saved')).example, item);
});

test('saved entity upsert, existence, and delete share one record format', () => {
  const storage = createStorage({
    saved: JSON.stringify({ existing: { name: 'Existing' } }),
  });

  assert.equal(hasSavedInStorage('saved', 'existing', storage), true);
  upsertSavedInStorage('saved', 'new', { name: 'New' }, storage);
  assert.equal(hasSavedInStorage('saved', 'new', storage), true);
  deleteSavedFromStorage('saved', 'existing', storage);

  assert.deepEqual(JSON.parse(storage.values.get('saved')), {
    new: { name: 'New' },
  });
});

test('saved entity writes expose storage failures', () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  };

  assert.throws(() => upsertSavedInStorage('saved', 'new', {}, storage));
  assert.throws(() => deleteSavedFromStorage('saved', 'new', storage));
});
