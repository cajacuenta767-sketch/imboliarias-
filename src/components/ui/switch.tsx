"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, className, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? id : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none [&>span:first-child]:focus-visible:ring-2 [&>span:first-child]:focus-visible:ring-brand/50", className)}
    >
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-brand" : "bg-line-strong")} aria-hidden>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label && <span id={id} className="font-medium text-ink">{label}</span>}
    </button>
  );
}
