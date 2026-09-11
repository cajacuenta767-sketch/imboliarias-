import { z } from "zod";
import { db } from "@/server/db";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { sendMail } from "@/server/lib/mailer";
import { getSettings } from "@/server/modules/settings/service";
import type { SessionUser } from "@/server/auth/guards";

export const inquiryInputSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().min(5).max(2000),
  propertyId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});
export const inquiryQuerySchema = paginationSchema.extend({ status: z.enum(INQUIRY_STATUSES).optional(), q: z.string().optional(), scope: z.enum(["admin", "mine"]).default("admin") });

export async function createInquiry(input: z.infer<typeof inquiryInputSchema>) {
  let ownerId: string | null = null;
  let subject = "Nuevo mensaje de contacto";
  let notifyTo: string | null = null;
  if (input.propertyId) {
    const p = await db.property.findUnique({ where: { id: input.propertyId }, include: { author: true } });
    if (p) {
      ownerId = p.authorId;
      subject = `Consulta sobre: ${p.title}`;
      notifyTo = p.author.email;
    }
  }
  const inquiry = await db.inquiry.create({ data: { ...input, ownerId } });
  const settings = await getSettings();
  const to = notifyTo ?? settings.contact_email;
  await sendMail({
    to,
    subject: `[${settings.site_name}] ${subject}`,
    text: `${input.name} (${input.email}${input.phone ? `, ${input.phone}` : ""}) escribió:\n\n${input.message}`,
    html: `<p><strong>${input.name}</strong> (${input.email}${input.phone ? `, ${input.phone}` : ""}) escribió:</p><p>${input.message}</p>`,
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
