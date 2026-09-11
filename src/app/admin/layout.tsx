import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { currentUser } from "@/server/auth/guards";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/admin");
  if (user.role !== "ADMIN") redirect("/cuenta");
  const [s, moderation, inquiries] = await Promise.all([getSettings(), db.property.count({ where: { moderation: "PENDING" } }), db.inquiry.count({ where: { status: "NEW" } })]);
  return <AdminShell siteName={s.site_name} pending={{ moderation, inquiries }}>{children}</AdminShell>;
}
