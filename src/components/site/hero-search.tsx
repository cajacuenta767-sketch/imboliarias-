"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, MapPin, Building2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string; slug: string };

export function HeroSearch({ cities, categories, className }: { cities: Opt[]; categories: Opt[]; className?: string }) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [tab, setTab] = useState<"SALE" | "RENT" | "PROJECTS">("SALE");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (city) sp.set("city", city);
    if (tab === "PROJECTS") {
      router.push(`/proyectos?${sp.toString()}`);
      return;
    }
    sp.set("type", tab);
    if (category) sp.set("category", category);
    router.push(`/propiedades?${sp.toString()}`);
  };

  const tabs = [
    { v: "SALE" as const, label: t("tabs.sale") },
    { v: "RENT" as const, label: t("tabs.rent") },
    { v: "PROJECTS" as const, label: t("tabs.projects") },
  ];

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-white/15 p-1 backdrop-blur-md ring-1 ring-white/25" role="tablist" aria-label={t("search")}>
        {tabs.map((tb) => (
          <button key={tb.v} type="button" role="tab" aria-selected={tab === tb.v} onClick={() => setTab(tb.v)} className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-5", tab === tb.v ? "bg-white text-ink shadow" : "text-white/85 hover:text-white")}>
            {tb.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 grid gap-2 rounded-3xl bg-white/95 p-2.5 shadow-float backdrop-blur-xl md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <label className="flex items-center gap-2.5 rounded-2xl px-4 py-3 hover:bg-muted focus-within:ring-2 focus-within:ring-brand/40">
          <Search className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <span className="sr-only">{t("keyword")}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("keyword")} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted" />
        </label>
        <label className="flex items-center gap-2.5 rounded-2xl px-4 py-3 hover:bg-muted focus-within:ring-2 focus-within:ring-brand/40 md:border-l md:border-line">
          <MapPin className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <span className="sr-only">{t("city")}</span>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full cursor-pointer bg-transparent text-sm text-ink outline-none">
            <option value="">{t("anyCity")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        {tab !== "PROJECTS" ? (
          <label className="flex items-center gap-2.5 rounded-2xl px-4 py-3 hover:bg-muted focus-within:ring-2 focus-within:ring-brand/40 md:border-l md:border-line">
            <Building2 className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <span className="sr-only">{t("category")}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full cursor-pointer bg-transparent text-sm text-ink outline-none">
              <option value="">{t("anyCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="hidden md:block" />
        )}
        <button type="submit" className="btn-primary h-full min-h-12 rounded-2xl px-7 text-base">
          <Search className="h-5 w-5" /> {t("search")}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
        <button type="button" onClick={() => router.push("/propiedades?advanced=1")} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur hover:bg-white/25">
          <SlidersHorizontal className="h-3.5 w-3.5" /> {t("advanced")}
        </button>
        <span className="opacity-70">{t("popular")}:</span>
        {cities.slice(0, 4).map((c) => (
          <button key={c.id} type="button" onClick={() => router.push(`/propiedades?city=${c.slug}`)} className="rounded-full px-2.5 py-1 hover:bg-white/15">
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
