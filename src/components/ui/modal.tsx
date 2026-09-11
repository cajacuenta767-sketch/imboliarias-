"use client";

import { useId } from "react";
import { X } from "lucide-react";
import { useDialog } from "@/lib/hooks/use-dialog";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, size = "md", className }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full"; className?: string }) {
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", full: "max-w-[96vw] h-[92vh]" };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        tabIndex={-1}
        className={cn("relative flex w-full flex-col overflow-hidden rounded-2xl bg-elevated shadow-float max-h-[92vh] outline-none", sizes[size], className)}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h3 id={titleId} className="font-display text-lg font-bold">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Cerrar">
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
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const pos = { right: "inset-y-0 right-0 w-full max-w-md", left: "inset-y-0 left-0 w-full max-w-xs", bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl" };
  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn("absolute flex flex-col bg-elevated shadow-float outline-none", pos[side])}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 id={titleId} className="font-display text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** Diálogo de confirmación para acciones destructivas (sustituye a window.confirm). */
export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = "Eliminar", danger = true, loading }: { open: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; title: string; text?: string; confirmLabel?: string; danger?: boolean; loading?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4 p-5">
        {text && <p className="text-sm text-ink-soft">{text}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={cn("btn", danger ? "bg-danger text-white hover:bg-red-700" : "btn-primary")}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
