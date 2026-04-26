"use client";

import { useEffect, useRef, useState } from "react";

export function TrustpilotWidget() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const widgetRef   = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const script = document.createElement("script");
        script.src   = "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
        script.async = true;
        script.onload = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).Trustpilot?.loadFromElement(widgetRef.current);
        };
        document.head.appendChild(script);
        setReady(true);
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinelRef} className="mt-8">
      <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-4">
        Trustpilot
      </h4>
      {ready && (
        <div
          ref={widgetRef}
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="56278e9abfbbba0bdcd568bc"
          data-businessunit-id="69e422b612f246df35d09ea8"
          data-style-height="52px"
          data-style-width="100%"
          data-style-alignment="left"
          data-token="a94f0544-3bce-4965-b5b5-9e4e0836f8ad"
        >
          <a
            href="https://www.trustpilot.com/review/gotripjapan.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trustpilot
          </a>
        </div>
      )}
    </div>
  );
}
