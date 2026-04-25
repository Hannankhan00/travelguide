"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  await assertAdmin();
  const data: Record<string, unknown> = { status };
  if (status === "CONFIRMED") data.confirmedAt = new Date();
  if (status === "CANCELLED") data.cancelledAt = new Date();
  await prisma.booking.update({ where: { id: bookingId }, data });
  revalidatePath("/admin/bookings");
}

export async function updatePaymentStatus(bookingId: string, paymentStatus: string) {
  await assertAdmin();
  const data: Record<string, unknown> = { paymentStatus };
  if (paymentStatus === "PAID") data.paidAt = new Date();
  await prisma.booking.update({ where: { id: bookingId }, data });
  revalidatePath("/admin/bookings");
}

export async function updateAdminNotes(bookingId: string, adminNotes: string) {
  await assertAdmin();
  await prisma.booking.update({ where: { id: bookingId }, data: { adminNotes } });
  revalidatePath("/admin/bookings");
}
