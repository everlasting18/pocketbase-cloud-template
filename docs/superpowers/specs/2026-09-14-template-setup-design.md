# PocketBase Cloud Template Setup — Design

Date: 2026-09-14 · Status: approved in chat, pending spec review

## Goal

Turn `BE-pocketbase` + `FE-pocketbase` into an open-source template that people
can (1) try as an online demo running on mock data, (2) connect to their own
PocketBase Cloud instance from the demo's admin through a guided, automated
setup (connect → import collections → seed sample data), and (3) clone, run
locally and deploy with `pbc`.

All docs and UI copy are in English.

## Current state (verified)

- FE (React 19 + Vite, "Aura" store) has a mock layer and an admin
  (Products / Journal / Orders / Settings). Settings shows a URL field and a
  read-only collection mapping; there is no importable schema and no seeding.
- `isMockPocketBaseEnabled` in `src/services/pocketbase/mock.ts` is a
  build-time constant that also requires `import.meta.env.DEV`, so a production
  build never uses mock data even with `VITE_USE_MOCK_POCKETBASE=true`. It is
  used in ~25 places.
- BE (PocketBase 0.40.3) has an empty `pb_migrations/` and a placeholder hook.
- Both `pbc.json` files contain the author's `projectId` / environment ids.
- `pbc 0.8.5` supports every command used in the tutorial: `login`, `whoami`,
  `project ls|use`, `local init`, `pocketbase deploy|info`, `frontend deploy`,
  `admin collections export|import`, `admin rules get`.
  `superuser upsert` is a PocketBase binary command.

## 1. Data source mode (mock ↔ remote)

New `src/services/pocketbase/dataSource.ts`:

```ts
type DataSource = "mock" | "remote";
getDataSource(): DataSource   // localStorage "aura_data_source", else
                              // VITE_USE_MOCK_POCKETBASE === "true" ? "mock" : "remote"
isMockMode(): boolean
setDataSource(s: DataSource): void // persist, clear authStore, window.location.reload()
```

- The `DEV` guard is removed so the deployed demo really runs on mock data.
- `isMockPocketBaseEnabled` is deleted; every usage (`api.ts`, `adminApi.ts`,
  `auth.ts`, `client.ts`, `ConnectionCard`, `AdminLayout`, `LoginPage`) calls
  `isMockMode()`. Deleting the constant makes the compiler find stragglers.
- Switching reloads the page: providers and the client singleton initialise on
  load, so a reload is the simplest correct way to rebuild them. Auth is
  cleared because mock tokens are invalid on a real server and vice versa.
- `.env.production` keeps `VITE_USE_MOCK_POCKETBASE=true` (demo build).
- Settings → Connection card gets a "Use demo data" / "Use PocketBase" toggle.
- Mock login hint `admin@aura.test / secret123` stays on the login page.

## 2. Setup wizard — `/admin/setup`

### Routing and entry points

- `/admin/setup` sits outside the auth guard, next to `/admin/login`, so a
  user whose remote instance is empty or unreachable can still reach it.
- Linked from the login page ("First time? Set up PocketBase →"), the admin
  sidebar ("Setup"), and a banner in Settings while in mock mode.

### Layout

One vertical page, three numbered step cards. Each card has a state
`pending | running | done | error`; a step unlocks when the previous is done.

### Step 1 — Connect

- Short instructions: create an instance in the PocketBase Cloud dashboard or
  with `pbc pocketbase deploy`, then copy the API base URL.
- URL input + Test (reuses `testPocketBaseConnection` against the typed URL).
  A healthy response completes the step.
- Warn when the URL is neither `https` nor localhost.

### Step 2 — Collections

- Superuser email + password form (shared by the automatic import and Check).
- **Manual:** "Copy JSON" copies `collections.json`, with instructions:
  Dashboard → Settings → Import collections → paste → Review → Confirm.
- **Automatic:** "Import automatically" authenticates a temporary PocketBase
  client (in-memory `BaseAuthStore`, never the app singleton, so the mock
  session is untouched) and calls `collections.import(json, false)`.
  `deleteMissing` is always `false`: the user's other collections are never
  removed.
- **Check:** verifies `products`, `journal_articles` and `orders` exist and
  lists any that are missing. Completes the step when all three exist.

### Step 3 — Seed sample data

- Source: `PRODUCTS` and `JOURNAL_ARTICLES` constants, converted with the same
  payload mapping the admin forms use. Images use external `imageUrl` / `image`
  fields; no file uploads. `orders` is not seeded.
