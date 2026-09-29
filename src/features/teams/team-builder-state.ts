import {
  DEFAULT_CONTENT_TYPE,
  type ContentType,
} from '../../constants/content-types.ts';
import { GRID_SIZE } from './team-builder-constants.ts';
import type { TeamWyrmspells } from './types';
import type { FactionSlug } from '@/types/faction';

export interface TeamBuilderMetaState {
  name: string;
  contentType: ContentType;
  description: string;
  faction: FactionSlug | null;
}

export interface TeamBuilderState {
  slots: Array<string | null>;
  overdriveEnabled: boolean;
  overdriveSequence: number[];
  bench: string[];
  benchNotes: Record<string, string>;
  slotNotes: string[];
  teamWyrmspells: TeamWyrmspells;
  meta: TeamBuilderMetaState;
}

export type TeamBuilderAction =
  | { type: 'LOAD_TEAM'; payload: TeamBuilderState }
  | { type: 'SET_SLOT'; slotIndex: number; characterKey: string | null }
  | { type: 'SET_BENCH'; bench: string[]; benchNotes?: Record<string, string> }
  | { type: 'UPDATE_META'; patch: Partial<TeamBuilderMetaState> }
  | { type: 'SET_OVERDRIVE_ENABLED'; enabled: boolean }
  | { type: 'SET_OVERDRIVE_SEQUENCE'; payload: number[] }
  | { type: 'SET_SLOT_NOTE'; slotIndex: number; note: string }
  | { type: 'SET_SLOT_NOTES'; payload: string[] }
  | { type: 'SET_BENCH_NOTE'; characterKey: string; note?: string }
  | { type: 'SET_WYRMSPELL'; key: keyof TeamWyrmspells; value?: string }
  | { type: 'RESET' };

export function createEmptyTeamBuilderState(): TeamBuilderState {
  return {
    slots: Array<string | null>(GRID_SIZE).fill(null),
    overdriveEnabled: false,
    overdriveSequence: [],
    bench: [],
    benchNotes: {},
    slotNotes: Array<string>(GRID_SIZE).fill(''),
    teamWyrmspells: {},
    meta: {
      name: '',
      contentType: DEFAULT_CONTENT_TYPE,
      description: '',
      faction: null,
    },
  };
}

export function teamBuilderReducer(
  state: TeamBuilderState,
  action: TeamBuilderAction,
): TeamBuilderState {
  switch (action.type) {
    case 'LOAD_TEAM':
      return action.payload;
    case 'SET_SLOT': {
      const slots = [...state.slots];
      slots[action.slotIndex] = action.characterKey;
      return { ...state, slots };
    }
    case 'SET_BENCH':
      return {
        ...state,
        bench: action.bench,
        ...(action.benchNotes ? { benchNotes: action.benchNotes } : {}),
      };
    case 'UPDATE_META':
      return { ...state, meta: { ...state.meta, ...action.patch } };
    case 'SET_OVERDRIVE_ENABLED':
      return { ...state, overdriveEnabled: action.enabled };
    case 'SET_OVERDRIVE_SEQUENCE':
      return { ...state, overdriveSequence: action.payload };
    case 'SET_SLOT_NOTE': {
      const slotNotes = [...state.slotNotes];
      slotNotes[action.slotIndex] = action.note;
      return { ...state, slotNotes };
    }
    case 'SET_SLOT_NOTES':
      return { ...state, slotNotes: action.payload };
    case 'SET_BENCH_NOTE': {
      const benchNotes = { ...state.benchNotes };
      if (action.note) {
        benchNotes[action.characterKey] = action.note;
      } else {
        delete benchNotes[action.characterKey];
      }
      return { ...state, benchNotes };
    }
    case 'SET_WYRMSPELL': {
      const teamWyrmspells = { ...state.teamWyrmspells };
      if (action.value) {
        teamWyrmspells[action.key] = action.value;
      } else {
        delete teamWyrmspells[action.key];
      }
      return { ...state, teamWyrmspells };
    }
    case 'RESET':
      return createEmptyTeamBuilderState();
    default:
      return state;
  }
}
