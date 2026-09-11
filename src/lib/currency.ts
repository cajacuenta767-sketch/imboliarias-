export type CurrencyInfo = {
  code: string;
  symbol: string;
  rate: number;
  decimals: number;
  name?: string;
  isActive?: boolean;
};

/** Convierte un monto expresado en `from` a la moneda `to` usando tasas relativas a la moneda base. */
export function convert(amount: number, from: CurrencyInfo, to: CurrencyInfo) {
  if (from.code === to.code) return amount;
  const base = amount / from.rate;
  return base * to.rate;
}

export function formatMoney(amount: number, currency: CurrencyInfo, opts?: { compact?: boolean; locale?: string }) {
  const decimals = opts?.compact && amount >= 1_000_000 ? 1 : currency.decimals;
  if (opts?.compact && amount >= 1_000_000) {
    return `${currency.symbol}${(amount / 1_000_000).toFixed(decimals)} M`;
  }
  const n = new Intl.NumberFormat(opts?.locale ?? "es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${currency.symbol}${n}`;
}

export const FALLBACK_CURRENCY: CurrencyInfo = { code: "USD", symbol: "$", rate: 1, decimals: 0, name: "Dólar" };
