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
    <div className="space-y-0">

      {/* Start */}
      <TimelineRow
        dot={<div className="w-9 h-9 rounded-full bg-[#C41230] flex items-center justify-center shadow-md shadow-[#C41230]/30 ring-4 ring-[#C41230]/10"><MapPin className="size-4 text-white" /></div>}
        isLast={false}
        lineColor="bg-[#C41230]"
      >
        <div className="pb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#C41230]">Start point</span>
          <p className="text-sm font-bold text-[#111] mt-0.5 leading-snug">{meetingPoint}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#185FA5] hover:underline mt-1"
          >
            <MapPin className="size-3" />Open in Google Maps
          </a>
        </div>
      </TimelineRow>

      {/* Stops */}
      {visible.map((stop, i) => (
        <TimelineRow
          key={i}
          dot={
            stop.isOptional
              ? <div className="w-8 h-8 rounded-full bg-white border-2 border-dashed border-[#D1D5DB] flex items-center justify-center text-[11px] font-bold text-[#9CA3AF]">{stop.order}</div>
              : <div className="w-9 h-9 rounded-full bg-[#1B2847] flex items-center justify-center shadow-md shadow-[#1B2847]/20 ring-4 ring-[#1B2847]/8 text-white text-xs font-bold">{stop.order}</div>
          }
          isLast={false}
          lineColor={stop.isOptional ? "bg-[#E4E0D9]" : "bg-linear-to-b from-[#1B2847] to-[#1B2847]"}
        >
          <div className={`pb-1 rounded-xl p-3 -ml-1 transition-colors ${stop.isOptional ? "opacity-60" : "hover:bg-[#F8F7F5]"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#111] leading-snug">{stop.title}</h3>
                  {stop.isOptional && (
                    <span className="text-[10px] text-[#9CA3AF] border border-[#E4E0D9] px-1.5 py-0.5 rounded-full">Optional</span>
                  )}
                </div>
                {stop.description && (
                  <p className="text-xs text-[#7A746D] mt-1 leading-relaxed">{stop.description}</p>
                )}
              </div>
              {stop.stayMinutes && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F0F4FF] text-[#1B2847] px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  <Clock className="size-3" />{stop.stayMinutes} min
                </span>
              )}
            </div>
          </div>
        </TimelineRow>
      ))}

      {/* Expand toggle */}
      {itinerary.length > half && (
        <div className="flex items-center gap-4 py-2 pl-[52px]">
          <button
            onClick={() => setExpanded(o => !o)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#185FA5] hover:text-[#0C447C] transition-colors"
          >
            {expanded
              ? <><ChevronUp className="size-3.5" />Show less</>
              : <><ChevronDown className="size-3.5" />{hiddenCount} more stop{hiddenCount !== 1 ? "s" : ""}</>}
          </button>
        </div>
      )}

      {/* End */}
      <TimelineRow
        dot={<div className="w-9 h-9 rounded-full bg-[#C41230] flex items-center justify-center shadow-md shadow-[#C41230]/30 ring-4 ring-[#C41230]/10"><MapPin className="size-4 text-white" /></div>}
        isLast
        lineColor=""
      >
        <div className="pb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#C41230]">End point</span>
          <p className="text-sm font-bold text-[#111] mt-0.5 leading-snug">{endPoint || meetingPoint}</p>
          {!endPoint && <p className="text-xs text-[#7A746D] mt-0.5">Returns to start point</p>}
        </div>
      </TimelineRow>

    </div>
  );
}

function TimelineRow({ dot, children, isLast, lineColor }: {
  dot: React.ReactNode;
  children: React.ReactNode;
  isLast: boolean;
  lineColor: string;
}) {
  return (
    <div className="flex gap-3">
      {/* Left: dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="z-10">{dot}</div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-5 mt-1 mb-1 ${lineColor}`} />}
      </div>
      {/* Right: content */}
      <div className="flex-1 pt-1.5 pb-1 min-w-0">{children}</div>
    </div>
  );
}
