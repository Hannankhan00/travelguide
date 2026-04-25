import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // allowDangerousEmailAccountLinking intentionally omitted:
      // enabling it lets an attacker register a Google account with the
      // same email as an existing admin and gain instant admin access.
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hashToCheck = (user as any).hashedPassword;

        // No ADMIN_PASSWORD_HASH env fallback: every admin must have their
        // own hashed password in the database. A shared env password is a
        // single point of compromise across all deployments.
        if (!hashToCheck) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          hashToCheck,
        );
        if (!valid) return null;

        // Non-admin accounts must verify their email before they can sign in
        if (user.role !== "ADMIN" && !user.emailVerified) return null;

        return user;
      },
    }),
  ],
});
