"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { BookingWidget } from "@/components/public/BookingWidget";

interface Props {
  tourId: string;
  tourType: "SOLO" | "GROUP";
  basePrice: number;
  baseGroupSize: number;
  childPrice?: number | null;
  likelyToSellOut?: boolean;
  maxGroupSize?: number;
}

export function MobileBookingCTA({
  tourId,
  tourType,
  basePrice,
  baseGroupSize,
  childPrice,
  likelyToSellOut = false,
  maxGroupSize,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Sticky bottom bar */}
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
        <button
          onClick={() => setOpen(true)}
          className="flex-1 max-w-52 bg-[#C41230] hover:bg-[#A00F27] active:bg-[#8A0B20] text-white font-bold text-base py-3 px-6 rounded-xl text-center transition-colors shadow-md"
        >
          Check availability
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-[#D4D4D4] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="w-6" />
          <button
            onClick={() => setOpen(false)}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors"
          >
            <X className="size-4 text-[#555]" />
          </button>
        </div>

        {/* Full booking widget (strip the sticky/rounded wrapper) */}
        <div className="px-4 pb-8">
          <BookingWidget
            tourId={tourId}
            tourType={tourType}
            basePrice={basePrice}
            baseGroupSize={baseGroupSize}
            childPrice={childPrice}
            likelyToSellOut={likelyToSellOut}
            maxGroupSize={maxGroupSize}
          />
        </div>
      </div>
    </>
  );
}
