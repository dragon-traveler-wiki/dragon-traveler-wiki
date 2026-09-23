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
├── constants/       # App-wide constants (colors, styles, ui, accents, glass)
├── contexts/        # React contexts (SearchDataContext, gradient theme, UI opacity, etc.)
├── features/        # Feature modules — each is self-contained
│   ├── characters/
│   ├── community/   # Community API client: auth, publish/vote/report, hooks (see Community-Published Content below)
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

**`useDataFetch<T>(path, initial)`** — the core primitive. Fetches a JSON file, caches the result in a module-level `Map` so repeated calls (including across components) share one request, and returns `{ data, loading, error }`.

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

Teams and tier lists are **not** static data-layer content — they're
user-published through the Cloudflare Worker in `community-api/` (see the root
`README.md`). The frontend client lives in `features/community/`:

- **`features/community/hooks.ts`** — `useCommunityItems(kind, options)` pages
  published items a page at a time (not the whole catalog), where `options` is
  `{ search?, sort?, owner?, status? }` (`owner` powers profile pages; `status:
'hidden'` is moderator-only and silently falls back to `'published'`
  otherwise); `useCommunityItem(kind, id)` fetches a single item by id for
  detail pages; `useCommunityItemsFull(kind)` auto-loads further pages up to a
  cap for callers that need a broad in-memory set (e.g. the global search
  index) — browse pages should use the paginated hook, not this one.
- **`features/community/auth-context.tsx`** — session/auth state (login, link/unlink
  identities, primary identity, delete account) via `useCommunityAuth()`.
- **`features/community/api.ts`** — typed fetch wrappers for every `community-api` endpoint.
- **`features/community/CommunityActions.tsx`** / **`PublishModal.tsx`** — shared
  upvote/report/edit/delete controls and the publish/update flow, reused by both
  the teams and tier-list features. `CommunityActions` only ever shows Edit/Delete
  to the item's owner, even for moderators — moderator actions on other people's
  items go through `ModeratedItemsBrowser` instead (see below), not this component.
- **`features/community/display-author.ts`** — `getDisplayAuthor(item)` prefers the
  real signed-in publisher (`item.community.author.displayName`) over the
  free-text `author` field in the payload, which is unverified and only present
  for local (unpublished) drafts.
- **`features/community/AuthorLink.tsx`** — renders a published item's author as a
  link to `/profile/:userId` (`pages/profile/Page.tsx`); falls back to plain text
  for local drafts with no `community.author`. Used everywhere a "by X" credit
  is shown instead of a raw `getDisplayAuthor()` string.
- **`features/community/CommunitySortControl.tsx`** — the top-rated/newest `Select`
  used by both browse pages, passed through `PageFilterHeaderControls`'
  `extraControls` slot.
- **`features/community/RevisionHistory.tsx`** — reads
  `GET /{collection}/:id/revisions` and renders a collapsible edit history on
  the team/tier-list detail pages; renders nothing if the item has never been
  edited.
- **`features/community/ModeratedItemsBrowser.tsx`** — the moderation page's
  "Browse content" tab; lets moderators search/filter published or hidden items
  by kind and hide/restore/delete them directly via `POST /{collection}/:id/moderate`,
  independent of any report.
- **`features/community/route.ts`** — `getCommunityRoutePath(basePath, item)` builds
  the canonical `<basePath>/<id>/<slug>` detail path for a published item, or a
  local-only fallback for drafts; wrapped per-feature as `getTeamRoutePath`/
  `getTierListRoutePath`.

Report-resolution notifications are a lightweight, in-app-only badge — there's
no email on file to notify with (neither OAuth scope requests one). `users.reports_seen_at`
(set whenever `GET /v1/me/reports` is fetched, i.e. whenever the account page loads)
is compared against each report's `resolved_at` to compute `unreadReportCount` on
`/v1/auth/me`; `AccountMenu.tsx` renders it as a badge. `pages/account/Page.tsx`
calls `refresh()` on the auth context after fetching reports so the badge clears
immediately rather than waiting for the next natural context refresh.

`features/teams/hooks/use-teams-data.ts` and
`features/tier-list/hooks/use-tier-list-data.ts` are thin wrappers around these
primitives (`useTeams`/`useTeam`/`useTeamsFull`, etc.) — follow that pattern for
any future community-published content type rather than adding a new one.

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

| Hook                  | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `useDataFetch`        | Fetch + cache a JSON file                       |
| `useFilteredPageData` | Filter, sort, paginate a dataset for list pages |
| `useFilters`          | Filter state with localStorage persistence      |
| `usePagination`       | Page/offset state                               |
| `useSort`             | Sort column/direction state                     |
| `useDarkMode`         | Current color scheme                            |
| `useIsMobile`         | Responsive breakpoint                           |

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

Formatting conventions are defined in the repository `.editorconfig` and
enforced by `npm run format:check`. Run `npm run check` before opening a pull
request to execute formatting, lint, tests, and type checking together.

## Page Shells

Most list pages use one of two layout shells:

- **`ListPageShell`** — handles loading, errors, and empty data; callers provide a page-appropriate `loadingFallback`
- **`FilteredListShell`** — list with sidebar filter panel, search, sort, and pagination built in; powered by `useFilteredPageData`

Detail pages for static wiki content use `DetailPageHero` + `DetailPageNavigation`
for the top section. Community-published detail pages (`TeamPage`, `TierListPage`)
don't — they use their own header (`TeamHeroSection`, or a plain title for tier
lists) and skip prev/next navigation, since an open-ended, popularity-sorted
public catalog doesn't have a stable "next item" the way a fixed wiki dataset does.
Reusable route, list, detail, builder, and home skeletons live in
`components/layout/PageLoadingSkeleton.tsx`. Wrap custom placeholders in
`LoadingRegion` so decorative skeletons are hidden from assistive technology and
the loading state is announced once.
