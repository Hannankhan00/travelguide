"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Props {
  tourId: string;
  tourType: "SOLO" | "GROUP";
  basePrice: number;
  baseGroupSize: number;
}

export function MobileBookingCTA({ tourId, tourType, basePrice, baseGroupSize }: Props) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4E0D9] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <span className="text-xs text-[#7A746D] block">from</span>
        <span className="text-2xl font-bold font-display text-[#111]">
          {formatPrice(basePrice)}
        </span>
        <span className="text-xs text-[#7A746D] ml-1">
          {tourType === "SOLO" ? "/ person" : `/ ${baseGroupSize} guests`}
        </span>
      </div>
      <Link
        href={`/booking/${tourId}`}
        className="flex-1 max-w-50 bg-[#C41230] hover:bg-[#A00F27] text-white font-bold text-base py-3 px-6 rounded-xl text-center transition-colors shadow-md"
      >
        Book Now
      </Link>
    </div>
  );
}
