import SafeImage from '@/components/ui/SafeImage';
import { GEAR_TYPE_ICON_MAP } from '@/assets';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import type { Character } from '@/features/characters/types';
import { GEAR_TYPE_ORDER } from '@/constants/gear-colors';
import { IMAGE_SIZE, STORAGE_KEY, PAGE_SIZE } from '@/constants/ui';
import GearTab from '@/features/wiki/gear/components/GearTab';
import GearSetsTab from '@/features/wiki/gear/components/GearSetsTab';
import GearUsageTab from '@/features/wiki/gear/components/GearUsageTab';
import {
  compareGear,
  EMPTY_GEAR_FILTERS,
  matchesGearFilters,
} from '@/features/wiki/gear/filters';
import type { Gear, GearSet, GearType } from '@/features/wiki/gear/types';
import {
  compareEntityUsage,
  DEFAULT_USAGE_QUALITY_FILTER,
  type EntityUsage,
  USAGE_QUALITY_OPTIONS,
} from '@/features/wiki/usage/entity-usage';
import { useEntityUsage } from '@/features/wiki/usage/use-entity-usage';
import {
  useGear,
  useGearSets,
  useStatusEffects,
} from '@/features/wiki/hooks/use-wiki-data';
import {
  useFilterPanel,
  useFilteredPageData,
  useGradientAccent,
  useMobileTooltip,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';

import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useCallback, useMemo } from 'react';

function getGearUsageReferences(character: Character): string[] {
  return (character.recommended_gear ?? []).flatMap((loadout) =>
    Object.values(loadout.slots).flatMap((slug) => (slug ? [slug] : [])),
  );
}

function getCharacterName(character: Character): string {
  return character.name;
}

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...GEAR_TYPE_ORDER],
    icon: (value: string) => {
      const iconSrc = GEAR_TYPE_ICON_MAP[value as GearType];
      if (!iconSrc) return null;
      return (
        <SafeImage
          src={iconSrc}
          alt={value}
          w={IMAGE_SIZE.ICON_SM}
          h={IMAGE_SIZE.ICON_SM}
          fit="contain"
        />
      );
    },
  },
  createQualityFilterGroup(),
];

