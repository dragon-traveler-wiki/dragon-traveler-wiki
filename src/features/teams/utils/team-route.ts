import type { Team } from '@/features/teams/types';
import { toEntitySlug } from '@/utils/entity-slug';

export function getTeamRoutePath(
  team: Pick<Team, 'name' | 'community'>,
): string {
  if (team.community) {
    return `/teams/${team.community.id}/${team.community.slug}`;
  }
  return `/teams/${toEntitySlug(team.name)}`;
}
