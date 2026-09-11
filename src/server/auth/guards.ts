import { auth } from "./index";
import { forbidden, unauthorized } from "@/server/errors";
import type { Role } from "@/lib/constants";

export type SessionUser = { id: string; name?: string | null; email?: string | null; role: string; image?: string | null };

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) throw forbidden();
  return user;
}

export const requireAdmin = () => requireRole("ADMIN");
export const isAdmin = (u: SessionUser | null) => u?.role === "ADMIN";
