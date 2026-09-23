import type { Team } from '@/features/teams/types';
import {
  useCommunityItem,
  useCommunityItems,
  useCommunityItemsFull,
  type CommunityItemsOptions,
} from '@/features/community/hooks';

export function useTeams(options: CommunityItemsOptions = {}) {
  return useCommunityItems<Team>('team', options);
}

/** For callers needing the whole catalog in memory (e.g. quick search), not a browse page. */
export function useTeamsFull() {
  return useCommunityItemsFull<Team>('team');
}

export function useTeam(id: string | null) {
  return useCommunityItem<Team>('team', id);
}
