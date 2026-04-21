export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { HeroSection } from "@/components/public/HeroSection";
import { DestinationsSection } from "@/components/public/DestinationsSection";
import { ExperienceSection } from "@/components/public/ExperienceSection";
import { WhyUsSection, type ReviewItem } from "@/components/public/WhyUsSection";
import { type RowTour } from "@/components/public/TourRowSection";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

// Client components below the fold — dynamically imported to split their JS bundle
const TourRowSection = nextDynamic(() => import("@/components/public/TourRowSection").then(m => ({ default: m.TourRowSection })));
const AuthModal      = nextDynamic(() => import("@/components/public/AuthModal").then(m => ({ default: m.AuthModal })));

const TOP_ACTIVITY_CATS = [
  "Guided tours", "Food tours", "Day trips", "Cultural experiences",
  "Adventure", "Private tours", "Night tours", "Nature",
];

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error on HomePage:", e);
  }
  const userId = session?.user?.id;

  const destinations = await prisma.destination.findMany({
    where:   { isActive: true },
    orderBy: { order: "asc" },
    include: {
      places: {
        where:   { isActive: true },
        orderBy: { order: "asc" },
        select:  { id: true, name: true, subtitle: true, imageUrl: true, linkQuery: true },
      },
    },
  }).catch((e) => {
    console.error("Destinations query error on HomePage:", e);
    return [];
  });

  // Fetch all published tours for the row sections
  const allTours = await prisma.tour.findMany({
    where: { status: "PUBLISHED" },
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } } as any,
  }).catch((e) => {
    console.error("Tours query error:", e);
    return [];
  });

  let userWishlists: any[] = [];
  if (userId) {
    try {
      userWishlists = await prisma.$queryRaw`SELECT * FROM Wishlist WHERE userId = ${userId}`;
    } catch (e) {
      console.error("Wishlist raw query failed:", e);
    }
  }
  const wishlistedTourIds = new Set(userWishlists.map((w: any) => w.tourId));

  const toRowTour = (tour: any): RowTour => ({
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    location: tour.location ?? "",
    duration: tour.duration,
    durationType: tour.durationType ?? "days",
    basePrice: Number(tour.basePrice),
    rating: Number(tour.rating ?? 0),
    reviewCount: tour.reviewCount ?? 0,
    maxGroupSize: tour.maxGroupSize,
    category: tour.category ?? "",
    likelyToSellOut: tour.likelyToSellOut ?? false,
    coverImage: tour.images?.[0]?.url,
    isWishlisted: wishlistedTourIds.has(tour.id),
  });

  const heroTours = allTours
    .filter((t: any) => t.featured)
    .slice(0, 6)
    .map(toRowTour);

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
    .filter((t: any) =>
      ["ADVENTURE", "NATURE"].includes(t.category)
    )
    .slice(0, 8)
    .map(toRowTour);

  const topTours = [...allTours]
    .sort((a: any, b: any) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 8)
    .map(toRowTour);

  // Fallback: if no location-specific tours, show all
  const featuredRows = allTours.filter((t: any) => t.featured).slice(0, 8).map(toRowTour);

  // Fetch top 3 reviews with user + tour info
  const rawReviews = await prisma.review.findMany({
    where:   { rating: { gte: 4 }, message: { not: "" } },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take:    3,
    include: {
      user: { select: { name: true, image: true, country: true } },
      tour: { select: { title: true } },
    },
  }).catch(() => []);

  const reviews: ReviewItem[] = rawReviews.map((r: any) => ({
    id:       r.id,
    name:     r.user?.name ?? "Anonymous",
    country:  r.user?.country ?? null,
    tour:     r.tour?.title ?? "",
    rating:   r.rating,
    text:     r.message,
    photoUrl: r.user?.image ?? null,
  }));

  const reviewStats = reviews.length > 0
    ? await prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }).catch(() => null)
    : null;

  const avgRating   = reviewStats?._avg?.rating   ?? undefined;
  const totalReviews = reviewStats?._count?.id     ?? undefined;

  return (
    <>
      <Navbar isLoggedIn={!!session?.user} destinations={destinations} />
      <main className="pt-14">
        <HeroSection featuredTours={heroTours} />

        {/* Named tour rows */}
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

        {/* Top activities pill bar */}
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
