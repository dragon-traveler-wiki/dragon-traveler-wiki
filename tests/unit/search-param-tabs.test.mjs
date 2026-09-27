import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveEntityTabName,
  resolveTabParam,
  setDefaultOmittingSearchParam,
  setEntitySearchParam,
} from '../../src/utils/search-param-tabs.ts';

test('route-backed tabs reject invalid values and omit their default', () => {
  assert.equal(
    resolveTabParam('usage', 'catalog', ['catalog', 'usage']),
    'usage',
  );
  assert.equal(
    resolveTabParam('unknown', 'catalog', ['catalog', 'usage']),
    'catalog',
  );
  assert.equal(
    resolveTabParam(null, 'catalog', ['catalog', 'usage']),
    'catalog',
  );

  const current = new URLSearchParams('tab=usage&class=mage');
  assert.equal(
    setDefaultOmittingSearchParam(
      current,
      'tab',
      'catalog',
      'catalog',
    ).toString(),
    'class=mage',
  );
  assert.equal(current.toString(), 'tab=usage&class=mage');
});

test('entity tabs resolve slugs and preserve unrelated search parameters', () => {
  const items = [{ name: 'Oracle Scroll' }, { name: "Dragon's Call" }];
  assert.equal(resolveEntityTabName('dragons_call', items), "Dragon's Call");
  assert.equal(resolveEntityTabName('missing', items), 'Oracle Scroll');
  assert.equal(resolveEntityTabName(null, []), undefined);

  const current = new URLSearchParams('view=grid');
  assert.equal(
    setEntitySearchParam(current, 'list', "Dragon's Call").toString(),
    'view=grid&list=dragons_call',
  );
  assert.equal(
    setEntitySearchParam(
      new URLSearchParams('list=old&view=grid'),
      'list',
      null,
    ).toString(),
    'view=grid',
  );
});
