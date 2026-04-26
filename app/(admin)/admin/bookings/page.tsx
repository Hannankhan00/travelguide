import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { COMPANY_CURRENCY, COMPANY_LOCALE, BOOKINGS_PER_PAGE } from "@/lib/constants";
import { BookingsTable } from "@/components/admin/BookingsTable";

export type BookingTab = "today" | "upcoming" | "pending" | "all" | "completed" | "cancelled";
const VALID_TABS: BookingTab[] = ["today", "upcoming", "pending", "all", "completed", "cancelled"];

function getTodayBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { start, end };
}

function buildTabWhere(tab: BookingTab, todayStart: Date, todayEnd: Date): Record<string, unknown> {
  switch (tab) {
    case "today":
      return { tourDate: { gte: todayStart, lt: todayEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } };
    case "upcoming":
      return { tourDate: { gte: todayEnd }, status: { in: ["CONFIRMED", "PENDING"] } };
    case "pending":
      return { paymentStatus: { in: ["PENDING", "AWAITING_CONFIRMATION"] } };
    case "completed":
      return { status: "COMPLETED" };
    case "cancelled":
      return { OR: [{ status: { in: ["CANCELLED", "NO_SHOW"] } }, { paymentStatus: "FAILED" }] };
    case "all":
    default:
      return {};
  }
}

function applyFilters(
  base: Record<string, unknown>,
  q: string,
  payment: string,
  dateFrom: string,
  dateTo: string,
  tourDate: string,
  tab: BookingTab,
): Record<string, unknown> {
  const where = { ...base };

  if (q) {
    const searchOr = [
      { bookingRef: { contains: q } },
      { guestName:  { contains: q } },
      { guestEmail: { contains: q } },
      { tour: { title: { contains: q } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  // Payment filter — skip on pending tab (it already locks paymentStatus)
  if (payment !== "ALL" && tab !== "pending") {
    where.paymentStatus = payment;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom + "T00:00:00.000Z") } : {}),
      ...(dateTo   ? { lte: new Date(dateTo   + "T23:59:59.999Z") } : {}),
    };
  }

  // Today tab locks tourDate to today — ignore any manual tourDate override
  if (tourDate && tab !== "today") {
    where.tourDate = new Date(tourDate + "T00:00:00.000Z");
  }

  return where;
}

