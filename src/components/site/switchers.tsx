"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import { useCurrency } from "@/lib/hooks/use-currency";
import { setCookie } from "@/lib/api";
import { cn } from "@/lib/utils";

const cls = (dark?: boolean) =>
  cn("inline-flex cursor-pointer items-center gap-1 rounded-full text-xs font-semibold", dark ? "text-white/80 hover:text-white" : "border border-line bg-elevated px-3 py-1.5 text-ink");

export function LangSwitch({ dark }: { dark?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  return (
    <label className={cls(dark)}>
      <Globe className="h-3.5 w-3.5" />
      <select
        value={locale}
        onChange={(e) => {
          setCookie("locale", e.target.value);
          router.refresh();
        }}
        className="cursor-pointer appearance-none bg-transparent pr-3 outline-none"
      >
        <option value="es" className="text-ink">Español</option>
        <option value="en" className="text-ink">English</option>
      </select>
      <ChevronDown className="-ml-3 h-3 w-3 pointer-events-none" />
    </label>
  );
}

export function CurrencySwitch({ dark }: { dark?: boolean }) {
  const { currencies, current, setCurrency } = useCurrency();
  const router = useRouter();
  return (
    <label className={cls(dark)}>
      <select
        value={current.code}
        onChange={(e) => {
          setCurrency(e.target.value);
          router.refresh();
        }}
        className="cursor-pointer appearance-none bg-transparent pr-3 outline-none"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code} className="text-ink">{c.code}</option>
        ))}
      </select>
      <ChevronDown className="-ml-3 h-3 w-3 pointer-events-none" />
    </label>
  );
}
