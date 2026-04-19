"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin, Heart, User, LogIn, LogOut, Bell, HelpCircle, ChevronRight, Ticket, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface DestinationNav {
  id: string;
  name: string;
  places: { id: string; name: string; subtitle: string | null; imageUrl: string | null; linkQuery: string | null }[];
}

interface NavbarProps {
  transparent?: boolean;
  isLoggedIn?: boolean;
  destinations?: DestinationNav[];
}

export function Navbar({ isLoggedIn = false, destinations = [] }: NavbarProps) {
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
                    <button className="flex items-center gap-4 px-5 py-3 hover:bg-[#F2F3FA] transition-colors w-full text-left">
                      <HelpCircle className="size-5" />
                      <span className="text-sm font-semibold">Support</span>
                    </button>
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E7E8EE] animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link
              href="/tours"
              className="px-4 py-2.5 text-sm font-medium text-[#191C20] rounded-lg hover:bg-[#F2F3FA]"
              onClick={() => setMenuOpen(false)}
            >
              Tours
            </Link>

            {destinations.length > 0 && (
              <div className="pt-1">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#185FA5]">Destinations</p>
                {destinations.map((dest) => (
                  <div key={dest.id}>
                    <p className="px-4 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#7A746D]">{dest.name}</p>
                    {dest.places.map((place) => (
                      <Link
                        key={place.id}
                        href={"/tours?q=" + encodeURIComponent(place.linkQuery ?? place.name)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#191C20] hover:bg-[#F2F3FA] rounded-lg"
                      >
                        <MapPin className="size-4 text-[#185FA5] shrink-0" />
                        {place.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-[#E7E8EE] flex flex-col gap-2">
              {isLoggedIn && (
                <Link
                  href="/bookings"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191C20] hover:bg-[#F2F3FA] rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Ticket className="size-5 text-[#7A746D]" /> Bookings
                </Link>
              )}
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191C20] hover:bg-[#F2F3FA] rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Heart className="size-5 text-[#7A746D]" /> Wishlist
              </Link>
              {!isLoggedIn ? (
                <Link
                  href="?auth=login"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#191C20] hover:bg-[#F2F3FA] rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="size-5 text-[#7A746D]" /> Log in or sign up
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2]/50 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="size-5 text-[#DC2626]" /> Log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
