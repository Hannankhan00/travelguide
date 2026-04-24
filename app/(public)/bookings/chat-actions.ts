"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { emitNewMessage } from "@/lib/pusher-server";
import { serializeMessage, notifyAdminConversationChanged } from "@/lib/chat-server";

// Get or create a BOOKING_SUPPORT conversation for a booking
export async function getOrCreateConversation(bookingId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not authenticated" as const };

  const dbUser = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) return { error: "Not authenticated" as const };

  const booking = await prisma.booking.findUnique({
    where:  { id: bookingId },
    select: { id: true, customerId: true },
  });
  if (!booking || booking.customerId !== dbUser.id) return { error: "Not found" as const };

  const existing = await prisma.chatConversation.findUnique({
    where: { bookingId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select:  { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
      },
    },
  });
  if (existing) {
    return {
      conversation: {
        id:       existing.id,
        messages: existing.messages.map(serializeMessage),
      },
    };
  }

  const created = await prisma.chatConversation.create({
    data: {
      type:       "BOOKING_SUPPORT",
      bookingId,
      customerId: dbUser.id,
      status:     "OPEN",
    },
    select: { id: true },
  });

  await notifyAdminConversationChanged(created.id);

  return {
    conversation: {
      id:       created.id,
      messages: [] as ReturnType<typeof serializeMessage>[],
    },
  };
}

// Send a message as CUSTOMER
export async function sendCustomerMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not authenticated" as const };

  const dbUser = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!dbUser) return { error: "Not authenticated" as const };

  const convo = await prisma.chatConversation.findUnique({
    where:  { id: conversationId },
    select: { id: true, customerId: true },
  });
  if (!convo || convo.customerId !== dbUser.id) return { error: "Not found" as const };

  const created = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId:   dbUser.id,
      senderName: dbUser.name ?? session.user.email ?? "Customer",
      senderRole: "CUSTOMER",
      content:    content.trim(),
    },
    select: { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
  });

  const msg = serializeMessage(created);

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data:  { lastMessageAt: new Date(), status: "OPEN" },
  });

  await emitNewMessage(conversationId, msg);
  await notifyAdminConversationChanged(conversationId);

  return { message: msg };
}

// Mark all messages in a conversation as read (for a given role's counterpart)
export async function markConversationRead(conversationId: string, readByRole: "CUSTOMER" | "ADMIN") {
  const notSentBy = readByRole === "ADMIN" ? "CUSTOMER" : "ADMIN";
  const result = await prisma.chatMessage.updateMany({
    where: { conversationId, senderRole: notSentBy, isRead: false },
    data:  { isRead: true },
  });
  // If the customer just read admin's messages, the admin's lastMessage isRead flag changes.
  if (result.count > 0 && readByRole === "CUSTOMER") {
    await notifyAdminConversationChanged(conversationId);
  }
}
