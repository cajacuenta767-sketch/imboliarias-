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
    // Actualización optimista con reversión si la petición falla.
    const apply = (saved: boolean) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(id);
        else next.delete(id);
        return next;
      });
    const wasSaved = ids.has(id);
    apply(!wasSaved);
    try {
      const r = await apiPost<{ saved: boolean }>("/api/v1/wishlist", { propertyId: id });
      apply(r.data.saved);
      return r.data.saved;
    } catch (e) {
      apply(wasSaved);
      throw e;
    }
  }, [ids]);

  return <Ctx.Provider value={{ ids, has: (id) => ids.has(id), toggle, enabled }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  return ctx;
}
