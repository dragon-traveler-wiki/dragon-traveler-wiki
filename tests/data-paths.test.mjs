import assert from 'node:assert/strict';
import test from 'node:test';
import { changesPath, dataPath } from '../src/utils/data-paths.ts';

test('dataPath separates localized and global datasets', () => {
  assert.equal(
    dataPath('characters.json', 'jaJP'),
    'data/jaJP/characters.json',
  );
  assert.equal(dataPath('events.json', 'jaJP'), 'data/global/events.json');
});

test('changesPath mirrors localized and global dataset layout', () => {
  assert.equal(
    changesPath('characters.json', 'koKR'),
    'data/koKR/changes/characters.json',
  );
  assert.equal(
    changesPath('codes.json', 'koKR'),
    'data/global/changes/codes.json',
  );
});
