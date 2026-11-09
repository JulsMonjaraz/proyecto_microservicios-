"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError, PageShell } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { accessToken } = await authApi.login(email, password);
      login(accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "Email o contraseña incorrectos."
            : err.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell width="form">
      <h1 className="text-3xl font-bold">Iniciar sesión</h1>
      <p className="mt-2 text-muted-foreground">Entra para comprar o administrar tus productos.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <InlineError message={error} />}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/register" className="font-medium text-brand hover:underline">
          Crea una
        </Link>
      </p>
    </PageShell>
  );
}
