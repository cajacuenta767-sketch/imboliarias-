"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, Trash2, GripVertical, Star } from "lucide-react";
import { uploadFiles } from "@/lib/api";
import { SmartImage } from "@/components/ui/smart-image";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export type ImageItem = { url: string; alt?: string | null };

export function ImageUploader({ value, onChange, folder = "properties", max = 20 }: { value: ImageItem[]; onChange: (v: ImageItem[]) => void; folder?: string; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [url, setUrl] = useState("");

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    try {
      const r = await uploadFiles(Array.from(files).slice(0, max - value.length), folder);
      onChange([...value, ...r.data.map((m) => ({ url: m.url, alt: null }))]);
      toast.success(`${r.data.length} imagen(es) subida(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const addUrl = () => {
    if (!url.trim()) return;
    onChange([...value, { url: url.trim(), alt: null }]);
    setUrl("");
  };
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-muted/50 px-4 py-8 text-center transition hover:border-brand hover:bg-brand-soft/40"
      >
        {loading ? <Spinner className="h-6 w-6 text-brand" /> : <ImagePlus className="h-8 w-8 text-brand" />}
        <p className="mt-2 text-sm font-semibold">Arrastra fotos aquí o haz clic para subir</p>
        <p className="text-xs text-ink-muted">JPG, PNG o WEBP · máx. 15 MB · la primera será la portada</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>
      <div className="flex gap-2">
        <span className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="…o pega la URL de una imagen" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} />
        </span>
        <button type="button" onClick={addUrl} className="btn-outline">Agregar</button>
      </div>
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {value.map((im, i) => (
            <li
              key={`${im.url}-${i}`}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
              className={cn("group relative aspect-square overflow-hidden rounded-xl ring-2 ring-transparent", i === 0 && "ring-brand")}
            >
              <SmartImage src={im.url} alt="" className="h-full w-full" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 chip bg-brand text-white"><Star className="h-3 w-3" /> Portada</span>}
              <span className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100"><GripVertical className="h-3.5 w-3.5" /></span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute bottom-1.5 right-1.5 rounded-md bg-danger p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label="Quitar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SingleImageInput({ value, onChange, folder = "general", label = "Imagen" }: { value: string | null | undefined; onChange: (v: string | null) => void; folder?: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-line">{value && <SmartImage src={value} alt="" className="h-full w-full" />}</div>
      <div className="flex-1 space-y-1.5">
        <input className="input" placeholder={`URL de ${label.toLowerCase()}`} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />
        <div className="flex gap-2 text-xs">
          <button type="button" className="font-semibold text-brand hover:underline" onClick={() => ref.current?.click()}>{loading ? "Subiendo…" : "Subir archivo"}</button>
          {value && <button type="button" className="text-danger hover:underline" onClick={() => onChange(null)}>Quitar</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setLoading(true);
          try { const r = await uploadFiles([f], folder); onChange(r.data[0].url); } catch (err) { toast.error((err as Error).message); } finally { setLoading(false); }
        }} />
      </div>
    </div>
  );
}
