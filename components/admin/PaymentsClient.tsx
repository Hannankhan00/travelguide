"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search, Download, CreditCard, Wallet, Building2,
  ChevronLeft, ChevronRight, ExternalLink, TrendingUp,
  Clock, RotateCcw, CalendarDays,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaymentRow {
  id:             string;
  bookingRef:     string;
  guestName:      string | null;
  guestEmail:     string;
  tourTitle:      string;
  numAdults:      number;
  numChildren:    number;
  subtotal:       number;
  discountAmount: number;
  totalAmount:    number;
  currency:       string;
  paymentMethod:  string;
  paymentStatus:  string;
  bookingStatus:  string;
  paidAt:         string | null;
  createdAt:      string;
}

export interface PaymentStats {
  totalRevenue:     number;
  pendingAmount:    number;
  refundedAmount:   number;
  thisMonthRevenue: number;
  totalCount:       number;
  paidCount:        number;
  pendingCount:     number;
  refundedCount:    number;
}

interface Props {
  payments:    PaymentRow[];
  stats:       PaymentStats;
  total:       number;
  page:        number;
  perPage:     number;
  currency:    string;
  locale:      string;
  q:           string;
  status:      string;
  method:      string;
  dateFrom:    string;
  dateTo:      string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PAID:                   { label: "Paid",             bg: "bg-[#DCFCE7]", text: "text-[#15803D]" },
  PENDING:                { label: "Pending",          bg: "bg-[#FEF3C7]", text: "text-[#B45309]" },
  AWAITING_CONFIRMATION:  { label: "Awaiting",         bg: "bg-[#DBEAFE]", text: "text-[#1B6FA8]" },
  REFUNDED:               { label: "Refunded",         bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
  FAILED:                 { label: "Failed",           bg: "bg-[#F1EFE9]", text: "text-[#7A746D]" },
};

const BOOKING_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:    { label: "Pending",    bg: "bg-[#FEF3C7]", text: "text-[#B45309]" },
  CONFIRMED:  { label: "Confirmed",  bg: "bg-[#DCFCE7]", text: "text-[#15803D]" },
  COMPLETED:  { label: "Completed",  bg: "bg-[#DBEAFE]", text: "text-[#1B6FA8]" },
  CANCELLED:  { label: "Cancelled",  bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
  NO_SHOW:    { label: "No Show",    bg: "bg-[#F1EFE9]", text: "text-[#7A746D]" },
};

function MethodIcon({ method }: { method: string }) {
  if (method === "STRIPE")        return <CreditCard size={14} className="text-[#635BFF]" />;
  if (method === "PAYPAL")        return <Wallet     size={14} className="text-[#003087]" />;
  if (method === "BANK_TRANSFER") return <Building2  size={14} className="text-[#7A746D]" />;
  return null;
}

function MethodLabel({ method }: { method: string }) {
  const labels: Record<string, string> = {
    STRIPE: "Stripe", PAYPAL: "PayPal", BANK_TRANSFER: "Bank",
  };
  return <>{labels[method] ?? method}</>;
}

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; bg: string; text: string }> }) {
  const cfg = config[status] ?? { label: status, bg: "bg-[#F1EFE9]", text: "text-[#7A746D]" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PaymentsClient({
  payments, stats, total, page, perPage,
  currency, locale, q, status, method, dateFrom, dateTo,
}: Props) {
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const [, startTransition] = useTransition();

  const [localQ,        setLocalQ]        = useState(q);
  const [localDateFrom, setLocalDateFrom] = useState(dateFrom);
  const [localDateTo,   setLocalDateTo]   = useState(dateTo);
  const [exporting,     setExporting]     = useState(false);

  const totalPages = Math.ceil(total / perPage);

  const pushParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [pathname, router, searchParams]);

  function applySearch() {
    pushParams({ q: localQ, dateFrom: localDateFrom, dateTo: localDateTo });
  }

  function setFilter(key: string, val: string) {
    pushParams({ [key]: val === "ALL" ? "" : val });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams();
    if (localQ)        params.set("q",        localQ);
    if (status !== "ALL") params.set("status", status);
    if (method !== "ALL") params.set("method", method);
    if (localDateFrom) params.set("dateFrom", localDateFrom);
    if (localDateTo)   params.set("dateTo",   localDateTo);

    try {
      const res  = await fetch(`/api/admin/payments/export?${params.toString()}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const fp = (n: number) => formatPrice(n, currency, locale);

  // ── Stats cards ─────────────────────────────────────────────────────────────
  const statCards = [
    {
      label:   "Total Revenue",
      value:   fp(stats.totalRevenue),
      sub:     `${stats.paidCount} paid transactions`,
      icon:    TrendingUp,
      iconBg:  "bg-[#DCFCE7]",
      iconCol: "text-[#15803D]",
    },
    {
      label:   "Pending",
      value:   fp(stats.pendingAmount),
      sub:     `${stats.pendingCount} awaiting payment`,
      icon:    Clock,
      iconBg:  "bg-[#FEF3C7]",
      iconCol: "text-[#B45309]",
    },
    {
      label:   "Refunded",
      value:   fp(stats.refundedAmount),
      sub:     `${stats.refundedCount} refunded`,
      icon:    RotateCcw,
      iconBg:  "bg-[#FEE2E2]",
      iconCol: "text-[#DC2626]",
    },
    {
      label:   "This Month",
      value:   fp(stats.thisMonthRevenue),
      sub:     "Revenue (paid)",
      icon:    CalendarDays,
      iconBg:  "bg-[#DBEAFE]",
      iconCol: "text-[#1B6FA8]",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, iconBg, iconCol }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E4E0D9] p-5 flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconCol}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#7A746D] font-medium mb-0.5">{label}</p>
              <p className="text-xl font-bold text-[#111] leading-tight">{value}</p>
              <p className="text-[11px] text-[#A8A29E] mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Export ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
            <input
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search ref, guest, tour..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4E0D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] bg-[#F8F7F5]"
            />
          </div>

          {/* Payment Status */}
          <select
            value={status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-[#F8F7F5] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 text-[#111]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Payment Method */}
          <select
            value={method}
            onChange={(e) => setFilter("method", e.target.value)}
            className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-[#F8F7F5] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 text-[#111]"
          >
            <option value="ALL">All Methods</option>
            <option value="STRIPE">Stripe</option>
            <option value="PAYPAL">PayPal</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          {/* Date From */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-[#7A746D] uppercase tracking-wide">From</label>
            <input
              type="date"
              value={localDateFrom}
              onChange={(e) => setLocalDateFrom(e.target.value)}
              className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-[#F8F7F5] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 text-[#111]"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-[#7A746D] uppercase tracking-wide">To</label>
            <input
              type="date"
              value={localDateTo}
              onChange={(e) => setLocalDateTo(e.target.value)}
              className="text-sm border border-[#E4E0D9] rounded-lg px-3 py-2 bg-[#F8F7F5] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 text-[#111]"
            />
          </div>

          {/* Apply */}
          <button
            onClick={applySearch}
            className="px-4 py-2 text-sm font-medium bg-[#1B2847] text-white rounded-lg hover:bg-[#243560] transition-colors"
          >
            Apply
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#C41230] text-white rounded-lg hover:bg-[#A50E28] transition-colors disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] overflow-hidden">

        {/* Result count */}
        <div className="px-5 py-3 border-b border-[#E4E0D9] flex items-center justify-between">
          <p className="text-sm text-[#7A746D]">
            <span className="font-semibold text-[#111]">{total.toLocaleString()}</span> transactions
          </p>
          <p className="text-xs text-[#A8A29E]">
            Page {page} of {Math.max(1, totalPages)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E4E0D9] bg-[#F8F7F5]">
                {[
                  "Date", "Booking Ref", "Guest", "Tour",
                  "Method", "Subtotal", "Discount", "Total",
                  "Payment", "Booking", "Paid At", "",
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D9]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-[#A8A29E] text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F7F5] transition-colors group">
                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-[#7A746D] whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Ref */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-[#1B2847] bg-[#F0EEF9] px-1.5 py-0.5 rounded">
                        {p.bookingRef}
                      </span>
                    </td>

                    {/* Guest */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[#111] leading-tight">{p.guestName ?? "Guest"}</p>
                      <p className="text-xs text-[#7A746D] leading-tight">{p.guestEmail}</p>
                    </td>

                    {/* Tour */}
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <p className="text-sm text-[#111] truncate">{p.tourTitle}</p>
                      <p className="text-xs text-[#A8A29E]">{p.numAdults}A{p.numChildren > 0 ? ` · ${p.numChildren}C` : ""}</p>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MethodIcon method={p.paymentMethod} />
                        <span className="text-xs font-medium text-[#111]">
                          <MethodLabel method={p.paymentMethod} />
                        </span>
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="px-4 py-3.5 text-sm text-[#7A746D] whitespace-nowrap">
                      {fp(p.subtotal)}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                      {p.discountAmount > 0
                        ? <span className="text-[#DC2626]">-{fp(p.discountAmount)}</span>
                        : <span className="text-[#A8A29E]">—</span>
                      }
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#111] whitespace-nowrap">
                      {fp(p.totalAmount)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.paymentStatus} config={PAYMENT_STATUS_CONFIG} />
                    </td>

                    {/* Booking Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.bookingStatus} config={BOOKING_STATUS_CONFIG} />
                    </td>

                    {/* Paid At */}
                    <td className="px-4 py-3.5 text-xs text-[#7A746D] whitespace-nowrap">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : <span className="text-[#D4AF37]">—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <a
                        href={`/admin/bookings?q=${p.bookingRef}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-[#C41230] hover:underline"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-[#E4E0D9] flex items-center justify-between">
            <p className="text-xs text-[#A8A29E]">
              Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#E4E0D9] disabled:opacity-40 hover:bg-[#F8F7F5] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const mid  = Math.min(Math.max(page, 3), totalPages - 2);
                const pg   = totalPages <= 5 ? i + 1 : mid - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => goToPage(pg)}
                    className={`min-w-8 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      pg === page
                        ? "bg-[#1B2847] text-white border-[#1B2847]"
                        : "border-[#E4E0D9] text-[#7A746D] hover:bg-[#F8F7F5]"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#E4E0D9] disabled:opacity-40 hover:bg-[#F8F7F5] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
