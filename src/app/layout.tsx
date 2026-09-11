import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { Providers } from "@/components/shared/providers";
import { auth } from "@/server/auth";
import { listCurrencies } from "@/server/modules/currencies/service";
import { getSettings } from "@/server/modules/settings/service";
import { SITE_URL } from "@/lib/constants";
import { SkipLink } from "@/components/ui/skip-link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const [s, locale] = await Promise.all([getSettings(), getLocale()]);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.site_name} · ${s.site_tagline}`, template: `%s · ${s.site_name}` },
    description: s.site_description,
    openGraph: { siteName: s.site_name, type: "website", locale: locale === "en" ? "en_US" : "es_CO" },
    icons: { icon: "/favicon.ico" },
    manifest: "/manifest.webmanifest",
  };
}

/** Colores de marca configurables desde el panel (Apariencia). */
function brandStyle(s: Record<string, string>) {
  const ok = (c?: string) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : null);
  const rules: string[] = [];
  const p = ok(s.primary_color);
  const a = ok(s.accent_color);
  if (p && p.toLowerCase() !== "#0f766e") rules.push(`--brand:${p};--brand-strong:${p};--sale:${p};`);
  if (a && a.toLowerCase() !== "#d97706") rules.push(`--accent:${a};--accent-strong:${a};`);
  return rules.length ? `:root{${rules.join("")}}` : null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, session, currencies, settings, cookieStore] = await Promise.all([
    getLocale(),
    getMessages(),
    auth(),
    // Se cargan todas las monedas (también inactivas) para convertir precios antiguos; el selector solo muestra las activas.
    listCurrencies(false),
    getSettings(),
    cookies(),
  ]);
  const active = currencies.filter((c) => c.isActive !== false);
  const currencyCode = cookieStore.get("currency")?.value ?? settings.default_currency ?? active[0]?.code;
  const style = brandStyle(settings);

  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable}`}>
      <head>{style && <style dangerouslySetInnerHTML={{ __html: style }} />}</head>
      <body className="min-h-screen bg-bg text-ink">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <Providers session={session} currencies={currencies} currencyCode={currencyCode} settings={settings}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
