import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultRows,
  dateToInputValue,
  dayDiffFromToday,
  isValidIsoDateString,
  normalizeIsoDate,
  sanitizeSourceRow,
  sanitizeSourceRows,
  sortSourcesByCadenceThenLabel,
  sumSourcesPerDay,
} from '../../src/features/calculators/diamond/diamond-model.ts';

test('buildDefaultRows maps base sources into enabled, non-custom rows', () => {
  const rows = buildDefaultRows([
    { id: 'a', label: 'A', defaultAmount: 10, defaultCadenceDays: 2 },
  ]);
  assert.deepEqual(rows, [
    {
      id: 'a',
      label: 'A',
      amount: 10,
      cadenceDays: 2,
      isCustom: false,
      enabled: true,
    },
  ]);
});

test('sumSourcesPerDay skips disabled rows and non-positive amount/cadence', () => {
  const total = sumSourcesPerDay([
    {
      id: '1',
      label: 'a',
      amount: 100,
      cadenceDays: 10,
      isCustom: false,
      enabled: true,
    },
    {
      id: '2',
      label: 'b',
      amount: 100,
      cadenceDays: 10,
      isCustom: false,
      enabled: false,
    },
    {
      id: '3',
      label: 'c',
      amount: 0,
      cadenceDays: 1,
      isCustom: false,
      enabled: true,
    },
    {
      id: '4',
      label: 'd',
      amount: 50,
      cadenceDays: 0,
      isCustom: false,
      enabled: true,
    },
    {
      id: '5',
      label: 'e',
      amount: null,
      cadenceDays: 7,
      isCustom: false,
      enabled: true,
    },
  ]);
  assert.equal(total, 10);
});

test('isValidIsoDateString rejects malformed and out-of-range dates', () => {
  assert.ok(isValidIsoDateString('2026-01-15'));
  assert.ok(!isValidIsoDateString('2026-13-01'));
  assert.ok(!isValidIsoDateString('2026-02-30'));
  assert.ok(!isValidIsoDateString('not-a-date'));
});

test('normalizeIsoDate falls back for invalid input', () => {
  assert.equal(normalizeIsoDate('2026-01-15', '2026-01-01'), '2026-01-15');
  assert.equal(normalizeIsoDate('bogus', '2026-01-01'), '2026-01-01');
});

test('dateToInputValue pads month and day', () => {
  assert.equal(dateToInputValue(new Date(2026, 0, 5)), '2026-01-05');
});

test('dayDiffFromToday counts whole days relative to local midnight', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + 10);
  assert.equal(dayDiffFromToday(dateToInputValue(future)), 10);
  assert.equal(dayDiffFromToday(dateToInputValue(today)), 0);
});

test('sanitizeSourceRow rejects malformed input and coerces bad numbers to null', () => {
  assert.equal(sanitizeSourceRow(null), null);
  assert.equal(sanitizeSourceRow({ id: 1, label: 'x' }), null);
  assert.deepEqual(
    sanitizeSourceRow({
      id: 'a',
      label: 'A',
      amount: Number.NaN,
      cadenceDays: '7',
      isCustom: 'yes',
      enabled: false,
    }),
    {
      id: 'a',
      label: 'A',
      amount: null,
      cadenceDays: null,
      isCustom: true,
      enabled: false,
    },
  );
});

test('sanitizeSourceRows falls back when stored value is not an array, keeps an intentionally-emptied list', () => {
  const fallback = buildDefaultRows([
    { id: 'a', label: 'A', defaultAmount: 1, defaultCadenceDays: 1 },
  ]);
  assert.deepEqual(sanitizeSourceRows(undefined, fallback), fallback);
  assert.deepEqual(sanitizeSourceRows([], fallback), []);
  assert.deepEqual(sanitizeSourceRows(['not-a-row'], fallback), fallback);
});

test('sortSourcesByCadenceThenLabel sorts by cadence then label, nulls last', () => {
  const sorted = sortSourcesByCadenceThenLabel([
    {
      id: '1',
      label: 'Zeta',
      amount: 1,
      cadenceDays: null,
      isCustom: false,
      enabled: true,
    },
    {
      id: '2',
      label: 'Beta',
      amount: 1,
      cadenceDays: 7,
      isCustom: false,
      enabled: true,
    },
    {
      id: '3',
      label: 'Alpha',
      amount: 1,
      cadenceDays: 7,
      isCustom: false,
      enabled: true,
    },
  ]);
  assert.deepEqual(
    sorted.map((s) => s.label),
    ['Alpha', 'Beta', 'Zeta'],
  );
});
