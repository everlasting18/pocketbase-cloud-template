# PocketBase Cloud Template

A storefront, an admin, and a PocketBase backend in one repository, ready to
deploy to [PocketBase Cloud](https://pocketbasecloud.com) with the `pbc` CLI.

## Overview

Aura is a small commerce site: a product catalogue with detail pages, a cart and
a checkout, and a journal. Behind `/admin` sits a dashboard for products, journal
articles, and orders, with image uploads and a rich-text editor. `BE-pocketbase`
is the database that backs all of it.

The frontend runs on bundled demo data out of the box, so you can open it before
any backend exists. A wizard at `/admin/setup` then points it at your own
PocketBase instance, imports the collections, and seeds the sample catalogue.

## Key features

- **Storefront** — home, product detail, cart, checkout, and journal, built with
  React 19, Vite, Tailwind CSS v4, and shadcn/ui components.
- **Admin dashboard** — `/admin` lists and edits products, journal articles, and
  orders, with search, pagination, image and gallery uploads, and a TipTap
  rich-text editor.
- **Setup wizard** — `/admin/setup` connects to a PocketBase URL, imports the
  three collections, and seeds the sample catalogue. Seeding skips records that
  are already there, so running it twice is safe.
- **Demo mode** — with `VITE_USE_MOCK_POCKETBASE=true` the whole site runs on
  bundled data and browser storage, no backend required.
- **Three collections** — `products`, `journal_articles`, and `orders`. The
  catalogue is publicly readable, orders are create-only, and everything else is
  superuser-only.
- **One schema source** — `FE-pocketbase/src/setup/collections.json` feeds both
  the wizard's import and the generated migration, so the two never drift.
- **Append-only migrations** — `bun run sync:schema` writes a new migration file
  rather than editing the one that already ran.

## Template structure

```text
pocketbase-cloud-template/
├── BE-pocketbase/           # deploy as a PocketBase instance
│   ├── pb_hooks/            # starter hook file
│   └── pb_migrations/       # generated from collections.json
└── FE-pocketbase/           # deploy as a static site
    ├── .env.example         # build-time variables
    ├── scripts/             # sync-schema and its tests
    └── src/
        ├── components/
        │   ├── admin/       # forms, tables, setup steps
        │   ├── cart/        # cart drawer
        │   ├── home/        # hero, about
        │   ├── layout/      # navbar, footer
        │   ├── product/     # card and grid
        │   └── ui/          # shadcn primitives
        ├── constants/       # demo products and articles
        ├── contexts/        # cart, catalog, admin auth
        ├── pages/           # storefront and admin routes
        ├── services/        # PocketBase client, mock, mappers
        └── setup/           # collections.json, wizard logic
```

## 1. Before you start

Install the `pbc` CLI and log in. The login opens a browser once and is
remembered afterwards.

```bash
curl -fsSL https://raw.githubusercontent.com/pocketbasecloud/cli/main/scripts/install.sh | sh
pbc login
```

The frontend uses [Bun](https://bun.sh) (the lockfile is
`FE-pocketbase/bun.lock`), and `pbc` installs dependencies with the package
manager the lockfile names, so have it available.

Both parts live in one project. Create it once and make it the default for this
machine:

```bash
pbc project create aura
pbc project use aura
```

## 2. Deploy PocketBase

### Deploy

`BE-pocketbase/` holds `pb_hooks` and `pb_migrations`. Deploy it as a PocketBase
instance:

```bash
cd BE-pocketbase
pbc pocketbase deploy --new aura-pocketbase
```

`--new` creates an instance with that name and fails if the name is taken;
`--name` picks an existing one to redeploy. This first deploy links the
directory, so later deploys from it need neither.

It uploads the hooks and migrations and restarts the instance so they run: the
three collections and their API rules exist as soon as it is up. When it asks
about an env file, choose not to push one — this template needs none on the
database.

The migrations create the schema but no records. Sample products and articles
come from the setup wizard in step 4.

### The pbc.json file

`pbc.json` tells the CLI what a directory is, how to package it, and which
resource it deploys to. The two `pbc.json.example` files carry only the part that
is the same for everyone:

```json
{
  "pocketbaseVersion": "0.40.3",
  "build": {
    "pbHooks": "pb_hooks",
    "pbMigrations": "pb_migrations"
  }
}
```

```json
{
  "build": {
    "command": "bun run build",
    "outputDir": "dist"
  }
}
```

| Field | Meaning |
| --- | --- |
| `pocketbaseVersion` | The PocketBase version `pbc local init` downloads |
| `build` | What to package: `pbHooks` and `pbMigrations` for PocketBase; `command` and `outputDir` for the frontend |

The first deploy adds the rest — `projectId`, `kind`, `defaultEnvironment`, and
an `environments` block naming the resource it created — which is what later
deploys read instead of `--name`. Those ids belong to your account, so `pbc.json`
is listed in `.gitignore` and only the examples are committed. Don't copy an
example into place: deploy once and let the CLI write the real file.

### Get the URL and the superuser login

A new instance gets a superuser account with your account email and a generated
password, printed once at the end of the deploy. Show the instance again at any
time:

```bash
pbc pocketbase info --name aura-pocketbase
```

Copy the instance URL from that output — the frontend and the setup wizard both
need it. The PocketBase dashboard is the same URL followed by `/_/`.

### Update the schema

The schema lives in `FE-pocketbase/src/setup/collections.json`. Edit that file
and regenerate the migration rather than writing one by hand:

```bash
cd FE-pocketbase
bun run sync:schema
```

It appends a new file to `BE-pocketbase/pb_migrations` — it never edits one that
has already run. Deploy again from the backend directory:

```bash
cd ../BE-pocketbase
pbc pocketbase deploy
```

New migrations are merged with the ones already on the instance and applied by
the restart that follows.

## 3. Deploy the frontend

### Build variables

The site reads two variables. Both are baked into the files at build time, so a
change means a redeploy.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_USE_MOCK_POCKETBASE` | Yes | `true` serves bundled demo data; `false` reads from PocketBase |
| `VITE_POCKETBASE_URL` | When not mocking | The `aura-pocketbase` URL from `pbc pocketbase info` |

`.env.production` is committed with demo mode on, so a deploy with no variables
set produces a working demo site. Pass them on the command line to override it.

### Deploy

```bash
cd FE-pocketbase
VITE_USE_MOCK_POCKETBASE=false \
  VITE_POCKETBASE_URL=https://<id>.<compute>.pocketbasecloud.com \
  pbc frontend deploy --new aura
```

`--new` creates the site; a later deploy from this directory needs no flag.

The CLI installs dependencies, runs `bun run build`, uploads `dist/`, and waits
for HTTPS. Find the site address afterwards with:

```bash
pbc frontend info --name aura
```

### Redeploy

The first deploy links the directory in `pbc.json`, so from `FE-pocketbase/` a
redeploy needs no name — only the build variables again:

```bash
VITE_USE_MOCK_POCKETBASE=false \
  VITE_POCKETBASE_URL=https://<id>.<compute>.pocketbasecloud.com \
  pbc frontend deploy
```

To avoid retyping them, put them in `FE-pocketbase/.env.production`; Vite reads
that file during the build.

## 4. Fill the database

The migrations create empty collections. Open `/admin/setup` on the deployed site
and work through the three steps:

1. **Connect** — enter the `aura-pocketbase` URL and the superuser login from
   `pbc pocketbase info`.
2. **Import collections** — pushes `collections.json` to the instance. Skip it
   when the migrations already ran; the step reports what is missing.
3. **Seed sample data** — writes the demo products and journal articles.
   Records that already exist are left alone, so you can run it again.

The wizard also saves the URL in the browser it runs in. That is enough for your
own admin session, but visitors get the URL from the build, so keep
`VITE_POCKETBASE_URL` set when you deploy.

## 5. Run locally

`pbc local init` downloads a PocketBase binary for your machine and pins its
version in `pbc.json`. It never overwrites what is already there, so the hooks
and migrations are left alone.

```bash
cd BE-pocketbase
pbc local init
./pocketbase serve
```

`serve` applies the migrations in `pb_migrations`, so the three collections are
there on the first start. It prints a link for creating a local superuser; the
dashboard is at `http://127.0.0.1:8090/_/`.

In a second terminal:

```bash
cd FE-pocketbase
cp .env.example .env.local
bun install
bun run dev     # http://localhost:3000
```

`.env.local` starts in demo mode. Set `VITE_USE_MOCK_POCKETBASE=false` and
`VITE_POCKETBASE_URL=http://127.0.0.1:8090` in it to read from the local
instance, then open `http://localhost:3000/admin/setup` to seed the sample data.

Other scripts:

```bash
bun run build   # production build
bun run lint    # type check
bun test        # tests
```

## CLI commands used here

| Command | What it does |
| --- | --- |
| `pbc login` | Log in to PocketBase Cloud |
| `pbc project create aura` / `pbc project use aura` | Create the project and make it the default |
| `pbc pocketbase deploy --new aura-pocketbase` | Deploy `BE-pocketbase/` as a new PocketBase instance |
| `pbc pocketbase info --name aura-pocketbase` | Instance URL and superuser login |
| `pbc frontend deploy --new aura` | Build and deploy `FE-pocketbase/` as a new static site |
| `pbc frontend info --name aura` | Site URL |
| `pbc local init` | Download a PocketBase binary for local development |

## Licence

Apache-2.0. See [`LICENSE`](LICENSE).
