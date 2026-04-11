import { prisma } from "@/lib/prisma";
import { TourCard } from "@/components/public/TourCard";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Tours & Experiences | Japan Tours",
  description: "Browse our curated selection of cultural, adventure, and guided tours across Japan.",
};

export default async function PublicToursPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const tours = await prisma.tour.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    } as any,
  });

  // Workaround for stale PrismaClient: fetch wishlists separately
  const userWishlists = userId 
    ? await (prisma as any).wishlist.findMany({ where: { userId } })
    : [];
  const wishlistedTourIds = new Set(userWishlists.map((w: any) => w.tourId));

  return (
    <div className="bg-[#F8F7F5] min-h-screen">
      {/* Header section */}
      <div className="bg-[#1B2847] text-white pt-24 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4 leading-tight">Explore Our Tours</h1>
          <p className="text-[#A8A29E] max-w-2xl text-lg font-light">Find the perfect experience for your trip to Japan. From ancient temples to modern cityscapes.</p>
        </div>
      </div>

      {/* Grid section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-display text-[#111]">{tours.length} {tours.length === 1 ? 'tour' : 'tours'} found</h2>
        </div>

        {tours.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E4E0D9]">
            <p className="text-[#A8A29E] text-lg">No tours are currently published. Please check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => {
              // Convert Prisma properties
              const tourData = tour as any;
              const primaryImage = tourData.images?.[0]?.url;
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
                  price={tour.basePrice ? Number(tour.basePrice) : 0}
                  rating={tour.rating ? Number(tour.rating) : 5}
                  reviewCount={tour.reviewCount}
                  maxGroupSize={tour.maxGroupSize}
                  category={tour.category}
                  featured={tour.featured}
                  likelyToSellOut={tour.likelyToSellOut}
                  coverImage={primaryImage}
                  isWishlisted={isWishlisted}
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
