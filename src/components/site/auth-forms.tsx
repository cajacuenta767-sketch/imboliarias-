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
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const next = sp.get("next") ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      toast.error(t("invalid"));
      return;
    }
    router.push(next || "/cuenta");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></Field>
      <Field label={t("password")}><input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></Field>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : <LogIn className="h-4 w-4" />} {t("login")}</button>
      <p className="text-center text-sm text-ink-soft">{t("noAccount")} <Link href="/registro" className="font-semibold text-brand">{t("register")}</Link></p>
      <div className="rounded-xl bg-muted p-3 text-xs text-ink-soft">
        <p className="mb-1 font-semibold">{t("demo")}:</p>
        {[["admin@habitta.test", "Admin"], ["valentina@habitta.test", "Agente"], ["cliente@habitta.test", "Cliente"]].map(([em, l]) => (
          <button key={em} type="button" onClick={() => setForm({ email: em, password: "Habitta123!" })} className="mr-2 underline hover:text-brand">{l}</button>
        ))}
        <span className="text-ink-muted">· contraseña Habitta123!</span>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", asAgent: true });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await apiPost("/api/v1/auth/register", form);
      const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (res?.error) throw new Error(t("invalid"));
      toast.success("¡Cuenta creada!");
      router.push("/cuenta");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre" error={errors.name?.[0]}><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email" error={errors.email?.[0]}><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Teléfono"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label={t("password")} error={errors.password?.[0]}><input type="password" className="input" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.asAgent} onChange={(e) => setForm({ ...form, asAgent: e.target.checked })} className="h-4 w-4 accent-brand" /> {t("asAgent")}</label>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : <UserPlus className="h-4 w-4" />} {t("register")}</button>
      <p className="text-center text-sm text-ink-soft">{t("haveAccount")} <Link href="/ingresar" className="font-semibold text-brand">{t("login")}</Link></p>
    </form>
  );
}
