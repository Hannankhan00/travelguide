"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export type ReviewResult = {
  error?: string;
  success?: string;
};

export async function submitReviewAction(formData: FormData): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to submit a review." };
  }

  const tourId  = formData.get("tourId") as string;
  const rating  = parseInt(formData.get("rating") as string);
  const message = (formData.get("message") as string)?.trim();

  if (!tourId || !rating || !message) {
    return { error: "Please fill in all required fields (rating and message)." };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  if (message.length < 10) {
    return { error: "Review message must be at least 10 characters." };
  }

  // Check if user already reviewed this tour
  const existing = await prisma.review.findUnique({
    where: { tourId_userId: { tourId, userId: session.user.id } },
  });

  if (existing) {
    return { error: "You have already reviewed this tour." };
  }

  // Optional photo URL (placeholder for cloud upload)
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;

  try {
    await prisma.review.create({
      data: {
        tourId,
        userId: session.user.id,
        rating,
        message,
        photoUrl,
      },
    });

    // Update tour's aggregate rating and review count
    const stats = await prisma.review.aggregate({
      where: { tourId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.tour.update({
      where: { id: tourId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.id,
      },
    });

    // Get tour slug so we can revalidate the correct path
    const tour = await prisma.tour.findUnique({ where: { id: tourId }, select: { slug: true } });
    if (tour) {
      // revalidatePath alone does NOT bust unstable_cache entries — we must
      // also call revalidateTag so the cached tour detail and homepage reviews
      // are regenerated immediately rather than waiting for their TTL.
      revalidateTag("tours", "max");    // busts getCachedTourBySlug (embeds reviews)
      revalidateTag("reviews", "max");  // busts getCachedHomeReviews on the homepage
      revalidatePath(`/tours/${tour.slug}`);
    }
    revalidatePath("/tours");

    return { success: "Your review has been submitted!" };
  } catch (err: any) {
    console.error("Review submission error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
