"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalPages, className }: { page: number; totalPages: number; className?: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const n = new URLSearchParams(sp.toString());
    n.set("page", String(p));
    return `${pathname}?${n.toString()}`;
  };
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";
  const edge = (disabled: boolean, target: number, label: string, Icon: typeof ChevronLeft) =>
    disabled ? (
      <span className={cn(btn, "border border-line bg-elevated opacity-40")} aria-disabled="true" aria-label={label}><Icon className="h-4 w-4" /></span>
    ) : (
      <Link href={href(target)} className={cn(btn, "border border-line bg-elevated hover:border-brand")} aria-label={label}><Icon className="h-4 w-4" /></Link>
    );
  return (
    <nav className={cn("flex items-center justify-center gap-1.5", className)} aria-label="Paginación">
      {edge(page === 1, page - 1, "Página anterior", ChevronLeft)}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-muted" aria-hidden>…</span>
        ) : (
          <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined} aria-label={`Página ${p}`} className={cn(btn, p === page ? "bg-brand text-white" : "border border-line bg-elevated hover:border-brand")}>
            {p}
          </Link>
        ),
      )}
      {edge(page === totalPages, page + 1, "Página siguiente", ChevronRight)}
    </nav>
  );
}
