import { DEFAULT_TIER_DEFINITIONS } from '@/constants/tier-colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import {
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '@/features/characters/utils/character-route';
import type { TierExportRow } from '@/features/tier-list/components/TierListBuilder/ExportView';
import { normalizeNote } from '@/utils/normalize-note';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  getPastedTierListPatch,
  normalizeTierListFromPartial,
} from '@/features/tier-list/utils/tier-list-builder';
import type {
  CharacterTierEntry,
  NoblePhantasmTierEntry,
  TierDefinition,
  TierList,
  TierListEntityType,
  TierListRankableEntity,
} from '@/features/tier-list/types';
import {
  createDefaultTierDefs,
  createEmptyTierListBuilderState,
  createTierPlacements,
  removeEntityNote,
  tierListBuilderReducer,
  type TierListBuilderMetaState,
  type TierListBuilderState,
  type TierPlacements,
} from '@/features/tier-list/tier-list-builder-state';
import {
  getTierListEntityType,
  isCharacterTierEntry,
  isNoblePhantasmTierEntry,
} from '@/features/tier-list/types';
import { removeItemFromRecordArrays } from '@/utils/dnd-list';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useDraftHydration } from '@/hooks';
import type { Quality } from '@/types/quality';
import { compareQuality } from '@/utils/quality';
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

const DEFAULT_TIER_LIST_NAME = 'My Tier List';

export interface UseTierListStateOptions {
  characters: Character[];
  charMap: Map<string, Character>;
  noblePhantasms: NoblePhantasm[];
  initialData?: TierList | null;
}

interface DragResolution {
  placements: TierPlacements;
  notes: Record<string, string>;
}

function createFallbackTierList(): TierList {
  return {
    name: '',
    slug: '',
    entity_type: 'character',
    content_type: DEFAULT_CONTENT_TYPE,
    description: '',
    tiers: createDefaultTierDefs(),
    entries: [],
    last_updated: 0,
  };
}

function clonePlacements(source: TierPlacements): TierPlacements {
  const nextPlacements: TierPlacements = {};
  for (const [key, values] of Object.entries(source)) {
    nextPlacements[key] = [...values];
  }
  return nextPlacements;
}

function toEntityKey(id: UniqueIdentifier | undefined): string | null {
  return typeof id === 'string' ? id : null;
}

function toBuilderState(
  data: TierList,
  getCharacterKeyFromReference: (name: string, quality?: Quality) => string,
): TierListBuilderState {
  const entityType = getTierListEntityType(data);
  const baseTierDefs = data.tiers?.length
    ? data.tiers.map((tierDef) => ({
        name: tierDef.name,
        note: normalizeNote(tierDef.note) || '',
      }))
    : createDefaultTierDefs();

  const tierNameSet = new Set(baseTierDefs.map((tierDef) => tierDef.name));
  const extraTierDefs: TierDefinition[] = [];
  for (const entry of data.entries) {
    if (!tierNameSet.has(entry.tier)) {
      extraTierDefs.push({ name: entry.tier, note: '' });
      tierNameSet.add(entry.tier);
    }
  }

  const tierDefs = [...baseTierDefs, ...extraTierDefs];
  const placements = createTierPlacements(tierDefs);
  const notes: Record<string, string> = {};
  const seenEntities = new Set<string>();

  for (const entry of data.entries) {
    let entityKey: string;
    if (entityType === 'noble_phantasm') {
      if (!isNoblePhantasmTierEntry(entry)) continue;
      entityKey = entry.noble_phantasm_slug;
    } else {
      if (!isCharacterTierEntry(entry)) continue;
      entityKey = getCharacterKeyFromReference(
        entry.character_slug,
        entry.character_quality,
      );
    }
    if (seenEntities.has(entityKey)) continue;
    seenEntities.add(entityKey);

    if (placements[entry.tier] !== undefined) {
      placements[entry.tier].push(entityKey);
    }

    const normalizedEntryNote = normalizeNote(entry.note);
    if (normalizedEntryNote) {
      notes[entityKey] = normalizedEntryNote;
    }
  }

  return {
    tierDefs,
    placements,
    notes,
    meta: {
      name: data.name || '',
      categoryName: normalizeContentType(data.content_type),
      description: data.description || '',
      entityType,
    },
  };
}

