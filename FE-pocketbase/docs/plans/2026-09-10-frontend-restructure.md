# FrontEnd Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Aura storefront into a conventional type-based `src/` layout with react-router URLs, removing the Gemini assistant, PocketBase seeder and schema export.

**Architecture:** Task 1 is a behavior-preserving move (plus the approved feature removals) that gets `tsc` from 27 errors to 0 while the app still uses `useState<ViewState>` navigation. Task 2 swaps that state machine for `createBrowserRouter`, a `MainLayout`, route pages, and two contexts (catalog, cart). Task 3 is the end-to-end smoke test.

**Tech Stack:** Vite 6, React 19, TypeScript 5.8, react-router 7, pocketbase JS SDK, Tailwind via CDN.

**Spec:** `docs/specs/2026-09-10-frontend-restructure-design.md`

## Global Constraints

- All paths below are relative to `/Users/macbookpro/CODE/PocketbaseCloud-Template/FrontEnd`.
- Not a git repository (user declined git). No commit steps; the checkpoint after each task is `npm run lint` + `npm run build`. Pre-refactor backup lives in the session scratchpad at `frontend-backup/`.
- No test framework exists and none is added; verification is `tsc --noEmit`, `vite build`, and a browser smoke test.
- No visual changes: className strings are copied verbatim.
- Cross-folder imports use the `@/` alias (→ `src/`); same-folder imports stay relative.
- Keep the `/** @license SPDX-License-Identifier: Apache-2.0 */` header on every source file.
- `index.html` stays at the project root (Vite requirement).

---

### Task 1: Restructure files without changing navigation

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/types/index.ts`, `src/constants/{products,articles,brand,pocketbaseCollections}.ts`, `src/services/pocketbase/{client,mappers,api,index}.ts`, `src/styles/index.css`, `src/components/pocketbase/{PocketBaseModal,MappingTab,ConnectionTab}.tsx`
- Move: `src/components/*.tsx` → `src/components/{layout,home,product,journal,cart}/`, detail/checkout screens → `src/pages/*Page.tsx`
- Modify: `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`
- Delete: root `App.tsx`, `index.tsx`, `types.ts`, `constants.ts`, `index.css`; `src/services/pocketbase.ts`; `src/components/{Assistant,Features,PocketBaseModal}.tsx`; `src/hooks/`, `src/integrations/`, `src/page/`, empty `src/routers/`

**Interfaces:**
- Produces:
  - `@/types`: `Product`, `JournalArticle`, `OrderItem`, `Order`, `PbFieldMapping`, `PbCollectionDefinition`, `ViewState` (ViewState removed in Task 2)
  - `@/constants/products`: `PRODUCTS: Product[]`; `@/constants/articles`: `JOURNAL_ARTICLES: JournalArticle[]`; `@/constants/brand`: `BRAND_NAME`; `@/constants/pocketbaseCollections`: `POCKETBASE_COLLECTIONS_MAPPING: PbCollectionDefinition[]`
  - `@/services/pocketbase`: `getPocketBase()`, `setPocketBaseUrl(url)`, `getCurrentPocketBaseUrl()`, `getDefaultPocketBaseUrl()`, `testPocketBaseConnection(url?)`, `mapPbRecordToProduct`, `mapPbRecordToArticle`, `fetchProductsFromPocketBase()`, `fetchArticlesFromPocketBase()`, `saveOrderToPocketBase(order)` — signatures unchanged from the old `src/services/pocketbase.ts`
  - Component default exports: `layout/Navbar`, `layout/Footer`, `home/Hero`, `home/About`, `product/ProductGrid`, `product/ProductCard`, `journal/JournalList`, `cart/CartDrawer`, `pocketbase/PocketBaseModal`; pages `ProductDetailPage`, `JournalDetailPage`, `CheckoutPage` (still prop-driven in this task)

- [ ] **Step 1: Confirm the starting failure count**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `27`

- [ ] **Step 2: Dependencies**

```bash
npm install react-router@^7.8.0
npm uninstall tsx
```

- [ ] **Step 3: Split the PocketBase service (old file line numbers)**

```bash
OLD=src/services/pocketbase.ts
HDR=$'/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n */\n'
mkdir -p src/services/pocketbase src/constants src/types src/styles

