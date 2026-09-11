import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword } from "./password";
import { checkRateLimit, clientIp, isRateLimited } from "@/server/lib/rate-limit";

// Hash de relleno para que un correo inexistente tarde lo mismo que una contraseña incorrecta.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8i0mZ3eJZ7yq5Q0Qx6q5pVh1fZ5eKe";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/ingresar" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Contraseña", type: "password" } },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        const ip = clientIp(request);
        // Solo cuentan los intentos fallidos: un inicio correcto no acerca al bloqueo.
        if (isRateLimited(`login:${ip}`, 20, 15 * 60_000) || isRateLimited(`login:${email}`, 10, 15 * 60_000)) return null;
        const user = await db.user.findUnique({ where: { email } });
        const okPass = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.isActive || !okPass) {
          checkRateLimit(`login:${ip}`, 20, 15 * 60_000);
          checkRateLimit(`login:${email}`, 10, 15 * 60_000);
          return null;
        }
        return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.checkedAt = Date.now();
      }
      // Cada pocos minutos se relee el rol y el estado de la cuenta, para que una
      // desactivación o un cambio de rol no espere a que caduque la sesión.
      const checkedAt = (token.checkedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - checkedAt > 5 * 60_000) {
        const fresh = await db.user.findUnique({ where: { id: token.id as string }, select: { role: true, isActive: true, name: true, avatarUrl: true } });
        if (!fresh || !fresh.isActive) return null;
        token.role = fresh.role;
        token.name = fresh.name;
        token.picture = fresh.avatarUrl;
        token.checkedAt = Date.now();
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
