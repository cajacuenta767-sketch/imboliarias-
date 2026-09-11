"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiPost, uploadFiles } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";

export function ApplyForm({ careerId }: { careerId: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let resumeUrl: string | undefined;
      if (file) {
        if (file.size > 15 * 1024 * 1024) throw new Error("La hoja de vida supera 15 MB");
        // Si falla la subida se avisa y no se envía la postulación sin el archivo.
        const up = await uploadFiles([file], "resumes").catch((e: Error) => { throw new Error(`No se pudo subir la hoja de vida: ${e.message}`); });
        resumeUrl = up.data?.[0]?.url;
      }
      await apiPost("/api/v1/applications", { ...form, careerId, resumeUrl });
      setDone(true);
      toast.success("¡Postulación enviada!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  if (done) return <p className="rounded-2xl bg-brand-soft p-4 text-sm text-brand-strong">Recibimos tu postulación. Te contactaremos si tu perfil encaja.</p>;
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nombre completo" required><input className="input" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Correo" required><input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Teléfono"><input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Mensaje" hint="Cuéntanos por qué eres la persona indicada."><textarea className="input min-h-[90px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
      <Field label="Hoja de vida (PDF)" hint="Máximo 15 MB."><input type="file" accept="application/pdf" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
      <button type="submit" className="btn-primary w-full" disabled={loading} aria-busy={loading}>{loading ? <Spinner /> : <Send className="h-4 w-4" />} {loading ? "Enviando…" : "Enviar postulación"}</button>
    </form>
  );
}
