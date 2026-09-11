import { db } from "@/server/db";

export async function adminStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [properties, pendingModeration, forSale, forRent, users, agents, inquiriesNew, invoicesPaid, revenue, projects, viewsAgg, reviewsPending] = await Promise.all([
    db.property.count(),
    db.property.count({ where: { moderation: "PENDING" } }),
    db.property.count({ where: { type: "SALE", moderation: "APPROVED", status: "AVAILABLE" } }),
    db.property.count({ where: { type: "RENT", moderation: "APPROVED", status: "AVAILABLE" } }),
    db.user.count(),
    db.agent.count(),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.invoice.count({ where: { status: "PAID", paidAt: { gte: monthStart } } }),
    db.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    db.project.count(),
    db.property.aggregate({ _sum: { views: true } }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);

  // Serie de últimos 6 meses: propiedades creadas y consultas
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: start.toLocaleDateString("es-CO", { month: "short" }), start, end });
  }
  const series = await Promise.all(
    months.map(async (m) => {
      const [propiedades, consultas, ingresos] = await Promise.all([
        db.property.count({ where: { createdAt: { gte: m.start, lt: m.end } } }),
        db.inquiry.count({ where: { createdAt: { gte: m.start, lt: m.end } } }),
        db.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: m.start, lt: m.end } }, _sum: { total: true } }),
      ]);
      return { month: m.label, propiedades, consultas, ingresos: ingresos._sum.total ?? 0 };
    }),
  );

  const byCity = await db.city.findMany({ select: { name: true, _count: { select: { properties: true } } }, orderBy: { properties: { _count: "desc" } }, take: 6 });
  const recentProperties = await db.property.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { city: true, images: { take: 1, orderBy: { order: "asc" } }, author: { select: { name: true } } } });
  const recentInquiries = await db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { property: { select: { title: true } } } });

  return {
    kpis: { properties, pendingModeration, forSale, forRent, users, agents, inquiriesNew, invoicesPaid, revenue: revenue._sum.total ?? 0, projects, views: viewsAgg._sum.views ?? 0, reviewsPending },
    series,
    byCity: byCity.map((c) => ({ city: c.name, total: c._count.properties })),
    recentProperties,
    recentInquiries,
  };
}

export async function accountStats(userId: string) {
  const [user, total, approved, pending, views, inquiries, wishlist, invoices] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    db.property.count({ where: { authorId: userId } }),
    db.property.count({ where: { authorId: userId, moderation: "APPROVED" } }),
    db.property.count({ where: { authorId: userId, moderation: "PENDING" } }),
    db.property.aggregate({ where: { authorId: userId }, _sum: { views: true } }),
    db.inquiry.count({ where: { ownerId: userId, status: "NEW" } }),
    db.wishlist.count({ where: { userId } }),
    db.invoice.count({ where: { userId } }),
  ]);
  return { credits: user?.credits ?? 0, total, approved, pending, views: views._sum.views ?? 0, inquiries, wishlist, invoices };
}
