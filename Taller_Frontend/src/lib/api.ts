import { getAccessToken, clearTokens } from "@/lib/auth";
import type { UserPublic } from "@/types/user";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";
import type { Order, CreateOrderInput } from "@/types/order";

// URL base del API Gateway, sin diagonal final. Se define en .env.local (ver .env.local.example)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// ─── Error tipado ─────────────────────────────────────────────────────────────
// status 0 = la petición nunca llegó (API apagada, URL incorrecta o bloqueo de CORS)

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Fetch central ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  { skipAuth = false }: { skipAuth?: boolean } = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "Falta NEXT_PUBLIC_API_URL. Copia .env.local.example a .env.local y reinicia npm run dev.");
  }

  const token = skipAuth ? null : getAccessToken();
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con la API.");
  }

  let body: unknown;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }
  }
  const message = (body as { message?: string } | undefined)?.message;

  // Token vencido o inválido: el authorizer responde 401 (o 403 "not authorized" de API Gateway)
  const sessionExpired =
    response.status === 401 || (response.status === 403 && /not authorized/i.test(message ?? ""));
  if (sessionExpired && token) {
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    throw new ApiError(response.status, "Tu sesión expiró. Inicia sesión de nuevo.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, message ?? `Error ${response.status}`);
  }

  return body as T;
}

const enc = encodeURIComponent;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  // POST /users/login → { accessToken }
  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const res = await apiFetch<{ accessToken?: string; token?: string }>(
      "/users/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { skipAuth: true }
    );
    const accessToken = res.accessToken ?? res.token;
    if (!accessToken) throw new ApiError(500, "La API no devolvió un token de acceso.");
    return { accessToken };
  },

  // POST /users/register → { user }
  register(name: string, email: string, password: string, role: "buyer" | "seller") {
    return apiFetch<{ user: UserPublic }>(
      "/users/register",
      { method: "POST", body: JSON.stringify({ name, email, password, role }) },
      { skipAuth: true }
    );
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getUser: (id: string) => apiFetch<{ user: UserPublic }>(`/users/${enc(id)}`),
  updateUser: (id: string, data: { name: string }) =>
    apiFetch<{ message?: string }>(`/users/${enc(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiFetch<{ message?: string }>(`/users/${enc(id)}`, { method: "DELETE" }),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  listAll: () => apiFetch<{ products: Product[] }>("/products"),
  getById: (id: string) => apiFetch<{ product: Product }>(`/products/${enc(id)}`),
  listBySeller: (sellerId: string) => apiFetch<{ products: Product[] }>(`/products/users/${enc(sellerId)}`),
  create: (data: CreateProductInput) =>
    apiFetch<{ product: Product }>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProductInput) =>
    apiFetch<{ product?: Product }>(`/products/${enc(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ message?: string }>(`/products/${enc(id)}`, { method: "DELETE" }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (data: CreateOrderInput) =>
    apiFetch<{ order: Order }>("/orders", { method: "POST", body: JSON.stringify(data) }),
  getById: (id: string) => apiFetch<{ order: Order }>(`/orders/${enc(id)}`),
  listByUser: (userId: string) => apiFetch<{ orders: Order[] }>(`/orders/users/${enc(userId)}`),
  listBySeller: (sellerId: string) => apiFetch<{ orders: Order[] }>(`/orders/seller/${enc(sellerId)}`),
  confirm: (id: string) => apiFetch<{ order?: Order }>(`/orders/${enc(id)}/confirm`, { method: "POST" }),
  cancel: (id: string) => apiFetch<{ order?: Order }>(`/orders/${enc(id)}/cancel`, { method: "POST" }),
};
