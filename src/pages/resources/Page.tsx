import SafeImage from '@/components/ui/SafeImage';
import {
  Badge,
  Box,
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useContext, useMemo } from 'react';
import { getResourceIcon } from '@/assets';
import {
  EntityFilter,
  FilteredListShell,
  InlineMarkup,
  ListPageHeader,
  ListPageShell,
  QualityIcon,
  SortableTh,
  type ChipFilterGroup,
} from '@/components';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import ExportButton from '@/components/tools/ExportButton';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import {
  RESOURCE_CATEGORY_COLOR,
  RESOURCE_CATEGORY_ORDER,
} from '@/constants/resource-colors';
import { getMinWidthStyle } from '@/constants/styles';
import { StaticSurface } from '@/components/ui/Surface';
import { STORAGE_KEY } from '@/constants/ui';
import { ResourcesContext } from '@/contexts';
import { useFilteredPageData, useSearchParamFilter } from '@/hooks';
import {
  compareResources,
  EMPTY_RESOURCE_FILTERS,
  matchesResourceFilters,
} from '@/features/wiki/resources/filters';
import type { ResourceCategory } from '@/features/wiki/resources/types';
import type { Quality } from '@/types/quality';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import { getLatestTimestamp } from '@/utils';

const FILTER_GROUPS: ChipFilterGroup[] = [
  {
    key: 'categories',
    label: 'Category',
    options: [...RESOURCE_CATEGORY_ORDER],
  },
  createQualityFilterGroup(),
];

export default function Resources() {
  const { resources, loading, error, retry } = useContext(ResourcesContext);
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
    pageItems,
    filtered,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(resources, {
    emptyFilters: EMPTY_RESOURCE_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.RESOURCE_FILTERS,
      viewMode: STORAGE_KEY.RESOURCE_VIEW_MODE,
      sort: STORAGE_KEY.RESOURCE_SORT,
    },
    defaultViewMode: 'list',
    filterFn: matchesResourceFilters,
    sortFn: compareResources,
  });
  useSearchParamFilter(setFilters);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(resources),
    [resources],
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Resources" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            <ExportButton data={resources} filename="resources.json" />
            <DataCorrectionButton entityType="resource" />
          </Group>
        </ListPageHeader>

        <ListPageShell
          loading={loading}
          error={error}
          onRetry={retry}
          errorTitle="Could not load resources"
          hasData={resources.length > 0}
          emptyMessage="No resource data available yet."
          loadingFallback={
            <ViewModeLoading
              viewMode={viewMode}
              listType="table"
              withToolbar
              showPagination
            />
          }
        >
          <FilteredListShell
            count={filtered.length}
            noun="resource"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            onResetFilters={resetFilters}
            filterContent={
              <EntityFilter
                groups={FILTER_GROUPS}
                selected={{
                  categories: filters.categories,
                  qualities: filters.qualities,
                }}
                onChange={(key, values) => {
                  if (key === 'categories') {
                    setFilters({
                      ...filters,
                      categories: values as ResourceCategory[],
                    });
                    return;
                  }
                  setFilters({ ...filters, qualities: values as Quality[] });
                }}
                onClear={resetFilters}
                search={filters.search}
                onSearchChange={(value) =>
                  setFilters({ ...filters, search: value })
                }
                searchPlaceholder="Search by name..."
              />
            }
            emptyMessage="No resources match the current filters."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pageItems.map((resource) => {
                  const iconSrc = getResourceIcon(
                    resource.slug,
                    resource.category,
                  );
                  return (
                    <StaticSurface key={resource.slug} p="sm">
                      <Stack gap="xs">
                        <Group gap="sm" wrap="nowrap">
                          {iconSrc && (
                            <SafeImage
                              src={iconSrc}
                              alt={resource.name}
                              w={28}
                              h={28}
                              fit="contain"
                            />
                          )}
                          <Text fw={600} style={{ flex: 1, minWidth: 0 }}>
                            {resource.name}
                          </Text>
                          {resource.quality && (
                            <Box style={{ flexShrink: 0 }}>
                              <QualityIcon quality={resource.quality} />
                            </Box>
                          )}
                        </Group>
                        <Group gap={4}>
                          <Badge
                            variant="light"
                            color={
                              RESOURCE_CATEGORY_COLOR[resource.category] ??
                              'gray'
                            }
                            size="sm"
                          >
                            {resource.category}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          <InlineMarkup text={resource.description} />
                        </Text>
                      </Stack>
                    </StaticSurface>
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(600)}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Icon</Table.Th>
                      <SortableTh
                        sortKey="name"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTh>
                      <SortableTh
                        sortKey="quality"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Quality
                      </SortableTh>
                      <SortableTh
                        sortKey="category"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Category
                      </SortableTh>
                      <Table.Th>Description</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((resource) => {
                      const iconSrc = getResourceIcon(
                        resource.slug,
                        resource.category,
                      );
                      return (
                        <Table.Tr key={resource.slug}>
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={resource.name}
                                w={32}
                                h={32}
                                fit="contain"
                              />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {resource.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {resource.quality && (
                              <QualityIcon quality={resource.quality} />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              color={
                                RESOURCE_CATEGORY_COLOR[resource.category] ??
                                'gray'
                              }
                              size="sm"
                            >
                              {resource.category}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed" lineClamp={3}>
                              <InlineMarkup text={resource.description} />
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            }
          />
        </ListPageShell>
      </Stack>
    </Container>
  );
}