function applyTierListDrag(
  state: TierListBuilderState,
  input: {
    characterKey: string;
    overId: string;
    activeTier?: string;
    targetCharacterKey?: string;
    targetTier?: string;
  },
): DragResolution | null {
  const { characterKey, overId, activeTier, targetCharacterKey, targetTier } =
    input;

  if (overId === 'unranked') {
    if (!activeTier) return null;
    const nextPlacements = clonePlacements(state.placements);
    nextPlacements[activeTier] = nextPlacements[activeTier].filter(
      (entry) => entry !== characterKey,
    );
    return {
      placements: nextPlacements,
      notes: removeEntityNote(state.notes, characterKey),
    };
  }

  if (overId.startsWith('char-')) {
    if (!targetCharacterKey) return null;
    if (characterKey === targetCharacterKey) return null;

    if (!targetTier) {
      if (!activeTier) return null;
      const nextPlacements = clonePlacements(state.placements);
      const activeIndex = nextPlacements[activeTier].indexOf(characterKey);
      if (activeIndex === -1) return null;

      nextPlacements[activeTier][activeIndex] = targetCharacterKey;
      return {
        placements: nextPlacements,
        notes: removeEntityNote(state.notes, characterKey),
      };
    }

    const nextPlacements = clonePlacements(state.placements);
    const targetIndex =
      nextPlacements[targetTier]?.indexOf(targetCharacterKey) ?? -1;
    if (targetIndex === -1) return null;

    if (activeTier) {
      const activeIndex =
        nextPlacements[activeTier]?.indexOf(characterKey) ?? -1;
      if (activeIndex === -1) return null;

      if (activeTier === targetTier) {
        nextPlacements[targetTier][activeIndex] = targetCharacterKey;
        nextPlacements[targetTier][targetIndex] = characterKey;
        return { placements: nextPlacements, notes: state.notes };
      }

      nextPlacements[activeTier] = nextPlacements[activeTier].filter(
        (entry) => entry !== characterKey,
      );
      nextPlacements[targetTier][targetIndex] = characterKey;
      nextPlacements[activeTier].push(targetCharacterKey);
      return { placements: nextPlacements, notes: state.notes };
    }

    removeItemFromRecordArrays(nextPlacements, characterKey);
    nextPlacements[targetTier][targetIndex] = characterKey;
    return { placements: nextPlacements, notes: state.notes };
  }

  if (overId.startsWith('tier-')) {
    const tierName = overId.replace('tier-', '');
    const nextPlacements = clonePlacements(state.placements);
    removeItemFromRecordArrays(nextPlacements, characterKey);
    if (!nextPlacements[tierName]) {
      nextPlacements[tierName] = [];
    }
    nextPlacements[tierName].push(characterKey);
    return { placements: nextPlacements, notes: state.notes };
  }

  return null;
}

