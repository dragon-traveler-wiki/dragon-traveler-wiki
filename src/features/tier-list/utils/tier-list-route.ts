import { getCommunityRoutePath } from '@/features/community/route';
import type { TierList } from '@/features/tier-list/types';

export function getTierListRoutePath(
  tierList: Pick<TierList, 'name' | 'community'>,
): string {
  return getCommunityRoutePath('/tier-list', tierList);
}
