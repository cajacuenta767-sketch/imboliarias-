import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/site/auth-forms";
import { AuthShell } from "@/components/site/auth-shell";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("registerTitle")} subtitle={t("registerSub")}>
      <RegisterForm />
    </AuthShell>
  );
}
