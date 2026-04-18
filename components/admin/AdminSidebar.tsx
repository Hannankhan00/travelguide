"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Map,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronsLeft,
  X,
  Globe,
  UserCheck,
  Tag,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOutAction } from "@/app/(admin)/admin/actions";

const navItems = [
  { label: "Dashboard",    href: "/admin",                icon: LayoutDashboard },
  { label: "Bookings",     href: "/admin/bookings",       icon: CalendarCheck   },
  { label: "Tours",        href: "/admin/tours",          icon: Map             },
  { label: "Destinations", href: "/admin/destinations",   icon: Globe           },
  { label: "Customers",    href: "/admin/customers",      icon: UserCheck       },
  { label: "Users",        href: "/admin/users",          icon: Users           },
  { label: "Discounts",    href: "/admin/discounts",      icon: Tag             },
  { label: "Analytics",    href: "/admin/analytics",      icon: BarChart3       },
  { label: "Chat",         href: "/admin/chat",           icon: MessageSquare   },
  { label: "Settings",     href: "/admin/settings",       icon: Settings        },
];

interface AdminSidebarProps {
  collapsed:     boolean;
  mobileOpen:    boolean;
  onMobileClose: () => void;
  onToggle:      () => void;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggle,
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-[#1B2847] text-white transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-17" : "w-60"
        )}
      >
        <SidebarInner
          collapsed={collapsed}
          onToggle={onToggle}
          isActive={isActive}
          user={user}
        />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-30 flex flex-col w-60 bg-[#1B2847] text-white",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-3 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarInner
          collapsed={false}
          onToggle={() => {}}
          isActive={isActive}
          user={user}
        />
      </aside>
    </>
  );
}

function SidebarInner({
  collapsed,
  onToggle,
  isActive,
  user,
}: {
  collapsed: boolean;
  onToggle:  () => void;
  isActive:  (href: string) => boolean;
  user:      { name?: string | null; email?: string | null; image?: string | null };
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className={cn("flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0", collapsed && "justify-center px-0")}>
        {/* Japan torii gate icon (SVG mark) */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-[#C41230] flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xs">GT</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">GoTripJapan</p>
            <p className="text-[10px] text-white/50 leading-tight">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150 group",
              isActive(href)
                ? "bg-white/10 text-white border-l-2 border-[#C41230] pl-2.25"
                : "text-white/60 hover:text-white hover:bg-white/8",
              collapsed && "justify-center px-0 border-l-0 pl-0 w-10 mx-auto"
            )}
          >
            <Icon className={cn("shrink-0 w-4.5 h-4.5", isActive(href) ? "text-[#C41230]" : "text-white/60 group-hover:text-white")} size={18} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#C41230] flex items-center justify-center text-xs font-semibold text-white">
              {getInitials(user.name ?? user.email ?? "A")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate leading-tight">{user.name ?? "Admin"}</p>
              <p className="text-[10px] text-white/50 truncate leading-tight">{user.email}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors",
              collapsed && "justify-center px-0 w-10 mx-auto"
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </form>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className={cn(
            "hidden lg:flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors",
            collapsed && "justify-center px-0 w-10 mx-auto"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronLeft size={14} className="rotate-180" />
          ) : (
            <>
              <ChevronsLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
