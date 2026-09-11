import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand"><SearchX className="h-8 w-8" /></span>
      <p className="eyebrow mb-2">404</p>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("notFoundTitle")}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{t("notFoundText")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">{t("goHome")}</Link>
        <Link href="/propiedades" className="btn-outline">{t("browse")}</Link>
      </div>
    </div>
  );
}
