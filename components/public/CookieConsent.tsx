"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie, X, Check } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("cookie_consent");
    } catch {
      // private browsing — don't show
      return false;
    }
  });

  const accept = () => {
    try { localStorage.setItem("cookie_consent", "accepted"); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem("cookie_consent", "declined"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
    >
      <div className="bg-[#1B2847] text-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Dismiss */}
        <button
          onClick={decline}
          aria-label="Dismiss"
          className="absolute top-3 right-3 p-1 rounded-lg text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#C41230]/20 flex items-center justify-center">
              <Cookie className="size-4 text-[#C41230]" />
            </div>
            <p className="font-bold text-sm">We use cookies</p>
          </div>

          <p className="text-white/60 text-xs leading-relaxed">
            We use essential cookies to keep you signed in and protect your
            session. We don&apos;t use advertising or tracking cookies.{" "}
            <Link href="/privacy" className="text-[#C41230] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={accept}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#C41230] hover:bg-[#A00F27] text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            <Check className="size-3.5" /> Accept
          </button>
          <button
            onClick={decline}
            className="flex-1 text-xs font-semibold text-white/50 hover:text-white border border-white/15 hover:border-white/30 py-2.5 rounded-xl transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
