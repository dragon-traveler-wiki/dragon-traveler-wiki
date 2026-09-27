import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEY } from '../../src/constants/ui.ts';
import {
  buildSettingsExport,
  importSettings,
} from '../../src/features/settings/settings-storage.ts';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('central storage keys include language and color scheme', () => {
  assert.equal(STORAGE_KEY.LOCALE, 'dragon-traveler-wiki:locale');
  assert.equal(STORAGE_KEY.COLOR_SCHEME, 'mantine-color-scheme-value');
});

test('settings export includes only requested values', () => {
  const storage = createStorage({
    [STORAGE_KEY.LOCALE]: 'enUS',
    [STORAGE_KEY.COLOR_SCHEME]: 'dark',
    ignored: 'value',
  });
  const json = buildSettingsExport(
    storage,
    [STORAGE_KEY.LOCALE, STORAGE_KEY.COLOR_SCHEME, 'missing'],
    new Date('2026-08-01T12:00:00.000Z'),
  );

  assert.deepEqual(JSON.parse(json), {
    version: 1,
    savedAt: '2026-08-01T12:00:00.000Z',
    data: {
      [STORAGE_KEY.LOCALE]: 'enUS',
      [STORAGE_KEY.COLOR_SCHEME]: 'dark',
    },
  });
});

test('settings import validates keys before writing', () => {
  const storage = createStorage();
  const supportedKeys = [STORAGE_KEY.LOCALE, STORAGE_KEY.COLOR_SCHEME];
  const valid = JSON.stringify({
    version: 1,
    data: {
      [STORAGE_KEY.LOCALE]: 'jaJP',
      [STORAGE_KEY.COLOR_SCHEME]: 'light',
    },
  });

  assert.equal(importSettings(valid, storage, supportedKeys), null);
  assert.equal(storage.values.get(STORAGE_KEY.LOCALE), 'jaJP');
  assert.equal(storage.values.get(STORAGE_KEY.COLOR_SCHEME), 'light');

  const invalidStorage = createStorage();
  const invalid = JSON.stringify({
    version: 1,
    data: { unsupported: 'value' },
  });
  assert.equal(
    importSettings(invalid, invalidStorage, supportedKeys),
    'Settings file contains unsupported keys or values.',
  );
  assert.equal(invalidStorage.values.size, 0);
});

test('settings import rejects malformed payloads', () => {
  const storage = createStorage();
  assert.match(importSettings('{', storage, []) ?? '', /Could not parse JSON/);
  assert.equal(
    importSettings(JSON.stringify({ version: 2, data: {} }), storage, []),
    'Invalid settings file.',
  );
});
