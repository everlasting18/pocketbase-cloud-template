# Admin with Tailwind v4 + shadcn/ui — Design

Date: 2026-09-10 · Status: approved

## Goal

Replace the Tailwind v3 play-CDN with a real Tailwind v4 build, add
shadcn/ui, and build a PocketBase-backed Admin at `/admin` for products,
journal articles, orders and PocketBase settings. The storefront must
look the same after the Tailwind migration.

## Decisions (from the user)

- Admin scope: Products CRUD, Journal CRUD, Orders (list, detail, status),
  PocketBase Connection + Collection Mapping moved from the storefront
  modal into Admin.
- Auth: PocketBase superuser (`_superusers` collection).
- PocketBase: the configured cloud instance returns HTTP 525, so build
  UI only; verify admin flows with Playwright-mocked API responses in the
  test script (no mock code in the app).
- Theme: shadcn default (neutral). No dark-mode toggle.

## 1. Tailwind v4 migration

- Add `tailwindcss` + `@tailwindcss/vite`; remove the
  `cdn.tailwindcss.com` script from `index.html`.
- `src/styles/index.css` starts with `@import "tailwindcss";`, then
  shadcn's theme (added by `shadcn init`), then storefront CSS.
- v3 → v4 renames in storefront code (keeps the look identical):
  `shadow-sm`→`shadow-xs`, `backdrop-blur-sm`→`backdrop-blur-xs`,
  `backdrop-blur`→`backdrop-blur-sm`, `outline-none`→`outline-hidden`,
  `drop-shadow-sm`→`drop-shadow-xs`, `flex-shrink-0`→`shrink-0`;
  delete `text-shadow-sm` (a no-op in v3, a real shadow in v4.1+).
- Base rule restoring v3's pointer cursor on enabled buttons.
- `--font-serif` in `@theme` = `'Playfair Display', serif` (replaces the
  manual `.font-serif` rule). The `h1–h4 → Playfair` rule is scoped to
  the storefront root (`.storefront`) so admin headings use shadcn's
  font. Body background/colour rules stay unlayered so they win over
  shadcn's layered `body` rule on the storefront; the admin root sets
  `bg-background text-foreground` itself.
- `prose` stays a no-op (typography plugin not added, as today).

## 2. Structure

```
src/
  lib/utils.ts                       # shadcn cn()
  components/ui/*                    # shadcn components
  components/admin/                  # AdminSidebar, ProductForm, ArticleForm,
                                     # OrderSheet, ConfirmDelete, DataState,
                                     # ConnectionCard, CollectionMapping
  contexts/AdminAuthContext.tsx      # superuser session
  layouts/AdminLayout.tsx            # SidebarProvider + guard + <Outlet/>
  pages/admin/
    LoginPage.tsx
    ProductsPage.tsx  ProductEditPage.tsx
    ArticlesPage.tsx  ArticleEditPage.tsx
    OrdersPage.tsx
    SettingsPage.tsx
  routers/index.tsx                  # storefront branch + lazy admin branch
  services/pocketbase/
    auth.ts                          # loginSuperuser, logout, isSuperuserSession
    adminApi.ts                      # typed CRUD
```

Removed: `components/pocketbase/*` (modal and tabs; their content is
rebuilt with shadcn in `components/admin/`), Navbar PocketBase button.
`CatalogProvider`/`CartProvider` move from `App.tsx` into the storefront
route branch (`StorefrontRoot`), so Admin never loads the catalog.

## 3. Routes

| Path | Page |
|---|---|
| `/admin/login` | LoginPage (public) |
| `/admin` | → `/admin/products` |
| `/admin/products` | table: search by name, 20/page pagination |
| `/admin/products/new`, `/admin/products/:id/edit` | ProductForm |
| `/admin/journal` | table: search by title, pagination |
| `/admin/journal/new`, `/admin/journal/:id/edit` | ArticleForm |
| `/admin/orders` | table filtered by status; row opens OrderSheet |
| `/admin/settings` | Connection card + Collection Mapping |

All admin routes except login are wrapped by the guard in
`AdminLayout`; unauthenticated → `/admin/login?next=<path>`. The whole
admin branch is code-split with route `lazy`.

## 4. Data

- `auth.ts`: `loginSuperuser(email, password)` →
  `pb.collection("_superusers").authWithPassword`; `logout()` clears
  `pb.authStore`; session valid when `authStore.isValid && authStore.isSuperuser`.
- `adminApi.ts` (all throw on failure; UI catches):
  - `listProducts({ page, perPage, search })` → `{ items: Product[], totalPages, totalItems }`
  - `getProduct(id)`, `createProduct(input)`, `updateProduct(id, input)`, `deleteProduct(id)`
  - same five for articles (`JournalArticle`)
  - `listOrders({ page, perPage, status? })`, `updateOrderStatus(id, status)`
- Filters are built with `pb.filter()` (parameter binding, no string
  interpolation).
- `OrderStatus = "pending" | "paid" | "shipped" | "cancelled"`.

## 5. UI behaviour

- Forms: react-hook-form + zod. Product: name*, tagline, description*,
  longDescription, price* (≥0), category* (select), imageUrl (url),
  gallery (one URL per line), features (one per line), slug. Article:
  title*, date, excerpt*, image (url), contentHtml (textarea).
- Loading: skeleton rows. Error: inline alert with the PocketBase
  message and a Retry button (covers the current 525 instance).
- Delete: AlertDialog confirm. Success/failure: sonner toast.
- Settings: URL input + Test + Save & Apply (existing client functions),
  collection mapping table from `POCKETBASE_COLLECTIONS_MAPPING`.

## 6. Verification

- `npm run lint` (0 errors), `npm run build`.
- Storefront visual regression: screenshots from the CDN-era smoke run
  (kept as `shots-before/`) vs the same flows after migration.
- Storefront smoke test re-run (all previous checks, minus the removed
  modal checks).
- Admin Playwright run with `page.route` mocks of `/api/collections/**`:
  guard redirect, login, products list/search/create/edit/delete,
  journal create, orders sheet status change, settings render, logout.

## Out of scope

Real PocketBase provisioning, file uploads (image fields stay URLs),
rich-text editor, dashboard/analytics, dark mode, users/roles.
