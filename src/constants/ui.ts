/**
 * UI constants for consistent styling across the application
 */

// Character card sizes
export const CHARACTER_CARD = {
  PORTRAIT_SIZE: 80,
  BORDER_WIDTH: 3,
} as const;

// Character page hero
export const CHARACTER_HERO = {
  PORTRAIT_SIZE: 180,
  MIN_HEIGHT: 350,
  BORDER_WIDTH: 4,
  BLUR_AMOUNT: '20px',
  BRIGHTNESS: 0.4,
} as const;

// Illustration preview panels (character detail page, preview modal trigger)
export const ILLUSTRATION_PANEL = {
  HEIGHT: 420,
} as const;

// Image sizes
export const IMAGE_SIZE = {
  ICON_XS: 12,
  ICON_SM: 14,
  ICON_MD: 16,
  ICON_LG: 18,
  PORTRAIT_SM: 40,
  CARD_ICON_SM: 48,
  CARD_ICON: 64,
  DETAIL_ICON: 72,
} as const;

/** Debounce delay (ms) before committing a text input value to state. */
export const INPUT_COMMIT_DELAY_MS = 150;

// Transitions
export const TRANSITION = {
  FAST: '150ms',
  NORMAL: '250ms',
  SLOW: '350ms',
  EASE: 'ease',
} as const;

// Z-index layers
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  FIXED: 300,
  MODAL_BACKDROP: 400,
  MODAL: 500,
  POPOVER: 600,
  TOOLTIP: 700,
} as const;

// Grid breakpoints for character lists
export const CHARACTER_GRID_COLS = {
  base: 2,
  xs: 3,
  sm: 4,
  md: 6,
} as const;

export const CHARACTER_GRID_SPACING = 12;

// Sidebar dimensions
export const SIDEBAR = {
  WIDTH_EXPANDED: 240,
  WIDTH_COLLAPSED: 70,
} as const;

export const HEADER_HEIGHT = {
  MOBILE: 64,
  DESKTOP: 72,
} as const;

// Storage keys
export const PAGE_SIZE = 50;

export const BREAKPOINTS = {
  COMPACT: '(max-width: 380px)',
  MOBILE: '(max-width: 768px)',
  XS: '(min-width: 36em)',
  DESKTOP: '(min-width: 48em)',
  MD: '(min-width: 62em)',
  LG: '(min-width: 75em)',
} as const;

/** Container width used by the team/tier-list builder pages when the character
 * pool is shown side-by-side, so the extra column has real room to use. */
export const BUILDER_SIDE_LAYOUT_CONTAINER_SIZE = '100rem';

/** WCAG minimum touch target height, also used as nav item height */
export const NAV_ITEM_HEIGHT = 44;

export const POPOVER_MAX_WIDTH = 320;

/** Max width for badge/icon popovers (status effects, resources). */
export const POPOVER_BADGE_WIDTH = 280;

