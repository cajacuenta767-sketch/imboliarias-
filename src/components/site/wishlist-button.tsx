"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ propertyId, className, withLabel }: { propertyId: string; className?: string; withLabel?: boolean }) {
  const { has, toggle, enabled } = useWishlist();
  const router = useRouter();
  const saved = has(propertyId);
  return (
    <button
      type="button"
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!enabled) {
          toast.info("Inicia sesión para guardar favoritos");
          router.push("/ingresar");
          return;
        }
        const r = await toggle(propertyId);
        toast.success(r ? "Guardada en favoritos" : "Quitada de favoritos");
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full transition",
        withLabel ? "btn-outline" : "h-9 w-9 bg-white/90 text-ink shadow backdrop-blur hover:bg-white",
        saved && !withLabel && "text-danger",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-danger text-danger")} />
      {withLabel && <span>{saved ? "Guardada" : "Guardar"}</span>}
    </button>
  );
}
