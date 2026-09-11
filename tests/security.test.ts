import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimits, clientIp } from "@/server/lib/rate-limit";
import { sniffMime } from "@/server/modules/media/service";
import { toCsv, parseCsv } from "@/server/lib/csv";
import { resolveGateway, couponSchema } from "@/server/modules/billing/service";

describe("rate limit", () => {
  beforeEach(() => _resetRateLimits());
  it("bloquea a partir del límite dentro de la ventana", () => {
    const t0 = 1_000_000;
    expect(checkRateLimit("k", 3, 1000, t0)).toBe(true);
    expect(checkRateLimit("k", 3, 1000, t0 + 10)).toBe(true);
    expect(checkRateLimit("k", 3, 1000, t0 + 20)).toBe(true);
    expect(checkRateLimit("k", 3, 1000, t0 + 30)).toBe(false);
    // pasada la ventana vuelve a permitir
    expect(checkRateLimit("k", 3, 1000, t0 + 1500)).toBe(true);
  });
  it("lee la IP del proxy", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("1.2.3.4");
    expect(clientIp(undefined)).toBe("unknown");
  });
});

describe("sniffMime", () => {
  it("reconoce formatos permitidos por sus bytes iniciales", () => {
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffMime(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe("application/pdf");
    const webp = new Uint8Array(16); webp.set([0x52, 0x49, 0x46, 0x46], 0); webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(sniffMime(webp)).toBe("image/webp");
  });
  it("rechaza HTML disfrazado de imagen", () => {
    expect(sniffMime(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});

describe("csv", () => {
  it("neutraliza fórmulas de hoja de cálculo", () => {
    const csv = toCsv([{ title: "=HYPERLINK(\"http://x\")", price: 1 }, { title: "+1+1", price: 2 }, { title: "Casa", price: 3 }]);
    const lines = csv.split("\n");
    expect(lines[1].startsWith("\"'=HYPERLINK")).toBe(true);
    expect(lines[2].startsWith("\"'+1+1\"")).toBe(true);
    expect(lines[3]).toBe("Casa,3");
    expect(parseCsv(csv)[2]).toEqual({ title: "Casa", price: "3" });
  });
});

describe("billing", () => {
  it("la pasarela la decide el servidor y por defecto es MANUAL", () => {
    expect(resolveGateway("SANDBOX")).toBe("SANDBOX");
    expect(resolveGateway("STRIPE")).toBe("MANUAL");
    expect(resolveGateway("")).toBe("MANUAL");
  });
  it("un cupón porcentual no supera el 100 %", () => {
    expect(couponSchema.safeParse({ code: "abc", type: "PERCENT", value: 150 }).success).toBe(false);
    expect(couponSchema.safeParse({ code: "abc", type: "PERCENT", value: 100 }).success).toBe(true);
    expect(couponSchema.safeParse({ code: "abc", type: "FIXED", value: 150 }).success).toBe(true);
  });
});
