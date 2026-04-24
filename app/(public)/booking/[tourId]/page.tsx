import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { MapPin, Calendar, Users, Clock } from "lucide-react";
import Image from "next/image";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";
import { calcGroupPrice } from "@/lib/utils";

interface BookingPageProps {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { tourId } = await params;
  const sp = await searchParams;

  const dateParam      = sp.date        as string;
  const adultsParam    = sp.adults      as string;
  const childrenParam  = sp.children   as string;
  const startTimeParam = (sp.startTime  as string) || null;
  const variationIdParam = (sp.variationId as string) || null;

  if (!dateParam || !adultsParam) {
    redirect("/"); // Or back to tour page, but we don't have slug easily here unless we query
  }

  const adults = parseInt(adultsParam, 10);
  const children = parseInt(childrenParam || "0", 10);
  
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { images: true }
  });

  if (!tour) {
    notFound();
  }

  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in BookingPage:", e);
  }

  if (!session?.user) {
    const returnUrl = `/booking/${tourId}?date=${dateParam}&adults=${adultsParam}&children=${childrenParam ?? "0"}${startTimeParam ? `&startTime=${startTimeParam}` : ""}${variationIdParam ? `&variationId=${variationIdParam}` : ""}`;
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
  }

  // Create a minimal user profile object to preload
  let userProfile = null;
  if (session?.user?.email) {
    userProfile = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, phone: true }
    });
  }

  const basePrice     = Number(tour.basePrice);
  const childPrice    = tour.childPrice ? Number(tour.childPrice) : basePrice;
  const tourType      = ((tour as any).tourType as "SOLO" | "GROUP") ?? "GROUP";
  const baseGroupSize = Number((tour as any).baseGroupSize ?? 4);
  const totalGuests   = adults + children;
  const isGroup       = tourType === "GROUP";
  const baseTotal     = isGroup
    ? calcGroupPrice(totalGuests, baseGroupSize, basePrice)
    : adults * basePrice + children * childPrice;
  const groupUnits    = isGroup ? Math.ceil(totalGuests / baseGroupSize) : 0;

  // Resolve selected variation
  const safeParseArr = (v: unknown): any[] => {
    if (!v) return [];
    if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };
  interface TourVariation { id: string; name: string; description: string; extraCost: string; }
  const allVariations = safeParseArr((tour as any).variations) as TourVariation[];
  const selectedVariation = variationIdParam ? allVariations.find(v => v.id === variationIdParam) ?? null : null;
  const variationExtra    = selectedVariation ? Number(selectedVariation.extraCost) : 0;
  const totalPrice        = baseTotal + variationExtra;
  
  const primaryImage = tour.images.find(img => img.isPrimary)?.url || tour.images[0]?.url;

  return (
    <div className="bg-[#F8F9FF] min-h-screen pt-28 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-[#111]">Secure Checkout</h1>
          <p className="text-[#545454] mt-2">Please review your booking details and enter your information.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutForm
              tourId={tour.id}
              date={dateParam}
              adults={adults}
              children={children}
              totalPrice={totalPrice}
              startTime={startTimeParam}
              variationId={variationIdParam}
              variationName={selectedVariation?.name ?? null}
              variationExtra={variationExtra}
              userProfile={userProfile}
            />
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E7E8EE] shadow-sm overflow-hidden sticky top-24">
              {primaryImage && (
                <div className="relative h-48 w-full">
                  <Image src={cldUrl(primaryImage, CLD_CARD)} alt={tour.title} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold font-display text-[#111] mb-2">{tour.title}</h3>
                <div className="flex items-center text-[#7A746D] text-sm mb-6">
                  <MapPin className="size-4 mr-1" /> {tour.location}
                </div>

                <div className="space-y-4 mb-6 text-sm text-[#111]">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-[#EF9F27]" />
                    <div>
                      <span className="block font-semibold">Date</span>
                      <span className="text-[#545454]">{new Date(dateParam).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-[#EF9F27]" />
                    <div>
                      <span className="block font-semibold">Duration</span>
                      <span className="text-[#545454]">{tour.duration} {tour.durationType}</span>
                    </div>
                  </div>

                  {startTimeParam && (
                    <div className="flex items-center gap-3">
                      <Clock className="size-5 text-[#EF9F27]" />
                      <div>
                        <span className="block font-semibold">Starting time</span>
                        <span className="text-[#545454]">{startTimeParam}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-[#EF9F27]" />
                    <div>
                      <span className="block font-semibold">Participants</span>
                      <span className="text-[#545454]">{adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E7E8EE] pt-4 space-y-2 mb-4">
                  {isGroup ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#545454]">{groupUnits} × ${basePrice} (per {baseGroupSize} guests)</span>
                      <span className="font-semibold text-[#111]">${baseTotal.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#545454]">Adult x {adults}</span>
                        <span className="font-semibold text-[#111]">${(adults * basePrice).toFixed(2)}</span>
                      </div>
                      {children > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#545454]">Child x {children}</span>
                          <span className="font-semibold text-[#111]">${(children * childPrice).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {selectedVariation && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#545454]">{selectedVariation.name}</span>
                      <span className="font-semibold text-[#C41230]">+${variationExtra.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E7E8EE] pt-4 flex justify-between items-end">
                  <div>
                    <span className="font-bold text-[#111] block">Total</span>
                    <span className="text-xs text-[#7A746D]">Taxes and fees included</span>
                  </div>
                  <span className="text-2xl font-bold font-display text-[#185FA5]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
