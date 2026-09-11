"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import { useCurrency } from "@/lib/hooks/use-currency";
import { setCookie } from "@/lib/api";
import { cn } from "@/lib/utils";

const cls = (dark?: boolean) =>
  cn("inline-flex cursor-pointer items-center gap-1 rounded-full text-xs font-semibold", dark ? "text-white/80 hover:text-white" : "border border-line bg-elevated px-3 py-1.5 text-ink");

export function LangSwitch({ dark }: { dark?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  return (
    <label className={cn(cls(dark), "focus-within:ring-2 focus-within:ring-brand/50")}>
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <select
        aria-label={t("language")}
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
  const t = useTranslations("common");
  const router = useRouter();
  if (currencies.length <= 1) return null;
  return (
    <label className={cn(cls(dark), "focus-within:ring-2 focus-within:ring-brand/50")}>
      <select
        aria-label={t("currency")}
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
