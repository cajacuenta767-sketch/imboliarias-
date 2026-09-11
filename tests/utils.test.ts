import { describe, expect, it } from "vitest";
import { slugify, youtubeEmbed, qs } from "@/lib/utils";
import { convert, formatMoney } from "@/lib/currency";
import { parseCsv, toCsv } from "@/server/lib/csv";

describe("slugify", () => {
  it("normaliza acentos y espacios", () => {
    expect(slugify("Apartamento en Chicó Norte  ")).toBe("apartamento-en-chico-norte");
    expect(slugify("Villa frente al mar (2024)!")).toBe("villa-frente-al-mar-2024");
  });
});

describe("youtubeEmbed", () => {
  it("convierte URLs de YouTube a embed", () => {
    expect(youtubeEmbed("https://www.youtube.com/watch?v=ysz5S6PUM-U")).toBe("https://www.youtube.com/embed/ysz5S6PUM-U");
    expect(youtubeEmbed("https://youtu.be/ysz5S6PUM-U")).toBe("https://www.youtube.com/embed/ysz5S6PUM-U");
    expect(youtubeEmbed("https://vimeo.com/123")).toBeNull();
  });
});

describe("qs", () => {
  it("omite valores vacíos", () => {
    expect(qs({ a: 1, b: "", c: undefined, d: "x" })).toBe("?a=1&d=x");
  });
});

describe("moneda", () => {
  const usd = { code: "USD", symbol: "US$", rate: 1, decimals: 0 };
  const cop = { code: "COP", symbol: "$", rate: 4100, decimals: 0 };
  it("convierte usando tasas relativas a la base", () => {
    expect(convert(100, usd, cop)).toBe(410000);
    expect(convert(410000, cop, usd)).toBe(100);
  });
  it("formatea con símbolo y compacta millones", () => {
    expect(formatMoney(1590000, usd)).toBe("US$1.590.000");
    expect(formatMoney(1590000, usd, { compact: true })).toBe("US$1.6 M");
  });
});

describe("csv", () => {
  it("serializa y parsea con comillas y comas", () => {
    const rows = [{ title: 'Casa "grande", bonita', price: 100 }, { title: "Lote", price: 5 }];
    const csv = toCsv(rows);
    expect(parseCsv(csv)).toEqual([{ title: 'Casa "grande", bonita', price: "100" }, { title: "Lote", price: "5" }]);
  });
});
