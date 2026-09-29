import { FACTION_COLOR, FACTION_SLUGS } from '@/constants/faction-colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import {
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '@/features/characters/utils/character-route';
import { normalizeNote } from '@/utils/normalize-note';
import {
  getPastedTeamPatch,
  getValidRows,
  GRID_SIZE,
  MAX_ROSTER_SIZE,
  normalizeTeamFromPartial,
  ROW_LABELS,
} from '@/features/teams/utils/team-builder';
import type { Team, TeamMember, TeamWyrmspells } from '@/features/teams/types';
import {
  createEmptyTeamBuilderState,
  teamBuilderReducer,
  type TeamBuilderMetaState,
  type TeamBuilderState,
} from '@/features/teams/team-builder-state';
import { insertUniqueBefore, removeItem } from '@/utils/dnd-list';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useDraftHydration } from '@/hooks';
import type { FactionSlug } from '@/types/faction';
import { showWarningToast } from '@/utils/toast';
import type {
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

const DEFAULT_TEAM_NAME = 'My Team';
const DEFAULT_TEAM_FACTION = 'elemental_echo' as FactionSlug;

export interface UseTeamBuilderStateOptions {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
}

interface CharacterLocationInBuilder {
  zone: 'slot' | 'bench' | 'available';
  index?: number;
}

function createFallbackTeam(): Team {
  return {
    name: '',
    content_type: DEFAULT_CONTENT_TYPE,
    description: '',
    faction: DEFAULT_TEAM_FACTION,
    members: [],
    last_updated: 0,
  };
}

function parseFactionName(value: string | null): FactionSlug | null {
  if (!value) return null;
  return FACTION_SLUGS.includes(value as FactionSlug)
    ? (value as FactionSlug)
    : null;
}

function toCharacterKey(id: UniqueIdentifier | undefined): string | null {
  return typeof id === 'string' ? id : null;
}

/** First empty slot whose row is in `validRows` (any row if `validRows` is null). */
function findNextEmptySlot(
  slots: Array<string | null>,
  validRows: number[] | null,
): number {
  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    if (slots[slotIndex] !== null) continue;
    if (validRows && !validRows.includes(Math.floor(slotIndex / 3))) continue;
    return slotIndex;
  }
  return -1;
}

