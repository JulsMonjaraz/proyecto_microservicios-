import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  return { userId: payload.userId, role: payload.role };
}