- Idempotent: a product whose `slug` already exists, or an article whose
  `title` already exists, is skipped. A partially failed run can be re-run to
  fill the gaps.
- Records are created sequentially with progress (`Products 3/6 · Articles
  1/3`). Volume is tiny and the batch API is disabled by default, so no batch.
- On success: "Switch this browser to PocketBase" → `setPocketBaseUrl(url)`,
  `setDataSource("remote")`, reload, land on `/admin/login`.

### Error handling

Every error shows a readable message plus details from `err.response.data`.

| Condition | Message |
|---|---|
| Network / CORS failure | Can't reach this URL — check it and that the instance is running |
| 400 on auth | Wrong superuser email or password |
| 403 | This account isn't a superuser |
| 400 on import | Lists the invalid fields from the response |
| Seed failures | Seeded N, failed M, with the failed record names |

### Security

- Password lives only in component state; never written to storage.
- The temporary client is discarded on unmount and after switching.
- Page copy: "Credentials go directly from your browser to your instance."

### Files

- `src/setup/collections.json` — the single schema source.
- `src/setup/setupApi.ts` — `checkHealth`, `authSuperuser`,
  `importCollections`, `checkCollections`, `seedSampleData`; no React.
- `src/pages/admin/SetupPage.tsx`
- `src/components/admin/setup/StepCard.tsx`, `ConnectStep.tsx`,
  `CollectionsStep.tsx`, `SeedStep.tsx`

## 3. Backend schema migration

### Producing `collections.json`

Not hand-written. Create the three collections on a local PocketBase 0.40.3
matching `constants/pocketbaseCollections.ts` (fields and rules), export with
`pbc admin collections export`, strip nothing the import needs, and save as
`FE-pocketbase/src/setup/collections.json`. The Settings mapping table is kept
and checked once by hand against the JSON.

### `FE-pocketbase/scripts/sync-schema.mjs` (`bun run sync:schema`)

- Reads `collections.json` and generates
  `BE-pocketbase/pb_migrations/<unix_ts>_aura_collections.js`:

  ```js
  migrate((app) => {
    app.importCollectionsByMarshaledJSON(`<json>`, false);
  }, (app) => {
    // delete products, journal_articles, orders if they exist
  });
  ```

- Append-only: finds the newest `*_aura_collections.js`. If its embedded JSON
  equals the current JSON it prints "up to date" and writes nothing; otherwise
  it writes a new file with a new timestamp. Existing migrations are never
  edited.
- `--check` exits 1 when the latest migration is out of date (for future CI).

## 4. Repository hygiene

- Root `.gitignore`: `.DS_Store`, `node_modules`, `dist`, `pb_data/`,
  `pocketbase`, `pocketbase.exe`, `.env.local`.
- Both `pbc.json` files are reduced to the `build` block (plus
  `pocketbaseVersion` for BE). `pbc` writes project/environment ids on a user's
  first deploy, so clones no longer target the author's project.

## 5. Documentation

- Root `README.md`, following the infographic:
  1. Idea
  2. Try the online demo — demo link, mock login, the three setup steps
  3. Clone and log in — `pbc login`, `pbc whoami`, `pbc project ls`,
     `pbc project use <project>`
  4. Backend — `pbc local init`, `./pocketbase superuser upsert EMAIL PASS`,
     `./pocketbase serve`, `pbc pocketbase deploy`;
     Frontend — `bun install`, `.env.local`, `bun run dev`, `pbc frontend deploy`
  5. What you get on Cloud — dashboard URL, API URL, admin credentials via
     `pbc pocketbase info`
  - "Changing the schema": edit JSON → `bun run sync:schema` → redeploy BE.
- Rewrite `BE-pocketbase/README.md` concisely; fill the empty
  `FE-pocketbase/README.md`.

## 6. Verification

Against real binaries; no new test framework.

1. `bun run lint` (tsc) and `bun run build` pass.
2. Migration on a scratch `pb_data`: serve → three collections exist with the
   expected rules (`pbc admin rules get`) → `migrate down 1` removes them →
   applying again succeeds → a second `sync:schema` prints "up to date".
3. Wizard end-to-end on the production build (`vite preview`, mock default)
   against a local PocketBase with no schema: mock login → Setup → connect →
   automatic import → seed → seed again creates no duplicates → switch to
   remote → storefront shows server data → checkout creates an order →
   "Use demo data" returns to mock.
4. Error paths: wrong password, unreachable URL.

Actual command output is reported for each step.

## Out of scope

- Deploying to the author's PocketBase Cloud project.
- GitHub Actions (`pbc ci init`).
- Translating docs or UI.
