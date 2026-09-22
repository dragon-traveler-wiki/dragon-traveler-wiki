import { matchPath } from 'react-router';

export type RouteMeta = {
  title: string;
  description: string;
};

export type RouteMetaEntry = {
  id: string;
  pattern: string;
  kind?: 'list' | 'detail';
  fallback?: RouteFallbackKind;
  navigationParent?: string;
  searchKeywords?: string;
  meta: RouteMeta;
};

export type RouteFallbackKind =
  | 'home'
  | 'character-list'
  | 'character-detail'
  | 'detail'
  | 'artifact-list'
  | 'wyrmspell-list'
  | 'wyrm-list'
  | 'resource-list'
  | 'status-effect-list'
  | 'subclass-list'
  | 'gear-list'
  | 'relic-list'
  | 'howlkin-list'
  | 'noble-phantasm-list'
  | 'event-list'
  | 'code-list'
  | 'team-list'
  | 'tier-list'
  | 'changelog'
  | 'useful-links'
  | 'content';

export const SITE_NAME = 'Dragon Traveler Wiki';
export const DEFAULT_DESCRIPTION =
  'A comprehensive wiki for Dragon Traveler game information, characters, resources, and more.';
export const BASE_URL = 'https://dtwiki.org';
export const DEFAULT_IMAGE = `${BASE_URL}/images/banners/default-social.jpg`;
export const DEFAULT_IMAGE_ALT = 'Dragon Traveler Wiki banner';
export const DEFAULT_IMAGE_WIDTH = '1200';
export const DEFAULT_IMAGE_HEIGHT = '630';

