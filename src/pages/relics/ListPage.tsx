import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import { RELIC_TYPE_ICON_MAP } from '@/assets';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import SafeImage from '@/components/ui/SafeImage';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import { RELIC_TYPE_ORDER } from '@/constants/relic-colors';
import { IMAGE_SIZE, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import RelicsTab from '@/features/wiki/relics/components/RelicsTab';
import OracleScrollsTab from '@/features/wiki/relics/components/OracleScrollsTab';
import type {
  OracleScrollRef,
  Relic,
  RelicType,
} from '@/features/wiki/relics/types';
import {
  compareRelics,
  EMPTY_RELIC_FILTERS,
  matchesRelicFilters,
} from '@/features/wiki/relics/filters';
import { getRelicTypeOrder } from '@/features/wiki/relics/utils';
import {
  useRelics,
  useStatusEffects,
} from '@/features/wiki/hooks/use-wiki-data';
import {
  useFilteredPageData,
  useGradientAccent,
  useSearchParamFilter,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useCallback, useMemo } from 'react';

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'types',
    label: 'Type',
    options: [...RELIC_TYPE_ORDER],
    icon: (value) => (
      <SafeImage
        src={RELIC_TYPE_ICON_MAP[value as RelicType]}
        alt=""
        w={IMAGE_SIZE.ICON_SM}
        h={IMAGE_SIZE.ICON_SM}
        fit="contain"
      />
    ),
  },
  {
    ...createQualityFilterGroup(),
  },
];

export default function RelicPage() {
  const { accent } = useGradientAccent();
  const [activeTab, handleTabChange] = useTabParam('tab', 'relics', [
    'relics',
    'oracle-scrolls',
  ]);

  const { data: relics, loading, error, retry } = useRelics();
  const { data: statusEffects } = useStatusEffects();
  const oracleScrolls = useMemo(() => {
    const bySlug = new Map<string, OracleScrollRef>();
    for (const relic of relics) {
      if (relic.oracle_scroll) {
        bySlug.set(relic.oracle_scroll.slug, relic.oracle_scroll);
      }
    }
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [relics]);
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
    pageItems: relicPageItems,
    filtered,
    page: relicPage,
    setPage: setRelicPage,
    totalPages: relicTotalPages,
    pageSize: relicPageSize,
    setPageSize: setRelicPageSize,
    pageSizeOptions: relicPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(relics, {
    emptyFilters: EMPTY_RELIC_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.RELIC_FILTERS,
      viewMode: STORAGE_KEY.RELIC_VIEW_MODE,
      sort: STORAGE_KEY.RELIC_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: matchesRelicFilters,
    sortFn: compareRelics,
  });
  useSearchParamFilter(setFilters);

  // Oracle Scrolls tab
  const relicsByOracle = useMemo(() => {
    const map = new Map<string, Relic[]>();
    for (const relic of relics) {
      const slug = relic.oracle_scroll?.slug;
      if (!slug) continue;
      const list = map.get(slug) ?? [];
      list.push(relic);
      map.set(slug, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const typeCmp =
          getRelicTypeOrder(a.type, RELIC_TYPE_ORDER) -
          getRelicTypeOrder(b.type, RELIC_TYPE_ORDER);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [relics]);

  const oracleSearchFn = useCallback(
    (scroll: OracleScrollRef, query: string) => {
      const relicsInScroll = relicsByOracle.get(scroll.slug) ?? [];
      return (
        scroll.name.toLowerCase().includes(query) ||
        relicsInScroll.some((r) => r.name.toLowerCase().includes(query))
      );
    },
    [relicsByOracle],
  );

  const {
    search: oracleSearch,
    setSearch: setOracleSearch,
    filtered: filteredOracleScrolls,
    pageItems: oraclePageItems,
    page: oraclePage,
    setPage: setOraclePage,
    totalPages: oracleTotalPages,
    pageSize: oraclePageSize,
    setPageSize: setOraclePageSize,
    pageSizeOptions: oraclePageSizeOptions,
  } = useSecondaryTabList(oracleScrolls, {
    searchFn: oracleSearchFn,
    storageKeys: { search: STORAGE_KEY.RELIC_ORACLE_SCROLL_SEARCH },
    pageSize: PAGE_SIZE,
  });

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(relics), [relics]);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Relics" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            <ExportButton data={relics} filename="relic.json" />
            <DataCorrectionButton entityType="relic" />
          </Group>
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="relics">Relics</Tabs.Tab>
            <Tabs.Tab value="oracle-scrolls">Oracle Scrolls</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="relics" pt="md">
            <RelicsTab
              loading={loading}
              error={error}
              onRetry={retry}
              relics={relics}
              filtered={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeFilterCount={activeFilterCount}
              filterOpen={filterOpen}
              onFilterToggle={toggleFilter}
              onResetFilters={resetFilters}
              page={relicPage}
              totalPages={relicTotalPages}
              onPageChange={setRelicPage}
              pageSize={relicPageSize}
              pageSizeOptions={relicPageSizeOptions}
              onPageSizeChange={setRelicPageSize}
              filters={filters}
              onFiltersChange={setFilters}
              emptyFilters={EMPTY_RELIC_FILTERS}
              filterGroups={FILTER_GROUPS}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              pageItems={relicPageItems}
              accent={accent}
              statusEffects={statusEffects}
            />
          </Tabs.Panel>

          <Tabs.Panel value="oracle-scrolls" pt="md">
            <OracleScrollsTab
              loading={loading}
              error={error}
              onRetry={retry}
              oracleScrolls={oracleScrolls}
              search={oracleSearch}
              onSearchChange={setOracleSearch}
              filtered={filteredOracleScrolls}
              page={oraclePage}
              totalPages={oracleTotalPages}
              onPageChange={setOraclePage}
              pageItems={oraclePageItems}
              pageSize={oraclePageSize}
              pageSizeOptions={oraclePageSizeOptions}
              onPageSizeChange={setOraclePageSize}
              relicsByOracle={relicsByOracle}
              accent={accent}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
