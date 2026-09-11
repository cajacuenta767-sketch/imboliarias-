"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({ value, onChange, items, className, variant = "pill" }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[]; className?: string; variant?: "pill" | "underline" }) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-1 overflow-x-auto border-b border-line scrollbar-thin", className)}>
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition", value === it.value ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink")}
          >
            {it.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("inline-flex rounded-full bg-muted p-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", value === it.value ? "bg-elevated text-ink shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
