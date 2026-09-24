import { useCallback, useEffect, useRef, useState } from 'react';
import { getCommunityItem, listCommunityItems } from './api';
import type { CommunityItem, CommunityKind, CommunityMeta } from './types';

export type CommunityPayload<T> = T & { community: CommunityMeta };

export interface CommunityItemsOptions {
  search?: string;
  sort?: 'top' | 'new';
  /** Only items owned by this user id — used by profile pages. */
  owner?: string;
  /** Moderator-only: browse 'hidden' items instead of 'published'. */
  status?: 'published' | 'hidden';
}

const PAGE_LIMIT = 24;

export function toDisplayItems<T>(
  items: Array<CommunityItem<T>>,
): Array<CommunityPayload<T>> {
  return items.map(({ payload, ...community }) => ({
    ...payload,
    community,
  }));
}

function buildParams(
  options: CommunityItemsOptions,
  extra?: Record<string, string>,
): URLSearchParams {
  const params = new URLSearchParams({ limit: String(PAGE_LIMIT), ...extra });
  if (options.search?.trim()) params.set('q', options.search.trim());
  if (options.sort) params.set('sort', options.sort);
  if (options.owner) params.set('owner', options.owner);
  if (options.status) params.set('status', options.status);
  return params;
}

/**
 * Loads published community items a page at a time instead of the whole
 * catalog up front, so browsing stays fast and unbounded as more items get
 * published. Resets and re-fetches from the server whenever the options
 * change, so search/sort/owner/status filtering covers the full catalog
 * rather than only what has been loaded so far.
 */
export function useCommunityItems<T>(
  kind: CommunityKind,
  options: CommunityItemsOptions = {},
) {
  const { search = '', sort, owner, status } = options;
  const [data, setData] = useState<Array<CommunityPayload<T>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    const params = buildParams({ search, sort, owner, status });
    listCommunityItems<T>(kind, params)
      .then((page) => {
        if (cancelled) return;
        setData(toDisplayItems(page.items));
        cursorRef.current = page.nextCursor;
        setHasMore(page.nextCursor !== null);
        setTotal(page.total ?? null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setData([]);
        setTotal(null);
        setHasMore(false);
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, search, sort, owner, status, requestVersion]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = buildParams(
        { search, sort, owner, status },
        { cursor: cursorRef.current },
      );
      const page = await listCommunityItems<T>(kind, params);
      setData((prev) => [...prev, ...toDisplayItems(page.items)]);
      cursorRef.current = page.nextCursor;
      setHasMore(page.nextCursor !== null);
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error(String(reason)));
    } finally {
      setLoadingMore(false);
    }
  }, [kind, search, sort, owner, status, loadingMore]);

  const retry = useCallback(() => setRequestVersion((value) => value + 1), []);
  return {
    data,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    retry,
  };
}

const SEARCH_INDEX_CAP = 500;

/**
 * Like useCommunityItems, but keeps auto-loading further pages in the
 * background (up to a generous cap) until the whole catalog is loaded.
 * Browse pages should use useCommunityItems directly and stay paginated —
 * this is for callers that need a broad in-memory set to search/index
 * client-side, such as the site-wide quick search.
 */
export function useCommunityItemsFull<T>(kind: CommunityKind) {
  const result = useCommunityItems<T>(kind);
  const { loading, loadingMore, hasMore, loadMore, data } = result;

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    if (data.length >= SEARCH_INDEX_CAP) return;
    void loadMore();
  }, [loading, loadingMore, hasMore, data.length, loadMore]);

  return result;
}

/**
 * Fetches a single published community item by id directly, rather than
 * relying on it being present in a paginated useCommunityItems() list —
 * detail pages need this since the item they're showing may not be on
 * whatever page happens to be loaded (or loaded at all, e.g. on a fresh
 * page load or a shared link).
 */
export function useCommunityItem<T>(kind: CommunityKind, id: string | null) {
  const [data, setData] = useState<CommunityPayload<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => {
        setData(null);
        setLoading(false);
        setError(null);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getCommunityItem<T>(kind, id)
      .then((result) => {
        if (cancelled) return;
        const { payload, ...community } = result.item;
        setData({ ...payload, community } as CommunityPayload<T>);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  return { data, loading, error };
}
