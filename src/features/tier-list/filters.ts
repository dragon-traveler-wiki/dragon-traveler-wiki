import { matchesContentTypeFilters } from '../../constants/content-types.ts';
import { getDisplayAuthor } from '../community/display-author.ts';
import { getTierListEntityType, type TierList } from './types.ts';

export interface TierListViewFilters {
  [key: string]: string[];
  contentTypes: string[];
  entityTypes: string[];
  factions: string[];
  classes: string[];
  qualities: string[];
}

export const EMPTY_TIER_LIST_VIEW_FILTERS: TierListViewFilters = {
  contentTypes: [],
  entityTypes: [],
  factions: [],
  classes: [],
  qualities: [],
};

export function matchesTierListFilters(
  tierList: TierList,
  search: string,
  filters: TierListViewFilters,
): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (
    query &&
    ![
      tierList.name,
      getDisplayAuthor(tierList) ?? '',
      tierList.description ?? '',
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  ) {
    return false;
  }
  return (
    (filters.entityTypes.length === 0 ||
      filters.entityTypes.includes(getTierListEntityType(tierList))) &&
    matchesContentTypeFilters(tierList.content_type, filters.contentTypes)
  );
}
