"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, ApiError } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Field, Spinner, EmptyState } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { SingleImageInput } from "@/components/shared/image-uploader";
import { cn } from "@/lib/utils";

export type FieldDef = {
  name: string; label: string; type?: "text" | "number" | "select" | "checkbox" | "textarea" | "image" | "date" | "password" | "email";
  options?: { value: string; label: string }[] | (() => Promise<{ value: string; label: string }[]>); required?: boolean; hint?: string; placeholder?: string; half?: boolean; default?: unknown;
};
export type ColDef<T> = { key: string; header: string; render?: (row: T) => React.ReactNode; className?: string };

type Row = { id: string } & Record<string, unknown>;

export function SimpleCrud<T extends Row>({ title, subtitle, endpoint, idKey = "id", fields, columns, canCreate = true, canEdit = true, canDelete = true, listQuery = "", createMethod = "POST", updateMethod = "PUT", extraActions }: {
  title: string; subtitle?: string; endpoint: string; idKey?: string; fields: FieldDef[]; columns: ColDef<T>[]; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; listQuery?: string; createMethod?: "POST" | "PUT"; updateMethod?: "PUT" | "PATCH"; extraActions?: (row: T, reload: () => void) => React.ReactNode;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [opts, setOpts] = useState<Record<string, { value: string; label: string }[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiGet<T[]>(`${endpoint}${listQuery}`);
      setRows(r.data ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, listQuery]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fields.forEach(async (f) => {
      if (typeof f.options === "function") setOpts((o) => ({ ...o, [f.name]: [] }));
      if (typeof f.options === "function") { const list = await f.options(); setOpts((o) => ({ ...o, [f.name]: list })); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    const base: Record<string, unknown> = {};
    fields.forEach((f) => { base[f.name] = f.default ?? (f.type === "checkbox" ? false : ""); });
    setEditing(base as Partial<T>);
    setErrors({});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => { const v = editing[f.name as keyof T]; if (f.type === "password" && !v) return; payload[f.name] = v === "" && f.type !== "text" && f.type !== "textarea" ? null : v; });
      const id = editing[idKey as keyof T] as string | undefined;
      if (id) await (updateMethod === "PATCH" ? apiPatch : apiPut)(`${endpoint}/${id}`, payload);
      else await (createMethod === "PUT" ? apiPut : apiPost)(endpoint, payload);
      toast.success("Guardado");
      setEditing(null);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: T) => {
    if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    try {
      await apiDelete(`${endpoint}/${row[idKey] as string}`);
      toast.success("Eliminado");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const renderField = (f: FieldDef) => {
    const v = editing?.[f.name as keyof T];
    const set = (val: unknown) => setEditing((e) => ({ ...(e as T), [f.name]: val }));
    const err = errors[f.name]?.[0];
    const options = typeof f.options === "function" ? opts[f.name] ?? [] : f.options ?? [];
    return (
      <Field key={f.name} label={f.type === "checkbox" ? undefined : f.label} error={err} hint={f.hint} required={f.required} className={cn(f.half ? "sm:col-span-1" : "sm:col-span-2")}>
        {f.type === "checkbox" ? (
          <Switch checked={!!v} onChange={set} label={f.label} />
        ) : f.type === "select" ? (
          <select className="input cursor-pointer" value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} required={f.required}>
            <option value="">— {f.placeholder ?? "Selecciona"} —</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : f.type === "textarea" ? (
          <textarea className="input min-h-[90px]" value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} />
        ) : f.type === "image" ? (
          <SingleImageInput value={v as string} onChange={set} label={f.label} />
        ) : (
          <input className="input" type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "password" ? "password" : f.type === "email" ? "email" : "text"} step={f.type === "number" ? "any" : undefined} value={f.type === "date" && v ? String(v).slice(0, 10) : ((v as string) ?? "")} onChange={(e) => set(e.target.value)} required={f.required && f.type !== "password"} placeholder={f.placeholder} />
        )}
      </Field>
    );
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline" title="Recargar"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
          {canCreate && <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Crear</button>}
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center p-10"><Spinner className="h-6 w-6 text-brand" /></div>
        ) : rows.length === 0 ? (
          <EmptyState title="Aún no hay registros" className="rounded-none border-0 shadow-none" action={canCreate ? <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Crear el primero</button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>{columns.map((c) => <th key={c.key} className={cn("px-4 py-3", c.className)}>{c.header}</th>)}<th className="px-4 py-3 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r[idKey] as string} className="hover:bg-muted/40">
                    {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>)}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {extraActions?.(r, load)}
                        {canEdit && <button onClick={() => { setEditing(r); setErrors({}); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-muted hover:text-ink" title="Editar"><Pencil className="h-4 w-4" /></button>}
                        {canDelete && <button onClick={() => remove(r)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-danger hover:bg-red-50" title="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.[idKey as keyof T] ? `Editar ${title.toLowerCase()}` : `Nuevo registro`} size="md">
        {editing && (
          <form onSubmit={save} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving && <Spinner />} Guardar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
