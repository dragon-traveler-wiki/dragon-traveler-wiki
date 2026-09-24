import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readStoredJson,
  writeStoredJson,
} from '../../src/utils/saved-storage.ts';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('stored JSON falls back for corrupted and invalid values', () => {
  const localStorage = createStorage({ broken: '{', invalid: '42' });
  globalThis.window = { localStorage };
  const isStringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  assert.deepEqual(readStoredJson('broken', [], isStringArray), []);
  assert.deepEqual(readStoredJson('invalid', [], isStringArray), []);
});

test('stored JSON round-trips validated values', () => {
  const localStorage = createStorage();
  globalThis.window = { localStorage };
  const isStringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  assert.equal(writeStoredJson('items', ['one']), true);
  assert.deepEqual(readStoredJson('items', [], isStringArray), ['one']);
});
