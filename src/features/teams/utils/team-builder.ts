import { normalizeContentType } from '../../../constants/content-types.ts';
import type { CharacterClass } from '@/features/characters/types';
import { FACTION_NAME_TO_SLUG, FACTION_SLUGS } from '../../../types/faction.ts';
import type { FactionName, FactionSlug } from '@/types/faction';
import { toEntitySlug } from '../../../utils/entity-slug.ts';
import type { Team, TeamBenchMember, TeamMember } from '@/features/teams/types';
import { normalizeOptionalNote } from '../../../utils/normalize-note.ts';
import { toQuality } from '../../../utils/quality.ts';
import { isRecord } from '../../../utils/type-guards.ts';
import { resolvePastedPatch } from '../../../utils/pasted-json.ts';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  normalizeTeamBenchEntry,
} from './team-bench.ts';

interface LegacyTeamMember {
  character_slug?: string;
  character_name?: string;
  character_quality?: TeamMember['character_quality'];
  overdrive_order?: number | null;
  note?: string;
  position?: TeamMember['position'];
}

type TeamPatch = Partial<Omit<Team, 'members' | 'bench'>> & {
  members?: LegacyTeamMember[];
  bench?: unknown[];
};

export {
  GRID_SIZE,
  MAX_ROSTER_SIZE,
  ROW_COLORS,
  ROW_LABELS,
  ROW_STRIP_LABELS,
} from '../team-builder-constants.ts';
export const ROW_CLASS_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

export function getValidRows(charClass: CharacterClass): number[] {
  switch (charClass) {
    case 'guardian':
      return [0];
    case 'warrior':
      return [0, 1];
    case 'assassin':
      return [0, 1, 2];
    case 'priest':
      return [1, 2];
    case 'mage':
      return [1, 2];
    case 'archer':
      return [1, 2];
    default:
      return [0, 1, 2];
  }
}

export function isTeamMemberLike(value: unknown): value is LegacyTeamMember {
  if (!isRecord(value)) {
    return false;
  }

  const hasSlug = typeof value.character_slug === 'string';
  const hasLegacyName = typeof value.character_name === 'string';
  if (!hasSlug && !hasLegacyName) {
    return false;
  }

  if (
    value.character_quality === undefined ||
    value.character_quality === null
  ) {
    return true;
  }

  return toQuality(value.character_quality) !== undefined;
}

function teamMemberIdentity(member: {
  character_slug: string;
  character_quality?: string | null;
}): string {
  return `${member.character_slug}__${member.character_quality ?? ''}`.toLowerCase();
}

export function getPastedTeamPatch(value: unknown): TeamPatch | null {
  // normalizeTeamFromPartial re-validates every field, so this cast is safe.
  return resolvePastedPatch(
    value,
    isTeamMemberLike,
    'members',
  ) as TeamPatch | null;
}

