import type {
  Character,
  CharacterAttackRange,
  CharacterAttackType,
  CharacterClass,
} from '@/features/characters/types';
import type { FactionSlug } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { getCharacterIdentityKey } from './utils/character-route.ts';
import { parseEffectRefs } from '../../utils/parse-effect-refs.ts';
import { compareQualityThenName } from '../../utils/quality.ts';

export interface CharacterFilters {
  search: string;
  qualities: Quality[];
  classes: CharacterClass[];
  factions: FactionSlug[];
  attackRanges: CharacterAttackRange[];
  attackTypes: CharacterAttackType[];
  combatTags: string[];
  tiers: string[];
  statusEffects: string[];
  globalOnly: boolean | null;
  upcomingOnly: boolean;
  ownedOnly: boolean;
  minStarLevel: string | null;
  maxStarLevel: string | null;
}

export const EMPTY_CHARACTER_FILTERS: CharacterFilters = {
  search: '',
  qualities: [],
  classes: [],
  factions: [],
  attackRanges: [],
  attackTypes: [],
  combatTags: [],
  tiers: [],
  statusEffects: [],
  globalOnly: null,
  upcomingOnly: false,
  ownedOnly: false,
  minStarLevel: null,
  maxStarLevel: null,
};

/** Apply all active filters to a list of characters. Empty arrays mean no filter. */
export function filterCharacters(
  characters: Character[],
  filters: CharacterFilters,
  tierLookup?: Map<string, string>,
  ownedCharacters?: Record<string, string>,
  starLevelOrder?: string[],
): Character[] {
  const searchLower = filters.search.toLowerCase();
  const now = new Date();
  const currentDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  return characters.filter((c) => {
    if (filters.search && !c.name.toLowerCase().includes(searchLower)) {
      return false;
    }
    if (
      filters.qualities.length > 0 &&
      !filters.qualities.includes(c.quality)
    ) {
      return false;
    }
    if (
      filters.classes.length > 0 &&
      !filters.classes.includes(c.character_class)
    ) {
      return false;
    }
    if (
      filters.factions.length > 0 &&
      !filters.factions.some((slug) => c.factions.includes(slug))
    ) {
      return false;
    }
    if (
      filters.attackRanges.length > 0 &&
      (!c.attack_range || !filters.attackRanges.includes(c.attack_range))
    ) {
      return false;
    }
    if (
      filters.attackTypes.length > 0 &&
      (!c.attack_type || !filters.attackTypes.includes(c.attack_type))
    ) {
      return false;
    }
    if (
      filters.combatTags.length > 0 &&
      !filters.combatTags.some((tag) => c.combat_tags?.includes(tag))
    ) {
      return false;
    }
    if (filters.tiers.length > 0 && tierLookup) {
      const tier =
        tierLookup.get(getCharacterIdentityKey(c)) ??
        tierLookup.get(c.name) ??
        'N/A';
      if (!filters.tiers.includes(tier)) {
        return false;
      }
    }
    if (filters.statusEffects.length > 0) {
      const charEffects = extractCharacterEffectRefs(c);
      if (!filters.statusEffects.some((e) => charEffects.includes(e))) {
        return false;
      }
    }
    if (filters.globalOnly !== null && c.is_global !== filters.globalOnly) {
      return false;
    }
    if (
      filters.upcomingOnly &&
      (!c.release_date || c.release_date < currentDate)
    ) {
      return false;
    }
    const identityKey = getCharacterIdentityKey(c);
    const ownedLevel = ownedCharacters?.[identityKey] ?? null;

    if (filters.ownedOnly && ownedLevel === null) {
      return false;
    }
    if (
      (filters.minStarLevel || filters.maxStarLevel) &&
      starLevelOrder &&
      starLevelOrder.length > 0
    ) {
      if (ownedLevel === null) return false;
      const ownedIndex = starLevelOrder.indexOf(ownedLevel);
      if (filters.minStarLevel) {
        const minIndex = starLevelOrder.indexOf(filters.minStarLevel);
        if (ownedIndex < minIndex) return false;
      }
      if (filters.maxStarLevel) {
        const maxIndex = starLevelOrder.indexOf(filters.maxStarLevel);
        if (ownedIndex > maxIndex) return false;
      }
    }

    return true;
  });
}

// Avoids re-parsing skill descriptions with regex on every filter pass.
const effectRefsCache = new WeakMap<Character, string[]>();

function extractCharacterEffectRefs(character: Character): string[] {
  const cached = effectRefsCache.get(character);
  if (cached) return cached;

  const refs: string[] = [];
  for (const skill of character.skills) {
    refs.push(...parseEffectRefs(skill.description));
  }
  effectRefsCache.set(character, refs);
  return refs;
}

/** Get all unique effect reference names across all characters' skill descriptions. */
export function extractAllEffectRefs(characters: Character[]): string[] {
  const names = new Set<string>();
  for (const c of characters) {
    for (const skill of c.skills) {
      for (const name of parseEffectRefs(skill.description)) {
        names.add(name);
      }
    }
  }
  return [...names].sort();
}

/** Compare two characters by quality, then alphabetically by name. */
export function compareCharactersByQualityThenName(
  a: Character,
  b: Character,
): number {
  return compareQualityThenName(a.quality, b.quality, a.name, b.name);
}

/** Sort characters by quality, then alphabetically by name. */
export function sortCharactersByQuality(characters: Character[]): Character[] {
  return characters.sort(compareCharactersByQualityThenName);
}
