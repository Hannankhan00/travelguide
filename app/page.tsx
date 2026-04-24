// ISR: regenerate the homepage in the background every 5 minutes.
// With auth() removed, the page has no runtime dependencies and can be
// fully prerendered. Wishlist state is client-only (WishlistButton handles it).
export const revalidate = 300;

import nextDynamic from "next/dynamic";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { HeroSection } from "@/components/public/HeroSection";
import { DestinationsSection } from "@/components/public/DestinationsSection";
import { ExperienceSection } from "@/components/public/ExperienceSection";
import { WhyUsSection, type ReviewItem } from "@/components/public/WhyUsSection";
import { type RowTour } from "@/components/public/TourRowSection";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

// Client components below the fold — dynamically imported to split their JS bundle
const TourRowSection = nextDynamic(() => import("@/components/public/TourRowSection").then(m => ({ default: m.TourRowSection })));
const AuthModal      = nextDynamic(() => import("@/components/public/AuthModal").then(m => ({ default: m.AuthModal })));

const TOP_ACTIVITY_CATS = [
  "Guided tours", "Food tours", "Day trips", "Cultural experiences",
  "Adventure", "Private tours", "Night tours", "Nature",
];

// ---------------------------------------------------------------------------
// Cached data loaders — these are the only DB calls on the homepage.
// Cache is shared with the public layout (same key) so destinations are free.
// ---------------------------------------------------------------------------

const getCachedHomeDestinations = unstable_cache(
  async () =>
    prisma.destination.findMany({
      where:   { isActive: true },
      orderBy: { order: "asc" },
      include: {
        places: {
          where:   { isActive: true },
          orderBy: { order: "asc" },
          select:  { id: true, name: true, subtitle: true, imageUrl: true, linkQuery: true },
        },
      },
    }),
  ["public-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

const getCachedHomeTours = unstable_cache(
  async () =>
    prisma.tour.findMany({
      where:    { status: "PUBLISHED" },
      take:     50,
      orderBy:  { updatedAt: "desc" },
      include:  { images: { where: { isPrimary: true }, take: 1 } } as any,
    }),
  ["home-tours"],
  { revalidate: 300, tags: ["tours"] }
);

const getCachedHomeReviews = unstable_cache(
  async () => {
    const reviews = await prisma.review.findMany({
      where:   { rating: { gte: 4 }, message: { not: "" } },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take:    3,
      include: {
        user: { select: { name: true, image: true, country: true } },
        tour: { select: { title: true } },
      },
    });
    const stats =
      reviews.length > 0
        ? await prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } })
        : null;
    return { reviews, stats };
  },
  ["home-reviews"],
  { revalidate: 3600, tags: ["reviews"] }
);

// ---------------------------------------------------------------------------

export default async function HomePage() {
  const [destinations, allTours, { reviews: rawReviews, stats: reviewStats }] =
    await Promise.all([
      getCachedHomeDestinations().catch(() => []),
      getCachedHomeTours().catch(() => [] as any[]),
      getCachedHomeReviews().catch(() => ({ reviews: [], stats: null })),
    ]);

  // isWishlisted is always false on the prerendered page.
  // WishlistButton is a client component that manages its own toggled state
  // after the user interacts — no per-request auth() needed here.
  const toRowTour = (tour: any): RowTour => ({
    id:             tour.id,
    slug:           tour.slug,
    title:          tour.title,
    location:       tour.location ?? "",
    duration:       tour.duration,
    durationType:   tour.durationType ?? "days",
    basePrice:      Number(tour.basePrice),
    rating:         Number(tour.rating ?? 0),
    reviewCount:    tour.reviewCount ?? 0,
    maxGroupSize:   tour.maxGroupSize,
    category:       tour.category ?? "",
    likelyToSellOut: tour.likelyToSellOut ?? false,
    coverImage:     tour.images?.[0]?.url,
    isWishlisted:   false,
  });

  const heroTours = allTours.filter((t: any) => t.featured).slice(0, 6).map(toRowTour);

  const tokyoTours = allTours
    .filter((t: any) => t.location?.toLowerCase().includes("tokyo"))
    .slice(0, 8)
    .map(toRowTour);

  const kyotoTours = allTours
    .filter((t: any) =>
      t.location?.toLowerCase().includes("kyoto") ||
      t.location?.toLowerCase().includes("nara")
    )
    .slice(0, 8)
    .map(toRowTour);

  const adventureTours = allTours
    .filter((t: any) => ["ADVENTURE", "NATURE"].includes(t.category))
    .slice(0, 8)
    .map(toRowTour);

  const topTours = [...allTours]
    .sort((a: any, b: any) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 8)
    .map(toRowTour);

  const featuredRows = allTours.filter((t: any) => t.featured).slice(0, 8).map(toRowTour);

  const reviews: ReviewItem[] = rawReviews.map((r: any) => ({
    id:       r.id,
    name:     r.user?.name ?? "Anonymous",
    country:  r.user?.country ?? null,
    tour:     r.tour?.title ?? "",
    rating:   r.rating,
    text:     r.message,
    photoUrl: r.user?.image ?? null,
  }));

  const avgRating    = reviewStats?._avg?.rating   ?? undefined;
  const totalReviews = reviewStats?._count?.id     ?? undefined;

  return (
    <>
      <Navbar destinations={destinations} />
      <main className="pt-14">
        <HeroSection featuredTours={heroTours} />

        {(tokyoTours.length > 0 ? tokyoTours : featuredRows).length > 0 && (
          <TourRowSection
            title="Top picks in Tokyo"
            subtitle="Cultural experiences, food tours & more"
            tours={tokyoTours.length > 0 ? tokyoTours : featuredRows}
            seeAllHref="/tours?q=Tokyo"
          />
        )}

        {(kyotoTours.length > 0 ? kyotoTours : featuredRows).length > 0 && (
          <TourRowSection
            title="Explore Kyoto & surrounds"
            subtitle="Temples, tea, and timeless traditions"
            tours={kyotoTours.length > 0 ? kyotoTours : featuredRows}
            seeAllHref="/tours?q=Kyoto"
          />
        )}

        {adventureTours.length > 0 && (
          <TourRowSection
            title="Adventure & nature"
            subtitle="Fuji, onsens, and the great outdoors"
            tours={adventureTours}
            seeAllHref="/tours?category=ADVENTURE"
          />
        )}

        <DestinationsSection />
        <ExperienceSection />

        {topTours.length > 0 && (
          <TourRowSection
            title="Unforgettable experiences"
            subtitle="Our most-loved tours, hand-picked for you"
            tours={topTours}
            seeAllHref="/tours"
          />
        )}

        <WhyUsSection reviews={reviews} avgRating={avgRating} totalReviews={totalReviews} />

        <section className="py-7 border-t border-[#e8e8e8] bg-[#F8F7F5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6b6b] mb-3.5">
              Top activities in Japan
            </p>
            <div className="flex flex-wrap gap-2.5">
              {TOP_ACTIVITY_CATS.map((c) => (
                <Link
                  key={c}
                  href={`/tours?q=${encodeURIComponent(c)}`}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium bg-white border border-[#e8e8e8] text-[#333] hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
