import type { Instrumentation } from "next";

export const register: Instrumentation.register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { prisma } = await import("./lib/prisma");

  const gracefulDisconnect = async () => {
    await prisma.$disconnect();
  };

  process.once("SIGTERM", gracefulDisconnect);
  process.once("SIGINT", gracefulDisconnect);
  process.once("beforeExit", gracefulDisconnect);
};
