"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState, PageShell } from "@/components/ui/states";
import { productsApi, ApiError, API_URL } from "@/lib/api";
import type { Product } from "@/types/product";

/** Se muestra cuando la petición no llegó al API (status 0): API apagada, URL mal o CORS. */
function ConnectionProblem({ message, onRetry }: { message: string; onRetry: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="font-semibold">No se pudo cargar el catálogo</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Esta página</dt>
        <dd className="break-all font-mono">{origin || "—"}</dd>
        <dt className="text-muted-foreground">API</dt>
        <dd className="break-all font-mono">{API_URL || "sin configurar"}</dd>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Revisa que LocalStack esté corriendo, que <span className="font-mono">NEXT_PUBLIC_API_URL</span> tenga el id
        actual del Gateway y que <span className="font-mono">{origin || "este origen"}</span> esté en{" "}
        <span className="font-mono">CORS_ORIGINS</span> del backend.
      </p>
      <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setProducts(null);
    try {
      const { products } = await productsApi.listAll();
      setProducts(products);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Error inesperado."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const visible = (products ?? []).filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  );

  return (
    <PageShell>
      <section className="pb-14 pt-6 md:pt-14">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">
          Tecnología de vendedores independientes.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Elige un producto, haz tu orden y sigue su estado desde tu cuenta.
        </p>
        <div className="relative mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar productos"
            placeholder="Buscar por nombre o descripción"
            className="pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {error ? (
        error.status === 0 ? (
          <ConnectionProblem message={error.message} onRetry={load} />
        ) : (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </p>
        )
      ) : products === null ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando catálogo">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={q ? "Sin resultados" : "Todavía no hay productos"}
          description={
            q ? "Prueba con otra palabra o borra la búsqueda." : "Cuando un vendedor publique, aparecerá aquí."
          }
        />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
