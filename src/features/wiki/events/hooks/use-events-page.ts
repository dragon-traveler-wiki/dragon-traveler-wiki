import { useMemo } from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import {
  buildEventEntries,
  EMPTY_EVENT_FILTERS,
  matchesEventFilters,
  type EventFilters,
  type EventTab,
} from '@/features/wiki/events/filters';
import type { GameEvent } from '@/features/wiki/events/types';
import type { ViewMode } from '@/hooks';
import {
  countActiveFilters,
  getPageSizeStorageKey,
  useFilterPanel,
  useFilters,
  usePageSize,
  usePagination,
  useSearchParamFilter,
  useTabParam,
  useViewMode,
} from '@/hooks';
import { getLatestTimestamp } from '@/utils';

const EVENTS_PER_PAGE = 12;
const EVENT_PAGE_SIZE_OPTIONS: Record<ViewMode, readonly number[]> = {
  grid: [12, 18, 24, 36],
  list: [6, 12, 18, 24],
};

export function useEventsPage(events: GameEvent[]) {
  const [tabValue, setTab] = useTabParam('tab', 'active', ['active', 'past']);
  const tab = tabValue as EventTab;
  const { filters, setFilters, resetFilters } = useFilters<EventFilters>({
    emptyFilters: EMPTY_EVENT_FILTERS,
    storageKey: STORAGE_KEY.EVENT_FILTERS,
  });
  useSearchParamFilter(setFilters);

  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.EVENT_VIEW_MODE,
    defaultMode: 'grid',
  });
  const allEvents = useMemo(() => buildEventEntries(events), [events]);
  const scopedEvents = useMemo(
    () =>
      allEvents.filter((entry) =>
        tab === 'active' ? entry.active : !entry.active,
      ),
    [allEvents, tab],
  );
  const filtered = useMemo(
    () => scopedEvents.filter((entry) => matchesEventFilters(entry, filters)),
    [filters, scopedEvents],
  );
  const serverOptions = useMemo(
    () => [...new Set(allEvents.map((entry) => entry.server))].sort(),
    [allEvents],
  );
  const typeOptions = useMemo(
    () =>
      [
        ...new Set(allEvents.map(({ event }) => event.type).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right)),
    [allEvents],
  );
  const characterOptions = useMemo(
    () =>
      [...new Set(allEvents.flatMap(({ event }) => event.characters))].sort(),
    [allEvents],
  );
  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    EVENT_PAGE_SIZE_OPTIONS[viewMode],
    {
      defaultSize: EVENTS_PER_PAGE,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.EVENT_VIEW_MODE),
    },
  );
  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    pageSize,
    `${tab}:${JSON.stringify(filters)}`,
  );

  return {
    tab,
    setTab,
    filters,
    setFilters,
    resetFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    serverOptions,
    typeOptions,
    characterOptions,
    filtered,
    pageItems: filtered.slice(offset, offset + pageSize),
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    activeCount: allEvents.filter((entry) => entry.active).length,
    pastCount: allEvents.filter((entry) => !entry.active).length,
    activeFilterCount: countActiveFilters(filters),
    mostRecentUpdate: getLatestTimestamp(events) || 0,
  };
}