interface PageProps {
  searchParams: Promise<{
    tab?:      string;
    q?:        string;
    payment?:  string;
    page?:     string;
    dateFrom?: string;
    dateTo?:   string;
    tourDate?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const tab      = (VALID_TABS.includes(sp.tab as BookingTab) ? sp.tab : "today") as BookingTab;
  const q        = sp.q?.trim() ?? "";
  const payment  = sp.payment  ?? "ALL";
  const dateFrom = sp.dateFrom ?? "";
  const dateTo   = sp.dateTo   ?? "";
  const tourDate = sp.tourDate ?? "";
  const page     = Math.max(1, Number(sp.page ?? 1));
  const skip     = (page - 1) * BOOKINGS_PER_PAGE;

  const { start: todayStart, end: todayEnd } = getTodayBounds();

  const tabWhere      = buildTabWhere(tab, todayStart, todayEnd);
  const filteredWhere = applyFilters(tabWhere, q, payment, dateFrom, dateTo, tourDate, tab);

  const orderBy = (tab === "today" || tab === "upcoming")
    ? { tourDate: "asc"  as const }
    : { createdAt: "desc" as const };

  const [
    bookings,
    total,
    todayCount,
    upcomingCount,
    pendingAgg,
    last24hCount,
    cancelledCount,
    completedCount,
    allCount,
    revenueAgg,
  ] = await Promise.all([
    prisma.booking.findMany({
      where:   filteredWhere,
      skip,
      take:    BOOKINGS_PER_PAGE,
      orderBy,
      include: {
        tour: {
          select: {
            title:  true,
            slug:   true,
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
        passengers: { select: { firstName: true, lastName: true, isLead: true } },
      },
    }),
    prisma.booking.count({ where: filteredWhere }),

    // Tab badge counts — always unaffected by search/payment/date filters
    prisma.booking.count({
      where: { tourDate: { gte: todayStart, lt: todayEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
    }),
    prisma.booking.count({
      where: { tourDate: { gte: todayEnd }, status: { in: ["CONFIRMED", "PENDING"] } },
    }),
    prisma.booking.aggregate({
      _count: { id: true },
      _sum:   { totalAmount: true },
      where:  { paymentStatus: { in: ["PENDING", "AWAITING_CONFIRMATION"] } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.booking.count({
      where: { OR: [{ status: { in: ["CANCELLED", "NO_SHOW"] } }, { paymentStatus: "FAILED" }] },
    }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({}),
    prisma.booking.aggregate({
      _sum:  { totalAmount: true },
      where: { paymentStatus: "PAID" },
    }),
  ]);

  const totalPages   = Math.ceil(total / BOOKINGS_PER_PAGE);
  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);
  const pendingCount = pendingAgg._count.id;
  const pendingValue = Number(pendingAgg._sum.totalAmount ?? 0);

  const serialized = bookings.map((b) => ({
    id:              b.id,
    bookingRef:      b.bookingRef,
    tourTitle:       b.tour.title,
    tourSlug:        b.tour.slug,
    tourImage:       b.tour.images[0]?.url ?? null,
    guestName:       b.guestName ?? b.passengers.find((p) => p.isLead)?.firstName ?? "Guest",
    guestEmail:      b.guestEmail,
    guestPhone:      b.guestPhone ?? null,
    tourDate:        b.tourDate.toISOString(),
    numAdults:       b.numAdults,
    numChildren:     b.numChildren,
    totalAmount:     Number(b.totalAmount),
    currency:        b.currency,
    status:          b.status,
    paymentStatus:   b.paymentStatus,
    paymentMethod:   b.paymentMethod,
    adminNotes:      b.adminNotes ?? "",
    specialRequests: b.specialRequests ?? "",
    createdAt:       b.createdAt.toISOString(),
    paidAt:          b.paidAt?.toISOString() ?? null,
  }));

  const tabCounts = {
    today:     todayCount,
    upcoming:  upcomingCount,
    pending:   pendingCount,
    all:       allCount,
    completed: completedCount,
    cancelled: cancelledCount,
  };

  const kpis = [
    {
      label: "Revenue collected",
      value: formatPrice(totalRevenue, COMPANY_CURRENCY, COMPANY_LOCALE),
      sub:   "all time · paid bookings",
      accent: "text-[#15803D]",
      border: "border-l-[#15803D]",
    },
    {
      label: "Today's tours",
      value: String(todayCount),
      sub:   todayCount === 1 ? "tour running today" : "tours running today",
      accent: "text-[#1B2847]",
      border: "border-l-[#1B2847]",
    },
    {
      label: "Pending payments",
      value: String(pendingCount),
      sub:   `${formatPrice(pendingValue, COMPANY_CURRENCY, COMPANY_LOCALE)} at risk`,
      accent: pendingCount > 0 ? "text-[#B45309]" : "text-[#7A746D]",
      border: pendingCount > 0 ? "border-l-[#B45309]" : "border-l-[#E4E0D9]",
    },
    {
      label: "New bookings (24h)",
      value: String(last24hCount),
      sub:   "created in the last 24 hours",
      accent: last24hCount > 0 ? "text-[#C41230]" : "text-[#7A746D]",
      border: last24hCount > 0 ? "border-l-[#C41230]" : "border-l-[#E4E0D9]",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111111]">Bookings</h1>
        <p className="text-sm text-[#7A746D] mt-0.5">
          {allCount.toLocaleString()} total &middot;{" "}
          {formatPrice(totalRevenue, COMPANY_CURRENCY, COMPANY_LOCALE)} collected
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, accent, border }) => (
          <div
            key={label}
            className={`bg-white rounded-xl border border-[#E4E0D9] border-l-4 ${border} px-4 py-4`}
          >
            <p className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold leading-tight ${accent}`}>{value}</p>
            <p className="text-[11px] text-[#A8A29E] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <BookingsTable
        bookings={serialized}
        total={total}
        page={page}
        totalPages={totalPages}
        tab={tab}
        tabCounts={tabCounts}
        query={q}
        payment={payment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        tourDate={tourDate}
        currency={COMPANY_CURRENCY}
        locale={COMPANY_LOCALE}
      />
    </div>
  );
}
