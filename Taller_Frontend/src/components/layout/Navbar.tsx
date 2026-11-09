"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User, LogOut, Plus, ClipboardList, ShoppingBag, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        active ? "font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Amazon Lite
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
            <NavLink href="/">Catálogo</NavLink>
            {user?.role === "seller" && (
              <>
                <NavLink href="/dashboard/my-products">Mis productos</NavLink>
                <NavLink href="/dashboard/seller-orders">Órdenes recibidas</NavLink>
              </>
            )}
            {user?.role === "buyer" && <NavLink href="/dashboard/my-orders">Mis órdenes</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Crear cuenta</Link>
              </Button>
            </>
          ) : (
            <>
              {user?.role === "seller" && (
                <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
                  <Link href="/products/new">
                    <Plus className="h-4 w-4" />
                    Nuevo producto
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="hidden max-w-[140px] truncate sm:inline">{user?.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === "seller" ? "Vendedor" : "Comprador"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Mi perfil
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "seller" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/my-products">
                          <Package className="mr-2 h-4 w-4" />
                          Mis productos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/seller-orders">
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Órdenes recibidas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/products/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo producto
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "buyer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/my-orders">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Mis órdenes
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
