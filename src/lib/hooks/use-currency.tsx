"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { convert, formatMoney, FALLBACK_CURRENCY, type CurrencyInfo } from "@/lib/currency";
import { setCookie } from "@/lib/api";

type CurrencyCtx = {
  currencies: CurrencyInfo[];
  current: CurrencyInfo;
  setCurrency: (code: string) => void;
  /** Formatea un monto expresado en la moneda `fromCode` en la moneda seleccionada. */
  price: (amount: number, fromCode?: string, opts?: { compact?: boolean }) => string;
  /** Formatea sin convertir, en la moneda indicada. */
  format: (amount: number, code: string) => string;
};

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ currencies, initialCode, children }: { currencies: CurrencyInfo[]; initialCode: string; children: React.ReactNode }) {
  const locale = useLocale();
  const numberLocale = locale === "en" ? "en-US" : "es-CO";
  const [code, setCode] = useState(initialCode);
  const active = useMemo(() => currencies.filter((c) => c.isActive !== false), [currencies]);
  const current = useMemo(() => active.find((c) => c.code === code) ?? active[0] ?? FALLBACK_CURRENCY, [active, code]);

  const setCurrency = useCallback((c: string) => {
    setCode(c);
    setCookie("currency", c);
  }, []);

  const price = useCallback(
    (amount: number, fromCode = "USD", opts?: { compact?: boolean }) => {
      const from = currencies.find((c) => c.code === fromCode);
      // Moneda desconocida: se muestra el monto sin convertir, con su código, en lugar de tratarlo como USD.
      if (!from) return `${fromCode} ${formatMoney(amount, { ...FALLBACK_CURRENCY, symbol: "" }, { ...opts, locale: numberLocale })}`;
      return formatMoney(convert(amount, from, current), current, { ...opts, locale: numberLocale });
    },
    [currencies, current, numberLocale],
  );

  const format = useCallback(
    (amount: number, code: string) => {
      const c = currencies.find((x) => x.code === code);
      return c ? formatMoney(amount, c, { locale: numberLocale }) : `${code} ${formatMoney(amount, { ...FALLBACK_CURRENCY, symbol: "", decimals: 2 }, { locale: numberLocale })}`;
    },
    [currencies, numberLocale],
  );

  return <Ctx.Provider value={{ currencies: active, current, setCurrency, price, format }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency debe usarse dentro de CurrencyProvider");
  return ctx;
}
