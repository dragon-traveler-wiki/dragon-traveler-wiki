import { SimpleGrid, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import PaginationControl from '@/components/ui/PaginationControl';
import {
  getPageSizeStorageKey,
  usePageSize,
  usePagination,
} from '@/hooks/use-pagination';
import CommunityLoadMore from './CommunityLoadMore';
import { getCommunityPaginationTotal } from './pagination';

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const;

interface PagedGridProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyMessage: string;
  /** Distinguishes this list's remembered page size from other lists'. */
  storageKey: string;
  cols?: { base: number; sm?: number };
  /** For server-paged lists: total matches, whether more exist, and how to fetch them. */
  total?: number | null;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * A card grid with the same page controls as the browse pages. Works over a
 * fully loaded list, or a server-paged one when `total`/`hasMore`/`onLoadMore`
 * are given (further server pages load as the viewer reaches the last one).
 */
export default function PagedGrid<T>({
  items,
  getKey,
  renderItem,
  emptyMessage,
  storageKey,
  cols = { base: 1, sm: 2 },
  total = null,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: PagedGridProps<T>) {
  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    PAGE_SIZE_OPTIONS,
    { defaultSize: 12, storageKey: getPageSizeStorageKey(storageKey) },
  );
  const paginationTotal = getCommunityPaginationTotal({
    visibleCount: items.length,
    loadedCount: items.length,
    total,
    hasMore,
  });
  const { page, setPage, totalPages, offset } = usePagination(
    paginationTotal,
    pageSize,
    storageKey,
  );

  if (items.length === 0) return <Text c="dimmed">{emptyMessage}</Text>;

  const visible = items.slice(offset, offset + pageSize);
  return (
    <>
      <SimpleGrid cols={cols} spacing="md">
        {visible.map((item) => (
          <div key={getKey(item)} style={{ minWidth: 0 }}>
            {renderItem(item)}
          </div>
        ))}
      </SimpleGrid>
      {paginationTotal > PAGE_SIZE_OPTIONS[0] && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={paginationTotal}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={setPageSize}
        />
      )}
      {onLoadMore && (
        <CommunityLoadMore
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
          atLastPage={page * pageSize >= items.length}
          loadedCount={items.length}
        />
      )}
    </>
  );
}
