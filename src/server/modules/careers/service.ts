import { z } from "zod";
import { db } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { uniqueSlug } from "@/server/lib/slug";
import { CAREER_STATUSES, CAREER_TYPES } from "@/lib/constants";
import { optionalDate } from "@/server/lib/query";
import { cleanHtml, cleanText } from "@/server/lib/sanitize";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";

export const careerSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  type: z.enum(CAREER_TYPES).default("FULL_TIME"),
  salary: z.string().optional().nullable(),
  deadline: optionalDate(),
  status: z.enum(CAREER_STATUSES).default("OPEN"),
});
export const applicationSchema = z.object({
  careerId: z.string().max(64),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  resumeUrl: z.string().max(500).refine((v) => v.startsWith("/uploads/") || /^https?:\/\//.test(v), "URL inválida").optional().nullable(),
});
export const applicationQuerySchema = paginationSchema.extend({ careerId: z.string().optional(), status: z.string().optional() });

export const listCareers = (onlyOpen = false) => db.career.findMany({ where: onlyOpen ? { status: "OPEN" } : {}, orderBy: { createdAt: "desc" }, include: { _count: { select: { applications: true } } } });
export async function getCareerBySlug(slug: string, includeClosed = false) {
  const c = await db.career.findUnique({ where: { slug } });
  if (!c || (!includeClosed && c.status !== "OPEN")) throw notFound("Vacante no encontrada");
  return c;
}
export async function getCareerById(id: string) {
  const c = await db.career.findUnique({ where: { id } });
  if (!c) throw notFound();
  return c;
}
export async function createCareer(input: z.infer<typeof careerSchema>) {
  const slug = await uniqueSlug(input.title, async (s) => !!(await db.career.findUnique({ where: { slug: s } })));
  return db.career.create({ data: { ...input, description: cleanText(input.description), content: cleanHtml(input.content), slug } });
}
export const updateCareer = (id: string, input: z.infer<typeof careerSchema>) => db.career.update({ where: { id }, data: { ...input, description: cleanText(input.description), content: cleanHtml(input.content) } });
export const deleteCareer = (id: string) => db.career.delete({ where: { id } });

export async function applyToCareer(input: z.infer<typeof applicationSchema>) {
  const career = await db.career.findUnique({ where: { id: input.careerId }, select: { status: true, deadline: true } });
  if (!career || career.status !== "OPEN" || (career.deadline && career.deadline < new Date())) throw badRequest("La vacante ya no recibe postulaciones");
  return db.careerApplication.create({ data: input });
}
export async function listApplications(q: z.infer<typeof applicationQuerySchema>) {
  const where = { ...(q.careerId ? { careerId: q.careerId } : {}), ...(q.status ? { status: q.status } : {}) };
  const [items, total] = await Promise.all([
    db.careerApplication.findMany({ where, include: { career: { select: { title: true } } }, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.careerApplication.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}
export const updateApplicationStatus = (id: string, status: string) => db.careerApplication.update({ where: { id }, data: { status } });
