import { HttpError } from "@/server/errors";

/**
 * Limitador de peticiones en memoria (ventana deslizante simple).
 * Suficiente para una instancia; con varias réplicas conviene respaldarlo en Redis.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 3_600_000) buckets.delete(k);
  }
}

export function clientIp(req: Request | { headers: Headers } | undefined): string {
  const h = req?.headers;
  if (!h) return "unknown";
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Devuelve true si la petición está dentro del límite (y la registra). */
export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  sweep(now);
  const from = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > from);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export const tooManyRequests = (msg = "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.") => new HttpError(429, msg);

/** Lanza 429 si la IP superó `limit` peticiones en la ventana para la acción indicada. */
export function rateLimit(req: Request, action: string, limit: number, windowMs = 15 * 60_000) {
  if (!checkRateLimit(`${action}:${clientIp(req)}`, limit, windowMs)) throw tooManyRequests();
}

/** Solo para pruebas. */
export const _resetRateLimits = () => buckets.clear();
