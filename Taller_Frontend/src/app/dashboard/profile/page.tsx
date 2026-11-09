"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InlineError, PageShell, SkeletonList } from "@/components/ui/states";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { UserPublic } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const { user: tokenUser, isLoading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !tokenUser) router.push("/auth/login");
  }, [tokenUser, authLoading, router]);

  useEffect(() => {
    if (!tokenUser) return;
    usersApi
      .getUser(tokenUser.userId)
      .then(({ user }) => {
        setProfile(user);
        setEditName(user.name);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar tu perfil."))
      .finally(() => setIsLoading(false));
  }, [tokenUser]);

  async function handleSaveName() {
    if (!tokenUser || !editName.trim()) return;
    setIsSaving(true);
    setEditError(null);
    setSaved(false);
    try {
      await usersApi.updateUser(tokenUser.userId, { name: editName.trim() });
      setProfile((p) => (p ? { ...p, name: editName.trim() } : p));
      setSaved(true);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "No se pudo guardar el nombre.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!tokenUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await usersApi.deleteUser(tokenUser.userId);
      logout();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "No se pudo eliminar la cuenta.");
      setIsDeleting(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <PageShell width="form">
        <SkeletonList count={3} className="h-20" />
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell width="form">
        <InlineError message={loadError ?? "No se encontró tu perfil."} />
      </PageShell>
    );
  }

  return (
    <PageShell width="form">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{profile.name}</h1>
          <p className="mt-1 truncate text-muted-foreground">{profile.email}</p>
        </div>
        <Badge variant="outline">{profile.role === "seller" ? "Vendedor" : "Comprador"}</Badge>
      </div>

      <section className="mt-10 space-y-3">
        <Label htmlFor="name">Nombre</Label>
        <div className="flex gap-2">
          <Input id="name" value={editName} onChange={(e) => { setEditName(e.target.value); setSaved(false); }} disabled={isSaving} />
          <Button onClick={handleSaveName} disabled={isSaving || !editName.trim() || editName.trim() === profile.name}>
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
        {editError && <p role="alert" className="text-sm text-destructive">{editError}</p>}
        {saved && <p role="status" className="text-sm text-success">Nombre actualizado.</p>}
        <p className="pt-2 text-sm text-muted-foreground">Miembro desde {formatDate(profile.createdAt)}</p>
      </section>

      <section className="mt-12 border-t pt-8">
        <h2 className="font-semibold">Eliminar cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se borran tus datos de forma permanente. No se puede deshacer.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4 text-destructive">
              Eliminar mi cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
              <DialogDescription>Esta acción es permanente y no podrás recuperar tu cuenta.</DialogDescription>
            </DialogHeader>
            {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? "Eliminando…" : "Sí, eliminar mi cuenta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </PageShell>
  );
}
