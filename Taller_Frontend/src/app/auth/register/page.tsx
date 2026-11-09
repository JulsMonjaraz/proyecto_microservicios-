"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError, PageShell } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, ApiError } from "@/lib/api";

const ROLES = [
  { value: "buyer", title: "Comprador", hint: "Compra productos" },
  { value: "seller", title: "Vendedor", hint: "Publica y vende" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authApi.register(name, email, password, role);
      // Inicia sesión automáticamente para no pedir los datos otra vez
      const { accessToken } = await authApi.login(email, password);
      login(accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell width="form">
      <h1 className="text-3xl font-bold">Crear cuenta</h1>
      <p className="mt-2 text-muted-foreground">Elige cómo vas a usar Amazon Lite.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <InlineError message={error} />}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tipo de cuenta</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={role === r.value}
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  role === r.value ? "border-foreground bg-secondary" : "hover:bg-secondary"
                )}
              >
                <span className="block text-sm font-semibold">{r.title}</span>
                <span className="block text-sm text-muted-foreground">{r.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
          <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="font-medium text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </PageShell>
  );
}
