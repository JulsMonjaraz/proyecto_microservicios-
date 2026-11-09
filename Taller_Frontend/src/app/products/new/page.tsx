"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/product/ProductForm";
import { InlineError, PageShell } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi, ApiError } from "@/lib/api";
import type { CreateProductInput } from "@/types/product";

export default function NewProductPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Solo vendedores con sesión
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "seller")) {
      router.push(user ? "/" : "/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "seller") return null;

  async function handleSubmit(data: CreateProductInput) {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const { product } = await productsApi.create(data);
      router.push(`/products/${product.productId}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "No se pudo publicar el producto.");
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell width="form">
      <Link href="/dashboard/my-products" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Mis productos
      </Link>
      <h1 className="text-3xl font-bold">Nuevo producto</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Aparecerá en el catálogo en cuanto lo publiques.</p>
      {apiError && <InlineError message={apiError} />}
      <ProductForm onSubmit={handleSubmit} isLoading={isSubmitting} submitLabel="Publicar producto" />
    </PageShell>
  );
}
