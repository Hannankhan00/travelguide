import PusherServer from "pusher";

let _instance: PusherServer | null = null;

function getPusherServer(): PusherServer {
  if (_instance) return _instance;

  const appId   = process.env.PUSHER_APP_ID;
  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret  = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Pusher server env vars are not configured. Set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER."
    );
  }

  _instance = new PusherServer({ appId, key, secret, cluster, useTLS: true });
  return _instance;
}

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
  return getPusherServer().trigger(`conversation-${conversationId}`, "new_message", {
    ...message,
    createdAt: message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt,
  });
}
