import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/order";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<Order["status"], "warning" | "success" | "secondary"> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "secondary",
};

export function OrderStatusBadge({ status }: { status: Order["status"] }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
