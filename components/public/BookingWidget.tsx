"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";
import { calcGroupPrice, formatPrice } from "@/lib/utils";
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

  const [date,    setDate]    = useState("");
  const [dateRec, setDateRec] = useState<AvailRecord | null>(null);
  const [adults,  setAdults]  = useState(tourType === "SOLO" ? 1 : 2);
  const [children, setChildren] = useState(0);

  const isSolo      = tourType === "SOLO";
  const totalGuests = isSolo ? 1 : adults + children;
  const max         = isSolo ? 1 : (maxGroupSize ?? 20);

  const priceOverride = dateRec?.priceOverride ? Number(dateRec.priceOverride) : null;

  const totalPrice = priceOverride !== null
    ? (isSolo ? priceOverride : totalGuests * priceOverride)
    : isSolo
      ? (adults * basePrice + children * (childPrice ?? basePrice))
      : calcGroupPrice(totalGuests, baseGroupSize, basePrice);

  const groupUnits = isSolo ? 1 : Math.ceil(totalGuests / baseGroupSize);

  const handleDateSelect = (d: string, rec: AvailRecord | null) => {
    setDate(d);
    setDateRec(rec);
  };

  const handleBooking = () => {
    if (!date) return;
    const sp = new URLSearchParams({
      date,
      adults:   adults.toString(),
      children: isSolo ? "0" : children.toString(),
    });
    router.push(`/booking/${tourId}?${sp.toString()}`);
  };

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E0D9] p-6 shadow-xl shadow-black/5">

      {/* ── Price Header ── */}
      <div className="mb-6 border-b border-[#E4E0D9] pb-6">
        <span className="text-[#7A746D] text-sm block mb-1">
          {isSolo ? "Price" : "Price from"}
        </span>
        <div className="flex items-end gap-2 text-[#111]">
          <span className="text-4xl font-display font-bold">${basePrice}</span>
          <span className="text-[#7A746D] mb-1">
            {isSolo ? "/ person" : `/ ${baseGroupSize} guests`}
          </span>
        </div>
        {!isSolo && (
          <p className="text-xs text-[#7A746D] mt-1.5">
            +${basePrice} for every additional {baseGroupSize} guests
          </p>
        )}
        {likelyToSellOut && (
          <p className="text-[#C41230] text-sm font-medium flex items-center gap-1.5 mt-3">
            <Clock className="size-4" /> High demand. Book soon!
          </p>
        )}
      </div>

      {/* ── Availability Calendar ── */}
      <div className="mb-6 border-b border-[#E4E0D9] pb-6">
        <label className="text-sm font-semibold text-[#111] block mb-3">Select Date</label>
        <AvailabilityCalendar
          tourId={tourId}
          selected={date}
          onSelect={handleDateSelect}
        />
      </div>

      {/* ── Guest Counters ── */}
      <div className="space-y-4 mb-6">
        {isSolo ? (
          <p className="text-sm text-[#7A746D] bg-[#F8F7F5] rounded-lg px-3 py-2">
            This is a solo / private tour — priced per person.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Adults */}
            <div>
              <label className="text-sm font-semibold text-[#111] block mb-2">Adults</label>
              <div className="flex items-center justify-between border border-[#E4E0D9] rounded-lg bg-[#F8F7F5] p-1">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  disabled={adults <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                >−</button>
                <span className="font-semibold w-6 text-center text-[#111]">{adults}</span>
                <button
                  onClick={() => setAdults(Math.min(max - children, adults + 1))}
                  disabled={adults + children >= max}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                >+</button>
              </div>
            </div>
            {/* Children */}
            <div>
              <label className="text-sm font-semibold text-[#111] block mb-2">Children</label>
              <div className="flex items-center justify-between border border-[#E4E0D9] rounded-lg bg-[#F8F7F5] p-1">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  disabled={children <= 0}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                >−</button>
                <span className="font-semibold w-6 text-center text-[#111]">{children}</span>
                <button
                  onClick={() => setChildren(Math.min(max - adults, children + 1))}
                  disabled={adults + children >= max}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                >+</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Price Breakdown ── */}
      <div className="border-t border-[#E4E0D9] pt-4 mb-6 space-y-2 text-sm">
        {priceOverride !== null ? (
          <div className="flex justify-between">
            <span className="text-[#545454]">{isSolo ? "1" : totalGuests} × ${priceOverride}/person <span className="text-[#C41230] text-xs font-semibold">(special)</span></span>
            <span className="font-semibold text-[#111]">${totalPrice.toFixed(2)}</span>
          </div>
        ) : isSolo ? (
          <>
            <div className="flex justify-between">
              <span className="text-[#545454]">Adults × {adults}</span>
              <span className="font-semibold text-[#111]">${(adults * basePrice).toFixed(2)}</span>
            </div>
            {children > 0 && (
              <div className="flex justify-between">
                <span className="text-[#545454]">Children × {children}</span>
                <span className="font-semibold text-[#111]">${(children * (childPrice ?? basePrice)).toFixed(2)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-between">
            <span className="text-[#545454]">{groupUnits} × ${basePrice} (per {baseGroupSize} guests)</span>
            <span className="font-semibold text-[#111]">${totalPrice.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-[#E4E0D9]">
          <span className="font-semibold text-[#111]">Total Price</span>
          <span className="text-2xl font-bold text-[#111]">${totalPrice.toFixed(2)}</span>
        </div>
        <span className="text-xs text-[#7A746D] block">No hidden fees — taxes included</span>
      </div>

      <button
        onClick={handleBooking}
        disabled={!date}
        className="w-full bg-[#C41230] hover:bg-[#A00F27] text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-md disabled:bg-[#A8A29E] disabled:cursor-not-allowed mb-4"
      >
        {date ? "Book Now" : "Select a Date to Continue"}
      </button>

      <div className="text-center text-sm text-[#7A746D] flex flex-col gap-2">
        <span className="flex items-center justify-center gap-1.5"><CheckCircle className="size-4 text-[#15803D]" /> Free cancellation up to 24h</span>
        <span className="flex items-center justify-center gap-1.5"><CheckCircle className="size-4 text-[#15803D]" /> Reserve now, pay later</span>
      </div>
    </div>
  );
}
