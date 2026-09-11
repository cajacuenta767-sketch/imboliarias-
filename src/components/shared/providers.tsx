"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";
import { CurrencyProvider } from "@/lib/hooks/use-currency";
import { WishlistProvider } from "@/lib/hooks/use-wishlist";
import { SettingsProvider } from "@/lib/hooks/use-settings";
import type { CurrencyInfo } from "@/lib/currency";

export function Providers({
  children,
  session,
  currencies,
  currencyCode,
  settings,
}: {
  children: React.ReactNode;
  session: Session | null;
  currencies: CurrencyInfo[];
  currencyCode: string;
  settings: Record<string, string>;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SettingsProvider settings={settings}>
        <CurrencyProvider currencies={currencies} initialCode={currencyCode}>
          <WishlistProvider enabled={!!session?.user}>
            {children}
            <Toaster position="top-right" richColors closeButton toastOptions={{ className: "font-sans" }} />
          </WishlistProvider>
        </CurrencyProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