{ echo "$HDR"; echo 'import PocketBase from "pocketbase";'; echo; sed -n 20,109p $OLD; } > src/services/pocketbase/client.ts

{ echo "$HDR"; echo 'import type { JournalArticle, Product } from "@/types";'; echo; sed -n 111,148p $OLD; } > src/services/pocketbase/mappers.ts

{ echo "$HDR"
  echo 'import { JOURNAL_ARTICLES } from "@/constants/articles";'
  echo 'import { PRODUCTS } from "@/constants/products";'
  echo 'import type { JournalArticle, Order, Product } from "@/types";'
  echo 'import { getPocketBase } from "./client";'
  echo 'import { mapPbRecordToArticle, mapPbRecordToProduct } from "./mappers";'
  echo; sed -n 150,218p $OLD; echo; sed -n 340,361p $OLD; } > src/services/pocketbase/api.ts

{ echo "$HDR"; echo 'import type { PbCollectionDefinition } from "@/types";'; echo; sed -n 363,587p $OLD; } \
  | sed 's#(src/types.ts)#(src/types/index.ts)#' > src/constants/pocketbaseCollections.ts

printf '%s\nexport * from "./client";\nexport * from "./mappers";\nexport * from "./api";\n' "$HDR" > src/services/pocketbase/index.ts
```

Lines 220–338 (`SeedResult`, `seedPocketBaseData`) are intentionally dropped.

- [ ] **Step 4: Split constants (old `constants.ts` line numbers)**

```bash
{ echo "$HDR"; echo 'import type { Product } from "@/types";'; echo; sed -n 9,101p constants.ts; } > src/constants/products.ts
{ echo "$HDR"; echo 'import React from "react";'; echo 'import type { JournalArticle } from "@/types";'; echo; sed -n 103,173p constants.ts; } > src/constants/articles.ts
printf '%s\nexport const BRAND_NAME = "Aura";\n' "$HDR" > src/constants/brand.ts
```

`PRIMARY_COLOR` / `ACCENT_COLOR` are unused and dropped.

- [ ] **Step 5: Write `src/types/index.ts`**

```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from "react";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription?: string;
  price: number;
  category: "Audio" | "Wearable" | "Mobile" | "Home";
  imageUrl: string;
  gallery?: string[];
  features: string[];
  slug?: string;
}

export interface JournalArticle {
  id: number | string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  content: React.ReactNode | string; // JSX locally, HTML string from PocketBase
  contentHtml?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id?: string;
  customerEmail: string;
  customerName?: string;
  shippingAddress?: string;
  city?: string;
  postalCode?: string;
  totalAmount: number;
  items: OrderItem[];
  status?: "pending" | "paid" | "shipped";
  created?: string;
}

// PocketBase collection definitions and field mappings
export interface PbFieldMapping {
  projectProperty: string;
  pbFieldName: string;
  pbFieldType:
    | "text"
    | "number"
    | "bool"
    | "email"
    | "url"
    | "date"
    | "select"
    | "json"
    | "file"
    | "relation"
    | "editor";
  required: boolean;
  notes: string;
}

export interface PbCollectionDefinition {
  collectionName: string;
  projectModel: string;
  description: string;
  fields: PbFieldMapping[];
  rules: {
    list: string;
    view: string;
    create: string;
    update: string;
    delete: string;
  };
}

export type ViewState =
  | { type: "home" }
  | { type: "product"; product: Product }
  | { type: "journal"; article: JournalArticle }
  | { type: "checkout" };
