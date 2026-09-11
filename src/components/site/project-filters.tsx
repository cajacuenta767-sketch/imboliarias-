"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STATUS_LABELS, PROJECT_STATUSES } from "@/lib/constants";

export function ProjectFilters({ cities }: { cities: { id: string; name: string; slug: string }[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v);
    else n.delete(k);
    n.delete("page");
    router.push(`${pathname}?${n.toString()}`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <input className="input w-48" placeholder="Buscar proyecto…" defaultValue={sp.get("q") ?? ""} onKeyDown={(e) => e.key === "Enter" && set("q", (e.target as HTMLInputElement).value)} />
      <select className="input w-auto cursor-pointer" value={sp.get("city") ?? ""} onChange={(e) => set("city", e.target.value)}>
        <option value="">Todas las ciudades</option>
        {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      <select className="input w-auto cursor-pointer" value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
        <option value="">Cualquier estado</option>
        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
    </div>
  );
}
