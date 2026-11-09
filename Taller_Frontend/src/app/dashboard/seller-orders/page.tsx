"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrderRow } from "@/components/order/OrderCard";
import { EmptyState, InlineError, PageHeader, PageShell, SkeletonList } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi, ApiError } from "@/lib/api";
import { shortId } from "@/lib/utils";
import type { Order } from "@/types/order";

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "seller")) {
      router.push(user ? "/" : "/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== "seller") return;
    ordersApi
      .listBySeller(user.userId)
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar las órdenes."))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function changeStatus(orderId: string, action: "confirm" | "cancel") {
    if (action === "cancel" && !confirm("¿Cancelar esta orden?")) return;
    setBusyId(orderId);
    setError(null);
    try {
      if (action === "confirm") await ordersApi.confirm(orderId);
      else await ordersApi.cancel(orderId);
      const status = action === "confirm" ? ("confirmed" as const) : ("cancelled" as const);
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la orden.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <PageShell width="narrow">
        <SkeletonList className="h-44" />
      </PageShell>
    );
  }

  // Pendientes primero: son las que necesitan acción
  const pending = orders.filter((o) => o.status === "pending");
  const sorted = [...pending, ...orders.filter((o) => o.status !== "pending")];

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Órdenes recibidas"
        description={`${orders.length} en total, ${pending.length} pendientes`}
      />
      {error && <InlineError message={error} />}
      {orders.length === 0 ? (
        <EmptyState title="Aún no recibes órdenes" description="Aparecerán aquí cuando alguien compre tus productos." />
      ) : (
        <div className="space-y-4">
          {sorted.map((order) => (
            <OrderRow
              key={order.orderId}
              order={order}
              extra={
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Comprador <span className="font-mono">{shortId(order.userId)}</span>
                </p>
              }
              actions={
                order.status === "pending" ? (
                  <>
                    <Button size="sm" onClick={() => changeStatus(order.orderId, "confirm")} disabled={busyId === order.orderId}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => changeStatus(order.orderId, "cancel")} disabled={busyId === order.orderId}>
                      Cancelar
                    </Button>
                  </>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
