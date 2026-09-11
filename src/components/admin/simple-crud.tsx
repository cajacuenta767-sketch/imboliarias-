"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
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

type Meta = { page: number; perPage: number; total: number; totalPages: number };

export function SimpleCrud<T extends Row>({ title, subtitle, endpoint, idKey = "id", fields, columns, canCreate = true, canEdit = true, canDelete = true, listQuery = "", createMethod = "POST", updateMethod = "PUT", extraActions, paginated, searchPlaceholder }: {
  title: string; subtitle?: string; endpoint: string; idKey?: string; fields: FieldDef[]; columns: ColDef<T>[]; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; listQuery?: string; createMethod?: "POST" | "PUT"; updateMethod?: "PUT" | "PATCH"; extraActions?: (row: T, reload: () => void) => React.ReactNode;
  /** Para colecciones grandes cuya API pagina (usuarios): página y búsqueda viven en la URL. */
  paginated?: boolean; searchPlaceholder?: string;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = paginated ? Math.max(1, Number(sp.get("page") ?? 1) || 1) : 1;
  const qParam = paginated ? (sp.get("q") ?? "") : "";
  const [q, setQ] = useState(qParam);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [opts, setOpts] = useState<Record<string, { value: string; label: string }[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const extra = paginated ? `${listQuery ? "&" : "?"}perPage=30&page=${page}${qParam ? `&q=${encodeURIComponent(qParam)}` : ""}` : "";
      const r = await apiGet<T[]>(`${endpoint}${listQuery}${extra}`);
      setRows(r.data ?? []);
      setMeta(r.meta ?? null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, listQuery, paginated, page, qParam]);
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); if (k !== "page") n.delete("page"); router.push(`${pathname}?${n.toString()}`); };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fields.forEach(async (f) => {
      if (typeof f.options === "function") setOpts((o) => ({ ...o, [f.name]: [] }));
      if (typeof f.options === "function") { const list = await f.options(); setOpts((o) => ({ ...o, [f.name]: list })); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normaliza la fila contra los campos definidos para que ningún input arranque como no controlado.
  const openEdit = (r: T) => {
    const base: Record<string, unknown> = { ...r };
    fields.forEach((f) => { if (base[f.name] === undefined || base[f.name] === null) base[f.name] = f.type === "checkbox" ? false : ""; });
    setEditing(base as Partial<T>);
    setErrors({});
  };
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
      else toast.error((err as Error).message);
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
        <div className="flex flex-wrap gap-2">
          {paginated && (
            <form onSubmit={(e) => { e.preventDefault(); setParam("q", q.trim()); }} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input type="search" className="input w-56 pl-9" placeholder={searchPlaceholder ?? "Buscar…"} aria-label={searchPlaceholder ?? "Buscar"} value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
          )}
          <button onClick={load} className="btn-outline" title="Recargar" aria-label="Recargar"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
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
                        {canEdit && <button onClick={() => { openEdit(r); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-muted hover:text-ink" title="Editar" aria-label="Editar"><Pencil className="h-4 w-4" /></button>}
                        {canDelete && <button onClick={() => remove(r)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-danger hover:bg-red-50" title="Eliminar" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
            <span>{meta.total} registros</span>
            <Pagination page={meta.page} totalPages={meta.totalPages} />
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
