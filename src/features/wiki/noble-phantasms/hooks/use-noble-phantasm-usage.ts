import { useCallback, useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import {
  compareEntityUsage,
  DEFAULT_USAGE_QUALITY_FILTER,
  type EntityUsage,
} from '@/features/wiki/usage/entity-usage';
import { useEntityUsage } from '@/features/wiki/usage/use-entity-usage';
import { useFilterPanel } from '@/hooks';
import { readStoredJson, writeStoredJson } from '@/utils';
import { compareQualityThenName } from '@/utils/quality';

function getUsageReferences(character: Character): string[] {
  return character.recommended_noble_phantasm ?? [];
}

function getItemReferences(item: NoblePhantasm): string[] {
  return item.legacy_slug ? [item.slug, item.legacy_slug] : [item.slug];
}

export function useNoblePhantasmUsage(
  noblePhantasms: NoblePhantasm[],
  characters: Character[],
  characterByIdentity: Map<string, Character>,
  characterNames: Map<string, string>,
) {
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [linkedCharacterSlugs, setLinkedCharacterSlugs] = useState<string[]>(
    () =>
      readStoredJson(
        STORAGE_KEY.NOBLE_PHANTASM_USAGE_CHARACTERS,
        [],
        (value): value is string[] =>
          Array.isArray(value) &&
          value.every((item) => typeof item === 'string'),
      ),
  );

  useEffect(() => {
    writeStoredJson(
      STORAGE_KEY.NOBLE_PHANTASM_USAGE_CHARACTERS,
      linkedCharacterSlugs,
    );
  }, [linkedCharacterSlugs]);

  const linkedCharacterOptions = useMemo(() => {
    const linkedCharacters = [
      ...new Map(
        noblePhantasms.flatMap((item) => {
          if (!item.character_slug) return [];
          const character = characterByIdentity.get(item.character_slug);
          return character ? [[item.character_slug, character] as const] : [];
        }),
      ).entries(),
    ];
    const nameCounts = new Map<string, number>();
    for (const [, character] of linkedCharacters) {
      nameCounts.set(character.name, (nameCounts.get(character.name) ?? 0) + 1);
    }
    return linkedCharacters
      .map(([slug, character]) => ({
        value: slug,
        label:
          (nameCounts.get(character.name) ?? 1) > 1
            ? `${character.name} (${character.quality})`
            : character.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [characterByIdentity, noblePhantasms]);

  const searchFn = useCallback(
    (entry: EntityUsage<NoblePhantasm, Character>, query: string) =>
      entry.item.name.toLowerCase().includes(query) ||
      (characterNames.get(entry.item.character_slug ?? '') ?? '')
        .toLowerCase()
        .includes(query),
    [characterNames],
  );
  const filterFn = useCallback(
    ({ item }: EntityUsage<NoblePhantasm, Character>) =>
      linkedCharacterSlugs.length === 0 ||
      Boolean(
        item.character_slug &&
        linkedCharacterSlugs.includes(item.character_slug),
      ),
    [linkedCharacterSlugs],
  );
  const sortFn = useCallback(
    (
      a: EntityUsage<NoblePhantasm, Character>,
      b: EntityUsage<NoblePhantasm, Character>,
      column: string | null,
      direction: 'asc' | 'desc',
    ) =>
      compareEntityUsage(
        a,
        b,
        column,
        direction,
        (left, right, customColumn) => {
          if (customColumn === 'rarity') {
            return compareQualityThenName(
              left.item.quality,
              right.item.quality,
              left.item.name,
              right.item.name,
            );
          }
          if (customColumn === 'character') {
            return (
              (
                characterNames.get(left.item.character_slug ?? '') ?? ''
              ).localeCompare(
                characterNames.get(right.item.character_slug ?? '') ?? '',
              ) || left.item.name.localeCompare(right.item.name)
            );
          }
          return null;
        },
      ),
    [characterNames],
  );
  const usage = useEntityUsage({
    items: noblePhantasms,
    characters,
    getCharacterReferences: getUsageReferences,
    getItemReferences,
    searchFn,
    sortFn,
    filterFn,
    storageKeys: {
      quality: STORAGE_KEY.NOBLE_PHANTASM_USAGE_QUALITY_FILTER,
      search: STORAGE_KEY.NOBLE_PHANTASM_USAGE_SEARCH,
      sort: STORAGE_KEY.NOBLE_PHANTASM_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
    extraPaginationKey: linkedCharacterSlugs.join(','),
  });
  const filterCount =
    (usage.search ? 1 : 0) +
    (usage.qualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0) +
    linkedCharacterSlugs.length;
  const { setQualityFilter, setSearch } = usage;
  const resetFilters = useCallback(() => {
    setSearch('');
    setQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
    setLinkedCharacterSlugs([]);
  }, [setQualityFilter, setSearch]);

  return {
    ...usage,
    linkedCharacterOptions,
    linkedCharacterSlugs,
    setLinkedCharacterSlugs,
    filterCount,
    filterOpen,
    toggleFilter,
    resetFilters,
  };
}
