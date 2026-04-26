"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calcGroupPrice, generateBookingRef } from "@/lib/utils";

export async function submitBookingAction(formData: FormData) {
  const tourId      = formData.get("tourId")       as string;
  const date        = formData.get("date")          as string;
  const adultsRaw   = formData.get("adults")        as string;
  const childrenRaw = formData.get("children")      as string;
  const firstName   = (formData.get("firstName")   as string)?.trim();
  const lastName    = (formData.get("lastName")    as string)?.trim();
  const email       = (formData.get("email")       as string)?.trim().toLowerCase();
  const phone       = (formData.get("phone")       as string)?.trim();
  const pickupLocation  = formData.get("pickupLocation")  as string;
  const pickupLat       = formData.get("pickupLat")       as string;
  const pickupLng       = formData.get("pickupLng")       as string;
  const specialRequests = formData.get("specialRequests") as string;
  const startTime       = (formData.get("startTime")      as string)?.trim() || null;
  const variationId     = (formData.get("variationId")    as string)?.trim() || null;
  const variationName   = (formData.get("variationName")  as string)?.trim() || null;
  // ── Basic field validation ────────────────────────────────────────────────
  if (!firstName || !lastName || !email || !phone) {
    return { error: "Please fill in all required fields." };
  }
  if (!tourId || !date) {
    return { error: "Invalid booking request." };
  }

  const adultsNum   = parseInt(adultsRaw,   10);
  const childrenNum = parseInt(childrenRaw ?? "0", 10);
  if (isNaN(adultsNum) || adultsNum < 1) {
    return { error: "At least 1 adult is required." };
  }
  if (isNaN(childrenNum) || childrenNum < 0) {
    return { error: "Invalid number of children." };
  }

  // ── Past-date guard ───────────────────────────────────────────────────────
  const tourDateObj = new Date(date + "T00:00:00.000Z");
  const today       = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (tourDateObj < today) {
    return { error: "Tour date must be in the future." };
  }

  // ── Load & validate tour ──────────────────────────────────────────────────
  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour)                          return { error: "Tour not found."        };
  if (tour.status !== "PUBLISHED")    return { error: "This tour is not currently available." };

  const totalGuests = adultsNum + childrenNum;
  if (totalGuests < tour.minGroupSize) {
    return { error: `Minimum group size for this tour is ${tour.minGroupSize}.` };
  }
  if (totalGuests > tour.maxGroupSize) {
    return { error: `Maximum group size for this tour is ${tour.maxGroupSize}.` };
  }

  // ── Recalculate price server-side ─────────────────────────────────────────
  const basePrice     = Number(tour.basePrice);
  const childPrice    = tour.childPrice ? Number(tour.childPrice) : basePrice;
  const tourType      = (tour.tourType as "SOLO" | "GROUP") ?? "GROUP";
  const baseGroupSize = Number(tour.baseGroupSize ?? 4);
  const baseTotal = tourType === "GROUP"
    ? calcGroupPrice(totalGuests, baseGroupSize, basePrice)
    : adultsNum * basePrice + childrenNum * childPrice;

  // Validate variation extra cost server-side
  let serverVariationExtra = 0;
  if (variationId) {
    type Variation = { id: string; extraCost?: number | string };
    const safeParseArr = (v: unknown): Variation[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v as Variation[];
      if (typeof v !== "string") return [];
      try { const p = JSON.parse(v); return Array.isArray(p) ? p as Variation[] : []; } catch { return []; }
    };
    const tourVariations = safeParseArr(tour.variations);
    const matched = tourVariations.find((v) => v.id === variationId);
    serverVariationExtra = matched ? Number(matched.extraCost) : 0;
  }
  const calculatedTotal = baseTotal + serverVariationExtra;

  const session = await auth();
  const isLoggedIn = !!session?.user?.email;
  let customerId: string | null = null;
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    customerId = dbUser?.id ?? null;
  }

  // ── Duplicate booking guard ───────────────────────────────────────────────
  const existing = await prisma.booking.findFirst({
    where: {
      tourId,
      tourDate: tourDateObj,
      guestEmail: email,
      status: { not: "CANCELLED" },
    },
  });
  if (existing) {
    return { error: "You already have a booking for this tour on this date." };
  }

  // ── Atomic capacity check + booking creation ─────────────────────────────
  // Wrapped in a transaction with a SELECT FOR UPDATE to prevent overselling.
  let bookingRef: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the availability row so concurrent requests queue up here
      type AvailRow = {
        id: string;
        status: string;
        bookedCount: number | bigint;
        maxCapacity: number | bigint;
        priceOverride: string | null;
      };

      const rows = await tx.$queryRaw<AvailRow[]>`
        SELECT id, status, bookedCount, maxCapacity, priceOverride
        FROM TourAvailability
        WHERE tourId = ${tourId}
          AND date   = ${date}
        FOR UPDATE
      `;

      const avail = rows[0] ?? null;

      // Cast BigInt to Number (mysql2 may return INT columns as BigInt)
      const bookedCount  = avail ? Number(avail.bookedCount)  : 0;
      const maxCapacity  = avail ? Number(avail.maxCapacity)  : Number(tour.dailyCapacity);
      const spotsLeft    = maxCapacity - bookedCount;

      if (avail) {
        if (avail.status === "CLOSED" || avail.status === "CANCELLED") {
          throw new Error("UNAVAILABLE");
        }
        if (avail.status === "FULL") {
          throw new Error("FULL");
        }
        if (spotsLeft < 1) {
          throw new Error(`CAPACITY:${spotsLeft}`);
        }
      } else {
        // No availability record — guard against dailyCapacity
        if (bookedCount >= maxCapacity) {
          throw new Error(`CAPACITY:0`);
        }
      }

      const ref = generateBookingRef();

      const booking = await tx.booking.create({
        data: {
          bookingRef:     ref,
          tourId,
          availabilityId: avail?.id ?? null,
          customerId,
          guestName:      `${firstName} ${lastName}`,
          guestEmail:     email,
          guestPhone:     phone,
          tourDate:       tourDateObj,
          numAdults:      adultsNum,
          numChildren:    childrenNum,
          specialRequests: [
            specialRequests,
            pickupLocation ? `Pickup: ${pickupLocation}` : "",
            (pickupLat && pickupLng) ? `Pickup coords: ${parseFloat(pickupLat).toFixed(6)},${parseFloat(pickupLng).toFixed(6)}` : "",
            startTime ? `Starting time: ${startTime}` : "",
            variationName ? `Upgrade: ${variationName}` : "",
          ].filter(Boolean).join("\n"),
          subtotal:       calculatedTotal,
          totalAmount:    calculatedTotal,
          discountAmount: 0,
          currency:       "USD",
          paymentMethod:  "STRIPE",
          paymentStatus:  "PENDING",
          status:         "CONFIRMED",
          passengers: {
            create: { firstName, lastName, isLead: true },
          },
        },
      });

      // Each booking consumes 1 slot (not totalGuests)
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

    bookingRef = result.bookingRef;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FULL") {
      return { error: "Sorry, this date is fully booked. Please choose another date." };
    }
    if (msg === "UNAVAILABLE") {
      return { error: "This date is no longer available. Please choose another date." };
    }
    if (msg.startsWith("CAPACITY:")) {
      const spots = msg.split(":")[1];
      return { error: `This date only has ${spots} spot${spots === "1" ? "" : "s"} available. Please reduce your group size or choose another date.` };
    }
    console.error("Booking error:", err);
    return { error: "Failed to process reservation. Please try again." };
  }

  redirect(isLoggedIn ? "/bookings?success=true" : `/?success=true&ref=${bookingRef}`);
}
