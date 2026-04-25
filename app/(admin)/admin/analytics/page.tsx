import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { COMPANY_CURRENCY, COMPANY_LOCALE } from "@/lib/constants";
import { TrendingUp, CalendarCheck, Users, DollarSign, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { BookingStatusChart } from "@/components/admin/BookingStatusChart";
import { DateFilter } from "@/components/admin/DateFilter";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getAnalyticsData(dateFrom: string, dateTo: string) {
  const now = new Date();
  
  let currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let currentEnd = new Date();
  let prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const isCustomDate = !!(dateFrom || dateTo);

  if (isCustomDate) {
    currentStart = dateFrom ? new Date(dateFrom + "T00:00:00.000Z") : new Date(0);
    currentEnd = dateTo ? new Date(dateTo + "T23:59:59.999Z") : new Date();
    
    const diff = currentEnd.getTime() - currentStart.getTime();
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - diff);
  }

  const twelveMonthsAgo  = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const [
    allBookings,
    thisMonthBookings,
    lastMonthBookings,
    thisMonthRevenue,
    lastMonthRevenue,
    topTours,
    statusBreakdown,
    totalCustomers,
  ] = await Promise.all([
    // All bookings for 12-month trend
    prisma.booking.findMany({
      where:  { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    // Current period count
    prisma.booking.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    // Previous period count
    prisma.booking.count({
      where: { createdAt: { gte: prevStart, lt: prevEnd } },
    }),
    // Current period revenue (paid)
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID", createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    // Previous period revenue
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: prevStart, lt: prevEnd },
      },
    }),
    // Top tours by revenue
    prisma.booking.groupBy({
      by:      ["tourId"],
      _sum:    { totalAmount: true },
      _count:  { id: true },
      where:   { paymentStatus: "PAID", createdAt: { gte: currentStart, lte: currentEnd } },
      orderBy: { _sum: { totalAmount: "desc" } },
      take:    5,
    }),
    // Status breakdown
    prisma.booking.groupBy({
      by:     ["status"],
      _count: { id: true },
      where:  { createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    // Customer count — pulled in parallel rather than sequentially in the page
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  // Resolve tour names for top tours
  const tourIds = topTours.map((t) => t.tourId);
  const tours   = await prisma.tour.findMany({
    where:  { id: { in: tourIds } },
    select: { id: true, title: true, rating: true, reviewCount: true },
  });
  const tourMap = Object.fromEntries(tours.map((t) => [t.id, t]));

  // Build 12-month revenue + bookings series
  const monthLabels: string[] = [];
  const revenueByMonth: number[] = [];
  const bookingsByMonth: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleString("en-US", { month: "short", year: "2-digit" }));

    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthBookings = allBookings.filter(
      (b) => b.createdAt >= monthStart && b.createdAt < monthEnd
    );

    const monthRev = monthBookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    revenueByMonth.push(monthRev);
    bookingsByMonth.push(monthBookings.length);
  }

  const thisRev  = Number(thisMonthRevenue._sum.totalAmount ?? 0);
  const lastRev  = Number(lastMonthRevenue._sum.totalAmount ?? 0);
  const revDelta = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : null;

  const bkgDelta =
    lastMonthBookings > 0
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
      : null;

  const totalPaid = allBookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const paidCount = allBookings.filter((b) => b.paymentStatus === "PAID").length;
  const avgBookingValue = paidCount > 0 ? totalPaid / paidCount : 0;

  return {
    thisMonthRevenue:  thisRev,
    lastMonthRevenue:  lastRev,
    revDelta,
    thisMonthBookings,
    lastMonthBookings,
    bkgDelta,
    avgBookingValue,
    totalCustomers,
    monthLabels,
    revenueByMonth,
    bookingsByMonth,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count:  s._count.id,
    })),
    topTours: topTours.map((t) => ({
      tourId:   t.tourId,
      title:    tourMap[t.tourId]?.title ?? "Unknown",
      rating:   Number(tourMap[t.tourId]?.rating ?? 0),
      reviews:  tourMap[t.tourId]?.reviewCount ?? 0,
      revenue:  Number(t._sum.totalAmount ?? 0),
      bookings: t._count.id,
    })),
    isCustomDate,
  };
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-[#A8A29E]">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-[#15803D]" : "text-[#DC2626]"}`}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?:   string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";

  const data = await getAnalyticsData(dateFrom, dateTo);

  const STATUS_LABEL: Record<string, string> = {
    PENDING:   "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    NO_SHOW:   "No Show",
  };

  const kpis = [
    {
      label:  data.isCustomDate ? "Revenue (selected period)" : "Revenue this month",
      value:  formatPrice(data.thisMonthRevenue, COMPANY_CURRENCY, COMPANY_LOCALE),
      delta:  data.revDelta,
      sub:    data.isCustomDate ? `Prev period: ${formatPrice(data.lastMonthRevenue, COMPANY_CURRENCY, COMPANY_LOCALE)}` : `Last month: ${formatPrice(data.lastMonthRevenue, COMPANY_CURRENCY, COMPANY_LOCALE)}`,
      icon:   DollarSign,
      color:  "text-[#15803D]",
      bg:     "bg-[#DCFCE7]",
    },
    {
      label:  data.isCustomDate ? "Bookings (selected period)" : "Bookings this month",
      value:  data.thisMonthBookings.toLocaleString(),
      delta:  data.bkgDelta,
      sub:    data.isCustomDate ? `Prev period: ${data.lastMonthBookings}` : `Last month: ${data.lastMonthBookings}`,
      icon:   CalendarCheck,
      color:  "text-[#C41230]",
      bg:     "bg-[#F5E6E9]",
    },
    {
      label:  "Avg booking value",
      value:  formatPrice(data.avgBookingValue, COMPANY_CURRENCY, COMPANY_LOCALE),
      delta:  null,
      sub:    "All-time, paid bookings",
      icon:   TrendingUp,
      color:  "text-[#1B6FA8]",
      bg:     "bg-[#DBEAFE]",
    },
    {
      label:  "Total customers",
      value:  data.totalCustomers.toLocaleString(),
      delta:  null,
      sub:    "Registered accounts",
      icon:   Users,
      color:  "text-[#C8A84B]",
      bg:     "bg-[#F7F0DC]",
    },
  ];

  const chartData = data.monthLabels.map((month, i) => ({
    month,
    revenue:  data.revenueByMonth[i],
    bookings: data.bookingsByMonth[i],
  }));

  const statusData = data.statusBreakdown.map((s) => ({
    name:  STATUS_LABEL[s.status] ?? s.status,
    value: s.count,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Analytics</h1>
          <p className="text-sm text-[#7A746D] mt-0.5">
            Revenue trends, bookings over time, and tour performance.
          </p>
        </div>
        <DateFilter />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, delta, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-[#E4E0D9] shadow-(--shadow-card)">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <Delta value={delta} />
            </div>
            <p className="text-2xl font-bold text-[#111111] leading-none mb-1">{value}</p>
            <p className="text-xs font-medium text-[#7A746D]">{label}</p>
            <p className="text-[11px] text-[#A8A29E] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue + bookings trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) p-6">
          <h2 className="text-sm font-semibold text-[#111111] mb-1">Revenue & Bookings — Last 12 months</h2>
          <p className="text-xs text-[#A8A29E] mb-6">Bars = revenue (paid), line = booking count</p>
          <RevenueChart data={chartData} currency={COMPANY_CURRENCY} locale={COMPANY_LOCALE} />
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) p-6">
          <h2 className="text-sm font-semibold text-[#111111] mb-1">Booking status</h2>
          <p className="text-xs text-[#A8A29E] mb-6">{data.isCustomDate ? "Selected Period" : "All time"}</p>
          <BookingStatusChart data={statusData} />
        </div>
      </div>

      {/* Top tours */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E0D9]">
          <h2 className="text-sm font-semibold text-[#111111]">Top tours by revenue</h2>
        </div>
        {data.topTours.length === 0 ? (
          <p className="py-14 text-center text-sm text-[#A8A29E]">No paid bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D9] bg-[#F8F7F5]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Tour</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Bookings</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Rating</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D9]">
                {data.topTours.map((tour, i) => (
                  <tr key={tour.tourId} className="hover:bg-[#F8F7F5] transition-colors">
                    <td className="px-6 py-3.5 text-[#A8A29E] font-mono text-xs">{i + 1}</td>
                    <td className="px-6 py-3.5 font-medium text-[#111111] max-w-64 truncate">{tour.title}</td>
                    <td className="px-6 py-3.5 text-[#545454]">{tour.bookings}</td>
                    <td className="px-6 py-3.5">
                      {tour.rating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309]">
                          <Star className="size-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                          {tour.rating.toFixed(1)}
                          <span className="text-[#A8A29E] font-normal">({tour.reviews})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#A8A29E]">No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#111111]">
                      {formatPrice(tour.revenue, COMPANY_CURRENCY, COMPANY_LOCALE)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
