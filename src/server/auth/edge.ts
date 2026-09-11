import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

/** Configuración sin acceso a base de datos para el middleware (Edge runtime). */
export const edgeAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/ingresar" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { auth: edgeAuth } = NextAuth(edgeAuthConfig);
