"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryLightboxProps {
  images: { url: string; altText?: string | null }[];
  initialIndex?: number;
  onClose: () => void;
}

export function GalleryLightbox({ images, initialIndex = 0, onClose }: GalleryLightboxProps) {
  const [current, setCurrent] = useState(() =>
    images.length > 0 ? Math.min(initialIndex, images.length - 1) : 0
  );

  if (!images.length) return null;

  const goNext = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 md:left-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Image */}
        <img
          src={images[current].url}
          alt={images[current].altText || `Image ${current + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
        />

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 md:right-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="size-6" />
          </button>
        )}

        {/* Counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-sm px-4 py-2 rounded-full">
          {current + 1} / {images.length}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === current ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