```

(`PbSyncStatus`, `ChatMessage`, `LoadingState` dropped — no remaining users.)

- [ ] **Step 6: Move components**

```bash
cd src/components
mkdir -p layout home product journal cart pocketbase ../pages
mv Navbar.tsx Footer.tsx layout/
mv Hero.tsx About.tsx home/
mv ProductGrid.tsx ProductCard.tsx product/
mv Journal.tsx journal/JournalList.tsx
mv CartDrawer.tsx cart/
mv ProductDetail.tsx ../pages/ProductDetailPage.tsx
mv JournalDetail.tsx ../pages/JournalDetailPage.tsx
mv Checkout.tsx ../pages/CheckoutPage.tsx
rm Assistant.tsx Features.tsx
cd ../..

sed -i '' -E "s#from ['\"]\.\./types['\"]#from '@/types'#" src/components/*/*.tsx src/pages/*.tsx
sed -i '' "s#import { JOURNAL_ARTICLES } from '../constants'#import { JOURNAL_ARTICLES } from '@/constants/articles'#" src/components/journal/JournalList.tsx
sed -i '' -e 's/interface JournalProps/interface JournalListProps/' -e 's/const Journal: React.FC<JournalProps>/const JournalList: React.FC<JournalListProps>/' -e 's/export default Journal;/export default JournalList;/' src/components/journal/JournalList.tsx
sed -i '' "s#import { PRODUCTS } from '../constants'#import { PRODUCTS } from '@/constants/products'#" src/components/product/ProductGrid.tsx
sed -i '' "s#import { BRAND_NAME } from '../constants'#import { BRAND_NAME } from '@/constants/brand'#" src/components/layout/Navbar.tsx
sed -i '' "s#from '../services/pocketbase'#from '@/services/pocketbase'#" src/pages/CheckoutPage.tsx
sed -i '' 's#title="PocketBase Cloud Connection, Collection Mapping & Seeder"#title="PocketBase Cloud Connection \& Collection Mapping"#' src/components/layout/Navbar.tsx
```

- [ ] **Step 7: Split PocketBaseModal into three files (old modal line numbers)**

`MappingTab` = old lines 241–251 + 266–370 (drops the Copy/Download `pb_schema.json` buttons at 252–265).

```bash
OLDM=src/components/PocketBaseModal.tsx
{ echo "$HDR"
  echo 'import React, { useState } from "react";'
  echo 'import { POCKETBASE_COLLECTIONS_MAPPING } from "@/constants/pocketbaseCollections";'
  echo
  echo 'const MappingTab: React.FC = () => {'
  echo '  const [selectedColIndex, setSelectedColIndex] = useState(0);'
  echo '  const currentCollection = POCKETBASE_COLLECTIONS_MAPPING[selectedColIndex];'
  echo
  echo '  return ('
  { sed -n 241,251p $OLDM; sed -n 266,370p $OLDM; } | sed 's/^        //'
  echo '  );'
  echo '};'
  echo
  echo 'export default MappingTab;'
} > src/components/pocketbase/MappingTab.tsx
```

`ConnectionTab` = old lines 375–465 + new step 4 + 479–481 (drops the schema-import and Seed Data steps at 466–478).

```bash
{ echo "$HDR"
  echo 'import React from "react";'
  echo
  echo 'export interface TestStatus {'
  echo '  tested: boolean;'
  echo '  connected: boolean;'
  echo '  message: string;'
  echo '  code?: number;'
  echo '}'
  echo
  echo 'interface ConnectionTabProps {'
  echo '  urlInput: string;'
  echo '  onUrlInputChange: (value: string) => void;'
  echo '  testing: boolean;'
  echo '  testStatus: TestStatus;'
  echo '  onTest: () => void;'
  echo '  onApply: () => void;'
  echo '}'
  echo
  echo 'const ConnectionTab: React.FC<ConnectionTabProps> = ({'
  echo '  urlInput,'
  echo '  onUrlInputChange,'
  echo '  testing,'
  echo '  testStatus,'
  echo '  onTest,'
  echo '  onApply,'
  echo '}) => {'
  echo '  return ('
  { sed -n 375,465p $OLDM
    cat <<'LI'
                  <li>
                    Create the{" "}
                    <code className="bg-[#EBE7DE] px-1 py-0.5">products</code>,{" "}
                    <code className="bg-[#EBE7DE] px-1 py-0.5">journal_articles</code>{" "}
                    and{" "}
                    <code className="bg-[#EBE7DE] px-1 py-0.5">orders</code>{" "}
                    collections with the fields listed in the Collection Mapping tab.
                  </li>
LI
    sed -n 479,481p $OLDM; } \
  | sed -e 's/^        //' \
        -e 's/onChange={(e) => setUrlInput(e.target.value)}/onChange={(e) => onUrlInputChange(e.target.value)}/' \
        -e 's/onClick={() => handleTestConnection()}/onClick={onTest}/' \
        -e 's/onClick={handleApplyUrl}/onClick={onApply}/'
  echo '  );'
  echo '};'
  echo
  echo 'export default ConnectionTab;'
} > src/components/pocketbase/ConnectionTab.tsx
```

Then write `src/components/pocketbase/PocketBaseModal.tsx` (header/tabs/footer markup copied verbatim from old lines 135–235 and 627–650, with the Seed and Schema tabs removed and the title shortened):

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  getCurrentPocketBaseUrl,
  setPocketBaseUrl,
  testPocketBaseConnection,
} from "@/services/pocketbase";
import { JournalArticle, Product } from "@/types";
import ConnectionTab, { TestStatus } from "./ConnectionTab";
import MappingTab from "./MappingTab";

type Tab = "mapping" | "connection";

interface PocketBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed: () => void;
  isRemoteActive: boolean;
  products: Product[];
  articles: JournalArticle[];
}

const tabClass = (active: boolean) =>
  `px-6 py-3.5 font-medium border-b-2 transition-all ${
    active
      ? "border-[#2C2A26] text-[#2C2A26] bg-[#EBE7DE]/30"
      : "border-transparent text-[#A8A29E] hover:text-[#2C2A26]"
  }`;

const PocketBaseModal: React.FC<PocketBaseModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed,
  isRemoteActive,
  products,
  articles,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("mapping");
  const [urlInput, setUrlInput] = useState(getCurrentPocketBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>({
    tested: false,
    connected: false,
    message: "",
  });

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getCurrentPocketBaseUrl());
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async (targetUrl?: string) => {
    setTesting(true);
    const result = await testPocketBaseConnection(targetUrl || urlInput);
    setTesting(false);
    setTestStatus({
      tested: true,
      connected: result.connected,
      message: result.message ||
        (result.connected ? "Server healthy" : "Connection failed"),
      code: result.code,
    });
  };

  const handleApplyUrl = () => {
    setPocketBaseUrl(urlInput);
    handleTestConnection(urlInput);
    onDataRefreshed();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/40 backdrop-blur-sm animate-fade-in-up">
      <div
        className="bg-[#F5F2EB] text-[#2C2A26] w-full max-w-4xl max-h-[90vh] rounded-none border border-[#D6D1C7] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#D6D1C7] flex items-center justify-between bg-[#EBE7DE]/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                testStatus.connected
                  ? "bg-emerald-600"
                  : "bg-amber-600 animate-pulse"
              }`}
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A8A29E] block">
                Integration Hub
              </span>
              <h2 className="text-xl font-serif font-medium text-[#2C2A26]">
                PocketBase Cloud Connection
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-none border text-[11px] font-mono tracking-wide ${
                isRemoteActive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {isRemoteActive ? "● Live PB Data" : "○ Local Fallback"}
            </span>
            <button
              onClick={onClose}
              className="text-[#A8A29E] hover:text-[#2C2A26] p-1.5 transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#D6D1C7] bg-[#F5F2EB] text-xs uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab("mapping")}
            className={tabClass(activeTab === "mapping")}
          >
            1. Collection Mapping vs Project
          </button>
          <button
            onClick={() => setActiveTab("connection")}
            className={tabClass(activeTab === "connection")}
          >
            2. Connection & Health
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeTab === "mapping" && <MappingTab />}
          {activeTab === "connection" && (
            <ConnectionTab
              urlInput={urlInput}
              onUrlInputChange={setUrlInput}
              testing={testing}
              testStatus={testStatus}
              onTest={() => handleTestConnection()}
              onApply={handleApplyUrl}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#D6D1C7] bg-[#EBE7DE]/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#5D5A53]">
          <div className="flex items-center gap-4">
            <span>
              Loaded: <strong>{products.length} Products</strong>,{" "}
              <strong>{articles.length} Articles</strong>
            </span>
            <span>
              Source:{" "}
              <strong className="font-mono">
                {isRemoteActive ? "PocketBase Cloud" : "Local Static Fallback"}
              </strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2C2A26] text-[#F5F2EB] text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PocketBaseModal;
```

Then `rm src/components/PocketBaseModal.tsx src/services/pocketbase.ts`.

- [ ] **Step 8: Styles, entry, and config**

`src/styles/index.css` — the inline `<style>` block from `index.html`, verbatim:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');

html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px; /* Offset for fixed navbar */
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #F5F2EB; /* Warm cream background */
  color: #2C2A26; /* Warm dark charcoal */
}

