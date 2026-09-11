"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropdown({ trigger, children, align = "right", className }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-line bg-elevated p-1.5 shadow-float animate-fade-up", align === "right" ? "right-0" : "left-0", className)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-muted", className)} {...rest}>
      {children}
    </button>
  );
}
