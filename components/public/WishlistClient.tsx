"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Star, Users, Heart } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";

interface WishlistTour {
  id: string;
  slug: string;
  title: string;
  location: string;
  duration: number;
  durationType: string;
  basePrice: number;
  rating: number | null;
  reviewCount: number;
  maxGroupSize: number | null;
  category: string;
  coverImage: string | undefined;
}

export function WishlistClient({ initialTours }: { initialTours: WishlistTour[] }) {
  const [tours, setTours] = useState(initialTours);
  const [, startTransition] = useTransition();

  const handleRemove = (tourId: string) => {
    startTransition(async () => {
      const result = await toggleWishlistAction(tourId);
      if (result.success && !result.added) {
        setTours((prev) => prev.filter((t) => t.id !== tourId));
        toast.success("Removed from wishlist");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  if (tours.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E4E0D9] p-12 text-center shadow-sm max-w-2xl mx-auto">
        <Heart className="size-12 text-[#E4E0D9] mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display text-[#111] mb-2">Your wishlist is empty</h3>
        <p className="text-[#7A746D] mb-6">Looks like you havent saved any tours yet.</p>
        <Link
          href="/tours"
          className="inline-block bg-[#C41230] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#A00F27] transition-colors"
        >
          Explore Tours
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tours.map((tour) => (
        <div
          key={tour.id}
          className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-md"
        >
          {/* Image */}
          <div className="md:w-65 h-48 md:h-auto relative shrink-0">
            {tour.coverImage ? (
              <Image src={cldUrl(tour.coverImage, CLD_CARD)} alt={tour.title} fill sizes="(max-width: 768px) 100vw, 260px" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-[#1B2847] to-[#C41230]" />
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#111] text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              {tour.category}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-bold font-display text-[#111] group-hover:text-[#C41230] transition-colors leading-snug pr-4">
                <Link href={`/tours/${tour.slug}`}>{tour.title}</Link>
              </h3>
              <button
                onClick={() => handleRemove(tour.id)}
                className="shrink-0 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Heart className="size-4 fill-current" />
              </button>
            </div>

            <div className="flex items-center text-[#7A746D] text-sm mb-4">
              <MapPin className="size-4 mr-1" />
              {tour.location}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#111] mb-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#A8A29E]" />
                <span className="font-medium">{tour.duration} {tour.durationType}</span>
              </div>
              {tour.maxGroupSize && (
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[#A8A29E]" />
                  <span className="font-medium">Up to {tour.maxGroupSize} people</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < Math.floor(tour.rating ?? 5)
                          ? "text-[#D4AF37] fill-[#D4AF37]"
                          : "text-[#E4E0D9] fill-[#E4E0D9]"
                      }`}
                    />
                  ))}
                </div>
                {tour.reviewCount > 0 && (
                  <span className="text-[#7A746D] text-xs">({tour.reviewCount})</span>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#E4E0D9] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#7A746D] block">from</span>
                <span className="font-bold text-xl text-[#C41230]">
                  {formatPrice(tour.basePrice)}
                </span>
                <span className="text-xs text-[#7A746D] ml-1">/ person</span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/tours/${tour.slug}`}
                  className="text-sm font-bold text-[#111] border border-[#E4E0D9] bg-white hover:bg-[#F8F7F5] transition-colors px-4 py-2 rounded-lg"
                >
                  View Tour
                </Link>
                <Link
                  href={`/booking/${tour.id}`}
                  className="text-sm font-bold text-white bg-[#C41230] hover:bg-[#A00F27] transition-colors px-4 py-2 rounded-lg"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
