"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const POPULAR = ["Tokyo", "Kyoto", "Osaka", "Mt. Fuji", "Nara", "Hiroshima"];

export function SearchBar() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("Anytime");
  const [guests, setGuests] = useState(1);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showGuestsMenu, setShowGuestsMenu] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (date !== "Anytime") params.set("date", date);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/tours${params.toString() ? `?${params}` : ""}`);
  }

  const DATE_OPTIONS = ["Anytime", "Today", "Tomorrow", "This week", "This month"];

  return (
    <div className="w-full max-w-3xl mx-auto" id="search-bar">
      <form
        onSubmit={handleSearch}
        className="flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-visible h-13 relative"
      >
        {/* Search input */}
        <div className="flex-1 flex items-center pl-6 pr-3 h-full min-w-0">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Search places or activities"
            className="w-full text-sm text-[#191C20] placeholder:text-[#7A746D] bg-transparent outline-none"
          />
        </div>

        {/* Divider — hidden on mobile */}
        <div className="hidden sm:block w-px h-7 bg-[#E4E0D9] shrink-0" />

        {/* Date dropdown — hidden on mobile */}
        <div className="hidden sm:block relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => { setShowDateMenu(!showDateMenu); setShowGuestsMenu(false); }}
            className="flex items-center gap-2 px-5 h-13 text-sm text-[#191C20] hover:bg-[#F8F9FF] transition-colors whitespace-nowrap"
          >
            <span className="font-medium">{date}</span>
            <ChevronDown className="size-3.5 text-[#7A746D]" />
          </button>
          {showDateMenu && (
            <div className="absolute top-full mt-2 left-0 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-[#E7E8EE] py-1 z-50">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setDate(opt); setShowDateMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    date === opt ? "text-[#185FA5] font-semibold bg-[#E6F1FB]" : "text-[#191C20] hover:bg-[#F2F3FA]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider — hidden on mobile */}
        <div className="hidden sm:block w-px h-7 bg-[#E4E0D9] shrink-0" />

        {/* Guests dropdown — hidden on mobile */}
        <div className="hidden sm:block relative" ref={guestsRef}>
          <button
            type="button"
            onClick={() => { setShowGuestsMenu(!showGuestsMenu); setShowDateMenu(false); }}
            className="flex items-center gap-2 px-5 h-13 text-sm text-[#191C20] hover:bg-[#F8F9FF] transition-colors whitespace-nowrap"
          >
            <span className="font-medium">{guests} traveler{guests > 1 ? "s" : ""}</span>
            <ChevronDown className="size-3.5 text-[#7A746D]" />
          </button>
          {showGuestsMenu && (
            <div className="absolute top-full mt-2 right-0 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-[#E7E8EE] py-1 z-50">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setGuests(n); setShowGuestsMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    guests === n ? "text-[#185FA5] font-semibold bg-[#E6F1FB]" : "text-[#191C20] hover:bg-[#F2F3FA]"
                  }`}
                >
                  {n} traveler{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 h-10.5 mx-1.5 rounded-full bg-[#185FA5] hover:bg-[#0C447C] text-white font-bold text-sm transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Popular searches */}
      <div className="flex flex-wrap items-center gap-2 mt-5 justify-center">
        <span className="text-white/45 text-xs font-medium">Popular:</span>
        {POPULAR.map((place) => (
          <button
            key={place}
            type="button"
            onClick={() => setDestination(place)}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-all backdrop-blur-sm hover:scale-105"
          >
            {place}
          </button>
        ))}
      </div>
    </div>
  );
}
