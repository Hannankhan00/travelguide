"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

/** Safely parse a JSON string — never throws, always returns a valid array */
function safeJsonParse(raw: string | null | undefined, fallback: any[] = []): any[] {
  if (!raw || raw.trim() === "") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export type ActionResult = {
  error?: string;
  success?: string;
  tourId?: string;
};

// ── Create / Update Tour ─────────────────────────────────────────────────────

export async function saveTourAction(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const tourId = formData.get("tourId") as string | null;
  const isEdit = !!tourId;

  // ── Basic fields ───────────────────────────────────────────
  const title            = (formData.get("title") as string)?.trim();
  const slug             = (formData.get("slug") as string)?.trim() || slugify(title || "");
  const category         = formData.get("category") as string;
  const difficulty       = formData.get("difficulty") as string || "MODERATE";
  const location         = (formData.get("location") as string)?.trim();
  const prefecture       = (formData.get("prefecture") as string)?.trim() || null;
  const country          = (formData.get("country") as string)?.trim() || "Japan";
  const countryCode      = (formData.get("countryCode") as string)?.trim() || null;
  const stateCode        = (formData.get("stateCode") as string)?.trim() || null;

  // ── Description ────────────────────────────────────────────
  const shortDescription = (formData.get("shortDescription") as string)?.trim();
  const description      = (formData.get("description") as string)?.trim();
  const highlights       = safeJsonParse(formData.get("highlights") as string);

  // ── Itinerary ──────────────────────────────────────────────
  const itinerary        = safeJsonParse(formData.get("itinerary") as string);

  // ── Logistics ──────────────────────────────────────────────
  const meetingPoint     = (formData.get("meetingPoint") as string)?.trim();
  const endPoint         = (formData.get("endPoint") as string)?.trim() || null;
  const duration         = parseFloat(formData.get("duration") as string) || 1;
  const durationType     = (formData.get("durationType") as string)?.trim() || "days";
  const maxGroupSize     = parseInt(formData.get("maxGroupSize") as string) || 10;
  const minGroupSize     = parseInt(formData.get("minGroupSize") as string) || 1;
  const dailyCapacity    = parseInt(formData.get("dailyCapacity") as string) || 10;
  const languages        = safeJsonParse(formData.get("languages") as string, ["English"]);
  const serviceProvider  = (formData.get("serviceProvider") as string)?.trim() || null;

  // ── Pricing ────────────────────────────────────────────────
  const basePrice        = parseFloat(formData.get("basePrice") as string) || 0;
  const childPriceRaw    = formData.get("childPrice") as string;
  const childPrice       = childPriceRaw ? parseFloat(childPriceRaw) : null;
  const priceTiers       = safeJsonParse(formData.get("priceTiers") as string);
  const includes         = safeJsonParse(formData.get("includes") as string);
  const excludes         = safeJsonParse(formData.get("excludes") as string);
  const importantInfo    = safeJsonParse(formData.get("importantInfo") as string);

  // ── SEO ────────────────────────────────────────────────────
  const metaTitle        = (formData.get("metaTitle") as string)?.trim() || null;
  const metaDescription  = (formData.get("metaDescription") as string)?.trim() || null;
  const featured         = formData.get("featured") === "true";
  const likelyToSellOut  = formData.get("likelyToSellOut") === "true";
  const status           = (formData.get("status") as string) || "DRAFT";

  // ── Validation ─────────────────────────────────────────────
  if (!title)            return { error: "Title is required." };
  if (!slug)             return { error: "Slug is required." };
  if (!category)         return { error: "Category is required." };
  if (!location)         return { error: "Location is required." };
  if (!shortDescription) return { error: "Short description is required." };
  if (!description)      return { error: "Full description is required." };
  if (!meetingPoint)     return { error: "Meeting point is required." };
  if (basePrice <= 0)    return { error: "Base price must be greater than 0." };

  // Check slug uniqueness
  const existingSlug = await prisma.tour.findUnique({ where: { slug } });
  if (existingSlug && existingSlug.id !== tourId) {
    return { error: "A tour with this slug already exists. Please choose a different one." };
  }

  const data = {
    title,
    slug,
    category:         category as "CULTURAL" | "ADVENTURE" | "FOOD_AND_DRINK" | "NATURE" | "CITY_TOUR" | "DAY_TRIP" | "MULTI_DAY" | "PRIVATE" | "GROUP",
    difficulty:       difficulty as "EASY" | "MODERATE" | "CHALLENGING",
    location,
    prefecture,
    country,
    countryCode,
    stateCode,
    shortDescription,
    description,
    highlights,
    itinerary,
    meetingPoint,
    endPoint,
    duration,
    durationType,
    maxGroupSize,
    minGroupSize,
    dailyCapacity,
    languages,
    serviceProvider,
    basePrice,
    childPrice,
    priceTiers,
    includes,
    excludes,
    importantInfo,
    metaTitle,
    metaDescription,
    featured,
    likelyToSellOut,
    status:           status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  };

  try {
    if (isEdit) {
      await prisma.tour.update({ where: { id: tourId }, data });
      revalidatePath("/admin/tours");
      revalidatePath(`/admin/tours/${tourId}`);
      return { success: "Tour updated successfully.", tourId: tourId };
    } else {
      const tour = await prisma.tour.create({ data });
      revalidatePath("/admin/tours");
      return { success: "Tour created successfully.", tourId: tour.id };
    }
  } catch (e: any) {
    console.error("Tour save error:", e);
    return { error: `Failed to save tour: ${e.message || String(e)}` };
  }
}

// ── Delete Tour ──────────────────────────────────────────────────────────────

export async function deleteTourAction(tourId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await prisma.tour.delete({ where: { id: tourId } });
    revalidatePath("/admin/tours");
    return { success: "Tour deleted." };
  } catch {
    return { error: "Failed to delete tour." };
  }
}

