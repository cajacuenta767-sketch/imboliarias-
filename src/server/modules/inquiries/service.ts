import { z } from "zod";
import { db } from "@/server/db";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { sendMail } from "@/server/lib/mailer";
import { getSettings } from "@/server/modules/settings/service";
import type { SessionUser } from "@/server/auth/guards";

export const inquiryInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().min(5).max(2000),
  propertyId: z.string().max(64).optional().nullable(),
  projectId: z.string().max(64).optional().nullable(),
  // Honeypot anti-spam: los bots lo rellenan, las personas no lo ven.
  website: z.string().max(0).optional(),
});

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
export const inquiryQuerySchema = paginationSchema.extend({ status: z.enum(INQUIRY_STATUSES).optional(), q: z.string().optional(), scope: z.enum(["admin", "mine"]).default("admin") });

export async function createInquiry(raw: z.infer<typeof inquiryInputSchema>) {
  const { website, ...input } = raw;
  void website;
  let ownerId: string | null = null;
  let subject = "Nuevo mensaje de contacto";
  let notifyTo: string | null = null;
  let propertyId: string | null = null;
  let projectId: string | null = null;
  if (input.propertyId) {
    const p = await db.property.findUnique({ where: { id: input.propertyId }, include: { author: { select: { email: true } }, agent: { select: { user: { select: { email: true } } } } } });
    if (p) {
      propertyId = p.id;
      ownerId = p.authorId;
      subject = `Consulta sobre: ${oneLine(p.title)}`;
      notifyTo = p.agent?.user.email ?? p.author.email;
    }
  } else if (input.projectId) {
    const pr = await db.project.findUnique({ where: { id: input.projectId }, select: { id: true, name: true } });
    if (pr) {
      projectId = pr.id;
      subject = `Consulta sobre el proyecto: ${oneLine(pr.name)}`;
    }
  }
  const inquiry = await db.inquiry.create({ data: { name: input.name, email: input.email, phone: input.phone ?? null, message: input.message, propertyId, projectId, ownerId } });
  const settings = await getSettings();
  const to = notifyTo ?? settings.contact_email;
  const contact = `${input.email}${input.phone ? `, ${input.phone}` : ""}`;
  await sendMail({
    to,
    subject: `[${oneLine(settings.site_name)}] ${subject}`,
    text: `${input.name} (${contact}) escribió:\n\n${input.message}`,
    html: `<p><strong>${escapeHtml(input.name)}</strong> (${escapeHtml(contact)}) escribió:</p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
  }).catch(() => undefined);
  return inquiry;
}

export async function listInquiries(q: z.infer<typeof inquiryQuerySchema>, user: SessionUser) {
  const where = {
    ...(q.scope === "mine" || user.role !== "ADMIN" ? { ownerId: user.id } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.q ? { OR: [{ name: { contains: q.q } }, { email: { contains: q.q } }, { message: { contains: q.q } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.inquiry.findMany({ where, include: { property: { select: { title: true, slug: true } }, project: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.inquiry.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export const updateInquiryStatus = (id: string, status: string) => db.inquiry.update({ where: { id }, data: { status } });
export const deleteInquiry = (id: string) => db.inquiry.delete({ where: { id } });
export const countNewInquiries = (ownerId?: string) => db.inquiry.count({ where: { status: "NEW", ...(ownerId ? { ownerId } : {}) } });
