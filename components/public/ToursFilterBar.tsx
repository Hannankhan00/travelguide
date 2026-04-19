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

const selectCls =
  "h-10 px-3 rounded-xl border border-[#E7E8EE] text-sm text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] transition";

export function ToursFilterBar({ count }: { count: number }) {
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
    <div className="bg-white rounded-2xl border border-[#E7E8EE] shadow-(--shadow-card) p-5 mb-8">
      {/* Row 1 — text search + dropdowns */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A8A29E]" />
          <input
            defaultValue={q}
            placeholder="Search tours…"
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-[#E7E8EE] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] bg-[#F8F9FF] transition"
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
            }}
            onChange={(e) => { if (!e.target.value) update({ q: "" }); }}
          />
        </div>

        <select value={category}   onChange={(e) => update({ category:   e.target.value })} className={selectCls}>
          <option value="ALL">All categories</option>
          {TOUR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select value={difficulty} onChange={(e) => update({ difficulty: e.target.value })} className={selectCls}>
          {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <select value={duration}   onChange={(e) => update({ duration:   e.target.value })} className={selectCls}>
          {DURATION_OPTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Row 2 — price range + count + clear */}
      <div className="flex gap-3 flex-wrap items-center mt-3">
        <span className="text-sm text-[#7A746D] font-medium shrink-0">Price / person:</span>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" placeholder="Min $"
            defaultValue={minPrice}
            className="w-24 h-9 px-3 rounded-xl border border-[#E7E8EE] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] bg-[#F8F9FF]"
            onBlur={(e) => update({ minPrice: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") update({ minPrice: (e.target as HTMLInputElement).value }); }}
          />
          <span className="text-[#A8A29E] text-sm">—</span>
          <input
            type="number" min="0" placeholder="Max $"
            defaultValue={maxPrice}
            className="w-24 h-9 px-3 rounded-xl border border-[#E7E8EE] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] bg-[#F8F9FF]"
            onBlur={(e) => update({ maxPrice: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") update({ maxPrice: (e.target as HTMLInputElement).value }); }}
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1.5 text-sm text-[#185FA5] font-semibold hover:underline"
          >
            <X className="size-3.5" /> Clear filters
          </button>
        )}

        <p className="text-sm text-[#7A746D] ml-auto">
          {count} {count === 1 ? "tour" : "tours"} found
        </p>
      </div>
    </div>
  );
}
