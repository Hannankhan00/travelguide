import { NextRequest, NextResponse }          from "next/server";
import { auth }                               from "@/lib/auth";
import { prisma }                             from "@/lib/prisma";
import { capturePayPalOrder }                 from "@/lib/paypal";
import { sendEmail, bookingConfirmationHtml } from "@/lib/email";
import { formatPrice, formatDate }            from "@/lib/utils";
import { COMPANY_CURRENCY }                   from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookingId, orderId } = await req.json() as { bookingId: string; orderId: string };
    if (!bookingId || !orderId) {
      return NextResponse.json({ error: "Missing bookingId or orderId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where:  { id: bookingId },
      select: {
        id:            true,
        bookingRef:    true,
        customerId:    true,
        paymentStatus: true,
        status:        true,
        guestEmail:    true,
        guestName:     true,
        tourDate:      true,
        numAdults:     true,
        numChildren:   true,
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

    // Capture the PayPal order
    const capture = await capturePayPalOrder(orderId);
    if (capture.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    // Mark booking as paid + confirmed
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus:   "PAID",
        paymentMethod:   "PAYPAL",
        status:          "CONFIRMED",
        paypalOrderId:   orderId,
        paypalCaptureId: captureId,
        paidAt:          new Date(),
        confirmedAt:     new Date(),
      },
    });

    // Send confirmation email
    try {
      await sendEmail({
        to:      booking.guestEmail,
        subject: `Booking Confirmed — ${booking.tour.title} · ${booking.bookingRef}`,
        html:    bookingConfirmationHtml({
          customerName:  booking.guestName ?? "Traveller",
          bookingRef:    booking.bookingRef,
          tourTitle:     booking.tour.title,
          tourDate:      formatDate(booking.tourDate),
          numGuests:     booking.numAdults + booking.numChildren,
          totalAmount:   formatPrice(Number(booking.totalAmount), COMPANY_CURRENCY),
          paymentMethod: "PayPal",
        }),
      });
      await prisma.emailLog.create({
        data: {
          to:        booking.guestEmail,
          subject:   `Booking Confirmed — ${booking.bookingRef}`,
          type:      "BOOKING_CONFIRMATION",
          bookingId: booking.id,
          status:    "SENT",
          sentAt:    new Date(),
        },
      });
    } catch (emailErr) {
      console.error("[paypal/complete-booking] Email failed for", booking.bookingRef, emailErr);
      await prisma.emailLog.create({
        data: {
          to:        booking.guestEmail,
          subject:   `Booking Confirmed — ${booking.bookingRef}`,
          type:      "BOOKING_CONFIRMATION",
          bookingId: booking.id,
          status:    "FAILED",
          error:     String(emailErr),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[paypal/complete-booking]", err);
    return NextResponse.json({ error: "Payment failed. Please contact support." }, { status: 500 });
  }
}
