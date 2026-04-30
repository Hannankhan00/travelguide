import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// connection_limit: lowered from 10 → 3 to reduce memory pressure on shared hosting.
// Hostinger kills the Node process when it gets heavy, which triggers the engine panic.
// Override via DATABASE_POOL_LIMIT env var without a redeploy.
//
// pool_timeout: fast-fail so a queued request doesn't hold a Hostinger worker slot forever.
const limit   = parseInt(process.env.DATABASE_POOL_LIMIT   ?? "3", 10);
const timeout = parseInt(process.env.DATABASE_POOL_TIMEOUT ?? "5", 10);

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  return url.includes("connection_limit")
    ? url
    : `${url}?connection_limit=${limit}&pool_timeout=${timeout}`;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: buildDatasourceUrl(),
  });
}

function getLiveClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

// Called by the panic handler below. Clearing globalForPrisma.prisma means
// the next getLiveClient() call creates a fresh engine instance.
export function clearPrismaClient(): void {
  globalForPrisma.prisma = undefined;
}

function handlePanic(err: unknown): never {
  if (
    err != null &&
    typeof err === "object" &&
    (err as { constructor: { name: string } }).constructor.name ===
      "PrismaClientRustPanicError"
  ) {
    // Dead engine — drop the singleton so the next request gets a fresh one.
    clearPrismaClient();
  }
  throw err as Error;
}

// Proxies model delegates (e.g. prisma.place) so their async methods
// go through handlePanic.
const modelProxyHandler: ProxyHandler<object> = {
  get(target, methodName: string | symbol) {
    const method = (target as Record<string | symbol, unknown>)[methodName];
    if (typeof method !== "function") return method;
    return function (this: unknown, ...args: unknown[]) {
      const result = (method as (...a: unknown[]) => unknown).apply(
        target,
        args
      );
      if (result instanceof Promise) return result.catch(handlePanic);
      return result;
    };
  },
};

// Stable proxy exported to all callers. Always delegates to the current live
// client so that after an engine panic + clearPrismaClient(), the next
// request transparently gets a fresh engine without any import changes.
const clientProxyHandler: ProxyHandler<PrismaClient> = {
  get(_target, prop: string | symbol) {
    const client = getLiveClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];

    if (typeof value === "function") {
      return function (this: unknown, ...args: unknown[]) {
        const result = (value as (...a: unknown[]) => unknown).apply(
          client,
          args
        );
        if (result instanceof Promise) return result.catch(handlePanic);
        return result;
      };
    }

    if (typeof value === "object" && value !== null) {
      return new Proxy(value as object, modelProxyHandler);
    }

    return value;
  },
};

export const prisma = new Proxy(
  getLiveClient(),
  clientProxyHandler
) as PrismaClient;