export function useTierListState({
  characters,
  charMap,
  noblePhantasms,
  initialData,
}: UseTierListStateOptions) {
  const [state, dispatch] = useReducer(
    tierListBuilderReducer,
    undefined,
    createEmptyTierListBuilderState,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const { byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const getCharacterFromKey = useCallback(
    (characterKey: string) =>
      getCharacterByReferenceKey(characterKey, charMap, characterByIdentity),
    [characterByIdentity, charMap],
  );

  const noblePhantasmBySlug = useMemo(() => {
    const result = new Map<string, NoblePhantasm>();
    for (const noblePhantasm of noblePhantasms) {
      result.set(noblePhantasm.slug, noblePhantasm);
      if (noblePhantasm.legacy_slug) {
        result.set(noblePhantasm.legacy_slug, noblePhantasm);
      }
    }
    return result;
  }, [noblePhantasms]);

  const getEntityFromKey = useCallback(
    (entityKey: string): TierListRankableEntity | undefined => {
      if (state.meta.entityType === 'noble_phantasm') {
        const noblePhantasm = noblePhantasmBySlug.get(entityKey);
        return noblePhantasm
          ? {
              key: noblePhantasm.slug,
              entityType: 'noble_phantasm',
              noblePhantasm,
            }
          : undefined;
      }
      const character = getCharacterFromKey(entityKey);
      return character
        ? {
            key: getCharacterIdentityKey(character),
            entityType: 'character',
            character,
          }
        : undefined;
    },
    [getCharacterFromKey, noblePhantasmBySlug, state.meta.entityType],
  );

  const getCharacterKeyFromReference = useCallback(
    (name: string, quality?: Quality) =>
      resolveCharacterReferenceKey(
        name,
        quality,
        characters,
        charMap,
        characterByIdentity,
      ),
    [characterByIdentity, charMap, characters],
  );

  const loadFromTierList = useCallback(
    (tierList: TierList) => {
      dispatch({
        type: 'LOAD_TIER_LIST',
        payload: toBuilderState(tierList, getCharacterKeyFromReference),
      });
    },
    [getCharacterKeyFromReference],
  );

  const normalizeDraft = useCallback(
    (partial: unknown, fallback: TierList) =>
      normalizeTierListFromPartial(
        partial as Parameters<typeof normalizeTierListFromPartial>[0],
        fallback,
      ),
    [],
  );

  const draftHydrated = useDraftHydration({
    initialData,
    storageKey: STORAGE_KEY.TIER_LIST_BUILDER_DRAFT,
    getPastedPatch: getPastedTierListPatch,
    normalizeFromPartial: normalizeDraft,
    createFallback: createFallbackTierList,
    load: loadFromTierList,
  });

  const deferredName = useDeferredValue(state.meta.name);
  const deferredDescription = useDeferredValue(state.meta.description);
  const deferredCategoryName = useDeferredValue(state.meta.categoryName);

  const tierListData = useMemo<TierList>(() => {
    const entries: TierList['entries'] = [];
    for (const tierDef of state.tierDefs) {
      for (const entityKey of state.placements[tierDef.name] || []) {
        const note = state.notes[entityKey]
          ? { note: state.notes[entityKey] }
          : {};
        if (state.meta.entityType === 'noble_phantasm') {
          const noblePhantasm = noblePhantasmBySlug.get(entityKey);
          const entry: NoblePhantasmTierEntry = {
            noble_phantasm_slug: noblePhantasm?.slug ?? entityKey,
            tier: tierDef.name,
            ...note,
          };
          entries.push(entry);
          continue;
        }
        const entry: CharacterTierEntry = {
          ...toCharacterReferenceFromKey(
            entityKey,
            charMap,
            characterByIdentity,
          ),
          tier: tierDef.name,
          ...note,
        };
        entries.push(entry);
      }
    }
    return {
      name: deferredName || DEFAULT_TIER_LIST_NAME,
      slug: toEntitySlug(deferredName || DEFAULT_TIER_LIST_NAME),
      entity_type: state.meta.entityType,
      content_type: deferredCategoryName,
      description: deferredDescription,
      tiers: state.tierDefs.map((tierDef) => ({
        name: tierDef.name,
        ...(normalizeNote(tierDef.note)
          ? { note: normalizeNote(tierDef.note) }
          : {}),
      })),
      entries,
      last_updated: 0,
    };
  }, [
    charMap,
    characterByIdentity,
    deferredCategoryName,
    deferredDescription,
    deferredName,
    noblePhantasmBySlug,
    state.notes,
    state.meta.entityType,
    state.placements,
    state.tierDefs,
  ]);

  const json = useMemo(
    () => JSON.stringify(tierListData, null, 2),
    [tierListData],
  );

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const hasAnyPlaced = useMemo(
    () => Object.values(state.placements).some((entries) => entries.length > 0),
    [state.placements],
  );

  const unrankedEntities = useMemo<TierListRankableEntity[]>(() => {
    const placedEntities = new Set(Object.values(state.placements).flat());
    if (state.meta.entityType === 'noble_phantasm') {
      return noblePhantasms
        .filter((entity) => !placedEntities.has(entity.slug))
        .map((noblePhantasm) => ({
          key: noblePhantasm.slug,
          entityType: 'noble_phantasm',
          noblePhantasm,
        }));
    }
    return characters
      .filter(
        (character) => !placedEntities.has(getCharacterIdentityKey(character)),
      )
      .map((character) => ({
        key: getCharacterIdentityKey(character),
        entityType: 'character',
        character,
      }));
  }, [characters, noblePhantasms, state.meta.entityType, state.placements]);

  const hasAnyBuilderData = useMemo(
    () =>
      hasAnyPlaced ||
      Object.values(state.notes).some((note) => Boolean(normalizeNote(note))) ||
      state.tierDefs.length !== DEFAULT_TIER_DEFINITIONS.length ||
      state.tierDefs.some((tierDef, index) => {
        const defaultTierDef = DEFAULT_TIER_DEFINITIONS[index];
        if (!defaultTierDef) return true;
        const tierNote = normalizeNote(tierDef.note) || '';
        const defaultTierNote = normalizeNote(defaultTierDef.note) || '';
        return (
          tierDef.name !== defaultTierDef.name || tierNote !== defaultTierNote
        );
      }) ||
      state.meta.name.trim().length > 0 ||
      state.meta.description.trim().length > 0 ||
      state.meta.categoryName !== DEFAULT_CONTENT_TYPE,
    [hasAnyPlaced, state.meta, state.notes, state.tierDefs],
  );

  const tierExportRows = useMemo<TierExportRow[]>(
    () =>
      state.tierDefs
        .map((tierDef, index) => ({
          tier: tierDef.name,
          tierIndex: index,
          note: tierDef.note,
          entries: (state.placements[tierDef.name] || []).map((entityKey) => {
            const entity = getEntityFromKey(entityKey);
            return {
              entityName:
                entity?.character?.name ??
                entity?.noblePhantasm?.name ??
                entityKey,
              entity,
            };
          }),
        }))
        .filter((row) => row.entries.length > 0),
    [getEntityFromKey, state.placements, state.tierDefs],
  );

  const updateMeta = useCallback((patch: Partial<TierListBuilderMetaState>) => {
    dispatch({ type: 'UPDATE_META', patch });
  }, []);

  const handleNameCommit = useCallback(
    (name: string) => {
      updateMeta({ name });
    },
    [updateMeta],
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      updateMeta({
        categoryName: normalizeContentType(value, DEFAULT_CONTENT_TYPE),
      });
    },
    [updateMeta],
  );

  const handleDescriptionCommit = useCallback(
    (description: string) => {
      updateMeta({ description });
    },
    [updateMeta],
  );

  const handleEntityTypeChange = useCallback(
    (entityType: TierListEntityType) => {
      if (entityType === state.meta.entityType) return;
      dispatch({ type: 'SET_ENTITY_TYPE', entityType });
    },
    [state.meta.entityType],
  );

  const handleCharacterNoteChange = useCallback(
    (characterKey: string, note: string) => {
      dispatch({
        type: 'SET_CHARACTER_NOTE',
        characterKey,
        note: normalizeNote(note),
      });
    },
    [],
  );

  const handleTierNoteChange = useCallback((tierName: string, note: string) => {
    dispatch({
      type: 'SET_TIER_NOTE',
      tierName,
      note: normalizeNote(note) || '',
    });
  }, []);

  const handleDeleteTier = useCallback((tierName: string) => {
    dispatch({ type: 'DELETE_TIER', tierName });
  }, []);

  const handleMoveTierUp = useCallback((index: number) => {
    if (index === 0) return;
    dispatch({ type: 'MOVE_TIER', fromIndex: index, toIndex: index - 1 });
  }, []);

  const handleMoveTierDown = useCallback(
    (index: number) => {
      if (index >= state.tierDefs.length - 1) return;
      dispatch({ type: 'MOVE_TIER', fromIndex: index, toIndex: index + 1 });
    },
    [state.tierDefs.length],
  );

  const handleAddTier = useCallback(
    (name: string, note?: string) => {
      const trimmedTierName = name.trim();
      if (!trimmedTierName) {
        showWarningToast({
          id: 'tierlistbuilder-tier-name-required',
          title: 'Tier name required',
          message: 'Enter a tier name before adding a new tier.',
          autoClose: 2400,
        });
        return;
      }

      if (state.tierDefs.some((tierDef) => tierDef.name === trimmedTierName)) {
        showWarningToast({
          id: 'tierlistbuilder-tier-name-duplicate',
          title: 'Tier already exists',
          message: `A tier named "${trimmedTierName}" already exists. Use a different name.`,
          autoClose: 2400,
        });
        return;
      }

      dispatch({
        type: 'ADD_TIER',
        name: trimmedTierName,
        note: normalizeNote(note),
      });
    },
    [state.tierDefs],
  );

  const handlePasteApply = useCallback(
    (pasteText: string) => {
      try {
        const parsed = JSON.parse(pasteText) as unknown;
        const partialTierList = getPastedTierListPatch(parsed);
        if (!partialTierList) {
          return 'Invalid tier list JSON: expected an object or an entries array.';
        }

        const mergedTierList = normalizeTierListFromPartial(
          partialTierList,
          tierListData,
        );
        loadFromTierList(mergedTierList);
        return null;
      } catch {
        return 'Could not parse JSON. Paste a JSON object, a one-item tier list array, or an entries array.';
      }
    },
    [loadFromTierList, tierListData],
  );

  const handleSort = useCallback(() => {
    const nextPlacements: TierPlacements = {};
    for (const tierDef of state.tierDefs) {
      nextPlacements[tierDef.name] = [
        ...(state.placements[tierDef.name] || []),
      ].sort((left, right) => {
        const leftEntity = getEntityFromKey(left);
        const rightEntity = getEntityFromKey(right);
        if (!leftEntity && !rightEntity) return left.localeCompare(right);
        if (!leftEntity) return 1;
        if (!rightEntity) return -1;
        const leftQuality =
          leftEntity.character?.quality ??
          leftEntity.noblePhantasm?.quality ??
          '';
        const rightQuality =
          rightEntity.character?.quality ??
          rightEntity.noblePhantasm?.quality ??
          '';
        const qualityComparison = compareQuality(leftQuality, rightQuality);
        if (qualityComparison !== 0) return qualityComparison;
        const leftName =
          leftEntity.character?.name ?? leftEntity.noblePhantasm?.name ?? left;
        const rightName =
          rightEntity.character?.name ??
          rightEntity.noblePhantasm?.name ??
          right;
        return leftName.localeCompare(rightName);
      });
    }
    dispatch({ type: 'SET_PLACEMENTS', payload: nextPlacements });
  }, [getEntityFromKey, state.placements, state.tierDefs]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(toEntityKey(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const characterKey = toEntityKey(event.active.id);
      const overId = toEntityKey(event.over?.id);
      if (!characterKey || !overId) return;

      const activeTier =
        typeof event.active.data.current?.tier === 'string'
          ? event.active.data.current.tier
          : undefined;
      const targetCharacterKey =
        typeof event.over?.data.current?.entityKey === 'string'
          ? event.over.data.current.entityKey
          : undefined;
      const targetTier =
        typeof event.over?.data.current?.tier === 'string'
          ? event.over.data.current.tier
          : undefined;

      const dragResult = applyTierListDrag(state, {
        characterKey,
        overId,
        activeTier,
        targetCharacterKey,
        targetTier,
      });

      if (!dragResult) return;
      dispatch({ type: 'SET_PLACEMENTS', payload: dragResult.placements });
      if (dragResult.notes !== state.notes) {
        for (const noteKey of new Set([
          ...Object.keys(state.notes),
          ...Object.keys(dragResult.notes),
        ])) {
          const previous = state.notes[noteKey];
          const next = dragResult.notes[noteKey];
          if (previous !== next) {
            dispatch({
              type: 'SET_CHARACTER_NOTE',
              characterKey: noteKey,
              note: next,
            });
          }
        }
      }
    },
    [state],
  );

  return {
    activeId,
    getEntityFromKey,
    handleAddTier,
    handleCategoryChange,
    handleCharacterNoteChange,
    handleClear,
    handleDeleteTier,
    handleDescriptionCommit,
    handleEntityTypeChange,
    handleDragEnd,
    handleDragStart,
    handleMoveTierDown,
    handleMoveTierUp,
    handleNameCommit,
    handlePasteApply,
    handleSort,
    handleTierNoteChange,
    hasAnyBuilderData,
    hasAnyPlaced,
    json,
    meta: state.meta,
    notes: state.notes,
    placements: state.placements,
    tierDefs: state.tierDefs,
    tierExportRows,
    tierListData,
    unrankedEntities,
  };
}
