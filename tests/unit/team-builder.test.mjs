import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPastedTeamPatch,
  getValidRows,
  isTeamMemberLike,
  migrateStoredTeam,
  normalizeTeamFromPartial,
} from '../../src/features/teams/utils/team-builder.ts';

const FALLBACK = {
  name: '',
  author: '',
  content_type: 'PvE',
  description: '',
  faction: 'elemental_echo',
  members: [],
  last_updated: 0,
};

test('getValidRows returns the allowed grid rows per class', () => {
  assert.deepEqual(getValidRows('guardian'), [0]);
  assert.deepEqual(getValidRows('assassin'), [0, 1, 2]);
  assert.deepEqual(getValidRows('priest'), [1, 2]);
});

test('isTeamMemberLike requires a slug (new or legacy) and a valid optional quality', () => {
  assert.ok(isTeamMemberLike({ character_slug: 'athena' }));
  assert.ok(isTeamMemberLike({ character_name: 'Athena' }));
  assert.ok(
    isTeamMemberLike({ character_slug: 'athena', character_quality: 'SSR' }),
  );
  assert.ok(
    !isTeamMemberLike({ character_slug: 'athena', character_quality: 'bogus' }),
  );
  assert.ok(!isTeamMemberLike({}));
  assert.ok(!isTeamMemberLike(null));
});

test('getPastedTeamPatch accepts a bare members array', () => {
  const patch = getPastedTeamPatch([{ character_slug: 'athena' }]);
  assert.deepEqual(patch, { members: [{ character_slug: 'athena' }] });
});

test('getPastedTeamPatch accepts a single-element wrapper array', () => {
  const patch = getPastedTeamPatch([{ name: 'My Team', members: [] }]);
  assert.deepEqual(patch, { name: 'My Team', members: [] });
});

test('getPastedTeamPatch returns null for unusable input', () => {
  assert.equal(getPastedTeamPatch('not an object'), null);
  assert.equal(getPastedTeamPatch(null), null);
});

test('normalizeTeamFromPartial converts legacy character_name members to slugs', () => {
  const team = normalizeTeamFromPartial(
    { members: [{ character_name: 'Vermilion Bird' }] },
    FALLBACK,
  );
  assert.equal(team.members.length, 1);
  assert.equal(team.members[0].character_slug, 'vermilion_bird');
});

test('normalizeTeamFromPartial deduplicates members by slug + quality', () => {
  const team = normalizeTeamFromPartial(
    {
      members: [
        { character_slug: 'athena', character_quality: 'SSR' },
        { character_slug: 'athena', character_quality: 'SSR' },
        { character_slug: 'athena', character_quality: 'UR' },
      ],
    },
    FALLBACK,
  );
  assert.equal(team.members.length, 2);
});

test('normalizeTeamFromPartial keeps a valid position and drops a malformed one', () => {
  const team = normalizeTeamFromPartial(
    {
      members: [
        { character_slug: 'a', position: { row: 1, col: 2 } },
        { character_slug: 'b', position: { row: 'front' } },
      ],
    },
    FALLBACK,
  );
  assert.deepEqual(team.members[0].position, { row: 1, col: 2 });
  assert.equal(team.members[1].position, undefined);
});

test('normalizeTeamFromPartial drops bench entries that duplicate a roster member', () => {
  const team = normalizeTeamFromPartial(
    {
      members: [{ character_slug: 'athena', character_quality: 'SSR' }],
      bench: ['athena', 'zeus'],
    },
    FALLBACK,
  );
  assert.deepEqual(
    team.bench.map((b) => b.character_slug),
    ['zeus'],
  );
});

test('normalizeTeamFromPartial deduplicates bench entries by name', () => {
  const team = normalizeTeamFromPartial(
    { members: [], bench: ['zeus', 'zeus'] },
    FALLBACK,
  );
  assert.equal(team.bench.length, 1);
});

test('normalizeTeamFromPartial maps a legacy faction display name to its slug', () => {
  const team = normalizeTeamFromPartial({ faction: 'Wild Spirit' }, FALLBACK);
  assert.equal(team.faction, 'wild_spirit');
});

test('normalizeTeamFromPartial keeps an already-valid faction slug as is', () => {
  const team = normalizeTeamFromPartial({ faction: 'arcane_wisdom' }, FALLBACK);
  assert.equal(team.faction, 'arcane_wisdom');
});

test('normalizeTeamFromPartial falls back to the fallback faction for unrecognized values', () => {
  const team = normalizeTeamFromPartial({ faction: 'not-a-faction' }, FALLBACK);
  assert.equal(team.faction, FALLBACK.faction);
});

test('normalizeTeamFromPartial normalizes wyrmspell slugs and omits absent ones', () => {
  const team = normalizeTeamFromPartial(
    { wyrmspells: { breach: 'Dragon Breach' } },
    FALLBACK,
  );
  assert.equal(team.wyrmspells.breach, 'dragon_breach');
  assert.ok(!('wildcry' in team.wyrmspells));
});

test('normalizeTeamFromPartial falls back to the fallback team when members/bench are absent', () => {
  const team = normalizeTeamFromPartial({ name: 'Renamed' }, FALLBACK);
  assert.equal(team.name, 'Renamed');
  assert.deepEqual(team.members, FALLBACK.members);
});

test('migrateStoredTeam produces a well-formed team from an empty patch', () => {
  const team = migrateStoredTeam({});
  assert.equal(team.name, '');
  assert.equal(team.faction, 'elemental_echo');
  assert.deepEqual(team.members, []);
});
