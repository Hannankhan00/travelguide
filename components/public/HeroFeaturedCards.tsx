"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cldUrl, CLD_THUMB } from "@/lib/cloudinary";

function useVisible() {
  const [visible, setVisible] = useState(3);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setVisible(3);
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

interface MiniTour {
  id: string;
  slug: string;
  title: string;
  location: string;
  duration: number;
  durationType: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  coverImage?: string;
}

interface Props {
  tours: MiniTour[];
}

const GAP = 16; // px — gap-4

export function HeroFeaturedCards({ tours }: Props) {
  const visible = useVisible();
  const [idx, setIdx] = useState(0);
  const max = Math.max(0, tours.length - visible);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(max, i + 1));

  if (tours.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price);

  const strideCSS = `calc((100% + ${GAP}px) / ${visible})`;

  return (
    <div className="mt-8 w-full">
      <p className="text-center text-[13px] font-semibold text-white/80 mb-4 tracking-wide">
        Continue planning your trip
      </p>

      <div className="flex items-center gap-3">
        {/* Left arrow */}
        <button
          onClick={prev}
          disabled={idx === 0}
          aria-label="Previous"
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#111] text-xl shadow-md shrink-0 transition-opacity duration-200 disabled:opacity-30 hover:bg-[#F8F7F5] disabled:cursor-default"
        >
          ‹
        </button>

        {/* Clipping window */}
        <div className="flex-1 overflow-hidden">
          {/* Sliding track */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              gap: GAP,
              transform: `translateX(calc(-${idx} * ${strideCSS}))`,
            }}
          >
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.slug}`}
                className="shrink-0 bg-white rounded-xl p-4 flex gap-4 items-start shadow-[0_2px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.18)] transition-shadow group"
                style={{ width: `calc((100% - ${(visible - 1) * GAP}px) / ${visible})` }}
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-28 rounded-lg overflow-hidden shrink-0">
                  {tour.coverImage ? (
                    <Image
                      src={cldUrl(tour.coverImage, CLD_THUMB)}
                      alt={tour.title}
                      fill
                      sizes="112px"
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: "linear-gradient(135deg, #0C447C 0%, #185FA5 100%)" }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#111] leading-snug mb-1 line-clamp-2 group-hover:text-[#185FA5] transition-colors">
                    {tour.title}
                  </p>
                  <p className="text-[12px] text-[#666] mb-1.5 line-clamp-1">
                    {tour.duration} {tour.durationType} · {tour.location}
                  </p>
                  {tour.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mb-1.5">
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
                      <span className="text-[11px] font-bold text-[#111]">{tour.rating.toFixed(1)}</span>
                      <span className="text-[11px] text-[#999]">({tour.reviewCount.toLocaleString()})</span>
                    </div>
                  )}
                  <p className="text-[12px] text-[#555]">
                    From{" "}
                    <span className="font-extrabold text-[#EF9F27] text-[15px]">
                      {formatPrice(tour.basePrice)}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          disabled={idx >= max}
          aria-label="Next"
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#111] text-xl shadow-md shrink-0 transition-opacity duration-200 disabled:opacity-30 hover:bg-[#F8F7F5] disabled:cursor-default"
        >
          ›
        </button>
      </div>
    </div>
  );
}
