import { createServer } from "http";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev  = process.env.NODE_ENV !== "production";

// Passenger proxies to localhost — bind only on loopback so the port
// is never reachable directly from outside the machine.
const hostname = process.env.HOSTNAME || "127.0.0.1";

// Create the HTTP server first so we can hand it to next() — this lets
// Next.js attach its own WebSocket upgrade listener for HMR (dev) and
// any server-sent-event or WebSocket routes we add in future.
const httpServer = createServer();

const app    = next({ dev, hostname, port, httpServer });
const handle = app.getRequestHandler();

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught Exception:", err.message, err.stack);
});

app.prepare()
  .then(() => {
    httpServer.on("request", (req, res) => {
      handle(req, res).catch((err) => {
        console.error("[server] Request handler error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    });

    httpServer.listen(port, hostname, () => {
      console.log(
        `[server] Ready on http://${hostname}:${port} [${dev ? "development" : "production"}]`
      );
    });

    // Graceful shutdown — Passenger/Hostinger sends SIGTERM on restart/stop.
    // We let in-flight requests finish (up to 10 s) before exiting so the
    // process never drops an active response mid-stream.
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
    console.error("[server] FATAL — app.prepare() failed:", err);
    process.exit(1);
  });
