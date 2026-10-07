import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import {
  createQualityFilterGroup,
  orderFilterOptions,
} from '@/components/common/EntityFilterGroups';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import { QUALITY_ORDER } from '@/constants/quality';
import { BREAKPOINTS, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';

import HowlkinsTab from '@/features/wiki/howlkins/components/HowlkinsTab';
import GoldenAlliancesTab from '@/features/wiki/howlkins/components/GoldenAlliancesTab';
import {
  compareHowlkins,
  EMPTY_HOWLKIN_FILTERS,
  matchesHowlkinFilters,
} from '@/features/wiki/howlkins/filters';
import type { GoldenAlliance, Howlkin } from '@/features/wiki/howlkins/types';
import {
  useGoldenAlliances,
  useHowlkins,
} from '@/features/wiki/hooks/use-wiki-data';
import {
  useFilteredPageData,
  useGradientAccent,
  useSearchParamFilter,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';
import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useMemo } from 'react';

// Alliance cards are tall on phones, so start with fewer per page there.
const MOBILE_ALLIANCE_PAGE_SIZE = 10;

export default function Howlkins() {
  const { accent } = useGradientAccent();
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE, undefined, {
    getInitialValueInEffect: false,
  });
  const [activeTab, handleTabChange] = useTabParam('tab', 'howlkins', [
    'howlkins',
    'golden-alliances',
  ]);

  const {
    data: howlkins,
    loading: howlkinsLoading,
    error: howlkinsError,
    retry: retryHowlkins,
  } = useHowlkins();

  const {
    data: goldenAlliances,
    loading: alliancesLoading,
    error: alliancesError,
    retry: retryAlliances,
  } = useGoldenAlliances();

  const howlkinToAlliance = useMemo(() => {
    const map = new Map<string, string>();
    for (const alliance of goldenAlliances) {
      for (const slug of alliance.howlkins) {
        map.set(slug, alliance.slug);
      }
    }
    return map;
  }, [goldenAlliances]);

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
    pageItems: howlkinPageItems,
    filtered,
    page: howlkinPage,
    setPage: setHowlkinPage,
    totalPages: howlkinTotalPages,
    pageSize: howlkinPageSize,
    setPageSize: setHowlkinPageSize,
    pageSizeOptions: howlkinPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(howlkins, {
    emptyFilters: EMPTY_HOWLKIN_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.HOWLKIN_FILTERS,
      viewMode: STORAGE_KEY.HOWLKIN_VIEW_MODE,
      sort: STORAGE_KEY.HOWLKIN_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (howlkin, currentFilters) =>
      matchesHowlkinFilters(howlkin, currentFilters, howlkinToAlliance),
    sortFn: compareHowlkins,
  });
  useSearchParamFilter(setFilters);

  const qualityOptions = useMemo(() => {
    return orderFilterOptions(
      howlkins.flatMap((howlkin) => (howlkin.quality ? [howlkin.quality] : [])),
      QUALITY_ORDER,
    );
  }, [howlkins]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    if (qualityOptions.length === 0) return [];
    return [createQualityFilterGroup({ options: qualityOptions })];
  }, [qualityOptions]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(howlkins),
    [howlkins],
  );

  const mostRecentAllianceUpdate = useMemo(
    () => getLatestTimestamp(goldenAlliances),
    [goldenAlliances],
  );

  const howlkinMap = useMemo(() => {
    const map = new Map<string, Howlkin>();
    for (const h of howlkins) {
      map.set(h.slug, h);
    }
    return map;
  }, [howlkins]);

  const allianceSearchFn = useCallback(
    (alliance: GoldenAlliance, query: string) =>
      alliance.name.toLowerCase().includes(query) ||
      alliance.howlkins.some((slug) =>
        (howlkinMap.get(slug)?.name ?? slug).toLowerCase().includes(query),
      ),
    [howlkinMap],
  );

  const {
    search: allianceSearch,
    setSearch: setAllianceSearch,
    filtered: filteredAlliances,
    pageItems: alliancePageItems,
    page: alliancePage,
    setPage: setAlliancePage,
    totalPages: allianceTotalPages,
    pageSize: alliancePageSize,
    setPageSize: setAlliancePageSize,
    pageSizeOptions: alliancePageSizeOptions,
  } = useSecondaryTabList(goldenAlliances, {
    searchFn: allianceSearchFn,
    storageKeys: { search: STORAGE_KEY.GOLDEN_ALLIANCE_SEARCH },
    pageSize: isMobile ? MOBILE_ALLIANCE_PAGE_SIZE : PAGE_SIZE,
  });

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader
          title="Howlkins"
          timestamp={
            activeTab === 'golden-alliances'
              ? mostRecentAllianceUpdate
              : mostRecentUpdate
          }
        >
          {activeTab === 'golden-alliances' ? (
            <Group gap="xs">
              <ExportButton
                data={goldenAlliances}
                filename="golden-alliances.json"
              />
              <DataCorrectionButton entityType="golden alliance" />
            </Group>
          ) : (
            <Group gap="xs">
              <ExportButton data={howlkins} filename="howlkins.json" />
              <DataCorrectionButton entityType="howlkin" />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="howlkins">Howlkins</Tabs.Tab>
            <Tabs.Tab value="golden-alliances">Golden Alliances</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="howlkins" pt="md">
            <HowlkinsTab
              loading={howlkinsLoading || alliancesLoading}
              error={howlkinsError || alliancesError}
              onRetry={() =>
                retryFailedDataSources(
                  [howlkinsError, retryHowlkins],
                  [alliancesError, retryAlliances],
                )
              }
              howlkins={howlkins}
              filtered={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeFilterCount={activeFilterCount}
              filterOpen={filterOpen}
              onFilterToggle={toggleFilter}
              onResetFilters={resetFilters}
              page={howlkinPage}
              totalPages={howlkinTotalPages}
              onPageChange={setHowlkinPage}
              pageSize={howlkinPageSize}
              pageSizeOptions={howlkinPageSizeOptions}
              onPageSizeChange={setHowlkinPageSize}
              filters={filters}
              onFiltersChange={setFilters}
              filterGroups={filterGroups}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              pageItems={howlkinPageItems}
              howlkinToAlliance={howlkinToAlliance}
            />
          </Tabs.Panel>

          <Tabs.Panel value="golden-alliances" pt="md">
            <GoldenAlliancesTab
              loading={alliancesLoading}
              error={alliancesError}
              onRetry={retryAlliances}
              goldenAlliances={goldenAlliances}
              search={allianceSearch}
              onSearchChange={setAllianceSearch}
              filtered={filteredAlliances}
              page={alliancePage}
              totalPages={allianceTotalPages}
              onPageChange={setAlliancePage}
              pageItems={alliancePageItems}
              pageSize={alliancePageSize}
              pageSizeOptions={alliancePageSizeOptions}
              onPageSizeChange={setAlliancePageSize}
              howlkinMap={howlkinMap}
              accent={accent}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
