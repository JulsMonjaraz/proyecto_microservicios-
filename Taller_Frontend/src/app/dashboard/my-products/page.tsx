"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, InlineError, PageHeader, PageShell, SkeletonList } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function MyProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "seller")) {
      router.push(user ? "/" : "/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== "seller") return;
    productsApi
      .listBySeller(user.userId)
      .then(({ products }) => setProducts(products))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar tus productos."))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleDelete(productId: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    setDeletingId(productId);
    try {
      await productsApi.delete(productId);
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <PageShell width="narrow">
        <SkeletonList />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Mis productos"
        description={`${products.length} ${products.length === 1 ? "producto publicado" : "productos publicados"}`}
        action={
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        }
      />

      {error && <InlineError message={error} />}

      {products.length === 0 ? (
        <EmptyState
          title="Aún no publicas nada"
          description="Publica tu primer producto y aparecerá en el catálogo."
          action={
            <Button asChild>
              <Link href="/products/new">Publicar producto</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y rounded-2xl border">
          {products.map((product) => (
            <li key={product.productId} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/products/${product.productId}`} className="block truncate font-medium hover:underline">
                  {product.name}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span>{formatPrice(product.price)}</span>
                  <Badge variant={product.stock > 0 ? "success" : "secondary"}>
                    {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/products/${product.productId}/edit`}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar {product.name}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(product.productId)}
                disabled={deletingId === product.productId}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar {product.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
