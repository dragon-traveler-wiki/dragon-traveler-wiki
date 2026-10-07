import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BREAKPOINTS } from '@/constants/ui';
import {
  readStoredJson,
  readStoredString,
  writeStoredJson,
  writeStoredString,
} from '@/utils/saved-storage';

export type ViewMode = 'grid' | 'list';

interface UseViewModeOptions {
  storageKey: string;
  defaultMode?: ViewMode;
}

/**
 * Resolves the initial view mode from localStorage. Without a stored
 * preference, phones start in grid view because the list views are wide
 * tables.
 */
export function getInitialViewMode(
  storageKey: string,
  defaultMode: ViewMode,
): ViewMode {
  if (typeof window === 'undefined') return defaultMode;
  const stored = readStoredString(storageKey);
  if (stored === 'grid' || stored === 'list') return stored;
  return window.matchMedia(BREAKPOINTS.MOBILE).matches ? 'grid' : defaultMode;
}

/**
 * Hook to manage view mode (grid/list) with localStorage persistence
 */
export function useViewMode({
  storageKey,
  defaultMode = 'grid',
}: UseViewModeOptions) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(storageKey, defaultMode),
  );

  useEffect(() => {
    writeStoredString(storageKey, viewMode);
  }, [storageKey, viewMode]);

  return [viewMode, setViewMode] as const;
}

interface UseFilterPanelOptions {
  defaultOpen?: boolean;
}

/**
 * Hook to manage filter panel open/closed state
 */
export function useFilterPanel({
  defaultOpen = false,
}: UseFilterPanelOptions = {}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, toggle, open, close };
}

interface UseFiltersOptions<T> {
  emptyFilters: T;
  storageKey?: string;
}

function mergeStoredFilterShape<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(stored) ? stored : defaults) as T;
  }

  if (defaults === null) {
    return (
      stored === null ||
      typeof stored === 'string' ||
      typeof stored === 'boolean' ||
      typeof stored === 'number'
        ? stored
        : defaults
    ) as T;
  }

  if (typeof defaults !== 'object') {
    return (typeof stored === typeof defaults ? stored : defaults) as T;
  }

  if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
    return defaults;
  }

  const output: Record<string, unknown> = {};
  const defaultRecord = defaults as Record<string, unknown>;
  const storedRecord = stored as Record<string, unknown>;
  for (const [key, defaultValue] of Object.entries(defaultRecord)) {
    output[key] = mergeStoredFilterShape(defaultValue, storedRecord[key]);
  }
  return output as T;
}

/**
 * Generic hook for managing filter state with optional localStorage persistence
 */
export function useFilters<T extends object>({
  emptyFilters,
  storageKey,
}: UseFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(() => {
    if (storageKey) {
      const stored = readStoredJson<Record<string, unknown>>(
        storageKey,
        {},
        (value): value is Record<string, unknown> =>
          value !== null && typeof value === 'object' && !Array.isArray(value),
      );
      return mergeStoredFilterShape(emptyFilters, stored);
    }
    return emptyFilters;
  });

  // Keep a ref so resetFilters stays stable even if caller recreates emptyFilters each render.
  const emptyFiltersRef = useRef(emptyFilters);

  useEffect(() => {
    emptyFiltersRef.current = emptyFilters;
  }, [emptyFilters]);

  useEffect(() => {
    if (storageKey) {
      writeStoredJson(storageKey, filters);
    }
  }, [storageKey, filters]);

  const resetFilters = useCallback(() => {
    setFilters(emptyFiltersRef.current);
  }, []);

  const updateFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, setFilters, resetFilters, updateFilter };
}

interface UseFilteredDataOptions<T, F> {
  data: T[];
  filters: F;
  filterFn: (items: T[], filters: F) => T[];
  sortFn?: (items: T[]) => T[];
}

/**
 * Hook to handle data filtering and sorting
 */
export function useFilteredData<T, F>({
  data,
  filters,
  filterFn,
  sortFn,
}: UseFilteredDataOptions<T, F>) {
  return useMemo(() => {
    const filtered = filterFn(data, filters);
    return sortFn ? sortFn(filtered) : filtered;
  }, [data, filters, filterFn, sortFn]);
}

/**
 * Count the number of active filter values in a filter object.
 * - String fields contribute 0 (empty) or 1 (non-empty).
 * - Array fields contribute their length (one count per selected item).
 */
export function countActiveFilters<T extends object>(filters: T): number {
  return Object.values(filters as Record<string, unknown>).reduce<number>(
    (acc, v) => {
      if (Array.isArray(v)) {
        return (
          acc +
          v.filter(
            (item) =>
              item !== null &&
              item !== undefined &&
              (!(typeof item === 'string') || item.trim() !== ''),
          ).length
        );
      }
      if (typeof v === 'boolean') return acc + (v ? 1 : 0);
      if (typeof v === 'string') return acc + (v ? 1 : 0);
      return acc;
    },
    0,
  );
}
