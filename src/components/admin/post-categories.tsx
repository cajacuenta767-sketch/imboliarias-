"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tags, Trash2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { apiDelete, apiPost } from "@/lib/api";

export function PostCategoriesManager({ categories }: { categories: { id: string; name: string; slug: string; _count: { posts: number } }[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline py-2"><Tags className="h-4 w-4" /> Categorías</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Categorías del blog" size="sm">
        <div className="space-y-3 p-5">
          <form onSubmit={async (e) => { e.preventDefault(); try { await apiPost("/api/v1/post-categories", { name }); setName(""); toast.success("Categoría creada"); router.refresh(); } catch (err) { toast.error((err as Error).message); } }} className="flex gap-2">
            <input className="input" placeholder="Nueva categoría" aria-label="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} required /><button className="btn-primary" aria-label="Crear categoría"><Plus className="h-4 w-4" /></button>
          </form>
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm"><span>{c.name} <span className="text-ink-muted">({c._count.posts})</span></span><button onClick={async () => { if (!confirm("¿Eliminar categoría?")) return; try { await apiDelete(`/api/v1/post-categories/${c.id}`); toast.success("Categoría eliminada"); router.refresh(); } catch (err) { toast.error((err as Error).message); } }} className="rounded p-1 text-danger hover:bg-red-50" aria-label={`Eliminar ${c.name}`}><Trash2 className="h-4 w-4" /></button></li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
