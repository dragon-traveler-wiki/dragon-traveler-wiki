import { useCallback, useEffect, useState } from 'react';
import { listCommunityItems } from './api';
import type { CommunityItem, CommunityKind, CommunityMeta } from './types';

export type CommunityPayload<T> = T & { community: CommunityMeta };

export function useCommunityItems<T>(kind: CommunityKind) {
  const [data, setData] = useState<Array<CommunityPayload<T>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    const loadAll = async () => {
      const items: Array<CommunityItem<T>> = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({ limit: '50', sort: 'top' });
        if (cursor) params.set('cursor', cursor);
        const page = await listCommunityItems<T>(kind, params);
        items.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor && items.length < 500);
      return items;
    };
    loadAll()
      .then((items) => {
        if (cancelled) return;
        setData(
          items.map(({ payload, ...community }) => ({ ...payload, community })),
        );
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setData([]);
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, requestVersion]);

  const retry = useCallback(() => setRequestVersion((value) => value + 1), []);
  return { data, loading, error, retry };
}
