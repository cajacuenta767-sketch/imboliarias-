import { describe, expect, it } from "vitest";
import { computeTotals } from "@/server/modules/billing/service";

describe("computeTotals", () => {
  it("sin cupón ni impuesto", () => {
    expect(computeTotals(29, null, 0)).toEqual({ subtotal: 29, discount: 0, tax: 0, total: 29 });
  });
  it("cupón porcentual e impuesto", () => {
    const t = computeTotals(100, { type: "PERCENT", value: 20 }, 19);
    expect(t.discount).toBe(20);
    expect(t.tax).toBe(15.2);
    expect(t.total).toBe(95.2);
  });
  it("cupón fijo nunca deja el total negativo", () => {
    const t = computeTotals(5, { type: "FIXED", value: 50 }, 0);
    expect(t.discount).toBe(5);
    expect(t.total).toBe(0);
  });
});
