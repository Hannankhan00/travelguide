import type { NextAuthConfig } from "next-auth"

// Edge-compatible config — no Prisma, no Node-only imports.
// Used by middleware.ts for JWT validation at the Edge.
// auth.ts imports this and adds the Prisma adapter + providers.
export const authConfig = {
  session: { strategy: "jwt" as const },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role: "ADMIN" | "CUSTOMER" }).role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string
        session.user.role = token.role as "ADMIN" | "CUSTOMER"
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },

  providers: [],
} satisfies NextAuthConfig
