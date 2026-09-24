import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseObjectArray,
  parseObjectRecord,
} from '../../src/utils/data-validation.ts';

test('parseObjectArray accepts object arrays', () => {
  const value = [{ slug: 'test' }];
  assert.equal(parseObjectArray(value), value);
});

test('parseObjectArray rejects invalid payloads', () => {
  assert.throws(() => parseObjectArray({}), /array of objects/);
  assert.throws(() => parseObjectArray([null]), /array of objects/);
});

test('parseObjectRecord accepts object maps and rejects scalar values', () => {
  const value = { test: { added: 1 } };
  assert.equal(parseObjectRecord(value), value);
  assert.throws(() => parseObjectRecord({ test: 1 }), /object values/);
});
