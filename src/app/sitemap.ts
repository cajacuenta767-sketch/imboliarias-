import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { publicWhere } from "@/server/modules/properties/service";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, projects, posts, agents, careers, pages] = await Promise.all([
    db.property.findMany({ where: publicWhere(), select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5000 }),
    db.project.findMany({ select: { slug: true, updatedAt: true } }),
    db.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.agent.findMany({ where: { user: { isActive: true } }, select: { slug: true, updatedAt: true } }),
    db.career.findMany({ where: { status: "OPEN" }, select: { slug: true, createdAt: true } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);
  const url = (path: string) => `${SITE_URL}${path}`;
  const statics: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/propiedades"), changeFrequency: "hourly", priority: 0.9 },
    { url: url("/propiedades?type=SALE"), changeFrequency: "hourly", priority: 0.8 },
    { url: url("/propiedades?type=RENT"), changeFrequency: "hourly", priority: 0.8 },
    { url: url("/proyectos"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/agentes"), changeFrequency: "weekly", priority: 0.5 },
    { url: url("/noticias"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/empleos"), changeFrequency: "weekly", priority: 0.4 },
    { url: url("/contacto"), changeFrequency: "yearly", priority: 0.3 },
  ];
  return [
    ...statics,
    ...properties.map((p) => ({ url: url(`/propiedades/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: url(`/proyectos/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...posts.map((p) => ({ url: url(`/noticias/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...agents.map((a) => ({ url: url(`/agentes/${a.slug}`), lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...careers.map((c) => ({ url: url(`/empleos/${c.slug}`), lastModified: c.createdAt, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...pages.map((p) => ({ url: url(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
