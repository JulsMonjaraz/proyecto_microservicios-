import type { TokenPayload } from "@/types/user";

const ACCESS_TOKEN_KEY = "amazon_lite_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Decodifica el payload del JWT sin verificar la firma.
// Solo para uso en el cliente (la verificación real la hace el backend).
export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  const payload = decodeTokenPayload(token);
  if (!payload) return true;
  return payload.exp < Date.now() / 1000;
}
