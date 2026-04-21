import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { TourForm } from "../new/TourForm";
import { TourImageManager } from "@/components/admin/TourImageManager";

async function getTour(id: string) {
  let tour;
  try {
    tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });
  } catch (e) {
    console.error(`[EditTourPage] DB error fetching tour ${id}:`, e);
    notFound();
  }
  if (!tour) notFound();
  return tour;
}

/** Safely extract a JSON array field — handles null, empty strings, raw strings, and already-parsed arrays */
function safeArray(value: unknown, fallback: string[] = [""]): any[] {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.length > 0 ? value : fallback;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export default async function EditTourPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  if (!id || typeof id !== "string") notFound();
  const tour = await getTour(id);

  const initialData = {
    tourId:           tour.id,
    tourType:         ((tour as any).tourType as "SOLO" | "GROUP") ?? "GROUP",
    baseGroupSize:    String((tour as any).baseGroupSize ?? 4),
    title:            tour.title,
    slug:             tour.slug,
    category:         tour.category,
    difficulty:       tour.difficulty,
    location:         tour.location,
    prefecture:       tour.prefecture ?? "",
    country:          tour.country,
    countryCode:      tour.countryCode ?? "",
    stateCode:        tour.stateCode ?? "",
    shortDescription: tour.shortDescription,
    description:      tour.description,
    highlights:       safeArray(tour.highlights),
    itinerary:        (() => {
                        const arr = safeArray(tour.itinerary, []);
                        return arr.length > 0
                          ? arr.map((stop: any, idx: number) => ({
                              order:       stop.order ?? stop.day ?? idx + 1,
                              title:       stop.title ?? "",
                              description: stop.description ?? "",
                              stayMinutes: stop.stayMinutes ?? "30",
                              isOptional:  stop.isOptional ?? false,
                            }))
                          : [{ order: 1, title: "", description: "", stayMinutes: "30", isOptional: false }];
                      })(),
    meetingPoint:     tour.meetingPoint,
    endPoint:         tour.endPoint ?? "",
    duration:         tour.duration.toString(),
    durationType:     tour.durationType,
    maxGroupSize:     tour.maxGroupSize.toString(),
    minGroupSize:     tour.minGroupSize.toString(),
    dailyCapacity:    tour.dailyCapacity?.toString() ?? "10",
    languages:        safeArray(tour.languages, ["English"]),
    serviceProvider:  tour.serviceProvider ?? "",
    basePrice:        Number(tour.basePrice).toString(),
    childPrice:       tour.childPrice ? Number(tour.childPrice).toString() : "",
    priceTiers:       safeArray(tour.priceTiers, []),
    variations:       safeArray((tour as any).variations, []),
    startTimes:           safeArray((tour as any).startTimes, []),
    cancellationHours:    String((tour as any).cancellationHours ?? 24),
    rescheduleHours:      String((tour as any).rescheduleHours   ?? 48),
    includes:         safeArray(tour.includes),
    excludes:         safeArray(tour.excludes),
    importantInfo:    safeArray(tour.importantInfo),
    metaTitle:        tour.metaTitle ?? "",
    metaDescription:  tour.metaDescription ?? "",
    featured:         tour.featured,
    likelyToSellOut:  tour.likelyToSellOut,
    status:           tour.status,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Edit Tour</h1>
          <p className="text-sm text-[#7A746D] mt-0.5">{tour.title}</p>
        </div>
        <Link
          href={`/admin/tours/${tour.id}/availability`}
          className="flex items-center gap-2 bg-[#1B2847] hover:bg-[#243560] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <CalendarDays className="size-4" /> Manage Availability
        </Link>
      </div>
      {/* ── Existing photos — manage inline, changes save instantly ── */}
      <div className="bg-white rounded-2xl border border-[#E4E0D9] p-6 shadow-sm">
        <TourImageManager
          tourId={tour.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialImages={(tour.images as any[]).map(i => ({
            id: i.id,
            url: i.url,
            isPrimary: i.isPrimary,
            altText: i.altText ?? null,
          }))}
        />
      </div>

      <TourForm initialData={initialData} />
    </div>
  );
}
