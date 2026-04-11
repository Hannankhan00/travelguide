import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TourCard } from "./TourCard";

export async function FeaturedToursSection() {
  const session = await auth();
  const userId = session?.user?.id;

  const tours = await prisma.tour.findMany({
    where: { 
      status: "PUBLISHED",
      featured: true 
    },
    take: 6,
    orderBy: { updatedAt: "desc" },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    } as any
  });

  const userWishlists = userId 
    ? await (prisma as any).wishlist.findMany({ where: { userId } })
    : [];
  const wishlistedTourIds = new Set(userWishlists.map((w: any) => w.tourId));

  if (tours.length === 0) return null;

  return (
    <section className="py-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
              Handpicked Experiences
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Tours travelers love
            </h2>
          </div>
          <Link
            href="/tours"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            See all tours
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {["All", "City Tour", "Cultural", "Nature", "Food & Drink", "Adventure", "Private"].map((cat) => (
            <Link
              key={cat}
              href={cat === "All" ? "/tours" : `/tours?category=${cat.toUpperCase().replace(/ & /g, "_AND_").replace(/ /g, "_")}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === "All"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => {
            const tourData = tour as any;
            const isWishlisted = wishlistedTourIds.has(tour.id);
            return (
              <TourCard
                key={tour.id}
                id={tour.id}
                slug={tour.slug}
                title={tour.title}
                location={tour.location}
                duration={tour.duration}
                durationType={tour.durationType}
                price={Number(tour.basePrice)}
                rating={Number(tour.rating ?? 5)}
                reviewCount={tour.reviewCount}
                maxGroupSize={tour.maxGroupSize}
                category={tour.category}
                featured={tour.featured}
                likelyToSellOut={tour.likelyToSellOut}
                coverImage={tourData.images?.[0]?.url}
                isWishlisted={isWishlisted}
                gradient="linear-gradient(135deg, #1B2847 0%, #C41230 100%)"
              />
            );
          })}
        </div>

        {/* Mobile view all */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Link
            href="/tours"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-white transition-colors"
          >
            See all tours
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
