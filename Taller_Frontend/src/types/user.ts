export interface UserPublic {
  userId: string;
  email: string;
  name: string;
  role: "buyer" | "seller";
  createdAt: string;
  updatedAt: string;
}

// Payload que viene codificado dentro del JWT
export interface TokenPayload {
  userId: string;
  email: string;
  role: "buyer" | "seller";
  iat: number;
  exp: number;
}
