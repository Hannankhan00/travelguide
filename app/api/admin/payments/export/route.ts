import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sp       = req.nextUrl.searchParams;
  const query    = sp.get("q")?.trim()  ?? "";
  const status   = sp.get("status")     ?? "ALL";
  const method   = sp.get("method")     ?? "ALL";
  const dateFrom = sp.get("dateFrom")   ?? "";
  const dateTo   = sp.get("dateTo")     ?? "";

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { bookingRef: { contains: query } },
      { guestName:  { contains: query } },
      { guestEmail: { contains: query } },
      { tour: { title: { contains: query } } },
    ];
  }
  if (status !== "ALL") where.paymentStatus = status;
  if (method !== "ALL") where.paymentMethod = method;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom + "T00:00:00.000Z") } : {}),
      ...(dateTo   ? { lte: new Date(dateTo   + "T23:59:59.999Z") } : {}),
    };
  }

  const EXPORT_LIMIT = 10_000;

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take:    EXPORT_LIMIT,
    include: { tour: { select: { title: true } } },
  });

  const headers = [
    "Date", "Booking Ref", "Guest Name", "Email", "Tour",
    "Adults", "Children", "Subtotal", "Discount", "Total", "Currency",
    "Payment Method", "Payment Status", "Booking Status",
    "Stripe Payment ID", "PayPal Capture ID", "Bank Transfer Ref",
    "Paid At", "Booked At",
  ];

  const rows = bookings.map((b) => [
    b.createdAt.toISOString().slice(0, 10),
    b.bookingRef,
    b.guestName ?? "",
    b.guestEmail,
    b.tour.title,
    b.numAdults,
    b.numChildren,
    Number(b.subtotal).toFixed(2),
    Number(b.discountAmount).toFixed(2),
    Number(b.totalAmount).toFixed(2),
    b.currency,
    b.paymentMethod,
    b.paymentStatus,
    b.status,
    b.stripePaymentId ?? "",
    b.paypalCaptureId ?? "",
    b.bankTransferRef ?? "",
    b.paidAt?.toISOString().slice(0, 16).replace("T", " ") ?? "",
    b.createdAt.toISOString().slice(0, 16).replace("T", " "),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  const wasTruncated = bookings.length === EXPORT_LIMIT;

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(wasTruncated ? { "X-Export-Truncated": "true" } : {}),
    },
  });
}
