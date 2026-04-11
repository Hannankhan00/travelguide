"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

export type AvailRecord = {
  id: string;
  date: string;           // "YYYY-MM-DD"
  status: "AVAILABLE" | "FULL" | "CLOSED" | "CANCELLED";
  maxCapacity: number;
  bookedCount: number;
  priceOverride: string | null;
  startTime: string | null;
};

type DayState = "available" | "filling" | "full" | "closed" | "unavailable" | "past";

interface Props {
  tourId: string;
  selected: string;      // "YYYY-MM-DD" or ""
  onSelect: (date: string, record: AvailRecord | null) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS   = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ tourId, selected, onSelect }: Props) {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [year,  setYear]  = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [records, setRecords] = useState<Record<string, AvailRecord>>({});
  const [loading, setLoading] = useState(false);

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
      const res  = await fetch(`/api/tours/${tourId}/availability?month=${monthStr}`);
      const data: AvailRecord[] = await res.json();
      const map: Record<string, AvailRecord> = {};
      data.forEach((r) => { map[r.date] = r; });
      setRecords(map);
    } catch {
      setRecords({});
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => { fetchMonth(year, month); }, [year, month, fetchMonth]);

  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const isPastMonth =
    year < todayDate.getFullYear() ||
    (year === todayDate.getFullYear() && month < todayDate.getMonth());

  // Build grid cells: null = empty padding
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getDayState = (day: number): DayState => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (d <= todayDate) return "past";

    const rec = records[toKey(year, month, day)];
    if (!rec) return "unavailable";
    if (rec.status === "FULL") return "full";
    if (rec.status === "CLOSED" || rec.status === "CANCELLED") return "closed";

    const remaining = rec.maxCapacity - rec.bookedCount;
    if (remaining <= 0) return "full";
    if (remaining / rec.maxCapacity < 0.3) return "filling";
    return "available";
  };

  const handleClick = (day: number) => {
    const state = getDayState(day);
    if (state === "past" || state === "unavailable" || state === "full" || state === "closed") return;
    const key = toKey(year, month, day);
    onSelect(key, records[key] ?? null);
  };

  const selectedRec = selected ? records[selected] ?? null : null;
  const remaining   = selectedRec ? selectedRec.maxCapacity - selectedRec.bookedCount : 0;

  return (
    <div>
      {/* ── Month header ── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrev}
          disabled={isPastMonth}
          aria-label="Previous month"
          className="p-1.5 rounded-lg hover:bg-[#F8F7F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-4 text-[#111]" />
        </button>
        <span className="font-bold text-[#111] text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={goNext}
          aria-label="Next month"
          className="p-1.5 rounded-lg hover:bg-[#F8F7F5] transition-colors"
        >
          <ChevronRight className="size-4 text-[#111]" />
        </button>
      </div>

      {/* ── Weekday headers ── */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#A8A29E] py-1 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className={`grid grid-cols-7 gap-px ${loading ? "opacity-40 pointer-events-none" : ""}`}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const state   = getDayState(day);
          const key     = toKey(year, month, day);
          const isToday = key === toKey(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
          const isSel   = selected === key;
          const clickable = state === "available" || state === "filling";

          return (
            <button
              key={i}
              onClick={() => handleClick(day)}
              disabled={!clickable}
              className={[
                "relative flex flex-col items-center justify-center h-10 rounded-lg text-sm font-medium transition-all select-none",
                isSel
                  ? "bg-[#C41230] text-white"
                  : state === "available"
                  ? "cursor-pointer hover:bg-[#F0FDF4] text-[#111]"
                  : state === "filling"
                  ? "cursor-pointer hover:bg-[#FFFBEB] text-[#111]"
                  : "cursor-not-allowed text-[#C0BAB3]",
                isToday && !isSel ? "ring-1 ring-[#1B2847]" : "",
              ].join(" ")}
            >
              <span className={state === "full" ? "line-through" : ""}>{day}</span>

              {/* Availability dot */}
              {!isSel && state === "available" && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#22C55E]" />
              )}
              {!isSel && state === "filling" && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F59E0B]" />
              )}
              {!isSel && state === "full" && (
                <span className="absolute bottom-0.5 text-[8px] text-[#C41230] font-bold leading-none">Full</span>
              )}
              {!isSel && state === "closed" && (
                <span className="absolute bottom-0.5 text-[8px] text-[#A8A29E] font-bold leading-none">Closed</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[#E4E0D9]">
        <span className="flex items-center gap-1.5 text-[11px] text-[#545454]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#545454]">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> Filling up
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#545454]">
          <span className="w-2 h-2 rounded-full bg-[#D6D3CF] inline-block" /> Not available
        </span>
      </div>

      {/* ── Selected date info panel ── */}
      {selected && selectedRec && (
        <div className="mt-3 bg-[#F8F7F5] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#111]">
              {new Date(selected + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </span>
            {selectedRec.startTime && (
              <span className="flex items-center gap-1 text-xs text-[#545454]">
                <Clock className="size-3" /> {selectedRec.startTime}
              </span>
            )}
          </div>
          <p className={`text-xs font-medium ${remaining <= selectedRec.maxCapacity * 0.3 ? "text-[#F59E0B]" : "text-[#22C55E]"}`}>
            {remaining} spot{remaining !== 1 ? "s" : ""} remaining
          </p>
          {selectedRec.priceOverride && (
            <p className="text-xs text-[#C41230] font-semibold">
              Special price: ${Number(selectedRec.priceOverride).toFixed(0)}/person today
            </p>
          )}
        </div>
      )}
    </div>
  );
}
