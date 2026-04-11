"use client";

import { useState } from "react";
import { Map, Clock, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { GalleryLightbox } from "./GalleryLightbox";

interface TourImage {
  url: string;
  altText?: string | null;
}

interface TourGalleryProps {
  coverImage?: string;
  allImages: TourImage[];
  title: string;
  likelyToSellOut: boolean;
}

export function TourGallery({ coverImage, allImages, title, likelyToSellOut }: TourGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Remove duplicate cover from gallery entries
  const sideImages = allImages.filter((i) => i.url !== coverImage).slice(0, 2);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] sm:h-[400px] md:h-[500px] relative group/gallery">
        {/* Main Cover */}
        <div
          className={`md:col-span-3 rounded-2xl overflow-hidden relative cursor-pointer group ${!coverImage ? "bg-[#1B2847]" : ""}`}
          onClick={() => openLightbox(0)}
        >
          {coverImage ? (
            <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1B2847] to-[#C41230] opacity-80" />
          )}
          {likelyToSellOut && (
            <div className="absolute top-6 left-6 bg-[#C41230] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <Clock className="size-4" /> Likely to Sell Out
            </div>
          )}
        </div>

        {/* Side Gallery */}
        <div className="hidden md:flex flex-col gap-4">
          {[0, 1].map((idx) => {
            const img = sideImages[idx];
            return (
              <div
                key={idx}
                className={`flex-1 rounded-2xl overflow-hidden relative cursor-pointer group ${!img ? "bg-[#E4E0D9]" : ""}`}
                onClick={() => img && openLightbox(allImages.findIndex((i) => i.url === img.url))}
              >
                {img ? (
                  <img src={img.url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A8A29E]">
                    <Map className="size-8 opacity-20" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View Gallery Button — appears on hover */}
        {allImages.length > 0 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 bg-white/95 hover:bg-white backdrop-blur text-[#111] px-4 py-2.5 rounded-xl shadow-lg font-semibold text-sm flex items-center gap-2 opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 hover:scale-105"
          >
            <Images className="size-4" />
            View Gallery ({allImages.length} photos)
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <GalleryLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

/** Bottom-of-page gallery carousel */
export function GalleryCarousel({ images }: { images: TourImage[] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) return null;

  return (
    <>
      <section className="mt-12">
        <h2 className="text-2xl font-bold font-display text-[#111] mb-6">Photo Gallery</h2>
        <div className="relative">
          {/* Carousel Track */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {images.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full aspect-[16/9] relative cursor-pointer"
                  onClick={() => { setLightboxOpen(true); }}
                >
                  <img src={img.url} alt={img.altText || `Gallery photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="size-5 text-[#111]" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="size-5 text-[#111]" />
              </button>
            </>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? "bg-[#C41230] w-6" : "bg-[#E4E0D9] hover:bg-[#A8A29E]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {lightboxOpen && (
        <GalleryLightbox
          images={images}
          initialIndex={current}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
