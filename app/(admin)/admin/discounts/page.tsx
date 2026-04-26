import { listDiscountCodesAction } from "./actions";
import { prisma } from "@/lib/prisma";
import { DiscountsClient } from "./DiscountsClient";
import { COMPANY_CURRENCY } from "@/lib/constants";

export const metadata = { title: "Discounts — Admin" };

export default async function DiscountsPage() {
  const [rawDiscounts, tours] = await Promise.all([
    listDiscountCodesAction(),
    prisma.tour.findMany({
      where:   { status: { not: "ARCHIVED" } },
      select:  { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // Prisma returns Decimal for discountValue / minBookingAmount.
  // DiscountsClient expects plain numbers — serialize here at the boundary.
  const discounts = rawDiscounts.map((d) => ({
    ...d,
    discountValue:    Number(d.discountValue),
    minBookingAmount: d.minBookingAmount != null ? Number(d.minBookingAmount) : null,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111]">Discounts</h1>
        <p className="text-sm text-[#7A746D] mt-0.5">Create and manage discount codes for your tours.</p>
      </div>

      <DiscountsClient
        discounts={discounts}
        tours={tours}
        currency={COMPANY_CURRENCY}
      />
    </div>
  );
}
