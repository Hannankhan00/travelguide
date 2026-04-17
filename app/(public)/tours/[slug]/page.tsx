import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Clock, MapPin, Users, CheckCircle, XCircle, ChevronRight, Star, Globe, Zap } from "lucide-react";
import Link from "next/link";
import { TourGallery, GalleryCarousel } from "@/components/public/TourGallery";
import { ReviewSection } from "@/components/public/ReviewSection";
import { BookingWidget } from "@/components/public/BookingWidget";
import { WishlistButton } from "@/components/public/WishlistButton";
import { MobileBookingCTA } from "@/components/public/MobileBookingCTA";
import { parsePriceTiers } from "@/lib/utils";

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

  const basePrice   = Number(tourData.basePrice);
  const priceTiers  = parsePriceTiers(tourData.priceTiers);
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

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-24 md:pt-28 pb-28 md:pb-20">

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
          <WishlistButton tourId={tour.id} isWishlistedInitial={isWishlisted} showText={true} className="shrink-0" />
        </div>
      </div>

      {/* Hero Gallery */}
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

          {/* ── Left Column ─────────────────────── */}
          <div className="lg:col-span-2 space-y-12">

            {/* Header */}
            <div>
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

              <h1 className="text-4xl md:text-5xl font-display font-bold text-[#111] leading-tight mb-4">{tour.title}</h1>

              {/* Rating row */}
              {avgRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-5 ${i < Math.floor(avgRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#E4E0D9] fill-[#E4E0D9]"}`} />
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

              <p className="text-xl text-[#545454] leading-relaxed mb-6">{tour.shortDescription}</p>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#E4E0D9]">
                <div className="flex items-center gap-2 text-[#111]">
                  <Clock className="size-5 text-[#C41230]" />
                  <span className="font-medium">{tour.duration} {tour.durationType}</span>
                </div>
                <div className="flex items-center gap-2 text-[#111]">
                  <Users className="size-5 text-[#C41230]" />
                  <span className="font-medium">Up to {tour.maxGroupSize} people</span>
                </div>
                <div className="flex items-center gap-2 text-[#111]">
                  <MapPin className="size-5 text-[#C41230]" />
                  <span className="font-medium">{tour.location}</span>
                </div>
                {languages.length > 0 && (
                  <div className="flex items-center gap-2 text-[#111]">
                    <Globe className="size-5 text-[#C41230]" />
                    <span className="font-medium">{languages.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <section>
              <h2 className="text-2xl font-bold font-display text-[#111] mb-6">About this activity</h2>
              <div className="space-y-4 text-lg text-[#545454] leading-relaxed">
                {descParagraphs.map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </section>

            {/* Highlights */}
            {highlights.length > 0 && (
              <section className="bg-white p-8 rounded-2xl border border-[#E4E0D9] shadow-sm">
                <h2 className="text-2xl font-bold font-display text-[#111] mb-6">Experience Highlights</h2>
                <ul className="space-y-4">
                  {highlights.map((hl, i) => (
                    <li key={i} className="flex gap-4 text-lg text-[#545454]">
                      <CheckCircle className="size-6 text-[#15803D] shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Includes / Excludes */}
            {(includes.length > 0 || excludes.length > 0) && (
              <section className="bg-white p-8 rounded-2xl border border-[#E4E0D9] shadow-sm">
                <h2 className="text-2xl font-bold font-display text-[#111] mb-6">What&apos;s included</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {includes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-[#15803D] uppercase text-xs tracking-widest mb-4">Included</h3>
                      <ul className="space-y-3">
                        {includes.map((item, i) => (
                          <li key={i} className="flex gap-3 text-[#545454]">
                            <CheckCircle className="size-5 text-[#15803D] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excludes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-[#C41230] uppercase text-xs tracking-widest mb-4">Not included</h3>
                      <ul className="space-y-3">
                        {excludes.map((item, i) => (
                          <li key={i} className="flex gap-3 text-[#545454]">
                            <XCircle className="size-5 text-[#C41230] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Important Info */}
            {importantInfo.length > 0 && (
              <section className="bg-[#FFF4E5] p-8 rounded-2xl border border-[#FFE8C2] shadow-sm">
                <h2 className="text-2xl font-bold font-display text-[#B45309] mb-4">Know Before You Go</h2>
                <ul className="space-y-3 text-[#92400E]">
                  {importantInfo.map((info, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[#B45309] font-bold mt-0.5">•</span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerary — GYG-style vertical timeline */}
            {itinerary.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-display text-[#111] mb-2">Itinerary</h2>
                <p className="text-sm text-[#7A746D] mb-8">For reference only. Itineraries are subject to change.</p>

                <div className="relative">
                  {/* ── Vertical spine line ── */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#C41230]" />

                  {/* ── Start node: Meeting Point ── */}
                  <div className="relative flex items-start gap-5 pb-8">
                    <div className="relative z-10 w-10 h-10 rounded-full bg-[#C41230] flex items-center justify-center shrink-0 shadow-md">
                      <MapPin className="size-5 text-white" />
                    </div>
                    <div className="pt-1.5">
                      <p className="text-xs font-bold text-[#C41230] uppercase tracking-widest mb-0.5">Start point</p>
                      <p className="font-bold text-[#111] text-base">{tourData.meetingPoint}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tourData.meetingPoint)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C41230] hover:underline mt-1"
                      >
                        <MapPin className="size-3" />
                        Open in Google Maps
                      </a>
                    </div>
                  </div>

                  {/* ── Itinerary stops ── */}
                  {itinerary.map((stop, i) => (
                    <div
                      key={i}
                      className={`relative flex items-start gap-5 pb-8 ${stop.isOptional ? "opacity-55" : ""}`}
                    >
                      {/* Icon circle */}
                      <div className={`relative z-10 shrink-0 flex items-center justify-center rounded-full shadow
                        ${stop.isOptional
                          ? "w-8 h-8 mt-1 bg-white border-2 border-dashed border-[#A8A29E]"
                          : "w-10 h-10 bg-[#1B2847]"
                        }`}>
                        <MapPin className={`${stop.isOptional ? "size-4 text-[#A8A29E]" : "size-5 text-white"}`} />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pt-1.5 ${stop.isOptional ? "ml-1" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className={`font-bold text-base leading-snug ${stop.isOptional ? "text-[#6B7280]" : "text-[#111]"}`}>
                            {stop.title}
                          </h3>
                          {stop.isOptional && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] border border-dashed border-[#D1D5DB] px-2 py-0.5 rounded-full italic">
                              Optional
                            </span>
                          )}
                        </div>
                        {stop.description && (
                          <p className="text-sm text-[#545454] mb-1.5 leading-relaxed">{stop.description}</p>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A746D]">
                          <Clock className="size-3.5" />
                          {stop.stayMinutes} minutes
                        </span>
                      </div>

                      {/* Connector dots between stops */}
                      {i < itinerary.length - 1 && !stop.isOptional && (
                        <div className="absolute left-5 bottom-2 flex flex-col items-center gap-1 -translate-x-1/2">
                          <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-60" />
                          <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-40" />
                          <span className="w-1 h-1 rounded-full bg-[#C41230] opacity-20" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ── End node: End Point or same as start ── */}
                  <div className="relative flex items-start gap-5">
                    <div className="relative z-10 w-10 h-10 rounded-full bg-[#C41230] flex items-center justify-center shrink-0 shadow-md">
                      <MapPin className="size-5 text-white" />
                    </div>
                    <div className="pt-1.5">
                      <p className="text-xs font-bold text-[#C41230] uppercase tracking-widest mb-0.5">Finish point</p>
                      <p className="font-bold text-[#111] text-base">{tourData.endPoint || tourData.meetingPoint}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tourData.endPoint || tourData.meetingPoint)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C41230] hover:underline mt-1"
                      >
                        <MapPin className="size-3" />
                        Open in Google Maps
                      </a>
                      {!tourData.endPoint && (
                        <p className="text-xs text-[#7A746D] mt-0.5">Returns to start point</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Photo Gallery Carousel */}
            {allImages.length > 1 && <GalleryCarousel images={allImages} />}

            {/* Reviews */}
            <div id="reviews">
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
              basePrice={basePrice}
              childPrice={tourData.childPrice ? Number(tourData.childPrice) : null}
              likelyToSellOut={tourData.likelyToSellOut}
              priceTiers={priceTiers}
              maxGroupSize={tourData.maxGroupSize}
            />
          </div>

        </div>
      </div>

      {/* Mobile sticky CTA */}
      <MobileBookingCTA
        tourId={tourData.id}
        basePrice={basePrice}
        priceTiers={priceTiers}
      />
    </div>
  );
}
