"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { slugify } from "@/lib/utils";

function clearDestinationsCache() {
  // Next.js 16: revalidateTag requires two arguments.
  // "max" marks entries as stale; they regenerate on next visit (SWR semantics).
  revalidateTag("destinations", "max");
  revalidatePath("/");
  revalidatePath("/admin/destinations");
}

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

// ── Destinations ──────────────────────────────────────────────────────────────

export async function createDestination(name: string) {
  await assertAdmin();
  const slug = slugify(name);
  const max  = await prisma.destination.aggregate({ _max: { order: true } });
  await prisma.destination.create({
    data: { name, slug, order: (max._max.order ?? 0) + 1 },
  });
  clearDestinationsCache();
}

export async function updateDestination(id: string, name: string, isActive: boolean) {
  await assertAdmin();
  await prisma.destination.update({
    where: { id },
    data:  { name, slug: slugify(name), isActive },
  });
  clearDestinationsCache();
}

export async function deleteDestination(id: string) {
  await assertAdmin();
  await prisma.destination.delete({ where: { id } });
  clearDestinationsCache();
}

export async function reorderDestination(id: string, direction: "up" | "down") {
  await assertAdmin();
  const all = await prisma.destination.findMany({ orderBy: { order: "asc" } });
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  await prisma.$transaction([
    prisma.destination.update({ where: { id: all[idx].id }, data: { order: all[swap].order } }),
    prisma.destination.update({ where: { id: all[swap].id }, data: { order: all[idx].order } }),
  ]);
  clearDestinationsCache();
}

// ── Places ────────────────────────────────────────────────────────────────────

export async function createPlace(
  destinationId: string,
  data: { name: string; subtitle?: string; imageUrl?: string; linkQuery?: string }
) {
  await assertAdmin();
  const max = await prisma.place.aggregate({
    where: { destinationId },
    _max:  { order: true },
  });
  await prisma.place.create({
    data: {
      destinationId,
      name:      data.name,
      subtitle:  data.subtitle  || null,
      imageUrl:  data.imageUrl  || null,
      linkQuery: data.linkQuery || data.name,
      order:     (max._max.order ?? 0) + 1,
    },
  });
  clearDestinationsCache();
}

export async function updatePlace(
  id: string,
  data: { name: string; subtitle?: string; imageUrl?: string; linkQuery?: string; isActive: boolean }
) {
  await assertAdmin();
  await prisma.place.update({
    where: { id },
    data: {
      name:      data.name,
      subtitle:  data.subtitle  || null,
      imageUrl:  data.imageUrl  || null,
      linkQuery: data.linkQuery || data.name,
      isActive:  data.isActive,
    },
  });
  clearDestinationsCache();
}

export async function deletePlace(id: string) {
  await assertAdmin();
  await prisma.place.delete({ where: { id } });
  clearDestinationsCache();
}
