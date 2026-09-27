import { useEffect, useMemo, useState } from 'react';
import {
  getPageSizeStorageKey,
  usePageSize,
  usePagination,
} from './use-pagination';
import { useSortState } from './use-sort';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

/**
 * Lighter sibling of useFilteredPageData for secondary list-page tabs that
 * only need search + pagination (and optionally a single sort column), not
 * a full filter panel or view-mode toggle.
 */
export function useSecondaryTabList<T>(
  data: T[],
  options: {
    searchFn: (item: T, query: string) => boolean;
    sortFn?: (a: T, b: T, col: string | null, dir: 'asc' | 'desc') => number;
    storageKeys: {
      search: string;
      sort?: string;
    };
    pageSizeOptions?: readonly number[];
    pageSize?: number;
    extraPaginationKey?: unknown;
  },
) {
  const {
    searchFn,
    sortFn,
    storageKeys,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    pageSize = DEFAULT_PAGE_SIZE,
    extraPaginationKey,
  } = options;

  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(storageKeys.search) || '';
  });

  useEffect(() => {
    window.localStorage.setItem(storageKeys.search, search);
  }, [storageKeys.search, search]);

  const { sortState, handleSort } = useSortState(storageKeys.sort ?? '');
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const searched = query
      ? data.filter((item) => searchFn(item, query))
      : data;
    return sortFn
      ? [...searched].sort((a, b) => sortFn(a, b, sortCol, sortDir))
      : searched;
  }, [data, search, searchFn, sortFn, sortCol, sortDir]);

  const {
    pageSize: activePageSize,
    setPageSize,
    pageSizeOptions: availablePageSizeOptions,
  } = usePageSize(pageSizeOptions, {
    defaultSize: pageSize,
    storageKey: getPageSizeStorageKey(storageKeys.search),
  });

  const paginationKey = sortFn
    ? `${search}|${sortCol}|${sortDir}|${extraPaginationKey}`
    : `${search}|${extraPaginationKey}`;

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    activePageSize,
    paginationKey,
  );

  const pageItems = filtered.slice(offset, offset + activePageSize);

  return {
    search,
    setSearch,
    sortCol,
    sortDir,
    handleSort,
    filtered,
    pageItems,
    page,
    setPage,
    totalPages,
    pageSize: activePageSize,
    setPageSize,
    pageSizeOptions: availablePageSizeOptions,
  };
}
