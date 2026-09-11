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
        const up = await uploadFiles([file], "resumes").catch(() => null);
        resumeUrl = up?.data?.[0]?.url;
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
      <input className="input" placeholder="Nombre completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="input" type="email" placeholder="Correo" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <textarea className="input min-h-[90px]" placeholder="Cuéntanos por qué eres la persona indicada" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <Field label="Hoja de vida (PDF)"><input type="file" accept="application/pdf" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
      <button className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : <Send className="h-4 w-4" />} Enviar postulación</button>
    </form>
  );
}
