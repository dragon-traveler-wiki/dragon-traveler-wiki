import { Badge, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { getGearIcon } from '@/assets';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import type { Character } from '@/features/characters/types';
import { getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import SafeImage from '@/components/ui/SafeImage';
import SortableTh from '@/components/ui/SortableTh';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { StaticSurface } from '@/components/ui/Surface';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { GradientPaletteAccents } from '@/contexts';
import type { useMobileTooltip } from '@/hooks';
import type {
  EntityUsage,
  UsageQualityFilter,
} from '@/features/wiki/usage/entity-usage';
import UsageCharacterPortraits from '@/features/wiki/usage/components/UsageCharacterPortraits';
import UsageFilterControls from '@/features/wiki/usage/components/UsageFilterControls';

type GearItemUsage = EntityUsage<Gear, Character>;

interface GearUsageTabProps {
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  gearSets: GearSet[];
  gearSetBySlug: Map<string, GearSet>;
  filteredGearItemUsage: GearItemUsage[];
  usageEligibleCharacters: Character[];
  usageFilterCount: number;
  usageFilterOpen: boolean;
  onUsageFilterToggle: () => void;
  usageSearch: string;
  onUsageSearchChange: (value: string) => void;
  onResetUsageFilters: () => void;
  usageQualityFilter: UsageQualityFilter;
  onUsageQualityFilterChange: (value: UsageQualityFilter) => void;
  usageQualityOptions: { value: UsageQualityFilter; label: string }[];
  usageSortCol: string | null;
  usageSortDir: 'asc' | 'desc';
  onUsageSort: (col: string) => void;
  usagePageItems: GearItemUsage[];
  expandedUsageItems: Set<string>;
  onToggleExpandedUsageItem: (slug: string) => void;
  usagePage: number;
  usageTotalPages: number;
  onUsagePageChange: (page: number) => void;
  usagePageSize: number;
  usagePageSizeOptions: readonly number[];
  onUsagePageSizeChange: (pageSize: number) => void;
  accent: GradientPaletteAccents;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}

export default function GearUsageTab({
  loading,
  error,
  onRetry,
  gearSets,
  gearSetBySlug,
  filteredGearItemUsage,
  usageEligibleCharacters,
  usageFilterCount,
  usageFilterOpen,
  onUsageFilterToggle,
  usageSearch,
  onUsageSearchChange,
  onResetUsageFilters,
  usageQualityFilter,
  onUsageQualityFilterChange,
  usageQualityOptions,
  usageSortCol,
  usageSortDir,
  onUsageSort,
  usagePageItems,
  expandedUsageItems,
  onToggleExpandedUsageItem,
  usagePage,
  usageTotalPages,
  onUsagePageChange,
  usagePageSize,
  usagePageSizeOptions,
  onUsagePageSizeChange,
  accent,
  tooltipProps,
}: GearUsageTabProps) {
  return (
    <ListPageShell
      loading={loading}
      error={error}
      onRetry={onRetry}
      errorTitle="Could not load gear usage"
      hasData={gearSets.length > 0}
      emptyMessage="No gear set data available yet."
      loadingFallback={
        <ViewModeLoading
          viewMode="list"
          listType="table"
          withToolbar
          showPagination
        />
      }
    >
      <StaticSurface p="md" data-no-hover>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="sm" c="dimmed">
              {filteredGearItemUsage.length} gear item
              {filteredGearItemUsage.length !== 1 ? 's' : ''} · based on{' '}
              {usageEligibleCharacters.length} character
              {usageEligibleCharacters.length === 1 ? '' : 's'}
            </Text>
            <FilterPopoverButton
              filterCount={usageFilterCount}
              filterOpen={usageFilterOpen}
              onFilterToggle={onUsageFilterToggle}
            >
              <UsageFilterControls
                search={usageSearch}
                onSearchChange={onUsageSearchChange}
                searchPlaceholder="Search by gear or set..."
                filterCount={usageFilterCount}
                onReset={onResetUsageFilters}
                qualityFilter={usageQualityFilter}
                onQualityFilterChange={onUsageQualityFilterChange}
                qualityOptions={usageQualityOptions}
                accent={accent}
              />
            </FilterPopoverButton>
          </Group>

          {filteredGearItemUsage.length === 0 ? (
            <NoResultsSuggestions
              title="No gear found"
              message="No gear matches the current filters."
              onReset={onResetUsageFilters}
              onOpenFilters={onUsageFilterToggle}
            />
          ) : (
            <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
              <Table striped highlightOnHover style={getMinWidthStyle(800)}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Icon</Table.Th>
                    <SortableTh
                      sortKey="name"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Name
                    </SortableTh>
                    <SortableTh
                      sortKey="type"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Type
                    </SortableTh>
                    <SortableTh
                      sortKey="set"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Set
                    </SortableTh>
                    <SortableTh
                      sortKey="count"
                      sortCol={usageSortCol}
                      sortDir={usageSortDir}
                      onSort={onUsageSort}
                    >
                      Characters
                    </SortableTh>
                    <Table.Th>Used By</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {usagePageItems.map(
                    ({
                      item,
                      characters: usingCharacters,
                      count,
                      percentage,
                    }) => {
                      const iconSrc = getGearIcon(item.type, item.slug);
                      const setName =
                        gearSetBySlug.get(item.set)?.name ?? item.set;
                      return (
                        <Table.Tr key={item.slug}>
                          <Table.Td>
                            {iconSrc && (
                              <SafeImage
                                src={iconSrc}
                                alt={item.name}
                                w={IMAGE_SIZE.PORTRAIT_SM}
                                h={IMAGE_SIZE.PORTRAIT_SM}
                                fit="contain"
                                loading="lazy"
                              />
                            )}
                          </Table.Td>
                          <EntityTableLinkCell to={`/gear-sets/${item.set}`}>
                            {item.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            <GearTypeTag type={item.type} />
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              size="sm"
                              color={accent.secondary}
                            >
                              {setName}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              size="sm"
                              color={accent.tertiary}
                            >
                              {count} ({percentage}%)
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {usingCharacters.length > 0 ? (
                              <UsageCharacterPortraits
                                itemSlug={item.slug}
                                characters={usingCharacters}
                                expanded={expandedUsageItems.has(item.slug)}
                                onToggleExpanded={() =>
                                  onToggleExpandedUsageItem(item.slug)
                                }
                                tooltipProps={tooltipProps}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    },
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <PaginationControl
            currentPage={usagePage}
            totalPages={usageTotalPages}
            onChange={onUsagePageChange}
            totalItems={filteredGearItemUsage.length}
            pageSize={usagePageSize}
            pageSizeOptions={usagePageSizeOptions}
            onPageSizeChange={onUsagePageSizeChange}
          />
        </Stack>
      </StaticSurface>
    </ListPageShell>
  );
}
