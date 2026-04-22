import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { COMPANY_CURRENCY, COMPANY_LOCALE } from "@/lib/constants";
import {
  CalendarCheck,
  TrendingUp,
  Map,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { DateFilter } from "@/components/admin/DateFilter";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getStats(dateFrom: string, dateTo: string) {
  try {
    const whereDate: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      whereDate.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom + "T00:00:00.000Z") } : {}),
        ...(dateTo   ? { lte: new Date(dateTo   + "T23:59:59.999Z") } : {}),
      };
    }

    const [totalBookings, revenue, activeTours, totalCustomers, recentBookings] =
      await Promise.all([
        prisma.booking.count({ where: whereDate }),
        prisma.booking.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: "PAID", ...whereDate },
        }),
        prisma.tour.count({ where: { status: "PUBLISHED" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.booking.findMany({
          take: 8,
          where: whereDate,
          orderBy: { createdAt: "desc" },
          include: {
            tour: { select: { title: true } },
          },
        }),
      ]);

    return {
      totalBookings,
      revenue: Number(revenue._sum.totalAmount ?? 0),
      activeTours,
      totalCustomers,
      recentBookings,
    };
  } catch {
    return {
      totalBookings: 0,
      revenue: 0,
      activeTours: 0,
      totalCustomers: 0,
      recentBookings: [],
    };
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────

const statusConfig = {
  PENDING:   { label: "Pending",   color: "bg-[#FEF3C7] text-[#B45309]",   icon: Clock       },
  CONFIRMED: { label: "Confirmed", color: "bg-[#DCFCE7] text-[#15803D]",   icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-[#FEE2E2] text-[#DC2626]",   icon: XCircle     },
  COMPLETED: { label: "Completed", color: "bg-[#DBEAFE] text-[#1B6FA8]",   icon: CheckCircle2 },
  NO_SHOW:   { label: "No Show",   color: "bg-[#F1EFE9] text-[#7A746D]",   icon: AlertCircle  },
} as const;

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?:   string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";

  const { totalBookings, revenue, activeTours, totalCustomers, recentBookings } =
    await getStats(dateFrom, dateTo);

  const stats = [
    {
      label:   "Total Bookings",
      value:   totalBookings.toLocaleString(),
      icon:    CalendarCheck,
      color:   "text-[#C41230]",
      bg:      "bg-[#F5E6E9]",
      border:  "border-[#C41230]/20",
    },
    {
      label:   "Total Revenue",
      value:   formatPrice(revenue, COMPANY_CURRENCY, COMPANY_LOCALE),
      icon:    TrendingUp,
      color:   "text-[#15803D]",
      bg:      "bg-[#DCFCE7]",
      border:  "border-[#15803D]/20",
    },
    {
      label:   "Active Tours",
      value:   activeTours.toLocaleString(),
      icon:    Map,
      color:   "text-[#1B6FA8]",
      bg:      "bg-[#DBEAFE]",
      border:  "border-[#1B6FA8]/20",
    },
    {
      label:   "Customers",
      value:   totalCustomers.toLocaleString(),
      icon:    Users,
      color:   "text-[#C8A84B]",
      bg:      "bg-[#F7F0DC]",
      border:  "border-[#C8A84B]/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Dashboard</h1>
          <p className="text-sm text-[#7A746D] mt-0.5">
            Welcome back. Here&apos;s what&apos;s happening with your tours today.
          </p>
        </div>
        <DateFilter />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`bg-white rounded-xl p-5 border ${border} shadow-(--shadow-card) flex items-start gap-4`}
          >
            <div className={`shrink-0 w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#7A746D] mb-0.5">{label}</p>
              <p className="text-xl font-bold text-[#111111] leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E0D9]">
          <h2 className="text-sm font-semibold text-[#111111]">Recent Bookings</h2>
          <a
            href="/admin/bookings"
            className="text-xs text-[#C41230] font-medium hover:underline"
          >
            View all →
          </a>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-14 text-center text-[#A8A29E] text-sm">
            No bookings yet. They&apos;ll appear here once customers start booking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D9] bg-[#F8F7F5]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Guest</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Tour</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D9]">
                {recentBookings.map((booking) => {
                  const cfg = statusConfig[booking.status] ?? statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={booking.id} className="hover:bg-[#F8F7F5] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-[#7A746D]">
                        {booking.bookingRef}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#111111]">{booking.guestName ?? "Guest"}</p>
                        <p className="text-xs text-[#7A746D]">{booking.guestEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#111111] max-w-45 truncate">
                        {booking.tour.title}
                      </td>
                      <td className="px-5 py-3.5 text-[#7A746D] whitespace-nowrap">
                        {new Date(booking.tourDate).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#111111]">
                        {formatPrice(Number(booking.totalAmount), booking.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
