"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Star, Users, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { WishlistButton } from "./WishlistButton";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";

interface FeaturedTour {
  id: string;
  slug: string;
  title: string;
  location: string;
  duration: number;
  durationType: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  maxGroupSize: number | null;
  category: string;
  featured: boolean;
  likelyToSellOut: boolean;
  coverImage?: string;
  isWishlisted: boolean;
}

interface Props {
  tours: FeaturedTour[];
}

export function FeaturedToursCarousel({ tours }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 340;
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  }

  if (tours.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price);

  return (
    <section className="py-20 bg-white" id="featured-tours">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-[#EF9F27]" />
              <span className="text-[#185FA5] text-xs font-bold tracking-widest uppercase">
                Handpicked Experiences
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111]">
              Tours travelers love
            </h2>
          </div>
          <Link
            href="/tours"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#185FA5] text-white text-sm font-semibold hover:bg-[#0C447C] transition-colors shadow-md"
          >
            See all tours
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {/* Carousel wrapper */}
        <div className="relative group/carousel">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-[#E4E0D9] flex items-center justify-center text-[#111] hover:bg-[#F8F7F5] transition-all opacity-0 group-hover/carousel:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-[#E4E0D9] flex items-center justify-center text-[#111] hover:bg-[#F8F7F5] transition-all opacity-0 group-hover/carousel:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-4 -mx-2 px-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="shrink-0 w-[320px] sm:w-85 snap-start group"
              >
                <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {tour.coverImage ? (
                      <Image
                        src={cldUrl(tour.coverImage, CLD_CARD)}
                        alt={tour.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 340px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                        style={{ background: "linear-gradient(135deg, #0C447C 0%, #185FA5 100%)" }}
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                    {/* Wishlist */}
                    <div className="absolute top-3 right-3 z-10">
                      <WishlistButton tourId={tour.id} isWishlistedInitial={tour.isWishlisted} className="shadow-md" />
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {tour.featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#185FA5] text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
                          <Star className="size-3 fill-current" />
                          Featured
                        </span>
                      )}
                      {tour.likelyToSellOut && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
                          <Clock className="size-3" />
                          Selling fast
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-sm font-medium">
                      <MapPin className="size-3.5" />
                      {tour.location}
                    </div>
                  </div>

                  {/* Card body */}
                  <Link href={`/tours/${tour.slug}`} className="block p-5">
                    <h3 className="font-semibold text-[#111] text-base leading-snug mb-3 group-hover:text-[#185FA5] transition-colors line-clamp-2">
                      {tour.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-[#7A746D] mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>{tour.duration} {tour.durationType}</span>
                      </div>
                      {tour.maxGroupSize && (
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          <span>Up to {tour.maxGroupSize}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#F1EFE9]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < Math.floor(tour.rating)
                                  ? "text-[#EF9F27] fill-[#EF9F27]"
                                  : "text-[#E4E0D9] fill-[#E4E0D9]"
                              }`}
                            />
                          ))}
                        </div>
                        {tour.reviewCount > 0 && (
                          <span className="text-xs text-[#A8A29E]">({tour.reviewCount})</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#A8A29E] block font-medium tracking-wide uppercase">from</span>
                        <span className="text-[#185FA5] font-bold text-lg leading-tight">
                          {formatPrice(tour.basePrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Link
            href="/tours"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#185FA5] text-white font-semibold text-sm hover:bg-[#0C447C] transition-colors shadow-md"
          >
            See all tours
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
