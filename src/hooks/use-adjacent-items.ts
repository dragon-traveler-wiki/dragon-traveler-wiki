import { useMemo } from 'react';

/**
 * Resolves the previous/next entries around `currentItem` (matched by slug)
 * in an ordered list and maps them to detail page navigation items.
 */
export function useAdjacentItems<T extends { slug: string }, N>(
  orderedItems: readonly T[],
  currentItem: T | null | undefined,
  toNavItem: (item: T) => N,
): { previousItem: N | null; nextItem: N | null } {
  const currentSlug = currentItem?.slug;
  const index = useMemo(
    () =>
      currentSlug === undefined
        ? -1
        : orderedItems.findIndex((item) => item.slug === currentSlug),
    [orderedItems, currentSlug],
  );

  const previous = index > 0 ? orderedItems[index - 1] : null;
  const next =
    index >= 0 && index < orderedItems.length - 1
      ? orderedItems[index + 1]
      : null;

  return {
    previousItem: previous ? toNavItem(previous) : null,
    nextItem: next ? toNavItem(next) : null,
  };
}
