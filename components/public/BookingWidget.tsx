"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CalendarDays, ChevronDown, CheckCircle2 } from "lucide-react";
import { calcGroupPrice } from "@/lib/utils";
import { AvailabilityCalendar, type AvailRecord } from "@/components/public/AvailabilityCalendar";

interface BookingWidgetProps {
  tourId: string;
  tourType: "SOLO" | "GROUP";
  basePrice: number;
  baseGroupSize: number;
  childPrice?: number | null;
  likelyToSellOut: boolean;
  maxGroupSize?: number;
}

export function BookingWidget({
  tourId,
  tourType,
  basePrice,
  baseGroupSize,
  childPrice,
  likelyToSellOut,
  maxGroupSize,
}: BookingWidgetProps) {
  const router = useRouter();

  const [date, setDate]         = useState("");
  const [dateRec, setDateRec]   = useState<AvailRecord | null>(null);
  const [adults, setAdults]     = useState(tourType === "SOLO" ? 1 : 2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [dateOpen, setDateOpen]     = useState(false);

  const isSolo      = tourType === "SOLO";
  const totalGuests = isSolo ? 1 : adults + children;
  const max         = isSolo ? 1 : (maxGroupSize ?? 20);

  const priceOverride = dateRec?.priceOverride ? Number(dateRec.priceOverride) : null;
  const totalPrice = priceOverride !== null
    ? (isSolo ? priceOverride : totalGuests * priceOverride)
    : isSolo
      ? (adults * basePrice + children * (childPrice ?? basePrice))
      : calcGroupPrice(totalGuests, baseGroupSize, basePrice);

  const guestLabel = isSolo
    ? "1 Adult"
    : `Adult × ${adults}${children > 0 ? `, Child × ${children}` : ""}`;

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Select date";

  const handleDateSelect = (d: string, rec: AvailRecord | null) => {
    setDate(d);
    setDateRec(rec);
    setDateOpen(false);
  };

  const handleBooking = () => {
    if (!date) { setDateOpen(true); return; }
    const sp = new URLSearchParams({ date, adults: adults.toString(), children: isSolo ? "0" : children.toString() });
    router.push(`/booking/${tourId}?${sp.toString()}`);
  };

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E0D9] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">

      {/* ── Top: badge + price ── */}
      <div className="px-5 pt-5 pb-4">
        {likelyToSellOut && (
          <span className="inline-block bg-[#C41230] text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 tracking-wide">
            Likely to sell out
          </span>
        )}
        <p className="text-[#7A746D] text-sm mb-0.5">From</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[2rem] font-bold text-[#111] leading-none">${basePrice}</span>
          <span className="text-[#7A746D] text-sm">
            {isSolo ? "per person" : `/ ${baseGroupSize} guests`}
          </span>
        </div>
        {!isSolo && (
          <p className="text-xs text-[#7A746D] mt-1">+${basePrice} for every additional {baseGroupSize} guests</p>
        )}
      </div>

      {/* ── Selectors ── */}
      <div className="px-5 space-y-2.5 pb-4">

        {/* Guests selector */}
        {!isSolo && (
          <div>
            <button
              onClick={() => { setGuestsOpen(o => !o); setDateOpen(false); }}
              className="w-full flex items-center gap-3 bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors rounded-xl px-4 py-3 text-left"
            >
              <Users className="size-4.5 text-[#555] shrink-0" />
              <span className="flex-1 text-sm font-medium text-[#111]">{guestLabel}</span>
              <ChevronDown className={`size-4 text-[#555] transition-transform ${guestsOpen ? "rotate-180" : ""}`} />
            </button>

            {guestsOpen && (
              <div className="mt-2 bg-[#F4F4F4] rounded-xl px-4 py-3 space-y-3">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Adults</p>
                    <p className="text-xs text-[#7A746D]">Age 18+</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors"
                    >−</button>
                    <span className="w-4 text-center font-semibold text-[#111]">{adults}</span>
                    <button
                      onClick={() => setAdults(Math.min(max - children, adults + 1))}
                      disabled={adults + children >= max}
                      className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors"
                    >+</button>
                  </div>
                </div>
                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Children</p>
                    <p className="text-xs text-[#7A746D]">Age 0–17</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors"
                    >−</button>
                    <span className="w-4 text-center font-semibold text-[#111]">{children}</span>
                    <button
                      onClick={() => setChildren(Math.min(max - adults, children + 1))}
                      disabled={adults + children >= max}
                      className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date selector */}
        <div>
          <button
            onClick={() => { setDateOpen(o => !o); setGuestsOpen(false); }}
            className="w-full flex items-center gap-3 bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors rounded-xl px-4 py-3 text-left"
          >
            <CalendarDays className="size-4.5 text-[#555] shrink-0" />
            <span className={`flex-1 text-sm font-medium ${date ? "text-[#111]" : "text-[#7A746D]"}`}>{dateLabel}</span>
            <ChevronDown className={`size-4 text-[#555] transition-transform ${dateOpen ? "rotate-180" : ""}`} />
          </button>

          {dateOpen && (
            <div className="mt-2 bg-[#F4F4F4] rounded-xl p-3">
              <AvailabilityCalendar
                tourId={tourId}
                selected={date}
                onSelect={handleDateSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Price summary ── */}
      {date && (
        <div className="mx-5 mb-4 bg-[#F4F4F4] rounded-xl px-4 py-3 space-y-1.5 text-sm">
          {isSolo ? (
            <>
              <div className="flex justify-between text-[#545454]">
                <span>Adults × {adults}</span>
                <span>${(adults * (priceOverride ?? basePrice)).toFixed(2)}</span>
              </div>
              {children > 0 && (
                <div className="flex justify-between text-[#545454]">
                  <span>Children × {children}</span>
                  <span>${(children * (priceOverride ?? childPrice ?? basePrice)).toFixed(2)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-between text-[#545454]">
              <span>{Math.ceil(totalGuests / baseGroupSize)} × ${priceOverride ?? basePrice} (per {baseGroupSize} guests)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#111] pt-1.5 border-t border-[#E4E0D9]">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-[#7A746D]">No hidden fees. Taxes included.</p>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="px-5 pb-5">
        <button
          onClick={handleBooking}
          className="w-full bg-[#1A6BFF] hover:bg-[#1558D6] active:bg-[#1044B0] text-white font-bold text-[15px] py-3.5 rounded-xl transition-colors shadow-sm"
        >
          {date ? "Book Now" : "Check availability"}
        </button>
      </div>

      {/* ── Trust badges ── */}
      <div className="border-t border-[#E4E0D9] px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 text-[#22A96E] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#111]">Free cancellation</p>
            <p className="text-xs text-[#7A746D] leading-snug mt-0.5">Cancel up to 24 hours in advance for a full refund</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 text-[#22A96E] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#111]">Reserve now &amp; pay later</p>
            <p className="text-xs text-[#7A746D] leading-snug mt-0.5">Keep your travel plans flexible — book your spot and pay nothing today.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
