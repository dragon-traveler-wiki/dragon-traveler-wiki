# Tests

Run everything with `npm test` (or `npm run check` for the full suite). Test
files are `*.test.mjs` and use Node's built-in test runner.

| Folder          | What it covers                                                        |
| --------------- | --------------------------------------------------------------------- |
| `architecture/` | Repo-wide rules: import cycles and policy, type ownership, boundaries |
| `build/`        | Build-time scripts: version, env loading, route pages, model bundle   |
| `data/`         | Data paths, validation, legacy slugs, cached/retried fetching         |
| `community/`    | Community-published content logic (pagination, tier list entities)    |
| `unit/`         | Everything else: builders, storage, search, routing metadata, quality |

The Worker in `community-api/` has its own suite (`npm test` inside that
folder).
