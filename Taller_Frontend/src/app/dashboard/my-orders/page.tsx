"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/order/OrderCard";
import { EmptyState, InlineError, PageHeader, PageShell, SkeletonList } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi, ApiError } from "@/lib/api";
import type { Order } from "@/types/order";

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    ordersApi
      .listByUser(user.userId)
      .then(({ orders }) =>
        setOrders([...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar tus órdenes."))
      .finally(() => setIsLoading(false));
  }, [user]);

  function handleCancelled(orderId: string) {
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: "cancelled" as const } : o)));
  }

  if (authLoading || isLoading) {
    return (
      <PageShell width="narrow">
        <SkeletonList className="h-44" />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Mis órdenes"
        description={`${orders.length} ${orders.length === 1 ? "orden" : "órdenes"}`}
      />
      {error && <InlineError message={error} />}
      {orders.length === 0 ? (
        <EmptyState
          title="Aún no has comprado nada"
          description="Cuando hagas una compra, aquí verás su estado."
          action={
            <Button asChild>
              <Link href="/">Ver catálogo</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} onCancelled={handleCancelled} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
