"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-danger"><AlertTriangle className="h-8 w-8" /></span>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("errorTitle")}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{t("errorText")}</p>
      {error.digest && <p className="mt-2 text-xs text-ink-muted">ID: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary"><RotateCcw className="h-4 w-4" /> {t("retry")}</button>
        <Link href="/" className="btn-outline">{t("goHome")}</Link>
      </div>
    </div>
  );
}
