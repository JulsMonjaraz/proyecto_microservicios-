import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidad estándar de shadcn/ui para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatea un número como precio en MXN (ajustar locale/currency según necesidad)
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

// Formatea una fecha ISO en formato legible
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoString));
}

// Trunca un UUID para mostrarlo como ID corto: "abc12345-..."
export function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
