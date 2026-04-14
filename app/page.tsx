import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { AuthModal } from "@/components/public/AuthModal";
import { HeroSection } from "@/components/public/HeroSection";
import { DestinationsSection } from "@/components/public/DestinationsSection";
import { FeaturedToursSection } from "@/components/public/FeaturedToursSection";
import { ExperienceSection } from "@/components/public/ExperienceSection";
import { WhyUsSection } from "@/components/public/WhyUsSection";
import { PlacesToSee } from "@/components/public/PlacesToSee";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const [session, destinations] = await Promise.all([
    auth(),
    prisma.destination.findMany({
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
  ]);

  return (
    <>
      <Navbar transparent isLoggedIn={!!session?.user} destinations={destinations} />
      <main>
        <HeroSection />
        <DestinationsSection />
        <FeaturedToursSection />
        <PlacesToSee destinations={destinations} />
        <ExperienceSection />
        <WhyUsSection />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
