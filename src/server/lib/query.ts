import type { ZodType } from "zod";
import { z } from "zod";

type SP = Record<string, string | string[] | undefined>;

/**
 * Parsea parámetros de búsqueda con tolerancia: si una clave es inválida (p. ej. `page=x`
 * o `minPrice=abc`) se descarta solo esa clave en vez de perder todos los filtros o lanzar un 500.
 */
export function parseSearchParams<T>(schema: ZodType<T>, sp: SP, defaults: Record<string, string> = {}): T {
  const input: Record<string, unknown> = { ...sp, ...defaults };
  for (let i = 0; i < 20; i++) {
    const r = schema.safeParse(input);
    if (r.success) return r.data;
    const bad = new Set(r.error.issues.filter((iss) => iss.path.length > 0).map((iss) => String(iss.path[0])));
    if (bad.size === 0) break;
    for (const k of bad) delete input[k];
  }
  return schema.parse(defaults);
}

/** Número opcional en query string: "" y valores no numéricos se tratan como ausentes. */
export const optionalNumber = () =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().finite().optional());

export const optionalInt = () =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().int().optional());

/** Fecha opcional de formulario: una fecha sin hora (YYYY-MM-DD) se interpreta como el final de ese día. */
export const optionalDate = () =>
  z.preprocess((v) => {
    if (v === "" || v === undefined || v === null) return null;
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T23:59:59.999Z`;
    return v;
  }, z.coerce.date().optional().nullable());

/** Número finito leído de configuración, con valor por defecto si no es válido. */
export const settingNumber = (v: string | undefined, fallback: number) => {
  const raw = String(v ?? "").trim().replace(",", ".");
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};
