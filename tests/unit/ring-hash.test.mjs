import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRing,
  fnv1aHash32,
  pickFromRing,
} from '../../src/features/dtdle/utils/ring-hash.ts';

test('fnv1aHash32 is deterministic and stays within an unsigned 32-bit range', () => {
  const first = fnv1aHash32('athena_ssr');
  const second = fnv1aHash32('athena_ssr');
  assert.equal(first, second);
  assert.ok(first >= 0 && first <= 0xffffffff);
});

test('fnv1aHash32 is sensitive to the whole input, not just its length', () => {
  assert.notEqual(fnv1aHash32('abc'), fnv1aHash32('acb'));
});

test('buildRing sorts entries by hash ascending', () => {
  const ring = buildRing(['zeus', 'athena', 'hades']);
  for (let i = 1; i < ring.length; i++) {
    assert.ok(ring[i].hash >= ring[i - 1].hash);
  }
  assert.deepEqual(ring.map((e) => e.slug).sort(), ['athena', 'hades', 'zeus']);
});

test('pickFromRing picks the nearest entry clockwise from the hash', () => {
  const ring = [
    { slug: 'a', hash: 10 },
    { slug: 'b', hash: 20 },
    { slug: 'c', hash: 30 },
  ];
  assert.equal(pickFromRing(ring, 15, new Set()), 'b');
  assert.equal(pickFromRing(ring, 10, new Set()), 'a');
});

test('pickFromRing wraps around to the start when the hash is past the last entry', () => {
  const ring = [
    { slug: 'a', hash: 10 },
    { slug: 'b', hash: 20 },
  ];
  assert.equal(pickFromRing(ring, 999, new Set()), 'a');
});

test('pickFromRing skips excluded slugs, wrapping if needed', () => {
  const ring = [
    { slug: 'a', hash: 10 },
    { slug: 'b', hash: 20 },
    { slug: 'c', hash: 30 },
  ];
  assert.equal(pickFromRing(ring, 15, new Set(['b'])), 'c');
  // Everything after the start is excluded, so it wraps back to 'a'.
  assert.equal(pickFromRing(ring, 15, new Set(['b', 'c'])), 'a');
});

test('pickFromRing falls back to the start entry when every slug is excluded', () => {
  const ring = [
    { slug: 'a', hash: 10 },
    { slug: 'b', hash: 20 },
  ];
  assert.equal(pickFromRing(ring, 15, new Set(['a', 'b'])), 'b');
});
