import { NextRequest, NextResponse }            from "next/server";
import { prisma }                               from "@/lib/prisma";
import { capturePayPalOrder }                   from "@/lib/paypal";
import { auth }                                 from "@/lib/auth";
import { calcGroupPrice, generateBookingRef, formatPrice, formatDate } from "@/lib/utils";
import { sendEmail, bookingConfirmationHtml }   from "@/lib/email";
import { COMPANY_CURRENCY }                     from "@/lib/constants";

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
    const variationExtraRaw = body.variationExtra;

    // ── Input guards ────────────────────────────────────────────────────────
    if (!orderId) return NextResponse.json({ error: "Missing orderId" },      { status: 400 });
    if (!tourId)  return NextResponse.json({ error: "Missing tourId" },       { status: 400 });
    if (!date)    return NextResponse.json({ error: "Missing date" },         { status: 400 });
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Missing required guest fields" },    { status: 400 });
    }

    const adultsNum   = parseInt(adults   ?? "1", 10);
    const childrenNum = parseInt(children ?? "0", 10);
    if (isNaN(adultsNum) || adultsNum < 1) {
      return NextResponse.json({ error: "At least 1 adult required" }, { status: 400 });
    }

    // ── Capture payment first ────────────────────────────────────────────────
    const capture = await capturePayPalOrder(orderId);
    if (capture.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    // ── Load tour ────────────────────────────────────────────────────────────
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

    const totalGuests   = adultsNum + childrenNum;
    const basePrice     = Number(tour.basePrice);
    const childPrice    = tour.childPrice ? Number(tour.childPrice) : basePrice;
    const tourType      = ((tour as any).tourType as "SOLO" | "GROUP") ?? "GROUP";
    const baseGroupSize = Number((tour as any).baseGroupSize ?? 4);
    const baseTotal     =
      tourType === "GROUP"
        ? calcGroupPrice(totalGuests, baseGroupSize, basePrice)
        : adultsNum * basePrice + childrenNum * childPrice;

    let serverVariationExtra = 0;
    if (variationId) {
      const safeArr = (v: unknown): any[] => {
        if (!v || typeof v !== "string") return [];
        try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
      };
      const matched = safeArr((tour as any).variations).find((v: any) => v.id === variationId);
      serverVariationExtra = matched ? Number(matched.extraCost) : 0;
    }
    const calculatedTotal = baseTotal + serverVariationExtra;

    // ── Auth / customer ID ───────────────────────────────────────────────────
    const session  = await auth();
    const isLoggedIn = !!session?.user?.email;
    let   customerId: string | null = null;
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where:  { email: session.user.email },
        select: { id: true },
      });
      customerId = dbUser?.id ?? null;
    }

    // ── Duplicate booking guard ──────────────────────────────────────────────
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

    // ── Atomic capacity check + booking creation ─────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      type AvailRow = {
        id:           string;
        status:       string;
        bookedCount:  number | bigint;
        maxCapacity:  number | bigint;
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

      const ref = generateBookingRef();
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
            startTime    ? `Starting time: ${startTime}` : "",
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

    // ── Confirmation email ───────────────────────────────────────────────────
    try {
      await sendEmail({
        to:      result.guestEmail,
        subject: `Booking Confirmed — ${tour.title} · ${result.bookingRef}`,
        html:    bookingConfirmationHtml({
          customerName:  result.guestName ?? "Traveller",
          bookingRef:    result.bookingRef,
          tourTitle:     tour.title,
          tourDate:      formatDate(result.tourDate),
          numGuests:     result.numAdults + result.numChildren,
          totalAmount:   formatPrice(Number(result.totalAmount), COMPANY_CURRENCY),
          paymentMethod: "PayPal",
        }),
      });
      await prisma.emailLog.create({
        data: {
          to:        result.guestEmail,
          subject:   `Booking Confirmed — ${result.bookingRef}`,
          type:      "BOOKING_CONFIRMATION",
          bookingId: result.id,
          status:    "SENT",
          sentAt:    new Date(),
        },
      });
    } catch (emailErr) {
      console.error("[paypal/capture] Email failed for", result.bookingRef, emailErr);
      await prisma.emailLog.create({
        data: {
          to:        result.guestEmail,
          subject:   `Booking Confirmed — ${result.bookingRef}`,
          type:      "BOOKING_CONFIRMATION",
          bookingId: result.id,
          status:    "FAILED",
          error:     String(emailErr),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, bookingRef: result.bookingRef, isLoggedIn });
  } catch (err: any) {
    if (err.message === "FULL") {
      return NextResponse.json({ error: "Sorry, this date is fully booked." }, { status: 409 });
    }
    if (err.message === "UNAVAILABLE") {
      return NextResponse.json({ error: "This date is no longer available." }, { status: 409 });
    }
    if (typeof err.message === "string" && err.message.startsWith("CAPACITY:")) {
      const spots = err.message.split(":")[1];
      return NextResponse.json(
        { error: `Only ${spots} spot${spots === "1" ? "" : "s"} left — reduce your group size or pick another date.` },
        { status: 409 },
      );
    }
    console.error("[paypal/capture-order]", err);
    return NextResponse.json({ error: "Booking failed. Please contact support." }, { status: 500 });
  }
}
