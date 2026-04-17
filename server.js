import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev  = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";

// In production, do NOT pass turbopack option — let Next.js use the default
// (pre-built output). Turbopack is only relevant during development.
const app  = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error("Request handler error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXTAUTH_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Store io on global so server actions can emit events
  global._io = io;

  io.on("connection", (socket) => {
    // Client joins a room named after the conversationId
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
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
