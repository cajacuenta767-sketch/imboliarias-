"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LogIn, UserPlus } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";

export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  // Solo rutas internas: evita redirecciones abiertas (?next=//otro-sitio).
  const rawNext = sp.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/cuenta";
  const showDemo = process.env.NEXT_PUBLIC_DEMO_LOGIN === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...form, redirect: false });
      if (!res || res.error) {
        toast.error(t("invalid"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={tc("email")}><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></Field>
      <Field label={t("password")}><input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></Field>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : <LogIn className="h-4 w-4" />} {t("login")}</button>
      <p className="text-center text-sm text-ink-soft">{t("noAccount")} <Link href="/registro" className="font-semibold text-brand">{t("register")}</Link></p>
      {showDemo && (
        <div className="rounded-xl bg-muted p-3 text-xs text-ink-soft">
          <p className="mb-1 font-semibold">{t("demo")}:</p>
          {[["admin@habitta.test", "Admin"], ["valentina@habitta.test", "Agente"], ["cliente@habitta.test", "Cliente"]].map(([em, l]) => (
            <button key={em} type="button" onClick={() => setForm({ email: em, password: "Habitta123!" })} className="mr-2 underline hover:text-brand">{l}</button>
          ))}
          <span className="text-ink-muted">· contraseña Habitta123!</span>
        </div>
      )}
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", asAgent: false });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (form.password.length < 8) return setErrors({ password: [t("passwordMin")] });
    if (form.password !== form.confirm) return setErrors({ confirm: [t("passwordMismatch")] });
    setLoading(true);
    try {
      const { confirm, ...payload } = form;
      void confirm;
      await apiPost("/api/v1/auth/register", payload);
      const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (res?.error) throw new Error(t("invalid"));
      toast.success("¡Cuenta creada!");
      router.push("/cuenta");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={tc("name")} error={errors.name?.[0]} required><input className="input" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label={tc("email")} error={errors.email?.[0]} required><input type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label={tc("phone")} error={errors.phone?.[0]}><input className="input" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9 ()-]{7,20}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label={t("password")} error={errors.password?.[0]} hint={t("passwordMin")} required><input type="password" className="input" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
      <Field label={t("confirmPassword")} error={errors.confirm?.[0]} required><input type="password" className="input" required minLength={8} autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.asAgent} onChange={(e) => setForm({ ...form, asAgent: e.target.checked })} className="h-4 w-4 accent-brand" /> {t("asAgent")}</label>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : <UserPlus className="h-4 w-4" />} {t("register")}</button>
      <p className="text-center text-sm text-ink-soft">{t("haveAccount")} <Link href="/ingresar" className="font-semibold text-brand">{t("login")}</Link></p>
    </form>
  );
}
