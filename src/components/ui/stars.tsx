"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, count, size = "sm", onChange, className }: { value: number; count?: number; size?: "sm" | "md" | "lg"; onChange?: (v: number) => void; className?: string }) {
  const s = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(i)}
            className={cn("disabled:cursor-default", onChange && "transition hover:scale-110")}
            aria-label={`${i} estrellas`}
          >
            <Star className={cn(s, i <= Math.round(value) ? "fill-accent text-accent" : "text-line-strong")} />
          </button>
        ))}
      </span>
      {count !== undefined && <span className="text-xs text-ink-muted">({count})</span>}
    </span>
  );
}
