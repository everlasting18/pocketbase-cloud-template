# Admin (Tailwind v4 + shadcn/ui) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real Tailwind v4 build + shadcn/ui, and a PocketBase-backed `/admin` (products, journal, orders, settings) behind superuser login, with the storefront visually unchanged.

**Architecture:** Tailwind v4 via `@tailwindcss/vite` replaces the CDN; shadcn (`radix` base, `nova` preset) is initialised into `src/styles/index.css`. The router gets two branches: storefront (wrapped in its providers) and a lazily loaded admin branch with its own auth context and sidebar layout. Admin talks to PocketBase through `services/pocketbase/{auth,adminApi}.ts`.

**Tech Stack:** Vite 6, React 19, react-router 7, Tailwind 4.3, shadcn 4.21 (radix-nova), react-hook-form 7, zod 4, sonner 2, pocketbase SDK 0.28.

**Spec:** `docs/specs/2026-09-10-admin-shadcn-design.md`

## Global Constraints

- Paths relative to `/Users/macbookpro/CODE/PocketbaseCloud-Template/FrontEnd`. Not a git repo; checkpoints are `npm run lint` + `npm run build`. Backup: scratchpad `frontend-backup-pre-admin/`.
- Storefront must render identically to scratchpad `smoke/shots-before/*.png`.
- shadcn init command (verified in a trial copy): `npx -y shadcn@4.21.0 init -t vite -b radix -p nova -y --no-monorepo --pointer`. It adds `@fontsource-variable/geist`, `class-variance-authority`, `cn` (official shadcn class merger), `radix-ui`, `shadcn`, `tw-animate-css`, writes `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, and appends theme CSS to `src/styles/index.css`.
- There is no shadcn `form` component in this registry; forms use `field` + react-hook-form `Controller`.
- `@types/react@^19` and `@types/react-dom@^19` are required (verified: 0 type errors after adding them).
- Geist font and shadcn neutral theme apply only inside the admin root (`.admin`); storefront keeps Tailwind's default `font-sans` stack and Playfair headings.
- PocketBase filters use `pb.filter()` bindings, never string interpolation.
- Sidebar needs `TooltipProvider` around it.

---

### Task 1: Tailwind v4 + shadcn init, storefront unchanged

**Files:** Modify `package.json`, `vite.config.ts`, `index.html`, `src/styles/index.css`, `src/layouts/MainLayout.tsx`, storefront components with v3-only classes. Create (by CLI) `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`.

- [ ] Install: `npm i tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 && npm i -D @types/react@^19 @types/react-dom@^19`
- [ ] `vite.config.ts`: add `import tailwindcss from '@tailwindcss/vite'` and `plugins: [react(), tailwindcss()]`.
- [ ] Prepend `@import "tailwindcss";` to `src/styles/index.css`; delete `<script src="https://cdn.tailwindcss.com"></script>` from `index.html`.
- [ ] Run the shadcn init command above.
- [ ] Rewrite the storefront part of `src/styles/index.css` (keep everything shadcn generated from `@theme inline` down, except the edits listed):
  - First line becomes the Google Fonts `@import url(...Playfair Display...)` (must precede all rules), then `@import "tailwindcss";`, `@import "tw-animate-css";`, `@import "shadcn/tailwind.css";`, `@import "@fontsource-variable/geist";`.
  - Remove `--font-sans: 'Geist Variable', sans-serif;` from `@theme inline` and remove `html { @apply font-sans; }` from `@layer base`.
  - Add `@theme { --font-serif: 'Playfair Display', serif; }`.
  - Delete the unlayered `body {…}` rule and the `h1, h2, h3, h4, .font-serif {…}` rule; add `.storefront :is(h1, h2, h3, h4) { font-family: var(--font-serif); }`.
  - Add `.admin { --font-sans: 'Geist Variable', sans-serif; font-family: var(--font-sans); }`.
  - Keep `html { scroll-behavior… scroll-padding-top… }`, `.no-scrollbar`, `fade-in-up` keyframes/utilities.
- [ ] `MainLayout.tsx` root div: add `storefront` to its className.
- [ ] v3→v4 renames across `src/components src/pages`:

```bash
cd src && grep -rl . --include='*.tsx' components pages layouts | xargs sed -i '' -E \
  -e 's/\bshadow-sm\b/shadow-xs/g' \
  -e 's/\bbackdrop-blur-sm\b/backdrop-blur-xs/g' \
  -e 's/\bbackdrop-blur([" ])/backdrop-blur-sm\1/g' \
  -e 's/\boutline-none\b/outline-hidden/g' \
  -e 's/\bdrop-shadow-sm\b/drop-shadow-xs/g' \
  -e 's/\bflex-shrink-0\b/shrink-0/g' \
  -e 's/ text-shadow-sm//g'
