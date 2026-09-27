import { Group, Loader } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { useGradientAccent } from '@/hooks';

interface CommunityLoadMoreProps {
  /** Whether the server has further pages beyond what's loaded. */
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  /** True once the viewer is on the last page of what's loaded so far. */
  atLastPage: boolean;
  loadedCount: number;
}

/**
 * Fetches the next server page as soon as the viewer reaches the last loaded
 * client page, so page numbers keep extending without a hidden button, and
 * shows a spinner while it does.
 */
export default function CommunityLoadMore({
  hasMore,
  loadingMore,
  onLoadMore,
  atLastPage,
  loadedCount,
}: CommunityLoadMoreProps) {
  const { accent } = useGradientAccent();
  // Ensures one request per loaded size, so a failed fetch doesn't retry in a loop.
  const requestedAtCount = useRef<number | null>(null);

  useEffect(() => {
    if (!hasMore || !atLastPage || loadingMore) return;
    if (requestedAtCount.current === loadedCount) return;
    requestedAtCount.current = loadedCount;
    onLoadMore();
  }, [hasMore, atLastPage, loadingMore, loadedCount, onLoadMore]);

  if (!loadingMore) return null;
  return (
    <Group justify="center">
      <Loader size="sm" color={accent.primary} />
    </Group>
  );
}
