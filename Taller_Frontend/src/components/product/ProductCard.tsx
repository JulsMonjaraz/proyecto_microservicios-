import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/** Recuadro con la inicial del producto: hace de imagen hasta que haya fotos reales. */
export function ProductTile({ name, className }: { name: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center rounded-2xl bg-muted transition-colors", className)}
    >
      <span className="select-none text-7xl font-light text-foreground/15">
        {name.trim().charAt(0).toUpperCase() || "·"}
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;

  return (
    <Link href={`/products/${product.productId}`} className="group block rounded-2xl">
      <ProductTile
        name={product.name}
        className={cn("aspect-[4/3] group-hover:bg-accent", soldOut && "opacity-60")}
      />
      <div className="mt-4 space-y-1">
        <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {soldOut && <span className="text-sm text-muted-foreground">Agotado</span>}
          {low && <span className="text-sm text-warning">Quedan {product.stock}</span>}
        </div>
      </div>
    </Link>
  );
}
