# FrontEnd Restructure — Design

Date: 2026-09-10 · Status: approved

## Goal

Move the Vite + React app from a half-finished root/`src` split into a
conventional type-based `src/` layout, add real URL routing with
react-router, and remove features whose source files were deleted
(Gemini assistant, PocketBase seeder, schema export). No visual changes.

## Current problems

- `tsc` reports 27 errors: `App.tsx`, `types.ts`, `constants.ts`,
  `index.tsx` live at the root while components moved to `src/`.
- Imports point at files that no longer exist: `seedData.ts`,
  `pb_schema.json`, `geminiService.ts`.
- Empty/dead code: `hooks/*` (0 bytes), `Features.tsx` (unused),
  empty `integrations/`, `layouts/`, `page/`, `routers/`, `constants/`.

## Target layout

```
index.html                 # stays at root (Vite), script → /src/main.tsx
vite.config.ts             # alias @ → ./src; Gemini define removed
tsconfig.json              # paths @/* → ./src/*
src/
  main.tsx
  App.tsx                  # CatalogProvider > CartProvider > RouterProvider
  routers/index.tsx        # createBrowserRouter
  layouts/MainLayout.tsx   # Navbar, Outlet, Footer, CartDrawer, PocketBaseModal, ScrollRestoration
  pages/
    HomePage.tsx           # Hero, ProductGrid, About, JournalList
    ProductDetailPage.tsx  # /products/:id  (matches slug or id)
    JournalDetailPage.tsx  # /journal/:id
    CheckoutPage.tsx       # /checkout — rendered without Navbar/Footer
  components/
    layout/     Navbar, Footer
    home/       Hero, About
    product/    ProductGrid, ProductCard
    journal/    JournalList
    cart/       CartDrawer
    pocketbase/ PocketBaseModal, MappingTab, ConnectionTab
  contexts/
    CartContext.tsx        # items, addToCart, removeFromCart, isCartOpen, open/close
    CatalogContext.tsx     # products, articles, isConnected, isRemoteActive, isLoading, reload
  services/pocketbase/
    client.ts              # getPocketBase, setPocketBaseUrl, getCurrentPocketBaseUrl, testPocketBaseConnection
    mappers.ts             # mapPbRecordToProduct, mapPbRecordToArticle
    api.ts                 # fetchProductsFromPocketBase, fetchArticlesFromPocketBase, saveOrderToPocketBase
    index.ts               # barrel
  constants/
    products.ts, articles.ts, brand.ts, pocketbaseCollections.ts
  types/index.ts
  styles/index.css         # inline <style> block moved out of index.html
```

## Routing

| Path | Page | Chrome |
|---|---|---|
| `/` | HomePage | Navbar + Footer |
| `/products/:id` | ProductDetailPage | Navbar + Footer |
| `/journal/:id` | JournalDetailPage | Navbar + Footer |
| `/checkout` | CheckoutPage | none |
| `*` | redirect to `/` | — |

- Navbar/Footer/Hero section links become `<Link to="/#products">` etc.
- `<ScrollRestoration />` scrolls to `location.hash` when present,
  otherwise to top, on every navigation. The existing CSS
  `scroll-padding-top: 80px` + `scroll-behavior: smooth` supply the
  header offset and smoothness, so no custom scroll hook is needed.
  (If hash scrolling proves unreliable in the smoke test, add
  `src/hooks/useScrollToHash.ts` then.)
- Detail pages wait for `isLoading === false`, then look up by `slug`
  or `id`; not found → `<Navigate to="/" replace />`.
- Back buttons: product → `/#products`, journal → `/#journal`,
  checkout → `/`.

## Data flow

- `CatalogContext` runs the existing `loadData` logic once on mount
  (health check → remote fetch → local fallback) and exposes `reload`
  for the PocketBase modal.
- `CartContext` owns cart items and drawer state; adding to cart opens
  the drawer. Checkout from the drawer closes it and navigates to
  `/checkout`.
- PocketBase modal open state is local to `MainLayout`.

## Removals

- `Assistant.tsx`, `ChatMessage` type.
- PocketBaseModal: Seed Data tab, Schema JSON tab, Copy/Download
  `pb_schema.json` buttons, onboarding steps 4–5 referencing them.
- `seedPocketBaseData`, `SeedResult`.
- `Features.tsx`, empty hook files, `ViewState`, `LoadingState`,
  empty directories, root `index.tsx`/`App.tsx`/`types.ts`/
  `constants.ts`/`index.css`.
- `tsx` devDependency. Add `react-router` dependency.

## Out of scope

Styling changes, Tailwind build setup (CDN stays), tests framework,
new features.

## Verification

- `npm run lint` (tsc --noEmit): 0 errors.
- `npm run build`: succeeds.
- Dev server smoke test: each route, hash links, cart add/remove,
  checkout, PocketBase modal tabs.

Deployment note: static hosting needs an SPA rewrite to `index.html`.
