"use client";

import Link from "next/link";
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Menú desplegable accesible: el disparador es un botón real con aria-expanded/aria-controls,
 * se cierra con Escape o clic fuera, y las flechas mueven el foco entre las opciones.
 */
export function Dropdown({ trigger, children, align = "right", className, label }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right"; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (ref.current?.querySelector("[aria-haspopup]") as HTMLElement | null)?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
        if (items.length === 0) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerProps = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": menuId,
    "aria-label": label,
    onClick: () => setOpen((o) => !o),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus());
      }
    },
  };
  const triggerEl = isValidElement(trigger) ? cloneElement(trigger as React.ReactElement<Record<string, unknown>>, { ...triggerProps, type: "button" }) : (
    <button type="button" {...triggerProps}>{trigger}</button>
  );

  return (
    <div ref={ref} className="relative">
      {triggerEl}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onClick={() => setOpen(false)}
          className={cn("absolute z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-line bg-elevated p-1.5 shadow-float animate-fade-up", align === "right" ? "right-0" : "left-0", className)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const itemCls = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

export function DropdownItem({ children, className, href, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) {
  if (href) {
    return (
      <Link href={href} role="menuitem" className={cn(itemCls, className)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" className={cn(itemCls, className)} {...rest}>
      {children}
    </button>
  );
}
