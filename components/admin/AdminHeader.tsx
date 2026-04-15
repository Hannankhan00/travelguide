"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, Search, ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const breadcrumbLabels: Record<string, string> = {
  admin:     "Dashboard",
  bookings:  "Bookings",
  tours:     "Tours",
  users:     "Users",
  analytics: "Analytics",
  chat:      "Chat",
  settings:  "Settings",
};

interface AdminHeaderProps {
  onMobileMenuClick: () => void;
  user: { name?: string | null; email?: string | null };
}

export function AdminHeader({ onMobileMenuClick, user }: AdminHeaderProps) {
  const pathname = usePathname();

  // Build breadcrumbs from pathname segments
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href:  "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Dashboard";

  return (
    <header className="shrink-0 h-16 bg-white border-b border-[#E4E0D9] flex items-center gap-4 px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 rounded-lg text-[#7A746D] hover:text-[#111111] hover:bg-[#F8F7F5] transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs / page title */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {crumbs.length > 1 ? (
          <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E] shrink-0" />}
                {crumb.isLast ? (
                  <span className="font-semibold text-[#111111] truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[#7A746D] hover:text-[#111111] transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-lg font-semibold text-[#111111]">{pageTitle}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search (hidden on small screens) */}
        <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-[#F8F7F5] border border-[#E4E0D9] text-sm text-[#A8A29E] cursor-pointer hover:bg-[#F1EFE9] transition-colors min-w-50">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Search…</span>
          <kbd className="ml-auto text-[10px] font-mono bg-white border border-[#E4E0D9] rounded px-1 py-0.5 text-[#A8A29E]">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[#7A746D] hover:text-[#111111] hover:bg-[#F8F7F5] transition-colors">
          <Bell className="w-5 h-5" />
          {/* Dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C41230] ring-2 ring-white" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E4E0D9]">
          <div className="w-8 h-8 rounded-full bg-[#1B2847] flex items-center justify-center text-xs font-semibold text-white select-none">
            {getInitials(user.name ?? user.email ?? "A")}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-xs font-semibold text-[#111111] truncate leading-tight">{user.name ?? "Admin"}</p>
            <p className="text-[10px] text-[#7A746D] truncate leading-tight">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
