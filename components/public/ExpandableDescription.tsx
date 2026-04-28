"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  paragraphs: string[];
}

export function ExpandableDescription({ paragraphs }: Props) {
  const [expanded, setExpanded] = useState(false);

  const fullText = paragraphs.join("\n\n");
  const needsTruncation = fullText.length > 320 || paragraphs.length > 2;

  return (
    <div>
      <div
        className={`text-sm text-[#545454] leading-relaxed space-y-3 overflow-hidden transition-all duration-300 ${
          !expanded && needsTruncation ? "max-h-26" : "max-h-none"
        }`}
        style={!expanded && needsTruncation ? { WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)" } : undefined}
      >
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#185FA5] underline hover:text-[#0C447C] transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="size-4" /> Show less</>
          ) : (
            <><ChevronDown className="size-4" /> Show more</>
          )}
        </button>
      )}
    </div>
  );
}
