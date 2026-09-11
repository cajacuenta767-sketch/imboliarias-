"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type WishlistCtx = { ids: Set<string>; has: (id: string) => boolean; toggle: (id: string) => Promise<boolean>; enabled: boolean };
const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    apiGet<string[]>("/api/v1/wishlist?ids=1").then((r) => setIds(new Set(r.data ?? []))).catch(() => undefined);
  }, [enabled]);

  const toggle = useCallback(async (id: string) => {
    const r = await apiPost<{ saved: boolean }>("/api/v1/wishlist", { propertyId: id });
    setIds((prev) => {
      const next = new Set(prev);
      if (r.data.saved) next.add(id);
      else next.delete(id);
      return next;
    });
    return r.data.saved;
  }, []);

  return <Ctx.Provider value={{ ids, has: (id) => ids.has(id), toggle, enabled }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  return ctx;
}
