# Source Architecture

## Directory Structure

```
src/
├── assets/          # Image helper functions (getPortrait, getGearIcon, etc.)
├── components/
│   ├── common/      # Shared application components (RichText, LastUpdated, entity helpers, etc.)
│   ├── layout/      # Page-level shells (AppLayout, ListPageShell, FilteredListShell, etc.)
│   ├── tools/       # Floating tools (SearchModal, ExportButton, SuggestModal, etc.)
│   └── ui/          # Low-level UI primitives (ClassTag, SafeImage, etc.)
├── constants/       # App-wide constants (colors, styles, ui, glass, route-meta, nav-items, ...)
├── contexts/        # React contexts (SearchDataContext, gradient theme, UI opacity, etc.)
├── features/        # Feature modules — each is self-contained
│   ├── characters/
│   ├── community/   # Community accounts, publishing, and moderation client (has its own README)
│   ├── teams/
│   ├── tier-list/
│   └── wiki/        # All wiki database features (artifacts, gear, relics, wyrms, etc.)
├── hooks/           # Shared generic hooks (useDataFetch, useFilters, usePagination, etc.)
├── pages/           # Route-focused components; reusable domain code belongs in features/
├── routes/          # AppRoutes.tsx — all React Router route definitions
├── styles/          # Global CSS
├── types/           # Shared TypeScript types not owned by a feature
└── utils/           # Shared utility functions
```

## Feature Modules

Each feature under `features/` is self-contained:

```
features/wiki/relics/
├── components/      # UI components specific to this feature
├── types.ts         # TypeScript types
├── form-fields.ts   # (optional) filter/form field definitions
└── utils.ts         # (optional) feature-specific utility functions
```

Data-fetching hooks for wiki entities live in `features/wiki/hooks/use-wiki-data.ts`. Hooks for other features live alongside their feature (e.g. `features/characters/hooks/use-characters-data.ts`).

## Data Layer

Game data is served from localized `data/<locale>/*.json` and shared
`data/global/*.json` files. The private data repository is read directly in
development and copied into the production artifact during deployment.

