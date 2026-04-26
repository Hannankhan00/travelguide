"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                    from "next/navigation";
import Script                           from "next/script";
import { User, Phone, Mail, Map as MapIcon, ShieldCheck, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/public/MapPickerComponent"), { ssr: false });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { paypal?: any; }
}

interface CheckoutFormProps {
  tourId:         string;
  date:           string;
  adults:         number;
  numChildren:    number;
  totalPrice:     number;
  startTime?:     string | null;
  variationId?:   string | null;
  variationName?: string | null;
  variationExtra?: number;
  userProfile:    { name: string | null; email: string | null; phone: string | null } | null;
}

export function CheckoutForm({
  tourId, date, adults, numChildren, totalPrice,
  startTime, variationId, variationName, variationExtra = 0,
  userProfile,
}: CheckoutFormProps) {
  const router = useRouter();
  const formRef           = useRef<HTMLFormElement>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalMounted     = useRef(false);

  const [error,        setError]        = useState<string | null>(null);
  const [isPending,    setIsPending]    = useState(false);
  const [paypalReady,  setPaypalReady]  = useState(false);

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLat,      setPickupLat]      = useState<number | null>(null);
  const [pickupLng,      setPickupLng]      = useState<number | null>(null);
  const [showMap,        setShowMap]        = useState(false);

  const defaultFirstName = userProfile?.name?.split(" ")[0] || "";
  const defaultLastName  = userProfile?.name?.split(" ").slice(1).join(" ") || "";

  function mountPayPalButtons() {
    if (!window.paypal || !paypalContainerRef.current || paypalMounted.current) return;
    paypalMounted.current = true;

    window.paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 48 },

      onClick(_data: unknown, actions: { resolve(): void; reject(): void }) {
        if (!formRef.current) return actions.reject();
        const fd  = new FormData(formRef.current);
        const fn  = (fd.get("firstName")  as string)?.trim();
        const ln  = (fd.get("lastName")   as string)?.trim();
        const em  = (fd.get("email")      as string)?.trim();
        const ph  = (fd.get("phone")      as string)?.trim();
        if (!fn || !ln || !em || !ph) {
          setError("Please fill in all required fields before proceeding to payment.");
          return actions.reject();
        }
        setError(null);
        return actions.resolve();
      },

      async createOrder() {
        if (!formRef.current) throw new Error("Form unavailable");
        const fd  = new FormData(formRef.current);
        const res = await fetch("/api/paypal/create-order", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            tourId:      fd.get("tourId"),
            adults:      fd.get("adults"),
            children:    fd.get("children"),
            variationId: fd.get("variationId") || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create PayPal order");
        return data.orderId as string;
      },

      async onApprove(data: { orderID: string }) {
        setIsPending(true);
        setError(null);
        if (!formRef.current) { setIsPending(false); return; }

        const fd  = new FormData(formRef.current);
        const obj: Record<string, string> = {};
        fd.forEach((v, k) => { obj[k] = v as string; });

        const res    = await fetch("/api/paypal/capture-order", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ orderId: data.orderID, ...obj }),
        });
        const result = await res.json();

        if (!res.ok) {
          setError(result.error ?? "Payment captured but booking failed. Please contact support.");
          setIsPending(false);
          return;
        }

        router.push(
          result.isLoggedIn
            ? "/bookings?success=true"
            : `/?success=true&ref=${result.bookingRef}`,
        );
      },

      onError(err: unknown) {
        console.error("[PayPal error]", err);
        setError("Payment failed. Please try again or contact support.");
      },

      onCancel() {
        setError(null);
      },
    }).render(paypalContainerRef.current);
  }

  // Handle case where SDK already loaded (SPA navigation back to this page)
  useEffect(() => {
    if (typeof window !== "undefined" && window.paypal) {
      setPaypalReady(true);
    }
  }, []);

  useEffect(() => {
    if (paypalReady) mountPayPalButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalReady]);

  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;

  return (
    <>
      <Script src={sdkSrc} onLoad={() => setPaypalReady(true)} />

      <form ref={formRef} className="space-y-6">
        {/* ── Hidden fields ── */}
        <input type="hidden" name="tourId"        value={tourId} />
        <input type="hidden" name="date"          value={date} />
        <input type="hidden" name="adults"        value={adults} />
        <input type="hidden" name="children"      value={numChildren} />
        <input type="hidden" name="totalPrice"    value={totalPrice} />
        {startTime     && <input type="hidden" name="startTime"     value={startTime} />}
        {variationId   && <input type="hidden" name="variationId"   value={variationId} />}
        {variationName && <input type="hidden" name="variationName" value={variationName} />}
        {variationExtra > 0 && <input type="hidden" name="variationExtra" value={variationExtra} />}

        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl border border-[#FCA5A5]/50 font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* ── 1. Lead Traveler Details ── */}
        <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-display text-[#111] mb-6 flex items-center gap-2">
            <User className="size-5 text-[#185FA5]" /> Lead Traveler Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">First Name *</label>
              <input type="text" name="firstName" required defaultValue={defaultFirstName}
                className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">Last Name *</label>
              <input type="text" name="lastName" required defaultValue={defaultLastName}
                className="w-full h-12 px-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">Email Address *</label>
              <div className="relative">
                <input type="email" name="email" required defaultValue={userProfile?.email || ""}
                  className="w-full h-12 pl-11 pr-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
              </div>
              <p className="text-xs text-[#7A746D] mt-1.5">We&apos;ll send your tickets here.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">Phone Number *</label>
              <div className="relative">
                <input type="tel" name="phone" required defaultValue={userProfile?.phone || ""}
                  className="w-full h-12 pl-11 pr-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors"
                  placeholder="+1 (555) 000-0000" />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
              </div>
              <p className="text-xs text-[#7A746D] mt-1.5">In case of urgent updates on the tour day.</p>
            </div>
          </div>
        </section>

        {/* ── 2. Logistics & Requirements ── */}
        <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm relative">
          <h2 className="text-xl font-bold font-display text-[#111] mb-6 flex items-center gap-2">
            <MapIcon className="size-5 text-[#185FA5]" /> Logistics &amp; Requirements
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">Pickup Location (Hotel Name / Address)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="pickupLocation"
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.target.value);
                    setPickupLat(null);
                    setPickupLng(null);
                  }}
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
              {pickupLat !== null && pickupLng !== null && (
                <p className="text-xs text-[#15803D] mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                  Exact pin: {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                </p>
              )}
              {pickupLat !== null && <input type="hidden" name="pickupLat" value={pickupLat} />}
              {pickupLng !== null && <input type="hidden" name="pickupLng" value={pickupLng} />}
              <p className="text-xs text-[#7A746D] mt-1">If your tour includes hotel pickup, please specify. Otherwise leave blank.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111] mb-2">Special Requirements</label>
              <textarea name="specialRequests" rows={3}
                className="w-full p-4 rounded-lg border border-[#E7E8EE] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] outline-none transition-colors resize-none"
                placeholder="Dietary restrictions, wheelchair access, etc." />
            </div>
          </div>

          {showMap && (
            <MapPicker
              onLocationSelect={(addr, lat, lng) => {
                setPickupLocation(addr);
                setPickupLat(lat);
                setPickupLng(lng);
                setShowMap(false);
              }}
              onClose={() => setShowMap(false)}
            />
          )}
        </section>

        {/* ── 3. Payment ── */}
        <section className="bg-white rounded-2xl border border-[#E7E8EE] p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-display text-[#111] mb-5 flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#185FA5]" /> Secure Payment
          </h2>

          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-[#0369A1]">
            <ShieldCheck className="size-4 mt-0.5 shrink-0 text-[#0284C7]" />
            <span>Your payment is processed securely by PayPal. You can pay with your PayPal balance or any major credit / debit card.</span>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center gap-3 h-14 text-[#545454] font-medium">
              <span className="w-5 h-5 border-2 border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
              Confirming your booking…
            </div>
          ) : (
            <div ref={paypalContainerRef} className="min-h-12">
              {!paypalReady && (
                <div className="flex items-center justify-center h-12 text-sm text-[#7A746D]">
                  Loading payment options…
                </div>
              )}
            </div>
          )}
        </section>
      </form>
    </>
  );
}
