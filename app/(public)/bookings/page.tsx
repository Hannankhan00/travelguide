import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { BookingCard } from "@/components/public/BookingCard";

export default async function CustomerBookingsPage() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in CustomerBookingsPage:", e);
  }

  if (!session?.user) redirect("/?auth=login");

  const bookings = await prisma.booking.findMany({
    where:   { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tour: {
        select: {
          title:    true,
          slug:     true,
          location: true,
          images:   { where: { isPrimary: true }, select: { url: true }, take: 1 },
        },
      },
    },
  });

  const serialized = bookings.map((b) => ({
    id:              b.id,
    bookingRef:      b.bookingRef,
    status:          b.status,
    paymentStatus:   b.paymentStatus,
    paymentMethod:   b.paymentMethod,
    tourDate:        b.tourDate.toISOString(),
    numAdults:       b.numAdults,
    numChildren:     b.numChildren,
    totalAmount:     Number(b.totalAmount),
    currency:        b.currency,
    specialRequests: b.specialRequests ?? null,
    createdAt:       b.createdAt.toISOString(),
    tour: {
      title:    b.tour.title,
      slug:     b.tour.slug,
      location: b.tour.location,
      image:    b.tour.images[0]?.url ?? null,
    },
  }));

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-[#111]">My Bookings</h1>
          <p className="text-[#545454] mt-2">Manage your upcoming trips and view past experiences.</p>
        </div>

        {serialized.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E0D9] p-12 text-center shadow-sm">
            <Calendar className="size-12 text-[#E4E0D9] mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display text-[#111] mb-2">No bookings yet</h3>
            <p className="text-[#7A746D] mb-6">Looks like you haven&apos;t booked any tours yet.</p>
            <Link href="/tours" className="inline-block bg-[#C41230] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#A00F27] transition-colors">
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {serialized.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
