import { cache } from "react";
import { z } from "zod";
import { db } from "@/server/db";
import { FALLBACK_CURRENCY, type CurrencyInfo } from "@/lib/currency";
import { badRequest } from "@/server/errors";

export const currencySchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  name: z.string().min(1),
  symbol: z.string().min(1).max(5),
  rate: z.coerce.number().positive(),
  decimals: z.coerce.number().int().min(0).max(4).default(0),
  isDefault: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export const listCurrencies = cache(async (onlyActive = true): Promise<CurrencyInfo[]> => {
  const rows = await db.currency.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: { order: "asc" } });
  if (rows.length === 0) return [FALLBACK_CURRENCY];
  return rows;
});

export async function getDefaultCurrency(): Promise<CurrencyInfo> {
  return (await db.currency.findFirst({ where: { isDefault: true } })) ?? FALLBACK_CURRENCY;
}

export async function upsertCurrency(input: z.infer<typeof currencySchema>) {
  if (input.isDefault) {
    await db.currency.updateMany({ data: { isDefault: false } });
  }
  return db.currency.upsert({ where: { code: input.code }, update: input, create: input });
}

export async function deleteCurrency(code: string) {
  const c = await db.currency.findUnique({ where: { code } });
  if (c?.isDefault) throw badRequest("No puedes eliminar la moneda por defecto");
  await db.currency.delete({ where: { code } });
}