h1, h2, h3, h4, .font-serif {
  font-family: 'Playfair Display', serif;
}

/* Hide scrollbar for clean aesthetic in horizontal scrolls if any */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 1s cubic-bezier(0.2, 1, 0.3, 1) forwards;
}

.animate-delay-200 { animation-delay: 0.2s; }
.animate-delay-400 { animation-delay: 0.4s; }
```

`index.html`: delete everything from `<style>` through `<link rel="stylesheet" href="/index.css">` (keep the fetch shim and Tailwind CDN script); change `<script type="module" src="/index.tsx">` to `src="/src/main.tsx"`.

`src/main.tsx`:

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`: move root `App.tsx` here; replace its import block (old lines 7–25) with the block below, and delete `<Assistant />`. Body otherwise unchanged in this task.

```tsx
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import ProductGrid from "@/components/product/ProductGrid";
import JournalList from "@/components/journal/JournalList";
import CartDrawer from "@/components/cart/CartDrawer";
import PocketBaseModal from "@/components/pocketbase/PocketBaseModal";
import ProductDetail from "@/pages/ProductDetailPage";
import JournalDetail from "@/pages/JournalDetailPage";
import Checkout from "@/pages/CheckoutPage";
import { JournalArticle, Product, ViewState } from "@/types";
import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import {
  fetchArticlesFromPocketBase,
  fetchProductsFromPocketBase,
  testPocketBaseConnection,
} from "@/services/pocketbase";
```

