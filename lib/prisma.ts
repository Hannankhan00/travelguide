import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Keep connection pool small on shared Hostinger hosting to avoid exhausting
// the MySQL max_connections limit (typically 100 on shared plans).
const poolParams =
  process.env.NODE_ENV === "production"
    ? "connection_limit=3&pool_timeout=20"
    : "connection_limit=10&pool_timeout=30";

const DATABASE_URL = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.includes("connection_limit")
    ? process.env.DATABASE_URL
    : `${process.env.DATABASE_URL}?${poolParams}`
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