function toBuilderState(
  data: Team,
  getCharacterKeyFromReference: (name: string, quality?: string) => string,
  getCharacterFromKey: (characterKey: string) => Character | undefined,
): TeamBuilderState {
  const nextState = createEmptyTeamBuilderState();
  nextState.meta = {
    name: data.name || '',
    contentType: normalizeContentType(data.content_type),
    description: data.description || '',
    faction: data.faction || null,
  };

  const usedKeys = new Set<string>();
  const parsedOverdriveEntries: Array<{ slotIndex: number; order: number }> =
    [];

  for (const member of data.members) {
    const characterKey = getCharacterKeyFromReference(
      member.character_slug,
      member.character_quality,
    );
    if (usedKeys.has(characterKey)) continue;

    const character = getCharacterFromKey(characterKey);
    const validRows = character
      ? getValidRows(character.character_class)
      : null;

    // A malformed/duplicate/wrong-row position falls back to the next open
    // valid-row slot instead of silently dropping the character.
    let slotIndex: number;
    if (member.position) {
      const candidate = member.position.row * 3 + member.position.col;
      const candidateValid =
        candidate >= 0 &&
        candidate < GRID_SIZE &&
        nextState.slots[candidate] === null &&
        (!validRows || validRows.includes(member.position.row));
      slotIndex = candidateValid
        ? candidate
        : findNextEmptySlot(nextState.slots, validRows);
    } else {
      slotIndex = findNextEmptySlot(nextState.slots, validRows);
    }

    if (slotIndex === -1) continue;

    nextState.slots[slotIndex] = characterKey;
    usedKeys.add(characterKey);
    nextState.slotNotes[slotIndex] = normalizeNote(member.note) || '';

    if (member.overdrive_order != null) {
      parsedOverdriveEntries.push({
        slotIndex,
        order: member.overdrive_order,
      });
    }
  }

  parsedOverdriveEntries.sort((left, right) => left.order - right.order);
  nextState.overdriveSequence = parsedOverdriveEntries
    .map((entry) => entry.slotIndex)
    .slice(0, MAX_ROSTER_SIZE);
  nextState.overdriveEnabled = nextState.overdriveSequence.length > 0;

  const seenBenchKeys = new Set<string>();
  const normalizedBenchEntries = (data.bench || [])
    .map((benchEntry) => {
      const benchName = getTeamBenchEntryName(benchEntry);
      const benchQuality = getTeamBenchEntryQuality(benchEntry);
      const benchKey = getCharacterKeyFromReference(benchName, benchQuality);
      const benchNote = normalizeNote(getTeamBenchEntryNote(benchEntry)) || '';
      return { benchKey, benchNote };
    })
    .filter((entry) => {
      if (usedKeys.has(entry.benchKey)) return false;
      if (seenBenchKeys.has(entry.benchKey)) return false;
      seenBenchKeys.add(entry.benchKey);
      return true;
    });

  nextState.bench = normalizedBenchEntries.map((entry) => entry.benchKey);
  nextState.benchNotes = Object.fromEntries(
    normalizedBenchEntries
      .map((entry) => [entry.benchKey, entry.benchNote] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );

  nextState.teamWyrmspells = data.wyrmspells || {};

  return nextState;
}

export function useTeamBuilderState({
  characters,
  charMap,
  initialData,
}: UseTeamBuilderStateOptions) {
  const [state, dispatch] = useReducer(
    teamBuilderReducer,
    undefined,
    createEmptyTeamBuilderState,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const { byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const getCharacterFromKey = useCallback(
    (characterKey: string) =>
      getCharacterByReferenceKey(characterKey, charMap, characterByIdentity),
    [characterByIdentity, charMap],
  );

  const getCharacterKeyFromReference = useCallback(
    (name: string, quality?: string) =>
      resolveCharacterReferenceKey(
        name,
        quality,
        characters,
        charMap,
        characterByIdentity,
      ),
    [characterByIdentity, charMap, characters],
  );

  const loadFromTeam = useCallback(
    (team: Team) => {
      dispatch({
        type: 'LOAD_TEAM',
        payload: toBuilderState(
          team,
          getCharacterKeyFromReference,
          getCharacterFromKey,
        ),
      });
    },
    [getCharacterFromKey, getCharacterKeyFromReference],
  );

  const normalizeDraft = useCallback(
    (partial: unknown, fallback: Team) =>
      normalizeTeamFromPartial(
        partial as Parameters<typeof normalizeTeamFromPartial>[0],
        fallback,
      ),
    [],
  );

  const draftHydrated = useDraftHydration({
    initialData,
    storageKey: STORAGE_KEY.TEAMS_BUILDER_DRAFT,
    getPastedPatch: getPastedTeamPatch,
    normalizeFromPartial: normalizeDraft,
    createFallback: createFallbackTeam,
    load: loadFromTeam,
  });

  const deferredName = useDeferredValue(state.meta.name);
  const deferredDescription = useDeferredValue(state.meta.description);
  const deferredContentType = useDeferredValue(state.meta.contentType);
  const deferredFaction = useDeferredValue(state.meta.faction);

  const overdriveOrderBySlot = useMemo(() => {
    const orderBySlot = new Map<number, number>();
    if (!state.overdriveEnabled) return orderBySlot;
    state.overdriveSequence.forEach((slotIndex, orderIndex) => {
      if (state.slots[slotIndex]) {
        orderBySlot.set(slotIndex, orderIndex + 1);
      }
    });
    return orderBySlot;
  }, [state.overdriveEnabled, state.overdriveSequence, state.slots]);

  const teamNames = useMemo(() => {
    const names = new Set<string>();
    for (const slotValue of state.slots) {
      if (slotValue) names.add(slotValue);
    }
    return names;
  }, [state.slots]);

  const teamSize = teamNames.size;
  const factionColor = state.meta.faction
    ? FACTION_COLOR[state.meta.faction]
    : 'blue';

  const hasAnyBuilderData = useMemo(
    () =>
      teamSize > 0 ||
      state.bench.length > 0 ||
      state.overdriveEnabled ||
      state.slotNotes.some((note) => Boolean(normalizeNote(note))) ||
      Object.values(state.benchNotes).some((note) =>
        Boolean(normalizeNote(note)),
      ) ||
      Object.values(state.teamWyrmspells).some((value) => Boolean(value)) ||
      state.meta.name.trim().length > 0 ||
      state.meta.description.trim().length > 0 ||
      state.meta.faction !== null ||
      state.meta.contentType !== DEFAULT_CONTENT_TYPE,
    [state, teamSize],
  );

  const teamData = useMemo<Team>(() => {
    const members: TeamMember[] = [];
    let overdriveOrder = 1;

    if (state.overdriveEnabled) {
      for (const slotIndex of state.overdriveSequence) {
        const characterKey = state.slots[slotIndex];
        if (!characterKey) continue;
        const note = normalizeNote(state.slotNotes[slotIndex]);
        members.push({
          ...toCharacterReferenceFromKey(
            characterKey,
            charMap,
            characterByIdentity,
          ),
          overdrive_order: overdriveOrder++,
          position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
          ...(note ? { note } : {}),
        });
      }
    }

    for (let slotIndex = 0; slotIndex < GRID_SIZE; slotIndex += 1) {
      const characterKey = state.slots[slotIndex];
      if (!characterKey || overdriveOrderBySlot.has(slotIndex)) continue;
      const note = normalizeNote(state.slotNotes[slotIndex]);
      members.push({
        ...toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
        ),
        overdrive_order: null,
        position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
        ...(note ? { note } : {}),
      });
    }

    const nextTeam: Team = {
      name: deferredName || DEFAULT_TEAM_NAME,
      content_type: deferredContentType,
      description: deferredDescription,
      faction: deferredFaction || DEFAULT_TEAM_FACTION,
      members,
      last_updated: 0,
    };

    if (state.bench.length > 0) {
      nextTeam.bench = state.bench.map((characterKey) => {
        const reference = toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
        );
        const note = normalizeNote(state.benchNotes[characterKey]);
        return note ? { ...reference, note } : reference;
      });
    }

    const hasWyrmspells = Object.values(state.teamWyrmspells).some(Boolean);
    if (hasWyrmspells) {
      nextTeam.wyrmspells = state.teamWyrmspells;
    }

    return nextTeam;
  }, [
    charMap,
    characterByIdentity,
    deferredContentType,
    deferredDescription,
    deferredFaction,
    deferredName,
    overdriveOrderBySlot,
    state.bench,
    state.benchNotes,
    state.overdriveEnabled,
    state.overdriveSequence,
    state.slotNotes,
    state.slots,
    state.teamWyrmspells,
  ]);

  const json = useMemo(() => JSON.stringify(teamData, null, 2), [teamData]);

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const usedNames = useMemo(() => {
    const names = new Set<string>();
    for (const slotValue of state.slots) {
      if (slotValue) names.add(slotValue);
    }
    for (const benchKey of state.bench) {
      names.add(benchKey);
    }
    return names;
  }, [state.bench, state.slots]);

  const availableCharacters = useMemo(
    () =>
      characters.filter(
        (character) => !usedNames.has(getCharacterIdentityKey(character)),
      ),
    [characters, usedNames],
  );

  const getCharacterPath = useCallback(
    (characterName: string, characterQuality?: string | null) => {
      const character = resolveCharacterByNameAndQuality(
        characterName,
        characterQuality,
        charMap,
        characterByIdentity,
      );
      if (!character) return getCharacterRoutePathByName(characterName);
      return getCharacterRoutePath(character);
    },
    [charMap, characterByIdentity],
  );

  const updateMeta = useCallback((patch: Partial<TeamBuilderMetaState>) => {
    dispatch({ type: 'UPDATE_META', patch });
  }, []);

  const handleContentTypeChange = useCallback(
    (value: string | null) => {
      updateMeta({
        contentType: normalizeContentType(value, DEFAULT_CONTENT_TYPE),
      });
    },
    [updateMeta],
  );

  const handleNameCommit = useCallback(
    (name: string) => {
      updateMeta({ name });
    },
    [updateMeta],
  );

  const handleDescriptionCommit = useCallback(
    (description: string) => {
      updateMeta({ description });
    },
    [updateMeta],
  );

  const handleFactionChange = useCallback(
    (value: string | null) => {
      updateMeta({ faction: parseFactionName(value) });
    },
    [updateMeta],
  );

  const handleWyrmspellChange = useCallback(
    (key: keyof TeamWyrmspells, value: string | null) => {
      dispatch({ type: 'SET_WYRMSPELL', key, value: value || undefined });
    },
    [],
  );

  const handleOverdriveEnabledChange = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_OVERDRIVE_ENABLED', enabled });
  }, []);

  const removeOverdriveSlot = useCallback(
    (slotIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.filter((index) => index !== slotIndex),
      });
    },
    [state.overdriveSequence],
  );

  const swapOverdriveSlots = useCallback(
    (firstIndex: number, secondIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.map((index) => {
          if (index === firstIndex) return secondIndex;
          if (index === secondIndex) return firstIndex;
          return index;
        }),
      });
    },
    [state.overdriveSequence],
  );

  const moveOverdriveSlot = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.map((index) =>
          index === fromIndex ? toIndex : index,
        ),
      });
    },
    [state.overdriveSequence],
  );

  const isValidPlacement = useCallback(
    (characterKey: string, slotIndex: number) => {
      const character = getCharacterFromKey(characterKey);
      if (!character) return true;
      const row = Math.floor(slotIndex / 3);
      return getValidRows(character.character_class).includes(row);
    },
    [getCharacterFromKey],
  );

  const notifyInvalidPlacement = useCallback(
    (characterKey: string, slotIndex: number) => {
      const character = getCharacterFromKey(characterKey);
      const displayName = character?.name ?? characterKey;
      const targetRowLabel =
        ROW_LABELS[Math.floor(slotIndex / 3)] || 'that row';

      showWarningToast({
        id: 'teambuilder-invalid-placement',
        title: 'Invalid slot placement',
        message: character
          ? `${displayName} (${character.character_class.charAt(0).toUpperCase()}${character.character_class.slice(1)}) cannot be placed in ${targetRowLabel}.`
          : `${displayName} cannot be placed in ${targetRowLabel}.`,
        autoClose: 2400,
      });
    },
    [getCharacterFromKey],
  );

  const notifyTeamFull = useCallback(() => {
    showWarningToast({
      id: 'teambuilder-team-full',
      title: 'Team is full',
      message: `A team can have up to ${MAX_ROSTER_SIZE} members. Remove one before adding another.`,
      autoClose: 2400,
    });
  }, []);

  const notifyNoValidSwapRoom = useCallback(
    (characterKey: string) => {
      const displayName =
        getCharacterFromKey(characterKey)?.name ?? characterKey;
      showWarningToast({
        id: 'teambuilder-no-valid-swap-room',
        title: 'No valid slot available',
        message: `${displayName} cannot be moved because no valid empty row is available.`,
        autoClose: 2400,
      });
    },
    [getCharacterFromKey],
  );

  const findValidEmptySlotForCharacter = useCallback(
    (characterKey: string) => {
      const character = getCharacterFromKey(characterKey);
      const validRows = character
        ? getValidRows(character.character_class)
        : [0, 1, 2];

      for (const row of validRows) {
        for (let col = 0; col < 3; col += 1) {
          const slotIndex = row * 3 + col;
          if (!state.slots[slotIndex]) return slotIndex;
        }
      }

      return -1;
    },
    [getCharacterFromKey, state.slots],
  );

  const findCharacterLocation = useCallback(
    (characterKey: string): CharacterLocationInBuilder => {
      const slotIndex = state.slots.indexOf(characterKey);
      if (slotIndex !== -1) return { zone: 'slot', index: slotIndex };

      const benchIndex = state.bench.indexOf(characterKey);
      if (benchIndex !== -1) return { zone: 'bench', index: benchIndex };

      return { zone: 'available' };
    },
    [state.bench, state.slots],
  );

  const handleAddToNextSlot = useCallback(
    (characterKey: string) => {
      if (teamSize >= MAX_ROSTER_SIZE) {
        notifyTeamFull();
        return;
      }

      const targetIndex = findValidEmptySlotForCharacter(characterKey);
      const displayName =
        getCharacterFromKey(characterKey)?.name ?? characterKey;
      if (targetIndex === -1) {
        showWarningToast({
          id: 'teambuilder-no-valid-slot',
          title: 'No valid slot available',
          message: `${displayName} has no empty valid row right now. Move someone first.`,
          autoClose: 2400,
        });
        return;
      }

      dispatch({ type: 'SET_SLOT', slotIndex: targetIndex, characterKey });
      removeOverdriveSlot(targetIndex);
    },
    [
      findValidEmptySlotForCharacter,
      getCharacterFromKey,
      notifyTeamFull,
      removeOverdriveSlot,
      teamSize,
    ],
  );

  const handleOverdriveOrderChange = useCallback(
    (slotIndex: number, value: number | null) => {
      if (!state.slots[slotIndex]) return;

      const withoutCurrent = state.overdriveSequence.filter(
        (index) => index !== slotIndex,
      );
      if (value == null || !Number.isFinite(value)) {
        dispatch({ type: 'SET_OVERDRIVE_SEQUENCE', payload: withoutCurrent });
        return;
      }

      const slotCap = state.slots.filter(Boolean).length;
      const maxOrder = Math.min(MAX_ROSTER_SIZE, Math.max(1, slotCap));
      const clampedOrder = Math.min(Math.max(Math.round(value), 1), maxOrder);
      const nextOrder = [...withoutCurrent];
      nextOrder.splice(clampedOrder - 1, 0, slotIndex);

      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: nextOrder.slice(0, MAX_ROSTER_SIZE),
      });
    },
    [state.overdriveSequence, state.slots],
  );

  const handleRemoveFromTeam = useCallback(
    (slotIndex: number) => {
      const characterKey = state.slots[slotIndex];
      if (!characterKey) return;
      dispatch({ type: 'SET_SLOT', slotIndex, characterKey: null });
      dispatch({ type: 'SET_SLOT_NOTE', slotIndex, note: '' });
      removeOverdriveSlot(slotIndex);
    },
    [removeOverdriveSlot, state.slots],
  );

  const handleSlotNoteChange = useCallback(
    (slotIndex: number, note: string) => {
      dispatch({
        type: 'SET_SLOT_NOTE',
        slotIndex,
        note: normalizeNote(note) || '',
      });
    },
    [],
  );

  const handleBenchNoteChange = useCallback(
    (characterKey: string, note: string) => {
      dispatch({
        type: 'SET_BENCH_NOTE',
        characterKey,
        note: normalizeNote(note) || undefined,
      });
    },
    [],
  );

  const handlePasteApply = useCallback(
    (pasteText: string) => {
      try {
        const parsed = JSON.parse(pasteText) as unknown;
        const partialTeam = getPastedTeamPatch(parsed);
        if (!partialTeam) {
          return 'Invalid team JSON: expected an object or a members array.';
        }

        const mergedTeam = normalizeTeamFromPartial(partialTeam, teamData);
        loadFromTeam(mergedTeam);
        return null;
      } catch {
        return 'Could not parse JSON. Paste a JSON object, a one-item team array, or a members array.';
      }
    },
    [loadFromTeam, teamData],
  );

  const handleClear = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(toCharacterKey(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);

      const characterKey = toCharacterKey(event.active.id);
      const overId = toCharacterKey(event.over?.id);
      if (!characterKey || !overId) return;

      const from = findCharacterLocation(characterKey);
      const isSlotTarget = overId.startsWith('slot-');
      const targetSlotIndex = isSlotTarget
        ? Number.parseInt(overId.replace('slot-', ''), 10)
        : -1;

      if (isSlotTarget) {
        if (!isValidPlacement(characterKey, targetSlotIndex)) {
          notifyInvalidPlacement(characterKey, targetSlotIndex);
          return;
        }

        const occupant = state.slots[targetSlotIndex];

        if (from.zone === 'bench' && occupant) {
          const incomingBenchNote = state.benchNotes[characterKey] || '';
          const outgoingSlotNote = state.slotNotes[targetSlotIndex] || '';

          dispatch({
            type: 'SET_SLOT',
            slotIndex: targetSlotIndex,
            characterKey,
          });
          dispatch({
            type: 'SET_SLOT_NOTE',
            slotIndex: targetSlotIndex,
            note: incomingBenchNote,
          });
          removeOverdriveSlot(targetSlotIndex);

          const nextBench = [...state.bench];
          const benchIndex = nextBench.indexOf(characterKey);
          if (benchIndex !== -1) {
            nextBench[benchIndex] = occupant;
          }
          dispatch({
            type: 'SET_BENCH',
            bench: nextBench,
            benchNotes: {
              ...Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== characterKey,
                ),
              ),
              [occupant]: outgoingSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available' || from.zone === 'bench') {
          const incomingNote =
            from.zone === 'bench' ? state.benchNotes[characterKey] || '' : '';

          // Full team: occupant is overwritten outright (nowhere to relocate them).
          if (occupant && teamSize >= MAX_ROSTER_SIZE) {
            dispatch({
              type: 'SET_SLOT',
              slotIndex: targetSlotIndex,
              characterKey,
            });
            dispatch({
              type: 'SET_SLOT_NOTE',
              slotIndex: targetSlotIndex,
              note: incomingNote,
            });
            removeOverdriveSlot(targetSlotIndex);
          } else if (occupant) {
            const emptySlotIndex = findValidEmptySlotForCharacter(occupant);
            if (emptySlotIndex === -1) {
              notifyNoValidSwapRoom(occupant);
              return;
            }

            const nextSlots = [...state.slots];
            nextSlots[targetSlotIndex] = characterKey;
            nextSlots[emptySlotIndex] = occupant;

            const nextSlotNotes = [...state.slotNotes];
            nextSlotNotes[emptySlotIndex] = nextSlotNotes[targetSlotIndex];
            nextSlotNotes[targetSlotIndex] = incomingNote;

            dispatch({
              type: 'LOAD_TEAM',
              payload: { ...state, slots: nextSlots, slotNotes: nextSlotNotes },
            });
            moveOverdriveSlot(targetSlotIndex, emptySlotIndex);
          } else {
            if (teamSize >= MAX_ROSTER_SIZE) {
              notifyTeamFull();
              return;
            }

            dispatch({
              type: 'SET_SLOT',
              slotIndex: targetSlotIndex,
              characterKey,
            });
            dispatch({
              type: 'SET_SLOT_NOTE',
              slotIndex: targetSlotIndex,
              note: incomingNote,
            });
            removeOverdriveSlot(targetSlotIndex);
          }

          if (from.zone === 'bench') {
            dispatch({
              type: 'SET_BENCH',
              bench: removeItem(state.bench, characterKey),
              benchNotes: Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== characterKey,
                ),
              ),
            });
          }

          return;
        }

        if (from.zone === 'slot' && from.index !== undefined) {
          if (from.index === targetSlotIndex) return;
          if (occupant && !isValidPlacement(occupant, from.index)) {
            notifyInvalidPlacement(occupant, from.index);
            return;
          }

          const nextSlots = [...state.slots];
          nextSlots[from.index] = occupant;
          nextSlots[targetSlotIndex] = characterKey;

          const nextSlotNotes = [...state.slotNotes];
          const fromNote = nextSlotNotes[from.index];
          nextSlotNotes[from.index] = nextSlotNotes[targetSlotIndex];
          nextSlotNotes[targetSlotIndex] = fromNote;

          dispatch({
            type: 'LOAD_TEAM',
            payload: { ...state, slots: nextSlots, slotNotes: nextSlotNotes },
          });
          swapOverdriveSlots(from.index, targetSlotIndex);
        }

        return;
      }

      if (overId === 'available') {
        if (from.zone === 'slot' && from.index !== undefined) {
          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: null,
          });
          dispatch({ type: 'SET_SLOT_NOTE', slotIndex: from.index, note: '' });
          removeOverdriveSlot(from.index);
        } else if (from.zone === 'bench') {
          dispatch({
            type: 'SET_BENCH',
            bench: removeItem(state.bench, characterKey),
            benchNotes: Object.fromEntries(
              Object.entries(state.benchNotes).filter(
                ([key]) => key !== characterKey,
              ),
            ),
          });
        }
        return;
      }

      if (overId.startsWith('bench-item-')) {
        const targetKey = overId.replace('bench-item-', '');
        if (!state.bench.includes(targetKey)) return;

        if (from.zone === 'bench') {
          if (characterKey === targetKey) return;
          const fromIndex = state.bench.indexOf(characterKey);
          const toIndex = state.bench.indexOf(targetKey);
          if (fromIndex === -1 || toIndex === -1) return;

          const nextBench = [...state.bench];
          [nextBench[fromIndex], nextBench[toIndex]] = [
            nextBench[toIndex],
            nextBench[fromIndex],
          ];
          dispatch({ type: 'SET_BENCH', bench: nextBench });
          return;
        }

        if (from.zone === 'slot' && from.index !== undefined) {
          if (!isValidPlacement(targetKey, from.index)) {
            notifyInvalidPlacement(targetKey, from.index);
            return;
          }

          const movedSlotNote = state.slotNotes[from.index] || '';
          const incomingBenchNote = state.benchNotes[targetKey] || '';

          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: targetKey,
          });
          dispatch({
            type: 'SET_SLOT_NOTE',
            slotIndex: from.index,
            note: incomingBenchNote,
          });
          removeOverdriveSlot(from.index);

          const nextBench = [...state.bench];
          const targetIndex = nextBench.indexOf(targetKey);
          if (targetIndex !== -1) {
            nextBench[targetIndex] = characterKey;
          }

          dispatch({
            type: 'SET_BENCH',
            bench: nextBench,
            benchNotes: {
              ...Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== targetKey,
                ),
              ),
              [characterKey]: movedSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available') {
          dispatch({
            type: 'SET_BENCH',
            bench: insertUniqueBefore(state.bench, characterKey, targetKey),
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey] || '',
            },
          });
        }

        return;
      }

      if (overId === 'bench') {
        if (from.zone === 'slot' && from.index !== undefined) {
          const movedSlotNote = state.slotNotes[from.index] || '';
          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: null,
          });
          dispatch({ type: 'SET_SLOT_NOTE', slotIndex: from.index, note: '' });
          removeOverdriveSlot(from.index);

          dispatch({
            type: 'SET_BENCH',
            bench: state.bench.includes(characterKey)
              ? state.bench
              : [...state.bench, characterKey],
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey]?.trim().length
                ? state.benchNotes[characterKey]
                : movedSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available') {
          dispatch({
            type: 'SET_BENCH',
            bench: state.bench.includes(characterKey)
              ? state.bench
              : [...state.bench, characterKey],
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey] || '',
            },
          });
        }
      }
    },
    [
      findCharacterLocation,
      findValidEmptySlotForCharacter,
      isValidPlacement,
      moveOverdriveSlot,
      notifyInvalidPlacement,
      notifyNoValidSwapRoom,
      notifyTeamFull,
      removeOverdriveSlot,
      state,
      swapOverdriveSlots,
      teamSize,
    ],
  );

  return {
    activeId,
    availableCharacters,
    bench: state.bench,
    benchNotes: state.benchNotes,
    characterByIdentity,
    factionColor,
    getCharacterFromKey,
    getCharacterPath,
    handleAddToNextSlot,
    handleBenchNoteChange,
    handleClear,
    handleContentTypeChange,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleFactionChange,
    handleNameCommit,
    handleOverdriveEnabledChange,
    handleOverdriveOrderChange,
    handlePasteApply,
    handleRemoveFromTeam,
    handleSlotNoteChange,
    handleWyrmspellChange,
    hasAnyBuilderData,
    json,
    meta: state.meta,
    overdriveEnabled: state.overdriveEnabled,
    overdriveOrderBySlot,
    slotNotes: state.slotNotes,
    slots: state.slots,
    teamData,
    teamSize,
    teamWyrmspells: state.teamWyrmspells,
  };
}
