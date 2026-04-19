import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function DestinationsSection() {
  const places = await prisma.place.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    take: 12,
  });

  if (places.length === 0) return null;

  return (
    <section className="py-8 border-b border-[#e8e8e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[20px] font-bold text-[#111] mb-4">
          Things to do wherever you&apos;re going
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/tours?q=${encodeURIComponent(place.linkQuery ?? place.name)}`}
              className="group text-center cursor-pointer"
            >
              <div className="rounded-[10px] overflow-hidden h-27.5 mb-2 bg-[#E7E8EE] group-hover:opacity-85 transition-opacity">
                {place.imageUrl ? (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#0C447C] to-[#185FA5]" />
                )}
              </div>
              <p className="text-[13px] font-semibold text-[#111] group-hover:text-[#185FA5] transition-colors">
                {place.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
