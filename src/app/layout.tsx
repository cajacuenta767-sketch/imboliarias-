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
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.site_name} · ${s.site_tagline}`, template: `%s · ${s.site_name}` },
    description: s.site_description,
    openGraph: { siteName: s.site_name, type: "website", locale: "es_CO" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, session, currencies, settings, cookieStore] = await Promise.all([
    getLocale(),
    getMessages(),
    auth(),
    listCurrencies(),
    getSettings(),
    cookies(),
  ]);
  const currencyCode = cookieStore.get("currency")?.value ?? settings.default_currency ?? currencies[0]?.code;

  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-ink">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers session={session} currencies={currencies} currencyCode={currencyCode} settings={settings}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
