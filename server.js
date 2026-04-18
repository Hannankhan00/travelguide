import { createServer } from "http";
import next from "next";

const port     = parseInt(process.env.PORT || "3000", 10);
const dev      = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app    = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error("Request handler error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(
      `> Server ready at http://${hostname}:${port} [${dev ? "development" : "production"}]`
    );
  });
}).catch((err) => {
  console.error("Failed to prepare Next.js app:", err);
  process.exit(1);
});
