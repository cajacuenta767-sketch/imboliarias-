import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/shell";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { currentUser } from "@/server/auth/guards";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta");
  const u = await db.user.findUnique({ where: { id: user.id }, select: { credits: true, role: true } });
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70vh] bg-muted/40">
        <AccountShell credits={u?.credits ?? 0} role={u?.role ?? "CUSTOMER"}>{children}</AccountShell>
      </main>
      <SiteFooter />
    </>
  );
}
