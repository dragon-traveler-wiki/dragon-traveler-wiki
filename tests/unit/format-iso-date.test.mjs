import assert from 'node:assert/strict';
import test from 'node:test';
import { formatIsoDate } from '../../src/utils/timestamps.ts';

test('formatIsoDate keeps the printed calendar day in every timezone', () => {
  const original = process.env.TZ;
  try {
    for (const timeZone of ['America/Los_Angeles', 'UTC', 'Asia/Tokyo']) {
      process.env.TZ = timeZone;
      assert.equal(formatIsoDate('2026-08-02'), 'Aug 2, 2026');
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('formatIsoDate returns unparseable input unchanged', () => {
  assert.equal(formatIsoDate('not a date'), 'not a date');
});
