# Community feature

Frontend for user-published teams and tier lists: accounts, publishing, voting,
reporting, and moderation. The backend is the Cloudflare Worker in
[`community-api/`](../../../community-api/README.md), which documents the
endpoints and the rules it enforces (suspensions, roles, report handling,
retention). This file covers how the client is organised.

## Data and state

- **`api.ts`** — typed `fetch` wrappers for every endpoint. All requests go through
  one `request()` helper (cookie credentials, JSON, `CommunityApiError`).
- **`types.ts`** — shared types (`CommunityMeta`, `CommunityUser`, `AdminReport`,
  `MyReport`, `Suspension`, ...).
- **`auth-context.tsx`** — `useCommunityAuth()`: session, login/link/unlink,
  primary identity, delete account. It re-checks `/v1/auth/me` when the tab regains
  focus (and every minute for moderators) so alert counts stay current.
- **`hooks.ts`** — `useCommunityItems(kind, { search, sort, owner, status })` loads one
  server page at a time and returns `data`, `total`, `hasMore`, `loadMore`, `refresh`
  (refetch in place, no spinner) and `retry`. `useCommunityItem(kind, id)` fetches one
  item for detail pages and returns `retry`; results are keyed by request, so it never
  returns the previous item while a new id loads. `useCommunityItemsFull(kind)` auto-loads further pages up to
  a cap for callers that need a broad in-memory set (the global search index); browse
  pages should use the paginated hook. Thin wrappers live in
  `features/teams/hooks/use-teams-data.ts` and
  `features/tier-list/hooks/use-tier-list-data.ts` — follow that pattern for any new
  community content type.
- **`run-action.ts`** — `runAction(fn, { errorTitle, success })` runs an API call with
  the standard success/error toasts and returns `{ ok, value }`. Use it instead of
  hand-written try/catch and toast blocks; the caller keeps its own loading state.
- **`report-status.ts`** — labels and colours for report reasons and outcomes
  ("Action taken" vs "No action").
- **`builder-edit.ts`** — `toBuilderDraft(item)`: owners edit the published item in
  place, anyone else gets a remix without its community link.
- **`route.ts`**, **`display-author.ts`** — canonical `<base>/<id>/<slug>` paths and
  the "who wrote this" rule (the signed-in publisher, not the free-text author).

## Browse pages

The Teams and Tier List pages share `hooks/use-community-browse-state.ts`:
`useCommunityBrowseState` owns the persisted search, sort, and filters, and
`useSavedItemsForMode` reloads local saved items whenever the page enters the
saved mode (including via back/forward). Only the View tab depends on the community
API; My Saved and the builder work from local data, so an API outage doesn't block
them.

## Pagination

Browse pages fetch server pages of 24 (`total` comes back with the first page) but
show client page numbers over the whole catalog. `pagination.ts`
(`getCommunityPaginationTotal`) chooses the server total unless client-side filters
have narrowed the loaded set, and `CommunityLoadMore` fetches the next server page
when the viewer reaches the last loaded one. `PagedGrid` is the same idea for the
account and profile lists, with the shared page controls.

## Cards and item pages

- **Cards** (`TeamCard`, `TierListCard` in their features) use the stretched-link
  pattern: `CardTitle` is a real link whose `::after` covers the card, and anything
  separately clickable opts in with `.dt-link-card__above` (see `src/README.md`).
  Previews are laid out by `use-card-preview-layout.ts` and `components/ui/OverflowRow`.
- **`CommunityActions`** — upvote, report, and owner edit/delete. Detail pages render
  it in pieces via its `show` prop (reactions beside the byline, delete with the page
  actions). Moderator actions on other people's items live in the moderation page,
  not here.
- **`PublishModal`** — publish/update flow with Turnstile.
- **`AuthorLink`**, **`CommunityStatsBadges`**, **`CommunitySortControl`**,
  **`RevisionHistory`** (mirrors the wiki's Change History section).

## Account, profile, and moderation

- **`MyPublications`**, **`MyReports`** — the account page's tabs (teams and tier lists
  split; reports split into open and closed with withdraw).
- **`SuspensionNotice`** — shown to a suspended user with the reason and how to appeal.
- **`ModeratedItemsBrowser`**, **`ModerationLog`**, **`SuspendUserModal`** — moderation
  tools; the pages using them are `pages/moderation`, `pages/profile`, `pages/account`.
- **`AccountMenu`** — header menu. Its alert dot is `unreadReportCount` (answers to
  your reports, cleared when the account page is viewed) plus `openReportCount`
  (moderators only); the Moderation item shows the open count.

## Site-wide Tier List Reference

`contexts/tier-list-reference-context.ts` (`TierListReferenceContext`) decides which
tier list drives tier badges on characters and the home featured section. A viewer's
explicit choice is stored by list id (or `saved:<slug>` for a local list); if that
list is later deleted or hidden they fall back to the site default. With no stored
choice they follow the moderator-pinned default from `GET /v1/settings`, set with the
pin toggle on a character tier list's page. With nothing pinned there is no default
and those features stay off.
