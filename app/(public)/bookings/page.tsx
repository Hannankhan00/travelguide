import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Calendar, Users, MapPin, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function CustomerBookingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/?auth=login");
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tour: {
        include: { images: true }
      }
    }
  });

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-[#111]">My Bookings</h1>
          <p className="text-[#545454] mt-2">Manage your upcoming trips and view past experiences.</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E0D9] p-12 text-center shadow-sm">
            <Calendar className="size-12 text-[#E4E0D9] mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display text-[#111] mb-2">No bookings yet</h3>
            <p className="text-[#7A746D] mb-6">Looks like you haven't booked any tours with us yet.</p>
            <Link href="/tours" className="inline-block bg-[#C41230] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#A00F27] transition-colors">
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const primaryImage = booking.tour.images.find(img => img.isPrimary)?.url || booking.tour.images[0]?.url;
              const dateObj = new Date(booking.tourDate);
              const isPast = dateObj < new Date();

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-md">
                  
                  {/* Image Column */}
                  <div className="md:w-70 h-48 md:h-auto relative shrink-0">
                    {primaryImage ? (
                      <Image src={primaryImage} alt={booking.tour.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#F8F7F5]" />
                    )}
                    {booking.status === "CONFIRMED" && !isPast && (
                      <div className="absolute top-3 left-3 bg-[#15803D] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        Confirmed
                      </div>
                    )}
                    {booking.status === "CANCELLED" && (
                      <div className="absolute top-3 left-3 bg-[#C41230] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        Cancelled
                      </div>
                    )}
                  </div>

                  {/* Details Column */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold font-display text-[#111] group-hover:text-[#C41230] transition-colors">
                        <Link href={`/tours/${booking.tour.slug}`}>{booking.tour.title}</Link>
                      </h3>
                      <span className="text-[#545454] text-sm font-medium shrink-0 ml-4 max-md:hidden">Ref: {booking.bookingRef}</span>
                    </div>

                    <div className="flex items-center text-[#7A746D] text-sm mb-4">
                      <MapPin className="size-4 mr-1" /> {booking.tour.location}
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-[#111] mb-6">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="size-4 text-[#A8A29E]" />
                        <span className="font-medium">{dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Users className="size-4 text-[#A8A29E]" />
                        <span className="font-medium">{booking.numAdults} Adults{booking.numChildren > 0 ? `, ${booking.numChildren} Children` : ""}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[#E4E0D9] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-sm text-[#7A746D] block">Total Amount</span>
                        <span className="font-bold text-lg text-[#111]">${Number(booking.totalAmount).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {!isPast && booking.status === "CONFIRMED" && (
                          <button className="text-sm font-bold text-[#111] border border-[#E4E0D9] bg-white hover:bg-[#F8F7F5] transition-colors px-4 py-2 rounded-lg">
                            Manage Booking
                          </button>
                        )}
                        {isPast && booking.status === "CONFIRMED" && (
                          <Link href={`/tours/${booking.tour.slug}#reviews`} className="text-sm font-bold text-[#1B2847] border border-[#1B2847] hover:bg-[#F8F7F5] transition-colors px-4 py-2 rounded-lg">
                            Leave Review
                          </Link>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
