import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/site/auth-forms";
import { AuthShell } from "@/components/site/auth-shell";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSub")}>
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
