import type { Metadata } from "next";
import { AgentCard } from "@/components/site/cards";
import { Pagination } from "@/components/ui/pagination";
import { agentQuerySchema, listAgents } from "@/server/modules/agents/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agentes" };

export default async function AgentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = agentQuerySchema.parse({ ...sp, perPage: "12" });
  const { items, meta } = await listAgents(q);
  return (
    <div className="container-x py-10">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">Equipo</p>
        <h1 className="section-title">Nuestros asesores</h1>
        <p className="mt-2 text-ink-soft">Conoce a las personas que te acompañarán en la compra, venta o alquiler de tu propiedad.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a) => <AgentCard key={a.id} a={a} />)}
      </div>
      <Pagination page={meta.page} totalPages={meta.totalPages} className="mt-10" />
    </div>
  );
}
