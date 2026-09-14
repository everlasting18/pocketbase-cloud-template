/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "cancelled"];

const VARIANTS: Record<OrderStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "outline",
  paid: "secondary",
  shipped: "default",
  cancelled: "destructive",
};

const OrderStatusBadge: React.FC<{ status?: OrderStatus }> = ({ status = "pending" }) => (
  <Badge variant={VARIANTS[status] ?? "outline"} className="capitalize">
    {status}
  </Badge>
);

export default OrderStatusBadge;
