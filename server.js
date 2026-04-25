import { createServer } from "http";
import next from "next";

const port     = parseInt(process.env.PORT || "3000", 10);
const dev      = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

console.log(`[server] Starting — NODE_ENV=${process.env.NODE_ENV} port=${port}`);

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught Exception:", err.message, err.stack);
});

const app    = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("[server] Calling app.prepare()...");

app.prepare()
  .then(() => {
    console.log("[server] app.prepare() succeeded — starting HTTP server");

    const httpServer = createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error("[server] Request handler error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    });

    httpServer.on("error", (err) => {
      console.error("[server] HTTP server error:", err);
    });

    httpServer.listen(port, hostname, () => {
      console.log(`[server] Ready at http://${hostname}:${port} [${dev ? "development" : "production"}]`);
    });

    // Graceful shutdown — let in-flight requests finish before the process exits.
    // Hostinger sends SIGTERM when restarting the app. Without this handler,
    // the process exits immediately, dropping active connections mid-response.
    // The 10-second timeout is a hard ceiling: if requests haven't finished by
    // then, we exit anyway to avoid blocking the restart indefinitely.
    function shutdown(signal) {
      console.log(`[server] ${signal} received — starting graceful shutdown`);
      httpServer.close((err) => {
        if (err) {
          console.error("[server] Error during shutdown:", err);
          process.exit(1);
        }
        console.log("[server] All connections closed — exiting cleanly");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("[server] Graceful shutdown timed out — forcing exit");
        process.exit(1);
      }, 10_000).unref();
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("[server] FATAL — app.prepare() failed:");
    console.error(err);
    process.exit(1);
  });
