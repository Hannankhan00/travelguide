"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, MapPin, Heart, User, LogIn, LogOut, Bell, HelpCircle, ChevronRight, Ticket, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
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

export function Navbar({ transparent = false, isLoggedIn = false, destinations = [] }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [activeDestId, setActiveDestId] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transparent) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

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

  const isWhite = !transparent || scrolled;

  const activeDest = destinations.find((d) => d.id === activeDestId) ?? destinations[0] ?? null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isWhite
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className={cn(!isWhite && "bg-white/90 backdrop-blur-sm rounded-xl px-2 py-1")}>
              <Image
                src="/asstes/logoo.PNG"
                alt="GoTripJapan"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                  isWhite
                    ? "text-foreground hover:bg-surface hover:text-primary"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Destinations mega-dropdown */}
            {destinations.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    const next = !destOpen;
                    setDestOpen(next);
                    if (next && destinations.length > 0) setActiveDestId(destinations[0].id);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                    isWhite
                      ? "text-foreground hover:bg-surface hover:text-primary"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Globe className="size-4" />
                  Destinations
                  <ChevronDown className={cn("size-3.5 transition-transform duration-150", destOpen && "rotate-180")} />
                </button>
              </div>
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn && (
              <Link href="/bookings" className="group flex flex-col items-center justify-center gap-1 transition-colors relative">
                <Ticket className={cn("size-5.5", isWhite ? "text-[#111111]" : "text-white")} />
                <span className={cn("text-[11px] font-bold tracking-wide", isWhite ? "text-[#111111]" : "text-white")}>
                  Bookings
                </span>
              </Link>
            )}

            <Link href="/wishlist" className="group flex flex-col items-center justify-center gap-1 transition-colors relative">
              <Heart className={cn("size-5.5", isWhite ? "text-[#111111]" : "text-white")} />
              <span className={cn("text-[11px] font-bold tracking-wide", isWhite ? "text-[#111111]" : "text-white")}>
                Wishlist
              </span>
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="group flex flex-col items-center justify-center gap-1 transition-colors relative"
              >
                <User className={cn("size-5.5", isWhite ? "text-[#111111]" : "text-white")} />
                <span className={cn("text-[11px] font-bold tracking-wide", isWhite ? "text-[#111111]" : "text-white")}>
                  Profile
                </span>
                {profileMenuOpen && (
                  <div className="absolute -bottom-2.25 left-0 right-0 h-0.5 bg-[#C41230]" />
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute top-10.5 right-0 w-70 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#E4E0D9] overflow-hidden animate-zoom-in origin-top-right text-[#111111]">
                  <div className="px-5 py-4">
                    <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "var(--font-sans)" }}>Profile</h3>
                  </div>
                  <div className="flex flex-col py-1">
                    {!isLoggedIn ? (
                      <Link
                        href="?auth=login"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8F7F5] transition-colors"
                      >
                        <LogIn className="size-5.5" />
                        <span className="text-[15px] font-semibold">Log in or sign up</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#FEE2E2] hover:text-[#C41230] transition-colors w-full text-left"
                      >
                        <LogOut className="size-5.5" />
                        <span className="text-[15px] font-semibold">Log out</span>
                      </button>
                    )}
                    <div className="h-px bg-[#E4E0D9] mx-5 my-2" />
                    <button className="flex items-center justify-between px-5 py-3 hover:bg-[#F8F7F5] transition-colors w-full text-left">
                      <div className="flex items-center gap-4">
                        <Bell className="size-5.5" />
                        <span className="text-[15px] font-semibold">Updates</span>
                      </div>
                      <ChevronRight className="size-4.5 text-[#A8A29E]" />
                    </button>
                    <div className="h-px bg-[#E4E0D9] mx-5 my-2" />
                    <button className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8F7F5] transition-colors w-full text-left">
                      <HelpCircle className="size-5.5" />
                      <span className="text-[15px] font-semibold">Support</span>
                    </button>
                  </div>
                  <div className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              isWhite ? "text-foreground hover:bg-surface" : "text-white hover:bg-white/10"
            )}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mega dropdown — rendered outside the nav flow to avoid stacking context issues */}
      {destOpen && destinations.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ top: 72 }}
            onClick={() => setDestOpen(false)}
          />
          {/* Panel */}
          <div
            className="fixed left-0 right-0 z-50 bg-white border-b border-[#E4E0D9]"
            style={{ top: 72, boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)" }}
          >
            <div className="max-w-7xl mx-auto flex" style={{ minHeight: 340 }}>
              {/* Left tabs */}
              <div className="w-52 shrink-0 border-r border-[#E4E0D9] py-4">
                <p className="px-5 pb-3 text-[10px] font-bold uppercase tracking-widest text-[#C41230]">
                  Top attractions
                </p>
                {destinations.map((dest) => (
                  <button
                    key={dest.id}
                    onMouseEnter={() => setActiveDestId(dest.id)}
                    onClick={() => setActiveDestId(dest.id)}
                    className={cn(
                      "w-full text-left px-5 py-2.5 text-sm font-medium transition-colors",
                      (activeDestId ?? destinations[0]?.id) === dest.id
                        ? "text-[#C41230] font-semibold bg-[#FFF5F6]"
                        : "text-[#333] hover:bg-[#F8F7F5]"
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
                        className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[#F8F7F5] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-md shrink-0 overflow-hidden bg-[#E4E0D9]">
                          {place.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="size-4 text-[#A8A29E]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111] leading-snug group-hover:text-[#C41230] transition-colors truncate">
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
        <div className="md:hidden bg-white border-t border-border animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-surface"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {destinations.length > 0 && (
              <div className="pt-1">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C41230]">Destinations</p>
                {destinations.map((dest) => (
                  <div key={dest.id}>
                    <p className="px-4 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#7A746D]">{dest.name}</p>
                    {dest.places.map((place) => (
                      <Link
                        key={place.id}
                        href={"/tours?q=" + encodeURIComponent(place.linkQuery ?? place.name)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface rounded-lg"
                      >
                        <MapPin className="size-4 text-[#C41230] shrink-0" />
                        {place.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-border flex flex-col gap-2">
              {isLoggedIn && (
                <Link
                  href="/bookings"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Ticket className="size-5 text-muted" /> Bookings
                </Link>
              )}
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Heart className="size-5 text-muted" /> Wishlist
              </Link>
              {!isLoggedIn ? (
                <Link
                  href="?auth=login"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn className="size-5 text-muted" /> Log in or sign up
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-error hover:bg-error-light/50 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="size-5 text-error" /> Log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
