"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { TOUR_CATEGORIES } from "@/lib/constants";

const DIFFICULTIES = [
  { value: "ALL",         label: "Any difficulty" },
  { value: "EASY",        label: "Easy"           },
  { value: "MODERATE",    label: "Moderate"       },
  { value: "CHALLENGING", label: "Challenging"    },
];

const DURATION_OPTS = [
  { value: "ALL",   label: "Any duration" },
  { value: "hours", label: "Hours"        },
  { value: "days",  label: "Days"         },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ToursFilterBar({ count: _ }: { count: number }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const q          = searchParams.get("q")          ?? "";
  const category   = searchParams.get("category")   ?? "ALL";
  const difficulty = searchParams.get("difficulty") ?? "ALL";
  const minPrice   = searchParams.get("minPrice")   ?? "";
  const maxPrice   = searchParams.get("maxPrice")   ?? "";
  const duration   = searchParams.get("duration")   ?? "ALL";

  const update = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (!val || val === "ALL") params.delete(key);
        else params.set(key, val);
      }
      router.push(pathname + (params.toString() ? "?" + params.toString() : ""));
    },
    [router, pathname, searchParams]
  );

  const hasFilters =
    q || category !== "ALL" || difficulty !== "ALL" || minPrice || maxPrice || duration !== "ALL";

  return (
    <>
      {/* ── Sticky category pills ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-[#e8e8e8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-2 overflow-x-auto py-2.5"
            style={{ scrollbarWidth: "none" }}
          >
            {/* All pill */}
            <button
              onClick={() => update({ category: "ALL" })}
              className={[
                "px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 border transition-colors duration-150",
                category === "ALL"
                  ? "bg-[#185FA5] text-white border-[#185FA5]"
                  : "bg-white text-[#333] border-[#e8e8e8] hover:border-[#185FA5] hover:text-[#185FA5]",
              ].join(" ")}
            >
              All
            </button>

            {TOUR_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ category: c.value })}
                className={[
                  "px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 border transition-colors duration-150",
                  category === c.value
                    ? "bg-[#185FA5] text-white border-[#185FA5]"
                    : "bg-white text-[#333] border-[#e8e8e8] hover:border-[#185FA5] hover:text-[#185FA5]",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Inline filter row ── */}
      <div className="border-b border-[#e8e8e8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
            <input
              defaultValue={q}
              placeholder="Search tours, destinations…"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-[#E4E0D9] text-[13px] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#185FA5] bg-white transition"
              onKeyDown={(e) => {
                if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
              }}
              onChange={(e) => { if (!e.target.value) update({ q: "" }); }}
            />
          </div>

          {/* Difficulty */}
          <select
            value={difficulty}
            onChange={(e) => update({ difficulty: e.target.value })}
            className="h-9 px-3 rounded-lg border border-[#E4E0D9] text-[13px] text-[#111] bg-white focus:outline-none focus:border-[#185FA5] transition"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Duration */}
          <select
            value={duration}
            onChange={(e) => update({ duration: e.target.value })}
            className="h-9 px-3 rounded-lg border border-[#E4E0D9] text-[13px] text-[#111] bg-white focus:outline-none focus:border-[#185FA5] transition"
          >
            {DURATION_OPTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Price range */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[#7A746D] shrink-0">$</span>
            <input
              type="number" min="0" placeholder="Min"
              defaultValue={minPrice}
              className="w-20 h-9 px-2.5 rounded-lg border border-[#E4E0D9] text-[13px] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#185FA5] bg-white"
              onBlur={(e) => update({ minPrice: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") update({ minPrice: (e.target as HTMLInputElement).value }); }}
            />
            <span className="text-[#A8A29E] text-sm">–</span>
            <input
              type="number" min="0" placeholder="Max"
              defaultValue={maxPrice}
              className="w-20 h-9 px-2.5 rounded-lg border border-[#E4E0D9] text-[13px] text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#185FA5] bg-white"
              onBlur={(e) => update({ maxPrice: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") update({ maxPrice: (e.target as HTMLInputElement).value }); }}
            />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => router.push(pathname)}
              className="flex items-center gap-1.5 text-[13px] text-[#185FA5] font-semibold hover:text-[#0C447C] transition-colors"
            >
              <X className="size-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}
