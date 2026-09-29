import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_TEAM_FILTERS,
  matchesTeamFilters,
} from '../../src/features/teams/filters.ts';

function makeTeam(overrides = {}) {
  return {
    name: 'Sunfire Squad',
    content_type: 'PvE',
    faction: 'elemental_echo',
    members: [],
    last_updated: 0,
    ...overrides,
  };
}

test('matchesTeamFilters with no search/filters matches everything', () => {
  assert.ok(matchesTeamFilters(makeTeam(), '', EMPTY_TEAM_FILTERS));
});

test('matchesTeamFilters searches name, description, and display author case-insensitively', () => {
  const team = makeTeam({
    description: 'Great for Cloud Clash',
    author: 'Nova',
  });
  assert.ok(matchesTeamFilters(team, 'sunfire', EMPTY_TEAM_FILTERS));
  assert.ok(matchesTeamFilters(team, 'cloud clash', EMPTY_TEAM_FILTERS));
  assert.ok(matchesTeamFilters(team, 'NOVA', EMPTY_TEAM_FILTERS));
  assert.ok(!matchesTeamFilters(team, 'nonexistent', EMPTY_TEAM_FILTERS));
});

test('matchesTeamFilters prefers the verified community author over the free-text one', () => {
  const team = makeTeam({
    author: 'Nova',
    community: { author: { displayName: 'RealAuthor' } },
  });
  assert.ok(matchesTeamFilters(team, 'realauthor', EMPTY_TEAM_FILTERS));
  assert.ok(!matchesTeamFilters(team, 'nova', EMPTY_TEAM_FILTERS));
});

test('matchesTeamFilters filters by faction', () => {
  const team = makeTeam({ faction: 'elemental_echo' });
  assert.ok(
    matchesTeamFilters(team, '', {
      ...EMPTY_TEAM_FILTERS,
      factions: ['elemental_echo'],
    }),
  );
  assert.ok(
    !matchesTeamFilters(team, '', {
      ...EMPTY_TEAM_FILTERS,
      factions: ['wild_spirit'],
    }),
  );
});

test('matchesTeamFilters filters by content type', () => {
  const team = makeTeam({ content_type: 'PvP' });
  assert.ok(
    matchesTeamFilters(team, '', {
      ...EMPTY_TEAM_FILTERS,
      contentTypes: ['PvP'],
    }),
  );
  assert.ok(
    !matchesTeamFilters(team, '', {
      ...EMPTY_TEAM_FILTERS,
      contentTypes: ['Boss'],
    }),
  );
});

test('matchesTeamFilters requires both search and facet filters to pass', () => {
  const team = makeTeam({ faction: 'elemental_echo' });
  assert.ok(
    !matchesTeamFilters(team, 'nonexistent-name', {
      ...EMPTY_TEAM_FILTERS,
      factions: ['elemental_echo'],
    }),
  );
});
