"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiPut } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";
import { SingleImageInput } from "@/components/shared/image-uploader";

type U = { name: string; email: string; phone?: string | null; avatarUrl?: string | null; role: string; agent?: { title?: string | null; agency?: string | null; bio?: string | null; whatsapp?: string | null; facebook?: string | null; instagram?: string | null; linkedin?: string | null; website?: string | null; cityId?: string | null; slug: string } | null };

export function ProfileForm({ user, cities }: { user: U; cities: { id: string; name: string }[] }) {
  const router = useRouter();
  const { update } = useSession();
  const [f, setF] = useState({ name: user.name, phone: user.phone ?? "", avatarUrl: user.avatarUrl ?? "", password: "" });
  const [a, setA] = useState({ title: user.agent?.title ?? "", agency: user.agent?.agency ?? "", bio: user.agent?.bio ?? "", whatsapp: user.agent?.whatsapp ?? "", facebook: user.agent?.facebook ?? "", instagram: user.agent?.instagram ?? "", linkedin: user.agent?.linkedin ?? "", website: user.agent?.website ?? "", cityId: user.agent?.cityId ?? "" });
  const [loading, setLoading] = useState(false);
  const isAgent = user.role === "AGENT" || user.role === "ADMIN";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPut("/api/v1/me", { ...f, avatarUrl: f.avatarUrl || null, agent: isAgent ? { ...a, cityId: a.cityId || null } : undefined });
      await update({ name: f.name, image: f.avatarUrl || null });
      toast.success("Perfil actualizado");
      router.refresh();
    } catch (err) { toast.error((err as Error).message); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h3 className="font-display font-bold">Datos de la cuenta</h3>
        <Field label="Foto de perfil"><SingleImageInput value={f.avatarUrl} onChange={(v) => setF({ ...f, avatarUrl: v ?? "" })} folder="avatars" label="Foto" /></Field>
        <Field label="Nombre" required><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Correo"><input className="input" value={user.email} disabled /></Field>
        <Field label="Teléfono"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Nueva contraseña" hint="Déjala vacía para no cambiarla."><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      </div>
      {isAgent && (
        <div className="card space-y-4 p-6">
          <h3 className="font-display font-bold">Perfil público de asesor</h3>
          {user.agent && <p className="text-xs text-ink-muted">Tu página: <a href={`/agentes/${user.agent.slug}`} className="text-brand hover:underline">/agentes/{user.agent.slug}</a></p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cargo"><input className="input" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="Asesora senior" /></Field>
            <Field label="Agencia"><input className="input" value={a.agency} onChange={(e) => setA({ ...a, agency: e.target.value })} /></Field>
          </div>
          <Field label="Ciudad"><select className="input cursor-pointer" value={a.cityId} onChange={(e) => setA({ ...a, cityId: e.target.value })}><option value="">—</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Biografía"><textarea className="input min-h-[100px]" value={a.bio} onChange={(e) => setA({ ...a, bio: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp" hint="Solo números con indicativo, ej. 573001234567"><input className="input" value={a.whatsapp} onChange={(e) => setA({ ...a, whatsapp: e.target.value })} /></Field>
            <Field label="Sitio web"><input className="input" value={a.website} onChange={(e) => setA({ ...a, website: e.target.value })} /></Field>
            <Field label="Instagram"><input className="input" value={a.instagram} onChange={(e) => setA({ ...a, instagram: e.target.value })} /></Field>
            <Field label="Facebook"><input className="input" value={a.facebook} onChange={(e) => setA({ ...a, facebook: e.target.value })} /></Field>
            <Field label="LinkedIn"><input className="input" value={a.linkedin} onChange={(e) => setA({ ...a, linkedin: e.target.value })} /></Field>
          </div>
        </div>
      )}
      <div className="lg:col-span-2"><button className="btn-primary" disabled={loading}>{loading ? <Spinner /> : <Save className="h-4 w-4" />} Guardar cambios</button></div>
    </form>
  );
}
