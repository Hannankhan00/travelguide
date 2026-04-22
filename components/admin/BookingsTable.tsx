"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Clock, CheckCircle2, XCircle, AlertCircle,
  CreditCard, Banknote, Users, Calendar, Mail, Phone,
  FileText, StickyNote, Check, MapPin, Ticket, Download,
  ExternalLink, Filter,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  updateBookingStatus,
  updatePaymentStatus,
  updateAdminNotes,
} from "@/app/(admin)/admin/bookings/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id:              string;
  bookingRef:      string;
  tourTitle:       string;
  tourSlug:        string;
  tourImage:       string | null;
  guestName:       string;
  guestEmail:      string;
  guestPhone:      string | null;
  tourDate:        string;
  numAdults:       number;
  numChildren:     number;
  totalAmount:     number;
  currency:        string;
  status:          string;
  paymentStatus:   string;
  paymentMethod:   string;
  adminNotes:      string;
  specialRequests: string;
  createdAt:       string;
  paidAt:          string | null;
}

interface Props {
  bookings:   Booking[];
  total:      number;
  page:       number;
  totalPages: number;
  query:      string;
  status:     string;
  payment:    string;
  dateFrom:   string;
  dateTo:     string;
  tourDate:   string;
  currency:   string;
  locale:     string;
  isCompletedPage?: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const BOOKING_STATUSES = ["ALL","PENDING","CONFIRMED","COMPLETED","CANCELLED","NO_SHOW"];
const PAYMENT_STATUSES = ["ALL","PENDING","AWAITING_CONFIRMATION","PAID","REFUNDED","FAILED"];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:   { label: "Pending",   color: "bg-[#FEF3C7] text-[#B45309]", icon: Clock        },
  CONFIRMED: { label: "Confirmed", color: "bg-[#DCFCE7] text-[#15803D]", icon: CheckCircle2 },
  COMPLETED: { label: "Completed", color: "bg-[#DBEAFE] text-[#1B6FA8]", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-[#FEE2E2] text-[#DC2626]", icon: XCircle      },
  NO_SHOW:   { label: "No Show",   color: "bg-[#F1EFE9] text-[#7A746D]", icon: AlertCircle  },
};

const PAYMENT_CFG: Record<string, { label: string; color: string }> = {
  PENDING:               { label: "Pending",  color: "text-[#B45309]" },
  AWAITING_CONFIRMATION: { label: "Awaiting", color: "text-[#1B6FA8]" },
  PAID:                  { label: "Paid",     color: "text-[#15803D]" },
  REFUNDED:              { label: "Refunded", color: "text-[#7A746D]" },
  FAILED:                { label: "Failed",   color: "text-[#DC2626]" },
};

function fmtLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Parse structured lines out of specialRequests ──────────────────────────────

function parseSpecialRequests(raw: string) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  let pickupLocation = "";
  let pickupCoords   = "";   // "lat,lng"
  let startingTime   = "";
  let upgrade        = "";
  const other: string[] = [];

  for (const line of lines) {
    if (line.startsWith("Pickup coords:")) pickupCoords   = line.replace("Pickup coords:", "").trim();
    else if (line.startsWith("Pickup:"))   pickupLocation = line.replace("Pickup:", "").trim();
    else if (line.startsWith("Starting time:")) startingTime = line.replace("Starting time:", "").trim();
    else if (line.startsWith("Upgrade:"))  upgrade = line.replace("Upgrade:", "").trim();
    else                                   other.push(line);
  }

  // Build the best possible Maps URL
  const mapsUrl = pickupCoords
    ? `https://www.google.com/maps?q=${pickupCoords}`
    : pickupLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLocation)}`
      : "";

  return { pickupLocation, pickupCoords, mapsUrl, startingTime, upgrade, other: other.join("\n") };
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── Expanded detail panel ─────────────────────────────────────────────────────

function DetailPanel({ booking, currency, locale }: {
  booking:  Booking;
  currency: string;
  locale:   string;
}) {
  const [, startTransition] = useTransition();
  const [notes, setNotes]   = useState(booking.adminNotes);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  function handleStatus(s: string) {
    startTransition(() => { updateBookingStatus(booking.id, s); });
  }
  function handlePayment(s: string) {
    startTransition(() => { updatePaymentStatus(booking.id, s); });
  }
  async function saveNotes() {
    setSaving(true);
    await updateAdminNotes(booking.id, notes);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalGuests = booking.numAdults + booking.numChildren;
  const { pickupLocation, pickupCoords, mapsUrl, startingTime, upgrade, other } = parseSpecialRequests(booking.specialRequests);

  const detailRows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Tour date",
      value: (
        <div className="flex items-center gap-2 text-sm text-[#111]">
          <Calendar className="size-3.5 text-[#7A746D] shrink-0" />
          {fmtLong(booking.tourDate)}
        </div>
      ),
    },

    // Starting time — only shown when present
    ...(startingTime ? [{
      label: "Starting time",
      value: (
        <div className="flex items-center gap-2 text-sm text-[#111]">
          <Clock className="size-3.5 text-[#7A746D] shrink-0" />
          <span className="font-semibold">{startingTime}</span>
        </div>
      ),
    }] : []),

    {
      label: "Lead traveler",
      value: (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#111]">{booking.guestName}</p>
          <a href={"mailto:" + booking.guestEmail} className="flex items-center gap-1.5 text-xs text-[#C41230] hover:underline">
            <Mail className="size-3" />{booking.guestEmail}
          </a>
          {booking.guestPhone && (
            <a href={"tel:" + booking.guestPhone} className="flex items-center gap-1.5 text-xs text-[#C41230] hover:underline">
              <Phone className="size-3" />{booking.guestPhone}
            </a>
          )}
        </div>
      ),
    },
    {
      label: "Participants",
      value: (
        <div className="text-sm text-[#111]">
          <p>{booking.numAdults} adult{booking.numAdults !== 1 ? "s" : ""}
            {booking.numChildren > 0 ? ` · ${booking.numChildren} child${booking.numChildren !== 1 ? "ren" : ""}` : ""}
          </p>
          <p className="text-xs text-[#7A746D] mt-0.5">Total: {totalGuests} {totalGuests === 1 ? "person" : "people"}</p>
        </div>
      ),
    },

    // Pickup location with map link
    ...(pickupLocation ? [{
      label: "Pickup location",
      value: (
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5 text-sm text-[#111]">
            <MapPin className="size-3.5 text-[#7A746D] mt-0.5 shrink-0" />
            <span>{pickupLocation}</span>
          </div>
          {pickupCoords && (
            <p className="text-xs text-[#7A746D] flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#15803D]" />
              Exact pin: {pickupCoords}
            </p>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1B2847] hover:bg-[#243560] px-2.5 py-1 rounded-lg transition-colors"
            >
              <ExternalLink className="size-3" /> View exact location on Google Maps
            </a>
          )}
        </div>
      ),
    }] : []),

    // Upgrade / variation
    ...(upgrade ? [{
      label: "Upgrade selected",
      value: (
        <div className="flex items-center gap-2 text-sm text-[#111]">
          <span className="inline-block bg-[#FEF3C7] text-[#B45309] text-xs font-semibold px-2 py-0.5 rounded-full">
            {upgrade}
          </span>
        </div>
      ),
    }] : []),

    {
      label: "Payment",
      value: (
        <div className="flex items-center gap-2 text-sm text-[#111]">
          {booking.paymentMethod === "STRIPE"
            ? <CreditCard className="size-3.5 text-[#7A746D]" />
            : <Banknote className="size-3.5 text-[#7A746D]" />}
          {booking.paymentMethod === "STRIPE" ? "Stripe / Card" : "Bank transfer"}
          {booking.paidAt && <span className="text-xs text-[#7A746D]">· paid {fmtShort(booking.paidAt)}</span>}
        </div>
      ),
    },
    {
      label: "Total amount",
      value: (
        <p className="text-sm font-bold text-[#111]">
          {formatPrice(booking.totalAmount, booking.currency || currency, locale)}
        </p>
      ),
    },

    // Other special requests (anything not parsed as a structured field)
    ...(other ? [{
      label: "Special requests",
      value: (
        <div className="flex items-start gap-2 text-sm text-[#545454]">
          <FileText className="size-3.5 text-[#7A746D] mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{other}</span>
        </div>
      ),
    }] : []),

    {
      label: "Booking status",
      value: (
        <div className="flex flex-wrap gap-1.5">
          {["PENDING","CONFIRMED","COMPLETED","CANCELLED","NO_SHOW"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors
                ${booking.status === s
                  ? "bg-[#1B2847] text-white border-[#1B2847]"
                  : "bg-white text-[#545454] border-[#E4E0D9] hover:border-[#1B2847] hover:text-[#1B2847]"}`}
            >
              {STATUS_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
      ),
    },
    {
      label: "Payment status",
      value: (
        <div className="flex flex-wrap gap-1.5">
          {["PENDING","AWAITING_CONFIRMATION","PAID","REFUNDED","FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => handlePayment(s)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors
                ${booking.paymentStatus === s
                  ? "bg-[#C41230] text-white border-[#C41230]"
                  : "bg-white text-[#545454] border-[#E4E0D9] hover:border-[#C41230] hover:text-[#C41230]"}`}
            >
              {PAYMENT_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
      ),
    },
    {
      label: "Admin notes",
      value: (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes — not visible to customer…"
            className="w-full max-w-lg text-sm text-[#111] bg-white border border-[#E4E0D9] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C41230] hover:bg-[#a50f28] disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
          >
            {saved ? <Check className="size-3" /> : <StickyNote className="size-3" />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="border-t border-[#E4E0D9] bg-[#F8F7F5]">
      <div className="divide-y divide-[#E4E0D9]">
        {detailRows.map(({ label, value }) => (
          <div key={label} className="grid gap-6 px-6 py-3.5" style={{ gridTemplateColumns: "180px 1fr" }}>
            <p className="text-xs font-semibold text-[#7A746D] pt-0.5">{label}</p>
            <div>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Booking card row ──────────────────────────────────────────────────────────

function BookingCard({ booking, isOpen, onToggle, currency, locale }: {
  booking:  Booking;
  isOpen:   boolean;
  onToggle: () => void;
  currency: string;
  locale:   string;
}) {
  const totalGuests = booking.numAdults + booking.numChildren;
  const payCfg      = PAYMENT_CFG[booking.paymentStatus] ?? PAYMENT_CFG.PENDING;
  const { startingTime, pickupLocation, mapsUrl } = parseSpecialRequests(booking.specialRequests);

  return (
    <div className={`border border-[#E4E0D9] rounded-xl overflow-hidden bg-white transition-shadow ${isOpen ? "shadow-md" : "shadow-sm hover:shadow-md"}`}>

      {/* Main row */}
      <div className="flex items-start gap-4 px-5 py-4">

        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-[#E4E0D9]">
          {booking.tourImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.tourImage} alt={booking.tourTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="size-5 text-[#A8A29E]" />
            </div>
          )}
        </div>

        {/* Centre content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="min-w-0">
              <p className="font-bold text-[#111] text-sm leading-snug truncate">{booking.tourTitle}</p>
              <p className="text-xs text-[#7A746D] mt-0.5 truncate">
                {booking.guestName} · {booking.guestEmail}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-xs text-[#A8A29E] whitespace-nowrap">
                {fmtShort(booking.createdAt)}
              </p>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#545454]">
              <Calendar className="size-3.5 text-[#7A746D] shrink-0" />
              {fmtDateTime(booking.tourDate)}
            </div>
            {startingTime && (
              <div className="flex items-center gap-1 text-xs font-semibold text-[#1B6FA8]">
                <Clock className="size-3.5 shrink-0" />
                {startingTime}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-[#545454]">
              <Ticket className="size-3.5 text-[#7A746D] shrink-0" />
              <span className="font-mono font-semibold text-[#1B2847]">{booking.bookingRef}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#545454]">
              <Users className="size-3.5 text-[#7A746D] shrink-0" />
              {totalGuests} {totalGuests === 1 ? "person" : "people"}
            </div>
            {pickupLocation && (
              mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#1B6FA8] hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate max-w-40">{pickupLocation}</span>
                </a>
              ) : (
                <div className="flex items-center gap-1 text-xs text-[#545454]">
                  <MapPin className="size-3.5 text-[#7A746D] shrink-0" />
                  <span className="truncate max-w-40">{pickupLocation}</span>
                </div>
              )
            )}
            <div className={`text-xs font-bold ${payCfg.color}`}>
              {formatPrice(booking.totalAmount, booking.currency || currency, locale)}
            </div>
          </div>
        </div>

        {/* Show/hide details button */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs font-semibold text-[#C41230] hover:text-[#a50f28] whitespace-nowrap shrink-0 mt-1 transition-colors"
        >
          {isOpen ? (
            <>Hide details <ChevronUp className="size-3.5" /></>
          ) : (
            <>Show details <ChevronDown className="size-3.5" /></>
          )}
        </button>
      </div>

      {/* Expanded details */}
      {isOpen && (
        <DetailPanel booking={booking} currency={currency} locale={locale} />
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BookingsTable({
  bookings, total, page, totalPages,
  query, status, payment, dateFrom, dateTo, tourDate,
  currency, locale, isCompletedPage
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDateFilters, setShowDateFilters] = useState(!!(dateFrom || dateTo || tourDate));

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.delete("page");
    router.push(pathname + "?" + params.toString());
  }, [router, pathname, searchParams]);

  const clearAll = () => router.push(pathname);

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(pathname + "?" + params.toString());
  };

  const hasActiveFilters = query || status !== "ALL" || payment !== "ALL" || dateFrom || dateTo || tourDate;

  return (
    <div className="space-y-4">

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] px-4 py-3 space-y-3">

        {/* Row 1 — search + status + payment + toggles */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
            <input
              defaultValue={query}
              placeholder="Search ref, guest, tour…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#E4E0D9] rounded-lg bg-[#F8F7F5] text-[#111] placeholder-[#B0AAA3] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
              onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", (e.target as HTMLInputElement).value); }}
              onChange={(e)  => { if (!e.target.value) updateParam("q", ""); }}
            />
          </div>
          {!isCompletedPage && (
            <select
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-white text-[#111] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
            >
              {["ACTIVE", "PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW", "ALL"].map((s) => (
                <option key={s} value={s}>{s === "ACTIVE" ? "All active" : s === "ALL" ? "All (inc. completed)" : STATUS_CFG[s]?.label ?? s}</option>
              ))}
            </select>
          )}
          <select
            value={payment}
            onChange={(e) => updateParam("payment", e.target.value)}
            className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-white text-[#111] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All payments" : PAYMENT_CFG[s]?.label ?? s}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDateFilters(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
              showDateFilters || dateFrom || dateTo || tourDate
                ? "bg-[#1B2847] text-white border-[#1B2847]"
                : "bg-white text-[#545454] border-[#E4E0D9] hover:border-[#1B2847] hover:text-[#1B2847]"
            }`}
          >
            <Filter className="size-3.5" /> Date filters
          </button>
          {hasActiveFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs font-semibold text-[#C41230] hover:underline">
              <X className="size-3.5" /> Clear all
            </button>
          )}
          <p className="text-xs text-[#A8A29E] ml-auto">{total.toLocaleString()} result{total !== 1 ? "s" : ""}</p>
          <a
            href={
              "/api/admin/bookings/export?" +
              new URLSearchParams([
                ...(query    ? [["q",        query   ]] : []),
                ...(status   !== "ALL" ? [["status",   status  ]] : []),
                ...(payment  !== "ALL" ? [["payment",  payment ]] : []),
                ...(dateFrom ? [["dateFrom", dateFrom]] : []),
                ...(dateTo   ? [["dateTo",   dateTo  ]] : []),
                ...(tourDate ? [["tourDate", tourDate]] : []),
              ]).toString()
            }
            download
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1B2847] hover:bg-[#243560] px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="size-3.5" /> Export CSV
          </a>
        </div>

        {/* Row 2 — date filters (collapsible) */}
        {showDateFilters && (
          <div className="flex flex-wrap gap-3 items-end pt-1 border-t border-[#F0EDE8]">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#7A746D] uppercase tracking-wide">Booked from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => updateParam("dateFrom", e.target.value)}
                className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-white text-[#111] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#7A746D] uppercase tracking-wide">Booked until</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => updateParam("dateTo", e.target.value)}
                className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-white text-[#111] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#7A746D] uppercase tracking-wide">Tour date (exact)</label>
              <input
                type="date"
                value={tourDate}
                onChange={(e) => updateParam("tourDate", e.target.value)}
                className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-white text-[#111] focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition"
              />
            </div>
            {(dateFrom || dateTo || tourDate) && (
              <button
                onClick={() => {
                  updateParam("dateFrom", "");
                  updateParam("dateTo", "");
                  updateParam("tourDate", "");
                }}
                className="flex items-center gap-1 text-xs text-[#C41230] hover:underline pb-2"
              >
                <X className="size-3.5" /> Clear dates
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {(dateFrom || dateTo || tourDate) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {dateFrom && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#EEF2FF] text-[#1B2847] font-medium px-2.5 py-1 rounded-full">
                Booked from: {dateFrom}
                <button onClick={() => updateParam("dateFrom", "")}><X className="size-3" /></button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#EEF2FF] text-[#1B2847] font-medium px-2.5 py-1 rounded-full">
                Booked until: {dateTo}
                <button onClick={() => updateParam("dateTo", "")}><X className="size-3" /></button>
              </span>
            )}
            {tourDate && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#FEF3C7] text-[#B45309] font-medium px-2.5 py-1 rounded-full">
                Tour date: {tourDate}
                <button onClick={() => updateParam("tourDate", "")}><X className="size-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card list */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E4E0D9] py-20 text-center text-sm text-[#A8A29E]">
          No bookings match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              isOpen={expandedId === b.id}
              onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
              currency={currency}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-[#E4E0D9] flex items-center justify-between px-5 py-3">
          <p className="text-xs text-[#A8A29E]">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
              className="p-1.5 rounded-lg hover:bg-[#F8F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4 text-[#7A746D]" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= totalPages - 3 ? totalPages - 6 + i
                : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                    ${p === page ? "bg-[#C41230] text-white" : "text-[#545454] hover:bg-[#F8F7F5]"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
              className="p-1.5 rounded-lg hover:bg-[#F8F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4 text-[#7A746D]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
