// Prueba de humo end-to-end: node scripts/smoke.mjs  (requiere el servidor en http://localhost:3000 con datos de demo)
// Variables: BASE_URL, OUT (carpeta para capturas)
import { chromium } from "playwright-core";
const base = process.env.BASE_URL ?? "http://localhost:3000";
import { mkdirSync } from "node:fs";
mkdirSync(process.env.OUT ?? "screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK " : "FAIL"} ${name} ${extra}`);

// login as agent
await page.goto(`${base}/ingresar`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "andres@habitta.test");
await page.fill('input[type="password"]', "Habitta123!");
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"), { timeout: 30000 });
check("login agent", page.url().includes("/cuenta"));

const api = async (path, init = {}) => {
  const r = await ctx.request.fetch(`${base}${path}`, init);
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status(), j };
};

// 1. agent cannot self-feature
let r = await api("/api/v1/me", { method: "PUT", data: { name: "Andrés Mejía", agent: { isFeatured: false, title: "Asesor comercial" } } });
check("PUT /me ok", r.status === 200, String(r.status));
r = await api("/api/v1/me", { method: "PUT", data: { name: "Andrés Mejía", agent: { isFeatured: true } } });
const me = await api("/api/v1/me");
check("agent cannot self-feature", me.j?.data?.agent?.isFeatured === false, JSON.stringify(me.j?.data?.agent?.isFeatured));
check("/me has no passwordHash", me.j?.data && !("passwordHash" in me.j.data));

// 2. upload html disguised as png -> rejected
const fd = { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") }, folder: "properties" };
r = await ctx.request.post(`${base}/api/v1/media`, { multipart: fd });
check("html-as-png upload rejected", r.status() === 400, String(r.status()));
// real png
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
r = await ctx.request.post(`${base}/api/v1/media`, { multipart: { file: { name: "evil.html", mimeType: "text/html", buffer: png }, folder: "properties" } });
const up = await r.json().catch(() => null);
check("real png accepted with .png ext", r.status() === 201 && up?.data?.[0]?.url?.endsWith(".png"), JSON.stringify(up?.data?.[0]?.url));

// 3. checkout: client cannot pick gateway (env SANDBOX -> PAID anyway); invoice has no passwordHash
const pk = await api("/api/v1/packages");
r = await api("/api/v1/invoices/checkout", { method: "POST", data: { packageId: pk.j.data[0].id, coupon: "BIENVENIDO20", gateway: "SANDBOX" } });
check("checkout ok", r.status === 201, String(r.status) + " " + JSON.stringify(r.j?.error));
check("invoice user has no passwordHash", r.j?.data?.user && !("passwordHash" in r.j.data.user));
check("invoice has taxPercent", typeof r.j?.data?.taxPercent === "number");
check("invoice number consecutive", /^HB-\d{4}-\d{4}$/.test(r.j?.data?.number ?? ""), r.j?.data?.number);

// 4. property create by agent: expiresAt/agentId ignored, credits deducted atomically
const before = (await api("/api/v1/credits")).j.data.credits;
r = await api("/api/v1/properties", { method: "POST", data: { title: "Prueba e2e agente", type: "SALE", price: 1000, currencyCode: "USD", expiresAt: "2099-01-01", moderation: "APPROVED", content: "<p onclick=\"x()\">hola<script>1</script></p>", images: [], featureIds: [], facilities: [], customValues: [], translations: [] } });
check("agent create property", r.status === 201, String(r.status) + JSON.stringify(r.j?.error));
const prop = r.j?.data;
check("moderation forced PENDING", prop?.moderation === "PENDING", prop?.moderation);
check("expiresAt not client-controlled", !prop?.expiresAt || new Date(prop.expiresAt).getFullYear() < 2099, prop?.expiresAt);
check("content sanitized", prop?.content && !prop.content.includes("script") && !prop.content.includes("onclick"), prop?.content);
const after = (await api("/api/v1/credits")).j.data.credits;
check("1 credit charged", before - after === 1, `${before}->${after}`);
// renew
r = await api(`/api/v1/properties/${prop.id}/renew`, { method: "POST" });
check("renew ok", r.status === 200, String(r.status));
// el propietario sí ve su propiedad pendiente por id
r = await api(`/api/v1/properties/${prop.id}`);
check("owner sees pending by id", r.status === 200);
// delete
r = await api(`/api/v1/properties/${prop.id}`, { method: "DELETE" });
check("delete own property", r.status === 200);

// 5. honeypot (antes de agotar el límite de peticiones)
r = await api("/api/v1/inquiries", { method: "POST", data: { name: "Bot", email: "b@b.test", message: "hola hola", website: "x" } });
check("honeypot rejected", r.status === 422, String(r.status));
// rate limit on inquiries: 10 ok then 429
let last = 0;
for (let i = 0; i < 12; i++) { const x = await api("/api/v1/inquiries", { method: "POST", data: { name: "Bot", email: "b@b.test", message: "hola hola" } }); last = x.status; }
check("inquiry rate limited", last === 429, String(last));
// anonymous resume upload allowed only as PDF in "resumes"
const anon = await browser.newContext();
const pdf = Buffer.from("%PDF-1.4\n%fake\n");
let ar = await anon.request.post(`${base}/api/v1/media`, { multipart: { file: { name: "cv.pdf", mimeType: "application/pdf", buffer: pdf }, folder: "resumes" } });
check("anonymous resume upload ok", ar.status() === 201, String(ar.status()));
ar = await anon.request.post(`${base}/api/v1/media`, { multipart: { file: { name: "cv.pdf", mimeType: "application/pdf", buffer: pdf }, folder: "properties" } });
check("anonymous upload elsewhere rejected", ar.status() === 401, String(ar.status()));
await anon.close();

// 6. wishlist toggle on pending property rejected
r = await api("/api/v1/wishlist", { method: "POST", data: { propertyId: "nope" } });
check("wishlist unknown property 404", r.status === 404, String(r.status));

// screenshots: property detail, listing map view, account, login
await page.goto(`${base}/propiedades?view=map`, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: (process.env.OUT ?? "screenshots") + "/v2-map.png" });
await page.goto(`${base}/cuenta/propiedades/nueva`, { waitUntil: "networkidle" }).catch(() => {});
await page.screenshot({ path: (process.env.OUT ?? "screenshots") + "/v2-nueva.png" });
await page.goto(`${base}/cuenta/creditos`, { waitUntil: "networkidle" }).catch(() => {});
await page.screenshot({ path: (process.env.OUT ?? "screenshots") + "/v2-creditos.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" }).catch(() => {});
await page.screenshot({ path: (process.env.OUT ?? "screenshots") + "/v2-mobile-home.png" });
await page.click('button[aria-label="Menú"]').catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: (process.env.OUT ?? "screenshots") + "/v2-mobile-menu.png" });
// 7. admin: guardar un subconjunto de ajustes (el formulario solo envía la sección visible)
const adminCtx = await browser.newContext();
const ap = await adminCtx.newPage();
await ap.goto(`${base}/ingresar`, { waitUntil: "networkidle" });
await ap.fill('input[type="email"]', "admin@habitta.test");
await ap.fill('input[type="password"]', "Habitta123!");
await ap.click('button[type="submit"]');
await ap.waitForURL((u) => !u.pathname.startsWith("/ingresar"), { timeout: 30000 });
let sr = await adminCtx.request.put(`${base}/api/v1/settings`, { data: { site_tagline: "Prueba de humo", tax_percent: "19,5" } });
let sj = await sr.json().catch(() => null);
check("admin saves partial settings", sr.status() === 200 && sj?.data?.tax_percent === "19.5", `${sr.status()} ${sj?.data?.tax_percent}`);
sr = await adminCtx.request.put(`${base}/api/v1/settings`, { data: { listing_days: "45 días" } });
check("invalid numeric setting rejected", sr.status() === 422, String(sr.status()));
await adminCtx.request.put(`${base}/api/v1/settings`, { data: { site_tagline: "Encuentra el lugar donde tu vida sucede", tax_percent: "0" } });
await adminCtx.close();
console.log(results.join("\n"));
console.log("pageerrors:", errors.slice(0, 5));
await browser.close();
