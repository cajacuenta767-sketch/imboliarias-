"use client";

import { useTranslations } from "next-intl";

export function ViewAllLabel() {
  const t = useTranslations("common");
  return <>{t("viewAll")}</>;
}
