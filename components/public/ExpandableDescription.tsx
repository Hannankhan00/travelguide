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
        className={`text-[17px] text-[#3D3D3D] leading-relaxed space-y-4 overflow-hidden transition-all duration-300 ${
          !expanded && needsTruncation ? "max-h-[6.5rem]" : "max-h-none"
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
          className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#185FA5] hover:text-[#0C447C] transition-colors"
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
