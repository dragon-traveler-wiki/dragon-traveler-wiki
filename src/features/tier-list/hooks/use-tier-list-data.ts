import type { TierList } from '@/features/tier-list/types';
import { useCommunityItems } from '@/features/community/hooks';
import type { ChangesFile } from '@/types/changes';

export function useTierLists() {
  return useCommunityItems<TierList>('tier_list');
}

export function useTierListChanges() {
  return {
    data: {} as ChangesFile,
    loading: false,
    error: null,
    retry: () => {},
  };
}
