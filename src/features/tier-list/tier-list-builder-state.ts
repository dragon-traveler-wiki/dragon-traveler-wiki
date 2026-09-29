import {
  DEFAULT_CONTENT_TYPE,
  type ContentType,
} from '../../constants/content-types.ts';
import { DEFAULT_TIER_DEFINITIONS } from '../../constants/tier-colors.ts';
import type { TierDefinition, TierListEntityType } from './types';

export type TierPlacements = Record<string, string[]>;

export interface TierListBuilderMetaState {
  name: string;
  categoryName: ContentType;
  description: string;
  entityType: TierListEntityType;
}

export interface TierListBuilderState {
  tierDefs: TierDefinition[];
  placements: TierPlacements;
  notes: Record<string, string>;
  meta: TierListBuilderMetaState;
}

export type TierListBuilderAction =
  | { type: 'LOAD_TIER_LIST'; payload: TierListBuilderState }
  | { type: 'UPDATE_META'; patch: Partial<TierListBuilderMetaState> }
  | { type: 'SET_ENTITY_TYPE'; entityType: TierListEntityType }
  | { type: 'SET_PLACEMENTS'; payload: TierPlacements }
  | { type: 'SET_CHARACTER_NOTE'; characterKey: string; note?: string }
  | { type: 'SET_TIER_NOTE'; tierName: string; note: string }
  | { type: 'ADD_TIER'; name: string; note?: string }
  | { type: 'DELETE_TIER'; tierName: string }
  | { type: 'MOVE_TIER'; fromIndex: number; toIndex: number }
  | { type: 'RESET' };

export function createTierPlacements(
  tierDefs: TierDefinition[],
): TierPlacements {
  return Object.fromEntries(tierDefs.map((tierDef) => [tierDef.name, []]));
}

export function createDefaultTierDefs(): TierDefinition[] {
  return DEFAULT_TIER_DEFINITIONS.map((tierDef) => ({ ...tierDef }));
}

export function createEmptyTierListBuilderState(): TierListBuilderState {
  const tierDefs = createDefaultTierDefs();
  return {
    tierDefs,
    placements: createTierPlacements(tierDefs),
    notes: {},
    meta: {
      name: '',
      categoryName: DEFAULT_CONTENT_TYPE,
      description: '',
      entityType: 'character',
    },
  };
}

export function removeEntityNote(
  notes: Record<string, string>,
  entityKey: string,
): Record<string, string> {
  if (!(entityKey in notes)) return notes;
  const nextNotes = { ...notes };
  delete nextNotes[entityKey];
  return nextNotes;
}

export function tierListBuilderReducer(
  state: TierListBuilderState,
  action: TierListBuilderAction,
): TierListBuilderState {
  switch (action.type) {
    case 'LOAD_TIER_LIST':
      return action.payload;
    case 'UPDATE_META':
      return { ...state, meta: { ...state.meta, ...action.patch } };
    case 'SET_ENTITY_TYPE':
      return {
        ...createEmptyTierListBuilderState(),
        meta: { ...state.meta, entityType: action.entityType },
      };
    case 'SET_PLACEMENTS':
      return { ...state, placements: action.payload };
    case 'SET_CHARACTER_NOTE': {
      const notes = { ...state.notes };
      if (action.note) {
        notes[action.characterKey] = action.note;
      } else {
        delete notes[action.characterKey];
      }
      return { ...state, notes };
    }
    case 'SET_TIER_NOTE':
      return {
        ...state,
        tierDefs: state.tierDefs.map((tierDef) =>
          tierDef.name === action.tierName
            ? { ...tierDef, note: action.note }
            : tierDef,
        ),
      };
    case 'ADD_TIER': {
      if (!action.name.trim()) return state;
      if (state.tierDefs.some((tierDef) => tierDef.name === action.name)) {
        return state;
      }
      return {
        ...state,
        tierDefs: [...state.tierDefs, { name: action.name, note: action.note }],
        placements: { ...state.placements, [action.name]: [] },
      };
    }
    case 'DELETE_TIER': {
      const removedEntities = state.placements[action.tierName] || [];
      const placements = { ...state.placements };
      delete placements[action.tierName];

      let notes = state.notes;
      for (const entityKey of removedEntities) {
        notes = removeEntityNote(notes, entityKey);
      }

      return {
        ...state,
        tierDefs: state.tierDefs.filter(
          (tierDef) => tierDef.name !== action.tierName,
        ),
        placements,
        notes,
      };
    }
    case 'MOVE_TIER': {
      if (
        action.fromIndex < 0 ||
        action.fromIndex >= state.tierDefs.length ||
        action.toIndex < 0 ||
        action.toIndex >= state.tierDefs.length
      ) {
        return state;
      }
      const tierDefs = [...state.tierDefs];
      const [movedTier] = tierDefs.splice(action.fromIndex, 1);
      tierDefs.splice(action.toIndex, 0, movedTier);
      return { ...state, tierDefs };
    }
    case 'RESET': {
      const emptyState = createEmptyTierListBuilderState();
      return {
        ...emptyState,
        meta: { ...emptyState.meta, entityType: state.meta.entityType },
      };
    }
    default:
      return state;
  }
}
