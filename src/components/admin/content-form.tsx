"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, LogOut } from "lucide-react";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/shared/rich-editor").then((m) => m.RichEditor), { ssr: false, loading: () => <div className="input min-h-[220px] animate-pulse" /> });
import { SingleImageInput } from "@/components/shared/image-uploader";

export type ContentField = { key: string; label: string; type?: "text" | "textarea" | "number" | "select" | "boolean" | "image" | "date" | "rich"; options?: { value: string; label: string }[]; hint?: string; required?: boolean; side?: boolean; half?: boolean };

export function ContentForm({ endpoint, id, initial, fields, backHref, title }: { endpoint: string; id?: string; initial: Record<string, unknown>; fields: ContentField[]; backHref: string; title?: string }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));
  const submit = async (exit: boolean) => {
    setSaving(true); setErrors({});
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => { const val = v[f.key]; payload[f.key] = val === "" && (f.type === "number" || f.type === "date" || f.type === "select") ? null : val; });
      if (id) await apiPut(`${endpoint}/${id}`, payload); else await apiPost(endpoint, payload);
      toast.success("Guardado");
      if (exit || !id) router.push(backHref);
      router.refresh();
    } catch (e) { if (e instanceof ApiError && e.details) setErrors(e.details); toast.error((e as Error).message); } finally { setSaving(false); }
  };
  const render = (f: ContentField) => {
    const val = v[f.key];
    return (
      <Field key={f.key} label={f.type === "boolean" ? undefined : f.label} error={errors[f.key]?.[0]} hint={f.hint} required={f.required} className={f.half ? "" : "sm:col-span-2"}>
        {f.type === "rich" ? <RichEditor value={(val as string) ?? ""} onChange={(h) => set(f.key, h)} />
          : f.type === "textarea" ? <textarea className="input min-h-[90px]" value={(val as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} />
          : f.type === "select" ? <select className="input cursor-pointer" value={(val as string) ?? ""} onChange={(e) => set(f.key, e.target.value)}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          : f.type === "boolean" ? <Switch checked={!!val} onChange={(b) => set(f.key, b)} label={f.label} />
          : f.type === "image" ? <SingleImageInput value={val as string} onChange={(u) => set(f.key, u)} folder="content" label={f.label} />
          : <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} className={`input ${f.key === "title" || f.key === "name" ? "text-base font-semibold" : ""}`} value={f.type === "date" && val ? String(val).slice(0, 10) : ((val as string) ?? "")} onChange={(e) => set(f.key, e.target.value)} />}
      </Field>
    );
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card grid gap-4 p-5 sm:grid-cols-2">{fields.filter((f) => !f.side).map(render)}</div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-2 p-5">
          <h3 className="font-display font-bold">{title ?? "Publicar"}</h3>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Spinner /> : <Save className="h-4 w-4" />} Guardar</button>
          <button type="button" disabled={saving} onClick={() => submit(true)} className="btn-outline w-full"><LogOut className="h-4 w-4" /> Guardar y salir</button>
        </div>
        {fields.some((f) => f.side) && <div className="card grid gap-4 p-5">{fields.filter((f) => f.side).map((f) => render({ ...f, half: false }))}</div>}
      </aside>
    </form>
  );
}
