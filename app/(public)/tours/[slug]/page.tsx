import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Clock, MapPin, Users, CheckCircle, XCircle, ChevronRight, Star, Globe, Zap, CalendarCheck, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { TourGallery, GalleryCarousel } from "@/components/public/TourGallery";
import { ReviewSection } from "@/components/public/ReviewSection";
import { BookingWidget } from "@/components/public/BookingWidget";
import { WishlistButton } from "@/components/public/WishlistButton";
import { MobileBookingCTA } from "@/components/public/MobileBookingCTA";
import { ExpandableDescription } from "@/components/public/ExpandableDescription";
import { ItineraryTimeline } from "@/components/public/ItineraryTimeline";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "bg-[#DCFCE7] text-[#15803D]",
  MODERATE: "bg-[#FEF3C7] text-[#B45309]",
  CHALLENGING: "bg-[#FEE2E2] text-[#C41230]",
};

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in TourDetailPage:", e);
  }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  if (!tour || tour.status !== "PUBLISHED") notFound();

  let isWishlisted = false;
  if (currentUserId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = await prisma.$queryRaw`SELECT id FROM Wishlist WHERE userId = ${currentUserId} AND tourId = ${tour.id} LIMIT 1`;
      isWishlisted = results.length > 0;
    } catch {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tourData = tour as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeArr = (v: unknown): any[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  };

  const includes     = safeArr(tourData.includes).filter(Boolean) as string[];
  const excludes     = safeArr(tourData.excludes).filter(Boolean) as string[];
  const highlights   = safeArr(tourData.highlights).filter(Boolean) as string[];
  const importantInfo = safeArr(tourData.importantInfo).filter(Boolean) as string[];
  const languages    = safeArr(tourData.languages).filter(Boolean) as string[];
  const itinerary    = safeArr(tourData.itinerary) as {
    order: number; title: string; description: string; stayMinutes: string; isOptional: boolean;
  }[];

  const basePrice     = Number(tourData.basePrice);
  const tourType      = (tourData.tourType as "SOLO" | "GROUP") ?? "GROUP";
  const baseGroupSize = Number(tourData.baseGroupSize ?? 4);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverImage  = (tourData.images as any[]).find(i => i.isPrimary)?.url || tourData.images[0]?.url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allImages   = (tourData.images as any[]).map(i => ({ url: i.url, altText: i.altText }));
  const avgRating   = Number(tourData.rating ?? 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (tourData.reviews as any[]).map(r => ({
    id: r.id,
    rating: r.rating,
    message: r.message,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt.toISOString(),
    user: { name: r.user.name, image: r.user.image },
  }));

  const descParagraphs = tour.description.split("\n").filter(p => p.trim().length > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedRaw = await (prisma.tour.findMany as any)({
    where: { category: tour.category, status: "PUBLISHED", NOT: { id: tour.id } },
    take: 4,
    orderBy: { rating: "desc" },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedTours = relatedRaw.map((t: any) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    shortDescription: t.shortDescription,
    basePrice: Number(t.basePrice),
    rating: Number(t.rating ?? 0),
    reviewCount: t.reviewCount,
    duration: t.duration,
    durationType: t.durationType,
    coverImage: t.images[0]?.url ?? null,
  }));

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-24 md:pt-28 pb-28 md:pb-20">

      {/* ── Full-width header block ─────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-8">

        {/* Breadcrumbs & Wishlist */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center text-sm text-[#7A746D] overflow-hidden">
            <Link href="/" className="hover:text-[#1B2847] hover:underline transition-colors shrink-0">Home</Link>
            <ChevronRight className="size-4 mx-2 shrink-0" />
            <Link href="/tours" className="hover:text-[#1B2847] hover:underline transition-colors shrink-0">Tours</Link>
            <ChevronRight className="size-4 mx-2 shrink-0" />
            <span className="text-[#111] font-medium truncate">{tour.title}</span>
          </div>
          <WishlistButton tourId={tour.id} isWishlistedInitial={isWishlisted} showText={true} className="shrink-0" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="bg-[#1B2847] text-white text-xs font-bold px-3 py-1 rounded-md tracking-widest uppercase">
            {tour.category.replace(/_/g, " ")}
          </span>
          {tourData.difficulty && (
            <span className={`text-xs font-bold px-3 py-1 rounded-md ${DIFFICULTY_COLOR[tourData.difficulty] ?? "bg-[#F3F4F6] text-[#6B7280]"}`}>
              <Zap className="size-3 inline mr-1" />
              {DIFFICULTY_LABEL[tourData.difficulty] ?? tourData.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-[#111] leading-tight mb-3">{tour.title}</h1>

        {/* Rating + short description row */}
        <div className="flex flex-wrap items-center gap-4 mb-2">
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-4.5 ${i < Math.floor(avgRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#E4E0D9] fill-[#E4E0D9]"}`} />
                ))}
              </div>
              <span className="font-bold text-[#111]">{avgRating.toFixed(1)}</span>
              {tourData.reviewCount > 0 && (
                <a href="#reviews" className="text-sm text-[#7A746D] hover:underline">
                  ({tourData.reviewCount} {tourData.reviewCount === 1 ? "review" : "reviews"})
                </a>
              )}
            </div>
          )}
          <span className="hidden sm:block text-[#E4E0D9]">·</span>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#545454]">
            <span className="flex items-center gap-1.5"><Clock className="size-4 text-[#C41230]" />{tour.duration} {tour.durationType}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4 text-[#C41230]" />{tour.location}</span>
            <span className="flex items-center gap-1.5"><Users className="size-4 text-[#C41230]" />Up to {tour.maxGroupSize} people</span>
            {languages.length > 0 && <span className="flex items-center gap-1.5"><Globe className="size-4 text-[#C41230]" />{languages.join(", ")}</span>}
          </div>
        </div>
      </div>

      {/* ── Two-column content grid ─────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* ── Left Column ─────────────────────── */}
          <div className="lg:col-span-2">

            {/* Hero Gallery */}
            <TourGallery
              coverImage={coverImage}
              allImages={allImages}
              title={tour.title}
              likelyToSellOut={tour.likelyToSellOut}
            />

            {/* Short description */}
            <p className="text-base text-[#545454] leading-relaxed mt-5 mb-1">{tour.shortDescription}</p>

            {/* ── About this activity ── */}
            <div className="mt-6 mb-2">
              <h2 className="font-bold text-[#111] text-base mb-3">About this activity</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-[#545454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Duration {tour.duration} {tour.durationType}</p>
                    <p className="text-xs text-[#7A746D]">Check availability to see starting times</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="size-5 text-[#545454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Small group</p>
                    <p className="text-xs text-[#7A746D]">Limited to {tour.maxGroupSize} participants</p>
                  </div>
                </div>
                {languages.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Globe className="size-5 text-[#545454] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#111]">Live tour guide</p>
                      <p className="text-xs text-[#7A746D]">{languages.join(", ")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <BadgeCheck className="size-5 text-[#545454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Free cancellation</p>
                    <p className="text-xs text-[#7A746D]">Cancel up to 24 hours in advance for a full refund</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarCheck className="size-5 text-[#545454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">Reserve now &amp; pay later</p>
                    <p className="text-xs text-[#7A746D]">Keep your travel plans flexible — book your spot and pay nothing today</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-[#545454] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{tour.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Definition-list sections ── */}
            <div className="divide-y divide-[#E4E0D9] border-t border-[#E4E0D9] mt-4">

              {/* Full description */}
              <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                <h2 className="font-bold text-[#111] text-sm leading-snug">Full description</h2>
                <ExpandableDescription paragraphs={descParagraphs} />
              </div>

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                  <h2 className="font-bold text-[#111] text-sm leading-snug">Highlights</h2>
                  <ul className="space-y-2">
                    {highlights.map((hl, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#545454]">
                        <CheckCircle className="size-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Includes / Excludes */}
              {(includes.length > 0 || excludes.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                  <h2 className="font-bold text-[#111] text-sm leading-snug">Includes</h2>
                  <ul className="space-y-2">
                    {includes.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#545454]">
                        <CheckCircle className="size-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {excludes.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#545454]">
                        <XCircle className="size-4 text-[#C41230] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meeting point */}
              {tourData.meetingPoint && (
                <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                  <h2 className="font-bold text-[#111] text-sm leading-snug">Meeting point</h2>
                  <div>
                    <p className="text-sm text-[#545454] leading-relaxed">{tourData.meetingPoint}</p>
                  </div>
                </div>
              )}

              {/* Important Info */}
              {importantInfo.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                  <h2 className="font-bold text-[#111] text-sm leading-snug">Important information</h2>
                  <ul className="space-y-2">
                    {importantInfo.map((info, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#545454]">
                        <span className="text-[#545454] shrink-0 mt-1">•</span>
                        <span>{info}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-x-8 gap-y-2 py-5">
                  <div>
                    <h2 className="font-bold text-[#111] text-sm leading-snug">Itinerary</h2>
                    <p className="text-xs text-[#7A746D] mt-1">Subject to change</p>
                  </div>
                  <ItineraryTimeline
                    itinerary={itinerary}
                    meetingPoint={tourData.meetingPoint}
                    endPoint={tourData.endPoint}
                  />
                </div>
              )}

            </div>

            {/* Photo Gallery Carousel */}
            {allImages.length > 1 && <div className="mt-8"><GalleryCarousel images={allImages} /></div>}

            {/* Reviews */}
            <div id="reviews" className="mt-8">
              <ReviewSection
                tourId={tourData.id}
                reviews={reviews}
                currentUserId={currentUserId}
                averageRating={avgRating}
                reviewCount={tourData.reviewCount}
              />
            </div>
          </div>

          {/* ── Right Column (Booking Widget) ─── */}
          <div className="lg:col-span-1 hidden lg:block">
            <BookingWidget
              tourId={tourData.id}
              tourType={tourType}
              basePrice={basePrice}
              baseGroupSize={baseGroupSize}
              childPrice={tourData.childPrice ? Number(tourData.childPrice) : null}
              likelyToSellOut={tourData.likelyToSellOut}
              maxGroupSize={tourData.maxGroupSize}
            />
          </div>

        </div>
      </div>

      {/* ── You might also like ─────────────── */}
      {relatedTours.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-20">
          <div className="border-t border-[#E4E0D9] pt-14">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-[#111] mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedTours.map((t: {
                id: string; slug: string; title: string; shortDescription: string;
                basePrice: number; rating: number; reviewCount: number;
                duration: number; durationType: string; coverImage: string | null;
              }) => (
                <Link
                  key={t.id}
                  href={`/tours/${t.slug}`}
                  className="group bg-white rounded-2xl border border-[#E4E0D9] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Image */}
                  <div className="aspect-4/3 overflow-hidden bg-[#E7E8EE]">
                    {t.coverImage ? (
                      <img
                        src={t.coverImage}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-[#0C447C] to-[#185FA5]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[#111] text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#185FA5] transition-colors">
                      {t.title}
                    </h3>
                    {t.rating > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="size-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-sm font-semibold text-[#111]">{t.rating.toFixed(1)}</span>
                        {t.reviewCount > 0 && (
                          <span className="text-xs text-[#7A746D]">({t.reviewCount})</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-[#7A746D] flex items-center gap-1">
                        <Clock className="size-3.5" />{t.duration} {t.durationType}
                      </span>
                      <span className="text-sm font-bold text-[#111]">
                        From <span className="text-[#185FA5]">${t.basePrice}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA */}
      <MobileBookingCTA
        tourId={tourData.id}
        tourType={tourType}
        basePrice={basePrice}
        baseGroupSize={baseGroupSize}
        childPrice={tourData.childPrice ? Number(tourData.childPrice) : null}
        likelyToSellOut={tourData.likelyToSellOut}
        maxGroupSize={tourData.maxGroupSize}
      />
    </div>
  );
}
