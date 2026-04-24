import { prisma } from "./prisma";
import {
  emitAdminConversationUpdate,
  type AdminConversationSummary,
  type ChatMessagePayload,
} from "./pusher-server";

export function serializeMessage(msg: {
  id:         string;
  senderName: string;
  senderRole: string;
  content:    string;
  createdAt:  Date;
  isRead:     boolean;
}): ChatMessagePayload {
  return {
    id:         msg.id,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    content:    msg.content,
    createdAt:  msg.createdAt.toISOString(),
    isRead:     msg.isRead,
  };
}

export async function buildAdminConversationSummary(
  conversationId: string,
): Promise<AdminConversationSummary | null> {
  const c = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      booking:  { select: { bookingRef: true, tour: { select: { title: true } } } },
      customer: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take:    1,
        select:  { content: true, senderRole: true, createdAt: true, isRead: true },
      },
    },
  });
  if (!c) return null;

  const unreadCount = await prisma.chatMessage.count({
    where: { conversationId, senderRole: "CUSTOMER", isRead: false },
  });

  return {
    id:            c.id,
    status:        c.status,
    lastMessageAt: (c.lastMessageAt ?? c.createdAt).toISOString(),
    createdAt:     c.createdAt.toISOString(),
    bookingRef:    c.booking?.bookingRef ?? null,
    tourTitle:     c.booking?.tour.title ?? "General inquiry",
    customerName:  c.customer?.name ?? c.customer?.email ?? "Customer",
    customerEmail: c.customer?.email ?? null,
    lastMessage:   c.messages[0]
      ? {
          content:    c.messages[0].content,
          senderRole: c.messages[0].senderRole,
          createdAt:  c.messages[0].createdAt.toISOString(),
          isRead:     c.messages[0].isRead,
        }
      : null,
    unreadCount,
  };
}

export async function notifyAdminConversationChanged(conversationId: string): Promise<void> {
  const summary = await buildAdminConversationSummary(conversationId);
  if (summary) await emitAdminConversationUpdate(summary);
}
