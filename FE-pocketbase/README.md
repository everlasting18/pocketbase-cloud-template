# FE-PocketBase

React 19 + Vite storefront ("Aura") with an admin at `/admin`. See the root README for the full walkthrough.

## Run

```sh
bun install
cp .env.example .env.local
bun run dev          # http://localhost:3000
```

## Data source

| `VITE_USE_MOCK_POCKETBASE` | Behaviour |
| --- | --- |
| `true` | Demo data stored in the browser. Admin login `admin@aura.test` / `secret123`. |
| `false` | Real PocketBase at `VITE_POCKETBASE_URL`. Admin login is a PocketBase superuser. |

A browser can override the build default: **Admin → Setup** connects, imports collections, seeds and switches to PocketBase; **Admin → Settings → Use demo data** switches back.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` / `build` / `preview` | Vite |
| `bun run lint` | Typecheck |
| `bun test` | Unit tests (integration tests run when `PB_TEST_URL` is set) |
| `bun run sync:schema [--check]` | Generate a BE migration from `src/setup/collections.json` |
| `pbc frontend deploy` | Build and deploy to PocketBase Cloud |

## Where things live

- `src/setup/` — `collections.json` (schema source of truth) and `setupApi.ts` (setup operations).
- `src/pages/admin/SetupPage.tsx`, `src/components/admin/setup/` — setup wizard.
- `src/services/pocketbase/` — client, data source switch, mock layer, API calls.
