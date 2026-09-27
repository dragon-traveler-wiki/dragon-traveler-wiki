import type { Character } from '@/features/characters/types';
import { applyDir } from '@/hooks/use-sort';
import type { Quality } from '@/types/quality';
import { compareQualityThenName } from '@/utils/quality';
import type { NoblePhantasm } from './types';

export type CharacterLinkFilter = 'valid' | 'invalid';

export interface NoblePhantasmFilters {
  search: string;
  qualities: Quality[];
  characterLinks: CharacterLinkFilter[];
}

export const EMPTY_NOBLE_PHANTASM_FILTERS: NoblePhantasmFilters = {
  search: '',
  qualities: [],
  characterLinks: [],
};

export function hasValidCharacterLink(
  noblePhantasm: NoblePhantasm,
  characterBySlug: ReadonlyMap<string, Character>,
): boolean {
  return Boolean(
    noblePhantasm.character_slug &&
    characterBySlug.has(noblePhantasm.character_slug),
  );
}

export function matchesNoblePhantasmFilters(
  noblePhantasm: NoblePhantasm,
  filters: NoblePhantasmFilters,
  characterBySlug: ReadonlyMap<string, Character>,
): boolean {
  if (
    filters.qualities.length > 0 &&
    !filters.qualities.includes(noblePhantasm.quality)
  ) {
    return false;
  }

  if (filters.characterLinks.length > 0) {
    const linkState = hasValidCharacterLink(noblePhantasm, characterBySlug)
      ? 'valid'
      : 'invalid';
    if (!filters.characterLinks.includes(linkState)) return false;
  }

  if (!filters.search.trim()) return true;
  const query = filters.search.toLowerCase();
  const characterName =
    characterBySlug.get(noblePhantasm.character_slug ?? '')?.name ?? '';
  return (
    noblePhantasm.name.toLowerCase().includes(query) ||
    characterName.toLowerCase().includes(query)
  );
}

export function compareNoblePhantasms(
  left: NoblePhantasm,
  right: NoblePhantasm,
  column: string | null,
  direction: 'asc' | 'desc',
  characterNames: ReadonlyMap<string, string>,
): number {
  const leftCharacterName = characterNames.get(left.character_slug ?? '') ?? '';
  const rightCharacterName =
    characterNames.get(right.character_slug ?? '') ?? '';

  let comparison = 0;
  if (column === 'name') comparison = left.name.localeCompare(right.name);
  else if (column === 'character') {
    if (!leftCharacterName && rightCharacterName) comparison = 1;
    else if (leftCharacterName && !rightCharacterName) comparison = -1;
    else comparison = leftCharacterName.localeCompare(rightCharacterName);
  } else if (column === 'rarity') {
    comparison = compareQualityThenName(
      left.quality,
      right.quality,
      left.name,
      right.name,
    );
  } else if (column === 'effects') {
    comparison = right.effects.length - left.effects.length;
  } else if (column === 'skills') {
    comparison = right.skills.length - left.skills.length;
  }

  if (comparison) return applyDir(comparison, direction);
  return (
    leftCharacterName.localeCompare(rightCharacterName) ||
    left.name.localeCompare(right.name)
  );
}
