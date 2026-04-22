"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Star, StarOff,
  Map, Clock, Users, CheckCircle2, Archive, FileText,
  Globe, EyeOff, Copy
} from "lucide-react";
import { formatPrice, getInitials } from "@/lib/utils";
import { TOUR_CATEGORIES } from "@/lib/constants";
import { deleteTourAction, toggleTourStatusAction, toggleFeaturedAction, duplicateTourAction } from "./actions";

type TourRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  basePrice: unknown;
  duration: number;
  maxGroupSize: number;
  rating: unknown;
  reviewCount: number;
  createdAt: Date;
  images: { url: string }[];
  _count: { bookings: number; availability: number };
};

const statusConfig = {
  DRAFT:     { label: "Draft",     color: "bg-[#FEF3C7] text-[#B45309]",   icon: FileText     },
  PUBLISHED: { label: "Published", color: "bg-[#DCFCE7] text-[#15803D]",   icon: Globe         },
  ARCHIVED:  { label: "Archived",  color: "bg-[#F1EFE9] text-[#7A746D]",   icon: Archive       },
} as const;

export function ToursClient({ tours }: { tours: TourRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, categoryFilter]);

  const filtered = tours.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedTours = filtered.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  const counts = {
    all:       tours.length,
    draft:     tours.filter((t) => t.status === "DRAFT").length,
    published: tours.filter((t) => t.status === "PUBLISHED").length,
    archived:  tours.filter((t) => t.status === "ARCHIVED").length,
  };

  function handleAction(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
      setOpenMenu(null);
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Tours</h1>
          <p className="text-sm text-[#7A746D] mt-0.5">
            Create and manage your tour catalogue.
          </p>
        </div>
        <Link
          href="/admin/tours/new"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#C41230] text-white text-sm font-semibold hover:bg-[#A00E25] active:scale-[0.98] transition-all shadow-sm shrink-0"
        >
          <Plus size={15} />
          New Tour
        </Link>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((key) => {
          const count = key === "ALL" ? counts.all : counts[key.toLowerCase() as keyof typeof counts];
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-[#1B2847] text-white border-[#1B2847]"
                  : "bg-white text-[#7A746D] border-[#E4E0D9] hover:border-[#1B2847] hover:text-[#111]"
              }`}
            >
              {key === "ALL" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E4E0D9] flex-wrap">
          <div className="relative flex-1 min-w-50 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tours…"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E4E0D9] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-colors"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E4E0D9] text-sm text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]"
          >
            <option value="ALL">All categories</option>
            {TOUR_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-xs text-[#7A746D] ml-auto">
            {filtered.length} {filtered.length === 1 ? "tour" : "tours"}
          </p>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Map className="w-8 h-8 text-[#E4E0D9] mx-auto mb-3" />
            <p className="text-sm text-[#A8A29E]">
              {query || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "No tours match your filters."
                : "No tours yet. Create your first tour to get started."}
            </p>
            {!query && statusFilter === "ALL" && categoryFilter === "ALL" && (
              <Link
                href="/admin/tours/new"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#C41230] font-medium hover:underline"
              >
                <Plus size={14} /> Create tour
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D9] bg-[#F8F7F5]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Tour</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Duration</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Bookings</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#7A746D] uppercase tracking-wide w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D9]">
                {paginatedTours.map((tour) => {
                  const cfg = statusConfig[tour.status];
                  const CfgIcon = cfg.icon;
                  const catLabel = TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label ?? tour.category;

                  return (
                    <tr key={tour.id} className="hover:bg-[#F8F7F5] transition-colors group">
                      {/* Tour info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="shrink-0 w-12 h-12 rounded-lg bg-[#F1EFE9] flex items-center justify-center overflow-hidden"
                          >
                            {tour.images[0] ? (
                              <img
                                src={tour.images[0].url}
                                alt={tour.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Map className="w-5 h-5 text-[#C8C4BB]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/tours/${tour.id}`}
                                className="font-medium text-[#111] hover:text-[#C41230] transition-colors truncate max-w-70 block"
                              >
                                {tour.title}
                              </Link>
                              {tour.featured && (
                                <Star size={12} className="text-[#C8A84B] fill-[#C8A84B] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[#7A746D] truncate">{tour.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-[#7A746D]">{catLabel}</span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-medium text-[#111]">
                        {formatPrice(Number(tour.basePrice), "USD")}
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 text-[#7A746D] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {tour.duration} {tour.duration === 1 ? "day" : "days"}
                        </span>
                      </td>

                      {/* Bookings */}
                      <td className="px-5 py-3.5">
                        {tour._count.bookings > 0 ? (
                          <span className="font-medium text-[#111]">{tour._count.bookings}</span>
                        ) : (
                          <span className="text-[#A8A29E]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <CfgIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === tour.id ? null : tour.id)}
                            className="p-1.5 rounded-lg text-[#7A746D] hover:text-[#111] hover:bg-[#F1EFE9] transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openMenu === tour.id && (
                            <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl border border-[#E4E0D9] shadow-xl py-1 animate-fade-in">
                              <Link
                                href={`/admin/tours/${tour.id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#111] hover:bg-[#F8F7F5]"
                                onClick={() => setOpenMenu(null)}
                              >
                                <Pencil size={14} /> Edit
                              </Link>
                              <Link
                                href={`/tours/${tour.slug}`}
                                target="_blank"
                                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#111] hover:bg-[#F8F7F5]"
                                onClick={() => setOpenMenu(null)}
                              >
                                <Eye size={14} /> View on site
                              </Link>
                              <button
                                onClick={() => handleAction(() => toggleFeaturedAction(tour.id))}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#111] hover:bg-[#F8F7F5] text-left"
                              >
                                {tour.featured ? <StarOff size={14} /> : <Star size={14} />}
                                {tour.featured ? "Remove featured" : "Set as featured"}
                              </button>
                              <button
                                onClick={() => handleAction(() => duplicateTourAction(tour.id))}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#111] hover:bg-[#F8F7F5] text-left"
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              <div className="h-px bg-[#E4E0D9] my-1" />
                              {tour.status !== "PUBLISHED" && (
                                <button
                                  onClick={() => handleAction(() => toggleTourStatusAction(tour.id, "PUBLISHED"))}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#15803D] hover:bg-[#F8F7F5] text-left"
                                >
                                  <CheckCircle2 size={14} /> Publish
                                </button>
                              )}
                              {tour.status !== "DRAFT" && (
                                <button
                                  onClick={() => handleAction(() => toggleTourStatusAction(tour.id, "DRAFT"))}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#B45309] hover:bg-[#F8F7F5] text-left"
                                >
                                  <EyeOff size={14} /> Unpublish
                                </button>
                              )}
                              {tour.status !== "ARCHIVED" && (
                                <button
                                  onClick={() => handleAction(() => toggleTourStatusAction(tour.id, "ARCHIVED"))}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#7A746D] hover:bg-[#F8F7F5] text-left"
                                >
                                  <Archive size={14} /> Archive
                                </button>
                              )}
                              <div className="h-px bg-[#E4E0D9] my-1" />
                              <button
                                onClick={() => {
                                  if (confirm("Delete this tour permanently? This cannot be undone.")) {
                                    handleAction(() => deleteTourAction(tour.id));
                                  }
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] text-left"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-[#E4E0D9] bg-white">
                <span className="text-xs text-[#7A746D]">
                  Showing {(validPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(validPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} tours
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar pb-1 sm:pb-0">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={validPage === 1}
                    className="px-3 py-1.5 rounded border border-[#E4E0D9] text-sm text-[#555] disabled:opacity-50 hover:bg-[#F8F7F5] transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (totalPages > 7 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - validPage) > 1) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className="px-2 text-[#A8A29E]">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded text-sm transition-colors ${
                          pageNum === validPage 
                            ? "bg-[#1B2847] text-white border border-[#1B2847]" 
                            : "border border-[#E4E0D9] text-[#555] hover:bg-[#F8F7F5]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={validPage === totalPages}
                    className="px-3 py-1.5 rounded border border-[#E4E0D9] text-sm text-[#555] disabled:opacity-50 hover:bg-[#F8F7F5] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
