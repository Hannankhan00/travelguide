import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Mail, Phone, Calendar, Users, DollarSign,
  BookOpen, ArrowLeft, MapPin,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-[#DCFCE7] text-[#15803D]",
  PENDING:   "bg-[#FEF3C7] text-[#B45309]",
  COMPLETED: "bg-[#DBEAFE] text-[#1B6FA8]",
  CANCELLED: "bg-[#FEE2E2] text-[#DC2626]",
  NO_SHOW:   "bg-[#F1EFE9] text-[#7A746D]",
};
const PAY_COLOR: Record<string, string> = {
  PAID:                  "text-[#15803D]",
  PENDING:               "text-[#B45309]",
  AWAITING_CONFIRMATION: "text-[#1B6FA8]",
  REFUNDED:              "text-[#7A746D]",
  FAILED:                "text-[#DC2626]",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        include: {
          tour: {
            select: {
              title:  true,
              slug:   true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") notFound();

  const paidBookings  = customer.bookings.filter((b) => b.paymentStatus === "PAID");
  const totalSpent    = paidBookings.reduce((s, b) => s + Number(b.totalAmount), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-[#7A746D] hover:text-[#111] transition-colors">
        <ArrowLeft className="size-4" /> All customers
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) p-6">
        <div className="flex items-start gap-5">
          <div className="size-16 rounded-full bg-[#1B2847] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {(customer.name ?? customer.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#111]">{customer.name ?? "Unnamed Customer"}</h1>
            {customer.email && (
              <a href={"mailto:" + customer.email} className="flex items-center gap-1.5 text-sm text-[#C41230] hover:underline mt-1">
                <Mail className="size-3.5" />{customer.email}
              </a>
            )}
            {customer.phone && (
              <a href={"tel:" + customer.phone} className="flex items-center gap-1.5 text-sm text-[#7A746D] hover:underline mt-1">
                <Phone className="size-3.5" />{customer.phone}
              </a>
            )}
            <p className="text-xs text-[#A8A29E] mt-2 flex items-center gap-1">
              <Calendar className="size-3" />
              Joined {new Date(customer.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 shrink-0">
            {[
              { label: "Bookings",    value: customer.bookings.length, icon: BookOpen   },
              { label: "Total Spent", value: formatPrice(totalSpent, "USD"), icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="size-5 text-[#C41230] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#111]">{value}</p>
                <p className="text-xs text-[#7A746D]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking history */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E0D9]">
          <h2 className="font-bold text-[#111]">Booking History</h2>
          <p className="text-xs text-[#7A746D] mt-0.5">{customer.bookings.length} booking{customer.bookings.length !== 1 ? "s" : ""}</p>
        </div>

        {customer.bookings.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#A8A29E]">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F7F5] border-b border-[#E4E0D9]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Tour</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Guests</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D9]">
                {customer.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8F7F5] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#E4E0D9] overflow-hidden shrink-0">
                          {b.tour.images[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.tour.images[0].url} alt={b.tour.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="size-4 text-[#A8A29E]" />
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/admin/bookings`}
                          className="font-medium text-[#111] hover:text-[#C41230] transition-colors max-w-50 truncate block"
                        >
                          {b.tour.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#1B2847] font-semibold">{b.bookingRef}</td>
                    <td className="px-5 py-3.5 text-[#7A746D]">
                      {new Date(b.tourDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-[#7A746D]">
                      <span className="flex items-center gap-1"><Users className="size-3.5" />{b.numAdults + b.numChildren}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      <span className={PAY_COLOR[b.paymentStatus] ?? "text-[#111]"}>
                        {formatPrice(Number(b.totalAmount), b.currency)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status] ?? "bg-[#F1EFE9] text-[#7A746D]"}`}>
                        {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                      </span>
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
