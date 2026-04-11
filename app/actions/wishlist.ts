"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(tourId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in to manage your wishlist." };
  }

  const userId = session.user.id;

  try {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_tourId: { userId, tourId }
      }
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          userId_tourId: { userId, tourId }
        }
      });
      revalidatePath("/wishlist");
      revalidatePath(`/tours/[slug]`, "page");
      return { success: true, added: false };
    } else {
      await prisma.wishlist.create({
        data: { userId, tourId }
      });
      revalidatePath("/wishlist");
      revalidatePath(`/tours/[slug]`, "page");
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Wishlist error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
