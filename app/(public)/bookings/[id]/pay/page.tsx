import { auth }                  from "@/lib/auth";
import { prisma }                from "@/lib/prisma";
import { redirect, notFound }    from "next/navigation";
import { CompletePaymentForm }   from "@/components/public/CompletePaymentForm";
import { Calendar, MapPin, Users, Hash } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

export default async function CompletePaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/?auth=login");

  const booking = await prisma.booking.findUnique({
    where:  { id },
    select: {
      id:            true,
      bookingRef:    true,
      customerId:    true,
      paymentStatus: true,
      status:        true,
      tourDate:      true,
      numAdults:     true,
      numChildren:   true,
      totalAmount:   true,
      currency:      true,
      tour: {
        select: {
          title:    true,
          location: true,
          images:   { where: { isPrimary: true }, select: { url: true }, take: 1 },
        },
      },
    },
  });

  if (!booking || booking.customerId !== session.user.id) notFound();

  // Already paid or done — bounce back to bookings
  if (booking.paymentStatus === "PAID") redirect("/bookings");
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") redirect("/bookings");

  const total    = Number(booking.totalAmount);
  const currency = booking.currency || "USD";
  const fmtTotal = new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(total);

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-[#111]">Complete Payment</h1>
          <p className="text-[#545454] mt-2">Finish paying for your booking to confirm your spot.</p>
        </div>

        {/* Booking summary */}
        <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm p-6 mb-6">
          <h2 className="font-bold text-[#111] text-lg font-display mb-4">{booking.tour.title}</h2>

          <div className="space-y-3 text-sm text-[#545454]">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#A8A29E] shrink-0" />
              {booking.tour.location}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#A8A29E] shrink-0" />
              {fmtDate(booking.tourDate)}
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[#A8A29E] shrink-0" />
              {booking.numAdults} adult{booking.numAdults !== 1 ? "s" : ""}
              {booking.numChildren > 0 ? ` · ${booking.numChildren} child${booking.numChildren !== 1 ? "ren" : ""}` : ""}
            </div>
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-[#A8A29E] shrink-0" />
              <span className="font-mono font-semibold text-[#1B2847]">{booking.bookingRef}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E4E0D9] flex items-center justify-between">
            <span className="text-sm text-[#7A746D]">Amount due</span>
            <span className="text-2xl font-bold text-[#111]">{fmtTotal}</span>
          </div>
        </div>

        {/* PayPal buttons */}
        <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm p-6">
          <CompletePaymentForm
            bookingId={booking.id}
            totalAmount={total}
            currency={currency}
          />
        </div>

      </div>
    </div>
  );
}
