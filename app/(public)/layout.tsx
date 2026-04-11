import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { AuthModal } from "@/components/public/AuthModal";
import { auth } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <Navbar isLoggedIn={!!session?.user} />
      <main className="flex-1">{children}</main>
      <Footer />
      <AuthModal />
    </>
  );
}