export function normalizeTeamFromPartial(
  partial: TeamPatch,
  fallback: Team,
): Team {
  const normalizedMembers = Array.isArray(partial.members)
    ? (() => {
        const seen = new Set<string>();
        const members: TeamMember[] = [];
        for (const member of partial.members) {
          if (!isRecord(member)) continue;
          // Support both new slug format and legacy character_name format
          const slug =
            typeof member.character_slug === 'string'
              ? member.character_slug
              : typeof member.character_name === 'string'
                ? toEntitySlug(member.character_name as string)
                : null;
          if (!slug) continue;

          const normalizedQuality = toQuality(member.character_quality);
          const identity = `${slug}__${normalizedQuality ?? ''}`.toLowerCase();
          if (seen.has(identity)) continue;
          seen.add(identity);

          const position = member.position;
          const hasValidPosition =
            isRecord(position) &&
            typeof position.row === 'number' &&
            typeof position.col === 'number';
          const normalizedPosition = hasValidPosition
            ? { row: position.row as number, col: position.col as number }
            : null;
          const normalizedMemberNote = normalizeOptionalNote(member.note);

          members.push({
            character_slug: slug,
            ...(normalizedQuality
              ? { character_quality: normalizedQuality }
              : {}),
            overdrive_order:
              typeof member.overdrive_order === 'number'
                ? member.overdrive_order
                : null,
            ...(normalizedMemberNote ? { note: normalizedMemberNote } : {}),
            ...(normalizedPosition ? { position: normalizedPosition } : {}),
          });
        }
        return members;
      })()
    : fallback.members;

  const normalizedMemberIdentitySet = new Set(
    normalizedMembers.map((member) => teamMemberIdentity(member)),
  );

  // Bench entries are name-only in the schema, so collapse identities to names here.
  const normalizedMemberNameSet = new Set(
    [...normalizedMemberIdentitySet].map(
      (identity) => identity.split('__', 1)[0],
    ),
  );

  const normalizedBench = Array.isArray(partial.bench)
    ? (() => {
        const seen = new Set<string>();
        const bench: TeamBenchMember[] = [];
        for (const rawBenchEntry of partial.bench) {
          const benchEntry = normalizeTeamBenchEntry(rawBenchEntry);
          if (!benchEntry) continue;
          const benchName = getTeamBenchEntryName(benchEntry);
          if (normalizedMemberNameSet.has(benchName)) continue;
          if (seen.has(benchName)) continue;
          seen.add(benchName);
          const normalizedBenchNote = getTeamBenchEntryNote(benchEntry);
          bench.push({
            ...benchEntry,
            ...(normalizedBenchNote ? { note: normalizedBenchNote } : {}),
          });
        }
        return bench;
      })()
    : fallback.bench;

  const normalizedWyrmspells = isRecord(partial.wyrmspells)
    ? {
        ...(typeof partial.wyrmspells.breach === 'string'
          ? { breach: toEntitySlug(partial.wyrmspells.breach) }
          : {}),
        ...(typeof partial.wyrmspells.refuge === 'string'
          ? { refuge: toEntitySlug(partial.wyrmspells.refuge) }
          : {}),
        ...(typeof partial.wyrmspells.wildcry === 'string'
          ? { wildcry: toEntitySlug(partial.wyrmspells.wildcry) }
          : {}),
        ...(typeof partial.wyrmspells.dragons_call === 'string'
          ? { dragons_call: toEntitySlug(partial.wyrmspells.dragons_call) }
          : {}),
      }
    : fallback.wyrmspells;

  return {
    ...fallback,
    ...(typeof partial.name === 'string' ? { name: partial.name } : {}),
    ...(typeof partial.author === 'string' ? { author: partial.author } : {}),
    ...(typeof partial.description === 'string'
      ? { description: partial.description }
      : {}),
    content_type: normalizeContentType(
      partial.content_type,
      fallback.content_type,
    ),
    faction: (() => {
      if (typeof partial.faction !== 'string') return fallback.faction;
      if (FACTION_SLUGS.includes(partial.faction as FactionSlug))
        return partial.faction as FactionSlug;
      // Legacy: display name like "Elemental Echo" → "elemental_echo"
      return (
        FACTION_NAME_TO_SLUG[partial.faction as FactionName] ?? fallback.faction
      );
    })(),
    members: normalizedMembers,
    ...(normalizedBench ? { bench: normalizedBench } : {}),
    ...(normalizedWyrmspells ? { wyrmspells: normalizedWyrmspells } : {}),
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}

const TEAM_MIGRATION_FALLBACK: Team = {
  name: '',
  author: '',
  content_type: 'All',
  description: '',
  faction: 'elemental_echo',
  members: [],
  last_updated: 0,
};

/** Migrates a stored team from any legacy format to the current schema. */
export function migrateStoredTeam(partial: Partial<Team>): Team {
  return normalizeTeamFromPartial(partial, TEAM_MIGRATION_FALLBACK);
}
