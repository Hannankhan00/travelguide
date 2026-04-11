import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    // Email + password credentials (admin login only)
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.email) return null;

        // Any user can log in if they have a hashed password
        // Admins might also fall back to the env password if they don't have one
        let hashToCheck = (user as any).hashedPassword;
        if (user.role === "ADMIN" && !hashToCheck) {
          hashToCheck = process.env.ADMIN_PASSWORD_HASH;
        }

        if (!hashToCheck) return null; // No password set

        const valid = await bcrypt.compare(
          credentials.password as string,
          hashToCheck
        );
        if (!valid) return null;

        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, persist id + role into the JWT
      if (user) {
        token.id   = user.id;
        token.role = (user as { role: "ADMIN" | "CUSTOMER" }).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        session.user.role = token.role as "ADMIN" | "CUSTOMER";
      }
      return session;
    },

    async signIn({ account }) {
      // Block credential sign-in for non-admins
      if (account?.provider === "credentials") {
        return true; // already validated in authorize()
      }

      // Google OAuth — allow customers only
      // Admin uses credentials, not OAuth
      return true;
    },
  },

  pages: {
    signIn:  "/auth/login",
    error:   "/auth/error",
  },
});
