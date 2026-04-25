"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                    from "next/navigation";
import Script                           from "next/script";
import { ShieldCheck }                  from "lucide-react";

declare global {
  interface Window { paypal?: any; }
}

interface CompletePaymentFormProps {
  bookingId:   string;
  totalAmount: number;
  currency:    string;
}

export function CompletePaymentForm({ bookingId, totalAmount, currency }: CompletePaymentFormProps) {
  const router              = useRouter();
  const containerRef        = useRef<HTMLDivElement>(null);
  const mounted             = useRef(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [isPending,   setIsPending]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function mountButtons() {
    if (!window.paypal || !containerRef.current || mounted.current) return;
    mounted.current = true;

    window.paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 48 },

      async createOrder() {
        const res  = await fetch("/api/paypal/create-order-for-booking", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ bookingId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create PayPal order");
        return data.orderId as string;
      },

      async onApprove(data: { orderID: string }) {
        setIsPending(true);
        setError(null);
        const res    = await fetch("/api/paypal/complete-booking", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ bookingId, orderId: data.orderID }),
        });
        const result = await res.json();
        if (!res.ok) {
          setError(result.error ?? "Payment captured but booking update failed. Please contact support.");
          setIsPending(false);
          return;
        }
        router.push("/bookings?success=true");
      },

      onError(err: unknown) {
        console.error("[PayPal error]", err);
        setError("Payment failed. Please try again or contact support.");
      },

      onCancel() {
        setError(null);
      },
    }).render(containerRef.current);
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.paypal) {
      setPaypalReady(true);
    }
  }, []);

  useEffect(() => {
    if (paypalReady) mountButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalReady]);

  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}&components=buttons`;

  return (
    <>
      <Script src={sdkSrc} onLoad={() => setPaypalReady(true)} />

      <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-[#0369A1]">
        <ShieldCheck className="size-4 mt-0.5 shrink-0 text-[#0284C7]" />
        <span>Your payment is processed securely by PayPal. You can pay with your PayPal balance or any major credit / debit card.</span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl border border-[#FCA5A5]/50 font-medium">
          {error}
        </div>
      )}

      {isPending ? (
        <div className="flex items-center justify-center gap-3 h-14 text-[#545454] font-medium">
          <span className="w-5 h-5 border-2 border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
          Confirming your payment…
        </div>
      ) : (
        <div ref={containerRef} className="min-h-12">
          {!paypalReady && (
            <div className="flex items-center justify-center h-12 text-sm text-[#7A746D]">
              Loading payment options…
            </div>
          )}
        </div>
      )}
    </>
  );
}
