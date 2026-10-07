import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useContext, useMemo } from 'react';
import { BREAKPOINTS, STORAGE_KEY } from '@/constants/ui';
import {
  CharacterOwnershipContext,
  TierListReferenceContext,
} from '@/contexts';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterByIdentityMap,
  buildPreferredCharacterByNameMap,
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import type { CharacterFilters } from '@/features/characters/filters';
import {
  getTierListEntityType,
  isCharacterTierEntry,
} from '@/features/tier-list/types';
import {
  compareCharactersByQualityThenName,
  EMPTY_CHARACTER_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
} from '@/features/characters/filters';
import { useStarLevels } from '@/features/wiki/hooks/use-wiki-data';
import { useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import type { StatusEffectType } from '@/features/wiki/status-effects/types';
import { buildStarLevels } from '@/features/wiki/star-levels/star-levels';
import type { ViewMode } from '@/hooks/use-filters';
import { useFilterPanel, useFilters, useViewMode } from '@/hooks/use-filters';
import {
  buildRowAlignedPageSizeOptions,
  getPageSizeStorageKey,
  usePageSize,
  usePagination,
} from '@/hooks/use-pagination';
import { applyDir, useSortState } from '@/hooks/use-sort';

export interface CharacterListData {
  filters: CharacterFilters;
  setFilters: (filters: CharacterFilters) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortCol: string | null;
  sortDir: 'asc' | 'desc';
  handleSort: (key: string) => void;
  effectOptions: {
    label: string;
    value: string;
    slug: string;
    icon?: boolean;
    type?: StatusEffectType;
  }[];
  combatTagOptions: string[];
  tierOptions: string[];
  selectedTierListName: string | null;
  getTierLabel: (char: Character) => string | undefined;
  filteredAndSorted: Character[];
  pageItems: Character[];
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  pageSizeOptions: readonly number[];
  activeFilterCount: number;
  starLevelOptions: { value: string; label: string }[];
}

export function useCharacterListData(
  characters: Character[],
): CharacterListData {
  const { selectedTierList } = useContext(TierListReferenceContext);
  const selectedTierListName = selectedTierList?.name ?? null;
  const { ownedCharacters, showCharacterTiers } = useContext(
    CharacterOwnershipContext,
  );
  const { data: statusEffects } = useStatusEffects();
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(
    () => buildStarLevels(rawStarLevels),
    [rawStarLevels],
  );
  const starLevelOrder = useMemo(
    () => starLevels.map((l) => l.value),
    [starLevels],
  );
  const starLevelOptions = useMemo(
    () => starLevels.map((l) => ({ value: l.value, label: l.label })),
    [starLevels],
  );

  const { filters, setFilters } = useFilters<CharacterFilters>({
    emptyFilters: EMPTY_CHARACTER_FILTERS,
    storageKey: STORAGE_KEY.CHARACTER_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CHARACTER_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.CHARACTER_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  // Mirror CHARACTER_GRID_COLS breakpoints to keep page size = whole rows
  const isMd = useMediaQuery(BREAKPOINTS.MD);
  const isSm = useMediaQuery(BREAKPOINTS.DESKTOP);
  const activeCols = isMd ? 6 : isSm ? 4 : 3;
  const gridPageSizeOptions = useMemo(
    () => buildRowAlignedPageSizeOptions(activeCols, [4, 6, 8, 10]),
    [activeCols],
  );
  const listPageSizeOptions = [10, 20, 30, 50] as const;
  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    viewMode === 'grid' ? gridPageSizeOptions : listPageSizeOptions,
    {
      defaultSize: activeCols * 6,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.CHARACTER_VIEW_MODE),
    },
  );

  const effectOptions = useMemo(() => {
    const referencedEffects = new Set(extractAllEffectRefs(characters));

    return statusEffects
      .filter((effect) => referencedEffects.has(effect.slug))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((effect) => ({
        label: effect.name,
        value: effect.slug,
        slug: effect.slug,
        icon: effect.icon !== false,
        type: effect.type,
      }));
  }, [characters, statusEffects]);

  const combatTagOptions = useMemo(
    () =>
      [
        ...new Set(
          characters.flatMap((character) => character.combat_tags ?? []),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [characters],
  );

  const preferredCharacterByName = useMemo(
    () => buildPreferredCharacterByNameMap(characters),
    [characters],
  );

  const characterByIdentity = useMemo(
    () => buildCharacterByIdentityMap(characters),
    [characters],
  );

  const tierOptions = useMemo(() => {
    const list = selectedTierList;
    if (!list) return [];
    const seen = new Set<string>();
    const tiers: string[] = [];
    for (const t of list.tiers ?? []) {
      if (!seen.has(t.name)) {
        seen.add(t.name);
        tiers.push(t.name);
      }
    }
    for (const e of list.entries) {
      if (!seen.has(e.tier)) {
        seen.add(e.tier);
        tiers.push(e.tier);
      }
    }
    tiers.push('N/A');
    return tiers;
  }, [selectedTierList]);

  const tierRank = useMemo(() => {
    const rank = new Map<string, number>();
    tierOptions.forEach((tier, index) => rank.set(tier, index));
    return rank;
  }, [tierOptions]);

  const tierLookup = useMemo(() => {
    const map = new Map<string, string>();
    const list = selectedTierList;
    if (!list || getTierListEntityType(list) !== 'character') return map;
    for (const entry of list.entries) {
      if (!isCharacterTierEntry(entry)) continue;
      const resolved = resolveCharacterByNameAndQuality(
        entry.character_slug,
        entry.character_quality,
        preferredCharacterByName,
        characterByIdentity,
      );
      if (resolved) {
        map.set(getCharacterIdentityKey(resolved), entry.tier);
      }
    }
    return map;
  }, [selectedTierList, preferredCharacterByName, characterByIdentity]);

  const getTierLabel = useCallback(
    (character: Character) => {
      if (!showCharacterTiers || !selectedTierListName) return undefined;
      return (
        tierLookup.get(getCharacterIdentityKey(character)) ??
        tierLookup.get(character.name) ??
        'N/A'
      );
    },
    [showCharacterTiers, selectedTierListName, tierLookup],
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined,
      ownedCharacters,
      starLevelOrder,
    );
    return [...filtered].sort((a, b) => {
      if (sortCol) {
        let cmp = 0;
        if (sortCol === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortCol === 'quality') {
          cmp = compareCharactersByQualityThenName(a, b);
        } else if (sortCol === 'factions') {
          cmp = (a.factions[0] ?? '').localeCompare(b.factions[0] ?? '');
        } else if (sortCol === 'global') {
          cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
        } else if (sortCol === 'tier') {
          const tA = getTierLabel(a) ?? 'N/A';
          const tB = getTierLabel(b) ?? 'N/A';
          const iA = tierRank.get(tA) ?? Number.MAX_SAFE_INTEGER;
          const iB = tierRank.get(tB) ?? Number.MAX_SAFE_INTEGER;
          cmp = iA - iB;
        }
        if (cmp !== 0) return applyDir(cmp, sortDir);
      }
      return compareCharactersByQualityThenName(a, b);
    });
  }, [
    characters,
    filters,
    sortCol,
    sortDir,
    tierLookup,
    tierRank,
    selectedTierListName,
    getTierLabel,
    ownedCharacters,
    starLevelOrder,
  ]);

  const { page, setPage, totalPages, offset } = usePagination(
    filteredAndSorted.length,
    pageSize,
    JSON.stringify(filters),
  );

  const pageItems = filteredAndSorted.slice(offset, offset + pageSize);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    filters.attackRanges.length +
    filters.attackTypes.length +
    filters.combatTags.length +
    (selectedTierListName ? filters.tiers.length : 0) +
    filters.statusEffects.length +
    (filters.globalOnly !== null ? 1 : 0) +
    (filters.upcomingOnly ? 1 : 0) +
    (filters.ownedOnly ? 1 : 0) +
    (filters.minStarLevel ? 1 : 0) +
    (filters.maxStarLevel ? 1 : 0);

  return {
    filters,
    setFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    effectOptions,
    combatTagOptions,
    tierOptions,
    selectedTierListName,
    getTierLabel,
    filteredAndSorted,
    pageItems,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    activeFilterCount,
    starLevelOptions,
  };
}
