import type { Team } from '@/features/teams/types';
import { useCommunityItems } from '@/features/community/hooks';
import type { ChangesFile } from '@/types/changes';

export function useTeams() {
  return useCommunityItems<Team>('team');
}

export function useTeamChanges() {
  return {
    data: {} as ChangesFile,
    loading: false,
    error: null,
    retry: () => {},
  };
}
