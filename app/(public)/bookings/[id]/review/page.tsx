import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewFormClient } from "./ReviewFormClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Leave a Review — GoTripJapan" };

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params;

  let session = null;
  try { session = await auth(); } catch {}

  if (!session?.user?.id) redirect(`/bookings`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tour: {
        select: {
          id:          true,
          title:       true,
          slug:        true,
          reviewCount: true,
          rating:      true,
          reviews: {
            where:   { userId: session.user.id },
            select:  { id: true },
            take:    1,
          },
        },
      },
    },
  });

  if (!booking || booking.customerId !== session.user.id) notFound();
  if (booking.status !== "COMPLETED") redirect("/bookings");

  const alreadyReviewed = (booking.tour.reviews?.length ?? 0) > 0;

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">

        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-[#7A746D] hover:text-[#111] transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to My Bookings
        </Link>

        <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-[#1B2847] px-8 py-7">
            <div className="flex items-center gap-3 mb-1">
              <Star className="size-5 text-[#D4AF37] fill-[#D4AF37]" />
              <p className="text-white/70 text-sm font-medium">Share your experience</p>
            </div>
            <h1 className="text-white font-bold font-display text-xl leading-snug">
              {booking.tour.title}
            </h1>
            <p className="text-white/50 text-xs mt-1">
              Tour date: {new Date(booking.tourDate).toLocaleDateString("en-US", {
                weekday: "short", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>

          <div className="p-8">
            {alreadyReviewed ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
                  <Star className="size-7 fill-[#15803D] text-[#15803D]" />
                </div>
                <h2 className="text-lg font-bold text-[#111] mb-2">Review already submitted</h2>
                <p className="text-[#7A746D] text-sm mb-6">
                  You have already left a review for this tour. Thank you for your feedback!
                </p>
                <Link
                  href="/bookings"
                  className="inline-block bg-[#1B2847] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#243560] transition-colors"
                >
                  Back to bookings
                </Link>
              </div>
            ) : (
              <ReviewFormClient tourId={booking.tour.id} bookingId={id} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
