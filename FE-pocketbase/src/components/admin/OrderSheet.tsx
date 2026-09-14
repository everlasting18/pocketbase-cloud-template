/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatMoney, shortId } from "@/lib/format";
import { updateOrderStatus } from "@/services/pocketbase";
import { Order, OrderStatus } from "@/types";
import { ORDER_STATUSES } from "./OrderStatusBadge";

interface OrderSheetProps {
  order: Order | null;
  onClose: () => void;
  onSaved: () => void;
}

const OrderSheet: React.FC<OrderSheetProps> = ({ order, onClose, onSaved }) => {
  const current = order?.status ?? "pending";
  const [status, setStatus] = useState<OrderStatus>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => setStatus(current), [order, current]);

  const save = async () => {
    if (!order?.id) return;
    setSaving(true);
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order #${shortId(order.id)} marked ${status}`);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const address = order
    ? [order.shippingAddress, order.city, order.postalCode].filter(Boolean).join(", ")
    : "";

  return (
    <Sheet open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle>Order #{shortId(order.id)}</SheetTitle>
              <SheetDescription>Placed {formatDate(order.created)}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-4">
              <section>
                <h3 className="mb-2 text-sm font-medium">Customer</h3>
                <p className="text-sm">{order.customerName || "—"}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                {address && <p className="mt-1 text-sm text-muted-foreground">{address}</p>}
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-medium">Items</h3>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li key={`${item.id}-${i}`} className="flex justify-between gap-4 text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums">{formatMoney(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t pt-3 text-sm font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(order.totalAmount)}</span>
                </div>
              </section>

              <Separator />

              <Field>
                <FieldLabel htmlFor="order-status">Status</FieldLabel>
                <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                  <SelectTrigger id="order-status" className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <SheetFooter>
              <Button onClick={save} disabled={saving || status === current}>
                {saving ? "Saving…" : "Save status"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default OrderSheet;
