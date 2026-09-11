"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { PROJECT_STATUSES } from "@/lib/constants";
import { useStatusLabel } from "@/components/ui/badge";

export function ProjectFilters({ cities }: { cities: { id: string; name: string; slug: string }[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const statusLabel = useStatusLabel();
  const th = useTranslations("hero");
  const tl = useTranslations("list");
  // Si la URL cambia (limpiar, navegación), el campo de búsqueda se resincroniza.
  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v);
    else n.delete(k);
    n.delete("page");
    router.push(`${pathname}?${n.toString()}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); set("q", q.trim()); }} className="grid w-full gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:w-auto md:min-w-[560px]">
      <label className="relative block">
        <span className="sr-only">{th("keyword")}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input type="search" className="input pl-9" placeholder={th("keyword")} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <select className="input cursor-pointer" aria-label={th("city")} value={sp.get("city") ?? ""} onChange={(e) => set("city", e.target.value)}>
        <option value="">{th("anyCity")}</option>
        {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      <select className="input cursor-pointer" aria-label={tl("any")} value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
        <option value="">{tl("any")}</option>
        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
      <button type="submit" className="sr-only">{th("search")}</button>
    </form>
  );
}
