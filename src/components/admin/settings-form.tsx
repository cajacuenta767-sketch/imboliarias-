"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiPut } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { SingleImageInput } from "@/components/shared/image-uploader";

export type SettingField = { key: string; label: string; type?: "text" | "textarea" | "number" | "color" | "image" | "boolean" | "select"; hint?: string; options?: { value: string; label: string }[]; half?: boolean };
export type SettingSection = { title: string; description?: string; fields: SettingField[] };

export function SettingsForm({ sections, values }: { sections: SettingSection[]; values: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState(values);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const keys = sections.flatMap((s) => s.fields.map((f) => f.key));
      await apiPut("/api/v1/settings", Object.fromEntries(keys.map((k) => [k, v[k] ?? ""])));
      toast.success("Configuración guardada"); router.refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-6">
      {sections.map((s) => (
        <div key={s.title} className="card grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
          <div><h3 className="font-display font-bold">{s.title}</h3>{s.description && <p className="mt-1 text-sm text-ink-soft">{s.description}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.fields.map((f) => (
              <Field key={f.key} label={f.type === "boolean" ? undefined : f.label} hint={f.hint} className={f.half ? "" : "sm:col-span-2"}>
                {f.type === "textarea" ? <textarea className="input min-h-[90px]" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
                  : f.type === "color" ? <div className="flex items-center gap-2"><input type="color" value={v[f.key] ?? "#000000"} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-line" /><input className="input" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /></div>
                  : f.type === "image" ? <SingleImageInput value={v[f.key]} onChange={(val) => setV({ ...v, [f.key]: val ?? "" })} folder="site" label={f.label} />
                  : f.type === "boolean" ? <Switch checked={v[f.key] === "true"} onChange={(b) => setV({ ...v, [f.key]: b ? "true" : "false" })} label={f.label} />
                  : f.type === "select" ? <select className="input cursor-pointer" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  : <input type={f.type === "number" ? "number" : "text"} className="input" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
              </Field>
            ))}
          </div>
        </div>
      ))}
      <div className="sticky bottom-4 flex justify-end"><button className="btn-primary shadow-float" disabled={saving}>{saving ? <Spinner /> : <Save className="h-4 w-4" />} Guardar cambios</button></div>
    </form>
  );
}
