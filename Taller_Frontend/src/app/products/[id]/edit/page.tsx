"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/product/ProductForm";
import { InlineError, PageShell, SkeletonList } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi, ApiError } from "@/lib/api";
import type { Product, CreateProductInput } from "@/types/product";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "seller") {
      router.push("/auth/login");
      return;
    }
    productsApi
      .getById(id)
      .then(({ product }) => {
        if (product.sellerId !== user.userId) {
          router.push("/dashboard/my-products");
          return;
        }
        setProduct(product);
      })
      .catch(() => setError("Producto no encontrado."))
      .finally(() => setIsLoading(false));
  }, [id, user, authLoading, router]);

  async function handleSubmit(data: CreateProductInput) {
    setIsSubmitting(true);
    setError(null);
    try {
      await productsApi.update(id, data);
      router.push(`/products/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
      setIsSubmitting(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <PageShell width="form">
        <SkeletonList count={3} className="h-20" />
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell width="form">
        <p role="alert" className="text-destructive">{error ?? "Producto no encontrado."}</p>
        <Button variant="link" asChild className="mt-2 px-0">
          <Link href="/dashboard/my-products">Mis productos</Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell width="form">
      <Link href={`/products/${id}`} className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Ver producto
      </Link>
      <h1 className="text-3xl font-bold">Editar producto</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{product.name}</p>
      {error && <InlineError message={error} />}
      <ProductForm defaultValues={product} onSubmit={handleSubmit} isLoading={isSubmitting} submitLabel="Guardar cambios" />
    </PageShell>
  );
}
