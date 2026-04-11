"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X, MapPin, Heart, User, LogIn, LogOut, Bell, HelpCircle, ChevronRight, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_NAME, NAV_LINKS } from "@/lib/constants";
import { signOut } from "next-auth/react";

interface NavbarProps {
  transparent?: boolean;
  isLoggedIn?: boolean;
}

export function Navbar({ transparent = false, isLoggedIn = false }: NavbarProps) {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isWhite ? "bg-primary" : "bg-white/20 backdrop-blur-sm"
            )}>
              <MapPin className={cn("size-4", isWhite ? "text-white" : "text-white")} />
            </div>
            <span className={cn(
              "font-display font-semibold text-lg tracking-tight",
              isWhite ? "text-foreground" : "text-white"
            )}>
              {COMPANY_NAME}
            </span>
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
                
                {/* Active Indicator exactly matching screenshot red line */}
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
