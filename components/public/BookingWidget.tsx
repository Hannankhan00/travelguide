"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { getPriceForGroupSize, formatPrice, type PriceTier } from "@/lib/utils";
import { AvailabilityCalendar, type AvailRecord } from "@/components/public/AvailabilityCalendar";

interface BookingWidgetProps {
  tourId: string;
  basePrice: number;
  childPrice?: number | null;
  likelyToSellOut: boolean;
  priceTiers?: PriceTier[];
  maxGroupSize?: number;
}

export function BookingWidget({
  tourId,
  basePrice,
  childPrice,
  likelyToSellOut,
  priceTiers = [],
  maxGroupSize,
}: BookingWidgetProps) {
  const router = useRouter();

  const [date,      setDate]      = useState("");
  const [dateRec,   setDateRec]   = useState<AvailRecord | null>(null);
  const [adults,    setAdults]    = useState(2);
  const [children,  setChildren]  = useState(0);
  const [showTiers, setShowTiers] = useState(false);

  const totalGuests = adults + children;
  const hasTiers    = priceTiers.length > 0;

  // If the selected date has a price override, use it instead of tier/base
  const priceOverride = dateRec?.priceOverride ? Number(dateRec.priceOverride) : null;

  const effectivePPP = priceOverride !== null
    ? priceOverride
    : hasTiers
    ? getPriceForGroupSize(priceTiers, totalGuests, basePrice)
    : basePrice;

  const activeTier = hasTiers && priceOverride === null
    ? priceTiers.find((t) => totalGuests >= t.minGuests && totalGuests <= t.maxGuests) ?? null
    : null;

  const totalPrice = priceOverride !== null
    ? totalGuests * priceOverride
    : hasTiers
    ? totalGuests * effectivePPP
    : adults * basePrice + children * (childPrice ?? basePrice);

  const displayBasePrice = hasTiers
    ? Math.min(...priceTiers.map((t) => t.pricePerPerson))
    : basePrice;

  const handleDateSelect = (d: string, rec: AvailRecord | null) => {
    setDate(d);
    setDateRec(rec);
  };

  const handleBooking = () => {
    if (!date) return;
    const sp = new URLSearchParams({
      date,
      adults:   adults.toString(),
      children: children.toString(),
    });
    router.push(`/booking/${tourId}?${sp.toString()}`);
  };

  const max = maxGroupSize ?? 20;

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E0D9] p-6 shadow-xl shadow-black/5">

      {/* ── Price Header ── */}
      <div className="mb-6 border-b border-[#E4E0D9] pb-6">
        <span className="text-[#7A746D] text-sm block mb-1">Price from</span>
        <div className="flex items-end gap-2 text-[#111]">
          <span className="text-4xl font-display font-bold">${displayBasePrice}</span>
          <span className="text-[#7A746D] mb-1">/ person</span>
        </div>
        {likelyToSellOut && (
          <p className="text-[#C41230] text-sm font-medium flex items-center gap-1.5 mt-3">
            <Clock className="size-4" /> High demand. Book soon!
          </p>
        )}

        {hasTiers && (
          <button
            onClick={() => setShowTiers((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#1B2847] hover:text-[#C41230] transition-colors"
          >
            <ChevronDown className={`size-4 transition-transform ${showTiers ? "rotate-180" : ""}`} />
            View group pricing
          </button>
        )}
        {hasTiers && showTiers && (
          <div className="mt-3 rounded-lg border border-[#E4E0D9] overflow-hidden text-sm">
            <div className="grid grid-cols-2 bg-[#F8F7F5] px-3 py-2 font-semibold text-[#545454] text-xs uppercase tracking-wide">
              <span>Group size</span>
              <span className="text-right">Per person</span>
            </div>
            {priceTiers.map((tier, i) => {
              const isActive = activeTier === tier;
              return (
                <div
                  key={i}
                  className={`grid grid-cols-2 px-3 py-2 border-t border-[#E4E0D9] transition-colors ${
                    isActive ? "bg-[#FFF0F2] text-[#C41230] font-semibold" : "text-[#111]"
                  }`}
                >
                  <span>{tier.minGuests}–{tier.maxGuests} people</span>
                  <span className="text-right">${tier.pricePerPerson}</span>
                </div>
              );
            })}
          </div>
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

        {/* Live tier notice */}
        {hasTiers && priceOverride === null && (
          <div className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
            activeTier ? "bg-[#FFF0F2] text-[#C41230]" : "bg-[#FFF8E1] text-[#B45309]"
          }`}>
            <Users className="size-4 shrink-0" />
            {activeTier
              ? <span><strong>{totalGuests} people</strong> — ${activeTier.pricePerPerson}/person (group rate)</span>
              : <span>Group of <strong>{totalGuests}</strong> — base rate applies</span>
            }
          </div>
        )}
      </div>

      {/* ── Price Breakdown ── */}
      <div className="border-t border-[#E4E0D9] pt-4 mb-6 space-y-2 text-sm">
        {priceOverride !== null ? (
          <>
            <div className="flex justify-between">
              <span className="text-[#545454]">{totalGuests} × ${priceOverride}/person <span className="text-[#C41230] text-xs font-semibold">(special)</span></span>
              <span className="font-semibold text-[#111]">${totalPrice.toFixed(2)}</span>
            </div>
          </>
        ) : hasTiers ? (
          <div className="flex justify-between">
            <span className="text-[#545454]">{totalGuests} × ${effectivePPP}/person</span>
            <span className="font-semibold text-[#111]">${totalPrice.toFixed(2)}</span>
          </div>
        ) : (
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