and rename `<Journal` to `<JournalList` in the JSX.

`vite.config.ts`:

```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

`tsconfig.json`: change `"@/*": ["./*"]` to `"@/*": ["./src/*"]`.

Delete leftovers:

```bash
rm App.tsx index.tsx types.ts constants.ts index.css
rm -r src/hooks src/integrations src/page src/routers src/layouts src/constants/.gitkeep 2>/dev/null; true
```

(`src/layouts` and `src/routers` are recreated in Task 2.)

- [ ] **Step 9: Verify**

Run: `npm run lint`
Expected: exits 0, no output.

Run: `npm run build`
Expected: `✓ built in …`, no errors.

Run: `grep -rn "gemini\|seedPocketBase\|pb_schema\|Assistant" src index.html vite.config.ts`
Expected: no matches.

---

### Task 2: react-router, contexts, layout, pages

**Files:**
- Create: `src/contexts/CatalogContext.tsx`, `src/contexts/CartContext.tsx`, `src/routers/index.tsx`, `src/layouts/MainLayout.tsx`, `src/pages/HomePage.tsx`
- Modify: `src/App.tsx` (rewrite), `src/pages/{ProductDetailPage,JournalDetailPage,CheckoutPage}.tsx`, `src/components/layout/{Navbar,Footer}.tsx`, `src/components/home/Hero.tsx`, `src/components/product/{ProductGrid,ProductCard}.tsx`, `src/components/journal/JournalList.tsx`, `src/types/index.ts`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces:
  - `useCatalog(): { products: Product[]; articles: JournalArticle[]; isConnected: boolean; isRemoteActive: boolean; isLoading: boolean; reload: () => Promise<void> }`, `CatalogProvider`
  - `useCart(): { items: Product[]; isCartOpen: boolean; addToCart(p: Product): void; removeFromCart(index: number): void; openCart(): void; closeCart(): void }`, `CartProvider`
  - `router` (from `@/routers`)
  - Routes: `/`, `/products/:id` (matches `slug` or `id`), `/journal/:id` (matches `String(article.id)`), `/checkout`, `*` → `/`

- [ ] **Step 1: `src/contexts/CatalogContext.tsx`**

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import {
  fetchArticlesFromPocketBase,
  fetchProductsFromPocketBase,
  testPocketBaseConnection,
} from "@/services/pocketbase";
import { JournalArticle, Product } from "@/types";

interface CatalogContextValue {
  products: Product[];
  articles: JournalArticle[];
  isConnected: boolean;
  isRemoteActive: boolean;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [articles, setArticles] = useState<JournalArticle[]>(JOURNAL_ARTICLES);
  const [isConnected, setIsConnected] = useState(false);
  const [isRemoteActive, setIsRemoteActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const health = await testPocketBaseConnection();
      setIsConnected(health.connected);

      if (health.connected) {
        const [prodRes, artRes] = await Promise.all([
          fetchProductsFromPocketBase(),
          fetchArticlesFromPocketBase(),
        ]);
        const remoteProducts = prodRes.fromRemote && prodRes.products.length > 0;
        setProducts(remoteProducts ? prodRes.products : PRODUCTS);
        setIsRemoteActive(remoteProducts);
        setArticles(
          artRes.fromRemote && artRes.articles.length > 0
            ? artRes.articles
            : JOURNAL_ARTICLES,
        );
      } else {
        setProducts(PRODUCTS);
        setArticles(JOURNAL_ARTICLES);
        setIsRemoteActive(false);
      }
    } catch {
      setProducts(PRODUCTS);
      setArticles(JOURNAL_ARTICLES);
      setIsRemoteActive(false);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({ products, articles, isConnected, isRemoteActive, isLoading, reload }),
    [products, articles, isConnected, isRemoteActive, isLoading, reload],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = (): CatalogContextValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
};
```

