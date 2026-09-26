import { useMemo } from 'react';
import type { ViewMode } from './use-filters';
import {
  countActiveFilters,
  useFilterPanel,
  useFilters,
  useViewMode,
} from './use-filters';
import {
  getPageSizeStorageKey,
  resolvePageSizeOptions,
  usePageSize,
  usePagination,
  type PageSizeOptionsByViewMode,
} from './use-pagination';
import { useSortState } from './use-sort';

const DEFAULT_PAGE_SIZE = 50;

export function useFilteredPageData<T, F extends object>(
  data: T[],
  options: {
    emptyFilters: F;
    filterFn: (item: T, filters: F) => boolean;
    sortFn: (a: T, b: T, col: string | null, dir: 'asc' | 'desc') => number;
    storageKeys?: {
      filters?: string;
      viewMode?: string;
      sort?: string;
      pageSize?: string;
    };
    defaultViewMode?: ViewMode;
    pageSize?: number;
    pageSizeOptions?: readonly number[] | PageSizeOptionsByViewMode;
  },
) {
  const {
    emptyFilters,
    filterFn,
    sortFn,
    storageKeys = {},
    defaultViewMode = 'grid',
    pageSize = DEFAULT_PAGE_SIZE,
    pageSizeOptions,
  } = options;

  const { filters, setFilters, resetFilters, updateFilter } = useFilters<F>({
    emptyFilters,
    storageKey: storageKeys.filters,
  });

  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();

  const [viewMode, setViewMode] = useViewMode({
    storageKey: storageKeys.viewMode ?? '',
    defaultMode: defaultViewMode,
  });

  const { sortState, handleSort } = useSortState(storageKeys.sort ?? '');
  const { col: sortCol, dir: sortDir } = sortState;
  const resolvedPageSizeOptions = useMemo(
    () => resolvePageSizeOptions(viewMode, pageSizeOptions),
    [pageSizeOptions, viewMode],
  );
  const pageSizeStorageKey =
    storageKeys.pageSize ??
    getPageSizeStorageKey(storageKeys.viewMode ?? storageKeys.filters);
  const {
    pageSize: activePageSize,
    setPageSize,
    pageSizeOptions: availablePageSizeOptions,
  } = usePageSize(resolvedPageSizeOptions, {
    defaultSize: pageSize,
    storageKey: pageSizeStorageKey,
  });

  const filtered = useMemo(
    () =>
      data
        .filter((item) => filterFn(item, filters))
        .sort((a, b) => sortFn(a, b, sortCol, sortDir)),
    [data, filters, sortCol, sortDir, filterFn, sortFn],
  );

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    activePageSize,
    filters,
  );

  const pageItems = filtered.slice(offset, offset + activePageSize);

  const activeFilterCount = countActiveFilters(filters);

  return {
    // Filter state
    filters,
    setFilters,
    resetFilters,
    updateFilter,
    // Panel state
    filterOpen,
    toggleFilter,
    // View mode
    viewMode,
    setViewMode,
    // Sort state
    sortState,
    handleSort,
    sortCol,
    sortDir,
    // Data
    filtered,
    pageItems,
    // Pagination
    page,
    setPage,
    totalPages,
    pageSize: activePageSize,
    setPageSize,
    pageSizeOptions: availablePageSizeOptions,
    // Derived
    activeFilterCount,
  };
}
