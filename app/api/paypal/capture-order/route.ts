import { NextRequest, NextResponse }                    from "next/server";
import { after }                                         from "next/server";
import { prisma }                                        from "@/lib/prisma";
import { capturePayPalOrder, refundPayPalCapture }       from "@/lib/paypal";
import { auth }                                          from "@/lib/auth";
import { calcGroupPrice, generateBookingRef, formatPrice, formatDate } from "@/lib/utils";
import { sendEmail, bookingConfirmationHtml, adminNewBookingHtml } from "@/lib/email";
import { COMPANY_CURRENCY, COMPANY_EMAIL }               from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const {
      orderId, tourId, date, adults, children,
      firstName, lastName, email, phone,
      pickupLocation, pickupLat, pickupLng,
      specialRequests, startTime,
      variationId, variationName,
    } = body;
    // ── 1. Input guards ──────────────────────────────────────────────────────
    if (!orderId) return NextResponse.json({ error: "Missing orderId" },   { status: 400 });
    if (!tourId)  return NextResponse.json({ error: "Missing tourId" },    { status: 400 });
    if (!date)    return NextResponse.json({ error: "Missing date" },      { status: 400 });
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Missing required guest fields" }, { status: 400 });
    }

    const adultsNum   = parseInt(adults   ?? "1", 10);
    const childrenNum = parseInt(children ?? "0", 10);
    if (isNaN(adultsNum) || adultsNum < 1) {
      return NextResponse.json({ error: "At least 1 adult required" }, { status: 400 });
    }

    // ── 2. Load tour — before touching payment ───────────────────────────────
    // Validate the tour exists and is bookable before any money moves. A 404
    // here costs nothing; a 404 after capture costs a customer a refund wait.
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour || tour.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Tour not available" }, { status: 404 });
    }

    const tourDateObj = new Date(date + "T00:00:00.000Z");
    const today       = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (tourDateObj < today) {
      return NextResponse.json({ error: "Tour date must be in the future" }, { status: 400 });
    }

    // ── 3. Price calculation — before touching payment ───────────────────────
    const totalGuests   = adultsNum + childrenNum;
    const basePrice     = Number(tour.basePrice);
    const childPrice    = tour.childPrice ? Number(tour.childPrice) : basePrice;
    const tourType      = tour.tourType ?? "GROUP";
    const baseGroupSize = Number(tour.baseGroupSize ?? 4);
    const baseTotal     =
      tourType === "GROUP"
        ? calcGroupPrice(totalGuests, baseGroupSize, basePrice)
        : adultsNum * basePrice + childrenNum * childPrice;

    type Variation = { id: string; name: string; extraCost: number | string };
    const parseVariations = (v: string | null): Variation[] => {
      if (!v) return [];
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
    };

    let serverVariationExtra = 0;
    if (variationId) {
      const matched = parseVariations(tour.variations).find((v) => v.id === variationId);
      serverVariationExtra = matched ? Number(matched.extraCost) : 0;
    }
    const calculatedTotal = baseTotal + serverVariationExtra;

    // ── 4. Auth + customer lookup — before touching payment ──────────────────
    const session   = await auth();
    const isLoggedIn = !!session?.user?.email;
    let   customerId: string | null = null;
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where:  { email: session.user.email },
        select: { id: true },
      });
      customerId = dbUser?.id ?? null;
    }

    // ── 5. Duplicate booking guard — before touching payment ─────────────────
    const guestEmail = email.trim().toLowerCase();
    const existing   = await prisma.booking.findFirst({
      where: { tourId, tourDate: tourDateObj, guestEmail, status: { not: "CANCELLED" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a booking for this tour on this date." },
        { status: 409 },
      );
    }

    // ── 6. Idempotency guard — before touching payment ───────────────────────
    // If a booking with this PayPal order ID already exists, a previous request
    // succeeded but the response was dropped (network timeout, browser close).
    // Return success rather than recapturing or double-booking.
    const existingByOrder = await prisma.booking.findFirst({
      where:  { paypalOrderId: orderId },
      select: { bookingRef: true },
    });
    if (existingByOrder) {
      return NextResponse.json({ success: true, bookingRef: existingByOrder.bookingRef, isLoggedIn });
    }

    // ── 7. Capture payment ───────────────────────────────────────────────────
    // All validation has passed. Only now do we move money. Any failure after
    // this point must attempt a refund before returning an error to the client.
    const capture = await capturePayPalOrder(orderId);
    if (capture.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    // ── 8. Atomic capacity check + booking creation ──────────────────────────
    // From this point: if anything throws, we issue a refund before responding.
    let result: Awaited<ReturnType<typeof prisma.booking.create>>;
    try {
      result = await prisma.$transaction(async (tx) => {
        type AvailRow = {
          id:            string;
          status:        string;
          bookedCount:   number | bigint;
          maxCapacity:   number | bigint;
          priceOverride: string | null;
        };
        const rows = await tx.$queryRaw<AvailRow[]>`
          SELECT id, status, bookedCount, maxCapacity, priceOverride
          FROM TourAvailability
          WHERE tourId = ${tourId}
            AND date   = ${date}
          FOR UPDATE
        `;
        const avail       = rows[0] ?? null;
        const bookedCount = avail ? Number(avail.bookedCount) : 0;
        const maxCapacity = avail ? Number(avail.maxCapacity) : Number(tour.dailyCapacity);
        const spotsLeft   = maxCapacity - bookedCount;

        if (avail) {
          if (avail.status === "CLOSED" || avail.status === "CANCELLED") throw new Error("UNAVAILABLE");
          if (avail.status === "FULL")                                   throw new Error("FULL");
          if (spotsLeft < 1)                                             throw new Error(`CAPACITY:${spotsLeft}`);
        } else {
          if (bookedCount >= maxCapacity)                                throw new Error(`CAPACITY:0`);
        }

        const ref     = generateBookingRef();
        const booking = await tx.booking.create({
          data: {
            bookingRef:      ref,
            tourId,
            availabilityId:  avail?.id ?? null,
            customerId,
            guestName:       `${firstName.trim()} ${lastName.trim()}`,
            guestEmail,
            guestPhone:      phone.trim(),
            tourDate:        tourDateObj,
            numAdults:       adultsNum,
            numChildren:     childrenNum,
            specialRequests: [
              specialRequests,
              pickupLocation ? `Pickup: ${pickupLocation}` : "",
              pickupLat && pickupLng
                ? `Pickup coords: ${parseFloat(pickupLat).toFixed(6)},${parseFloat(pickupLng).toFixed(6)}`
                : "",
              startTime     ? `Starting time: ${startTime}` : "",
              variationName ? `Upgrade: ${variationName}` : "",
            ].filter(Boolean).join("\n"),
            subtotal:        calculatedTotal,
            totalAmount:     calculatedTotal,
            discountAmount:  0,
            currency:        COMPANY_CURRENCY || "USD",
            paymentMethod:   "PAYPAL",
            paymentStatus:   "PAID",
            status:          "CONFIRMED",
            paypalOrderId:   orderId,
            paypalCaptureId: captureId,
            paidAt:          new Date(),
            confirmedAt:     new Date(),
            passengers: { create: { firstName: firstName.trim(), lastName: lastName.trim(), isLead: true } },
          },
        });

        if (avail) {
          const newCount = bookedCount + 1;
          await tx.tourAvailability.update({
            where: { id: avail.id },
            data: {
              bookedCount: newCount,
              ...(newCount >= maxCapacity ? { status: "FULL" as const } : {}),
            },
          });
        }

        return booking;
      });
    } catch (txErr: unknown) {
      // Payment was already captured. Attempt a refund before returning the
      // error — the customer must not lose money due to a booking system failure.
      if (captureId) {
        refundPayPalCapture(captureId).catch((refundErr) => {
          // Refund failed — this requires manual ops intervention.
          // Log clearly so it surfaces in Hostinger error logs immediately.
          console.error(
            "[paypal/capture-order] URGENT: payment captured but refund failed.",
            "captureId:", captureId,
            "orderId:",   orderId,
            "customer:",  guestEmail,
            "refundErr:", refundErr,
            "txErr:",     txErr,
          );
        });
      }

      const message = txErr instanceof Error ? txErr.message : "";

      if (message === "FULL") {
        return NextResponse.json({ error: "Sorry, this date is fully booked." }, { status: 409 });
      }
      if (message === "UNAVAILABLE") {
        return NextResponse.json({ error: "This date is no longer available." }, { status: 409 });
      }
      if (message.startsWith("CAPACITY:")) {
        const spots = message.split(":")[1];
        return NextResponse.json(
          { error: `Only ${spots} spot${spots === "1" ? "" : "s"} left — reduce your group size or pick another date.` },
          { status: 409 },
        );
      }

      console.error("[paypal/capture-order] Booking transaction failed after capture:", txErr);
      return NextResponse.json({ error: "Booking failed. Please contact support." }, { status: 500 });
    }

    // ── 9. Queue confirmation email — after response is sent ─────────────────
    // after() runs once the HTTP response has been flushed to the client.
    // The customer sees their confirmation immediately; SMTP latency (which can
    // be 2–5 s on shared hosting) no longer blocks the response or holds a
    // worker slot open.
    const bookingSnapshot = {
      id:          result.id,
      bookingRef:  result.bookingRef,
      guestEmail:  result.guestEmail,
      guestName:   result.guestName,
      tourDate:    result.tourDate,
      numAdults:   result.numAdults,
      numChildren: result.numChildren,
      totalAmount: result.totalAmount,
    };
    const tourTitle = tour.title;

    after(async () => {
      try {
        await sendEmail({
          to:      bookingSnapshot.guestEmail,
          subject: `Booking Confirmed — ${tourTitle} · ${bookingSnapshot.bookingRef}`,
          html:    bookingConfirmationHtml({
            customerName:  bookingSnapshot.guestName ?? "Traveller",
            bookingRef:    bookingSnapshot.bookingRef,
            tourTitle,
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
        console.error("[paypal/capture] Email failed for", bookingSnapshot.bookingRef, emailErr);
        prisma.emailLog.create({
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
          subject: `New Booking — ${tourTitle} · ${bookingSnapshot.bookingRef}`,
          html:    adminNewBookingHtml({
            bookingRef:    bookingSnapshot.bookingRef,
            customerName:  bookingSnapshot.guestName ?? "Traveller",
            customerEmail: bookingSnapshot.guestEmail,
            tourTitle,
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
        console.error("[paypal/capture] Admin notification failed for", bookingSnapshot.bookingRef, adminEmailErr);
        prisma.emailLog.create({
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

    return NextResponse.json({ success: true, bookingRef: result.bookingRef, isLoggedIn });

  } catch (err: unknown) {
    console.error("[paypal/capture-order]", err);
    return NextResponse.json({ error: "Booking failed. Please contact support." }, { status: 500 });
  }
}
