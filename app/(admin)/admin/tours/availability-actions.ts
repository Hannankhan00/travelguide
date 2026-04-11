"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export type AvailabilityInput = {
  date: string;           // "YYYY-MM-DD"
  status: "AVAILABLE" | "FULL" | "CLOSED" | "CANCELLED";
  maxCapacity: number;
  priceOverride?: number | null;
  startTime?: string | null;
};

/** Upsert a single date's availability. Creates if missing, updates if exists. */
export async function upsertAvailability(tourId: string, input: AvailabilityInput) {
  await assertAdmin();

  const date = new Date(input.date + "T00:00:00.000Z");

  await prisma.tourAvailability.upsert({
    where: { tourId_date: { tourId, date } },
    create: {
      tourId,
      date,
      status:        input.status,
      maxCapacity:   input.maxCapacity,
      priceOverride: input.priceOverride ?? null,
      startTime:     input.startTime ?? null,
    },
    update: {
      status:        input.status,
      maxCapacity:   input.maxCapacity,
      priceOverride: input.priceOverride ?? null,
      startTime:     input.startTime ?? null,
    },
  });

  revalidatePath(`/admin/tours/${tourId}/availability`);
  return { success: true };
}

/** Bulk-upsert: apply the same settings across a date range. */
export async function bulkUpsertAvailability(
  tourId: string,
  startDate: string,
  endDate: string,
  input: Omit<AvailabilityInput, "date">,
  skipDays: number[] = [] // 0=Sun,1=Mon,...,6=Sat
) {
  await assertAdmin();

  const start = new Date(startDate + "T00:00:00.000Z");
  const end   = new Date(endDate   + "T00:00:00.000Z");

  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!skipDays.includes(cursor.getUTCDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const date of dates) {
    await prisma.tourAvailability.upsert({
      where: { tourId_date: { tourId, date } },
      create: {
        tourId, date,
        status:        input.status,
        maxCapacity:   input.maxCapacity,
        priceOverride: input.priceOverride ?? null,
        startTime:     input.startTime ?? null,
      },
      update: {
        status:        input.status,
        maxCapacity:   input.maxCapacity,
        priceOverride: input.priceOverride ?? null,
        startTime:     input.startTime ?? null,
      },
    });
  }

  revalidatePath(`/admin/tours/${tourId}/availability`);
  return { success: true, count: dates.length };
}

/** Delete a single availability record by id. */
export async function deleteAvailability(tourId: string, availId: string) {
  await assertAdmin();
  await prisma.tourAvailability.delete({ where: { id: availId } });
  revalidatePath(`/admin/tours/${tourId}/availability`);
  return { success: true };
}

/** Load all availability for a month (server-side for admin page SSR). */
export async function getAvailabilityForMonth(tourId: string, year: number, month: number) {
  await assertAdmin();

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month,     0, 23, 59, 59));

  const records = await prisma.tourAvailability.findMany({
    where: { tourId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  return records.map((r) => ({
    ...r,
    date:          r.date.toISOString().slice(0, 10),
    priceOverride: r.priceOverride ? r.priceOverride.toString() : null,
  }));
}
