"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingWidgetProps {
  tourId: string;
  basePrice: number;
  childPrice?: number | null;
  likelyToSellOut: boolean;
}

export function BookingWidget({ tourId, basePrice, childPrice, likelyToSellOut }: BookingWidgetProps) {
  const router = useRouter();
  
  // Tomorrow's date as default minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const totalPrice = (adults * basePrice) + (children * (childPrice || basePrice));

  const handleBooking = () => {
    if (!date) return;
    const searchParams = new URLSearchParams({
      date,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/booking/${tourId}?${searchParams.toString()}`);
  };

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E0D9] p-6 shadow-xl shadow-black/5">
      <div className="mb-6 border-b border-[#E4E0D9] pb-6">
        <span className="text-[#7A746D] text-sm block mb-1">Price from</span>
        <div className="flex items-end gap-2 text-[#111]">
          <span className="text-4xl font-display font-bold">${basePrice}</span>
          <span className="text-[#7A746D] mb-1">/ person</span>
        </div>
        {likelyToSellOut && (
          <p className="text-[#C41230] text-sm font-medium flex items-center gap-1.5 mt-3">
            <Clock className="size-4" /> High demand. Book soon!
          </p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-semibold text-[#111] block mb-2">Select Date</label>
          <div className="relative">
            <input 
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 rounded-lg border border-[#E4E0D9] pl-11 pr-4 text-[#111] bg-[#F8F7F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-colors"
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#A8A29E] pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-[#111] block mb-2">Adults</label>
            <div className="flex items-center justify-between border border-[#E4E0D9] rounded-lg bg-[#F8F7F5] p-1">
              <button 
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                disabled={adults <= 1}
              >-</button>
              <span className="font-semibold w-6 text-center text-[#111]">{adults}</span>
              <button 
                onClick={() => setAdults(adults + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm"
              >+</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111] block mb-2">Children</label>
            <div className="flex items-center justify-between border border-[#E4E0D9] rounded-lg bg-[#F8F7F5] p-1">
              <button 
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm disabled:opacity-50"
                disabled={children <= 0}
              >-</button>
              <span className="font-semibold w-6 text-center text-[#111]">{children}</span>
              <button 
                onClick={() => setChildren(children + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-[#111] shadow-sm"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4E0D9] pt-4 mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-[#111]">Total Price</span>
          <span className="text-2xl font-bold text-[#111]">${totalPrice.toFixed(2)}</span>
        </div>
        <span className="text-xs text-[#7A746D]">No hidden fees — taxes included</span>
      </div>

      <button 
        onClick={handleBooking}
        disabled={!date}
        className="w-full bg-[#C41230] hover:bg-[#A00F27] text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-md disabled:bg-[#A8A29E] disabled:cursor-not-allowed mb-4"
      >
        Book Now
      </button>

      <div className="text-center text-sm text-[#7A746D] flex flex-col gap-2">
        <span className="flex items-center justify-center gap-1.5"><CheckCircle className="size-4 text-[#15803D]" /> Free cancellation up to 24h</span>
        <span className="flex items-center justify-center gap-1.5"><CheckCircle className="size-4 text-[#15803D]" /> Reserve now, pay later</span>
      </div>
    </div>
  );
}
