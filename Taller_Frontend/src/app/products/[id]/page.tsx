"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductTile } from "@/components/product/ProductCard";
import { PageShell } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi, ordersApi, ApiError } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState("1");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderDone, setOrderDone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    productsApi
      .getById(id)
      .then(({ product }) => setProduct(product))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el producto."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleOrder() {
    if (!product) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) return setOrderError("Escribe una cantidad válida.");
    if (qty > product.stock) return setOrderError(`Solo quedan ${product.stock} disponibles.`);

    setIsOrdering(true);
    setOrderError(null);
    try {
      await ordersApi.create({ items: [{ productId: id, quantity: qty }] });
      setProduct({ ...product, stock: product.stock - qty });
      setOrderDone(true);
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : "No se pudo crear la orden.");
    } finally {
      setIsOrdering(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este producto? No se puede deshacer.")) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(id);
      router.push("/dashboard/my-products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto.");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="grid animate-pulse gap-10 md:grid-cols-2" aria-busy="true">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-10 w-1/3 rounded bg-muted" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !product) {
    return (
      <PageShell width="narrow">
        <p role="alert" className="text-destructive">{error ?? "Producto no encontrado."}</p>
        <Button variant="link" asChild className="mt-2 px-0">
          <Link href="/">Volver al catálogo</Link>
        </Button>
      </PageShell>
    );
  }

  const isOwner = user?.userId === product.sellerId;
  const isBuyer = isAuthenticated && user?.role === "buyer";
  const soldOut = product.stock <= 0;

  return (
    <PageShell>
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Catálogo
      </Link>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <ProductTile name={product.name} className="aspect-square" />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{product.name}</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
            <Badge variant={soldOut ? "secondary" : "success"}>
              {soldOut ? "Agotado" : `${product.stock} disponibles`}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">Publicado el {formatDate(product.createdAt)}</p>

          {isOwner && (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href={`/products/${id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="outline" onClick={handleDelete} disabled={isDeleting} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Eliminando…" : "Eliminar"}
              </Button>
            </div>
          )}

          {isBuyer && !soldOut && !orderDone && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto">Comprar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar compra</DialogTitle>
                  <DialogDescription>
                    {product.name} · {formatPrice(product.price)} por unidad
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="qty">Cantidad</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  {orderError && <p role="alert" className="text-sm text-destructive">{orderError}</p>}
                  <p className="text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">{formatPrice(product.price * (parseInt(quantity, 10) || 0))}</strong>
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={handleOrder} disabled={isOrdering} className="w-full">
                    {isOrdering ? "Procesando…" : "Confirmar compra"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {orderDone && (
            <div role="status" className="rounded-2xl bg-success/10 p-4">
              <p className="font-medium text-success">Orden creada. Te enviamos la confirmación por correo.</p>
              <Button variant="link" asChild className="mt-1 h-auto p-0">
                <Link href="/dashboard/my-orders">Ver mis órdenes</Link>
              </Button>
            </div>
          )}

          {isBuyer && soldOut && <p className="text-sm text-muted-foreground">Este producto está agotado.</p>}

          {!isAuthenticated && (
            <div className="rounded-2xl bg-muted p-5">
              <p className="text-sm text-muted-foreground">Inicia sesión para comprar este producto.</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
