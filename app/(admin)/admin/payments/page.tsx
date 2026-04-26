import { prisma } from "@/lib/prisma";
import { COMPANY_CURRENCY, COMPANY_LOCALE, BOOKINGS_PER_PAGE } from "@/lib/constants";
import { PaymentsClient, type PaymentRow } from "@/components/admin/PaymentsClient";

interface PageProps {
  searchParams: Promise<{
    q?:        string;
    status?:   string;
    method?:   string;
    dateFrom?: string;
    dateTo?:   string;
    page?:     string;
  }>;
}

export const metadata = { title: "Payments — GoTripJapan Admin" };

export default async function PaymentsPage({ searchParams }: PageProps) {
  const sp       = await searchParams;
  const query    = sp.q?.trim() ?? "";
  const status   = sp.status   ?? "ALL";
  const method   = sp.method   ?? "ALL";
  const dateFrom = sp.dateFrom ?? "";
  const dateTo   = sp.dateTo   ?? "";
  const page     = Math.max(1, Number(sp.page ?? 1));
  const skip     = (page - 1) * BOOKINGS_PER_PAGE;

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { bookingRef: { contains: query } },
      { guestName:  { contains: query } },
      { guestEmail: { contains: query } },
      { tour: { title: { contains: query } } },
    ];
  }
  if (status !== "ALL") where.paymentStatus = status;
  if (method !== "ALL") where.paymentMethod = method;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom + "T00:00:00.000Z") } : {}),
      ...(dateTo   ? { lte: new Date(dateTo   + "T23:59:59.999Z") } : {}),
    };
  }

  const now              = new Date();
  const thisMonthStart   = new Date(now.getFullYear(), now.getMonth(), 1);

  const [bookings, total, statsData] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: BOOKINGS_PER_PAGE,
      include: { tour: { select: { title: true } } },
    }),

    prisma.booking.count({ where }),

    Promise.all([
      // Total paid revenue (all time)
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
      // Pending amount
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: { in: ["PENDING", "AWAITING_CONFIRMATION"] } },
      }),
      // Refunded amount
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "REFUNDED" },
      }),
      // This month paid
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID", createdAt: { gte: thisMonthStart } },
      }),
      // Counts
      prisma.booking.count({ where: { paymentStatus: "PAID" } }),
      prisma.booking.count({ where: { paymentStatus: { in: ["PENDING", "AWAITING_CONFIRMATION"] } } }),
      prisma.booking.count({ where: { paymentStatus: "REFUNDED" } }),
    ]),
  ]);

  const [
    paidRevenue, pendingRevenue, refundedRevenue, thisMonthRevenue,
    paidCount, pendingCount, refundedCount,
  ] = statsData;

  const payments: PaymentRow[] = bookings.map((b) => ({
    id:             b.id,
    bookingRef:     b.bookingRef,
    guestName:      b.guestName,
    guestEmail:     b.guestEmail,
    tourTitle:      b.tour.title,
    numAdults:      b.numAdults,
    numChildren:    b.numChildren,
    subtotal:       Number(b.subtotal),
    discountAmount: Number(b.discountAmount),
    totalAmount:    Number(b.totalAmount),
    currency:       b.currency,
    paymentMethod:  b.paymentMethod,
    paymentStatus:  b.paymentStatus,
    bookingStatus:  b.status,
    paidAt:         b.paidAt?.toISOString() ?? null,
    createdAt:      b.createdAt.toISOString(),
  }));

  return (
    <div className="p-5 sm:p-7 space-y-1">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">Payments</h1>
        <p className="text-sm text-[#7A746D] mt-0.5">Transaction records and cash flow</p>
      </div>

      <PaymentsClient
        payments={payments}
        stats={{
          totalRevenue:     Number(paidRevenue._sum.totalAmount     ?? 0),
          pendingAmount:    Number(pendingRevenue._sum.totalAmount   ?? 0),
          refundedAmount:   Number(refundedRevenue._sum.totalAmount  ?? 0),
          thisMonthRevenue: Number(thisMonthRevenue._sum.totalAmount ?? 0),
          totalCount:       total,
          paidCount,
          pendingCount,
          refundedCount,
        }}
        total={total}
        page={page}
        perPage={BOOKINGS_PER_PAGE}
        currency={COMPANY_CURRENCY}
        locale={COMPANY_LOCALE}
        q={query}
        status={status}
        method={method}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
