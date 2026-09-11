import { describe, expect, it } from "vitest";
import { parseSearchParams, optionalNumber, optionalDate, settingNumber } from "@/server/lib/query";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { normalizeSettings } from "@/server/modules/settings/service";
import { cleanHtml, cleanText } from "@/server/lib/sanitize";
import { computeTotals } from "@/server/modules/billing/service";
import { z } from "zod";

describe("parseSearchParams", () => {
  it("descarta solo la clave inválida y conserva el resto de filtros", () => {
    const q = parseSearchParams(propertyQuerySchema, { city: "medellin", type: "SALE", minPrice: "abc", page: "0" });
    expect(q.city).toBe("medellin");
    expect(q.type).toBe("SALE");
    expect(q.minPrice).toBeUndefined();
    expect(q.page).toBe(1);
  });
  it("trata los numéricos vacíos como ausentes", () => {
    const q = parseSearchParams(propertyQuerySchema, { minPrice: "100000", maxPrice: "" });
    expect(q.minPrice).toBe(100000);
    expect(q.maxPrice).toBeUndefined();
  });
  it("aplica los valores por defecto del servidor", () => {
    const q = parseSearchParams(propertyQuerySchema, { scope: "public" }, { perPage: "9" });
    expect(q.perPage).toBe(9);
  });
});

describe("helpers de query", () => {
  it("optionalNumber ignora vacío y rechaza no finitos", () => {
    const s = z.object({ n: optionalNumber() });
    expect(s.parse({ n: "" }).n).toBeUndefined();
    expect(s.parse({ n: "12.5" }).n).toBe(12.5);
    expect(s.safeParse({ n: "abc" }).success).toBe(false);
  });
  it("optionalDate interpreta una fecha sin hora como el final del día", () => {
    const s = z.object({ d: optionalDate() });
    const d = s.parse({ d: "2026-09-30" }).d!;
    expect(d.toISOString()).toBe("2026-09-30T23:59:59.999Z");
    expect(s.parse({ d: "" }).d).toBeNull();
  });
  it("settingNumber acepta coma decimal y vuelve al valor por defecto", () => {
    expect(settingNumber("19,5", 0)).toBe(19.5);
    expect(settingNumber("45 días", 45)).toBe(45);
    expect(settingNumber(undefined, 2)).toBe(2);
  });
});

describe("normalizeSettings", () => {
  it("valida rangos y normaliza los numéricos", () => {
    const r = normalizeSettings({ tax_percent: "19,5", listing_days: "45", site_name: "X" });
    expect(r.errors).toEqual({});
    expect(r.values).toEqual({ tax_percent: "19.5", listing_days: "45", site_name: "X" });
  });
  it("reporta valores fuera de rango o no numéricos", () => {
    const r = normalizeSettings({ listing_days: "45 días", credits_per_listing: "-1" });
    expect(Object.keys(r.errors).sort()).toEqual(["credits_per_listing", "listing_days"]);
  });
});

describe("sanitize", () => {
  it("elimina scripts y atributos de evento, conserva formato", () => {
    const out = cleanHtml('<p onclick="x()">Hola <strong>mundo</strong><script>alert(1)</script></p><a href="javascript:alert(1)">x</a><a href="https://ok.test">ok</a>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("<strong>mundo</strong>");
    expect(out).toContain('href="https://ok.test"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
  it("cleanText deja solo texto", () => {
    expect(cleanText("<b>Casa</b> <img src=x onerror=alert(1)>grande")).toBe("Casa grande");
    expect(cleanText("")).toBeNull();
  });
});

describe("computeTotals con decimales de moneda", () => {
  it("redondea según los decimales de la moneda", () => {
    expect(computeTotals(410001, { type: "PERCENT", value: 10 }, 0, 0)).toEqual({ subtotal: 410001, discount: 41000, tax: 0, total: 369001 });
    expect(computeTotals(100, { type: "PERCENT", value: 15 }, 19, 2).total).toBe(101.15);
  });
});

describe("sanitize es idempotente", () => {
  it("volver a sanear no cambia el resultado (evita re-moderación espuria)", () => {
    const html = '<p>Hola<br>mundo</p><ul><li><p>a</p></li></ul><a href="https://x.test" target="_blank" rel="noopener noreferrer nofollow">x</a>';
    const once = cleanHtml(html)!;
    expect(cleanHtml(once)).toBe(once);
  });
});
