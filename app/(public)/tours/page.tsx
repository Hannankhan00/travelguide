import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { TourCard } from "@/components/public/TourCard";
import { ToursFilterBar } from "@/components/public/ToursFilterBar";
import { auth } from "@/lib/auth";

const getCachedPublishedTours = unstable_cache(
  async () => prisma.tour.findMany({
    where:   { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { 
      images: { where: { isPrimary: true }, take: 1 },
      discounts: { where: { isActive: true } }
    } as any,
  }),
  ["published-tours"],
  { revalidate: 300, tags: ["tours"] }
);

export const metadata = {
  title: "Tours & Experiences",
  description: "Browse GoTripJapan's curated selection of cultural, adventure, and guided tours across Japan.",
};

interface PageProps {
  searchParams: Promise<{
    q?:          string;
    category?:   string;
    difficulty?: string;
    minPrice?:   string;
    maxPrice?:   string;
    duration?:   string;
    page?:       string;
  }>;
}

export default async function PublicToursPage({ searchParams }: PageProps) {
  let session = null;
  try { session = await auth(); } catch {}
  const userId = session?.user?.id;
  const sp     = await searchParams;

  const q          = sp.q?.trim()          ?? "";
  const category   = sp.category           ?? "";
  const difficulty = sp.difficulty         ?? "";
  const minPrice   = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice   = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
  const duration   = sp.duration           ?? "";
  const currentPage = sp.page ? parseInt(sp.page, 10) : 1;
  const ITEMS_PER_PAGE = 12;

  const allTours = await getCachedPublishedTours().catch(() => [] as any[]);
  const filteredTours = allTours.filter((t: any) => {
    if (q) {
      const ql = q.toLowerCase();
      if (
        !t.title?.toLowerCase().includes(ql) &&
        !t.location?.toLowerCase().includes(ql) &&
        !t.shortDescription?.toLowerCase().includes(ql)
      ) return false;
    }
    if (category   && category   !== "ALL" && t.category   !== category)   return false;
    if (difficulty && difficulty !== "ALL" && t.difficulty !== difficulty)  return false;
    if (minPrice   !== undefined && Number(t.basePrice) < minPrice)         return false;
    if (maxPrice   !== undefined && Number(t.basePrice) > maxPrice)         return false;
    if (duration   && duration   !== "ALL" && t.durationType !== duration)  return false;
    return true;
  });

  const totalItems = filteredTours.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const tours = filteredTours.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (sp.minPrice) params.set("minPrice", sp.minPrice);
    if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
    if (duration) params.set("duration", duration);
    params.set("page", page.toString());
    return `/tours?${params.toString()}`;
  };

  let userWishlists: any[] = [];
  if (userId) {
    try {
      userWishlists = await prisma.$queryRaw`SELECT * FROM Wishlist WHERE userId = ${userId}`;
    } catch {}
  }
  const wishlistedTourIds = new Set(userWishlists.map((w: any) => w.tourId));

  const activeCategory = category && category !== "ALL" ? category : null;

  return (
    <div className="bg-white min-h-screen pt-14">
      {/* Sticky category pills + filter bar */}
      <ToursFilterBar count={totalItems} />

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* Title + count */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#111]">
            {activeCategory
              ? `${activeCategory.replace(/_/g, " ")} tours in Japan`
              : q
              ? `Results for "${q}"`
              : "All Japan tours"}
          </h1>
          <p className="text-[13px] text-[#7A746D] mt-1">
            {totalItems} {totalItems === 1 ? "experience" : "experiences"} available
          </p>
        </div>

        {/* Grid */}
        {tours.length === 0 ? (
          <div className="text-center py-24 border border-[#E4E0D9] rounded-2xl bg-[#F8F7F5]">
            <p className="text-[#7A746D] text-lg font-medium mb-2">No tours match your filters</p>
            <p className="text-[#A8A29E] text-sm">Try adjusting or clearing your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tours.map((tour) => {
              const t = tour as any;
              const originalPrice = tour.basePrice ? Number(tour.basePrice) : 0;
              let finalPrice = originalPrice;
              let hasDiscount = false;
              
              if (t.discounts && t.discounts.length > 0) {
                const now = new Date();
                const activeDiscount = t.discounts.find((d: any) => 
                  new Date(d.validFrom) <= now && 
                  (!d.validUntil || new Date(d.validUntil) >= now)
                );
                
                if (activeDiscount) {
                  hasDiscount = true;
                  if (activeDiscount.discountType === "PERCENTAGE") {
                    finalPrice = originalPrice * (1 - Number(activeDiscount.discountValue) / 100);
                  } else if (activeDiscount.discountType === "FIXED_AMOUNT") {
                    finalPrice = Math.max(0, originalPrice - Number(activeDiscount.discountValue));
                  }
                }
              }

              return (
                <TourCard
                  key={tour.id}
                  id={tour.id}
                  slug={tour.slug}
                  title={tour.title}
                  location={tour.location}
                  duration={tour.duration}
                  durationType={tour.durationType}
                  price={finalPrice}
                  originalPrice={hasDiscount ? originalPrice : undefined}
                  rating={tour.rating ? Number(tour.rating) : 5}
                  reviewCount={tour.reviewCount}
                  maxGroupSize={tour.maxGroupSize}
                  category={tour.category}
                  featured={tour.featured}
                  likelyToSellOut={tour.likelyToSellOut}
                  coverImage={t.images?.[0]?.url}
                  isWishlisted={wishlistedTourIds.has(tour.id)}
                  gradient="linear-gradient(135deg, #0C447C 0%, #185FA5 100%)"
                />
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {validPage > 1 && (
              <Link
                href={buildPageUrl(validPage - 1)}
                className="px-4 py-2 border border-[#E4E0D9] rounded-lg text-sm font-medium text-[#7A746D] hover:bg-[#F8F7F5] transition-colors"
              >
                Previous
              </Link>
            )}
            
            <div className="flex items-center gap-1 mx-2 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === validPage;
                
                // Show first, last, current, and adjacent pages
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - validPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-[#A8A29E] px-1">...</span>;
                  }
                  return null;
                }

                return (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(pageNum)}
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      isCurrent 
                        ? "bg-[#0C447C] text-white border border-[#0C447C]" 
                        : "border border-[#E4E0D9] text-[#7A746D] hover:bg-[#F8F7F5]"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>

            {validPage < totalPages && (
              <Link
                href={buildPageUrl(validPage + 1)}
                className="px-4 py-2 border border-[#E4E0D9] rounded-lg text-sm font-medium text-[#7A746D] hover:bg-[#F8F7F5] transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
