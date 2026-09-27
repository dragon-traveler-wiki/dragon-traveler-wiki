import type { TierList } from '@/features/tier-list/types';
import {
  useCommunityItem,
  useCommunityItems,
  useCommunityItemsFull,
  type CommunityItemsOptions,
} from '@/features/community/hooks';

export function useTierLists(options: CommunityItemsOptions = {}) {
  return useCommunityItems<TierList>('tier_list', options);
}

/** For callers needing the whole catalog in memory (e.g. quick search), not a browse page. */
export function useTierListsFull() {
  return useCommunityItemsFull<TierList>('tier_list');
}

export function useTierList(id: string | null) {
  return useCommunityItem<TierList>('tier_list', id);
}