export const STORAGE_KEY = {
  LOCALE: 'dragon-traveler-wiki:locale',
  COLOR_SCHEME: 'mantine-color-scheme-value',
  CHARACTER_VIEW_MODE: 'characters:viewMode',
  CHARACTER_FILTERS: 'characters:filters',
  CHARACTER_TIER_LIST_REFERENCE: 'characters:tierListReference',
  EVENT_VIEW_MODE: 'events:viewMode',
  EVENT_FILTERS: 'events:filters',
  STATUS_EFFECT_VIEW_MODE: 'status-effects:viewMode',
  STATUS_EFFECT_FILTERS: 'status-effects:filters',
  WYRMSPELL_VIEW_MODE: 'wyrmspells:viewMode',
  WYRMSPELL_FILTERS: 'wyrmspells:filters',
  NOBLE_PHANTASM_VIEW_MODE: 'noble-phantasms:viewMode',
  NOBLE_PHANTASM_FILTERS: 'noble-phantasms:filters',
  NOBLE_PHANTASM_USAGE_QUALITY_FILTER: 'noble-phantasms:usageQualityFilter',
  NOBLE_PHANTASM_USAGE_CHARACTERS: 'noble-phantasms:usageCharacters',
  NOBLE_PHANTASM_USAGE_SEARCH: 'noble-phantasms:usageSearch',
  NOBLE_PHANTASM_USAGE_SORT: 'noble-phantasms:usageSort',
  RESOURCE_VIEW_MODE: 'resources:viewMode',
  RESOURCE_FILTERS: 'resources:filters',
  SUBCLASS_VIEW_MODE: 'subclasses:viewMode',
  SUBCLASS_FILTERS: 'subclasses:filters',
  SUBCLASS_USAGE_QUALITY_FILTER: 'subclasses:usageQualityFilter',
  SUBCLASS_USAGE_CLASSES: 'subclasses:usageClasses',
  SUBCLASS_USAGE_SEARCH: 'subclasses:usageSearch',
  SUBCLASS_USAGE_SORT: 'subclasses:usageSort',
  HOWLKIN_VIEW_MODE: 'howlkins:viewMode',
  HOWLKIN_FILTERS: 'howlkins:filters',
  TEAMS_VIEW_MODE: 'teams:viewMode',
  TEAMS_FILTERS: 'teams:filters',
  TEAMS_SEARCH: 'teams:search',
  TEAMS_SORT: 'teams:sort',
  TEAMS_BUILDER_DRAFT: 'teams:builderDraft',
  TIER_LIST_VIEW_MODE: 'tier-list:viewMode',
  TIER_LIST_SEARCH: 'tier-list:search',
  TIER_LIST_SORT: 'tier-list:sort',
  TIER_LIST_BUILDER_DRAFT: 'tier-list:builderDraft',
  CODES_VIEW_MODE: 'codes:viewMode',
  TIER_LIST_FILTERS: 'tier-list:filters',
  CODES_REWARDS_OPEN: 'codes:rewardsOpen',
  REDEEMED_CODES: 'redeemedCodes',
  ARTIFACT_VIEW_MODE: 'artifacts:viewMode',
  ARTIFACT_FILTERS: 'artifacts:filters',
  GEAR_VIEW_MODE: 'gear:viewMode',
  GEAR_FILTERS: 'gear:filters',
  GEAR_SET_SEARCH: 'gear-sets:search',
  GEAR_USAGE_QUALITY_FILTER: 'gear:usageQualityFilter',
  GEAR_USAGE_SEARCH: 'gear:usageSearch',
  GEAR_USAGE_SORT: 'gear:usageSort',
  GOLDEN_ALLIANCE_SEARCH: 'golden-alliances:search',
  CHARACTER_SORT: 'characters:sort',
  RESOURCE_SORT: 'resources:sort',
  ARTIFACT_SORT: 'artifacts:sort',
  GEAR_SORT: 'gear:sort',
  RELIC_VIEW_MODE: 'relics:viewMode',
  RELIC_FILTERS: 'relics:filters',
  RELIC_SORT: 'relics:sort',
  RELIC_ORACLE_SCROLL_SEARCH: 'relics:oracleScrollSearch',
  HOWLKIN_SORT: 'howlkins:sort',
  WYRMSPELL_SORT: 'wyrmspells:sort',
  WYRM_VIEW_MODE: 'wyrms:viewMode',
  WYRM_FILTERS: 'wyrms:filters',
  WYRM_SORT: 'wyrms:sort',
  NOBLE_PHANTASM_SORT: 'noble-phantasms:sort',
  STATUS_EFFECT_SORT: 'status-effects:sort',
  SUBCLASS_SORT: 'subclasses:sort',
  SIDEBAR_COLLAPSED: 'sidebar:collapsed',
  NAV_LAYOUT: 'ui:navLayout',
  TEAMS_BUILDER_SLOTS: 'teams:builderSlots',
  TIER_LIST_BUILDER_SLOTS: 'tier-list:builderSlots',
  TEAMS_MY_SAVED: 'teams:mySaved',
  TIER_LIST_MY_SAVED: 'tier-list:mySaved',
  HOME_BANNER: 'home:banner',
  HOME_BANNER_GLOBAL: 'home:bannerGlobal',
  HOME_BANNER_SLOW_SCROLL: 'home:bannerSlowScroll',
  HOME_BANNER_FAVORITES_ONLY: 'home:bannerFavoritesOnly',
  FAVORITE_ILLUSTRATIONS: 'characters:favoriteIllustrations',
  CHARACTER_SKINS: 'characters:selectedSkins',
  CHARACTER_SKINS_ENABLED: 'characters:skinsEnabled',
  GRADIENT_PALETTE: 'ui:gradientPalette',
  CUSTOM_GRADIENT_COLORS: 'ui:customGradientColors',
  UI_BANNER_MEDIA_OPACITY: 'ui:bannerMediaOpacity',
  UI_BANNER_OVERLAY_OPACITY: 'ui:bannerOverlayOpacity',
  UI_SURFACE_OPACITY: 'ui:surfaceOpacity',
  CHARACTER_OWNERSHIP: 'characters:ownership',
  UI_CHARACTER_TRACKING_ENABLED: 'ui:characterTrackingEnabled',
  UI_GRAY_UNOWNED: 'ui:grayUnowned',
  UI_SHOW_CHARACTER_TIERS: 'ui:showCharacterTiers',
  BUBBLE_CHART_CONFIG: 'characters:bubbleChartConfig',
  RECENT_SEARCHES: 'search:recent',
  BUILDER_POOL_LAYOUT: 'builder:poolLayout',
  DTDLE_STATE: 'dtdle:state',
  DTDLE_STATS: 'dtdle:stats',
  DTDLE_QUOTE_STATE: 'dtdle:quote:state',
  DTDLE_QUOTE_STATS: 'dtdle:quote:stats',
  DTDLE_ABILITY_STATE: 'dtdle:ability:state',
  DTDLE_ABILITY_STATS: 'dtdle:ability:stats',
  DTDLE_ABILITY_GRAYSCALE: 'dtdle:ability:grayscale',
  DTDLE_ABILITY_ROTATE: 'dtdle:ability:rotate',
  DTDLE_ILLUSTRATION_STATE: 'dtdle:illustration:state',
  DTDLE_ILLUSTRATION_STATS: 'dtdle:illustration:stats',
} as const;
