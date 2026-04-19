"use client";

import { useState, useTransition } from "react";
import { User, Phone, Mail, Map as MapIcon, Lock, CreditCard, Navigation } from "lucide-react";
import { submitBookingAction } from "@/app/(public)/booking/[tourId]/actions";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/public/MapPickerComponent"), { ssr: false });

interface CheckoutFormProps {
  tourId: string;
  date: string;
  adults: number;
  children: number;
  totalPrice: number;
  userProfile: { name: string | null; email: string | null; phone: string | null } | null;
}

export function CheckoutForm({ tourId, date, adults, children, totalPrice, userProfile }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [showMap, setShowMap] = useState(false);

  // Split name if exists
  const defaultFirstName = userProfile?.name?.split(" ")[0] || "";
  const defaultLastName = userProfile?.name?.split(" ").slice(1).join(" ") || "";

  async function handleFormSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitBookingAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleFormSubmit} className="space-y-6">
      <input type="hidden" name="tourId" value={tourId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="adults" value={adults} />
      <input type="hidden" name="children" value={children} />
      <input type="hidden" name="totalPrice" value={totalPrice} />

      {error && (
        <div className="p-4 bg-[#FEE2E2] text-[#185FA5] rounded-xl border border-[#FCA5A5]/50 font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* 1. Lead Traveler Details */}
      <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold font-display text-[#111] mb-6 flex items-center gap-2">
          <User className="size-5 text-[#185FA5]" /> Lead Traveler Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">First Name *</label>
            <input type="text" name="firstName" required defaultValue={defaultFirstName} className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">Last Name *</label>
            <input type="text" name="lastName" required defaultValue={defaultLastName} className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">Email Address *</label>
            <div className="relative">
              <input type="email" name="email" required defaultValue={userProfile?.email || ""} className="w-full h-12 pl-11 pr-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
            </div>
            <p className="text-xs text-[#7A746D] mt-1.5">We'll send your tickets here.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">Phone Number *</label>
            <div className="relative">
              <input type="tel" name="phone" required defaultValue={userProfile?.phone || ""} className="w-full h-12 pl-11 pr-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" placeholder="+1 (555) 000-0000" />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
            </div>
            <p className="text-xs text-[#7A746D] mt-1.5">In case of urgent updates on the tour day.</p>
          </div>
        </div>
      </section>

      {/* 2. Additional Info */}
      <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm relative">
        <h2 className="text-xl font-bold font-display text-[#111] mb-6 flex items-center gap-2">
          <MapIcon className="size-5 text-[#185FA5]" /> Logistics & Requirements
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">Pickup Location (Hotel Name / Address)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                name="pickupLocation" 
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="flex-1 w-full h-12 px-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" 
                placeholder="e.g. Shinjuku Prince Hotel" 
              />
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="h-12 px-4 bg-[#F8F9FF] hover:bg-[#E7E8EE] border border-[#E7E8EE] text-[#111] font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0"
              >
                <Navigation className="size-4" />
                <span className="max-sm:hidden">Pick on Map</span>
              </button>
            </div>
            <p className="text-xs text-[#7A746D] mt-1.5">If your tour includes hotel pickup, please specify. Otherwise, leave blank.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111] mb-2">Special Requirements</label>
            <textarea name="specialRequests" rows={3} className="w-full p-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors resize-none" placeholder="Dietary restrictions, wheelchair access, etc."></textarea>
          </div>
        </div>

        {showMap && (
          <MapPicker 
            onLocationSelect={(addr) => {
              setPickupLocation(addr);
              setShowMap(false);
            }} 
            onClose={() => setShowMap(false)} 
          />
        )}
      </section>

      {/* 3. Payment Method Simulation */}
      <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold font-display text-[#111] mb-6 flex items-center gap-2">
          <CreditCard className="size-5 text-[#185FA5]" /> Payment
        </h2>
        <div className="bg-[#F8F9FF] rounded-xl border border-[#E7E8EE] p-5 flex items-start gap-4 mb-6">
          <div className="bg-white rounded-full p-2 shadow-sm shrink-0 border border-[#E7E8EE]">
            <Lock className="size-5 text-[#15803D]" />
          </div>
          <div>
            <h4 className="font-bold text-[#111]">Secure Payment Reservation</h4>
            <p className="text-sm text-[#545454] mt-1">This is a demonstration environment. No actual payment will be processed. Clicking confirm will lock in your reservation.</p>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={isPending}
          className="w-full h-14 bg-[#185FA5] hover:bg-[#12487F] text-white text-lg font-bold rounded-xl transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {isPending && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Confirm Reservation
        </button>
      </section>

    </form>
  );
}
