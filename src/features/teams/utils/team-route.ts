import { getCommunityRoutePath } from '@/features/community/route';
import type { Team } from '@/features/teams/types';

export function getTeamRoutePath(
  team: Pick<Team, 'name' | 'community'>,
): string {
  return getCommunityRoutePath('/teams', team);
}
