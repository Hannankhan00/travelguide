import { prisma }      from "./lib/prisma";
import { transporter } from "./lib/email";

const gracefulDisconnect = async () => {
  await prisma.$disconnect();
};

process.once("SIGTERM", gracefulDisconnect);
process.once("SIGINT",  gracefulDisconnect);
process.once("beforeExit", gracefulDisconnect);

transporter.verify((err) => {
  if (err) {
    console.error("[email] SMTP connection failed:", err.message);
  } else {
    console.log("[email] SMTP ready —", process.env.SMTP_HOST);
  }
});
