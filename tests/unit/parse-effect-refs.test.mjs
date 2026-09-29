import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseEffectRefs,
  splitEffectRefs,
} from '../../src/utils/parse-effect-refs.ts';

test('parseEffectRefs extracts unique {status ref} names', () => {
  assert.deepEqual(
    parseEffectRefs('Deals damage and applies {Burn} and {Burn} and {Stun}.'),
    ['Burn', 'Stun'],
  );
  assert.deepEqual(parseEffectRefs('No refs here.'), []);
});

test('parseEffectRefs is safe to call repeatedly (no leaked regex lastIndex state)', () => {
  // STATUS_REF_RE is a module-level `g` regex; a stateful bug would show up
  // as a second call missing matches it should find.
  assert.deepEqual(parseEffectRefs('{A}'), ['A']);
  assert.deepEqual(parseEffectRefs('{B}'), ['B']);
  assert.deepEqual(parseEffectRefs('{C} and {D}'), ['C', 'D']);
});

test('splitEffectRefs segments status refs, skill refs, italics, and numbers in order', () => {
  const segments = splitEffectRefs('Deal 50% damage, apply {Burn} for 3-5s.');
  assert.deepEqual(segments, [
    { type: 'text', content: 'Deal ' },
    { type: 'percent', content: '50%' },
    { type: 'text', content: ' damage, apply ' },
    { type: 'statusRef', name: 'Burn' },
    { type: 'text', content: ' for ' },
    { type: 'percentRange', content: '3-5' },
    { type: 'text', content: 's.' },
  ]);
});

test('splitEffectRefs handles skill references and italics', () => {
  const segments = splitEffectRefs('Triggers [Fireball] and *emphasis* text.');
  assert.deepEqual(segments, [
    { type: 'text', content: 'Triggers ' },
    { type: 'effectRef', name: 'Fireball' },
    { type: 'text', content: ' and ' },
    { type: 'italic', content: 'emphasis' },
    { type: 'text', content: ' text.' },
  ]);
});

test('splitEffectRefs returns a single text segment for plain text', () => {
  assert.deepEqual(splitEffectRefs('plain text'), [
    { type: 'text', content: 'plain text' },
  ]);
});
