"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, MessageCircle, Phone } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { Stars } from "@/components/ui/stars";
import { Field, Spinner } from "@/components/ui/misc";

export function InquiryForm({ propertyId, projectId, defaultMessage, whatsapp, phone, compact }: { propertyId?: string; projectId?: string; defaultMessage?: string; whatsapp?: string | null; phone?: string | null; compact?: boolean }) {
  const t = useTranslations("property");
  const tc = useTranslations("common");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: defaultMessage ?? "", website: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await apiPost("/api/v1/inquiries", { ...form, propertyId, projectId });
      setDone(true);
      toast.success(t("inquirySent"));
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-brand-soft p-5 text-center text-sm text-brand-strong">
        <Send className="mx-auto mb-2 h-6 w-6" />
        {t("inquirySent")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Honeypot: invisible para personas; si un bot lo rellena, el servidor rechaza el envío. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      <Field error={errors.name?.[0]}>
        <input className="input" placeholder={tc("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <Field error={errors.email?.[0]}>
          <input type="email" className="input" placeholder={tc("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field error={errors.phone?.[0]}>
          <input className="input" placeholder={tc("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
      </div>
      <Field error={errors.message?.[0]}>
        <textarea className="input min-h-[110px]" placeholder={tc("message")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      </Field>
      <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full">
        {loading ? <Spinner /> : <Send className="h-4 w-4" />} {loading ? tc("sending") : t("requestVisit")}
      </button>
      {(whatsapp || phone) && (
        <div className="grid grid-cols-2 gap-2">
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(defaultMessage ?? "")}`} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="btn-outline"><Phone className="h-4 w-4" /> {t("call")}</a>
          )}
        </div>
      )}
    </form>
  );
}

export function ReviewForm({ propertyId }: { propertyId: string }) {
  const t = useTranslations("property");
  const tc = useTranslations("common");
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/v1/reviews", { propertyId, rating, authorName, comment });
      setDone(true);
      toast.success(t("reviewSent"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  if (done) return <p className="rounded-2xl bg-brand-soft p-4 text-sm text-brand-strong">{t("reviewSent")}</p>;
  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h4 className="font-display font-bold">{t("writeReview")}</h4>
      <Field label={t("rating")}>
        <Stars value={rating} onChange={setRating} size="md" />
      </Field>
      <input className="input" placeholder={t("yourName")} value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
      <textarea className="input min-h-[90px]" placeholder={t("yourComment")} value={comment} onChange={(e) => setComment(e.target.value)} required />
      <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>{loading ? <Spinner /> : null} {loading ? tc("sending") : t("writeReview")}</button>
    </form>
  );
}

