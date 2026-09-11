import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/cards";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/misc";
import { listProjects, projectQuerySchema } from "@/server/modules/projects/service";
import { cityOptions } from "@/server/modules/locations/service";
import { parseSearchParams } from "@/server/lib/query";
import { ProjectFilters } from "@/components/site/project-filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proyectos" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = parseSearchParams(projectQuerySchema, sp, { perPage: "9" });
  const [{ items, meta }, cities] = await Promise.all([listProjects(q), cityOptions()]);
  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">Obra nueva</p>
          <h1 className="section-title">Proyectos inmobiliarios</h1>
          <p className="mt-2 text-ink-soft">Nuevos desarrollos con precios de lanzamiento y financiación directa.</p>
        </div>
        <ProjectFilters cities={cities} />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No hay proyectos con esos filtros" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} className="mt-10" />
    </div>
  );
}
