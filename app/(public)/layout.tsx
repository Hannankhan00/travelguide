export const dynamic = "force-dynamic";

import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { AuthModal } from "@/components/public/AuthModal";
import { CookieConsent } from "@/components/public/CookieConsent";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache destinations for 1 hour — they rarely change and are queried on every page
const getCachedDestinations = unstable_cache(
  async () => prisma.destination.findMany({
    where:   { isActive: true },
    orderBy: { order: "asc" },
    include: {
      places: {
        where:   { isActive: true },
        orderBy: { order: "asc" },
        select:  { id: true, name: true, subtitle: true, imageUrl: true, linkQuery: true },
      },
    },
  }),
  ["public-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in PublicLayout:", e);
  }

  const destinations = await getCachedDestinations().catch((e) => {
    console.error("Destinations query error in PublicLayout:", e);
    return [];
  });

  return (
    <>
      <Navbar isLoggedIn={!!session?.user} destinations={destinations} />
      <main className="flex-1">{children}</main>
      <Footer />
      <AuthModal />
      <CookieConsent />
    </>
  );
}
