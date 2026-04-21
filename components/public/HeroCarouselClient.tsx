"use client";

import dynamic from "next/dynamic";

const HeroFeaturedCards = dynamic(
  () => import("./HeroFeaturedCards").then((m) => ({ default: m.HeroFeaturedCards })),
  { ssr: false }
);

interface MiniTour {
  id: string;
  slug: string;
  title: string;
  location: string;
  duration: number;
  durationType: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  coverImage?: string;
}

export function HeroCarouselClient({ tours }: { tours: MiniTour[] }) {
  if (tours.length === 0) return null;
  return <HeroFeaturedCards tours={tours} />;
}
