import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Clock, MapPin, Users, CheckCircle, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TourGallery, GalleryCarousel } from "@/components/public/TourGallery";
import { ReviewSection } from "@/components/public/ReviewSection";
import { BookingWidget } from "@/components/public/BookingWidget";
import { WishlistButton } from "@/components/public/WishlistButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Get current user session
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const tour = await prisma.tour.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, image: true, id: true } },
        },
      },
    } as any,
  });

  if (!tour || tour.status !== "PUBLISHED") {
    notFound();
  }

  // Fetch wishlist status separately to avoid runtime "Unknown field" error
  let isWishlisted = false;
  if (currentUserId) {
    const wishlistEntry = await (prisma as any).wishlist.findUnique({
      where: {
        userId_tourId: {
          userId: currentUserId,
          tourId: tour.id
        }
      }
    });
    isWishlisted = !!wishlistEntry;
  }

  const tourData = tour as any;

  // Safe JSON array parser
  const safeArr = (v: unknown): any[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };

  const includes = safeArr(tourData.includes) as string[];
  const excludes = safeArr(tourData.excludes) as string[];
  const highlights = safeArr(tourData.highlights) as string[];
  const importantInfo = safeArr(tourData.importantInfo) as string[];
  const itinerary = safeArr(tourData.itinerary) as { order: number; title: string; description: string; stayMinutes: string; isOptional: boolean }[];

  const basePrice = Number(tourData.basePrice);
  const coverImage = (tourData.images as any[]).find(i => i.isPrimary)?.url || tourData.images[0]?.url;

  // Serialize all images for client components
  const allImages = (tourData.images as any[]).map(i => ({ url: i.url, altText: i.altText }));

  // Format reviews
  const reviews = (tourData.reviews as any[]).map(r => ({
    id: r.id,
    rating: r.rating,
    message: r.message,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt.toISOString(),
    user: { name: r.user.name, image: r.user.image },
  }));

  const avgRating = Number(tourData.rating ?? 0);

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-24 md:pt-28 pb-20">
      {/* Breadcrumbs & Wishlist */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center text-sm text-[#7A746D] overflow-hidden">
            <Link href="/" className="hover:text-[#1B2847] hover:underline transition-colors shrink-0">Home</Link>
            <ChevronRight className="size-4 mx-2 shrink-0" />
            <Link href="/tours" className="hover:text-[#1B2847] hover:underline transition-colors shrink-0">Tours</Link>
            <ChevronRight className="size-4 mx-2 shrink-0" />
            <span className="text-[#111] font-medium truncate">{tour.title}</span>
          </div>

          <WishlistButton 
            tourId={tour.id} 
            isWishlistedInitial={isWishlisted} 
            showText={true}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Hero Gallery (Client Component — with "View Gallery" button + lightbox) */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-10">
        <TourGallery
          coverImage={coverImage}
          allImages={allImages}
          title={tour.title}
          likelyToSellOut={tour.likelyToSellOut}
        />
      </div>

      {/* Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column (Details) */}
          <div className="lg:col-span-2 space-y-12">

            {/* Header */}
            <div>
              <div className="inline-block bg-[#1B2847] text-white text-xs font-bold px-3 py-1 rounded-md mb-4 tracking-widest uppercase">
                {tour.category}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[#111] leading-tight mb-4">{tour.title}</h1>
              <p className="text-xl text-[#545454] leading-relaxed mb-6">{tour.shortDescription}</p>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#E4E0D9]">
                <div className="flex items-center gap-2 text-[#111]">
                  <Clock className="size-5 text-[#C41230]" />
                  <span className="font-medium">{tour.duration} {tour.durationType}</span>
                </div>
                <div className="flex items-center gap-2 text-[#111]">
                  <Users className="size-5 text-[#C41230]" />
                  <span className="font-medium">Up to {tour.maxGroupSize} group size</span>
                </div>
                <div className="flex items-center gap-2 text-[#111]">
                  <MapPin className="size-5 text-[#C41230]" />
                  <span className="font-medium">{tour.location}</span>
                </div>
              </div>
            </div>

            {/* About / Description */}
            <section>
              <h2 className="text-2xl font-bold font-display text-[#111] mb-6">About this activity</h2>
              <div className="prose prose-lg text-[#545454] max-w-none space-y-4">
                {tour.description.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {/* Highlights */}
            {highlights.filter(Boolean).length > 0 && (
              <section className="bg-white p-8 rounded-2xl border border-[#E4E0D9] shadow-sm">
                <h2 className="text-2xl font-bold font-display text-[#111] mb-6">Experience Highlights</h2>
                <ul className="space-y-4 text-lg text-[#545454]">
                  {highlights.filter(Boolean).map((hl, i) => (
                    <li key={i} className="flex gap-4">
                      <CheckCircle className="size-6 text-[#15803D] flex-shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Important Info */}
            {importantInfo.filter(Boolean).length > 0 && (
              <section className="bg-[#FFF4E5] p-8 rounded-2xl border border-[#FFE8C2] shadow-sm">
                <h2 className="text-2xl font-bold font-display text-[#B45309] mb-4">Know Before You Go</h2>
                <ul className="space-y-3 text-[#92400E] list-disc list-inside">
                  {importantInfo.filter(Boolean).map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerary */}
            {itinerary && itinerary.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-display text-[#111] mb-8">Itinerary</h2>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.125rem] before:bg-[#E4E0D9] before:w-0.5 md:before:mx-auto md:before:translate-x-0">
                  {itinerary.map((stop, i) => (
                    <div key={i} className="relative flex flex-col md:flex-row items-start md:items-center justify-between group">
                      <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-4 border-[#1B2847] flex items-center justify-center font-bold text-[#1B2847] z-10 md:left-1/2 md:-ml-5 group-hover:scale-110 group-hover:border-[#C41230] group-hover:text-[#C41230] transition-all">
                        {stop.order}
                      </div>
                      <div className={`ml-16 md:ml-0 md:w-[45%] bg-white p-6 rounded-2xl border border-[#E4E0D9] shadow-sm ${i % 2 !== 0 ? 'md:order-1 md:ml-auto' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-[#111]">{stop.title}</h3>
                          {stop.isOptional && (
                            <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-semibold px-2 py-1 rounded-md">Optional</span>
                          )}
                        </div>
                        <p className="text-[#545454] mb-4">{stop.description}</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-[#7A746D]">
                          <Clock className="size-4" /> Stop: {stop.stayMinutes} minutes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Logistics & Meeting Point */}
            <section className="grid md:grid-cols-2 gap-8 pt-8 border-t border-[#E4E0D9]">
              <div>
                <h3 className="text-xl font-bold font-display text-[#111] mb-4">Meeting Point</h3>
                <p className="text-[#545454] text-lg">{tourData.meetingPoint}</p>
              </div>
              {tourData.endPoint && (
                <div>
                  <h3 className="text-xl font-bold font-display text-[#111] mb-4">End Point</h3>
                  <p className="text-[#545454] text-lg">{tourData.endPoint}</p>
                </div>
              )}
            </section>

            {/* Photo Gallery Carousel (bottom of page) */}
            {allImages.length > 1 && (
              <GalleryCarousel images={allImages} />
            )}

            {/* Reviews Section */}
            <ReviewSection
              tourId={tourData.id}
              reviews={reviews}
              currentUserId={currentUserId}
              averageRating={avgRating}
              reviewCount={tourData.reviewCount}
            />
          </div>

          {/* Right Column (Sticky Booking Widget) */}
          <div className="lg:col-span-1">
            <BookingWidget 
              tourId={tourData.id} 
              basePrice={basePrice} 
              childPrice={tourData.childPrice ? Number(tourData.childPrice) : null} 
              likelyToSellOut={tourData.likelyToSellOut} 
            />
          </div>

        </div>
      </div>
    </div>
  );
}
