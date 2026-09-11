export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]> | null,
  ) {
    super(message);
  }
}

type Json = Record<string, unknown> | unknown[] | null;

export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<{ data: T; meta?: { page: number; perPage: number; total: number; totalPages: number } }> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path.startsWith("/") ? path : `/api/v1/${path}`, { ...init, headers, body });
  const payload = (await res.json().catch(() => null)) as { data?: T; meta?: never; error?: string; details?: Record<string, string[]> | null } | null;
  if (!res.ok) throw new ApiError(res.status, payload?.error ?? "Error inesperado", payload?.details ?? null);
  return { data: (payload?.data ?? null) as T, meta: (payload as { meta?: { page: number; perPage: number; total: number; totalPages: number } } | null)?.meta };
}

export const apiGet = <T,>(path: string) => api<T>(path);
export const apiPost = <T,>(path: string, json?: Json | object) => api<T>(path, { method: "POST", json });
export const apiPut = <T,>(path: string, json?: Json | object) => api<T>(path, { method: "PUT", json });
export const apiPatch = <T,>(path: string, json?: Json | object) => api<T>(path, { method: "PATCH", json });
export const apiDelete = <T,>(path: string) => api<T>(path, { method: "DELETE" });

export async function uploadFiles(files: File[], folder = "general") {
  const fd = new FormData();
  fd.set("folder", folder);
  files.forEach((f) => fd.append("file", f));
  return api<{ id: string; url: string; name: string }[]>("/api/v1/media", { method: "POST", body: fd });
}

export function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 86400}; samesite=lax`;
}