```
  (`components/ui` does not exist yet except `button.tsx`; exclude it: run the sed only on non-`ui` files.)
- [ ] Verify: `npm run lint` → 0; `npm run build` ok; run storefront smoke (`node smoke.mjs`, modal checks still present in this task) → all pass; screenshot 01–05 visually match `shots-before/`.

### Task 2: Admin foundation (deps, services, auth, router, layout, login)

**Files:** Create `src/services/pocketbase/{auth,adminApi}.ts`, `src/contexts/AdminAuthContext.tsx`, `src/routers/adminRoutes.tsx`, `src/layouts/AdminLayout.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/pages/admin/LoginPage.tsx`. Modify `src/types/index.ts`, `src/services/pocketbase/{mappers,index}.ts`, `src/routers/index.tsx`, `src/App.tsx`.

**Interfaces (produced):**
- `@/types`: `OrderStatus = "pending" | "paid" | "shipped" | "cancelled"`; `Order.status?: OrderStatus`.
- `auth.ts`: `isSuperuserSession(): boolean`, `currentAdminEmail(): string`, `loginSuperuser(email: string, password: string): Promise<void>`, `logout(): void`.
- `mappers.ts`: `mapPbRecordToOrder(record: any): Order`.
- `adminApi.ts`: `Page<T> = { items: T[]; page: number; totalPages: number; totalItems: number }`; `ListParams = { page: number; perPage?: number; search?: string }`; `ProductInput = Omit<Product, "id">`; `ArticleInput = { title: string; date: string; excerpt: string; image: string; contentHtml: string }`; `listProducts(p): Promise<Page<Product>>`, `getProduct(id)`, `createProduct(input)`, `updateProduct(id, input)`, `deleteProduct(id)`; same five for articles (`listArticles`, `getArticle`, `createArticle`, `updateArticle`, `deleteArticle`); `listOrders(p: { page: number; perPage?: number; status?: OrderStatus }): Promise<Page<Order>>`, `updateOrderStatus(id, status): Promise<void>`. List sort `-created`, perPage default 20, filters via `pb.filter("name ~ {:q}", { q })` / `"title ~ {:q}"` / `"status = {:s}"`.
- `useAdminAuth(): { isAuthed: boolean; email: string; login(email, password): Promise<void>; logout(): void }`.

- [ ] `npm i react-hook-form zod @hookform/resolvers` and
      `npx -y shadcn@4.21.0 add -y input label textarea select table card badge dialog alert-dialog sheet sidebar dropdown-menu sonner skeleton separator alert field pagination`
- [ ] Router: `/` branch element becomes `StorefrontRoot` = `<CatalogProvider><CartProvider><MainLayout/></CartProvider></CatalogProvider>`; add `{ path: "/admin/*", lazy: async () => ({ Component: (await import("./adminRoutes")).default }) }`. `App.tsx` renders only `<RouterProvider router={router} />`.
- [ ] `adminRoutes.tsx` (default export `AdminRoot`): on mount `document.body.classList.add("admin")` (removed on unmount, so Radix portals get the admin font); renders `AdminAuthProvider > TooltipProvider > <Routes>` with `login`, and under `<AdminLayout/>`: index → `products`, `products`, `products/new`, `products/:id/edit`, `journal`, `journal/new`, `journal/:id/edit`, `orders`, `settings`, `*` → `products`; plus `<Toaster richColors position="top-right" />`. Pages not built yet are temporary `<p>` placeholders replaced in Tasks 3–4.
- [ ] `AdminLayout`: if `!isAuthed` → `<Navigate to={"/admin/login?next=" + encodeURIComponent(pathname)} replace/>`; else `SidebarProvider > AdminSidebar + SidebarInset` (header with `SidebarTrigger` + `Separator`, then `<main className="p-6"><Outlet/></main>`).
- [ ] `AdminSidebar`: header "Aura Admin"; menu Products `/admin/products` (Package), Journal `/admin/journal` (BookOpen), Orders `/admin/orders` (ShoppingBag), Settings `/admin/settings` (Settings2) using `SidebarMenuButton asChild isActive={pathname.startsWith(to)}` + `<Link>`; footer shows email, "View store" link to `/`, Logout button.
- [ ] `LoginPage`: centered `Card`, zod `{ email: z.email(), password: z.string().min(1) }`, `Controller` + `Field`/`FieldLabel`/`FieldError`, submit → `login` → `navigate(next ?? "/admin/products", { replace: true })`; failure → destructive `Alert` with the error message; already authed → `<Navigate to="/admin/products" replace/>`.
- [ ] Verify: lint 0, build ok and a separate admin chunk appears in `dist/assets`; `/admin/products` unauthenticated redirects to `/admin/login?next=%2Fadmin%2Fproducts`.

### Task 3: Products + Journal admin pages

**Files:** Create `src/hooks/useAdminQuery.ts`, `src/components/admin/{PageHeader,DataState,ConfirmDelete,ListPagination,ProductForm,ArticleForm}.tsx`, `src/pages/admin/{ProductsPage,ProductEditPage,ArticlesPage,ArticleEditPage}.tsx`. Modify `src/routers/adminRoutes.tsx` (replace placeholders).

**Interfaces:**
- `useAdminQuery<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; error: string | null; loading: boolean; reload(): void }` — ignores results of stale calls.
- `PageHeader({ title, description?, actions? })`, `DataState({ loading, error, onRetry, rows? })` (skeleton rows while loading, destructive Alert + Retry on error), `ConfirmDelete({ title, description, onConfirm: () => Promise<void> })` (trash icon button → AlertDialog), `ListPagination({ page, totalPages, onPageChange })` (hidden when totalPages ≤ 1).
- `ProductForm({ initial?: Product; submitLabel: string; onSubmit(input: ProductInput): Promise<void> })`, `ArticleForm({ initial?: JournalArticle; submitLabel: string; onSubmit(input: ArticleInput): Promise<void> })`.

- [ ] Product zod schema (strings for every input; converted on submit): `name` min 1, `tagline`, `description` min 1, `longDescription`, `price` string refined to a number ≥ 0, `category` enum of the four categories, `imageUrl` `z.union([z.literal(""), z.url()])`, `gallery`/`features` textarea (one per line → `string[]`, blanks dropped), `slug`. Article schema: `title` min 1, `date`, `excerpt` min 1, `image` url-or-empty, `contentHtml`.
- [ ] Lists: search `Input` (300 ms debounce, resets page to 1), `Table` (products: thumbnail, name, category `Badge`, price, actions; articles: cover, title, date, actions), Edit → `/admin/<kind>/:id/edit`, "New" button → `/new`, delete via `ConfirmDelete` → toast → reload. Empty state row "No products yet." / "No articles yet.".
- [ ] Edit pages: `id` param → `getX(id)` via `useAdminQuery` (DataState while loading/error); submit → create/update → `toast.success` → navigate back to the list; errors → `toast.error(message)`, form stays.
- [ ] Verify: lint 0, build ok.

### Task 4: Orders + Settings, remove the storefront modal

**Files:** Create `src/components/admin/{OrderSheet,ConnectionCard,CollectionMapping}.tsx`, `src/pages/admin/{OrdersPage,SettingsPage}.tsx`. Modify `adminRoutes.tsx`, `layouts/MainLayout.tsx`, `components/layout/Navbar.tsx`. Delete `src/components/pocketbase/`.

- [ ] OrdersPage: status `Select` (All + 4 statuses), `Table` (ref = last 6 chars of id, customer name/email, total, status `Badge`, created date), row click opens `OrderSheet` (customer, address, items with qty × price, total, status `Select` + Save → `updateOrderStatus` → toast → reload list). `ListPagination`.
- [ ] SettingsPage: `ConnectionCard` (URL `Input`, Test → `testPocketBaseConnection(url)` shown as Alert, Save & Apply → `setPocketBaseUrl(url)` then test) and `CollectionMapping` (button group of collection names + `Table` of fields + rules line) using `POCKETBASE_COLLECTIONS_MAPPING`.
- [ ] Storefront: remove modal + its state from `MainLayout`, remove both PocketBase buttons and the `onOpenPocketBase` prop/`useCatalog` use from `Navbar`, delete `src/components/pocketbase/`.
- [ ] Verify: lint 0, build ok, `grep -rn "PocketBaseModal\|onOpenPocketBase" src` → nothing.

### Task 5: Verification

- [ ] Storefront smoke (`smoke/smoke.mjs`): replace the modal section with a check that the navbar has no "PocketBase" button; re-run → all pass; compare new 01–05 screenshots with `shots-before/`.
- [ ] Admin smoke (`smoke/admin.mjs`, Playwright + system Chrome): `page.route("**/api/**")` serves an in-memory PocketBase (CORS headers, OPTIONS → 204; `/api/health`; `_superusers/auth-with-password` returns a JWT-shaped token with payload `{ exp: 9999999999, type: "auth", collectionId: "pbc_3142635823" }` and `record.collectionName = "_superusers"`; list/get/create/update/delete for `products`, `journal_articles`, `orders`, honouring `page`, `perPage` and `~`/`=` filters). Checks: guard redirect with `next`; bad password shows error; login; products list 3 rows; search narrows to 1; create → row appears; edit → name updated; delete → row gone; journal create; orders sheet status → shipped badge; settings mapping table; logout → login page. Screenshot each admin page and look at them.
