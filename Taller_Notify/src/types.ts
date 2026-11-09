export type NotificationType = "PURCHASE" | "PROMOTION" | "OUT_OF_STOCK";

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  role: "buyer" | "seller";
}
