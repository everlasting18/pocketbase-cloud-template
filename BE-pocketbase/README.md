# BE-PocketBase

PocketBase 0.40.3 backend for the template. See the root README for the full walkthrough.

## Run locally

```sh
pbc local init 0.40.3                                   # binary is git-ignored; install per machine
./pocketbase superuser upsert admin@example.com yourpassword
./pocketbase serve                                      # dashboard http://127.0.0.1:8090/_/
```

## Deploy

```sh
pbc pocketbase deploy --new be-pocketbase   # first deploy; later just `pbc pocketbase deploy`
pbc pocketbase info be-pocketbase           # URLs and superuser credentials
```

A deploy ships `pb_hooks` and `pb_migrations`; new migrations apply on the restart that follows.

## Layout

| Path | What it is |
| --- | --- |
| `pb_migrations/` | Schema migrations, applied on start. `*_aura_collections.js` are generated from `FE-pocketbase/src/setup/collections.json` by `bun run sync:schema` — never edit them. |
| `pb_hooks/` | JavaScript hooks (`*.pb.js`). Runs in goja, not Node. |
| `pb_data/` | Database and uploads. Git-ignored. |
| `pbc.json` | Pinned PocketBase version and build dirs. `pbc` adds project ids on first deploy. |

## Collections

| Collection | list / view | create | update / delete |
| --- | --- | --- | --- |
| `products` | public | superusers | superusers |
| `journal_articles` | public | superusers | superusers |
| `orders` | superusers | public (checkout) | superusers |

Docs: [hooks](https://pocketbase.io/docs/js-overview/) · [migrations](https://pocketbase.io/docs/js-migrations/)