export const ROUTE_CATALOG = [
  {
    id: 'home',
    pattern: '/',
    fallback: 'home',
    meta: {
      title: 'Home',
      description:
        'Your Dragon Traveler hub for character builds, database lookups, progression guides, calculators, and event tools.',
    },
  },
  {
    id: 'artifacts',
    pattern: '/artifacts',
    fallback: 'artifact-list',
    searchKeywords: 'artifacts database relic equipment',
    meta: {
      title: 'Artifacts',
      description:
        'Browse artifact data with level effects, quality, lore, and synergy notes for optimized build planning.',
    },
  },
  {
    id: 'artifactDetail',
    pattern: '/artifacts/:name',
    kind: 'detail',
    meta: {
      title: 'Artifact Details',
      description:
        'Full artifact breakdown including level-by-level effects, treasure interactions, and recommended use cases.',
    },
  },
  {
    id: 'characters',
    pattern: '/characters',
    fallback: 'character-list',
    searchKeywords: 'characters database hero heroes',
    meta: {
      title: 'Characters',
      description:
        'Explore characters with class, faction, quality, and build context for PvE progression and team synergy.',
    },
  },
  {
    id: 'characterDetail',
    pattern: '/characters/:name',
    fallback: 'character-detail',
    kind: 'detail',
    meta: {
      title: 'Character Details',
      description:
        'Detailed character page with kit analysis, recommended gear/artifacts, team role, and progression tips.',
    },
  },
  {
    id: 'gear',
    pattern: '/gear',
    fallback: 'gear-list',
    searchKeywords:
      'gear equipment set headgear chestplate bracers boots weapon accessory',
    meta: {
      title: 'Gear',
      description:
        'Review gear pieces and sets with set-bonus effects and filtering tools for faster optimization.',
    },
  },
  {
    id: 'gearSetDetail',
    pattern: '/gear-sets/:setName',
    navigationParent: 'gear',
    kind: 'detail',
    meta: {
      title: 'Gear Set Details',
      description:
        'See complete set bonus details, ideal users, and practical build paths for each gear set.',
    },
  },
  {
    id: 'howlkins',
    pattern: '/howlkins',
    fallback: 'howlkin-list',
    searchKeywords: 'howlkins database pot howlkin refinement',
    meta: {
      title: 'Howlkins',
      description:
        'Browse Howlkins and Golden Alliances with passive abilities, alliance bonuses, and stat progression by membership level.',
    },
  },
  {
    id: 'howlkinDetail',
    pattern: '/howlkins/:allianceSlug',
    kind: 'detail',
    meta: {
      title: 'Golden Alliance Details',
      description:
        'View all members, stat effects by level, and change history for this Golden Alliance.',
    },
  },
  {
    id: 'noblePhantasms',
    pattern: '/noble-phantasms',
    fallback: 'noble-phantasm-list',
    searchKeywords: 'noble phantasm noble phantasms database',
    meta: {
      title: 'Noble Phantasms',
      description:
        'Browse Noble Phantasms with skill counts, lore previews, global availability, and links to their characters.',
    },
  },
  {
    id: 'noblePhantasmDetail',
    pattern: '/noble-phantasms/:name',
    kind: 'detail',
    meta: {
      title: 'Noble Phantasm Details',
      description:
        'Noble Phantasm deep dive with tier-based effect tables, skill progression by level, and character attribution.',
    },
  },
  {
    id: 'relics',
    pattern: '/relics',
    fallback: 'relic-list',
    searchKeywords:
      'relics sanctuary fated legendary ritual vessel oracle scroll',
    meta: {
      title: 'Relics',
      description:
        'Browse relics with historical lore, oracle scrolls, types, and quality tiers.',
    },
  },
  {
    id: 'oracleScrollDetail',
    pattern: '/oracle-scrolls/:scrollName',
    navigationParent: 'relics',
    kind: 'detail',
    meta: {
      title: 'Oracle Scroll Details',
      description:
        'View all relics belonging to this oracle scroll with lore, type, and quality details.',
    },
  },
  {
    id: 'resources',
    pattern: '/resources',
    fallback: 'resource-list',
    searchKeywords: 'resources materials currency items',
    meta: {
      title: 'Resources',
      description:
        "Search and filter game resources by category and quality, with descriptions covering each item's purpose and use.",
    },
  },
  {
    id: 'subclasses',
    pattern: '/subclasses',
    fallback: 'subclass-list',
    searchKeywords: 'subclasses class talents tier bonuses effects',
    meta: {
      title: 'Subclasses',
      description:
        'Compare subclasses with effects and role fit to choose stronger class enhancements.',
    },
  },
  {
    id: 'statusEffects',
    pattern: '/status-effects',
    fallback: 'status-effect-list',
    searchKeywords: 'status effects buffs debuffs',
    meta: {
      title: 'Status Effects',
      description:
        'Reference status effects to understand buffs, debuffs, and tactical combat interactions.',
    },
  },
  {
    id: 'wyrms',
    pattern: '/wyrms',
    fallback: 'wyrm-list',
    searchKeywords: 'wyrms dragons dragon companions battle faction',
    meta: {
      title: 'Wyrms',
      description:
        'Browse Wyrms with type, quality, and passive ability details.',
    },
  },
  {
    id: 'wyrmDetail',
    pattern: '/wyrms/:name',
    kind: 'detail',
    meta: {
      title: 'Wyrm Details',
      description:
        'Full Wyrm breakdown with passive abilities, quality tiers, and related Wyrmspells.',
    },
  },
  {
    id: 'wyrmspells',
    pattern: '/wyrmspells',
    fallback: 'wyrmspell-list',
    searchKeywords: 'wyrmspells dragon spells magic',
    meta: {
      title: 'Wyrmspells',
      description:
        'Browse Wyrmspells with quality, type, faction exclusivity, global availability, and max-quality effect descriptions.',
    },
  },
  {
    id: 'wyrmspellDetail',
    pattern: '/wyrmspells/:name',
    kind: 'detail',
    meta: {
      title: 'Wyrmspell Details',
      description:
        'Full Wyrmspell breakdown with quality-by-quality effect descriptions, faction exclusivity, and change history.',
    },
  },
  {
    id: 'tierList',
    pattern: '/tier-list',
    fallback: 'tier-list',
    searchKeywords: 'tier list ranking meta best',
    meta: {
      title: 'Tier List',
      description:
        'View and build tier lists with content-type rankings, filterable character grids, and upgrade priority context.',
    },
  },
  {
    id: 'teams',
    pattern: '/teams',
    fallback: 'team-list',
    searchKeywords: 'teams compositions squad party',
    meta: {
      title: 'Teams',
      description:
        'Browse and build teams with faction and content-type filters, Wyrmspell loadouts, and character roster details.',
    },
  },
  {
    id: 'savedTeam',
    pattern: '/teams/saved/:teamSlug',
    kind: 'detail',
    meta: {
      title: 'Saved Team',
      description:
        'View a saved custom team with member roles, substitutes, and faction context.',
    },
  },
  {
    id: 'teamDetail',
    pattern: '/teams/:teamId/:teamSlug',
    kind: 'detail',
    meta: {
      title: 'Team Details',
      description:
        'Detailed team page covering member roles, substitutes, faction context, and practical usage tips.',
    },
  },
  {
    id: 'account',
    pattern: '/account',
    meta: {
      title: 'Account',
      description: 'Manage linked identities and community publications.',
    },
  },
  {
    id: 'moderation',
    pattern: '/moderation',
    meta: {
      title: 'Moderation',
      description: 'Review reported community teams and tier lists.',
    },
  },
  {
    id: 'codes',
    pattern: '/codes',
    fallback: 'code-list',
    searchKeywords: 'codes redeem rewards gifts',
    meta: {
      title: 'Codes',
      description:
        'Find redeem codes with active status tracking and quick reward-claim reference.',
    },
  },
  {
    id: 'events',
    pattern: '/events',
    fallback: 'event-list',
    searchKeywords: 'events special event in-game limited time active',
    meta: {
      title: 'Events',
      description:
        'Browse active and past in-game events for Dragon Traveler, automatically synced from the App Store.',
    },
  },
  {
    id: 'usefulLinks',
    pattern: '/toolbox/useful-links',
    fallback: 'useful-links',
    searchKeywords: 'links resources tools external',
    meta: {
      title: 'Useful Links',
      description:
        'Access curated official and community links for tools, channels, and external references.',
    },
  },
  {
    id: 'changelog',
    pattern: '/changelog',
    fallback: 'changelog',
    meta: {
      title: 'Changelog',
      description:
        'Track documented wiki updates, including data refreshes and feature improvements.',
    },
  },
  {
    id: 'faq',
    pattern: '/toolbox/faq',
    searchKeywords: 'faq frequently asked questions help guide beginner',
    meta: {
      title: 'FAQ',
      description:
        'Frequently asked questions covering wiki usage, beginner priorities, and practical progression guidance.',
    },
  },
  {
    id: 'beginnerQa',
    pattern: '/toolbox/beginner-qa',
    searchKeywords: 'beginner guide faq help tutorial',
    meta: {
      title: 'Beginner Q&A Guide',
      description:
        'Translated beginner guide covering summoning priorities, diamond spending, progression mechanics, events, guild tips, and affection gifts.',
    },
  },
  {
    id: 'starUpgradeCalculator',
    pattern: '/toolbox/star-upgrade-calculator',
    searchKeywords: 'calculator star upgrade cost',
    meta: {
      title: 'Star Upgrade Calculator',
      description:
        'Plan star upgrades by calculating copy and shard requirements before you invest resources.',
    },
  },
  {
    id: 'mythicSummonCalculator',
    pattern: '/toolbox/mythic-summon-calculator',
    searchKeywords:
      'mythic summon calculator pull rates rewards pity simulation',
    meta: {
      title: 'Mythic Summon Calculator',
      description:
        'Estimate Mythic Summon outcomes and required pulls to budget resources with confidence.',
    },
  },
  {
    id: 'diamondCalculator',
    pattern: '/toolbox/diamond-calculator',
    searchKeywords: 'diamond calculator income spending budget projection',
    meta: {
      title: 'Diamond Calculator',
      description:
        'Estimate recurring diamond gain and spend, forecast run-out timing, and project your balance by date.',
    },
  },
  {
    id: 'shovelEvent',
    pattern: '/toolbox/shovel-event',
    searchKeywords: 'shovel event digging layers efficiency bombs rockets',
    meta: {
      title: 'Shovel Event Guide',
      description:
        'Optimize Shovel Event progression with milestone planning, route choices, and reward efficiency tips.',
    },
  },
  {
    id: 'dtdle',
    pattern: '/toolbox/dtdle',
    meta: {
      title: 'DTdle',
      description:
        'Guess the daily Dragon Traveler character across four modes: classic stat hints, quote, ability, or illustration.',
    },
  },
  {
    id: 'notFound',
    pattern: '*',
    meta: {
      title: 'Page Not Found',
      description:
        'The requested page could not be found. Explore the Dragon Traveler Wiki from the homepage.',
    },
  },
] as const satisfies readonly RouteMetaEntry[];