**`useDataFetch<T>(path, initial)`** — the core primitive. Fetches a JSON file, caches the result in a module-level `Map` so repeated calls (including across components) share one request, and returns `{ data, loading, error, retry }`. Pages should render `DataFetchError` with `retry` when `error` is set (or `PageFetchError` when the page's primary data failed) rather than treating a failed load as empty or not found.

**Feature hooks** wrap `useDataFetch` with a fixed path and type, e.g.:

```ts
// features/wiki/hooks/use-wiki-data.ts
export function useRelics() {
  return useDataFetch<Relic[]>('data/relic.json', []);
}
```

**`SearchDataContext`** (`contexts/search-data-context.tsx`) fetches the datasets
needed by global search after the search UI is first requested. It consumes the
feature hooks, so data file paths remain defined in one place.

Fetched entity collections are checked at runtime for their expected top-level
shape before being exposed to components. The data pipeline remains responsible
for full schema validation.

## Community-Published Content

Teams and tier lists are **not** static data-layer content — they're published by
signed-in users through the Cloudflare Worker in [`community-api/`](../community-api/README.md).
The client lives in `features/community/`, and its architecture (data hooks,
pagination, cards, moderation tools, the site-wide tier list reference) is
documented in [`features/community/README.md`](features/community/README.md).
`features/teams/hooks/use-teams-data.ts` and
`features/tier-list/hooks/use-tier-list-data.ts` wrap its hooks; follow that
pattern for any future community content type.

## Adding a New Database Page

Checklist for adding a new dataset (e.g. "Mounts"):

1. **Types** — create `features/wiki/mounts/types.ts`
2. **Data hook** — add `useMounts()` to `features/wiki/hooks/use-wiki-data.ts`
3. **Components** — create `features/wiki/mounts/components/` with list card and detail components
4. **Pages** — create `pages/mounts/ListPage.tsx` (and `DetailPage.tsx` if needed), keeping reusable domain logic in the feature folder
5. **Route catalog** — add a stable route ID, path, metadata, optional search keywords, and optional fallback kind to `ROUTE_CATALOG` in `constants/route-meta.ts`; mount the lazy page through `ROUTE_PATH` in `routes/AppRoutes.tsx`
6. **Navigation** — add the catalog route ID through `routeLeaf()` in `constants/nav-items.ts`
7. **Search** — add to `SearchDataContextValue`, load it in `SearchDataProvider`, and add its typed adapter to `features/search/search-registry.ts`

## Key Shared Hooks

| Hook                  | Purpose                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| `useDataFetch`        | Fetch + cache a JSON file                                                     |
| `useFilteredPageData` | Filter, sort, paginate a dataset for list pages                               |
| `useFilters`          | Filter state with localStorage persistence                                    |
| `useViewMode`         | Grid/list view persistence; phones start in grid view without a stored choice |
| `usePagination`       | Page/offset state; resets on filter or size change                            |
| `useSortState`        | Sort column/direction state with localStorage persistence                     |
| `useAdjacentItems`    | Previous/next entries for detail page navigation                              |
| `useTabParam`         | Tab state synced to a URL search param (e.g. `?tab=`)                         |
| `useDarkMode`         | Current color scheme                                                          |
| `useIsMobile`         | Responsive breakpoint                                                         |

## Styling Conventions

- Use `var(--mantine-color-*)` for theme-aware colors; never hardcode hex values
- App content surfaces: prefer `StaticSurface` or `InteractiveSurface` from `components/ui/Surface`
- Plain bordered Mantine `Paper`/`Card` surfaces are also themed by global CSS, but the surface wrappers make intent clearer
- Non-`Paper` surfaces such as sticky toolbars or custom buttons should use the `dt-themed-surface` class
- Glass chrome/overlays: use `getGlassStyles(isDark)` from `constants/glass`
- Lore or translucent detail panels: use `getLoreGlassStyles(isDark)` from `constants/glass`
- The Settings > Opacity > UI Surfaces slider controls `--dt-surface-opacity`; semantic state colors, media overlays, status badges, and data-color encodings should not use that variable
- Palette-aware accent controls should use `useGradientAccent()` or Mantine primary-color variants rather than hard-coded color names
- Quality-tier border colors: `QUALITY_BORDER_COLOR[quality]` from `constants/colors`
- Row/position colors: red = Front, orange = Middle, blue = Back

Import and barrel rules are in [`docs/import-policy.md`](../docs/import-policy.md).
Formatting conventions are defined in the repository `.editorconfig` and
enforced by `npm run format:check`. Run `npm run check` before opening a pull
request to execute formatting, lint, tests, and type checking together.

## Clickable cards

Community cards (`TeamCard`, `TierListCard`) use the stretched-link pattern: the
title is a real `<a>` (`CardTitle`) whose `::after` covers the card
(`.dt-link-card` in `styles/interactions.css`), so they're keyboard-focusable and
open in a new tab like any link without a `role="link"` container wrapping other
controls. Anything that must stay separately clickable inside a card (actions,
author link, character portraits) opts in with `.dt-link-card__above`.

## Buttons

Button styles carry a fixed meaning, so pick by emphasis rather than looks:

- **Primary** — `filled`, accent color: the one main action of a dialog or form
  (Publish, Submit report).
- **Secondary** — `light`, accent color: page-level actions (Edit, Remix, Export Image).
- **Tertiary** — `subtle`: quiet inline actions that repeat (Report, Unlink,
  Withdraw, Expand). These intentionally have no background at rest, only a hover
  fill, so a row of them doesn't compete with the content.
- **Cancel** — `outline`, accent color.
- **Destructive** — `red`; a confirmation's confirm button is `filled`, an inline
  Delete is `light` (`subtle` on compact cards), and moderator "Suspend" is
  `outline`. Reversible moderator actions are softer: Hide is `light` orange,
  Restore `light` teal, Dismiss `light` gray.
- **Toggle groups** (view mode, layout) — `filled` for the selected option,
  `default` for the rest, with `aria-pressed`.

Icon-only buttons (`ActionIcon`) always need an `aria-label`.

## Loading skeletons

All skeleton layouts live in `components/layout/PageLoadingSkeleton.tsx` and are
wrapped in `LoadingRegion` (hidden from assistive tech, one announced status).
Community-specific ones (`CommunityCardsLoading`, `CommunityBrowseLoading`,
`ProfilePageLoading`, `AccountPageLoading`, `TierListPageLoading`) size their
placeholders from `COMMUNITY_CARD_HEIGHT` so pages don't jump when content
arrives; update those heights if a card's layout changes. Wrap any custom
placeholder in `LoadingRegion` too.

## Page Layout

Container widths come from `PAGE_WIDTH` in `constants/ui.ts`, chosen by page type
so pages of the same kind line up:

- **`PAGE_WIDTH.WIDE`** — grids, tables, and detail layouts (list and detail pages, tools, community pages)
- **`PAGE_WIDTH.READING`** — prose-heavy pages (FAQ, guides, changelog, policies), kept narrow for line length
- **`PAGE_WIDTH.NARROW`** — single messages and small forms (not found, sign-in prompts)

Loading skeletons and heroes use the same widths so a page doesn't shift when it
loads. Grids use the shared column constants: `CARD_GRID_COLS` for entity summary
cards, `CHARACTER_GRID_COLS` for portrait grids, `BUILDER_GRID_COLS` for builder
pools and tier rows, and `CODE_GRID_COLS` / `EVENT_GRID_COLS` for those trackers. Code that derives page sizes from the column count mirrors
those breakpoints with `BREAKPOINTS` media queries, so keep them in sync.

Page titles use `ListPageHeader` (title, optional `description`, timestamp, and
actions as children). Long pages can add `SectionJumpNav`, a sticky row of links to
section ids that highlights the current section.

## Page Shells

Most list pages use one of two layout shells:

- **`ListPageShell`** — handles loading, errors (`DataFetchError` with retry), and empty data (`EmptyState`); callers provide a page-appropriate `loadingFallback`
- **`FilteredListShell`** — list with a toolbar (count, view toggle, filter popover), grid/table content, empty state, and pagination; powered by `useFilteredPageData`

Detail pages for static wiki content use `DetailPageHero` (with `DetailPageTitle`)

- `DetailPageNavigation` for the top section, with `useAdjacentItems` resolving the
  previous/next entries. Community-published detail pages (`TeamPage`, `TierListPage`)
  don't — they use their own header (`TeamHeroSection`, or a plain title for tier
  lists) and skip prev/next navigation, since an open-ended, popularity-sorted
  public catalog doesn't have a stable "next item" the way a fixed wiki dataset does.
