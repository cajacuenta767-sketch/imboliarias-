"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, size = "md", className }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full"; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", full: "max-w-[96vw] h-[92vh]" };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative flex w-full flex-col overflow-hidden rounded-2xl bg-elevated shadow-float max-h-[92vh]", sizes[size], className)}>
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-muted hover:text-ink" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children, side = "right" }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; side?: "right" | "left" | "bottom" }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  const pos = { right: "inset-y-0 right-0 w-full max-w-md", left: "inset-y-0 left-0 w-full max-w-xs", bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl" };
  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("absolute flex flex-col bg-elevated shadow-float", pos[side])}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-muted" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
