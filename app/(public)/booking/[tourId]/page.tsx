import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { MapPin, Calendar, Users, Clock } from "lucide-react";
import Image from "next/image";
import { parsePriceTiers, getPriceForGroupSize } from "@/lib/utils";

interface BookingPageProps {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { tourId } = await params;
  const sp = await searchParams;

  const dateParam = sp.date as string;
  const adultsParam = sp.adults as string;
  const childrenParam = sp.children as string;

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

  const session = await auth();

  // Create a minimal user profile object to preload
  let userProfile = null;
  if (session?.user?.email) {
    userProfile = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, phone: true }
    });
  }

  const basePrice = Number(tour.basePrice);
  const childPrice = tour.childPrice ? Number(tour.childPrice) : basePrice;
  const priceTiers = parsePriceTiers((tour as any).priceTiers);
  const hasTiers = priceTiers.length > 0;
  const totalGuests = adults + children;
  const tierPrice = getPriceForGroupSize(priceTiers, totalGuests, basePrice);
  const totalPrice = hasTiers
    ? totalGuests * tierPrice
    : adults * basePrice + children * childPrice;
  
  const primaryImage = tour.images.find(img => img.isPrimary)?.url || tour.images[0]?.url;

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-12">
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
              userProfile={userProfile}
            />
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden sticky top-24">
              {primaryImage && (
                <div className="relative h-48 w-full">
                  <Image src={primaryImage} alt={tour.title} fill className="object-cover" />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold font-display text-[#111] mb-2">{tour.title}</h3>
                <div className="flex items-center text-[#7A746D] text-sm mb-6">
                  <MapPin className="size-4 mr-1" /> {tour.location}
                </div>

                <div className="space-y-4 mb-6 text-sm text-[#111]">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-[#C8A84B]" />
                    <div>
                      <span className="block font-semibold">Date</span>
                      <span className="text-[#545454]">{new Date(dateParam).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-[#C8A84B]" />
                    <div>
                      <span className="block font-semibold">Duration</span>
                      <span className="text-[#545454]">{tour.duration} {tour.durationType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-[#C8A84B]" />
                    <div>
                      <span className="block font-semibold">Participants</span>
                      <span className="text-[#545454]">{adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E4E0D9] pt-4 space-y-2 mb-4">
                  {hasTiers ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#545454]">{totalGuests} people × ${tierPrice}/person</span>
                      <span className="font-semibold text-[#111]">${totalPrice.toFixed(2)}</span>
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
                </div>

                <div className="border-t border-[#E4E0D9] pt-4 flex justify-between items-end">
                  <div>
                    <span className="font-bold text-[#111] block">Total</span>
                    <span className="text-xs text-[#7A746D]">Taxes and fees included</span>
                  </div>
                  <span className="text-2xl font-bold font-display text-[#C41230]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
