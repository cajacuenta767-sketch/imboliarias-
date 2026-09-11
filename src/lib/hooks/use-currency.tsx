"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { convert, formatMoney, FALLBACK_CURRENCY, type CurrencyInfo } from "@/lib/currency";
import { setCookie } from "@/lib/api";

type CurrencyCtx = {
  currencies: CurrencyInfo[];
  current: CurrencyInfo;
  setCurrency: (code: string) => void;
  /** Formatea un monto expresado en la moneda `fromCode` en la moneda seleccionada. */
  price: (amount: number, fromCode?: string, opts?: { compact?: boolean }) => string;
};

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ currencies, initialCode, children }: { currencies: CurrencyInfo[]; initialCode: string; children: React.ReactNode }) {
  const [code, setCode] = useState(initialCode);
  const current = useMemo(() => currencies.find((c) => c.code === code) ?? currencies[0] ?? FALLBACK_CURRENCY, [currencies, code]);

  const setCurrency = useCallback((c: string) => {
    setCode(c);
    setCookie("currency", c);
  }, []);

  const price = useCallback(
    (amount: number, fromCode = "USD", opts?: { compact?: boolean }) => {
      const from = currencies.find((c) => c.code === fromCode) ?? FALLBACK_CURRENCY;
      return formatMoney(convert(amount, from, current), current, opts);
    },
    [currencies, current],
  );

  return <Ctx.Provider value={{ currencies, current, setCurrency, price }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency debe usarse dentro de CurrencyProvider");
  return ctx;
}
