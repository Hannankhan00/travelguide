"use server";

import crypto from "crypto";
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
    // Check if entry exists using raw SQL
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Wishlist 
      WHERE userId = ${userId} AND tourId = ${tourId} 
      LIMIT 1
    `;

    if (existing.length > 0) {
      // Delete using raw SQL
      await prisma.$executeRaw`
        DELETE FROM Wishlist 
        WHERE userId = ${userId} AND tourId = ${tourId}
      `;
      revalidatePath("/wishlist");
      return { success: true, added: false };
    } else {
      // Create using raw SQL
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO Wishlist (id, userId, tourId, createdAt)
        VALUES (${id}, ${userId}, ${tourId}, ${new Date()})
      `;
      revalidatePath("/wishlist");
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Wishlist runtime error (Direct DB):", error);
    return { error: "Failed to update wishlist. Database sync in progress." };
  }
}
