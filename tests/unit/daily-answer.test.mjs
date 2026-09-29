import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDaysIso,
  getEligibleCharacters,
  getTodayAnswerSlug,
  getTodayIsoDate,
} from '../../src/features/dtdle/utils/daily-answer.ts';

test('getEligibleCharacters excludes N and C quality characters', () => {
  const characters = [
    { slug: 'a', quality: 'SSR' },
    { slug: 'b', quality: 'N' },
    { slug: 'c', quality: 'C' },
    { slug: 'd', quality: 'R' },
  ];
  assert.deepEqual(
    getEligibleCharacters(characters).map((c) => c.slug),
    ['a', 'd'],
  );
});

test('addDaysIso adds and subtracts across month/year boundaries in UTC', () => {
  assert.equal(addDaysIso('2026-01-31', 1), '2026-02-01');
  assert.equal(addDaysIso('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysIso('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysIso('2026-06-15', 0), '2026-06-15');
});

test('getTodayIsoDate returns a YYYY-MM-DD string', () => {
  assert.match(getTodayIsoDate(), /^\d{4}-\d{2}-\d{2}$/);
});

test('getTodayAnswerSlug is deterministic for the same date and roster', () => {
  const slugs = ['a', 'b', 'c', 'd', 'e'].sort();
  const first = getTodayAnswerSlug('2026-08-01', slugs);
  const second = getTodayAnswerSlug('2026-08-01', slugs);
  assert.equal(first, second);
  assert.ok(slugs.includes(first));
});

test('getTodayAnswerSlug avoids repeating an answer from the last 14 days when the roster is large enough', () => {
  // The lookback window is 14 days, so a pool bigger than that must be able
  // to go 14 days without repeating an answer.
  const slugs = Array.from({ length: 20 }, (_, i) => `char-${i}`).sort();
  const answers = [];
  let day = '2026-07-05';
  for (let i = 0; i < 30; i++) {
    answers.push(getTodayAnswerSlug(day, slugs));
    day = addDaysIso(day, 1);
  }
  for (let i = 14; i < answers.length; i++) {
    const lookback = answers.slice(i - 14, i);
    assert.ok(
      !lookback.includes(answers[i]),
      `day ${i} repeated an answer from within the last 14 days`,
    );
  }
});

test('getTodayAnswerSlug accepts a modeSalt and still returns a valid pool member', () => {
  const slugs = ['a', 'b', 'c', 'd', 'e'].sort();
  const ability = getTodayAnswerSlug('2026-08-01', slugs, 'ability');
  assert.ok(slugs.includes(ability));
});

test('getTodayAnswerSlug gives at least one mode salt a different answer than classic across several days', () => {
  // A single day's answer can coincidentally match across salts; checking a
  // run of days confirms the salt is actually namespacing the hash rather
  // than being ignored. Slugs vary in length/content (not just a trailing
  // digit) so their FNV hashes spread out instead of clustering.
  const slugs = [
    'athena_ssr',
    'zeus_ur',
    'hades_ssr_ex',
    'poseidon_sr',
    'hera_ssr_plus',
    'apollo_r',
    'artemis_ur_plus',
    'ares_ssr',
    'demeter_sr',
    'hermes_ssr',
  ].sort();
  let day = '2026-08-01';
  let sawDifference = false;
  for (let i = 0; i < 20; i++) {
    const classic = getTodayAnswerSlug(day, slugs);
    const ability = getTodayAnswerSlug(day, slugs, 'ability');
    if (classic !== ability) sawDifference = true;
    day = addDaysIso(day, 1);
  }
  assert.ok(sawDifference);
});
