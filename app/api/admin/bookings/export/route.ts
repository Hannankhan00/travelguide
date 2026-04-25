import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const query   = sp.get("q")?.trim()  ?? "";
  const status  = sp.get("status")     ?? "ALL";
  const payment = sp.get("payment")    ?? "ALL";

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { bookingRef: { contains: query } },
      { guestName:  { contains: query } },
      { guestEmail: { contains: query } },
      { tour: { title: { contains: query } } },
    ];
  }
  if (status  !== "ALL") where.status        = status;
  if (payment !== "ALL") where.paymentStatus = payment;

  // Hard cap prevents loading an unbounded result set into RAM.
  // Without this, exporting with no filters would pull every booking row into
  // memory at once, exhausting the Node.js heap on the Hostinger VPS → OOM
  // crash → 503 until the process restarts.
  const EXPORT_LIMIT = 10_000;

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take:    EXPORT_LIMIT,
    include: {
      tour: { select: { title: true } },
    },
  });

  const headers = [
    "Ref", "Tour", "Guest Name", "Email", "Phone",
    "Tour Date", "Adults", "Children", "Total", "Currency",
    "Booking Status", "Payment Status", "Payment Method",
    "Booked At", "Paid At",
  ];

  const rows = bookings.map((b) => [
    b.bookingRef,
    b.tour.title,
    b.guestName ?? "",
    b.guestEmail,
    b.guestPhone ?? "",
    b.tourDate.toISOString().slice(0, 10),
    b.numAdults,
    b.numChildren,
    Number(b.totalAmount).toFixed(2),
    b.currency,
    b.status,
    b.paymentStatus,
    b.paymentMethod,
    b.createdAt.toISOString().slice(0, 10),
    b.paidAt?.toISOString().slice(0, 10) ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  const wasTruncated = bookings.length === EXPORT_LIMIT;

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(wasTruncated ? { "X-Export-Truncated": "true" } : {}),
    },
  });
}
