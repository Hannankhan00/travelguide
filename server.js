import { createServer } from "http";
import next from "next";

const port     = parseInt(process.env.PORT || "3000", 10);
const dev      = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Prevent unhandled promise rejections / exceptions from killing the process
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Keep running unless it's a fatal startup error
});

const app    = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error("Request handler error:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  });

  httpServer.on("error", (err) => {
    console.error("HTTP server error:", err);
  });

  httpServer.listen(port, hostname, () => {
    console.log(
      `> Server ready at http://${hostname}:${port} [${dev ? "development" : "production"}]`
    );
  });
}).catch((err) => {
  console.error("Failed to prepare Next.js app:", err);
  // Give the process manager a chance to restart
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 500);
});
