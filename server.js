import { createServer } from "http";
import next from "next";

const port     = parseInt(process.env.PORT || "3000", 10);
const dev      = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

console.log(`[server] Starting — NODE_ENV=${process.env.NODE_ENV} port=${port}`);

// Prevent unhandled errors from killing the process silently
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
  })
  .catch((err) => {
    console.error("[server] FATAL — app.prepare() failed:");
    console.error(err);
    process.exit(1);
  });
