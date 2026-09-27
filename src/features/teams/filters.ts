import { matchesContentTypeFilters } from '@/constants/content-types';
import { getDisplayAuthor } from '@/features/community/display-author';
import type { FactionSlug } from '@/types/faction';
import type { Team } from './types';

export interface TeamFilters {
  [key: string]: string[];
  factions: FactionSlug[];
  contentTypes: string[];
}

export const EMPTY_TEAM_FILTERS: TeamFilters = {
  factions: [],
  contentTypes: [],
};

export function matchesTeamFilters(
  team: Team,
  search: string,
  filters: TeamFilters,
): boolean {
  const query = search.trim().toLocaleLowerCase();
  const matchesQuery =
    !query ||
    team.name.toLocaleLowerCase().includes(query) ||
    (team.description ?? '').toLocaleLowerCase().includes(query) ||
    (getDisplayAuthor(team) ?? '').toLocaleLowerCase().includes(query);
  return (
    matchesQuery &&
    (filters.factions.length === 0 ||
      filters.factions.includes(team.faction)) &&
    matchesContentTypeFilters(team.content_type, filters.contentTypes)
  );
}
