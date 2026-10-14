# Development

See the [README](../README.md) for quick start and documentation links. General contribution policy lives in the [organization guide](https://github.com/dragon-traveler-wiki/.github/blob/main/CONTRIBUTING.md).

## Setup and checks

Run the commands below from the repository root. Use Node.js 22.18 or newer (CI uses Node.js 24) and install the locked dependencies with `npm ci`.

```sh
npm run check
```

This is the check run by CI. It runs `format:check`, `lint`, `test`, and `typecheck` in sequence; each is also available as its own script. Use `npm run format` to apply formatting. Formatting conventions are defined in `.editorconfig` and `.prettierrc.json`.

Use `npm run dev` for development (`http://localhost:5173`) and `npm run preview` to inspect a production build. `npm run build:analyze` writes a bundle report. When changing dependencies, update and commit `package-lock.json` alongside `package.json`. Dependabot checks npm dependencies and GitHub Actions weekly, with packages that must upgrade together grouped.

### Local data

The dev server and production build read data from `DATA_DIR` and assets from `ASSETS_DIR`. Copy `.env.example` to `.env.local`; its defaults expect [dragon-traveler-data](https://github.com/dragon-traveler-wiki/dragon-traveler-data) cloned alongside this repository. Repository-relative paths are resolved from the repository root, and shell or CI variables take precedence over env files.

### Community API

Public teams and tier lists are served by the Worker in `community-api/`, which has its own [README](../community-api/README.md) covering setup, configuration, endpoints, deployment, and operations. To work on publishing, accounts, or moderation locally:

```sh
cd community-api
npm ci
npx wrangler d1 migrations apply dragon-traveler-community --local
npm run dev        # http://localhost:8787
npm run seed       # optional: dummy content for manual testing
```

The frontend reads `VITE_API_BASE_URL` and `VITE_TURNSTILE_SITE_KEY` from `.env.local`; `.env.example` has local defaults, including Cloudflare's published Turnstile test key.

## Architecture

```text
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
community-api/       # Cloudflare Worker + D1 for community content
scripts/             # Build-time scripts (version, env loading, route pages, Pages validation)
tests/               # Frontend tests
public/              # Static assets copied as-is to dist
```

Import and barrel rules are in the [import policy](import-policy.md).

### Feature modules

Each feature under `features/` is self-contained:

```text
features/wiki/relics/
├── components/      # UI components specific to this feature
├── types.ts         # TypeScript types
├── form-fields.ts   # (optional) filter/form field definitions
└── utils.ts         # (optional) feature-specific utility functions
```

Data-fetching hooks for wiki entities live in `features/wiki/hooks/use-wiki-data.ts`. Hooks for other features live alongside their feature (e.g. `features/characters/hooks/use-characters-data.ts`).

### Routes

| Route                                                            | Page                                     |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `/`                                                              | Home                                     |
| `/artifacts` / `/artifacts/:name`                                | Artifact list / detail                   |
| `/characters` / `/characters/:name`                              | Character list / detail                  |
| `/gear` / `/gear-sets/:setName`                                  | Gear list / gear set detail              |
| `/relics` / `/oracle-scrolls/:scrollName`                        | Relic list / oracle scroll detail        |
| `/howlkins` / `/howlkins/:allianceSlug`                          | Howlkin list / golden alliance detail    |
| `/noble-phantasms` / `/noble-phantasms/:name`                    | Noble phantasm list / detail             |
| `/wyrms` / `/wyrms/:name`                                        | Wyrm list / detail                       |
| `/wyrmspells` / `/wyrmspells/:name`                              | Wyrmspell list / detail                  |
| `/subclasses`                                                    | Subclass list                            |
| `/status-effects`                                                | Status effects list                      |
| `/resources`                                                     | Resources directory                      |
| `/toolbox/useful-links`                                          | Community links directory                |
| `/tier-list` / `/tier-list/:tierListId/:tierListSlug`            | Tier list viewer/builder / public detail |
| `/teams` / `/teams/:teamId/:teamSlug` / `/teams/saved/:teamSlug` | Team list / public detail / saved team   |
| `/account` / `/moderation`                                       | Community account / moderator queue      |
| `/profile/:userId`                                               | Public community profile                 |
| `/community-guidelines` / `/privacy`                             | Community guidelines / privacy policy    |
| `/codes`                                                         | Redemption codes tracker                 |
| `/events`                                                        | Game events tracker                      |
| `/changelog`                                                     | Changelog                                |
| `/toolbox/beginner-qa`                                           | Beginner Q&A                             |
| `/toolbox/faq`                                                   | FAQ                                      |
| `/toolbox/star-upgrade-calculator`                               | Star upgrade calculator                  |
| `/toolbox/mythic-summon-calculator`                              | Mythic summon calculator                 |
| `/toolbox/diamond-calculator`                                    | Diamond calculator                       |
| `/toolbox/shovel-event`                                          | Shovel event guide                       |
| `/toolbox/dtdle`                                                 | Daily character guessing game            |

Routes are defined in `ROUTE_CATALOG` (`constants/route-meta.ts`) and mounted in `routes/AppRoutes.tsx`. After the Vite build, `scripts/generate-route-pages.mjs` writes a static HTML page with each route's metadata, so direct links work on GitHub Pages and carry page-specific previews.

## Data integration

Game data is served from localized `data/<locale>/*.json` and shared `data/global/*.json` files. The private data repository is read directly in development and copied into the production artifact during deployment. Its Pydantic schemas define the data contract; update the matching feature `types.ts` and runtime checks together when that contract changes.

**`useDataFetch<T>(path, initial)`** — the core primitive. Fetches a JSON file, caches the result in a module-level `Map` so repeated calls (including across components) share one request, and returns `{ data, loading, error, retry }`. Pages should render `DataFetchError` with `retry` when `error` is set (or `PageFetchError` when the page's primary data failed) rather than treating a failed load as empty or not found.

**Feature hooks** wrap `useDataFetch` with a fixed path and type, e.g.:

```ts
// features/wiki/hooks/use-wiki-data.ts
export function useRelics() {
  return useDataFetch<Relic[]>('data/relic.json', []);
}
```

**`SearchDataContext`** (`contexts/search-data-context.tsx`) fetches the datasets needed by global search after the search UI is first requested. It consumes the feature hooks, so data file paths remain defined in one place.

Fetched entity collections are checked at runtime for their expected top-level shape before being exposed to components. The data pipeline remains responsible for full schema validation.

### Community-published content

Teams and tier lists are **not** static data-layer content — they're published by signed-in users through the Cloudflare Worker in [`community-api/`](../community-api/README.md). The client lives in `features/community/`, and its architecture (data hooks, pagination, cards, moderation tools, the site-wide tier list reference) is documented in [`features/community/README.md`](../src/features/community/README.md). `features/teams/hooks/use-teams-data.ts` and `features/tier-list/hooks/use-tier-list-data.ts` wrap its hooks; follow that pattern for any future community content type.

### Adding a new database page

Checklist for adding a new dataset (e.g. "Mounts"):

1. **Types** — create `features/wiki/mounts/types.ts`
2. **Data hook** — add `useMounts()` to `features/wiki/hooks/use-wiki-data.ts`
3. **Components** — create `features/wiki/mounts/components/` with list card and detail components
4. **Pages** — create `pages/mounts/ListPage.tsx` (and `DetailPage.tsx` if needed), keeping reusable domain logic in the feature folder
5. **Route catalog** — add a stable route ID, path, metadata, optional search keywords, and optional fallback kind to `ROUTE_CATALOG` in `constants/route-meta.ts`; mount the lazy page through `ROUTE_PATH` in `routes/AppRoutes.tsx`
6. **Navigation** — add the catalog route ID through `routeLeaf()` in `constants/nav-items.ts`
7. **Search** — add to `SearchDataContextValue`, load it in `SearchDataProvider`, and add its typed adapter to `features/search/search-registry.ts`

### Key shared hooks

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

## UI conventions

### Styling

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

### Clickable cards

Community cards (`TeamCard`, `TierListCard`) use the stretched-link pattern: the title is a real `<a>` (`CardTitle`) whose `::after` covers the card (`.dt-link-card` in `styles/interactions.css`), so they're keyboard-focusable and open in a new tab like any link without a `role="link"` container wrapping other controls. Anything that must stay separately clickable inside a card (actions, author link, character portraits) opts in with `.dt-link-card__above`.

### Buttons

Button styles carry a fixed meaning, so pick by emphasis rather than looks:

- **Primary** — `filled`, accent color: the one main action of a dialog or form (Publish, Submit report).
- **Secondary** — `light`, accent color: page-level actions (Edit, Remix, Export Image).
- **Tertiary** — `subtle`: quiet inline actions that repeat (Report, Unlink, Withdraw, Expand). These intentionally have no background at rest, only a hover fill, so a row of them doesn't compete with the content.
- **Cancel** — `outline`, accent color.
- **Destructive** — `red`; a confirmation's confirm button is `filled`, an inline Delete is `light` (`subtle` on compact cards), and moderator "Suspend" is `outline`. Reversible moderator actions are softer: Hide is `light` orange, Restore `light` teal, Dismiss `light` gray.
- **Toggle groups** (view mode, layout) — `filled` for the selected option, `default` for the rest, with `aria-pressed`.

Icon-only buttons (`ActionIcon`) always need an `aria-label`.

### Loading skeletons

All skeleton layouts live in `components/layout/PageLoadingSkeleton.tsx` and are wrapped in `LoadingRegion` (hidden from assistive tech, one announced status). Community-specific ones (`CommunityCardsLoading`, `CommunityBrowseLoading`, `ProfilePageLoading`, `AccountPageLoading`, `TierListPageLoading`) size their placeholders from `COMMUNITY_CARD_HEIGHT` so pages don't jump when content arrives; update those heights if a card's layout changes. Wrap any custom placeholder in `LoadingRegion` too.

### Page layout

Container widths come from `PAGE_WIDTH` in `constants/ui.ts`, chosen by page type so pages of the same kind line up:

- **`PAGE_WIDTH.WIDE`** — grids, tables, and detail layouts (list and detail pages, tools, community pages)
- **`PAGE_WIDTH.READING`** — prose-heavy pages (FAQ, guides, changelog, policies), kept narrow for line length
- **`PAGE_WIDTH.NARROW`** — single messages and small forms (not found, sign-in prompts)

Loading skeletons and heroes use the same widths so a page doesn't shift when it loads. Grids use the shared column constants: `CARD_GRID_COLS` for entity summary cards, `CHARACTER_GRID_COLS` for portrait grids, `BUILDER_GRID_COLS` for builder pools and tier rows, and `CODE_GRID_COLS` / `EVENT_GRID_COLS` for those trackers. Code that derives page sizes from the column count mirrors those breakpoints with `BREAKPOINTS` media queries, so keep them in sync.

Page titles use `ListPageHeader` (title, optional `description`, timestamp, and actions as children). Long pages can add `SectionJumpNav`, a sticky row of links to section ids that highlights the current section.

### Page shells

Most list pages use one of two layout shells:

- **`ListPageShell`** — handles loading, errors (`DataFetchError` with retry), and empty data (`EmptyState`); callers provide a page-appropriate `loadingFallback`
- **`FilteredListShell`** — list with a toolbar (count, view toggle, filter popover), grid/table content, empty state, and pagination; powered by `useFilteredPageData`

Detail pages for static wiki content use `DetailPageHero` (with `DetailPageTitle`) and `DetailPageNavigation` for the top section, with `useAdjacentItems` resolving the previous/next entries. Community-published detail pages (`TeamPage`, `TierListPage`) don't — they use their own header (`TeamHeroSection`, or a plain title for tier lists) and skip prev/next navigation, since an open-ended, popularity-sorted public catalog doesn't have a stable "next item" the way a fixed wiki dataset does.

## Tests

Run everything with `npm test` (or `npm run check` for the full suite). Test files are `tests/**/*.test.mjs` and use Node's built-in test runner.

| Folder          | What it covers                                                        |
| --------------- | --------------------------------------------------------------------- |
| `architecture/` | Repo-wide rules: import cycles and policy, type ownership, boundaries |
| `build/`        | Build-time scripts: version, env loading, route pages, model bundle   |
| `data/`         | Data paths, validation, legacy slugs, cached/retried fetching         |
| `community/`    | Community-published content logic (pagination, tier list entities)    |
| `unit/`         | Everything else: builders, storage, search, routing metadata, quality |

The Worker in `community-api/` has its own suite (`npm test` inside that folder).

## Deployment

The site is served from GitHub Pages at [dtwiki.org](https://dtwiki.org); the repository's **Settings > Pages** source must be **GitHub Actions**.

- `.github/workflows/ci.yml` runs the reusable `checks.yml` on every pull request and push to `main`. Its `validate` job is the required status check.
- `.github/workflows/deploy-pages.yml` builds and deploys the site after a successful CI run for a push to `main`, when `dragon-traveler-data` sends a `data-updated` repository dispatch, or on manual dispatch. It skips commits that are no longer the head of `main`, so an older run cannot replace a newer site.

The deploy job checks out the private data repository with the `PAT` secret, builds with the `R2_PUBLIC_URL`, `API_BASE_URL`, and `TURNSTILE_SITE_KEY` repository variables, copies `data/` and `assets/manifest.json` into `dist/`, and runs `npm run validate:pages` before publishing. Binary assets are served from R2, not from Pages. Pull request checks never deploy and do not receive the data repository token.

To preview unmerged data, run Deploy Pages manually with `data_branch` set to the data repository branch. This deploys to production, so use it only for data that is ready to publish.

`.github/workflows/community-api.yml` checks the Worker when `community-api/` changes and, on `main`, applies D1 migrations, deploys the Worker, and smoke-tests `https://api.dtwiki.org/v1/health`. See the [Community API README](../community-api/README.md) for its configuration and operations.

## Repository settings

Changes to `main` require a pull request, a passing `validate` check, and resolved review conversations, including changes by administrators. No approving review is required while there is one maintainer. GitHub automatically deletes merged branches. The Pages environment permits deployments only from `main`.

The intended live ruleset is tracked in `.github/rulesets/main.json`; editing that file alone does not apply the settings to GitHub.

## Troubleshooting

- **Missing data in development:** confirm `DATA_DIR` and `ASSETS_DIR` in `.env.local` point to a current `dragon-traveler-data` clone.
- **Checks fail before running:** use Node.js 22.18 or newer and install the locked dependencies with `npm ci`.
- **Deployment missing or stale:** check the CI and Deploy Pages runs, then the data repository's Trigger Wiki Deploy run. A deploy run that reports skipping an older commit is expected when `main` moved.
- **Deploy fails at configuration or data checkout:** confirm the repository variables are set to `https://` URLs and that the `PAT` secret is valid and can read `dragon-traveler-data`.