export type RouteId = (typeof ROUTE_CATALOG)[number]['id'];
export type RouteCatalogEntry = (typeof ROUTE_CATALOG)[number];

// Retained for metadata generation and existing external scripts.
export const ROUTE_META: readonly RouteCatalogEntry[] = ROUTE_CATALOG;

export const ROUTE_PATH = Object.fromEntries(
  ROUTE_CATALOG.map(({ id, pattern }) => [id, pattern]),
) as Record<RouteId, string>;

export function getRouteById(id: RouteId): RouteCatalogEntry {
  const route = ROUTE_CATALOG.find((entry) => entry.id === id);
  if (!route) throw new Error(`Unknown route id: ${id}`);
  return route;
}

export function getRouteMetaEntry(
  pathname: string,
): RouteCatalogEntry | undefined {
  return ROUTE_CATALOG.find(
    ({ pattern }) =>
      pattern !== '*' &&
      matchPath({ path: pattern, end: true }, pathname) !== null,
  );
}

export function isDetailRoute(pathname: string): boolean {
  const route = getRouteMetaEntry(pathname);
  return Boolean(route && 'kind' in route && route.kind === 'detail');
}

export function getRouteFallbackKind(pathname: string): RouteFallbackKind {
  const route = getRouteMetaEntry(pathname);
  if (!route) return 'content';
  if ('fallback' in route) return route.fallback;
  return 'kind' in route && route.kind === 'detail' ? 'detail' : 'content';
}

export function getNavigationPatterns(routeId: RouteId): string[] {
  return ROUTE_CATALOG.filter(
    (entry) =>
      entry.id === routeId ||
      ('navigationParent' in entry && entry.navigationParent === routeId),
  ).map(({ pattern }) => pattern);
}
