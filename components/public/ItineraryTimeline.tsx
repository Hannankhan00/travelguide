"use client";

import { useState } from "react";
import { MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface Stop {
  order: number;
  title: string;
  description: string;
  stayMinutes: string;
  isOptional: boolean;
}

interface Props {
  itinerary: Stop[];
  meetingPoint: string;
  endPoint?: string | null;
}

export function ItineraryTimeline({ itinerary, meetingPoint, endPoint }: Props) {
  const [expanded, setExpanded] = useState(false);

  const half = Math.ceil(itinerary.length / 2);
  const visible = expanded ? itinerary : itinerary.slice(0, half);
  const hiddenCount = itinerary.length - half;

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#C41230]" />

      {/* Start node */}
      <div className="relative flex items-start gap-5 pb-8">
        <div className="relative z-10 w-10 h-10 rounded-full bg-[#C41230] flex items-center justify-center shrink-0 shadow-md">
          <MapPin className="size-5 text-white" />
        </div>
        <div className="pt-1.5">
          <p className="text-xs font-bold text-[#C41230] uppercase tracking-widest mb-0.5">Start point</p>
          <p className="font-bold text-[#111] text-base">{meetingPoint}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#C41230] hover:underline mt-1"
          >
            <MapPin className="size-3" /> Open in Google Maps
          </a>
        </div>
      </div>

      {/* Stops */}
      {visible.map((stop, i) => (
        <div key={i} className={`relative flex items-start gap-5 pb-8 ${stop.isOptional ? "opacity-55" : ""}`}>
          <div className={`relative z-10 shrink-0 flex items-center justify-center rounded-full shadow ${
            stop.isOptional ? "w-8 h-8 mt-1 bg-white border-2 border-dashed border-[#A8A29E]" : "w-10 h-10 bg-[#1B2847]"
          }`}>
            <MapPin className={stop.isOptional ? "size-4 text-[#A8A29E]" : "size-5 text-white"} />
          </div>
          <div className={`flex-1 pt-1.5 ${stop.isOptional ? "ml-1" : ""}`}>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className={`font-bold text-base leading-snug ${stop.isOptional ? "text-[#6B7280]" : "text-[#111]"}`}>
                {stop.title}
              </h3>
              {stop.isOptional && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] border border-dashed border-[#D1D5DB] px-2 py-0.5 rounded-full italic">
                  Optional
                </span>
              )}
            </div>
            {stop.description && (
              <p className="text-sm text-[#545454] mb-1.5 leading-relaxed">{stop.description}</p>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A746D]">
              <Clock className="size-3.5" />{stop.stayMinutes} minutes
            </span>
          </div>
          {i < visible.length - 1 && !stop.isOptional && (
            <div className="absolute left-5 bottom-2 flex flex-col items-center gap-1 -translate-x-1/2">
              <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-60" />
              <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-40" />
              <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-20" />
            </div>
          )}
        </div>
      ))}

      {/* See all / collapse toggle */}
      {itinerary.length > half && (
        <div className="relative z-10 pl-14 pb-8">
          <button
            onClick={() => setExpanded(o => !o)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#185FA5] hover:text-[#0C447C] transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="size-4" /> Show less</>
            ) : (
              <><ChevronDown className="size-4" /> See all {hiddenCount} more stop{hiddenCount !== 1 ? "s" : ""}</>
            )}
          </button>
        </div>
      )}

      {/* End node */}
      <div className="relative flex items-start gap-5">
        <div className="relative z-10 w-10 h-10 rounded-full bg-[#C41230] flex items-center justify-center shrink-0 shadow-md">
          <MapPin className="size-5 text-white" />
        </div>
        <div className="pt-1.5">
          <p className="text-xs font-bold text-[#C41230] uppercase tracking-widest mb-0.5">Finish point</p>
          <p className="font-bold text-[#111] text-base">{endPoint || meetingPoint}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endPoint || meetingPoint)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#C41230] hover:underline mt-1"
          >
            <MapPin className="size-3" /> Open in Google Maps
          </a>
          {!endPoint && <p className="text-xs text-[#7A746D] mt-0.5">Returns to start point</p>}
        </div>
      </div>
    </div>
  );
}
