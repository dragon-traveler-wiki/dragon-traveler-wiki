interface PaginationTotalInput {
  /** Loaded items remaining after client-side filters. */
  visibleCount: number;
  /** Loaded items before client-side filters. */
  loadedCount: number;
  /** Server-side count of every matching item, if known. */
  total: number | null;
  hasMore: boolean;
}

/**
 * How many items the page controls should span. While more pages remain on
 * the server and no client-side filter has narrowed the loaded set, that's the
 * server total, so page numbers cover the whole catalog. Once filters narrow
 * the set the server total no longer applies, so it falls back to what's loaded.
 */
export function getCommunityPaginationTotal({
  visibleCount,
  loadedCount,
  total,
  hasMore,
}: PaginationTotalInput): number {
  return hasMore && total !== null && visibleCount === loadedCount
    ? total
    : visibleCount;
}
