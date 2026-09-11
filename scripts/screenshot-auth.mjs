// Captura pantallas autenticadas: node scripts/screenshot-auth.mjs <email> <password> <out-prefix> <url1> [url2...]
import { chromium } from "playwright-core";
const [,, email, password, prefix, ...urls] = process.argv;
const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 1440), height: Number(process.env.H ?? 900) } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${base}/ingresar`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"), { timeout: 30000 });
for (const [i, u] of urls.entries()) {
  await page.goto(`${base}${u}`, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => errors.push(`goto ${u}: ${e.message}`));
  await page.waitForTimeout(700);
  const out = `${prefix}-${i + 1}.png`;
  await page.screenshot({ path: out, fullPage: process.env.FULL === "1" });
  console.log(out, page.url());
}
console.log(JSON.stringify({ errors: errors.slice(0, 8) }));
await browser.close();
