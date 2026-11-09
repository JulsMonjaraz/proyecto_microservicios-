"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatPrice, formatDate, shortId } from "@/lib/utils";
import { ordersApi, ApiError } from "@/lib/api";
import type { Order } from "@/types/order";

/** Orden en formato de lista: sirve para comprador y vendedor (`extra` y `actions` son opcionales). */
export function OrderRow({
  order,
  extra,
  actions,
}: {
  order: Order;
  extra?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm">#{shortId(order.orderId)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
          {extra}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="mt-4 divide-y text-sm">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex justify-between py-2">
            <span className="font-mono text-muted-foreground">{shortId(item.productId)}</span>
            <span>
              {item.quantity} × {formatPrice(item.price)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
      </div>

      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </article>
  );
}

interface OrderCardProps {
  order: Order;
  onCancelled?: (orderId: string) => void;
}

/** Vista del comprador: puede cancelar mientras la orden esté pendiente. */
export function OrderCard({ order, onCancelled }: OrderCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("¿Cancelar esta orden?")) return;
    setIsCancelling(true);
    setError(null);
    try {
      await ordersApi.cancel(order.orderId);
      onCancelled?.(order.orderId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la orden.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <OrderRow
      order={order}
      extra={error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
      actions={
        order.status === "pending" ? (
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? "Cancelando…" : "Cancelar orden"}
          </Button>
        ) : null
      }
    />
  );
}
