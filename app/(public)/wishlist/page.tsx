import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WishlistClient } from "@/components/public/WishlistClient";

export const metadata = {
  title: "Your Wishlist",
};

export default async function WishlistPage() {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in WishlistPage:", e);
  }

  if (!session?.user) {
    redirect("/?auth=login");
  }

  const wishlistRows: any[] = await prisma.$queryRaw`
    SELECT tourId FROM Wishlist
    WHERE userId = ${session.user.id}
    ORDER BY createdAt DESC
  `;

  const tourIds = wishlistRows.map((row) => row.tourId);

  const tours =
    tourIds.length > 0
      ? await prisma.tour.findMany({
          where: { id: { in: tourIds } },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          } as any,
        })
      : [];

  // preserve wishlist order
  const sorted = tourIds
    .map((id) => tours.find((t: any) => t.id === id))
    .filter(Boolean) as any[];

  const clientTours = sorted.map((tour: any) => ({
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    location: tour.location,
    duration: tour.duration,
    durationType: tour.durationType ?? "days",
    basePrice: Number(tour.basePrice),
    rating: tour.rating ? Number(tour.rating) : null,
    reviewCount: tour.reviewCount ?? 0,
    maxGroupSize: tour.maxGroupSize ?? null,
    category: tour.category,
    coverImage: tour.images[0]?.url ?? undefined,
  }));

  return (
    <div className="bg-[#F8F7F5] min-h-screen pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#111]">Your Wishlist</h1>
            <p className="text-[#545454] mt-2">
              {clientTours.length > 0
                ? `${clientTours.length} saved ${clientTours.length === 1 ? "tour" : "tours"}`
                : "Save tours to revisit them later."}
            </p>
          </div>
          {clientTours.length > 0 && (
            <div className="flex items-center gap-2 text-[#C41230]">
              <Heart className="size-5 fill-current" />
              <span className="font-bold text-lg">{clientTours.length}</span>
            </div>
          )}
        </div>

        <WishlistClient initialTours={clientTours} />

      </div>
    </div>
  );
}