// ── Toggle Status ────────────────────────────────────────────────────────────

export async function toggleTourStatusAction(
  tourId: string,
  newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<ActionResult> {
  await assertAdmin();
  try {
    await prisma.tour.update({
      where: { id: tourId },
      data:  { status: newStatus },
    });
    revalidatePath("/admin/tours");
    return { success: `Tour status changed to ${newStatus.toLowerCase()}.` };
  } catch {
    return { error: "Failed to update status." };
  }
}

// ── Toggle Featured ──────────────────────────────────────────────────────────

export async function toggleFeaturedAction(tourId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    const tour = await prisma.tour.findUnique({ where: { id: tourId }, select: { featured: true } });
    if (!tour) return { error: "Tour not found." };
    await prisma.tour.update({
      where: { id: tourId },
      data:  { featured: !tour.featured },
    });
    revalidatePath("/admin/tours");
    return { success: tour.featured ? "Removed from featured." : "Added to featured." };
  } catch {
    return { error: "Failed to update." };
  }
}

// ── Manage Images ────────────────────────────────────────────────────────────

export async function addTourImageAction(
  tourId: string,
  url: string,
  altText: string,
  isPrimary: boolean
): Promise<ActionResult> {
  await assertAdmin();
  try {
    const count = await prisma.tourImage.count({ where: { tourId } });

    // If this is primary, unset all others
    if (isPrimary) {
      await prisma.tourImage.updateMany({
        where: { tourId },
        data:  { isPrimary: false },
      });
    }

    await prisma.tourImage.create({
      data: {
        tourId,
        url,
        altText: altText || null,
        order: count,
        isPrimary: isPrimary || count === 0, // first image is always primary
      },
    });

    revalidatePath(`/admin/tours/${tourId}`);
    return { success: "Image added." };
  } catch {
    return { error: "Failed to add image." };
  }
}

export async function deleteTourImageAction(imageId: string, tourId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await prisma.tourImage.delete({ where: { id: imageId } });
    revalidatePath(`/admin/tours/${tourId}`);
    return { success: "Image deleted." };
  } catch {
    return { error: "Failed to delete image." };
  }
}

export async function setPrimaryImageAction(imageId: string, tourId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await prisma.tourImage.updateMany({ where: { tourId }, data: { isPrimary: false } });
    await prisma.tourImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    revalidatePath(`/admin/tours/${tourId}`);
    return { success: "Primary image updated." };
  } catch {
    return { error: "Failed to update." };
  }
}

// ── Availability ─────────────────────────────────────────────────────────────

export async function saveAvailabilityAction(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const tourId      = formData.get("tourId") as string;
  const date        = formData.get("date") as string;
  const startTime   = (formData.get("startTime") as string)?.trim() || null;
  const maxCapacity = parseInt(formData.get("maxCapacity") as string) || 10;
  const priceOvRaw  = formData.get("priceOverride") as string;
  const priceOverride = priceOvRaw ? parseFloat(priceOvRaw) : null;
  const status      = (formData.get("status") as string) || "AVAILABLE";

  if (!tourId || !date) return { error: "Tour and date are required." };

  try {
    await prisma.tourAvailability.upsert({
      where: { tourId_date: { tourId, date: new Date(date) } },
      create: {
        tourId,
        date: new Date(date),
        startTime,
        maxCapacity,
        priceOverride,
        status: status as "AVAILABLE" | "FULL" | "CLOSED" | "CANCELLED",
      },
      update: {
        startTime,
        maxCapacity,
        priceOverride,
        status: status as "AVAILABLE" | "FULL" | "CLOSED" | "CANCELLED",
      },
    });
    revalidatePath(`/admin/tours/${tourId}`);
    return { success: "Availability saved." };
  } catch {
    return { error: "Failed to save availability." };
  }
}

export async function deleteAvailabilityAction(id: string, tourId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await prisma.tourAvailability.delete({ where: { id } });
    revalidatePath(`/admin/tours/${tourId}`);
    return { success: "Availability deleted." };
  } catch {
    return { error: "Failed to delete." };
  }
}
