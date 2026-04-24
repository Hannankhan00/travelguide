import PusherServer from "pusher";

let _instance: PusherServer | null = null;
let _initFailed = false;

function getPusherServer(): PusherServer | null {
  if (_instance) return _instance;
  if (_initFailed) return null;

  const appId   = process.env.PUSHER_APP_ID;
  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret  = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.error(
      "Pusher server env vars not configured (PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, " +
      "PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER). Real-time chat updates are disabled."
    );
    _initFailed = true;
    return null;
  }

  _instance = new PusherServer({ appId, key, secret, cluster, useTLS: true });
  return _instance;
}

export interface ChatMessagePayload {
  id:         string;
  senderName: string;
  senderRole: string;
  content:    string;
  createdAt:  string;
  isRead:     boolean;
}

export interface AdminConversationSummary {
  id:            string;
  status:        string;
  lastMessageAt: string;
  createdAt:     string;
  bookingRef:    string | null;
  tourTitle:     string;
  customerName:  string;
  customerEmail: string | null;
  lastMessage:   { content: string; senderRole: string; createdAt: string; isRead: boolean } | null;
  unreadCount:   number;
}

export const ADMIN_CONVERSATIONS_CHANNEL = "admin-conversations";
export const ADMIN_CONVERSATIONS_EVENT   = "update";

export async function emitNewMessage(
  conversationId: string,
  message: ChatMessagePayload,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(`conversation-${conversationId}`, "new_message", message);
  } catch (err) {
    console.error(`Pusher emit failed for conversation-${conversationId}:`, err);
  }
}

export async function emitAdminConversationUpdate(
  summary: AdminConversationSummary,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(ADMIN_CONVERSATIONS_CHANNEL, ADMIN_CONVERSATIONS_EVENT, { summary });
  } catch (err) {
    console.error(`Pusher emit failed for ${ADMIN_CONVERSATIONS_CHANNEL}:`, err);
  }
}
