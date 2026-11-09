"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  setAccessToken,
  clearTokens,
  decodeTokenPayload,
  isAccessTokenExpired,
} from "@/lib/auth";
import type { TokenPayload } from "@/types/user";

// ─── Forma del contexto ───────────────────────────────────────────────────────

interface AuthContextValue {
  // Estado
  user: TokenPayload | null;      // Payload del JWT: { userId, email, role }
  isLoading: boolean;             // true durante la hidratación inicial desde localStorage
  isAuthenticated: boolean;       // Derivado: user !== null

  // Acciones
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Establece la sesión después de un login exitoso
  const login = useCallback((accessToken: string) => {
    setAccessToken(accessToken);
    const payload = decodeTokenPayload(accessToken);
    setUser(payload);
  }, []);

  // Limpia la sesión completamente
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/");
  }, [router]);

  // Hidratación inicial: restaurar la sesión desde localStorage al cargar la app
  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken || isAccessTokenExpired()) {
      clearTokens();
      setIsLoading(false);
      return;
    }

    const payload = decodeTokenPayload(accessToken);
    setUser(payload);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
