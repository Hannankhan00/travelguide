import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { createPayPalOrder }         from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookingId } = await req.json() as { bookingId: string };
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where:  { id: bookingId },
      select: {
        id:            true,
        customerId:    true,
        paymentStatus: true,
        status:        true,
        totalAmount:   true,
        currency:      true,
        tour:          { select: { title: true } },
      },
    });

    if (!booking || booking.customerId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This booking is already paid" }, { status: 409 });
    }
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot pay for a cancelled or completed booking" }, { status: 409 });
    }

    const order = await createPayPalOrder(
      Number(booking.totalAmount),
      booking.currency || "USD",
      booking.tour.title,
    );

    return NextResponse.json({ orderId: order.id });
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal/create-order-for-booking]", msg);
    if (msg.includes("credentials not configured")) {
      return NextResponse.json({ error: "PayPal is not configured on this server." }, { status: 503 });
    }
    if (msg.includes("PayPal auth failed")) {
      return NextResponse.json({ error: "PayPal authentication failed." }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }
}
