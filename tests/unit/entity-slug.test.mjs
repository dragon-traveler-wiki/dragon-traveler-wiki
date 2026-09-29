import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findEntityByParam,
  safeDecodeURIComponent,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '../../src/utils/entity-slug.ts';

test('toEntitySlug lowercases, strips accents, and joins on underscores', () => {
  assert.equal(toEntitySlug('Vermilion Bird'), 'vermilion_bird');
  assert.equal(toEntitySlug('  Extra   Spaces  '), 'extra_spaces');
  assert.equal(toEntitySlug('Café-Résumé'), 'cafe_resume');
});

test('toEntitySlug drops disallowed characters by default', () => {
  assert.equal(toEntitySlug('SSR+'), 'ssr');
  assert.equal(toEntitySlug("O'Brien!"), 'obrien');
});

test('toEntitySlug preserves + when allowPlus is set', () => {
  assert.equal(toEntitySlug('SSR+', { allowPlus: true }), 'ssr+');
});

test('safeDecodeURIComponent falls back to the raw value on malformed input', () => {
  assert.equal(safeDecodeURIComponent('vermilion_bird'), 'vermilion_bird');
  assert.equal(safeDecodeURIComponent('%'), '%');
});

test('findEntityByParam matches by name or alias slug', () => {
  const items = [{ name: 'Vermilion Bird', alias: 'Red Phoenix' }];
  assert.equal(
    findEntityByParam(
      items,
      'vermilion_bird',
      (i) => i.name,
      (i) => [i.alias],
    ),
    items[0],
  );
  assert.equal(
    findEntityByParam(
      items,
      'red_phoenix',
      (i) => i.name,
      (i) => [i.alias],
    ),
    items[0],
  );
  assert.equal(
    findEntityByParam(items, 'nonexistent', (i) => i.name),
    null,
  );
  assert.equal(
    findEntityByParam(items, undefined, (i) => i.name),
    null,
  );
});

test('shouldRedirectToEntitySlug flags non-canonical params', () => {
  assert.ok(shouldRedirectToEntitySlug('Vermilion Bird', 'Vermilion Bird'));
  assert.ok(!shouldRedirectToEntitySlug('vermilion_bird', 'Vermilion Bird'));
  assert.ok(!shouldRedirectToEntitySlug(undefined, 'Vermilion Bird'));
  assert.ok(!shouldRedirectToEntitySlug('vermilion_bird', undefined));
});
