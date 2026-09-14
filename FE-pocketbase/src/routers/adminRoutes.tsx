/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import ArticleEditPage from "@/pages/admin/ArticleEditPage";
import ArticlesPage from "@/pages/admin/ArticlesPage";
import LoginPage from "@/pages/admin/LoginPage";
import OrdersPage from "@/pages/admin/OrdersPage";
import ProductEditPage from "@/pages/admin/ProductEditPage";
import ProductsPage from "@/pages/admin/ProductsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import SetupPage from "@/pages/admin/SetupPage";

const AdminRoutes: React.FC = () => {
  const { isChecking } = useAdminAuth();

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="setup" element={<SetupPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductEditPage />} />
        <Route path="products/:id/edit" element={<ProductEditPage />} />
        <Route path="journal" element={<ArticlesPage />} />
        <Route path="journal/new" element={<ArticleEditPage />} />
        <Route path="journal/:id/edit" element={<ArticleEditPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin/products" replace />} />
      </Route>
    </Routes>
  );
};

const AdminRoot: React.FC = () => {
  // On <body> so Radix portals (dialogs, sheets, selects) also get the admin font.
  useEffect(() => {
    document.body.classList.add("admin");
    return () => document.body.classList.remove("admin");
  }, []);

  return (
    <AdminAuthProvider>
      <TooltipProvider>
        <AdminRoutes />
        {/* Bottom-center: clear of the right-side sheet's header and footer buttons. */}
        <Toaster richColors position="bottom-center" />
      </TooltipProvider>
    </AdminAuthProvider>
  );
};

export default AdminRoot;
