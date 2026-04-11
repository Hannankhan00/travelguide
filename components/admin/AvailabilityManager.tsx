"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Trash2, CalendarDays, RefreshCw } from "lucide-react";
import {
  upsertAvailability,
  bulkUpsertAvailability,
  deleteAvailability,
} from "@/app/(admin)/admin/tours/availability-actions";

type AvailStatus = "AVAILABLE" | "FULL" | "CLOSED" | "CANCELLED";

type AvailRecord = {
  id: string;
  date: string;
  status: AvailStatus;
  maxCapacity: number;
  bookedCount: number;
  priceOverride: string | null;
  startTime: string | null;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS   = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const STATUS_COLOR: Record<AvailStatus, string> = {
  AVAILABLE: "bg-[#DCFCE7] text-[#15803D]",
  FULL:      "bg-[#FEE2E2] text-[#C41230]",
  CLOSED:    "bg-[#F3F4F6] text-[#6B7280]",
  CANCELLED: "bg-[#FEF3C7] text-[#B45309]",
};

interface Props {
  tourId:       string;
  dailyCapacity: number;
}

export function AvailabilityManager({ tourId, dailyCapacity }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [records, setRecords] = useState<Record<string, AvailRecord>>({});
  const [loading, setLoading] = useState(false);

  // Editing state
  const [editing,    setEditing]    = useState<string | null>(null);  // "YYYY-MM-DD" being edited
  const [editForm,   setEditForm]   = useState<{
    status: AvailStatus; maxCapacity: string; priceOverride: string; startTime: string;
  }>({ status: "AVAILABLE", maxCapacity: String(dailyCapacity), priceOverride: "", startTime: "" });

  // Bulk add state
  const [showBulk,  setShowBulk]  = useState(false);
  const [bulkForm,  setBulkForm]  = useState({
    startDate: "", endDate: "", status: "AVAILABLE" as AvailStatus,
    maxCapacity: String(dailyCapacity), priceOverride: "", startTime: "",
    skipSun: false, skipSat: false,
  });

  const [isPending, startTransition] = useTransition();

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const ms  = `${y}-${String(m + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/tours/${tourId}/availability?month=${ms}`);
      const data: AvailRecord[] = await res.json();
      const map: Record<string, AvailRecord> = {};
      data.forEach((r) => { map[r.date] = r; });
      setRecords(map);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [tourId]);

  useEffect(() => { fetchMonth(year, month); }, [year, month, fetchMonth]);

  const goPrev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Calendar grid
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMon }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const openEdit = (day: number) => {
    const key = toKey(year, month, day);
    const rec = records[key];
    setEditing(key);
    setEditForm({
      status:        rec?.status       ?? "AVAILABLE",
      maxCapacity:   String(rec?.maxCapacity   ?? dailyCapacity),
      priceOverride: rec?.priceOverride ?? "",
      startTime:     rec?.startTime    ?? "",
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      await upsertAvailability(tourId, {
        date:          editing,
        status:        editForm.status,
        maxCapacity:   Number(editForm.maxCapacity) || dailyCapacity,
        priceOverride: editForm.priceOverride ? Number(editForm.priceOverride) : null,
        startTime:     editForm.startTime || null,
      });
      await fetchMonth(year, month);
      setEditing(null);
    });
  };

  const removeRecord = (availId: string) => {
    startTransition(async () => {
      await deleteAvailability(tourId, availId);
      await fetchMonth(year, month);
      setEditing(null);
    });
  };

  const saveBulk = () => {
    if (!bulkForm.startDate || !bulkForm.endDate) return;
    const skipDays: number[] = [];
    if (bulkForm.skipSun) skipDays.push(0);
    if (bulkForm.skipSat) skipDays.push(6);
    startTransition(async () => {
      await bulkUpsertAvailability(tourId, bulkForm.startDate, bulkForm.endDate, {
        status:        bulkForm.status,
        maxCapacity:   Number(bulkForm.maxCapacity) || dailyCapacity,
        priceOverride: bulkForm.priceOverride ? Number(bulkForm.priceOverride) : null,
        startTime:     bulkForm.startTime || null,
      }, skipDays);
      await fetchMonth(year, month);
      setShowBulk(false);
    });
  };

  const inputCls = "w-full h-9 rounded-lg border border-[#E4E0D9] px-3 text-sm text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]";
  const labelCls = "text-xs font-semibold text-[#545454] block mb-1";

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-2 rounded-lg border border-[#E4E0D9] hover:bg-[#F8F7F5] transition-colors">
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-bold text-[#111] text-base min-w-36 text-center">{MONTHS[month]} {year}</span>
          <button onClick={goNext} className="p-2 rounded-lg border border-[#E4E0D9] hover:bg-[#F8F7F5] transition-colors">
            <ChevronRight className="size-4" />
          </button>
          <button onClick={() => fetchMonth(year, month)} className="p-2 rounded-lg border border-[#E4E0D9] hover:bg-[#F8F7F5] transition-colors ml-1" title="Refresh">
            <RefreshCw className="size-4" />
          </button>
        </div>
        <button
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 bg-[#1B2847] hover:bg-[#243560] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <CalendarDays className="size-4" /> Bulk Add Dates
        </button>
      </div>

      {/* ── Status legend ── */}
      <div className="flex flex-wrap gap-3">
        {(["AVAILABLE","FULL","CLOSED","CANCELLED"] as AvailStatus[]).map((s) => (
          <span key={s} className={`text-xs font-semibold px-2 py-1 rounded-md ${STATUS_COLOR[s]}`}>{s}</span>
        ))}
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-[#F8F7F5] text-[#A8A29E]">Not set (unavailable)</span>
      </div>

      {/* ── Calendar grid ── */}
      <div className={`bg-white rounded-xl border border-[#E4E0D9] p-4 ${loading || isPending ? "opacity-60" : ""}`}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-[#A8A29E] py-1 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;

            const key = toKey(year, month, day);
            const rec = records[key];
            const isPast = new Date(year, month, day) < today;
            const isEditing = editing === key;

            return (
              <button
                key={i}
                onClick={() => openEdit(day)}
                className={[
                  "relative flex flex-col items-center justify-center h-14 rounded-xl border text-sm font-medium transition-all",
                  isEditing
                    ? "border-[#C41230] ring-2 ring-[#C41230]/20"
                    : "border-[#E4E0D9] hover:border-[#1B2847]",
                  isPast ? "opacity-40" : "",
                  rec
                    ? rec.status === "AVAILABLE" ? "bg-[#F0FDF4]"
                    : rec.status === "FULL"      ? "bg-[#FEE2E2]"
                    : rec.status === "CLOSED"    ? "bg-[#F3F4F6]"
                    : "bg-[#FEF3C7]"
                    : "bg-white",
                ].join(" ")}
              >
                <span className="font-bold text-[#111]">{day}</span>
                {rec ? (
                  <span className={`text-[9px] font-bold uppercase mt-0.5 ${
                    rec.status === "AVAILABLE" ? "text-[#15803D]"
                    : rec.status === "FULL"    ? "text-[#C41230]"
                    : rec.status === "CLOSED"  ? "text-[#6B7280]"
                    : "text-[#B45309]"
                  }`}>
                    {rec.status === "AVAILABLE"
                      ? `${rec.maxCapacity - rec.bookedCount}/${rec.maxCapacity}`
                      : rec.status}
                  </span>
                ) : (
                  <Plus className="size-3 text-[#C0BAB3] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Edit Panel ── */}
      {editing && (
        <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111] text-base">
              {new Date(editing + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </h3>
            <button onClick={() => setEditing(null)} className="p-1 rounded-md hover:bg-[#F8F7F5]">
              <X className="size-4 text-[#7A746D]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Status */}
            <div className="col-span-2">
              <label className={labelCls}>Status</label>
              <div className="flex gap-2 flex-wrap">
                {(["AVAILABLE","CLOSED","CANCELLED","FULL"] as AvailStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditForm((f) => ({ ...f, status: s }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      editForm.status === s
                        ? "border-[#C41230] bg-[#FFF0F2] text-[#C41230]"
                        : "border-[#E4E0D9] hover:border-[#1B2847] text-[#545454]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Max capacity */}
            <div>
              <label className={labelCls}>Max Capacity</label>
              <input
                type="number" min="1"
                value={editForm.maxCapacity}
                onChange={(e) => setEditForm((f) => ({ ...f, maxCapacity: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* Start time */}
            <div>
              <label className={labelCls}>Start Time (optional)</label>
              <input
                type="time"
                value={editForm.startTime}
                onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* Price override */}
            <div className="col-span-2">
              <label className={labelCls}>Price Override / person (optional — leave blank to use tour price)</label>
              <input
                type="number" min="0" step="0.01" placeholder={`Default: $${records[editing]?.priceOverride ?? "—"}`}
                value={editForm.priceOverride}
                onChange={(e) => setEditForm((f) => ({ ...f, priceOverride: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Booked count notice */}
          {records[editing] && records[editing].bookedCount > 0 && (
            <p className="text-xs text-[#B45309] bg-[#FEF3C7] rounded-lg px-3 py-2 mb-4">
              ⚠ {records[editing].bookedCount} booking{records[editing].bookedCount !== 1 ? "s" : ""} already made for this date.
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={saveEdit}
              disabled={isPending}
              className="flex-1 bg-[#C41230] hover:bg-[#A00F27] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            {records[editing] && (
              <button
                onClick={() => removeRecord(records[editing].id)}
                disabled={isPending}
                className="flex items-center gap-1.5 border border-[#E4E0D9] hover:border-[#C41230] hover:text-[#C41230] text-[#7A746D] font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="size-4" /> Remove
              </button>
            )}
            <button
              onClick={() => setEditing(null)}
              className="border border-[#E4E0D9] hover:bg-[#F8F7F5] text-[#7A746D] font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Add Modal ── */}
      {showBulk && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#111] text-lg">Bulk Add Availability</h3>
              <button onClick={() => setShowBulk(false)} className="p-1 rounded-md hover:bg-[#F8F7F5]">
                <X className="size-5 text-[#7A746D]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input type="date" value={bulkForm.startDate}
                    onChange={(e) => setBulkForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={bulkForm.endDate}
                    onChange={(e) => setBulkForm((f) => ({ ...f, endDate: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2 flex-wrap">
                  {(["AVAILABLE","CLOSED","CANCELLED"] as AvailStatus[]).map((s) => (
                    <button key={s}
                      onClick={() => setBulkForm((f) => ({ ...f, status: s }))}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                        bulkForm.status === s ? "border-[#C41230] bg-[#FFF0F2] text-[#C41230]" : "border-[#E4E0D9] text-[#545454]"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Max Capacity</label>
                  <input type="number" min="1" value={bulkForm.maxCapacity}
                    onChange={(e) => setBulkForm((f) => ({ ...f, maxCapacity: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Start Time (opt.)</label>
                  <input type="time" value={bulkForm.startTime}
                    onChange={(e) => setBulkForm((f) => ({ ...f, startTime: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Price Override / person (opt.)</label>
                <input type="number" min="0" step="0.01" value={bulkForm.priceOverride}
                  onChange={(e) => setBulkForm((f) => ({ ...f, priceOverride: e.target.value }))}
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Skip days</label>
                <div className="flex gap-3">
                  {[["Saturdays", "skipSat"], ["Sundays", "skipSun"]].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-[#545454] cursor-pointer select-none">
                      <input type="checkbox"
                        checked={bulkForm[key as "skipSat" | "skipSun"]}
                        onChange={(e) => setBulkForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveBulk}
                disabled={isPending || !bulkForm.startDate || !bulkForm.endDate}
                className="flex-1 bg-[#C41230] hover:bg-[#A00F27] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {isPending ? "Adding…" : "Add Dates"}
              </button>
              <button onClick={() => setShowBulk(false)} className="border border-[#E4E0D9] hover:bg-[#F8F7F5] text-[#7A746D] font-semibold py-3 px-5 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
