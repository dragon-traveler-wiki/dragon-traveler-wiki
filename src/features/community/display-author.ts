import type { CommunityMeta } from './types';

/**
 * For a published item, prefer the real signed-in author recorded server-side
 * over the free-text "author" field in the payload, which is self-reported
 * and unverified. Local (unpublished) items only have the free-text field.
 */
export function getDisplayAuthor(item: {
  author?: string;
  community?: CommunityMeta;
}): string | undefined {
  return item.community?.author.displayName ?? item.author;
}
