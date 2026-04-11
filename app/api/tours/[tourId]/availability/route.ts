import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> }
) {
  const { tourId } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month param required (YYYY-MM)" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end   = new Date(Date.UTC(year, mon,     0, 23, 59, 59));

  const records = await prisma.tourAvailability.findMany({
    where: { tourId, date: { gte: start, lte: end } },
    select: {
      id: true, date: true, status: true,
      maxCapacity: true, bookedCount: true,
      priceOverride: true, startTime: true,
    },
    orderBy: { date: "asc" },
  });

  // Serialize Decimal → string, Date → "YYYY-MM-DD"
  const payload = records.map((r) => ({
    ...r,
    date:          r.date.toISOString().slice(0, 10),
    priceOverride: r.priceOverride ? r.priceOverride.toString() : null,
  }));

  return NextResponse.json(payload);
}
