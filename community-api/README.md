# Community API

Cloudflare Worker (Hono) + D1 backing the wiki's public teams and tier lists:
OAuth sign-in (Discord / GitHub), publishing, voting, reports, moderation,
suspensions, and profiles. The frontend client lives in `src/features/community/`.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars        # fill in OAuth client IDs/secrets
npx wrangler d1 migrations apply dragon-traveler-community --local
npm run dev                            # http://localhost:8787
npm run seed                           # optional: dummy teams, tier lists, reports
```

Local D1 lives in `.wrangler/state` and is separate from production. Never pass
`--remote` to `wrangler dev`, `d1 execute`, or `seed` unless you mean to touch
production; the seed script refuses it. Use `http://localhost:8787/v1/auth/<provider>/callback`
as the local OAuth redirect URLs.

`npm run check` runs the typecheck and the (pure-logic) tests.

## Configuration

| Name                                                            | Kind                   | Notes                                                                            |
| --------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `APP_ORIGIN`, `ALLOWED_ORIGINS`                                 | var (`wrangler.jsonc`) | Site origin(s) allowed by CORS and used for redirects                            |
| `CATALOG_BASE_URL`                                              | var                    | Where published data is validated against (`<site>/data`)                        |
| `SESSION_TTL_DAYS`                                              | var                    | Session lifetime                                                                 |
| `MODERATOR_IDENTITIES`                                          | var                    | Comma list like `github:<id>,discord:<id>`; grants the moderator role at sign-in |
| `GITHUB_CLIENT_ID` / `_SECRET`, `DISCORD_CLIENT_ID` / `_SECRET` | secret                 | OAuth apps (`read:user`, `identify`; no email is collected)                      |
| `TURNSTILE_SECRET`                                              | secret                 | Cloudflare Turnstile siteverify secret                                           |

Set secrets with `npx wrangler secret put <NAME>`. Changing a var or the
moderator list needs a redeploy.

## Deployment

Pushing to `main` (paths under `community-api/`) runs
`.github/workflows/community-api.yml`: checks, then
`wrangler d1 migrations apply --remote`, then `wrangler deploy`. It needs the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The Worker is
served from the `api.dtwiki.org` custom domain.

- **Migrations** (`migrations/`) are forward-only and applied automatically.
- **Cron:** a daily trigger (`triggers.crons`) runs `purgeExpired` — deletes handled
  reports 90 days after they close, plus expired sessions and sign-in states.
- **Rollback:** `npx wrangler rollback` restores the previous Worker version;
  schema changes are not rolled back, so keep migrations backward compatible.
- **Data safety:** D1 Time Travel can restore the database to a point in the past.
- **After the first deploy** a moderator must pin a reference tier list (star icon
  on a character tier list's page) or the home featured characters stay hidden.

## Endpoints

All under `/v1`. Writes need the session cookie plus an `X-CSRF-Token` header;
publish and report also need an `X-Turnstile-Token`.

| Area          | Endpoints                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `GET /auth/:provider/start` / `callback`, `GET /auth/me`, `POST /auth/logout`, `DELETE /auth/me`, `DELETE /auth/:provider/unlink`, `PATCH /auth/primary`                                           |
| Content       | `GET/POST /teams`, `/tier-lists`; `GET/PATCH/DELETE /:collection/:id`; `GET /:collection/:id/revisions`                                                                                            |
| Interaction   | `PUT/DELETE /:collection/:id/upvote`, `POST /:collection/:id/reports`                                                                                                                              |
| Profiles      | `GET /users/:id`, `GET /me/items`, `GET/DELETE /me/reports`                                                                                                                                        |
| Site settings | `GET /settings` (pinned reference tier list)                                                                                                                                                       |
| Moderation    | `POST /:collection/:id/moderate`, `GET /admin/reports`, `PATCH /admin/reports/:id`, `POST /admin/users/:id/suspend` / `unsuspend`, `GET /admin/actions`, `PUT /admin/settings/reference-tier-list` |

List endpoints take `limit` (max 50), `cursor`, `sort` (`top`/`new`), `q`, `owner`,
and (moderators) `status=hidden`; the first page also returns `total`.

## Behavior notes

- Deletes are soft (`status = 'deleted'`); deleted items are hidden everywhere and
  can't be restored through the API.
- Suspended or banned accounts can read and delete their own items but are refused
  on publish, edit, vote, and report (`requireActiveUser`, `403` with `code: 'suspended'`).
  They also can't delete their account or unlink identities.
- Every moderator action is written to `moderation_actions`.
- Tests cover the pure logic (validation, cursors, suspensions, retention, auth
  helpers). Route handlers aren't covered because `@cloudflare/vitest-pool-workers`
  doesn't support the repo's Vitest version yet.
