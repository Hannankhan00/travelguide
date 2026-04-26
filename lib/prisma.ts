import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ── Connection pool tuning ────────────────────────────────────────────────────
//
// connection_limit — MySQL connections allocated to this process's pool.
//
//   Why 10 on production:
//   • The admin analytics page issues 8 concurrent queries via Promise.all.
//     With limit=3, 5 of those 8 queue immediately, holding the pool hostage
//     for any other concurrent request. With limit=10 all 8 run in parallel
//     and complete in one round-trip without blocking anyone.
//   • Hostinger shared MySQL allows ~25 connections per database user.
//     Next.js runs as a single Node.js process on shared hosting, so
//     limit=10 leaves 15 spare for other tooling / admin connections.
//   • If you move to a plan with a tighter MySQL quota, lower this via
//     the DATABASE_POOL_LIMIT env var rather than editing code.
//
// pool_timeout — seconds a query waits for a free connection before throwing.
//
//   5 seconds is deliberately short: a queued request occupies a Hostinger
//   worker slot. A fast failure lets the worker drain and respond with a
//   user-visible error rather than silently piling up. With limit=10 the
//   pool is rarely saturated under normal load, so this timeout almost
//   never fires in practice.
//
// Override either value per-environment via env vars without a redeploy:
//   DATABASE_POOL_LIMIT=15   DATABASE_POOL_TIMEOUT=10
//
const limit   = parseInt(process.env.DATABASE_POOL_LIMIT   ?? "10", 10);
const timeout = parseInt(process.env.DATABASE_POOL_TIMEOUT ?? "5",  10);
const poolParams = `connection_limit=${limit}&pool_timeout=${timeout}`;

const DATABASE_URL = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.includes("connection_limit")
    ? process.env.DATABASE_URL          // env already carries pool params — don't override
    : `${process.env.DATABASE_URL}?${poolParams}`
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: DATABASE_URL,
  });

// Always store the singleton — not just in dev.
// Node.js module caching already prevents duplicate instances within a single
// process, but storing on globalThis also protects against unexpected module
// re-evaluation (e.g. Next.js RSC hot reload, edge runtime restarts).
globalForPrisma.prisma = prisma;
