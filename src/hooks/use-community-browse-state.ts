import { normalizeContentTypeFilters } from '@/constants/content-types';
import type { CommunitySort } from '@/features/community/CommunitySortControl';
import { readStoredString, writeStoredString } from '@/utils/saved-storage';
import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useFilters } from './use-filters';

const SEARCH_DEBOUNCE_MS = 300;

interface CommunityBrowseFilters {
  [key: string]: string[];
  contentTypes: string[];
}

interface UseCommunityBrowseStateOptions<F extends CommunityBrowseFilters> {
  emptyFilters: F;
  storageKeys: { search: string; sort: string; filters: string };
  /** Takes precedence over the stored search, e.g. a `?search=` deep link. */
  initialSearch?: string | null;
}

/**
 * Search, sort, and filter state shared by the community browse pages
 * (teams and tier lists), persisted to localStorage.
 */
export function useCommunityBrowseState<F extends CommunityBrowseFilters>({
  emptyFilters,
  storageKeys,
  initialSearch,
}: UseCommunityBrowseStateOptions<F>) {
  const { search: searchKey, sort: sortKey, filters: filtersKey } = storageKeys;
  const [search, setSearch] = useState(
    () => initialSearch ?? readStoredString(searchKey),
  );
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [sort, setSort] = useState<CommunitySort>(() =>
    readStoredString(sortKey) === 'new' ? 'new' : 'top',
  );
  const {
    filters,
    setFilters,
    resetFilters,
    updateFilter: handleFilterChange,
  } = useFilters<F>({
    emptyFilters,
    storageKey: filtersKey,
  });

  useEffect(() => {
    writeStoredString(searchKey, search);
  }, [searchKey, search]);

  useEffect(() => {
    writeStoredString(sortKey, sort);
  }, [sortKey, sort]);

  useEffect(() => {
    const deduped = normalizeContentTypeFilters(filters.contentTypes);
    const unchanged =
      deduped.length === filters.contentTypes.length &&
      deduped.every((value, index) => value === filters.contentTypes[index]);
    if (unchanged) return;
    setFilters((prev) => ({ ...prev, contentTypes: deduped }));
  }, [filters.contentTypes, setFilters]);

  const clearFilters = useCallback(() => {
    resetFilters();
    setSearch('');
  }, [resetFilters]);

  return {
    search,
    setSearch,
    debouncedSearch,
    sort,
    setSort,
    filters,
    handleFilterChange,
    clearFilters,
  };
}

/** Saved items that reload from storage whenever the page enters `saved` mode. */
export function useSavedItemsForMode<T>(mode: string, load: () => T[]) {
  const [items, setItems] = useState<T[]>(() =>
    mode === 'saved' ? load() : [],
  );
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    if (mode === 'saved') setItems(load());
  }
  return [items, setItems] as const;
}
