import { Group, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BREAKPOINTS } from '@/constants/ui';
import { TierListReferenceContext } from '@/contexts';
import type { PoolLayout } from '@/hooks';
import {
  buildRowAlignedPageSizeOptions,
  usePageSize,
  usePagination,
} from '@/hooks/use-pagination';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import PoolLayoutToggle from '@/components/common/PoolLayoutToggle';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterByIdentityMap,
  buildPreferredCharacterByNameMap,
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import type { CharacterFilters } from '@/features/characters/filters';
import {
  EMPTY_CHARACTER_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
  sortCharactersByQuality,
} from '@/features/characters/filters';
import PaginationControl from '@/components/ui/PaginationControl';
import CharacterFilter from '@/features/characters/components/CharacterFilter';
import { useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  getTierListEntityType,
  isCharacterTierEntry,
} from '@/features/tier-list/types';

const ROWS_PER_PAGE = 6;

/** Column count for the pool grid when it's rendered as a side-by-side column. */
const SIDE_LAYOUT_COLS = 5;

interface FilterableCharacterPoolProps {
  characters: Character[];
  layout?: PoolLayout;
  onLayoutChange?: (layout: PoolLayout) => void;
  canToggleLayout?: boolean;
  children: (
    filtered: Character[],
    filterHeader: React.ReactNode,
    paginationControl: React.ReactNode,
    cols: number,
  ) => React.ReactNode;
}

export default function FilterableCharacterPool({
  characters,
  layout = 'below',
  onLayoutChange,
  canToggleLayout = false,
  children,
}: FilterableCharacterPoolProps) {
  const { selectedTierList } = useContext(TierListReferenceContext);
  const selectedTierListName = selectedTierList?.name ?? null;
  const { data: statusEffects } = useStatusEffects();
  const [filters, setFilters] = useState<CharacterFilters>(
    EMPTY_CHARACTER_FILTERS,
  );
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

  // Mirror the SimpleGrid breakpoints: base: 2, xs: 3, sm: 4, md: 6
  const isMd = useMediaQuery(BREAKPOINTS.MD);
  const isSm = useMediaQuery(BREAKPOINTS.DESKTOP);
  const isXs = useMediaQuery(BREAKPOINTS.XS);
  // The side column has a fixed width regardless of viewport, so it uses a
  // fixed column count instead of the viewport-driven breakpoints below.
  const cols =
    layout === 'side' ? SIDE_LAYOUT_COLS : isMd ? 6 : isSm ? 4 : isXs ? 3 : 2;
  const pageSizeOptions = useMemo(
    () => buildRowAlignedPageSizeOptions(cols, [4, 6, 8, 10]),
    [cols],
  );
  const { pageSize, setPageSize } = usePageSize(pageSizeOptions, {
    defaultSize: cols * ROWS_PER_PAGE,
  });

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
    if (tiers.length === 0) {
      for (const e of list.entries) {
        if (!seen.has(e.tier)) {
          seen.add(e.tier);
          tiers.push(e.tier);
        }
      }
    }
    tiers.push('N/A');
    return tiers;
  }, [selectedTierList]);

  // Clear tier filters that no longer exist in the newly selected tier list
  useEffect(() => {
    if (filters.tiers.length === 0) return;
    const valid = new Set(tierOptions);
    const next = filters.tiers.filter((t) => valid.has(t));
    if (next.length !== filters.tiers.length) {
      queueMicrotask(() => {
        setFilters((f) => ({ ...f, tiers: next }));
      });
    }
  }, [tierOptions, filters.tiers]);

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

  const filtered = useMemo(() => {
    const filteredChars = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined,
    );
    return sortCharactersByQuality(filteredChars);
  }, [characters, filters, tierLookup, selectedTierListName]);

  const filterKey = useMemo(
    () => JSON.stringify({ filters, selectedTierListName }),
    [filters, selectedTierListName],
  );
  const {
    page: safePage,
    setPage,
    totalPages,
    offset,
  } = usePagination(filtered.length, pageSize, filterKey);

  const paginated = filtered.slice(offset, offset + pageSize);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    (selectedTierListName ? filters.tiers.length : 0) +
    filters.statusEffects.length +
    (filters.globalOnly !== null ? 1 : 0) +
    (filters.upcomingOnly ? 1 : 0);

  const filterHeader = (
    <Group justify="space-between" align="center" wrap="wrap">
      <Text size="sm" c="dimmed">
        {filtered.length} available character
        {filtered.length !== 1 ? 's' : ''}
      </Text>
      <Group gap="xs" wrap="nowrap">
        {canToggleLayout && onLayoutChange && (
          <PoolLayoutToggle layout={layout} onChange={onLayoutChange} />
        )}
        <FilterPopoverButton
          filterCount={activeFilterCount}
          filterOpen={filterOpen}
          onFilterToggle={toggleFilter}
        >
          <CharacterFilter
            filters={filters}
            onChange={setFilters}
            effectOptions={effectOptions}
            showTierFilter={Boolean(selectedTierListName)}
            tierOptions={tierOptions}
          />
        </FilterPopoverButton>
      </Group>
    </Group>
  );

  const paginationControl = (
    <PaginationControl
      currentPage={safePage}
      totalPages={totalPages}
      onChange={setPage}
      totalItems={filtered.length}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={setPageSize}
    />
  );

  return <>{children(paginated, filterHeader, paginationControl, cols)}</>;
}
