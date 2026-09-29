import assert from 'node:assert/strict';
import test from 'node:test';
import { compareGuessToAnswer } from '../../src/features/dtdle/utils/compare-guess.ts';

function makeCharacter(overrides = {}) {
  return {
    slug: 'guess',
    name: 'Guess',
    quality: 'SSR',
    character_class: 'mage',
    factions: [],
    is_global: true,
    subclasses: [],
    skills: [],
    recommended_noble_phantasm: [],
    skins: [],
    last_updated: 0,
    ...overrides,
  };
}

test('classStatus and originStatus are exact-or-none', () => {
  const answer = makeCharacter({
    character_class: 'warrior',
    origin: 'Solaris',
  });
  const sameClassSameOrigin = compareGuessToAnswer(
    makeCharacter({ character_class: 'warrior', origin: 'Solaris' }),
    answer,
  );
  assert.equal(sameClassSameOrigin.classStatus, 'exact');
  assert.equal(sameClassSameOrigin.originStatus, 'exact');

  const differentClassAndOrigin = compareGuessToAnswer(
    makeCharacter({ character_class: 'mage', origin: 'Umbros' }),
    answer,
  );
  assert.equal(differentClassAndOrigin.classStatus, 'none');
  assert.equal(differentClassAndOrigin.originStatus, 'none');
});

test('qualityStatus reports higher when the answer is rarer than the guess', () => {
  const answer = makeCharacter({ quality: 'UR' });
  const guess = makeCharacter({ quality: 'SR' });
  assert.equal(compareGuessToAnswer(guess, answer).qualityStatus, 'higher');
  assert.equal(compareGuessToAnswer(answer, guess).qualityStatus, 'lower');
  assert.equal(compareGuessToAnswer(guess, guess).qualityStatus, 'exact');
});

test('factionStatus is exact for an identical set regardless of order', () => {
  const answer = makeCharacter({ factions: ['solar', 'lunar'] });
  const guess = makeCharacter({ factions: ['lunar', 'solar'] });
  assert.equal(compareGuessToAnswer(guess, answer).factionStatus, 'exact');
});

test('factionStatus is partial for an overlapping-but-different set', () => {
  const answer = makeCharacter({ factions: ['solar', 'lunar'] });
  const guess = makeCharacter({ factions: ['solar', 'arcane'] });
  assert.equal(compareGuessToAnswer(guess, answer).factionStatus, 'partial');
});

test('factionStatus is none when the sets share nothing', () => {
  const answer = makeCharacter({ factions: ['solar'] });
  const guess = makeCharacter({ factions: ['arcane'] });
  assert.equal(compareGuessToAnswer(guess, answer).factionStatus, 'none');
});

test('heightStatus/weightStatus parse numeric strings and ignore units/commas', () => {
  const answer = makeCharacter({ height: '1,800 cm', weight: '90 kg' });
  const shorter = makeCharacter({ height: '170 cm', weight: '90 kg' });
  const comparison = compareGuessToAnswer(shorter, answer);
  assert.equal(comparison.heightStatus, 'higher');
  assert.equal(comparison.weightStatus, 'exact');
});

test('heightStatus/weightStatus are unknown when either value is unparseable', () => {
  const answer = makeCharacter({ height: undefined });
  const guess = makeCharacter({ height: '170 cm' });
  assert.equal(compareGuessToAnswer(guess, answer).heightStatus, 'unknown');
  assert.equal(compareGuessToAnswer(answer, guess).heightStatus, 'unknown');
});
