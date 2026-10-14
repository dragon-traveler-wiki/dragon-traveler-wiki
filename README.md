# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人). Built with React, TypeScript, Vite, and Mantine, with community features on Cloudflare Workers and D1.

## Live site

Open [dtwiki.org](https://dtwiki.org).

## Features

- Databases for characters, artifacts, gear, relics, noble phantasms, wyrms, wyrmspells, howlkins, subclasses, and status effects.
- Game events and redemption codes trackers, resources, and useful links.
- Tier list and team builders, calculators, guides, and a daily character guessing game.
- Community accounts (Discord/GitHub sign-in) to publish, vote on, and report public teams and tier lists, with moderation tools.
- Fuzzy global search, keyboard shortcuts, and dark/light themes.

## Getting started

Use Node.js 22.18 or newer and npm:

```sh
git clone https://github.com/dragon-traveler-wiki/dragon-traveler-wiki.git
cd dragon-traveler-wiki
npm ci
cp .env.example .env.local
npm run dev
```

The defaults in `.env.local` expect [dragon-traveler-data](https://github.com/dragon-traveler-wiki/dragon-traveler-data) cloned alongside this repository; edit `DATA_DIR` and `ASSETS_DIR` if your clone is elsewhere. Open `http://localhost:5173`. For a production build, run `npm run build`, then `npm run preview`.

## Architecture

`src/features/` holds self-contained feature modules and `src/pages/` holds route components. Shared components, hooks, contexts, and constants live in their matching `src/` folders, and routes are cataloged in `src/constants/route-meta.ts`. Public teams and tier lists are served by the Worker in `community-api/`.

See [Development](docs/development.md#architecture) for the source layout, routes, and conventions.

## Data source

Game data comes from the private [dragon-traveler-data](https://github.com/dragon-traveler-wiki/dragon-traveler-data) pipeline. Deployment copies its `data/<locale>/*.json`, `data/global/*.json`, and `assets/manifest.json` into the site, and images and videos are served from Cloudflare R2. Data updates on its `main` branch redeploy the wiki automatically.

## Documentation

- [Development](docs/development.md): checks, architecture, data integration, UI conventions, tests, deployment, and troubleshooting.
- [Import policy](docs/import-policy.md): module ownership and barrel rules.
- [Community API](community-api/README.md): the Worker's setup, endpoints, deployment, and operations.
- [Community client](src/features/community/README.md): accounts, publishing, and moderation in the frontend.

## Contributing

Follow the [organization contribution guide](https://github.com/dragon-traveler-wiki/.github/blob/main/CONTRIBUTING.md) and the [development guide](docs/development.md). Use a short-lived branch and a pull request into `main`. Content corrections can also be suggested from the site.

## License

Source code is licensed under the [MIT License](LICENSE). Game data and assets belong to their respective owners. This project is not affiliated with the game's developers or publishers.
