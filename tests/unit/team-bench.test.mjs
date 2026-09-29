import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
  isTeamBenchMember,
  normalizeTeamBenchEntry,
} from '../../src/features/teams/utils/team-bench.ts';

test('isTeamBenchMember requires a character_slug and a valid optional quality', () => {
  assert.ok(isTeamBenchMember({ character_slug: 'athena' }));
  assert.ok(
    isTeamBenchMember({ character_slug: 'athena', character_quality: 'SSR' }),
  );
  assert.ok(
    !isTeamBenchMember({
      character_slug: 'athena',
      character_quality: 'bogus',
    }),
  );
  assert.ok(!isTeamBenchMember({}));
  assert.ok(!isTeamBenchMember(null));
  assert.ok(!isTeamBenchMember({ character_slug: 'athena', note: 123 }));
});

test('getTeamBenchEntryName/Quality read the raw fields', () => {
  const entry = { character_slug: 'zeus', character_quality: 'UR' };
  assert.equal(getTeamBenchEntryName(entry), 'zeus');
  assert.equal(getTeamBenchEntryQuality(entry), 'UR');
});

test('getTeamBenchEntryNote normalizes blank/whitespace notes to undefined', () => {
  assert.equal(
    getTeamBenchEntryNote({ character_slug: 'zeus', note: '  ' }),
    undefined,
  );
  assert.equal(
    getTeamBenchEntryNote({ character_slug: 'zeus', note: 'benched for DPS' }),
    'benched for DPS',
  );
});

test('normalizeTeamBenchEntry accepts a bare slug string', () => {
  assert.deepEqual(normalizeTeamBenchEntry('athena'), {
    character_slug: 'athena',
  });
});

test('normalizeTeamBenchEntry slugifies a legacy display name string', () => {
  assert.deepEqual(normalizeTeamBenchEntry('Vermilion Bird'), {
    character_slug: 'vermilion_bird',
  });
});

test('normalizeTeamBenchEntry supports the legacy character_name object field', () => {
  assert.deepEqual(normalizeTeamBenchEntry({ character_name: 'Athena' }), {
    character_slug: 'athena',
  });
});

test('normalizeTeamBenchEntry keeps a valid quality and drops an invalid one', () => {
  assert.deepEqual(
    normalizeTeamBenchEntry({
      character_slug: 'athena',
      character_quality: 'SSR',
    }),
    { character_slug: 'athena', character_quality: 'SSR' },
  );
  assert.deepEqual(
    normalizeTeamBenchEntry({
      character_slug: 'athena',
      character_quality: 'nope',
    }),
    { character_slug: 'athena' },
  );
});

test('normalizeTeamBenchEntry returns null when no usable slug can be found', () => {
  assert.equal(normalizeTeamBenchEntry({}), null);
  assert.equal(normalizeTeamBenchEntry(42), null);
  assert.equal(normalizeTeamBenchEntry(null), null);
});
