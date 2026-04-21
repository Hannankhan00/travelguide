"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { WishlistButton } from "./WishlistButton";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";

function useVisible() {
  const [visible, setVisible] = useState(4);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setVisible(4);
      else if (w >= 768) setVisible(3);
      else if (w >= 640) setVisible(2);
      else setVisible(1);
    }
    update();
    let timer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    }
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);
  return visible;
}

export interface RowTour {
  id: string;
  slug: string;
  title: string;
  location: string;
  duration: number;
  durationType: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  maxGroupSize?: number | null;
  category: string;
  likelyToSellOut?: boolean;
  coverImage?: string;
  isWishlisted?: boolean;
}

interface Props {
  title: string;
  subtitle?: string;
  tours: RowTour[];
  seeAllHref?: string;
}

const GAP = 16; // px — matches gap-4

export function TourRowSection({ title, subtitle, tours, seeAllHref = "/tours" }: Props) {
  const visible = useVisible();
  const [idx, setIdx] = useState(0);
  const max = Math.max(0, tours.length - visible);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(max, i + 1));

  if (tours.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price);

  const strideCSS = `calc(${100 / visible}% + ${GAP / visible}px)`;

  return (
    <section className="py-8 border-b border-[#e8e8e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[#111] mb-0.5">{title}</h2>
            {subtitle && <p className="text-[13px] text-[#6b6b6b]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={idx === 0}
              aria-label="Previous"
              className="w-8 h-8 rounded-full border border-[#e8e8e8] bg-white flex items-center justify-center text-lg text-[#1a1a1a] hover:border-[#185FA5] transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={idx >= max}
              aria-label="Next"
              className="w-8 h-8 rounded-full border border-[#e8e8e8] bg-white flex items-center justify-center text-lg text-[#1a1a1a] hover:border-[#185FA5] transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              ›
            </button>
          </div>
        </div>

        {/* Clipping window — exactly 4 cards wide */}
        <div className="overflow-hidden">
          {/* Sliding track */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              gap: GAP,
              transform: `translateX(calc(-${idx} * ${strideCSS}))`,
            }}
          >
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="shrink-0"
                style={{ width: `calc((100% - ${(visible - 1) * GAP}px) / ${visible})` }}
              >
                <TourCard tour={tour} formatPrice={formatPrice} />
              </div>
            ))}
          </div>
        </div>

        {/* See all link */}
        {seeAllHref && (
          <div className="mt-4 flex justify-end">
            <Link
              href={seeAllHref}
              className="text-[13px] font-semibold text-[#185FA5] hover:text-[#0C447C] transition-colors"
            >
              See all →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TourCard({ tour, formatPrice }: { tour: RowTour; formatPrice: (p: number) => string }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-[#E4E0D9] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 group">

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {tour.coverImage ? (
          <Image
            src={cldUrl(tour.coverImage, CLD_CARD)}
            alt={tour.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="absolute inset-0 group-hover:scale-105 transition-transform duration-500"
            style={{ background: "linear-gradient(135deg, #0C447C 0%, #185FA5 100%)" }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        {tour.likelyToSellOut && (
          <span className="absolute top-2.5 left-2.5 bg-white text-[#1a1a1a] text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
            Likely to sell out
          </span>
        )}

        {/* Wishlist */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton tourId={tour.id} isWishlistedInitial={tour.isWishlisted ?? false} className="w-7!   " />
        </div>
      </div>

      {/* Body */}
      <Link href={`/tours/${tour.slug}`} className="block p-4">
        <div className="text-[11px] text-[#7A746D] mb-1.5 font-medium">
          {tour.category} · {tour.duration}{tour.durationType === "hours" ? "h" : "d"}
        </div>

        <h3 className="text-[15px] font-semibold text-[#111] leading-snug mb-2.5 line-clamp-2 group-hover:text-[#185FA5] transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${
                  i < Math.floor(tour.rating)
                    ? "text-[#EF9F27] fill-[#EF9F27]"
                    : "text-[#E4E0D9] fill-[#E4E0D9]"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#1a1a1a]">{tour.rating}</span>
          <span className="text-[11px] text-[#9e9e9e]">({tour.reviewCount})</span>
        </div>

        {tour.maxGroupSize && (
          <div className="text-[11px] text-[#7A746D] mb-2">Up to {tour.maxGroupSize} · Small group</div>
        )}

        <div className="pt-2.5 border-t border-[#F1EFE9]">
          <span className="text-[11px] text-[#A8A29E]">from </span>
          <span className="text-[#0C447C] font-extrabold text-base">{formatPrice(tour.basePrice)}</span>
        </div>
      </Link>
    </div>
  );
}
