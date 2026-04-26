import { NextRequest, NextResponse } from "next/server";
import { prisma }              from "@/lib/prisma";
import { createPayPalOrder }   from "@/lib/paypal";
import { calcGroupPrice }      from "@/lib/utils";
import { COMPANY_CURRENCY }    from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tourId, adults, children, variationId } = body as Record<string, string>;

    if (!tourId) {
      return NextResponse.json({ error: "Missing tourId" }, { status: 400 });
    }

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour || tour.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Tour not available" }, { status: 404 });
    }

    const adultsNum   = Math.max(1, parseInt(adults   ?? "1", 10));
    const childrenNum = Math.max(0, parseInt(children ?? "0", 10));
    const totalGuests = adultsNum + childrenNum;

    const basePrice     = Number(tour.basePrice);
    const childPrice    = tour.childPrice ? Number(tour.childPrice) : basePrice;
    const tourType      = (tour.tourType as "SOLO" | "GROUP") ?? "GROUP";
    const baseGroupSize = Number(tour.baseGroupSize ?? 4);

    const baseTotal =
      tourType === "GROUP"
        ? calcGroupPrice(totalGuests, baseGroupSize, basePrice)
        : adultsNum * basePrice + childrenNum * childPrice;

    let variationExtra = 0;
    if (variationId) {
      type Variation = { id: string; extraCost?: number | string };
      const safeArr = (v: unknown): Variation[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v as Variation[];
        if (typeof v !== "string") return [];
        try { const p = JSON.parse(v); return Array.isArray(p) ? p as Variation[] : []; } catch { return []; }
      };
      const matched = safeArr(tour.variations).find((v) => v.id === variationId);
      variationExtra = matched ? Number(matched.extraCost) : 0;
    }

    const totalAmount = baseTotal + variationExtra;
    const currency    = COMPANY_CURRENCY || "USD";

    const order = await createPayPalOrder(totalAmount, currency, tour.title);
    return NextResponse.json({ orderId: order.id });
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal/create-order]", msg);
    // Surface credentials-missing errors clearly; keep other details server-side only
    if (msg.includes("credentials not configured")) {
      return NextResponse.json({ error: "PayPal is not configured on this server. Please contact support." }, { status: 503 });
    }
    if (msg.includes("PayPal auth failed")) {
      return NextResponse.json({ error: "PayPal authentication failed. Please contact support." }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }
}