- [ ] **Step 2: `src/contexts/CartContext.tsx`**

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Product } from "@/types";

interface CartContextValue {
  items: Product[];
  isCartOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (index: number) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => [...prev, product]);
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value = useMemo(
    () => ({ items, isCartOpen, addToCart, removeFromCart, openCart, closeCart }),
    [items, isCartOpen, addToCart, removeFromCart, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
```

- [ ] **Step 3: Components switch to links and contexts**

`src/components/layout/Navbar.tsx` — replace imports, props and the top of the component:

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { BRAND_NAME } from '@/constants/brand';
import { useCart } from '@/contexts/CartContext';
import { useCatalog } from '@/contexts/CatalogContext';

interface NavbarProps {
  onOpenPocketBase: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenPocketBase }) => {
  const { items, openCart } = useCart();
  const { isConnected: isPocketBaseConnected } = useCatalog();
  const cartCount = items.length;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

Replace `handleLinkClick` with `const closeMenu = () => setMobileMenuOpen(false);`, change `onOpenCart()` to `openCart()` in `handleCartClick`, turn the logo `<a href="#" onClick={…}>…</a>` into `<Link to="/" onClick={closeMenu} className={…same…}>{BRAND_NAME}</Link>`, and convert the six section anchors:

```bash
sed -i '' -E "s#<a href=\"\\#(products|about|journal)\" onClick=\{\(e\) => handleLinkClick\(e, '[a-z]+'\)\}([^>]*)>(Shop|About|Journal)</a>#<Link to=\"/\\#\1\" onClick={closeMenu}\2>\3</Link>#" src/components/layout/Navbar.tsx
```

`src/components/layout/Footer.tsx`: add `import { Link } from 'react-router';`, delete `FooterProps`, signature becomes `const Footer: React.FC = () => {`, and:

```bash
sed -i '' -E "s#<a href=\"\\#([a-z]+)\" onClick=\{\(e\) => onLinkClick\(e, '[a-z]+'\)\}([^>]*)>([^<]+)</a>#<Link to=\"/\\#\1\"\2>\3</Link>#" src/components/layout/Footer.tsx
```

`src/components/home/Hero.tsx`: add `import { Link } from 'react-router';`, delete `handleNavClick` (old lines 10–31), replace the CTA:

```tsx
          <Link
            to="/#products"
            className="group relative px-10 py-4 bg-[#F5F2EB] text-[#2C2A26] rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-white transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl inline-block"
          >
            <span className="relative z-10 group-hover:text-[#2C2A26]">View Collection</span>
          </Link>
```

`src/components/product/ProductCard.tsx`: drop the `onClick` prop; root element becomes

```tsx
    <Link to={`/products/${product.slug || product.id}`} className="group flex flex-col gap-6 cursor-pointer">
      …unchanged children…
    </Link>
```

with `import { Link } from 'react-router';`.

`src/components/product/ProductGrid.tsx`: remove the `PRODUCTS` import and fallback; props become

```tsx
interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);
```

and `<ProductCard key={product.id} product={product} />`.

`src/components/journal/JournalList.tsx`: remove the `JOURNAL_ARTICLES` import/fallback; props `{ articles: JournalArticle[] }`; map over `articles`; each card root becomes

```tsx
                <Link key={article.id} to={`/journal/${article.id}`} className="group cursor-pointer flex flex-col text-left">
                  …unchanged children…
                </Link>
```

with `import { Link } from 'react-router';`.

- [ ] **Step 4: Pages read from router + contexts**

`src/pages/ProductDetailPage.tsx` — replace everything from `import React` through `const showSizes = …` with:

```tsx
import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useCart } from '@/contexts/CartContext';
import { useCatalog } from '@/contexts/CatalogContext';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading } = useCatalog();
  const { addToCart: onAddToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const product = products.find((p) => p.slug === id || p.id === id);
  if (!product) return isLoading ? null : <Navigate to="/" replace />;

  const onBack = () => navigate('/#products');

  // Mock sizes for demonstration if not in data
  const sizes = ['S', 'M', 'L'];
  const showSizes = product.category === 'Wearable';
```

and `export default ProductDetailPage;`.

`src/pages/JournalDetailPage.tsx` — replace from `import React` through the `const JournalDetail … => {` line with:

```tsx
import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useCatalog } from '@/contexts/CatalogContext';

const JournalDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { articles, isLoading } = useCatalog();

  const article = articles.find((a) => String(a.id) === id);
  if (!article) return isLoading ? null : <Navigate to="/" replace />;

  const onBack = () => navigate('/#journal');
```

and `export default JournalDetailPage;`.

`src/pages/CheckoutPage.tsx` — replace from `import React` through `const Checkout … => {` with:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '@/contexts/CartContext';
import { saveOrderToPocketBase } from '@/services/pocketbase';
import { Order } from '@/types';

const CheckoutPage: React.FC = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const onBack = () => navigate('/');
```

and `export default CheckoutPage;`.

`src/pages/HomePage.tsx`:

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import About from "@/components/home/About";
import Hero from "@/components/home/Hero";
import JournalList from "@/components/journal/JournalList";
import ProductGrid from "@/components/product/ProductGrid";
import { useCatalog } from "@/contexts/CatalogContext";

const HomePage: React.FC = () => {
  const { products, articles } = useCatalog();

  return (
    <>
      <Hero />
      <ProductGrid products={products} />
      <About />
      <JournalList articles={articles} />
    </>
  );
};

export default HomePage;
```

- [ ] **Step 5: Layout, router, App**

`src/layouts/MainLayout.tsx`:

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PocketBaseModal from "@/components/pocketbase/PocketBaseModal";
import { useCart } from "@/contexts/CartContext";
import { useCatalog } from "@/contexts/CatalogContext";

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { items, isCartOpen, closeCart, removeFromCart } = useCart();
  const { products, articles, isRemoteActive, reload } = useCatalog();
  const [isPocketBaseOpen, setIsPocketBaseOpen] = useState(false);

  // Checkout is a focused flow without site chrome
  const showChrome = pathname !== "/checkout";

  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26]">
      {showChrome && <Navbar onOpenPocketBase={() => setIsPocketBaseOpen(true)} />}

      <main>
        <Outlet />
      </main>

      {showChrome && <Footer />}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          closeCart();
          navigate("/checkout");
        }}
      />

      <PocketBaseModal
        isOpen={isPocketBaseOpen}
        onClose={() => setIsPocketBaseOpen(false)}
        onDataRefreshed={reload}
        isRemoteActive={isRemoteActive}
        products={products}
        articles={articles}
      />

      <ScrollRestoration />
    </div>
  );
};

export default MainLayout;
```

`src/routers/index.tsx`:

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "@/layouts/MainLayout";
import CheckoutPage from "@/pages/CheckoutPage";
import HomePage from "@/pages/HomePage";
import JournalDetailPage from "@/pages/JournalDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "journal/:id", element: <JournalDetailPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
```

`src/App.tsx` (full rewrite):

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RouterProvider } from "react-router/dom";
import { CartProvider } from "@/contexts/CartContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { router } from "@/routers";

const App: React.FC = () => (
  <CatalogProvider>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </CatalogProvider>
);

export default App;
```

Remove `ViewState` from `src/types/index.ts`.

- [ ] **Step 6: Verify**

Run: `npm run lint` → exits 0.
Run: `npm run build` → `✓ built`.
Run: `grep -rn "ViewState\|onNavClick\|onLinkClick\|handleNavClick\|onProductClick\|onArticleClick" src` → no matches.

---

### Task 3: Smoke test in a browser

**Files:** none (fixes only if a check fails).

- [ ] **Step 1:** `npm run dev` (port 3000), open `http://localhost:3000/` via the `run` skill.
- [ ] **Step 2:** Check each, with no console errors:
  - Home renders Hero, products grid, About, Journal.
  - Navbar Shop/About/Journal scroll to their sections with the header offset; logo returns to top.
  - Product card → `/products/p1` shows detail; Back → `/#products`.
  - Add to Cart opens drawer with the item; Remove works; Checkout → `/checkout` with no Navbar/Footer; Back → `/`.
  - Journal card → `/journal/1`; Back → `/#journal`.
  - Direct load of `/products/does-not-exist` redirects to `/`.
  - Reload on `/products/p1` stays on the page.
  - PocketBase button opens modal with exactly two tabs; Connection tab Test Ping and Save & Apply work.
- [ ] **Step 3:** If hash scrolling misbehaves, add `src/hooks/useScrollToHash.ts` (per spec note) and re-run Step 2.
