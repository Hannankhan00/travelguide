import { prisma } from "@/lib/prisma";
import { ToursClient } from "./ToursClient";

async function getTours() {
  try {
    const tours = await prisma.tour.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { bookings: true, availability: true },
        },
      },
    });

    return tours.map((tour) => ({
      ...tour,
      basePrice: tour.basePrice ? Number(tour.basePrice) : 0,
      childPrice: tour.childPrice ? Number(tour.childPrice) : null,
      rating: tour.rating ? Number(tour.rating) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch tours:", error);
    return [];
  }
}

export default async function ToursPage() {
  const tours = await getTours();
  return <ToursClient tours={tours} />;
}
