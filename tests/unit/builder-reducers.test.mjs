import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyTeamBuilderState,
  teamBuilderReducer,
} from '../../src/features/teams/team-builder-state.ts';
import {
  createEmptyTierListBuilderState,
  tierListBuilderReducer,
} from '../../src/features/tier-list/tier-list-builder-state.ts';

test('team builder reducer updates nested state immutably and clears optional values', () => {
  const initial = createEmptyTeamBuilderState();
  const withSlot = teamBuilderReducer(initial, {
    type: 'SET_SLOT',
    slotIndex: 2,
    characterKey: 'character_ssr',
  });
  const withMeta = teamBuilderReducer(withSlot, {
    type: 'UPDATE_META',
    patch: { name: 'Example Team' },
  });
  const withNote = teamBuilderReducer(withMeta, {
    type: 'SET_BENCH_NOTE',
    characterKey: 'bench_ssr',
    note: 'Keep alive',
  });
  const withoutNote = teamBuilderReducer(withNote, {
    type: 'SET_BENCH_NOTE',
    characterKey: 'bench_ssr',
  });

  assert.equal(initial.slots[2], null);
  assert.equal(withSlot.slots[2], 'character_ssr');
  assert.notEqual(withSlot.slots, initial.slots);
  assert.equal(initial.meta.name, '');
  assert.equal(withMeta.meta.name, 'Example Team');
  assert.deepEqual(withoutNote.benchNotes, {});
});

test('team builder reset returns independent empty collections', () => {
  const populated = teamBuilderReducer(createEmptyTeamBuilderState(), {
    type: 'SET_BENCH',
    bench: ['character_ssr'],
  });
  const reset = teamBuilderReducer(populated, { type: 'RESET' });
  const secondReset = teamBuilderReducer(reset, { type: 'RESET' });

  assert.deepEqual(reset.bench, []);
  assert.equal(
    reset.slots.every((slot) => slot === null),
    true,
  );
  assert.notEqual(reset.slots, secondReset.slots);
  assert.notEqual(reset.slotNotes, secondReset.slotNotes);
});

test('tier-list reducer deletes placements and their notes together', () => {
  const initial = createEmptyTierListBuilderState();
  const tierName = initial.tierDefs[0].name;
  const populated = {
    ...initial,
    placements: { ...initial.placements, [tierName]: ['first', 'second'] },
    notes: { first: 'note one', second: 'note two', retained: 'keep' },
  };

  const result = tierListBuilderReducer(populated, {
    type: 'DELETE_TIER',
    tierName,
  });

  assert.equal(result.placements[tierName], undefined);
  assert.equal(
    result.tierDefs.some((tier) => tier.name === tierName),
    false,
  );
  assert.deepEqual(result.notes, { retained: 'keep' });
  assert.equal(populated.placements[tierName].length, 2);
});

test('tier-list entity changes and resets preserve the selected entity type', () => {
  const initial = {
    ...createEmptyTierListBuilderState(),
    meta: {
      ...createEmptyTierListBuilderState().meta,
      name: 'Shared Ranking',
    },
  };
  const noblePhantasms = tierListBuilderReducer(initial, {
    type: 'SET_ENTITY_TYPE',
    entityType: 'noble_phantasm',
  });
  const reset = tierListBuilderReducer(noblePhantasms, { type: 'RESET' });

  assert.equal(noblePhantasms.meta.name, 'Shared Ranking');
  assert.equal(noblePhantasms.meta.entityType, 'noble_phantasm');
  assert.equal(
    Object.values(noblePhantasms.placements).every(
      (placements) => placements.length === 0,
    ),
    true,
  );
  assert.equal(reset.meta.name, '');
  assert.equal(reset.meta.entityType, 'noble_phantasm');
});
