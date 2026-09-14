/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Database } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { isMockMode } from "@/services/pocketbase";

const AdminLayout: React.FC = () => {
  const { isAuthed } = useAdminAuth();
  const { pathname } = useLocation();

  if (!isAuthed) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(pathname)}`} replace />;
  }

  return (
    <SidebarProvider className="bg-muted/35">
      <AdminSidebar />
      <SidebarInset className="min-w-0 md:my-2 md:mr-2 md:rounded-xl md:border md:shadow-sm">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Badge variant="outline" className="ml-auto gap-1.5 bg-background font-normal text-muted-foreground">
            <Database className="size-3" />
            {isMockMode() ? "Mock data" : "PocketBase"}
          </Badge>
        </header>
        <main className="flex-1 bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
