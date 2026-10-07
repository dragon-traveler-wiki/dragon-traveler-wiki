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
- Community accounts (Discord/GitHub sign-in): publish, vote on, and report public teams and tier lists, with moderation tools
- Fuzzy global search and keyboard shortcuts
- Dark/light theme toggle

## Tech Stack

- **Framework**: React 19, TypeScript, Vite 8, Mantine v9
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

Public teams and tier lists are served by the Worker in `community-api/`, which
has its own [README](community-api/README.md) covering setup, configuration,
endpoints, deployment, and operations. To work on publishing, accounts, or
moderation locally:

```bash
cd community-api
npm install
npx wrangler d1 migrations apply dragon-traveler-community --local
npm run dev        # http://localhost:8787
npm run seed       # optional: dummy content for manual testing
```

The frontend reads `VITE_API_BASE_URL` and `VITE_TURNSTILE_SITE_KEY` from
`.env.local` (`.env.example` has local defaults, including Cloudflare's published
Turnstile test key).

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. In CI, data is fetched from the private [dragon-traveler-data](https://github.com/dragon-traveler-wiki/dragon-traveler-data) repo and copied into `dist/data/` before deployment.

## Project Structure

```
dragon-traveler-wiki/
├── src/             # React app — see src/README.md
├── community-api/   # Cloudflare Worker + D1 for community content — see its README
├── tests/           # Frontend tests — see tests/README.md
├── scripts/         # Build-time scripts
├── docs/            # Cross-cutting conventions (import policy)
├── public/          # Static assets copied as-is to dist
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
