"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin, Heart, User, LogIn, LogOut, Bell, HelpCircle, ChevronRight, Ticket, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

interface DestinationNav {
  id: string;
  name: string;
  places: { id: string; name: string; subtitle: string | null; imageUrl: string | null; linkQuery: string | null }[];
}

interface NavbarProps {
  transparent?: boolean;
  destinations?: DestinationNav[];
}

export function Navbar({ destinations = [] }: NavbarProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [activeDestId, setActiveDestId] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const activeDest = destinations.find((d) => d.id === activeDestId) ?? destinations[0] ?? null;
  const isToursActive = pathname?.startsWith("/tours");

  return (
    <>
      <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/98 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "bg-white border-b border-[#E4E0D9]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/asstes/logoo.PNG"
              alt="GoTripJapan"
              width={200}
              height={50}
              sizes="200px"
              quality={85}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop tab nav */}
          <nav className="hidden md:flex items-center gap-0 ml-8">
            {/* Destinations tab */}
            <div className="relative">
              <button
                onClick={() => {
                  const next = !destOpen;
                  setDestOpen(next);
                  if (next && destinations.length > 0) setActiveDestId(destinations[0].id);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-2 transition-all duration-150",
                  destOpen
                    ? "text-[#185FA5] border-[#185FA5]"
                    : "text-[#444] border-transparent hover:text-[#185FA5]"
                )}
                style={{ marginBottom: -1 }}
              >
                Destinations
                <ChevronDown className={cn("size-3.5 transition-transform duration-150", destOpen && "rotate-180")} />
              </button>
            </div>

            {/* Tours tab */}
            <Link
              href="/tours"
              className={cn(
                "px-4 py-2 text-[13px] font-medium border-b-2 transition-all duration-150",
                isToursActive
                  ? "text-[#185FA5] border-[#185FA5]"
                  : "text-[#444] border-transparent hover:text-[#185FA5]"
              )}
              style={{ marginBottom: -1 }}
            >
              Tours
            </Link>
          </nav>

          {/* Desktop right icons */}
          <div className="hidden md:flex items-center gap-5">
            {isLoggedIn && (
              <Link href="/bookings" className="group flex flex-col items-center justify-center gap-0.5 transition-colors">
                <Ticket className="size-5 text-[#191C20] group-hover:text-[#185FA5] transition-colors" />
                <span className="text-[10px] font-semibold text-[#191C20] group-hover:text-[#185FA5] tracking-wide transition-colors">
                  Bookings
                </span>
              </Link>
            )}

            <Link href="/wishlist" className="group flex flex-col items-center justify-center gap-0.5 transition-colors">
              <Heart className="size-5 text-[#191C20] group-hover:text-[#185FA5] transition-colors" />
              <span className="text-[10px] font-semibold text-[#191C20] group-hover:text-[#185FA5] tracking-wide transition-colors">
                Wishlist
              </span>
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="group flex flex-col items-center justify-center gap-0.5 transition-colors"
              >
                <User className="size-5 text-[#191C20] group-hover:text-[#185FA5] transition-colors" />
                <span className="text-[10px] font-semibold text-[#191C20] group-hover:text-[#185FA5] tracking-wide transition-colors">
                  Profile
                </span>
                {profileMenuOpen && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#185FA5] rounded-full" />
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute top-11 right-0 w-72 bg-white rounded-2xl shadow-[0_12px_40px_rgba(25,28,32,0.08)] overflow-hidden animate-zoom-in origin-top-right text-[#191C20]">
                  <div className="px-5 py-4">
                    <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-sans)" }}>Profile</h3>
                  </div>
                  <div className="flex flex-col py-1">
                    {!isLoggedIn ? (
                      <Link
                        href="?auth=login"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#F2F3FA] transition-colors"
                      >
                        <LogIn className="size-5" />
                        <span className="text-sm font-semibold">Log in or sign up</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors w-full text-left"
                      >
                        <LogOut className="size-5" />
                        <span className="text-sm font-semibold">Log out</span>
                      </button>
                    )}
                    <div className="h-px bg-[#E7E8EE] mx-5 my-2" />
                    <button className="flex items-center justify-between px-5 py-3 hover:bg-[#F2F3FA] transition-colors w-full text-left">
                      <div className="flex items-center gap-4">
                        <Bell className="size-5" />
                        <span className="text-sm font-semibold">Updates</span>
                      </div>
                      <ChevronRight className="size-4 text-[#A8A29E]" />
                    </button>
                    <div className="h-px bg-[#E7E8EE] mx-5 my-2" />
                    <Link 
                      href="/contact"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-[#F2F3FA] transition-colors w-full text-left"
                    >
                      <HelpCircle className="size-5" />
                      <span className="text-sm font-semibold">Support</span>
                    </Link>
                  </div>
                  <div className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[#191C20] hover:bg-[#F2F3FA] transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      </header>

      {/* Mega dropdown */}
      {destOpen && destinations.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ top: 56 }}
            onClick={() => setDestOpen(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 bg-white"
            style={{ top: 56, boxShadow: "0 12px 40px -4px rgba(25,28,32,0.08)" }}
          >
            <div className="max-w-7xl mx-auto flex" style={{ minHeight: 340 }}>
              {/* Left tabs */}
              <div className="w-52 shrink-0 border-r border-[#E7E8EE] py-4">
                <p className="px-5 pb-3 text-[10px] font-bold uppercase tracking-widest text-[#185FA5]">
                  Top destinations
                </p>
                {destinations.map((dest) => (
                  <button
                    key={dest.id}
                    onMouseEnter={() => setActiveDestId(dest.id)}
                    onClick={() => setActiveDestId(dest.id)}
                    className={cn(
                      "w-full text-left px-5 py-2.5 text-sm font-medium transition-colors",
                      (activeDestId ?? destinations[0]?.id) === dest.id
                        ? "text-[#185FA5] font-semibold bg-[#E6F1FB]"
                        : "text-[#191C20] hover:bg-[#F2F3FA]"
                    )}
                  >
                    {dest.name}
                  </button>
                ))}
              </div>

              {/* Right: places grid */}
              <div className="flex-1 py-6 px-8 overflow-y-auto" style={{ maxHeight: 480 }}>
                {activeDest && (
                  <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                    {activeDest.places.map((place) => (
                      <Link
                        key={place.id}
                        href={"/tours?q=" + encodeURIComponent(place.linkQuery ?? place.name)}
                        onClick={() => setDestOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-[#F2F3FA] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-[#E7E8EE]">
                          {place.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={place.imageUrl} alt={place.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="size-4 text-[#A8A29E]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#191C20] leading-snug group-hover:text-[#185FA5] transition-colors truncate">
                            {place.name}
                          </p>
                          {place.subtitle && (
                            <p className="text-xs text-[#7A746D] truncate leading-snug mt-0.5">{place.subtitle}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          style={{ top: 0 }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 right-0 bottom-0 z-60 w-[82vw] max-w-[320px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E8EE]">
          <Image
            src="/asstes/logoo.PNG"
            alt="GoTripJapan"
            width={140}
            height={36}
            sizes="140px"
            quality={85}
            className="h-9 w-auto object-contain"
          />
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F3FA] hover:bg-[#E7E8EE] transition-colors"
          >
            <X className="size-4 text-[#191C20]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Account section */}
          <div className="px-4 py-4 border-b border-[#E7E8EE]">
            {!isLoggedIn ? (
              <Link
                href="?auth=login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 w-full bg-[#C41230] hover:bg-[#A00F27] text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
              >
                <LogIn className="size-4 shrink-0" />
                Log in or sign up
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-[#1B2847] flex items-center justify-center shrink-0">
                  <User className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#191C20]">My Account</p>
                  <p className="text-xs text-[#7A746D]">Manage your trips</p>
                </div>
              </div>
            )}
          </div>

          {/* My trips group */}
          {isLoggedIn && (
            <div className="px-4 py-3 border-b border-[#E7E8EE]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A746D] px-2 mb-2">My Trips</p>
              <Link
                href="/bookings"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors",
                  pathname === "/bookings" ? "bg-[#E6F1FB] text-[#185FA5]" : "text-[#191C20] hover:bg-[#F2F3FA]"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center shrink-0">
                  <Ticket className="size-4 text-[#185FA5]" />
                </div>
                Bookings
                <ChevronRight className="size-4 text-[#A8A29E] ml-auto" />
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors",
                  pathname === "/wishlist" ? "bg-[#FFF1F3] text-[#C41230]" : "text-[#191C20] hover:bg-[#F2F3FA]"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFF1F3] flex items-center justify-center shrink-0">
                  <Heart className="size-4 text-[#C41230]" />
                </div>
                Wishlist
                <ChevronRight className="size-4 text-[#A8A29E] ml-auto" />
              </Link>
            </div>
          )}

          {/* Wishlist for guests */}
          {!isLoggedIn && (
            <div className="px-4 py-3 border-b border-[#E7E8EE]">
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors",
                  pathname === "/wishlist" ? "bg-[#FFF1F3] text-[#C41230]" : "text-[#191C20] hover:bg-[#F2F3FA]"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFF1F3] flex items-center justify-center shrink-0">
                  <Heart className="size-4 text-[#C41230]" />
                </div>
                Wishlist
                <ChevronRight className="size-4 text-[#A8A29E] ml-auto" />
              </Link>
            </div>
          )}

          {/* Explore group */}
          <div className="px-4 py-3 border-b border-[#E7E8EE]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A746D] px-2 mb-2">Explore</p>
            <Link
              href="/tours"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors",
                isToursActive ? "bg-[#E6F1FB] text-[#185FA5]" : "text-[#191C20] hover:bg-[#F2F3FA]"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center shrink-0">
                <MapPin className="size-4 text-[#185FA5]" />
              </div>
              All Tours
              <ChevronRight className="size-4 text-[#A8A29E] ml-auto" />
            </Link>
          </div>

          {/* Destinations group */}
          {destinations.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A746D] px-2 mb-2">Destinations</p>
              {destinations.map((dest) => (
                <div key={dest.id} className="mb-3">
                  <p className="px-3 pb-1 text-[11px] font-bold text-[#1B2847] uppercase tracking-wider">{dest.name}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {dest.places.slice(0, 6).map((place) => (
                      <Link
                        key={place.id}
                        href={"/tours?q=" + encodeURIComponent(place.linkQuery ?? place.name)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#191C20] hover:bg-[#F2F3FA] rounded-lg transition-colors"
                      >
                        <div className="w-6 h-6 rounded overflow-hidden shrink-0 bg-[#E7E8EE]">
                          {place.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                          ) : (
                            <MapPin className="size-3 text-[#A8A29E] m-auto" />
                          )}
                        </div>
                        <span className="text-xs font-medium truncate">{place.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="border-t border-[#E7E8EE] px-4 py-4">
          {isLoggedIn ? (
            <button
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
            >
              <LogOut className="size-4 shrink-0" />
              Log out
            </button>
          ) : (
            <p className="text-xs text-center text-[#7A746D]">
              <Link href="/tours" onClick={() => setMenuOpen(false)} className="text-[#185FA5] font-semibold hover:underline">Browse tours</Link>
              {" "}to start planning your Japan trip.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
