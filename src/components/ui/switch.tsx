"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-brand" : "bg-line-strong")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      {label && <span className="font-medium text-ink">{label}</span>}
    </label>
  );
}