export default function GearPage() {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const { isOpen: usageFilterOpen, toggle: toggleUsageFilter } =
    useFilterPanel();
  const [activeTab, handleTabChange] = useTabParam('tab', 'gear', [
    'gear',
    'gear-sets',
    'usage',
  ]);

  const { data: gear, loading, error, retry: retryGear } = useGear();
  const {
    data: gearSets,
    loading: gearSetsLoading,
    error: gearSetsError,
    retry: retryGearSets,
  } = useGearSets();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();

  const gearSetBySlug = useMemo(
    () => new Map(gearSets.map((entry) => [entry.slug, entry])),
    [gearSets],
  );

  const {
    filters,
    setFilters,
    resetFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    pageItems: gearPageItems,
    filtered,
    page: gearPage,
    setPage: setGearPage,
    totalPages: gearTotalPages,
    pageSize: gearPageSize,
    setPageSize: setGearPageSize,
    pageSizeOptions: gearPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(gear, {
    emptyFilters: EMPTY_GEAR_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.GEAR_FILTERS,
      viewMode: STORAGE_KEY.GEAR_VIEW_MODE,
      sort: STORAGE_KEY.GEAR_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (item, currentFilters) =>
      matchesGearFilters(item, currentFilters, gearSetBySlug),
    sortFn: (left, right, column, direction) =>
      compareGear(left, right, column, direction, gearSetBySlug),
  });

  const gearItemsBySet = useMemo(() => {
    const map = new Map<string, Gear[]>();
    for (const item of gear) {
      const list = map.get(item.set) ?? []; // item.set is a slug
      list.push(item);
      map.set(item.set, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [gear]);

  const usageSearchFn = useCallback(
    (entry: { item: Gear }, query: string) => {
      const setName = gearSetBySlug.get(entry.item.set)?.name ?? entry.item.set;
      return (
        entry.item.name.toLowerCase().includes(query) ||
        entry.item.set.toLowerCase().includes(query) ||
        setName.toLowerCase().includes(query)
      );
    },
    [gearSetBySlug],
  );

  const usageSortFn = useCallback(
    (
      a: EntityUsage<Gear, Character>,
      b: EntityUsage<Gear, Character>,
      col: string | null,
      dir: 'asc' | 'desc',
    ) =>
      compareEntityUsage(a, b, col, dir, (left, right, column) => {
        if (column === 'type') {
          return (
            GEAR_TYPE_ORDER.indexOf(left.item.type) -
              GEAR_TYPE_ORDER.indexOf(right.item.type) ||
            left.item.name.localeCompare(right.item.name)
          );
        }
        if (column === 'set') {
          return (
            (
              gearSetBySlug.get(left.item.set)?.name ?? left.item.set
            ).localeCompare(
              gearSetBySlug.get(right.item.set)?.name ?? right.item.set,
            ) || left.item.name.localeCompare(right.item.name)
          );
        }
        return null;
      }),
    [gearSetBySlug],
  );

  const {
    search: usageSearch,
    setSearch: setUsageSearch,
    sortCol: usageSortCol,
    sortDir: usageSortDir,
    handleSort: handleUsageSort,
    filtered: filteredGearItemUsage,
    pageItems: usagePageItems,
    page: usagePage,
    setPage: setUsagePage,
    totalPages: usageTotalPages,
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    pageSizeOptions: usagePageSizeOptions,
    eligibleCharacters: usageEligibleCharacters,
    qualityFilter: usageQualityFilter,
    setQualityFilter: setUsageQualityFilter,
    expandedItems: expandedUsageItems,
    toggleExpandedItem: toggleExpandedUsageItem,
  } = useEntityUsage({
    items: gear,
    characters,
    getCharacterReferences: getGearUsageReferences,
    getCharacterGroupKey: getCharacterName,
    searchFn: usageSearchFn,
    sortFn: usageSortFn,
    storageKeys: {
      quality: STORAGE_KEY.GEAR_USAGE_QUALITY_FILTER,
      search: STORAGE_KEY.GEAR_USAGE_SEARCH,
      sort: STORAGE_KEY.GEAR_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
  });

  const usageFilterCount =
    (usageSearch ? 1 : 0) +
    (usageQualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0);

  const resetUsageFilters = () => {
    setUsageSearch('');
    setUsageQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
  };

  const gearSetSearchFn = useCallback((set: GearSet, query: string) => {
    const bonusDesc = set.set_bonus?.description ?? '';
    return (
      set.name.toLowerCase().includes(query) ||
      bonusDesc.toLowerCase().includes(query)
    );
  }, []);

  const gearSetSortFn = useCallback(
    (a: GearSet, b: GearSet) => a.name.localeCompare(b.name),
    [],
  );

  const {
    search: gearSetSearch,
    setSearch: setGearSetSearch,
    filtered: filteredGearSets,
    pageItems: gearSetPageItems,
    page: gearSetPage,
    setPage: setGearSetPage,
    totalPages: gearSetTotalPages,
    pageSize: gearSetPageSize,
    setPageSize: setGearSetPageSize,
    pageSizeOptions: gearSetPageSizeOptions,
  } = useSecondaryTabList(gearSets, {
    searchFn: gearSetSearchFn,
    sortFn: gearSetSortFn,
    storageKeys: { search: STORAGE_KEY.GEAR_SET_SEARCH },
    pageSize: PAGE_SIZE,
  });

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(gear), [gear]);
  const mostRecentSetUpdate = useMemo(
    () => getLatestTimestamp(gearSets),
    [gearSets],
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader
          title="Gear"
          timestamp={
            activeTab === 'gear-sets' ? mostRecentSetUpdate : mostRecentUpdate
          }
        >
          {activeTab === 'gear-sets' ? (
            <Group gap="xs">
              <ExportButton data={gearSets} filename="gear-sets.json" />
              <DataCorrectionButton entityType="gear set" />
            </Group>
          ) : activeTab === 'usage' ? null : (
            <Group gap="xs">
              <ExportButton data={gear} filename="gear.json" />
              <DataCorrectionButton entityType="gear" />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="gear">Gear</Tabs.Tab>
            <Tabs.Tab value="gear-sets">Gear Sets</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gear" pt="md">
            <GearTab
              loading={loading}
              error={error}
              onRetry={retryGear}
              gear={gear}
              filtered={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeFilterCount={activeFilterCount}
              filterOpen={filterOpen}
              onFilterToggle={toggleFilter}
              onResetFilters={resetFilters}
              page={gearPage}
              totalPages={gearTotalPages}
              onPageChange={setGearPage}
              pageSize={gearPageSize}
              pageSizeOptions={gearPageSizeOptions}
              onPageSizeChange={setGearPageSize}
              filters={filters}
              onFiltersChange={setFilters}
              filterGroups={FILTER_GROUPS}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              pageItems={gearPageItems}
              gearSetBySlug={gearSetBySlug}
              accent={accent}
              statusEffects={statusEffects}
            />
          </Tabs.Panel>

          <Tabs.Panel value="gear-sets" pt="md">
            <GearSetsTab
              loading={gearSetsLoading}
              error={gearSetsError}
              onRetry={retryGearSets}
              gearSets={gearSets}
              search={gearSetSearch}
              onSearchChange={setGearSetSearch}
              filtered={filteredGearSets}
              page={gearSetPage}
              totalPages={gearSetTotalPages}
              onPageChange={setGearSetPage}
              pageItems={gearSetPageItems}
              pageSize={gearSetPageSize}
              pageSizeOptions={gearSetPageSizeOptions}
              onPageSizeChange={setGearSetPageSize}
              gearItemsBySet={gearItemsBySet}
              accent={accent}
            />
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <GearUsageTab
              loading={loading || gearSetsLoading || charactersLoading}
              error={error || gearSetsError || charactersError}
              onRetry={() =>
                retryFailedDataSources(
                  [error, retryGear],
                  [gearSetsError, retryGearSets],
                  [charactersError, retryCharacters],
                )
              }
              gearSets={gearSets}
              gearSetBySlug={gearSetBySlug}
              filteredGearItemUsage={filteredGearItemUsage}
              usageEligibleCharacters={usageEligibleCharacters}
              usageFilterCount={usageFilterCount}
              usageFilterOpen={usageFilterOpen}
              onUsageFilterToggle={toggleUsageFilter}
              usageSearch={usageSearch}
              onUsageSearchChange={setUsageSearch}
              onResetUsageFilters={resetUsageFilters}
              usageQualityFilter={usageQualityFilter}
              onUsageQualityFilterChange={setUsageQualityFilter}
              usageQualityOptions={USAGE_QUALITY_OPTIONS}
              usageSortCol={usageSortCol}
              usageSortDir={usageSortDir}
              onUsageSort={handleUsageSort}
              usagePageItems={usagePageItems}
              expandedUsageItems={expandedUsageItems}
              onToggleExpandedUsageItem={toggleExpandedUsageItem}
              usagePage={usagePage}
              usageTotalPages={usageTotalPages}
              onUsagePageChange={setUsagePage}
              usagePageSize={usagePageSize}
              usagePageSizeOptions={usagePageSizeOptions}
              onUsagePageSizeChange={setUsagePageSize}
              accent={accent}
              tooltipProps={tooltipProps}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
