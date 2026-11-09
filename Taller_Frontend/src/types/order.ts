export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// El backend (Taller_Orders) usa: pending → confirmed | cancelled
export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
}
