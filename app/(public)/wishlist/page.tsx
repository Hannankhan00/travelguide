import { Heart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TourCard } from "@/components/public/TourCard";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/?auth=login");
  }

  const wishlistedItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      tour: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-[#111]">Your Wishlist</h1>
          <p className="text-[#545454] mt-2">Save tours and experiences for later.</p>
        </div>

        {wishlistedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E0D9] p-12 text-center shadow-sm max-w-2xl mx-auto">
            <Heart className="size-12 text-[#E4E0D9] mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display text-[#111] mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-[#7A746D] mb-6">
              Looks like you haven't saved any tours with us yet.
            </p>
            <Link href="/tours" className="inline-block bg-[#C41230] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#A00F27] transition-colors">
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedItems.map((item) => {
              const tour = item.tour;
              const primaryImage = tour.images[0]?.url;
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
                  coverImage={primaryImage}
                  isWishlisted={true}
                  gradient="linear-gradient(135deg, #1B2847 0%, #C41230 100%)"
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
