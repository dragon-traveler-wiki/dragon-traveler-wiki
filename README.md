# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人).

**Official site:** https://dtwiki.org

## Features

- Character database with stats, abilities, and subclasses
- Artifact, gear, relic, and noble phantasm databases
- Wyrm and wyrmspell databases
- Howlkin and golden alliance databases
- Subclass and status effects references
- Resources and useful links directories
- Game events tracker and redemption codes tracker
- Tier list viewer/builder and team builder
- Fuzzy global search and keyboard shortcuts
- Dark/light theme toggle

## Tech Stack

- **Framework**: React 19, TypeScript, Vite 7, Mantine v8
- **Routing**: React Router 8
- **Drag-and-drop**: @dnd-kit/core
- **Hosting**: GitHub Pages for the SPA, plus Cloudflare Workers and D1 for community content

## Getting Started

Node.js 22.18 or newer is required.

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

By default the dev server looks for a `data/` folder at the repo root. To use the private data repo for both data and assets, clone it alongside this repo and create a local `.env.local` file:

```bash
cp .env.example .env.local
# edit DATA_DIR and ASSETS_DIR if your local clone is elsewhere
```

Repository-relative paths in `DATA_DIR` and `ASSETS_DIR` are resolved from this
repository's root. Shell and CI variables take precedence over values in env
files. Both the dev server and production build load the same env files.

Run the complete local quality suite with:

```bash
npm run check
```

Format supported source, configuration, and documentation files with:

```bash
npm run format
```

CI runs `npm run format:check` as part of the complete quality suite.

### Community API

Public teams and tier lists are served by the Worker in `community-api/`.
Install and run it separately when working on publishing, accounts, voting, or
moderation:

```bash
cd community-api
npm install
npx wrangler d1 migrations apply dragon-traveler-community --local
npm run dev
```

To fill the local database with dummy teams, tier lists, votes, and reports for
manual QA (including enough items to test pagination), run `npm run seed` in
`community-api/`; `npm run seed:reset` removes it again. The script only touches
rows whose ids start with `seed-` and only ever targets the local database.

Copy `.dev.vars.example` to `.dev.vars`, configure Discord and GitHub OAuth
applications, and use `http://localhost:8787/v1/auth/<provider>/callback` as
their local callback URLs. The frontend also needs `VITE_API_BASE_URL` and
`VITE_TURNSTILE_SITE_KEY`; Cloudflare's published test site key is suitable for
local development.

See [`community-api/README.md`](community-api/README.md) for configuration,
endpoints, deployment, and operations.

Production deployment additionally requires a real D1 database ID in
`community-api/wrangler.jsonc`, Worker secrets for both OAuth providers and
Turnstile, `api.dtwiki.org` as the Worker custom domain, and the GitHub Actions
Cloudflare credentials documented in `.github/workflows/community-api.yml`.

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. In CI, data is fetched from the private [dragon-traveler-data](https://github.com/zhenga8533/dragon-traveler-data) repo and copied into `dist/data/` before deployment.

## Project Structure

```
dragon-traveler-wiki/
├── src/             # React source — see src/README.md for details
├── public/          # Static assets copied as-is to dist
├── scripts/         # Build-time scripts
└── .github/         # CI/CD workflows
```

See [`src/README.md`](src/README.md) for a full breakdown of the source architecture and conventions.

## Routing

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
