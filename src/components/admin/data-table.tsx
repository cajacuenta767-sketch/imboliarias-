"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export type Column<T> = { key: string; header: React.ReactNode; render?: (row: T) => React.ReactNode; className?: string; hideBelow?: "sm" | "md" | "lg" };
type Meta = { page: number; perPage: number; total: number; totalPages: number };

export function DataTable<T extends { id: string }>({
  columns, rows, meta, searchPlaceholder = "Buscar…", bulkActions, onBulk, toolbar, filters, emptyTitle = "Sin resultados", rowClassName,
}: {
  columns: Column<T>[]; rows: T[]; meta?: Meta; searchPlaceholder?: string; bulkActions?: { label: string; value: string; danger?: boolean }[]; onBulk?: (ids: string[], action: string) => Promise<void> | void;
  toolbar?: React.ReactNode; filters?: React.ReactNode; emptyTitle?: string; rowClassName?: (row: T) => string | undefined;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(sp.get("q") ?? "");
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    n.delete("page");
    router.push(`${pathname}?${n.toString()}`);
  };
  const hide = (h?: "sm" | "md" | "lg") => (h ? { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" }[h] : "");

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setParam("q", q); }} className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className="input pl-9" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          {filters}
          {bulkActions && selected.size > 0 && (
            <div className="relative">
              <select
                className="input cursor-pointer appearance-none pr-8"
                defaultValue=""
                onChange={async (e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const act = bulkActions.find((b) => b.value === v);
                  if (act?.danger && !confirm(`¿${act.label} ${selected.size} elemento(s)?`)) { e.target.value = ""; return; }
                  await onBulk?.(Array.from(selected), v);
                  setSelected(new Set());
                  e.target.value = "";
                }}
              >
                <option value="">Acciones ({selected.size})</option>
                {bulkActions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
          )}
        </div>
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} className="rounded-none border-0 shadow-none" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              <tr>
                {bulkActions && (
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 accent-brand" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
                  </th>
                )}
                {columns.map((c) => <th key={c.key} className={cn("px-4 py-3 font-bold", c.className, hide(c.hideBelow))}>{c.header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={cn("transition hover:bg-muted/40", selected.has(r.id) && "bg-brand-soft/40", rowClassName?.(r))}>
                  {bulkActions && (
                    <td className="px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 accent-brand" checked={selected.has(r.id)} onChange={(e) => { const n = new Set(selected); if (e.target.checked) n.add(r.id); else n.delete(r.id); setSelected(n); }} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.className, hide(c.hideBelow))}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
          <span>{meta.total} registros</span>
          <Pagination page={meta.page} totalPages={meta.totalPages} />
        </div>
      )}
    </div>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function IconButton({ title, onClick, href, tone = "neutral", children }: { title: string; onClick?: () => void; href?: string; tone?: "neutral" | "danger" | "brand"; children: React.ReactNode }) {
  const cls = cn("inline-flex h-8 w-8 items-center justify-center rounded-lg transition", tone === "danger" ? "text-danger hover:bg-red-50" : tone === "brand" ? "text-brand hover:bg-brand-soft" : "text-ink-soft hover:bg-muted hover:text-ink");
  if (href) return <a href={href} title={title} className={cls}>{children}</a>;
  return <button type="button" title={title} onClick={onClick} className={cls}>{children}</button>;
}
