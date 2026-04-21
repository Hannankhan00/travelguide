import Image from "next/image";
import { SearchBar } from "./SearchBar";
import { HeroCarouselClient } from "./HeroCarouselClient";

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

interface Props {
  featuredTours?: MiniTour[];
}

export function HeroSection({ featuredTours = [] }: Props) {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden" id="hero-section">
      {/* Single background image — Mt. Fuji */}
      <div className="absolute inset-0">
        <Image
          src="/asstes/hero-mt.jpg"
          alt="Mount Fuji at dawn"
          fill
          priority
          fetchPriority="high"
          quality={55}
          sizes="100vw"
          className="object-cover"
        />
        {/* Cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.3) 70%, rgba(12,68,124,0.75) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-36 pb-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] font-bold text-white max-w-4xl mx-auto leading-[1.05] tracking-tight mb-3">
            Discover Japan,{" "}
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, #EF9F27 20%, #FFD580 55%, #EF9F27 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Way
            </span>
          </h1>

        </div>

        {/* Search bar */}
        <SearchBar />

        {/* Featured tours carousel — reserve 208px so carousel appearance causes no CLS */}
        {featuredTours.length > 0 && (
          <div className="min-h-52">
            <HeroCarouselClient tours={featuredTours} />
          </div>
        )}
      </div>

    </section>
  );
}
