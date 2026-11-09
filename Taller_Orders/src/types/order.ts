export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

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
