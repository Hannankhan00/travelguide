"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

export function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(pathname + "?" + params.toString());
  };

  const clearDates = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("dateFrom");
    params.delete("dateTo");
    router.push(pathname + "?" + params.toString());
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-[#E4E0D9] shadow-sm">
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-[#7A746D]" />
        <span className="text-sm font-semibold text-[#111]">Filter by Date:</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#7A746D]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParam("dateFrom", e.target.value)}
            className="text-sm border border-[#E4E0D9] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#7A746D]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateParam("dateTo", e.target.value)}
            className="text-sm border border-[#E4E0D9] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230]"
          />
        </div>
      </div>
      {(dateFrom || dateTo) && (
        <button
          onClick={clearDates}
          className="flex items-center gap-1 text-xs text-[#C41230] hover:underline"
        >
          <X className="size-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
