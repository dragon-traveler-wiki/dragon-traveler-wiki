import type { ComponentType } from 'react';
import { matchPath } from 'react-router';
import {
  getNavigationPatterns,
  getRouteById,
  ROUTE_CATALOG,
  type RouteId,
} from './route-meta';
import {
  IoBook,
  IoCalculatorOutline,
  IoCalendar,
  IoConstructOutline,
  IoEllipsisHorizontalOutline,
  IoGift,
  IoHome,
  IoServer,
  IoShield,
  IoTrophy,
} from 'react-icons/io5';

export type NavLeaf = { label: string; path: string };
export type NavGroup = {
  label: string;
  icon?: ComponentType;
  children: NavLeaf[];
};
export type NavItem = {
  label: string;
  path?: string;
  icon?: ComponentType;
  children?: (NavLeaf | NavGroup)[];
};

export function isNavGroup(child: NavLeaf | NavGroup): child is NavGroup {
  return 'children' in child;
}

function routeLeaf(routeId: RouteId, label?: string): NavLeaf {
  const route = getRouteById(routeId);
  return { label: label ?? route.meta.title, path: route.pattern };
}

export const NAV_ITEMS: NavItem[] = [
  { ...routeLeaf('home'), icon: IoHome },
  {
    label: 'Database',
    icon: IoServer,
    children: [
      routeLeaf('artifacts'),
      routeLeaf('characters'),
      routeLeaf('gear'),
      routeLeaf('howlkins'),
      routeLeaf('noblePhantasms'),
      routeLeaf('relics'),
      routeLeaf('resources'),
      routeLeaf('subclasses'),
      routeLeaf('statusEffects'),
      routeLeaf('wyrms'),
      routeLeaf('wyrmspells'),
    ],
  },
  {
    label: 'Toolbox',
    icon: IoConstructOutline,
    children: [
      {
        label: 'Calculators',
        icon: IoCalculatorOutline,
        children: [
          routeLeaf('starUpgradeCalculator'),
          routeLeaf('mythicSummonCalculator'),
          routeLeaf('diamondCalculator'),
        ],
      },
      {
        label: 'Strategy Guides',
        icon: IoBook,
        children: [
          routeLeaf('beginnerQa', 'Beginner Q&A'),
          routeLeaf('shovelEvent'),
        ],
      },
      {
        label: 'Misc',
        icon: IoEllipsisHorizontalOutline,
        children: [
          routeLeaf('faq'),
          routeLeaf('usefulLinks'),
          routeLeaf('dtdle'),
          routeLeaf('changelog'),
        ],
      },
    ],
  },
  { ...routeLeaf('tierList'), icon: IoTrophy },
  { ...routeLeaf('teams'), icon: IoShield },
  { ...routeLeaf('events'), icon: IoCalendar },
  { ...routeLeaf('codes'), icon: IoGift },
];

export function isNavPathActive(navPath: string, pathname: string) {
  const route = ROUTE_CATALOG.find(({ pattern }) => pattern === navPath);
  const patterns = route
    ? [...getNavigationPatterns(route.id), `${navPath}/*`]
    : [navPath, `${navPath}/*`];
  return patterns.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );
}

export function groupHasActiveChild(group: NavGroup, pathname: string) {
  return group.children.some((leaf) => isNavPathActive(leaf.path, pathname));
}

export function childIsActive(child: NavLeaf | NavGroup, pathname: string) {
  return isNavGroup(child)
    ? groupHasActiveChild(child, pathname)
    : isNavPathActive(child.path, pathname);
}

/** Labels (or `Parent>Child` compound keys) of nav groups/subgroups that contain the active route. */
export function getActiveGroupKeys(pathname: string) {
  const keys: string[] = [];
  for (const item of NAV_ITEMS) {
    if (!item.children) continue;
    if (item.children.some((child) => childIsActive(child, pathname))) {
      keys.push(item.label);
    }
    for (const child of item.children) {
      if (isNavGroup(child) && groupHasActiveChild(child, pathname)) {
        keys.push(`${item.label}>${child.label}`);
      }
    }
  }
  return keys;
}
