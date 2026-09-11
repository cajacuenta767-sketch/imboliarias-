"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "@/lib/hooks/use-currency";
import { cn } from "@/lib/utils";

/** `noConvert` muestra el monto en su moneda original (facturas), sin aplicar la moneda elegida por el visitante. */
export function Price({ amount, currencyCode = "USD", period, type, className, compact, noConvert }: { amount: number; currencyCode?: string; period?: string | null; type?: string; className?: string; compact?: boolean; noConvert?: boolean }) {
  const { price, format } = useCurrency();
  const t = useTranslations("common");
  const suffix = type === "RENT" && period ? (period === "MONTH" ? t("perMonth") : period === "YEAR" ? t("perYear") : t("perDay")) : "";
  return (
    <span className={cn("font-display font-extrabold tabular-nums", className)}>
      {noConvert ? format(amount, currencyCode) : price(amount, currencyCode, { compact })}
      {suffix && <span className="ml-0.5 text-[0.7em] font-semibold text-ink-muted">{suffix}</span>}
    </span>
  );
}
