import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateLegacySlugsInValue } from '../../src/utils/legacy-slug-migration.ts';

test('legacy character slugs migrate through saved structures and asset keys', () => {
  const aliases = new Map([['expected_zeus', 'official_zeus']]);
  const migrated = migrateLegacySlugsInValue(
    {
      expected_zeus: 'five-star',
      members: [{ character_slug: 'expected_zeus' }],
      favorites: ['expected_zeus::0'],
      banner: '/character/expected_zeus/skins/default/portrait.png',
      route: '/noble-phantasms/expected_zeus',
    },
    aliases,
  );

  assert.deepEqual(migrated, {
    official_zeus: 'five-star',
    members: [{ character_slug: 'official_zeus' }],
    favorites: ['official_zeus::0'],
    banner: '/character/official_zeus/skins/default/portrait.png',
    route: '/noble-phantasms/official_zeus',
  });
});
