/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { CartProvider } from "@/contexts/CartContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import MainLayout from "@/layouts/MainLayout";
import CheckoutPage from "@/pages/CheckoutPage";
import HomePage from "@/pages/HomePage";
import JournalDetailPage from "@/pages/JournalDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";

// Catalog and cart only exist for the storefront; admin never loads them.
const StorefrontRoot: React.FC = () => (
  <CatalogProvider>
    <CartProvider>
      <MainLayout />
    </CartProvider>
  </CatalogProvider>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <StorefrontRoot />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "journal/:id", element: <JournalDetailPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    // Code-split: shadcn, forms and admin pages load only when /admin is visited.
    path: "/admin/*",
    HydrateFallback: () => null,
    lazy: async () => ({ Component: (await import("./adminRoutes")).default }),
  },
]);
