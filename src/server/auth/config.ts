import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword } from "./password";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/ingresar" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Contraseña", type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user || !user.isActive) return null;
        const okPass = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!okPass) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
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
