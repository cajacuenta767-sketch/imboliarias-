"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Copy, FileText, Film, RefreshCw } from "lucide-react";
import { apiDelete, apiGet, uploadFiles } from "@/lib/api";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Media = { id: string; url: string; name: string; mimeType: string; size: number; folder: string; createdAt: string };
const FOLDERS = ["general", "properties", "projects", "avatars", "content", "site", "resumes"];

export function MediaLibrary() {
  const sp = useSearchParams();
  const page = Number(sp.get("page") ?? 1);
  const [items, setItems] = useState<Media[]>([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 24, total: 0, totalPages: 1 });
  const router = useRouter();
  const pathname = usePathname();
  const folder = sp.get("folder") ?? "";
  // La carpeta vive en la URL para que la paginación y el filtro no se desincronicen.
  const setFolder = (f: string) => { const n = new URLSearchParams(sp.toString()); if (f) n.set("folder", f); else n.delete("folder"); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiGet<Media[]>(`/api/v1/media?perPage=24&page=${page}${folder ? `&folder=${folder}` : ""}`); setItems(r.data); if (r.meta) setMeta(r.meta); } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, [page, folder]);
  useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try { await uploadFiles(Array.from(files), folder || "general"); toast.success("Archivos subidos"); load(); } catch (e) { toast.error((e as Error).message); } finally { setUploading(false); }
  };
  const fmt = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFolder("")} className={cn("chip border", !folder ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated")}>Todas</button>
          {FOLDERS.map((f) => <button key={f} onClick={() => setFolder(f)} className={cn("chip border capitalize", folder === f ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated")}>{f}</button>)}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline" aria-label="Actualizar" title="Actualizar"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
          <input ref={ref} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
          <button onClick={() => ref.current?.click()} className="btn-primary" disabled={uploading}>{uploading ? <Spinner /> : <Upload className="h-4 w-4" />} Subir archivos</button>
        </div>
      </div>
      {loading && items.length === 0 ? <div className="flex justify-center p-10"><Spinner className="h-6 w-6 text-brand" /></div> : items.length === 0 ? (
        <EmptyState title="La biblioteca está vacía" text="Sube imágenes para usarlas en propiedades, proyectos o el sitio." action={<button onClick={() => ref.current?.click()} className="btn-primary"><Upload className="h-4 w-4" /> Subir</button>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="card group relative overflow-hidden">
              <div className="flex aspect-square items-center justify-center bg-muted">
                {m.mimeType.startsWith("image/") ? <SmartImage src={m.url} alt={m.name} className="h-full w-full" /> : m.mimeType.startsWith("video/") ? <Film className="h-8 w-8 text-ink-muted" /> : <FileText className="h-8 w-8 text-ink-muted" />}
              </div>
              <div className="p-2"><p className="truncate text-xs font-semibold" title={m.name}>{m.name}</p><p className="text-[10px] text-ink-muted">{fmt(m.size)} · {m.folder}</p></div>
              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + m.url); toast.success("URL copiada"); }} className="rounded-md bg-white/90 p-1.5 shadow hover:text-brand" title="Copiar URL" aria-label={`Copiar URL de ${m.name}`}><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={async () => { if (!confirm("¿Eliminar archivo?")) return; try { await apiDelete(`/api/v1/media/${m.id}`); toast.success("Archivo eliminado"); load(); } catch (e) { toast.error((e as Error).message); } }} className="rounded-md bg-white/90 p-1.5 text-danger shadow" title="Eliminar" aria-label={`Eliminar ${m.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
