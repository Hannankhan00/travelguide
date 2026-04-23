"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CalendarDays, ChevronDown, CheckCircle2, MapPin, Clock, X, CalendarCheck, BadgeCheck } from "lucide-react";
import { calcGroupPrice } from "@/lib/utils";
import { AvailabilityCalendar, type AvailRecord } from "@/components/public/AvailabilityCalendar";

interface TourVariation { id: string; name: string; description: string; extraCost: string; }

interface BookingWidgetProps {
  tourId:        string;
  tourType:      "SOLO" | "GROUP";
  basePrice:     number;
  originalBasePrice?: number;
  baseGroupSize: number;
  childPrice?:   number | null;
  likelyToSellOut: boolean;
  maxGroupSize?:   number;
  variations?:     TourVariation[];
  tourTitle?:      string;
  meetingPoint?:   string;
  languages?:      string[];
  duration?:       number;
  durationType?:   string;
  startTimes?:          string[];
  cancellationHours?:   number;
  rescheduleHours?:     number;
}

export function BookingWidget({
  tourId, tourType, basePrice, originalBasePrice, baseGroupSize,
  childPrice, likelyToSellOut, maxGroupSize,
  variations = [], tourTitle = "", meetingPoint = "",
  languages = [], duration = 0, durationType = "hours",
  startTimes = [],
  cancellationHours = 24,
  rescheduleHours = 48,
}: BookingWidgetProps) {
  const router = useRouter();

  const [date, setDate]             = useState("");
  const [dateRec, setDateRec]       = useState<AvailRecord | null>(null);
  const [adults, setAdults]         = useState(tourType === "SOLO" ? 1 : 2);
  const [children, setChildren]     = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [dateOpen, setDateOpen]     = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime]     = useState<string>("");

  const isSolo      = tourType === "SOLO";
  const totalGuests = isSolo ? 1 : adults + children;
  const max         = isSolo ? 1 : (maxGroupSize ?? 20);

  const selectedVariation = variations.find(v => v.id === selectedVariationId) ?? null;
  const variationExtra    = selectedVariation ? Number(selectedVariation.extraCost) : 0;

  const priceOverride = dateRec?.priceOverride ? Number(dateRec.priceOverride) : null;
  const baseTotalPrice = priceOverride !== null
    ? (isSolo ? priceOverride : totalGuests * priceOverride)
    : isSolo
      ? (adults * basePrice + children * (childPrice ?? basePrice))
      : calcGroupPrice(totalGuests, baseGroupSize, basePrice);
  
  const originalTotalPrice = originalBasePrice && priceOverride === null
    ? (isSolo
        ? (adults * originalBasePrice + children * (childPrice ? childPrice / basePrice * originalBasePrice : originalBasePrice))
        : calcGroupPrice(totalGuests, baseGroupSize, originalBasePrice))
    : null;

  const totalPrice = baseTotalPrice + variationExtra;

  const spotsLeft = dateRec ? dateRec.maxCapacity - dateRec.bookedCount : null;

  const guestLabel = isSolo
    ? "1 Adult"
    : `Adult × ${adults}${children > 0 ? `, Child × ${children}` : ""}`;

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Select date";

  const dateLong = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "";

  const handleDateSelect = (d: string, rec: AvailRecord | null) => {
    setDate(d);
    setDateRec(rec);
    setDateOpen(false);
  };

  const handleCTAClick = () => {
    if (!date) { setDateOpen(true); return; }
    setModalOpen(true);
  };

  const handleConfirm = () => {
    const sp = new URLSearchParams({ date, adults: adults.toString(), children: isSolo ? "0" : children.toString() });
    if (selectedVariationId) sp.set("variationId", selectedVariationId);
    const startTime = dateRec?.startTime || selectedStartTime;
    if (startTime) sp.set("startTime", startTime);
    router.push(`/booking/${tourId}?${sp.toString()}`);
  };

  return (
    <>
    <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E0D9] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">

      {/* ── Top: badge + price ── */}
      <div className="px-5 pt-5 pb-4">
        {likelyToSellOut && (
          <span className="inline-block bg-[#C41230] text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 tracking-wide">
            Likely to sell out
          </span>
        )}
        <p className="text-[#7A746D] text-sm mb-0.5">{isSolo ? "From" : `Total for ${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          {originalTotalPrice && (
            <span className="text-xl font-medium text-[#A8A29E] line-through">${originalTotalPrice.toFixed(0)}</span>
          )}
          <span className="text-[2rem] font-bold text-[#C41230] leading-none">${baseTotalPrice.toFixed(0)}</span>
          <span className="text-[#7A746D] text-sm">
            {isSolo ? "per person" : ""}
          </span>
        </div>
        {!isSolo && (
          <p className="text-xs text-[#7A746D] mt-1">
            Base: ${Number(basePrice).toFixed(2).replace(/\.00$/, '')} / {baseGroupSize} guests · +${Number(basePrice).toFixed(2).replace(/\.00$/, '')} per extra {baseGroupSize}
          </p>
        )}
      </div>

      {/* ── Selectors ── */}
      <div className="px-5 space-y-2.5 pb-4">

        {/* Guests */}
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
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-[#111]">Adults</p><p className="text-xs text-[#7A746D]">Age 18+</p></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1} className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors">−</button>
                    <span className="w-4 text-center font-semibold text-[#111]">{adults}</span>
                    <button onClick={() => setAdults(Math.min(max - children, adults + 1))} disabled={adults + children >= max} className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-[#111]">Children</p><p className="text-xs text-[#7A746D]">Age 0–17</p></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0} className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors">−</button>
                    <span className="w-4 text-center font-semibold text-[#111]">{children}</span>
                    <button onClick={() => setChildren(Math.min(max - adults, children + 1))} disabled={adults + children >= max} className="w-8 h-8 rounded-full border border-[#D4D4D4] bg-white flex items-center justify-center text-lg font-medium disabled:opacity-40 hover:border-[#111] transition-colors">+</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="relative">
          <button
            onClick={() => { setDateOpen(o => !o); setGuestsOpen(false); }}
            className="w-full flex items-center gap-3 bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors rounded-xl px-4 py-3 text-left"
          >
            <CalendarDays className="size-4.5 text-[#555] shrink-0" />
            <span className={`flex-1 text-sm font-medium ${date ? "text-[#111]" : "text-[#7A746D]"}`}>{dateLabel}</span>
            <ChevronDown className={`size-4 text-[#555] transition-transform ${dateOpen ? "rotate-180" : ""}`} />
          </button>
          {dateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-[#E4E0D9] p-4 w-max">
                <AvailabilityCalendar tourId={tourId} selected={date} onSelect={handleDateSelect} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-5 pb-5">
        <button
          onClick={handleCTAClick}
          className="w-full bg-[#1A6BFF] hover:bg-[#1558D6] active:bg-[#1044B0] text-white font-bold text-[15px] py-3.5 rounded-xl transition-colors shadow-sm"
        >
          {date ? "Check availability" : "Check availability"}
        </button>
      </div>

      {/* ── Trust badges / policy ── */}
      <div className="border-t border-[#E4E0D9] px-5 py-4 space-y-3">
        {cancellationHours > 0 ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-[#22A96E] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#111]">Free cancellation</p>
              <p className="text-xs text-[#7A746D] leading-snug mt-0.5">
                Cancel up to {cancellationHours >= 24
                  ? `${cancellationHours / 24 === 1 ? "1 day" : `${cancellationHours / 24} days`}`
                  : `${cancellationHours} hours`} before for a full refund
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#111]">Non-refundable</p>
              <p className="text-xs text-[#7A746D] leading-snug mt-0.5">This booking cannot be cancelled once confirmed</p>
            </div>
          </div>
        )}
        {rescheduleHours > 0 && (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-[#22A96E] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#111]">Rescheduling available</p>
              <p className="text-xs text-[#7A746D] leading-snug mt-0.5">
                Request a date change up to {rescheduleHours >= 24
                  ? `${rescheduleHours / 24 === 1 ? "1 day" : `${rescheduleHours / 24} days`}`
                  : `${rescheduleHours} hours`} before departure
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 text-[#22A96E] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#111]">Reserve now &amp; pay later</p>
            <p className="text-xs text-[#7A746D] leading-snug mt-0.5">Keep your travel plans flexible — book your spot and pay nothing today.</p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Booking Details Modal ── */}
    {modalOpen && (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto pointer-events-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E4E0D9]">
              <p className="text-sm font-semibold text-[#545454]">1 option available</p>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors">
                <X className="size-4 text-[#555]" />
              </button>
            </div>

            {/* Option card */}
            <div className="mx-5 mt-4 rounded-2xl border-2 border-[#1A6BFF] overflow-hidden">

              {/* Spots badge */}
              {spotsLeft !== null && spotsLeft <= 5 && (
                <div className="bg-[#C41230] px-4 py-1.5">
                  <p className="text-white text-xs font-bold">Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>
                </div>
              )}

              <div className="px-4 pt-4 pb-3 space-y-3">
                {/* Tour title */}
                <p className="font-bold text-[#111] text-base leading-snug">{tourTitle}</p>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[#545454]">
                  {duration > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 text-[#7A746D]" />{duration} {durationType}
                    </span>
                  )}
                  {languages.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4 text-[#7A746D]" />Guide: {languages[0]}
                    </span>
                  )}
                </div>

                {/* Meeting point */}
                {meetingPoint && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-sm text-[#185FA5] hover:underline"
                  >
                    <MapPin className="size-4 shrink-0 mt-0.5" />
                    <span>{meetingPoint}</span>
                  </a>
                )}

                {/* Starting time — availability override takes priority, otherwise tour-level selector */}
                {dateRec?.startTime ? (
                  <div className="border-t border-[#E4E0D9] pt-3">
                    <p className="text-xs font-bold text-[#111] uppercase tracking-wide mb-1">Starting time</p>
                    <p className="text-sm text-[#545454]">{dateLong}</p>
                    <p className="text-sm font-semibold text-[#111]">{dateRec.startTime}</p>
                  </div>
                ) : startTimes.length > 0 && (
                  <div className="border-t border-[#E4E0D9] pt-3">
                    <p className="text-xs font-bold text-[#111] uppercase tracking-wide mb-2">Choose a starting time</p>
                    <div className="flex flex-wrap gap-2">
                      {startTimes.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedStartTime(prev => prev === t ? "" : t)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            selectedStartTime === t
                              ? "border-[#1B2847] bg-[#1B2847] text-white"
                              : "border-[#E4E0D9] bg-white text-[#111] hover:border-[#1B2847]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policies */}
                <div className="border-t border-[#E4E0D9] pt-3 space-y-2">
                  {cancellationHours > 0 ? (
                    <div className="flex items-start gap-2 text-sm text-[#545454]">
                      <BadgeCheck className="size-4 text-[#22A96E] shrink-0 mt-0.5" />
                      <span>Free cancellation up to {cancellationHours >= 24
                        ? (cancellationHours / 24 === 1 ? "1 day" : `${cancellationHours / 24} days`)
                        : `${cancellationHours} hours`} before — full refund</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-[#545454]">
                      <BadgeCheck className="size-4 text-[#F59E0B] shrink-0 mt-0.5" />
                      <span>Non-refundable — cancellations are not accepted</span>
                    </div>
                  )}
                  {rescheduleHours > 0 && (
                    <div className="flex items-start gap-2 text-sm text-[#545454]">
                      <CalendarCheck className="size-4 text-[#22A96E] shrink-0 mt-0.5" />
                      <span>Rescheduling available up to {rescheduleHours >= 24
                        ? (rescheduleHours / 24 === 1 ? "1 day" : `${rescheduleHours / 24} days`)
                        : `${rescheduleHours} hours`} before departure</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm text-[#545454]">
                    <CalendarCheck className="size-4 text-[#22A96E] shrink-0 mt-0.5" />
                    <span>You can reserve now &amp; pay later</span>
                  </div>
                </div>

                {/* Variations */}
                {variations.length > 0 && (
                  <div className="border-t border-[#E4E0D9] pt-3 space-y-2">
                    <p className="text-xs font-bold text-[#111] uppercase tracking-wide mb-2">Choose your option</p>
                    <button
                      onClick={() => setSelectedVariationId(null)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-colors text-left ${selectedVariationId === null ? "border-[#1B2847] bg-[#1B2847]/5" : "border-[#E4E0D9] hover:border-[#C4BFBA]"}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#111]">Standard</p>
                        <p className="text-xs text-[#7A746D]">Included in base price</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedVariationId === null ? "border-[#1B2847]" : "border-[#D4D4D4]"}`}>
                        {selectedVariationId === null && <div className="w-2 h-2 rounded-full bg-[#1B2847]" />}
                      </div>
                    </button>
                    {variations.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariationId(v.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-colors text-left ${selectedVariationId === v.id ? "border-[#C41230] bg-[#C41230]/5" : "border-[#E4E0D9] hover:border-[#C4BFBA]"}`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-sm font-semibold text-[#111]">{v.name}</p>
                          {v.description && <p className="text-xs text-[#7A746D]">{v.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-[#C41230]">+${Number(v.extraCost).toFixed(0)}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedVariationId === v.id ? "border-[#C41230]" : "border-[#D4D4D4]"}`}>
                            {selectedVariationId === v.id && <div className="w-2 h-2 rounded-full bg-[#C41230]" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price + CTA footer */}
              <div className="border-t border-[#E4E0D9] px-4 py-4">
                {/* Breakdown */}
                <div className="space-y-1 mb-3 text-sm">
                  {isSolo ? (
                    <>
                      <div className="flex justify-between text-[#545454]">
                        <span>{adults} Adult{adults > 1 ? "s" : ""} × ${(priceOverride ?? basePrice).toFixed(2)}</span>
                        <span>${(adults * (priceOverride ?? basePrice)).toFixed(2)}</span>
                      </div>
                      {children > 0 && (
                        <div className="flex justify-between text-[#545454]">
                          <span>{children} Child{children > 1 ? "ren" : ""} × ${(priceOverride ?? childPrice ?? basePrice).toFixed(2)}</span>
                          <span>${(children * (priceOverride ?? childPrice ?? basePrice)).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-[#545454]">
                      <span>{totalGuests} guest{totalGuests > 1 ? "s" : ""} ({Math.ceil(totalGuests / baseGroupSize)} × ${(priceOverride ?? basePrice).toFixed(0)})</span>
                      <span>${baseTotalPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedVariation && (
                    <div className="flex justify-between text-[#545454]">
                      <span>{selectedVariation.name}</span>
                      <span>+${variationExtra.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[#111] pt-1.5 border-t border-[#E4E0D9]">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-[#7A746D] mb-3">All taxes and fees included</p>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-[#1A6BFF] hover:bg-[#1558D6] text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
                >
                  Continue
                </button>
              </div>
            </div>

            <div className="h-5" />
          </div>
        </div>
      </>
    )}
    </>
  );
}
