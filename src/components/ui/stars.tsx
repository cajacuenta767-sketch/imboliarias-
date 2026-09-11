"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, count, size = "sm", onChange, className }: { value: number; count?: number; size?: "sm" | "md" | "lg"; onChange?: (v: number) => void; className?: string }) {
  const s = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  const icon = (i: number) => <Star className={cn(s, i <= Math.round(value) ? "fill-accent text-accent" : "text-line-strong")} aria-hidden />;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {onChange ? (
        <span className="inline-flex gap-0.5" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" role="radio" aria-checked={Math.round(value) === i} onClick={() => onChange(i)} className="rounded transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label={`${i} de 5 estrellas`}>
              {icon(i)}
            </button>
          ))}
        </span>
      ) : (
        // Solo lectura: una única imagen con nombre accesible, no cinco botones inertes.
        <span className="inline-flex gap-0.5" role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
          {[1, 2, 3, 4, 5].map((i) => <span key={i}>{icon(i)}</span>)}
        </span>
      )}
      {count !== undefined && <span className="text-xs text-ink-muted">({count})</span>}
    </span>
  );
}
