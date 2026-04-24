"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { emitNewMessage } from "@/lib/pusher-server";
import { serializeMessage, notifyAdminConversationChanged } from "@/lib/chat-server";
import { sendEmail, guideMessageHtml } from "@/lib/email";
import { COMPANY_NAME } from "@/lib/constants";

export async function getConversations() {
  const conversations = await prisma.chatConversation.findMany({
    where:   { type: "BOOKING_SUPPORT" },
    orderBy: { lastMessageAt: "desc" },
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
  return conversations;
}

export async function getConversationMessages(conversationId: string) {
  const messages = await prisma.chatMessage.findMany({
    where:   { conversationId },
    orderBy: { createdAt: "asc" },
    select:  { id: true, senderName: true, senderRole: true, content: true, createdAt: true, isRead: true },
  });
  return messages.map(serializeMessage);
}

export async function sendAdminMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const guideName = session.user.name ?? "Your Guide";
  const trimmed   = content.trim();

  const created = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId:   session.user.id,
      senderName: guideName,
      senderRole: "ADMIN",
      content:    trimmed,
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

  // Email the customer so they know a reply is waiting
  const convo = await prisma.chatConversation.findUnique({
    where:   { id: conversationId },
    include: {
      customer: { select: { email: true, name: true } },
      booking:  { select: { bookingRef: true, tour: { select: { title: true } } } },
    },
  });

  if (convo?.customer?.email) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    try {
      await sendEmail({
        to:      convo.customer.email,
        subject: `New message from ${guideName} — ${COMPANY_NAME}`,
        html:    guideMessageHtml({
          customerName:   convo.customer.name ?? "Traveller",
          guideName,
          messagePreview: trimmed.slice(0, 200),
          tourTitle:      convo.booking?.tour.title ?? "",
          bookingRef:     convo.booking?.bookingRef ?? "",
          viewUrl:        `${baseUrl}/bookings`,
        }),
      });
      await prisma.emailLog.create({
        data: {
          to:      convo.customer.email,
          subject: `New message from ${guideName}`,
          type:    "GUIDE_MESSAGE",
          status:  "SENT",
          sentAt:  new Date(),
        },
      });
    } catch (err) {
      console.error("Guide message email error:", err);
    }
  }

  revalidatePath("/admin/chat");
  return { message: msg };
}

export async function resolveConversation(conversationId: string) {
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data:  { status: "RESOLVED" },
  });
  await notifyAdminConversationChanged(conversationId);
  revalidatePath("/admin/chat");
}

export async function adminMarkRead(conversationId: string) {
  const result = await prisma.chatMessage.updateMany({
    where: { conversationId, senderRole: "CUSTOMER", isRead: false },
    data:  { isRead: true },
  });
  if (result.count > 0) {
    await notifyAdminConversationChanged(conversationId);
  }
}

export async function getUnreadCounts() {
  const rows = await prisma.chatMessage.groupBy({
    by:     ["conversationId"],
    _count: { id: true },
    where:  { senderRole: "CUSTOMER", isRead: false },
  });
  return Object.fromEntries(rows.map((r) => [r.conversationId, r._count.id]));
}
