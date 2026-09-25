import type { CommunityMeta } from './types';

/**
 * The item to hand to the builder when opening a published team or tier list.
 * Owners edit the published item in place; anyone else gets a remix, which is
 * the same content without its community link so publishing creates a new item.
 */
export function toBuilderDraft<T extends { community?: CommunityMeta }>(
  item: T,
): T {
  return item.community?.viewerOwns ? item : { ...item, community: undefined };
}
