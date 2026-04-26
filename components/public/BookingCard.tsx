"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";
import Link from "next/link";
import {
  Calendar, Users, MapPin, ChevronDown, ChevronUp,
  Hash, CreditCard, Banknote, FileText, AlertTriangle, X, Loader2, MessageCircle, Wallet,
} from "lucide-react";
import { cancelBooking } from "@/app/(public)/bookings/actions";
import { ChatPopup } from "@/components/public/ChatPopup";

interface BookingCardProps {
  booking: {
    id:              string;
    bookingRef:      string;
    status:          string;
    paymentStatus:   string;
    paymentMethod:   string;
    tourDate:        string;
    numAdults:       number;
    numChildren:     number;
    totalAmount:     number;
    currency:        string;
    specialRequests: string | null;
    createdAt:       string;
    tour: {
      title:    string;
      slug:     string;
      location: string;
      image:    string | null;
    };
  };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-[#FEF3C7] text-[#B45309]",
  CONFIRMED: "bg-[#DCFCE7] text-[#15803D]",
  COMPLETED: "bg-[#DBEAFE] text-[#1B6FA8]",
  CANCELLED: "bg-[#FEE2E2] text-[#DC2626]",
  NO_SHOW:   "bg-[#F1EFE9] text-[#7A746D]",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW:   "No Show",
};

const PAYMENT_LABEL: Record<string, string> = {
  PENDING:               "Payment pending",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  PAID:                  "Paid",
  REFUNDED:              "Refunded",
  FAILED:                "Payment failed",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

export function BookingCard({ booking }: BookingCardProps) {
  const [open,        setOpen]        = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();

  const dateObj  = new Date(booking.tourDate);
  const now      = new Date();
  const isPast   = dateObj < now;
  const diffDays = (dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const canCancel = !isPast && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
  const canPay    = !isPast
    && booking.status !== "CANCELLED"
    && booking.status !== "COMPLETED"
    && (booking.paymentStatus === "PENDING" || booking.paymentStatus === "FAILED");

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(booking.id);
      if (result.error) {
        setError(result.error);
      }
      setConfirming(false);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden transition-shadow hover:shadow-md">

      {/* ── Main card row ── */}
      <div className="flex flex-col md:flex-row">

        {/* Thumbnail */}
        <div className="md:w-64 h-48 md:h-auto relative shrink-0">
          {booking.tour.image ? (
            <Image src={cldUrl(booking.tour.image, CLD_CARD)} alt={booking.tour.title} fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#F0EDE8] flex items-center justify-center">
              <MapPin className="size-8 text-[#C4BAB0]" />
            </div>
          )}
          {/* Status pill over image */}
          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${STATUS_BADGE[booking.status] ?? ""}`}>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="text-lg font-bold font-display text-[#111] hover:text-[#C41230] transition-colors leading-snug">
              <Link href={"/tours/" + booking.tour.slug}>{booking.tour.title}</Link>
            </h3>
            <span className="text-xs text-[#A8A29E] whitespace-nowrap shrink-0 mt-1">
              {fmtDate(booking.createdAt)}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-sm text-[#7A746D] mb-4">
            <MapPin className="size-3.5 shrink-0" />
            {booking.tour.location}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#111] mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#A8A29E]" />
              <span className="font-medium">{fmtDate(booking.tourDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[#A8A29E]" />
              <span className="font-medium">
                {booking.numAdults} adult{booking.numAdults !== 1 ? "s" : ""}
                {booking.numChildren > 0 ? ` · ${booking.numChildren} child${booking.numChildren !== 1 ? "ren" : ""}` : ""}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-[#E4E0D9] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#7A746D]">Total</p>
              <p className="text-lg font-bold text-[#111]">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency || "USD", maximumFractionDigits: 0 }).format(booking.totalAmount)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {booking.status === "COMPLETED" && (
                <Link
                  href={"/bookings/" + booking.id + "/review"}
                  className="text-sm font-bold text-white bg-[#1B2847] hover:bg-[#131e38] px-4 py-2 rounded-lg transition-colors"
                >
                  Leave a review
                </Link>
              )}
              {canPay && (
                <Link
                  href={"/bookings/" + booking.id + "/pay"}
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#C41230] hover:bg-[#A00F27] transition-colors px-4 py-2 rounded-lg"
                >
                  <Wallet className="size-4" />
                  Complete payment
                </Link>
              )}
              {/* Chat with guide */}
              {booking.status !== "CANCELLED" && (
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#1B2847] border border-[#1B2847] bg-white hover:bg-[#1B2847] hover:text-white transition-colors px-4 py-2 rounded-lg"
                >
                  <MessageCircle className="size-4" />
                  Chat with guide
                </button>
              )}
              {booking.status !== "COMPLETED" && (canCancel || !isPast) && (
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#111] border border-[#E4E0D9] bg-white hover:border-[#C41230] hover:text-[#C41230] transition-colors px-4 py-2 rounded-lg"
                >
                  Manage booking
                  {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded manage panel ── */}
      {open && (
        <div className="border-t border-[#E4E0D9] bg-[#F8F7F5]">

          {/* Details grid */}
          <div className="divide-y divide-[#E4E0D9]">
            {[
              {
                label: "Booking ref",
                value: (
                  <div className="flex items-center gap-2">
                    <Hash className="size-3.5 text-[#7A746D]" />
                    <span className="font-mono font-bold text-[#1B2847]">{booking.bookingRef}</span>
                  </div>
                ),
              },
              {
                label: "Tour date",
                value: (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-[#7A746D]" />
                    {fmtDate(booking.tourDate)}
                    {!isPast && diffDays < 7 && (
                      <span className="text-xs font-semibold text-[#C41230]">· in {Math.ceil(diffDays)} day{Math.ceil(diffDays) !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                ),
              },
              {
                label: "Travelers",
                value: `${booking.numAdults} adult${booking.numAdults !== 1 ? "s" : ""}${booking.numChildren > 0 ? ` · ${booking.numChildren} child${booking.numChildren !== 1 ? "ren" : ""}` : ""}`,
              },
              {
                label: "Payment",
                value: (
                  <div className="flex items-center gap-2">
                    {booking.paymentMethod === "BANK_TRANSFER"
                      ? <Banknote className="size-3.5 text-[#7A746D]" />
                      : <CreditCard className="size-3.5 text-[#7A746D]" />}
                    {booking.paymentMethod === "STRIPE"        ? "Card / Stripe"
                      : booking.paymentMethod === "PAYPAL"     ? "PayPal"
                      : "Bank transfer"}
                    <span className="text-xs text-[#7A746D]">· {PAYMENT_LABEL[booking.paymentStatus] ?? booking.paymentStatus}</span>
                  </div>
                ),
              },
              ...(booking.specialRequests ? [{
                label: "Special requests",
                value: (
                  <div className="flex items-start gap-2 text-[#545454]">
                    <FileText className="size-3.5 text-[#7A746D] mt-0.5 shrink-0" />
                    {booking.specialRequests}
                  </div>
                ),
              }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="grid gap-4 px-6 py-3.5" style={{ gridTemplateColumns: "160px 1fr" }}>
                <p className="text-xs font-semibold text-[#7A746D] pt-0.5">{label}</p>
                <div className="text-sm text-[#111]">{value}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-[#E4E0D9] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={"/tours/" + booking.tour.slug}
                className="text-sm font-semibold text-[#1B2847] hover:underline"
              >
                View tour page →
              </Link>
            </div>

            {canCancel && (
              !confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#DC2626] border border-[#FCA5A5] bg-white hover:bg-[#FEE2E2] px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="size-4" />
                  Cancel booking
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl px-4 py-3">
                  <AlertTriangle className="size-4 text-[#DC2626] shrink-0" />
                  <p className="text-sm text-[#DC2626] font-medium">Are you sure you want to cancel?</p>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Yes, cancel
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs font-semibold text-[#545454] hover:text-[#111] transition-colors"
                  >
                    Keep booking
                  </button>
                </div>
              )
            )}
          </div>

          {error && (
            <p className="px-6 pb-4 text-sm text-[#DC2626] font-medium">{error}</p>
          )}
        </div>
      )}

      {/* Chat popup */}
      {chatOpen && (
        <ChatPopup
          bookingId={booking.id}
          tourTitle={booking.tour.title}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
