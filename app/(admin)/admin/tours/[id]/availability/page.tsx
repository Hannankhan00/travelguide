import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TourAvailabilityPage({ params }: PageProps) {
  const { id } = await params;

  const tour = await prisma.tour.findUnique({
    where: { id },
    select: { id: true, title: true, dailyCapacity: true },
  });
  if (!tour) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/admin/tours/${id}`}
            className="flex items-center gap-1 text-sm text-[#7A746D] hover:text-[#111] mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" /> Back to tour
          </Link>
          <h1 className="text-2xl font-bold text-[#111]">Availability</h1>
          <p className="text-sm text-[#7A746D] mt-0.5">{tour.title}</p>
        </div>
        <div className="text-sm text-[#7A746D] bg-[#F8F7F5] rounded-xl px-4 py-3">
          <span className="font-semibold text-[#111]">Default capacity:</span>{" "}
          {tour.dailyCapacity} guests/day
          <br />
          <span className="text-xs">Click any date to set or edit its availability.</span>
        </div>
      </div>

      <AvailabilityManager tourId={tour.id} dailyCapacity={tour.dailyCapacity} />
    </div>
  );
}
