import { NextRequest, NextResponse } from "next/server";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail, bookingConfirmationHtml } from "@/lib/email";
import { formatPrice, formatDate } from "@/lib/utils";
import { COMPANY_CURRENCY } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingRef = session.metadata?.bookingRef;
      if (!bookingRef) break;

      const booking = await prisma.booking.findUnique({
        where:   { bookingRef },
        include: { tour: true, customer: true },
      });
      if (!booking) break;

      // Idempotency guard — Stripe can deliver the same event more than once
      if (booking.paymentStatus === "PAID") break;

      await prisma.booking.update({
        where: { bookingRef },
        data: {
          paymentStatus:   "PAID",
          status:          "CONFIRMED",
          stripePaymentId: session.payment_intent as string,
          paidAt:          new Date(),
          confirmedAt:     new Date(),
        },
      });

      // Note: bookedCount is incremented atomically during booking creation.
      // No second increment here.

      // Send confirmation email — wrapped so a transient SMTP failure never
      // returns 500 to Stripe. Stripe would retry on 500, but the idempotency
      // guard above would skip the DB update; the email would still not send.
      // Isolating here keeps the webhook idempotent AND always returns 200.
      try {
        const recipientName = booking.guestName ?? booking.customer?.name ?? "Traveller";
        await sendEmail({
          to:      booking.guestEmail,
          subject: `Booking Confirmed — ${booking.tour.title} · ${bookingRef}`,
          html:    bookingConfirmationHtml({
            customerName:  recipientName,
            bookingRef,
            tourTitle:     booking.tour.title,
            tourDate:      formatDate(booking.tourDate),
            numGuests:     booking.numAdults + booking.numChildren,
            totalAmount:   formatPrice(Number(booking.totalAmount), COMPANY_CURRENCY),
            paymentMethod: "Credit / Debit Card",
          }),
        });
        await prisma.emailLog.create({
          data: {
            to:        booking.guestEmail,
            subject:   `Booking Confirmed — ${bookingRef}`,
            type:      "BOOKING_CONFIRMATION",
            bookingId: booking.id,
            status:    "SENT",
            sentAt:    new Date(),
          },
        });
      } catch (emailErr) {
        console.error("[webhook] Confirmation email failed for", bookingRef, emailErr);
        await prisma.emailLog.create({
          data: {
            to:        booking.guestEmail,
            subject:   `Booking Confirmed — ${bookingRef}`,
            type:      "BOOKING_CONFIRMATION",
            bookingId: booking.id,
            status:    "FAILED",
            error:     String(emailErr),
          },
        }).catch(() => {});
      }
      break;
    }

    case "checkout.session.expired": {
      const session    = event.data.object;
      const bookingRef = session.metadata?.bookingRef;
      if (bookingRef) {
        await prisma.booking.updateMany({
          where: { bookingRef, paymentStatus: "PENDING" },
          data:  { paymentStatus: "FAILED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
