import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Contenedor de página: ancho máximo y márgenes consistentes. */
export function PageShell({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "narrow" | "form";
}) {
  const max = width === "wide" ? "max-w-6xl" : width === "narrow" ? "max-w-3xl" : "max-w-md";
  return <div className={cn("mx-auto w-full px-6 py-12", max)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  );
}

export function SkeletonList({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded-2xl bg-muted", className ?? "h-24")} />
      ))}
    </div>
  );
}
