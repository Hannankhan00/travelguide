"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendEmail, wishlistDiscountHtml, dealAlertHtml } from "@/lib/email";
import { COMPANY_NAME, COMPANY_CURRENCY } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export type DiscountResult = { error?: string; success?: string; discountId?: string };

// ── Create discount code ──────────────────────────────────────────────────────

export async function createDiscountCodeAction(data: {
  code:            string;
  description?:    string;
  discountType:    "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue:   number;
  tourId?:         string | null;   // null = applies to all tours
  validFrom:       string;          // ISO date string
  validUntil?:     string | null;
  maxUses?:        number | null;
  minBookingAmount?: number | null;
  isActive?:       boolean;
  notifyWishlist:  boolean;         // email users who wishlisted this tour
  notifySubscribers: boolean;       // email deal subscribers
}): Promise<DiscountResult> {
  await assertAdmin();

  if (!data.code?.trim())    return { error: "Code is required." };
  if (!data.discountValue)   return { error: "Discount value is required." };
  if (data.discountType === "PERCENTAGE" && (data.discountValue <= 0 || data.discountValue > 100)) {
    return { error: "Percentage discount must be between 1 and 100." };
  }

  const existing = await prisma.discountCode.findUnique({ where: { code: data.code.toUpperCase().trim() } });
  if (existing) return { error: "This discount code already exists." };

  let tour = null;
  if (data.tourId) {
    tour = await prisma.tour.findUnique({
      where:   { id: data.tourId },
      select:  { id: true, slug: true, title: true, basePrice: true, shortDescription: true, images: { where: { isPrimary: true }, take: 1 } },
    });
    if (!tour) return { error: "Tour not found." };
  }

  const discount = await prisma.discountCode.create({
    data: {
      code:            data.code.toUpperCase().trim(),
      description:     data.description ?? null,
      discountType:    data.discountType,
      discountValue:   data.discountValue,
      tourId:          data.tourId ?? null,
      validFrom:       new Date(data.validFrom),
      validUntil:      data.validUntil ? new Date(data.validUntil) : null,
      maxUses:         data.maxUses ?? null,
      minBookingAmount: data.minBookingAmount ?? null,
      isActive:        data.isActive ?? true,
    },
  });

  // ── Build shared display values ────────────────────────────────────────────
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const discountLabel = data.discountType === "PERCENTAGE"
    ? `${data.discountValue}% off`
    : `${formatPrice(data.discountValue, COMPANY_CURRENCY)} off`;

  const validUntilStr = data.validUntil
    ? new Date(data.validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : undefined;

  // unsubscribeUrl is built per-recipient below using their email

  // ── Notify wishlist users ──────────────────────────────────────────────────
  if (data.notifyWishlist && tour) {
    const originalPrice = formatPrice(Number(tour.basePrice), COMPANY_CURRENCY);

    // Calculate discounted price for display
    let discountedPriceStr: string | undefined;
    if (data.discountType === "PERCENTAGE") {
      const dp = Number(tour.basePrice) * (1 - data.discountValue / 100);
      discountedPriceStr = formatPrice(dp, COMPANY_CURRENCY);
    } else {
      const dp = Math.max(0, Number(tour.basePrice) - data.discountValue);
      discountedPriceStr = formatPrice(dp, COMPANY_CURRENCY);
    }

    // Find all users who wishlisted this tour and have an email
    const wishlistEntries = await prisma.wishlist.findMany({
      where:   { tourId: tour.id },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const entry of wishlistEntries) {
      const { email, name } = entry.user;
      if (!email) continue;
      try {
        await sendEmail({
          to:      email,
          subject: `${discountLabel} on your wishlisted tour: ${tour.title}`,
          html:    wishlistDiscountHtml({
            customerName:    name ?? "Traveller",
            tourTitle:       tour.title,
            tourSlug:        tour.slug,
            discountCode:    discount.code,
            discountLabel,
            originalPrice,
            discountedPrice: discountedPriceStr,
            validUntil:      validUntilStr,
          }),
        });
        await prisma.emailLog.create({
          data: {
            to:      email,
            subject: `Wishlist price drop: ${tour.title}`,
            type:    "WISHLIST_DISCOUNT",
            status:  "SENT",
            sentAt:  new Date(),
          },
        });
      } catch (err) {
        console.error(`Wishlist email failed for ${email}:`, err);
        await prisma.emailLog.create({
          data: {
            to:      email,
            subject: `Wishlist price drop: ${tour.title}`,
            type:    "WISHLIST_DISCOUNT",
            status:  "FAILED",
            error:   String(err),
          },
        }).catch(() => {});
      }
    }
  }

  // ── Notify deal subscribers ────────────────────────────────────────────────
  if (data.notifySubscribers && tour) {
    const subscribers = await prisma.user.findMany({
      where:  { dealSubscription: true, email: { not: null } },
      select: { email: true, name: true },
    });

    for (const sub of subscribers) {
      if (!sub.email) continue;
      try {
        await sendEmail({
          to:      sub.email,
          subject: `Exclusive deal: ${discountLabel} on ${tour.title} — ${COMPANY_NAME}`,
          html:    dealAlertHtml({
            customerName:     sub.name ?? "Traveller",
            tourTitle:        tour.title,
            tourSlug:         tour.slug,
            discountCode:     discount.code,
            discountLabel,
            originalPrice:    formatPrice(Number(tour.basePrice), COMPANY_CURRENCY),
            validUntil:       validUntilStr,
            shortDescription: tour.shortDescription,
            unsubscribeUrl:   `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(sub.email!)}`,
          }),
        });
        await prisma.emailLog.create({
          data: {
            to:      sub.email,
            subject: `Deal alert: ${tour.title}`,
            type:    "DEAL_ALERT",
            status:  "SENT",
            sentAt:  new Date(),
          },
        });
      } catch (err) {
        console.error(`Deal alert email failed for ${sub.email}:`, err);
      }
    }
  }

  // Discounts are included in the public tours listing and detail pages
  // (both tagged "tours"). Bust the tag so stale pricing never reaches users.
  revalidateTag("tours", "max");
  revalidatePath("/admin/discounts");
  revalidatePath("/admin/tours");
  return { success: "Discount code created.", discountId: discount.id };
}

// ── List discount codes ───────────────────────────────────────────────────────

export async function listDiscountCodesAction() {
  await assertAdmin();
  return prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { tour: { select: { title: true, slug: true } } },
  });
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleDiscountActiveAction(id: string): Promise<DiscountResult> {
  await assertAdmin();
  let wasActive: boolean;
  try {
    const dc = await prisma.discountCode.findUnique({ where: { id }, select: { isActive: true } });
    if (!dc) return { error: "Discount not found." };
    wasActive = dc.isActive;
    await prisma.discountCode.update({ where: { id }, data: { isActive: !dc.isActive } });
  } catch (e) {
    console.error("[toggleDiscountActiveAction]", e);
    return { error: "Failed to update." };
  }

  revalidateTag("tours", "max");
  revalidatePath("/admin/discounts");
  return { success: wasActive ? "Deactivated." : "Activated." };
}

// ── Update discount code ──────────────────────────────────────────────────────

export async function updateDiscountCodeAction(id: string, data: {
  description?:     string;
  discountType:     "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue:    number;
  tourId?:          string | null;
  validFrom:        string;
  validUntil?:      string | null;
  maxUses?:         number | null;
  minBookingAmount?: number | null;
  isActive:         boolean;
}): Promise<DiscountResult> {
  await assertAdmin();

  if (!data.discountValue) return { error: "Discount value is required." };
  if (data.discountType === "PERCENTAGE" && (data.discountValue <= 0 || data.discountValue > 100)) {
    return { error: "Percentage discount must be between 1 and 100." };
  }

  try {
    await prisma.discountCode.update({
      where: { id },
      data: {
        description:      data.description ?? null,
        discountType:     data.discountType,
        discountValue:    data.discountValue,
        tourId:           data.tourId ?? null,
        validFrom:        new Date(data.validFrom),
        validUntil:       data.validUntil ? new Date(data.validUntil) : null,
        maxUses:          data.maxUses ?? null,
        minBookingAmount: data.minBookingAmount ?? null,
        isActive:         data.isActive,
      },
    });
  } catch (e) {
    console.error("[updateDiscountCodeAction]", e);
    return { error: "Failed to update discount code." };
  }

  // Revalidation must run outside the try/catch — these functions use
  // Next.js internal signalling that must not be swallowed by a catch block.
  revalidateTag("tours", "max");
  revalidatePath("/admin/discounts");
  return { success: "Discount code updated." };
}

// ── Delete discount code ──────────────────────────────────────────────────────

export async function deleteDiscountCodeAction(id: string): Promise<DiscountResult> {
  await assertAdmin();
  try {
    await prisma.discountCode.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteDiscountCodeAction]", e);
    return { error: "Failed to delete discount code." };
  }

  revalidateTag("tours", "max");
  revalidatePath("/admin/discounts");
  return { success: "Discount code deleted." };
}
