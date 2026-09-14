/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import DataState from "@/components/admin/DataState";
import ListPagination from "@/components/admin/ListPagination";
import OrderSheet from "@/components/admin/OrderSheet";
import OrderStatusBadge, { ORDER_STATUSES } from "@/components/admin/OrderStatusBadge";
import PageHeader from "@/components/admin/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminQuery } from "@/hooks/useAdminQuery";
import { formatDate, formatMoney, shortId } from "@/lib/format";
import { listOrders } from "@/services/pocketbase";
import { Order, OrderStatus } from "@/types";

type StatusFilter = OrderStatus | "all";

const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const { data, error, loading, reload } = useAdminQuery(
    () => listOrders({ page, status: status === "all" ? undefined : status }),
    [page, status],
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description={data ? `${data.totalItems} orders` : "Checkout orders stored in PocketBase"}
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-black/[0.02]">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Order activity</p>
            <p className="text-xs text-muted-foreground">Select an order to review details and update its status.</p>
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 capitalize" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error || !data ? (
          <div className="p-4">
            <DataState loading={loading} error={error} onRetry={reload} />
          </div>
        ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="hidden w-24 sm:table-cell">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {status === "all" ? "No orders yet." : `No ${status} orders.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((o) => (
                    <TableRow
                      key={o.id}
                      tabIndex={0}
                      className="h-16 cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
                      onClick={() => setSelected(o)}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(o)}
                    >
                      <TableCell className="hidden pl-4 font-mono text-xs sm:table-cell">#{shortId(o.id)}</TableCell>
                      <TableCell className="pl-4 sm:pl-2">
                        <div className="font-medium">{o.customerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground sm:hidden">#{shortId(o.id)}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(o.totalAmount)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="hidden pr-4 text-muted-foreground md:table-cell">{formatDate(o.created)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        )}
      </div>
      {data && !error && (
          <ListPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <OrderSheet
        order={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          reload();
        }}
      />
    </>
  );
};

export default OrdersPage;
