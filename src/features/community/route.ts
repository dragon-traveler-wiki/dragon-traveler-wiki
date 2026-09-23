import { toEntitySlug } from '@/utils/entity-slug';
import type { CommunityMeta } from './types';

/**
 * Builds a route path for a community-published item: the canonical
 * `<basePath>/<id>/<slug>` when published, or a local-only fallback path
 * when it's just a draft (no `community` yet).
 */
export function getCommunityRoutePath(
  basePath: string,
  item: { name: string; community?: CommunityMeta },
): string {
  if (item.community) {
    return `${basePath}/${item.community.id}/${item.community.slug}`;
  }
  return `${basePath}/${toEntitySlug(item.name)}`;
}
