import {
  getArtifactIcon,
  getGearIcon,
  getHowlkinIcon,
  getNoblePhantasmIcon,
  getRelicIcon,
  getResourceIcon,
  getStatusEffectIcon,
  getSubclassIcon,
  getWyrmPortrait,
  getWyrmspellIcon,
} from '@/assets';
import { normalizeContentType } from '@/constants/content-types';
import type { SearchDataContextValue } from '@/contexts/search-data';
import {
  buildCharacterByIdentityMap,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import { isCodeActive } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import { isGameEventActive } from '@/utils/event-utils';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { IconType } from 'react-icons';
import {
  IoCalendarOutline,
  IoCubeOutline,
  IoDiamondOutline,
  IoDocumentTextOutline,
  IoFlameOutline,
  IoFlashOutline,
  IoGridOutline,
  IoPawOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoShieldOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import { addLinkedCharacterNames } from './noble-phantasm-search';
import { SEARCH_PAGES } from './search-pages';
import { rankAndLimitSearchResults } from './search-ranking';

export type SearchResultType =
  | 'artifact'
  | 'character'
  | 'code'
  | 'event'
  | 'gear'
  | 'howlkin'
  | 'noble-phantasm'
  | 'page'
  | 'relic'
  | 'resource'
  | 'status-effect'
  | 'subclass'
  | 'team'
  | 'tier-list'
  | 'useful-link'
  | 'wyrm'
  | 'wyrmspell';

export interface SearchResult {
  type: SearchResultType;
  title: string;
  subtitle?: string;
  path: string;
  icon: IconType | string;
  color: string;
}

interface SearchAdapter {
  search(query: string): SearchResult[];
}

export const SEARCH_CATEGORY_LABELS: Record<SearchResultType, string> = {
  artifact: 'Artifacts',
  character: 'Characters',
  code: 'Codes',
  event: 'Events',
  gear: 'Gear',
  howlkin: 'Howlkins',
  'noble-phantasm': 'Noble Phantasms',
  page: 'Pages',
  relic: 'Relics',
  resource: 'Resources',
  'status-effect': 'Status Effects',
  subclass: 'Subclasses',
  team: 'Teams',
  'tier-list': 'Tier Lists',
  'useful-link': 'Useful Links',
  wyrm: 'Wyrms',
  wyrmspell: 'Wyrmspells',
};

export const MAX_SEARCH_RESULTS = 30;

function searchPath(
  path: string,
  query: string,
  params?: Record<string, string>,
) {
  const searchParams = new URLSearchParams({ ...params, search: query });
  return `${path}?${searchParams.toString()}`;
}

function createSearchAdapter<T>(
  items: readonly T[],
  options: IFuseOptions<T>,
  limit: number,
  toResult: (item: T) => SearchResult,
): SearchAdapter | null {
  if (items.length === 0) return null;

  const index = new Fuse([...items], options);
  return {
    search: (query) =>
      index
        .search(query)
        .slice(0, limit)
        .map(({ item }) => toResult(item)),
  };
}

const PAGE_ADAPTER = createSearchAdapter(
  SEARCH_PAGES,
  { keys: ['title', 'keywords'], threshold: 0.4 },
  3,
  (page) => ({
    type: 'page',
    title: page.title,
    path: page.path,
    icon: IoDocumentTextOutline,
    color: 'gray',
  }),
);

export function buildSearchRegistry(
  data: SearchDataContextValue,
): SearchAdapter[] {
  const characterByIdentity = buildCharacterByIdentityMap(data.characters);
  const noblePhantasms = addLinkedCharacterNames(
    data.noblePhantasms,
    characterByIdentity,
  );

  const adapters = [
    createSearchAdapter(
      data.characters,
      {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'character_class', weight: 0.5 },
          { name: 'factions', weight: 0.3 },
          { name: 'subclasses', weight: 0.3 },
        ],
        threshold: 0.3,
        includeScore: true,
      },
      8,
      (character) => ({
        type: 'character',
        title: character.name,
        subtitle: `${character.quality} ${character.character_class.charAt(0).toUpperCase()}${character.character_class.slice(1)}`,
        path: getCharacterRoutePath(character),
        icon: IoPersonOutline,
        color: 'blue',
      }),
    ),
    createSearchAdapter(
      data.artifacts,
      {
        keys: [
          'name',
          'quality',
          'lore',
          'effect.description',
          'treasures.name',
        ],
        threshold: 0.3,
      },
      5,
      (artifact) => ({
        type: 'artifact',
        title: artifact.name,
        subtitle: `${artifact.quality} Artifact`,
        path: `/artifacts/${artifact.slug}`,
        icon: getArtifactIcon(artifact.slug) ?? IoDiamondOutline,
        color: 'teal',
      }),
    ),
    createSearchAdapter(
      data.gear,
      { keys: ['name', 'set', 'type', 'lore'], threshold: 0.3 },
      5,
      (gear) => ({
        type: 'gear',
        title: gear.name,
        subtitle: `${gear.type} • ${gear.set}`,
        path: `/gear-sets/${toEntitySlug(gear.set)}`,
        icon: getGearIcon(gear.type, gear.slug) ?? IoShieldOutline,
        color: 'teal',
      }),
    ),
    PAGE_ADAPTER,
    createSearchAdapter(
      data.statusEffects,
      { keys: ['name', 'type', 'effect'], threshold: 0.3 },
      5,
      (statusEffect) => ({
        type: 'status-effect',
        title: statusEffect.name,
        subtitle: statusEffect.type,
        path: searchPath('/status-effects', statusEffect.name),
        icon:
          (statusEffect.icon !== false
            ? getStatusEffectIcon(statusEffect.slug, statusEffect.type)
            : undefined) ?? IoSparklesOutline,
        color: 'cyan',
      }),
    ),
    createSearchAdapter(
      data.subclasses,
      { keys: ['name', 'class', 'effect', 'bonuses'], threshold: 0.3 },
      5,
      (subclass) => ({
        type: 'subclass',
        title: subclass.name,
        subtitle: `${subclass.class.charAt(0).toUpperCase()}${subclass.class.slice(1)} • Tier ${subclass.tier}`,
        path: searchPath('/subclasses', subclass.name),
        icon: getSubclassIcon(subclass.slug, subclass.class) ?? IoGridOutline,
        color: 'grape',
      }),
    ),
    createSearchAdapter(
      data.wyrmspells,
      { keys: ['name', 'type', 'qualities.effect'], threshold: 0.3 },
      5,
      (wyrmspell) => ({
        type: 'wyrmspell',
        title: wyrmspell.name,
        subtitle: wyrmspell.type,
        path: `/wyrmspells/${wyrmspell.slug}`,
        icon:
          getWyrmspellIcon(wyrmspell.slug, wyrmspell.type) ?? IoFlameOutline,
        color: 'indigo',
      }),
    ),
    createSearchAdapter(
      data.teams,
      {
        keys: ['name', 'description', 'members.character_slug'],
        threshold: 0.3,
      },
      3,
      (team) => ({
        type: 'team',
        title: team.name,
        subtitle: `${team.members.length} characters`,
        path: getTeamRoutePath(team),
        icon: IoPeopleOutline,
        color: 'green',
      }),
    ),
    createSearchAdapter(
      data.howlkins,
      { keys: ['name', 'quality', 'passive_effects'], threshold: 0.3 },
      4,
      (howlkin) => ({
        type: 'howlkin',
        title: howlkin.name,
        subtitle: `${howlkin.quality} Howlkin`,
        path: searchPath('/howlkins', howlkin.name, { tab: 'howlkins' }),
        icon: getHowlkinIcon(howlkin.slug, howlkin.quality) ?? IoPawOutline,
        color: 'orange',
      }),
    ),
    createSearchAdapter(
      noblePhantasms,
      { keys: ['name', 'characterName', 'lore'], threshold: 0.3 },
      5,
      (noblePhantasm) => ({
        type: 'noble-phantasm',
        title: noblePhantasm.name,
        subtitle: noblePhantasm.characterName || 'Noble Phantasm',
        path: `/noble-phantasms/${noblePhantasm.slug}`,
        icon: getNoblePhantasmIcon(noblePhantasm.slug) ?? IoFlashOutline,
        color: 'teal',
      }),
    ),
    createSearchAdapter(
      data.resources,
      { keys: ['name', 'description', 'category', 'quality'], threshold: 0.3 },
      5,
      (resource) => ({
        type: 'resource',
        title: resource.name,
        subtitle: `${resource.category} • ${resource.quality}`,
        path: searchPath('/resources', resource.name),
        icon:
          getResourceIcon(resource.slug, resource.category) ?? IoCubeOutline,
        color: 'teal',
      }),
    ),
    createSearchAdapter(
      data.events,
      {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'tag', weight: 0.5 },
          { name: 'description', weight: 0.5 },
        ],
        threshold: 0.3,
      },
      5,
      (event) => {
        const isActive = isGameEventActive(event);
        return {
          type: 'event',
          title: event.name,
          subtitle: isActive ? 'Active event' : 'Past event',
          path: searchPath('/events', event.name, {
            tab: isActive ? 'active' : 'past',
          }),
          icon: IoCalendarOutline,
          color: 'green',
        };
      },
    ),
    createSearchAdapter(
      data.codes,
      { keys: ['code'], threshold: 0.25 },
      4,
      (code) => {
        const isActive = isCodeActive(code);
        return {
          type: 'code',
          title: code.code,
          subtitle: isActive ? 'Active code' : 'Expired code',
          path: searchPath('/codes', code.code, {
            tab: isActive ? 'active' : 'expired',
          }),
          icon: IoFlashOutline,
          color: 'cyan',
        };
      },
    ),
    createSearchAdapter(
      data.usefulLinks,
      { keys: ['application', 'name', 'description', 'link'], threshold: 0.3 },
      4,
      (link) => ({
        type: 'useful-link',
        title: link.name,
        subtitle: link.application,
        path: `/toolbox/useful-links#${toEntitySlug(link.name)}`,
        icon: IoDocumentTextOutline,
        color: 'indigo',
      }),
    ),
    createSearchAdapter(
      data.tierLists,
      {
        keys: [
          'name',
          'author',
          'content_type',
          'description',
          'entries.character_slug',
        ],
        threshold: 0.3,
      },
      3,
      (tierList) => ({
        type: 'tier-list',
        title: tierList.name,
        subtitle: `${normalizeContentType(tierList.content_type, 'All')} • ${tierList.author}`,
        path: searchPath('/tier-list', tierList.name),
        icon: IoDocumentTextOutline,
        color: 'pink',
      }),
    ),
    createSearchAdapter(
      data.relics,
      { keys: ['name', 'type', 'quality', 'lore'], threshold: 0.3 },
      5,
      (relic) => ({
        type: 'relic',
        title: relic.name,
        subtitle: relic.type,
        path: searchPath('/relics', relic.name, { tab: 'relics' }),
        icon: getRelicIcon(relic.slug, relic.quality) ?? IoDiamondOutline,
        color: 'violet',
      }),
    ),
    createSearchAdapter(
      data.wyrms,
      {
        keys: [
          { name: 'name', weight: 2 },
          'faction',
          'description',
          'battle_description',
        ],
        threshold: 0.3,
      },
      5,
      (wyrm) => ({
        type: 'wyrm',
        title: wyrm.name,
        subtitle: `${FACTION_SLUG_TO_NAME[wyrm.faction] ?? wyrm.faction} · ${wyrm.phase}`,
        path: `/wyrms/${wyrm.slug}`,
        icon: getWyrmPortrait(wyrm.slug) ?? IoFlameOutline,
        color: 'red',
      }),
    ),
  ];

  return adapters.filter(
    (adapter): adapter is SearchAdapter => adapter !== null,
  );
}

export function searchRegistry(
  registry: readonly SearchAdapter[],
  query: string,
) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  return rankAndLimitSearchResults(
    registry.flatMap((adapter) => adapter.search(normalizedQuery)),
    normalizedQuery,
    MAX_SEARCH_RESULTS,
  );
}
