"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { emitNewMessage } from "@/lib/pusher-server";

// Get or create a BOOKING_SUPPORT conversation for a booking
export async function getOrCreateConversation(bookingId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not authenticated" };

  const dbUser = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) return { error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where:  { id: bookingId },
    select: { id: true, customerId: true, tour: { select: { title: true } } },
  });
  if (!booking || booking.customerId !== dbUser.id) return { error: "Not found" };

  const existing = await prisma.chatConversation.findUnique({
    where: { bookingId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
      },
    },
  });
  if (existing) return { conversation: existing };

  const created = await prisma.chatConversation.create({
    data: {
      type:       "BOOKING_SUPPORT",
      bookingId,
      customerId: dbUser.id,
      status:     "OPEN",
    },
    include: { messages: true },
  });
  return { conversation: created };
}

// Send a message as CUSTOMER
export async function sendCustomerMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not authenticated" };

  const dbUser = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!dbUser) return { error: "Not authenticated" };

  const convo = await prisma.chatConversation.findUnique({
    where:  { id: conversationId },
    select: { id: true, customerId: true },
  });
  if (!convo || convo.customerId !== dbUser.id) return { error: "Not found" };

  const msg = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId:   dbUser.id,
      senderName: dbUser.name ?? session.user.email ?? "Customer",
      senderRole: "CUSTOMER",
      content:    content.trim(),
    },
    select: { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data:  { lastMessageAt: new Date(), status: "OPEN" },
  });

  emitNewMessage(conversationId, msg);
  return { message: msg };
}

// Poll messages after a given timestamp
export async function pollMessages(conversationId: string, after: string, role: "CUSTOMER" | "ADMIN") {
  if (role === "CUSTOMER") {
    const session = await auth();
    if (!session?.user?.id) return { messages: [] };
    const convo = await prisma.chatConversation.findUnique({
      where: { id: conversationId }, select: { customerId: true },
    });
    if (convo?.customerId !== session.user.id) return { messages: [] };
  }

  const messages = await prisma.chatMessage.findMany({
    where:   { conversationId, createdAt: { gt: new Date(after) } },
    orderBy: { createdAt: "asc" },
    select:  { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
  });
  return { messages };
}

// Mark all messages in a conversation as read (for a given role's counterpart)
export async function markConversationRead(conversationId: string, readByRole: "CUSTOMER" | "ADMIN") {
  const notSentBy = readByRole === "ADMIN" ? "CUSTOMER" : "ADMIN";
  await prisma.chatMessage.updateMany({
    where:  { conversationId, senderRole: notSentBy as "CUSTOMER" | "ADMIN", isRead: false },
    data:   { isRead: true },
  });
}
