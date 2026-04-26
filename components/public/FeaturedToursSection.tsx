import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FeaturedToursCarousel } from "./FeaturedToursCarousel";

export async function FeaturedToursSection() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in FeaturedToursSection:", e);
  }
  const userId = session?.user?.id;

  const tours = await prisma.tour.findMany({
    where: { 
      status: "PUBLISHED",
      featured: true 
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  }).catch((e) => {
    console.error("Featured tours query error:", e);
    return [];
  });

  type WishlistRow = { tourId: string };
  let userWishlists: WishlistRow[] = [];
  if (userId) {
    try {
      userWishlists = await prisma.$queryRaw<WishlistRow[]>`SELECT tourId FROM Wishlist WHERE userId = ${userId}`;
    } catch (e) {
      console.error("Wishlist table raw query failed:", e);
    }
  }
  const wishlistedTourIds = new Set(userWishlists.map((w) => w.tourId));

  if (tours.length === 0) return null;

  const tourData = tours.map((tour) => ({
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    location: tour.location,
    duration: tour.duration,
    durationType: tour.durationType ?? "days",
    basePrice: Number(tour.basePrice),
    rating: Number(tour.rating ?? 5),
    reviewCount: tour.reviewCount ?? 0,
    maxGroupSize: tour.maxGroupSize,
    category: tour.category,
    featured: tour.featured,
    likelyToSellOut: tour.likelyToSellOut ?? false,
    coverImage: tour.images?.[0]?.url,
    isWishlisted: wishlistedTourIds.has(tour.id),
  }));

  return <FeaturedToursCarousel tours={tourData} />;
}
