# PocketBase Cloud Template

Open-source **BE-PocketBase** + **FE-PocketBase** starter: a PocketBase backend and a React storefront with an admin, ready to run locally and deploy to [PocketBase Cloud](https://pocketbasecloud.com). Build fast, ship faster.

| Folder | What it is |
| --- | --- |
| `BE-pocketbase/` | PocketBase 0.40.3 — hooks and migrations (schema for `products`, `journal_articles`, `orders`) |
| `FE-pocketbase/` | React 19 + Vite storefront and `/admin` (products, journal, orders, setup) |

## 1. The idea

Clone a working full-stack template instead of wiring PocketBase from scratch. The frontend runs on mock data out of the box, so anyone can try it before creating a backend.

## 2. Try the online demo

Demo: https://tkig0lbkjg56cwd.6j6t.pocketbasecloud.com

1. Open [`/admin`](https://tkig0lbkjg56cwd.6j6t.pocketbasecloud.com/admin) and sign in with `admin@aura.test` / `secret123` (demo data lives in your browser only).
2. Go to **Setup** (`/admin/setup`) and follow the three steps:
   1. **Connect** — create a PocketBase Cloud instance and paste its URL.
   2. **Collections** — sign in with the instance's superuser and press *Import automatically*, or *Copy JSON* and paste it into Dashboard → Settings → Import collections.
   3. **Sample data** — press *Seed sample data*, then *Switch this browser to PocketBase*.

Your superuser credentials go straight from your browser to your instance and are never stored.

## 3. Get the source and log in to PocketBase Cloud

```sh
git clone <this-repo-url> && cd PocketbaseCloud-Template
pbc login                 # opens the browser
pbc whoami                # verify the account
pbc project ls            # list projects
pbc project use <project> # choose the project to deploy into
```

## 4. Backend and frontend

### BE-PocketBase

```sh
cd BE-pocketbase
pbc local init 0.40.3                                   # download PocketBase 0.40.3
./pocketbase superuser upsert admin@example.com yourpassword
./pocketbase serve                                      # http://127.0.0.1:8090/_/
pbc pocketbase deploy --new be-pocketbase               # first deploy; later just `pbc pocketbase deploy`
```

Migrations in `pb_migrations/` create the collections on start, locally and on Cloud. A new Cloud instance gets a superuser; read its credentials with `pbc pocketbase info be-pocketbase`.

### FE-PocketBase

```sh
cd FE-pocketbase
bun install
cp .env.example .env.local
# .env.local:
#   VITE_USE_MOCK_POCKETBASE=false
#   VITE_POCKETBASE_URL=http://127.0.0.1:8090
bun run dev                                             # http://localhost:3000
pbc frontend deploy --new fe-pocketbase                 # first deploy; later just `pbc frontend deploy`
```

`VITE_*` variables are baked in at build time. `.env.production` ships with `VITE_USE_MOCK_POCKETBASE=true` (the demo); set it to `false` and set `VITE_POCKETBASE_URL` to deploy a store backed by your instance.

## 5. What you get on PocketBase Cloud

After `pbc pocketbase deploy` finishes, the instance page (or `pbc pocketbase info <name>`) shows:

- **Admin dashboard URL** — `https://<name>.pocketbasecloud.com/_/`
- **API base URL** — `https://<name>.pocketbasecloud.com/api/`
- **Admin email / password** — the managed superuser
- **Deployments** — status of each deploy

## Changing the schema

1. Edit `FE-pocketbase/src/setup/collections.json` (or change collections in a local dashboard and export them).
2. `cd FE-pocketbase && bun run sync:schema` — appends a new migration to `BE-pocketbase/pb_migrations/` (existing ones are never edited). `bun run sync:schema --check` fails when they are out of date.
3. Update `src/constants/pocketbaseCollections.ts` (the Settings page's field table).
4. Commit and `pbc pocketbase deploy`.

## Development

```sh
cd FE-pocketbase
bun run lint      # typecheck
bun test          # unit tests
# integration tests need a disposable PocketBase:
bash -c 'W=$(mktemp -d); scripts/pb-scratch.sh "$W" 8095'
PB_TEST_URL=http://127.0.0.1:8095 bun test src/setup/setupApi.integration.test.ts
```
