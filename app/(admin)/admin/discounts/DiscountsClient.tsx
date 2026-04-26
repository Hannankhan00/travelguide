"use client";

import { useState, useTransition } from "react";
import {
  Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Tag,
  X, ChevronDown, Check, AlertCircle,
} from "lucide-react";
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
  toggleDiscountActiveAction,
  deleteDiscountCodeAction,
} from "./actions";

type TourOption = { id: string; title: string };
type DiscountRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  tourId: string | null;
  tour: { title: string; slug: string } | null;
  validFrom: Date;
  validUntil: Date | null;
  maxUses: number | null;
  currentUses: number;
  minBookingAmount: number | null;
  isActive: boolean;
  createdAt: Date;
};

interface Props {
  discounts: DiscountRow[];
  tours: TourOption[];
  currency: string;
}

const inputCls =
  "w-full h-9 rounded-lg border border-[#E4E0D9] px-3 text-sm text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] disabled:opacity-50";
const labelCls = "text-xs font-semibold text-[#545454] block mb-1";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: "",
  tourId: "",
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: "",
  maxUses: "",
  minBookingAmount: "",
  isActive: true,
  notifyWishlist: false,
  notifySubscribers: false,
};

export function DiscountsClient({ discounts: init, tours, currency }: Props) {
  const [discounts, setDiscounts] = useState<DiscountRow[]>(init);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fmt = (v: number) =>
    currency === "JPY"
      ? `¥${v.toLocaleString()}`
      : `${currency} ${v.toFixed(2)}`;

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEdit = (d: DiscountRow) => {
    setEditId(d.id);
    setForm({
      code: d.code,
      description: d.description ?? "",
      discountType: d.discountType,
      discountValue: String(d.discountValue),
      tourId: d.tourId ?? "",
      validFrom: new Date(d.validFrom).toISOString().slice(0, 10),
      validUntil: d.validUntil ? new Date(d.validUntil).toISOString().slice(0, 10) : "",
      maxUses: d.maxUses != null ? String(d.maxUses) : "",
      minBookingAmount: d.minBookingAmount != null ? String(d.minBookingAmount) : "",
      isActive: d.isActive,
      notifyWishlist: false,
      notifySubscribers: false,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setError("");
  };

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    setError("");
    const value = parseFloat(form.discountValue);
    if (!form.code.trim() && !editId) return setError("Code is required.");
    if (!value || isNaN(value)) return setError("Discount value is required.");

    startTransition(async () => {
      const payload = {
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: value,
        tourId: form.tourId || null,
        validFrom: form.validFrom,
        validUntil: form.validUntil || null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        minBookingAmount: form.minBookingAmount ? parseFloat(form.minBookingAmount) : null,
        isActive: form.isActive,
      };

      if (editId) {
        const res = await updateDiscountCodeAction(editId, payload);
        if (res.error) { setError(res.error); return; }
      } else {
        const res = await createDiscountCodeAction({
          code: form.code,
          notifyWishlist: form.notifyWishlist,
          notifySubscribers: form.notifySubscribers,
          ...payload,
        });
        if (res.error) { setError(res.error); return; }
      }
      closeForm();
      window.location.reload();
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleDiscountActiveAction(id);
      window.location.reload();
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Delete discount code "${code}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteDiscountCodeAction(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    });
  };

  const statusBadge = (d: DiscountRow) => {
    const now = new Date();
    if (!d.isActive) return <span className="badge-red">Inactive</span>;
    if (d.validUntil && new Date(d.validUntil) < now) return <span className="badge-gray">Expired</span>;
    if (d.maxUses && d.currentUses >= d.maxUses) return <span className="badge-gray">Exhausted</span>;
    return <span className="badge-green">Active</span>;
  };

  const active  = discounts.filter((d) => d.isActive).length;
  const expired = discounts.filter((d) => d.validUntil && new Date(d.validUntil) < new Date()).length;
  const total   = discounts.length;

  return (
    <>
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Codes", value: total },
          { label: "Active",      value: active,  color: "text-[#15803D]" },
          { label: "Expired",     value: expired, color: "text-[#A8A29E]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E0D9] p-4">
            <p className="text-xs text-[#7A746D] mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color ?? "text-[#111]"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-[#E4E0D9] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E0D9] flex items-center justify-between">
          <h2 className="font-bold text-[#111]">Discount Codes</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-sm font-bold bg-[#C41230] hover:bg-[#A00F27] text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="size-4" /> New Discount
          </button>
        </div>

        {discounts.length === 0 ? (
          <div className="py-16 text-center text-[#A8A29E] text-sm">
            <Tag className="size-8 mx-auto mb-3 opacity-30" />
            No discount codes yet.{" "}
            <button onClick={openCreate} className="text-[#C41230] font-semibold hover:underline">
              Create one.
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D9] bg-[#F8F7F5] text-[#7A746D] text-xs font-semibold">
                  <th className="px-5 py-3 text-left">Code</th>
                  <th className="px-5 py-3 text-left">Discount</th>
                  <th className="px-5 py-3 text-left">Tour</th>
                  <th className="px-5 py-3 text-left">Valid Until</th>
                  <th className="px-5 py-3 text-left">Uses</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D9]">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F7F5] transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#1B2847]">
                      {d.code}
                      {d.description && (
                        <p className="font-sans font-normal text-xs text-[#7A746D] mt-0.5 truncate max-w-35">{d.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#C41230]">
                      {d.discountType === "PERCENTAGE"
                        ? `${d.discountValue}%`
                        : fmt(Number(d.discountValue))}
                      {d.minBookingAmount && (
                        <p className="text-xs text-[#A8A29E] font-normal">min {fmt(Number(d.minBookingAmount))}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#545454]">
                      {d.tour ? (
                        <span className="truncate max-w-30 block">{d.tour.title}</span>
                      ) : (
                        <span className="text-[#A8A29E] italic">All tours</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#545454]">
                      {d.validUntil
                        ? new Date(d.validUntil).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : <span className="text-[#A8A29E]">No expiry</span>}
                    </td>
                    <td className="px-5 py-3 text-[#545454]">
                      {d.currentUses}{d.maxUses ? `/${d.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3">{statusBadge(d)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(d.id)}
                          title={d.isActive ? "Deactivate" : "Activate"}
                          className="p-1.5 rounded-lg hover:bg-[#F8F7F5] text-[#7A746D] hover:text-[#1B2847] transition-colors"
                        >
                          {d.isActive
                            ? <ToggleRight className="size-4 text-[#15803D]" />
                            : <ToggleLeft className="size-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded-lg hover:bg-[#F8F7F5] text-[#7A746D] hover:text-[#1B2847] transition-colors"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.code)}
                          className="p-1.5 rounded-lg hover:bg-[#FEE2E2] text-[#7A746D] hover:text-[#C41230] transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-over form ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={closeForm} />

          {/* Panel */}
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-[#E4E0D9] flex items-center justify-between shrink-0">
              <h2 className="font-bold text-[#111] text-lg">
                {editId ? "Edit Discount" : "New Discount Code"}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-[#F8F7F5] text-[#7A746D]">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-sm text-[#B91C1C]">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {/* Code (create only) */}
              {!editId && (
                <div>
                  <label className={labelCls}>Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    className={inputCls + " font-mono uppercase"}
                    placeholder="SUMMER20"
                  />
                  <p className="text-[11px] text-[#A8A29E] mt-1">Auto-uppercased. Must be unique.</p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={inputCls}
                  placeholder="Summer sale 2025"
                />
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Discount Type *</label>
                  <div className="relative">
                    <select
                      value={form.discountType}
                      onChange={(e) => set("discountType", e.target.value)}
                      className={inputCls + " appearance-none pr-8"}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#A8A29E] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>
                    Value * {form.discountType === "PERCENTAGE" ? "(1–100)" : `(${currency})`}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                    step={form.discountType === "PERCENTAGE" ? 1 : 0.01}
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                    className={inputCls}
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "5000"}
                  />
                </div>
              </div>

              {/* Tour */}
              <div>
                <label className={labelCls}>Apply To Tour</label>
                <div className="relative">
                  <select
                    value={form.tourId}
                    onChange={(e) => set("tourId", e.target.value)}
                    className={inputCls + " appearance-none pr-8"}
                  >
                    <option value="">All tours</option>
                    {tours.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#A8A29E] pointer-events-none" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Valid From *</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => set("validFrom", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Valid Until</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => set("validUntil", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Max uses + min amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => set("maxUses", e.target.value)}
                    className={inputCls}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className={labelCls}>Min Booking ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.minBookingAmount}
                    onChange={(e) => set("minBookingAmount", e.target.value)}
                    className={inputCls}
                    placeholder="None"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => set("isActive", !form.isActive)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${form.isActive ? "bg-[#C41230]" : "bg-[#D6D3CF]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-4.5" : ""}`} />
                </div>
                <span className="text-sm text-[#111] font-medium">Active immediately</span>
              </label>

              {/* Email notifications (create only, tour-specific) */}
              {!editId && form.tourId && (
                <div className="bg-[#F8F7F5] rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-[#545454] uppercase tracking-wide">Email Notifications</p>
                  {[
                    { key: "notifyWishlist" as const,     label: "Notify users who wishlisted this tour" },
                    { key: "notifySubscribers" as const,  label: "Notify deal subscribers" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        onClick={() => set(key, !form[key])}
                        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          form[key] ? "bg-[#C41230] border-[#C41230]" : "border-[#D6D3CF] bg-white"
                        }`}
                      >
                        {form[key] && <Check className="size-2.5 text-white" />}
                      </div>
                      <span className="text-sm text-[#545454]">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-[#E4E0D9] flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-[#C41230] hover:bg-[#A00F27] disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                {isPending ? "Saving…" : editId ? "Save Changes" : "Create Discount"}
              </button>
              <button
                onClick={closeForm}
                className="px-5 text-sm text-[#7A746D] border border-[#E4E0D9] rounded-xl hover:bg-[#F8F7F5] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .badge-green { display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:#DCFCE7; color:#15803D; }
        .badge-red   { display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:#FEE2E2; color:#B91C1C; }
        .badge-gray  { display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:#F3F4F6; color:#6B7280; }
      `}</style>
    </>
  );
}
