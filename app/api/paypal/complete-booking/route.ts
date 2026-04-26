import { NextRequest, NextResponse, after }   from "next/server";
import { auth }                               from "@/lib/auth";
import { prisma }                             from "@/lib/prisma";
import { capturePayPalOrder }                 from "@/lib/paypal";
import { sendEmail, bookingConfirmationHtml, adminNewBookingHtml } from "@/lib/email";
import { formatPrice, formatDate }            from "@/lib/utils";
import { COMPANY_CURRENCY, COMPANY_EMAIL }    from "@/lib/constants";

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

    // ── Queue confirmation email — after response is sent ─────────────────────
    // after() runs once the HTTP response has been flushed to the client.
    // SMTP latency (2–5 s on shared hosting) no longer blocks the response
    // or holds a worker slot open.
    const bookingSnapshot = {
      id:          booking.id,
      bookingRef:  booking.bookingRef,
      guestEmail:  booking.guestEmail,
      guestName:   booking.guestName,
      tourTitle:   booking.tour.title,
      tourDate:    booking.tourDate,
      numAdults:   booking.numAdults,
      numChildren: booking.numChildren,
      totalAmount: booking.totalAmount,
      currency:    booking.currency,
    };

    after(async () => {
      try {
        await sendEmail({
          to:      bookingSnapshot.guestEmail,
          subject: `Booking Confirmed — ${bookingSnapshot.tourTitle} · ${bookingSnapshot.bookingRef}`,
          html:    bookingConfirmationHtml({
            customerName:  bookingSnapshot.guestName ?? "Traveller",
            bookingRef:    bookingSnapshot.bookingRef,
            tourTitle:     bookingSnapshot.tourTitle,
            tourDate:      formatDate(bookingSnapshot.tourDate),
            numGuests:     bookingSnapshot.numAdults + bookingSnapshot.numChildren,
            totalAmount:   formatPrice(Number(bookingSnapshot.totalAmount), COMPANY_CURRENCY),
            paymentMethod: "PayPal",
          }),
        });
        await prisma.emailLog.create({
          data: {
            to:        bookingSnapshot.guestEmail,
            subject:   `Booking Confirmed — ${bookingSnapshot.bookingRef}`,
            type:      "BOOKING_CONFIRMATION",
            bookingId: bookingSnapshot.id,
            status:    "SENT",
            sentAt:    new Date(),
          },
        });
      } catch (emailErr) {
        console.error("[paypal/complete-booking] Email failed for", bookingSnapshot.bookingRef, emailErr);
        await prisma.emailLog.create({
          data: {
            to:        bookingSnapshot.guestEmail,
            subject:   `Booking Confirmed — ${bookingSnapshot.bookingRef}`,
            type:      "BOOKING_CONFIRMATION",
            bookingId: bookingSnapshot.id,
            status:    "FAILED",
            error:     String(emailErr),
          },
        }).catch(() => {});
      }

      try {
        await sendEmail({
          to:      COMPANY_EMAIL,
          subject: `New Booking — ${bookingSnapshot.tourTitle} · ${bookingSnapshot.bookingRef}`,
          html:    adminNewBookingHtml({
            bookingRef:    bookingSnapshot.bookingRef,
            customerName:  bookingSnapshot.guestName ?? "Traveller",
            customerEmail: bookingSnapshot.guestEmail,
            tourTitle:     bookingSnapshot.tourTitle,
            tourDate:      formatDate(bookingSnapshot.tourDate),
            numGuests:     bookingSnapshot.numAdults + bookingSnapshot.numChildren,
            totalAmount:   formatPrice(Number(bookingSnapshot.totalAmount), COMPANY_CURRENCY),
            paymentMethod: "PayPal",
          }),
        });
        await prisma.emailLog.create({
          data: {
            to:        COMPANY_EMAIL,
            subject:   `New Booking — ${bookingSnapshot.bookingRef}`,
            type:      "ADMIN_NEW_BOOKING",
            bookingId: bookingSnapshot.id,
            status:    "SENT",
            sentAt:    new Date(),
          },
        });
      } catch (adminEmailErr) {
        console.error("[paypal/complete-booking] Admin notification failed for", bookingSnapshot.bookingRef, adminEmailErr);
        await prisma.emailLog.create({
          data: {
            to:        COMPANY_EMAIL,
            subject:   `New Booking — ${bookingSnapshot.bookingRef}`,
            type:      "ADMIN_NEW_BOOKING",
            bookingId: bookingSnapshot.id,
            status:    "FAILED",
            error:     String(adminEmailErr),
          },
        }).catch(() => {});
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[paypal/complete-booking]", err);
    return NextResponse.json({ error: "Payment failed. Please contact support." }, { status: 500 });
  }
}
