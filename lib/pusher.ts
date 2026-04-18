import PusherServer from "pusher";
import PusherClient from "pusher-js";

// ── Server-side Pusher (used in server actions) ───────────────────────────────
export const pusherServer = new PusherServer({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS:  true,
});

export function emitNewMessage(
  conversationId: string,
  message: {
    id:         string;
    senderName: string;
    senderRole: string;
    content:    string;
    createdAt:  Date | string;
    isRead:     boolean;
  }
) {
  return pusherServer.trigger(`conversation-${conversationId}`, "new_message", {
    ...message,
    createdAt: message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt,
  });
}

// ── Client-side Pusher singleton ──────────────────────────────────────────────
let clientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!clientInstance) {
    clientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return clientInstance;
}
