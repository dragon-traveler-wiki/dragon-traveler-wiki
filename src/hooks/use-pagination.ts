import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { ViewMode } from './use-filters';

export type PageSizeOptionsByViewMode = Partial<
  Record<ViewMode, readonly number[]>
>;

interface UsePageSizeOptions {
  defaultSize?: number;
  storageKey?: string;
}

const DEFAULT_GRID_PAGE_SIZES = [12, 24, 36, 48] as const;
const DEFAULT_LIST_PAGE_SIZES = [10, 25, 50, 100] as const;

export function buildRowAlignedPageSizeOptions(
  itemsPerRow: number,
  rowCounts: readonly number[] = [4, 6, 8, 10],
) {
  const safeItemsPerRow = Math.max(1, Math.floor(itemsPerRow));
  const safeRowCounts = rowCounts
    .map((count) => Math.floor(count))
    .filter((count) => Number.isFinite(count) && count > 0);

  return normalizePageSizeOptions(
    safeRowCounts.map((count) => safeItemsPerRow * count),
  );
}

function normalizePageSizeOptions(options: readonly number[]) {
  const normalized = [...new Set(options)]
    .map((option) => Math.floor(option))
    .filter((option) => Number.isFinite(option) && option > 0)
    .sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : [...DEFAULT_LIST_PAGE_SIZES];
}

function pickClosestPageSize(value: number, options: readonly number[]) {
  const fallback = options[0] ?? DEFAULT_LIST_PAGE_SIZES[0];

  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return options.reduce((closest, candidate) => {
    const candidateDelta = Math.abs(candidate - value);
    const closestDelta = Math.abs(closest - value);

    if (candidateDelta < closestDelta) {
      return candidate;
    }

    if (candidateDelta === closestDelta && candidate < closest) {
      return candidate;
    }

    return closest;
  }, fallback);
}

export function getPageSizeStorageKey(storageKey?: string) {
  if (!storageKey) {
    return undefined;
  }

  if (storageKey.endsWith(':viewMode')) {
    return storageKey.replace(/:viewMode$/, ':pageSize');
  }

  if (storageKey.endsWith(':filters')) {
    return storageKey.replace(/:filters$/, ':pageSize');
  }

  return `${storageKey}:pageSize`;
}

export function resolvePageSizeOptions(
  viewMode: ViewMode,
  pageSizeOptions?: readonly number[] | PageSizeOptionsByViewMode,
) {
  const fallbackOptions =
    viewMode === 'grid' ? DEFAULT_GRID_PAGE_SIZES : DEFAULT_LIST_PAGE_SIZES;

  if (Array.isArray(pageSizeOptions)) {
    return normalizePageSizeOptions(pageSizeOptions);
  }

  return normalizePageSizeOptions(
    (pageSizeOptions as PageSizeOptionsByViewMode | undefined)?.[viewMode] ??
      fallbackOptions,
  );
}

export function usePageSize(
  options: readonly number[],
  { defaultSize, storageKey }: UsePageSizeOptions = {},
) {
  const normalizedOptions = useMemo(
    () => normalizePageSizeOptions(options),
    [options],
  );

  const [pageSizeRaw, setPageSizeState] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = Number(window.localStorage.getItem(storageKey));

      if (Number.isFinite(stored) && stored > 0) {
        return pickClosestPageSize(stored, normalizedOptions);
      }
    }

    return pickClosestPageSize(
      defaultSize ?? normalizedOptions[0],
      normalizedOptions,
    );
  });

  const pageSize = normalizedOptions.includes(pageSizeRaw)
    ? pageSizeRaw
    : pickClosestPageSize(defaultSize ?? pageSizeRaw, normalizedOptions);

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.setItem(storageKey, String(pageSize));
    }
  }, [pageSize, storageKey]);

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      setPageSizeState(pickClosestPageSize(nextPageSize, normalizedOptions));
    },
    [normalizedOptions],
  );

  return {
    pageSize,
    setPageSize,
    pageSizeOptions: normalizedOptions,
  };
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), totalPages);
}

export function usePagination(
  total: number,
  pageSize: number,
  filterKey: unknown,
) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));

  // The page resets to 1 whenever the filter key or the page size changes, so
  // callers don't need an effect of their own for that.
  const [paginationState, setPaginationState] = useState({
    key: filterKey,
    size: safePageSize,
    page: 1,
  });

  const stateIsCurrent =
    paginationState.key === filterKey && paginationState.size === safePageSize;
  const page = stateIsCurrent ? paginationState.page : 1;

  const setPage: Dispatch<SetStateAction<number>> = useCallback(
    (value) => {
      setPaginationState((prev) => {
        const isCurrent = prev.key === filterKey && prev.size === safePageSize;
        const currentPage = isCurrent ? prev.page : 1;
        const nextPageRaw =
          typeof value === 'function'
            ? (value as (prevState: number) => number)(currentPage)
            : value;
        return {
          key: filterKey,
          size: safePageSize,
          page: clampPage(nextPageRaw, totalPages),
        };
      });
    },
    [filterKey, safePageSize, totalPages],
  );

  const effectivePage = clampPage(page, totalPages);
  const offset = (effectivePage - 1) * safePageSize;
  return { page: effectivePage, setPage, totalPages, offset };
}
