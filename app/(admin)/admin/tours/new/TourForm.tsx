"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Check, Save, MapPin, FileText,
  Route, Truck, DollarSign, Image as ImageIcon, Search as SearchIcon,
  Plus, X, AlertCircle, Upload, Loader2
} from "lucide-react";
import { slugify } from "@/lib/utils";
import { TOUR_CATEGORIES } from "@/lib/constants";
import { LocationPicker } from "@/components/admin/LocationPicker";
import { saveTourAction, addTourImageAction, type ActionResult } from "../actions";

// ── Types ────────────────────────────────────────────────────────────────────

type ItineraryStop = {
  order:       number;
  title:       string;
  description: string;
  stayMinutes: string;   // e.g. "30", "90", "120"
  isOptional:  boolean;
};

export type PriceTier = {
  minGuests: string;
  maxGuests: string;
  pricePerPerson: string;
};

type TourData = {
  tourId?:          string;
  tourType:         "SOLO" | "GROUP";
  baseGroupSize:    string;
  title:            string;
  slug:             string;
  category:         string;
  difficulty:       string;
  location:         string;
  prefecture:       string;
  country:          string;
  countryCode:      string;
  stateCode:        string;
  shortDescription: string;
  description:      string;
  highlights:       string[];
  itinerary:        ItineraryStop[];
  meetingPoint:     string;
  endPoint:         string;
  duration:         string;
  durationType:     string;  // "hours" | "days"
  maxGroupSize:     string;
  minGroupSize:     string;
  dailyCapacity:    string;
  languages:        string[];
  serviceProvider:  string;
  basePrice:        string;
  childPrice:       string;
  priceTiers:       PriceTier[];
  includes:         string[];
  excludes:         string[];
  importantInfo:    string[];
  coverImage:       string;
  galleryImages:    string[];
  metaTitle:        string;
  metaDescription:  string;
  featured:         boolean;
  likelyToSellOut:  boolean;
  status:           string;
};

const STEPS = [
  { id: "basics",      label: "Basics",      icon: MapPin     },
  { id: "description", label: "Description", icon: FileText   },
  { id: "media",       label: "Media",       icon: ImageIcon  },
  { id: "itinerary",   label: "Itinerary",   icon: Route      },
  { id: "logistics",   label: "Logistics",   icon: Truck      },
  { id: "pricing",     label: "Pricing",     icon: DollarSign },
  { id: "seo",         label: "SEO & Status", icon: SearchIcon },
] as const;


const DEFAULT_DATA: TourData = {
  tourType: "GROUP", baseGroupSize: "4",
  title: "", slug: "", category: "CULTURAL", difficulty: "MODERATE",
  location: "", prefecture: "", country: "", countryCode: "", stateCode: "",
  shortDescription: "", description: "", highlights: [""],
  itinerary: [{ order: 1, title: "", description: "", stayMinutes: "30", isOptional: false }],
  meetingPoint: "", endPoint: "", duration: "1", durationType: "days", maxGroupSize: "10",
  minGroupSize: "1", dailyCapacity: "10", languages: ["English"], serviceProvider: "",
  basePrice: "", childPrice: "", priceTiers: [], includes: [""], excludes: [""], importantInfo: [""],
  coverImage: "", galleryImages: ["", "", "", ""],
  metaTitle: "", metaDescription: "", featured: false, likelyToSellOut: false, status: "DRAFT",
};

// ── Component ────────────────────────────────────────────────────────────────

interface TourFormProps {
  initialData?: Partial<TourData>;
}

export function TourForm({ initialData }: TourFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TourData>({ ...DEFAULT_DATA, ...initialData });
  const [result, setResult] = useState<ActionResult>({});
  const [langInput, setLangInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Upload helper ─────────────────────────
  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) { alert(json.error ?? "Upload failed."); return null; }
    return json.url as string;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file);
    if (url) update("coverImage", url);
    setUploadingCover(false);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(index);
    const url = await uploadFile(file);
    if (url) {
      const next = [...data.galleryImages];
      next[index] = url;
      update("galleryImages", next);
    }
    setUploadingSlot(null);
  }

  // ── Helpers ──────────────────────────────

  function update<K extends keyof TourData>(key: K, value: TourData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateList(key: "highlights" | "includes" | "excludes" | "importantInfo", index: number, value: string) {
    const list = [...data[key]];
    list[index] = value;
    update(key, list);
  }

  function addListItem(key: "highlights" | "includes" | "excludes" | "importantInfo") {
    update(key, [...data[key], ""]);
  }

  function removeListItem(key: "highlights" | "includes" | "excludes" | "importantInfo", index: number) {
    update(key, data[key].filter((_, i) => i !== index));
  }

  function updateStop(index: number, field: keyof ItineraryStop, value: string | number | boolean) {
    const items = [...data.itinerary];
    items[index] = { ...items[index], [field]: value };
    update("itinerary", items);
  }

  function addStop() {
    update("itinerary", [
      ...data.itinerary,
      { order: data.itinerary.length + 1, title: "", description: "", stayMinutes: "30", isOptional: false },
    ]);
  }

  function removeStop(index: number) {
    const items = data.itinerary.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 }));
    update("itinerary", items);
  }

  function moveStop(index: number, direction: -1 | 1) {
    const items = [...data.itinerary];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    update("itinerary", items.map((item, i) => ({ ...item, order: i + 1 })));
  }

  // ── Pricing Tiers ──────────────────────────
  function addPriceTier() {
    update("priceTiers", [...(data.priceTiers || []), { minGuests: "", maxGuests: "", pricePerPerson: "" }]);
  }
  function updatePriceTier(index: number, key: keyof PriceTier, val: string) {
    const updated = [...(data.priceTiers || [])];
    updated[index][key] = val;
    update("priceTiers", updated);
  }
  function removePriceTier(index: number) {
    update("priceTiers", (data.priceTiers || []).filter((_, i) => i !== index));
  }

  function formatStayTime(mins: string): string {
    const m = parseInt(mins) || 0;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }

  function handleAddLanguage(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = langInput.trim();
      if (val && !data.languages.includes(val)) {
        update("languages", [...data.languages, val]);
      }
      setLangInput("");
    }
  }

  function removeLanguage(lang: string) {
    update("languages", data.languages.filter((l) => l !== lang));
  }

  // ── Submit ──────────────────────────────

  function handleSave(asDraft = true) {
    const formData = new FormData();
    if (data.tourId) formData.set("tourId", data.tourId);
    formData.set("tourType", data.tourType);
    formData.set("baseGroupSize", data.baseGroupSize);
    formData.set("title", data.title);
    formData.set("slug", data.slug || slugify(data.title));
    formData.set("category", data.category);
    formData.set("difficulty", data.difficulty);
    formData.set("location", data.location);
    formData.set("prefecture", data.prefecture);
    formData.set("country", data.country);
    formData.set("countryCode", data.countryCode);
    formData.set("stateCode", data.stateCode);
    formData.set("shortDescription", data.shortDescription);
    formData.set("description", data.description);
    formData.set("highlights", JSON.stringify(data.highlights.filter(Boolean)));
    formData.set("itinerary", JSON.stringify(data.itinerary.filter((i) => i.title)));
    formData.set("meetingPoint", data.meetingPoint);
    formData.set("endPoint", data.endPoint);
    formData.set("duration", data.duration);
    formData.set("durationType", data.durationType);
    formData.set("maxGroupSize", data.maxGroupSize);
    formData.set("minGroupSize", data.minGroupSize);
    formData.set("dailyCapacity", data.dailyCapacity);
    formData.set("languages", JSON.stringify(data.languages));
    formData.set("serviceProvider", data.serviceProvider);
    formData.set("basePrice", data.basePrice.toString());
    formData.set("childPrice", data.childPrice.toString());
    formData.set("priceTiers", JSON.stringify(data.priceTiers.filter(t => t.minGuests && t.pricePerPerson)));
    formData.set("includes", JSON.stringify(data.includes.filter(Boolean)));
    formData.set("excludes", JSON.stringify(data.excludes.filter(Boolean)));
    formData.set("importantInfo", JSON.stringify(data.importantInfo.filter(Boolean)));
    formData.set("metaTitle", data.metaTitle);
    formData.set("metaDescription", data.metaDescription);
    formData.set("featured", data.featured ? "true" : "false");
    formData.set("likelyToSellOut", data.likelyToSellOut ? "true" : "false");
    formData.set("status", asDraft ? "DRAFT" : data.status);

    startTransition(async () => {
      const res = await saveTourAction(formData);
      setResult(res);
      if (res.success && res.tourId) {
        // Save cover image
        if (data.coverImage) {
          await addTourImageAction(res.tourId, data.coverImage, data.title, true);
        }
        // Save gallery images
        const gallery = data.galleryImages.filter(Boolean);
        for (const url of gallery) {
          await addTourImageAction(res.tourId, url, data.title, false);
        }
        router.push("/admin/tours");
        router.refresh();
      }
    });
  }

  // ── Field styles ────────────────────────

  const inputCls =
    "w-full h-10 px-3 rounded-lg border border-[#E4E0D9] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-colors bg-white";
  const textareaCls =
    "w-full px-3 py-2.5 rounded-lg border border-[#E4E0D9] text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230] transition-colors bg-white resize-none";
  const labelCls = "block text-sm font-medium text-[#111] mb-1.5";
  const hintCls = "text-[10px] text-[#A8A29E] mt-1";

  // ── Render step content ──────────────────

  function renderStep() {
    switch (STEPS[step].id) {
      // ─── BASICS ────────────────────────
      case "basics":
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelCls}>Tour Title <span className="text-[#C41230]">*</span></label>
                <input className={inputCls} value={data.title} onChange={(e) => { update("title", e.target.value); if (!data.slug || data.slug === slugify(data.title.slice(0, -1))) update("slug", slugify(e.target.value)); }} placeholder="e.g. Tokyo Hidden Gems & Street Food Discovery" />
              </div>
              <div>
                <label className={labelCls}>URL Slug <span className="text-[#C41230]">*</span></label>
                <div className="flex items-center">
                  <span className="text-xs text-[#A8A29E] mr-1.5">/tours/</span>
                  <input className={inputCls} value={data.slug} onChange={(e) => update("slug", e.target.value)} placeholder="tokyo-hidden-gems" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Category <span className="text-[#C41230]">*</span></label>
                <select className={inputCls} value={data.category} onChange={(e) => update("category", e.target.value)}>
                  {TOUR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Difficulty</label>
                <select className={inputCls} value={data.difficulty} onChange={(e) => update("difficulty", e.target.value)}>
                  <option value="EASY">Easy</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="CHALLENGING">Challenging</option>
                </select>
              </div>

              {/* Tour Type */}
              <div className="md:col-span-2">
                <label className={labelCls}>Tour Type <span className="text-[#C41230]">*</span></label>
                <div className="flex gap-3">
                  {(["SOLO", "GROUP"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("tourType", t)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        data.tourType === t
                          ? "border-[#C41230] bg-[#FFF0F2] text-[#C41230]"
                          : "border-[#E4E0D9] text-[#545454] hover:border-[#1B2847]"
                      }`}
                    >
                      {t === "SOLO" ? "👤 Solo / Private" : "👥 Group"}
                    </button>
                  ))}
                </div>
                <p className={hintCls}>
                  {data.tourType === "SOLO"
                    ? "For single travellers — no group pricing. One booking = one person."
                    : "For groups — price scales per group unit (set in Pricing step)."}
                </p>
              </div>
            </div>

            {/* Location picker — global Country → State → City */}
            <div className="pt-2 border-t border-[#E4E0D9]">
              <p className="text-sm font-medium text-[#111] mb-3">Tour Location <span className="text-[#C41230]">*</span></p>
              <LocationPicker
                country={data.countryCode}
                state={data.stateCode}
                city={data.location}
                onCountryChange={(code, name) => {
                  update("countryCode", code);
                  update("country", name);
                }}
                onStateChange={(code, name) => {
                  update("stateCode", code);
                  update("prefecture", name);
                }}
                onCityChange={(name) => update("location", name)}
              />
            </div>
          </div>
        );

      // ─── DESCRIPTION ──────────────────
      case "description":
        return (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Short Description <span className="text-[#C41230]">*</span></label>
              <textarea className={textareaCls} rows={3} value={data.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} placeholder="A brief summary that appears in search results and cards (150-200 chars)" />
              <p className={hintCls}>{data.shortDescription.length}/200 characters</p>
            </div>
            <div>
              <label className={labelCls}>Full Description <span className="text-[#C41230]">*</span></label>
              <textarea className={textareaCls} rows={8} value={data.description} onChange={(e) => update("description", e.target.value)} placeholder="Detailed description of the experience. What will travelers see, do, and feel? Describe the atmosphere, unique aspects, and what makes this tour special." />
            </div>
            <div>
              <label className={labelCls}>Highlights</label>
              <p className={hintCls + " mb-3 mt-0"}>Key selling points — shown as bullet points on the tour page.</p>
              <div className="space-y-2">
                {data.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[#A8A29E] w-5 text-center shrink-0">{i + 1}</span>
                    <input className={inputCls} value={h} onChange={(e) => updateList("highlights", i, e.target.value)} placeholder="e.g. Visit a 400-year-old temple" />
                    {data.highlights.length > 1 && (
                      <button type="button" onClick={() => removeListItem("highlights", i)} className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] transition-colors"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem("highlights")} className="mt-2 flex items-center gap-1.5 text-xs text-[#C41230] font-medium hover:underline">
                <Plus size={12} /> Add highlight
              </button>
            </div>
          </div>
        );

      // ─── MEDIA ────────────────────────
      case "media":
        return (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className={labelCls}>Cover Image <span className="text-[#C41230]">*</span></label>
              <div
                onClick={() => !uploadingCover && coverInputRef.current?.click()}
                className={`mt-2 border-2 border-dashed rounded-xl overflow-hidden transition-colors cursor-pointer
                  ${data.coverImage ? "border-[#C41230]/30" : "border-[#E4E0D9] hover:bg-[#FAFAFA]"}`}
              >
                {data.coverImage ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.coverImage} alt="Cover" className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                        className="flex items-center gap-1.5 bg-white text-[#111] text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        <Upload size={13} /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); update("coverImage", ""); }}
                        className="flex items-center gap-1.5 bg-white text-[#C41230] text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    {uploadingCover
                      ? <Loader2 className="mx-auto text-[#C41230] mb-3 animate-spin" size={32} />
                      : <ImageIcon className="mx-auto text-[#A8A29E] mb-3" size={32} />}
                    <p className="text-sm font-medium text-[#111]">
                      {uploadingCover ? "Uploading…" : "Click to upload cover image"}
                    </p>
                    <p className="text-xs text-[#A8A29E] mt-1">JPEG, PNG or WebP · max 10 MB · saved as WebP</p>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Gallery Images */}
            <div>
              <label className={labelCls}>
                Gallery Images
                <span className="text-[#A8A29E] font-normal"> (min 4 · max 15)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                {data.galleryImages.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => uploadingSlot === null && !url && galleryInputRefs.current[i]?.click()}
                    className={`relative rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center min-h-28 group transition-colors
                      ${url ? "border-[#C41230]/20 cursor-default" : "border-[#E4E0D9] hover:bg-[#FAFAFA] cursor-pointer"}`}
                  >
                    {url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-28 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); galleryInputRefs.current[i]?.click(); }}
                            className="bg-white text-[#111] p-1.5 rounded-lg"
                          ><Upload size={12} /></button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = [...data.galleryImages];
                              next[i] = "";
                              update("galleryImages", next);
                            }}
                            className="bg-white text-[#C41230] p-1.5 rounded-lg"
                          ><X size={12} /></button>
                        </div>
                      </>
                    ) : uploadingSlot === i ? (
                      <Loader2 className="text-[#C41230] animate-spin" size={22} />
                    ) : (
                      <>
                        <ImageIcon className="text-[#D6D3CF] mb-1" size={22} />
                        <p className="text-[10px] text-[#A8A29E] font-medium">Image {i + 1}</p>
                      </>
                    )}

                    {/* Remove slot button (only when no image and more than 4 slots) */}
                    {!url && data.galleryImages.length > 4 && uploadingSlot !== i && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          update("galleryImages", data.galleryImages.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-1.5 right-1.5 p-0.5 bg-white rounded-full shadow text-[#A8A29E] hover:text-[#C41230] opacity-0 group-hover:opacity-100 transition-opacity"
                      ><X size={12} /></button>
                    )}

                    <input
                      ref={(el) => { galleryInputRefs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleGalleryUpload(e, i)}
                    />
                  </div>
                ))}

                {/* Add slot */}
                {data.galleryImages.length < 15 && (
                  <button
                    type="button"
                    onClick={() => update("galleryImages", [...data.galleryImages, ""])}
                    className="border-2 border-dashed border-[#C41230]/30 rounded-xl flex flex-col items-center justify-center min-h-28 text-[#C41230] hover:bg-[#FFF5F5] transition-colors"
                  >
                    <Plus size={22} className="mb-1" />
                    <p className="text-[10px] font-semibold">{data.galleryImages.length}/15</p>
                  </button>
                )}
              </div>
              <p className={hintCls}>
                {data.galleryImages.filter(Boolean).length < 4
                  ? `At least 4 photos required — ${4 - data.galleryImages.filter(Boolean).length} more needed.`
                  : `${data.galleryImages.filter(Boolean).length} of 15 uploaded. More photos = higher conversion.`}
              </p>
            </div>
          </div>
        );

      // ─── ITINERARY ────────────────────
      case "itinerary":
        return (
          <div className="space-y-4">
            <div className="bg-[#F0F7FF] rounded-xl p-4 border border-[#B8D4F0]">
              <p className="text-xs text-[#1B2847] font-medium">Stop-by-stop timeline</p>
              <p className="text-[10px] text-[#5B7BA0] mt-0.5">Add each stop on the tour route. Mark optional stops that customers can choose to include. Set the estimated stay time at each location.</p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              {data.itinerary.length > 1 && (
                <div className="absolute left-3.75 top-8 bottom-8 w-0.5 bg-[#E4E0D9]" />
              )}

              <div className="space-y-3">
                {data.itinerary.map((stop, i) => (
                  <div key={i} className={`relative pl-10 ${stop.isOptional ? 'opacity-90' : ''}`}>
                    {/* Timeline dot */}
                    <div className={`absolute left-1.5 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 ${
                      stop.isOptional
                        ? 'bg-white border-dashed border-[#C8A84B] text-[#C8A84B]'
                        : 'bg-[#1B2847] border-[#1B2847] text-white'
                    }`}>
                      {stop.order}
                    </div>

                    <div className={`rounded-xl p-4 border space-y-3 ${
                      stop.isOptional
                        ? 'bg-[#FFFDF5] border-[#E8DFC0] border-dashed'
                        : 'bg-[#F8F7F5] border-[#E4E0D9]'
                    }`}>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[#111]">Stop {stop.order}</span>
                          {stop.isOptional && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-semibold uppercase tracking-wide">Optional</span>
                          )}
                          {stop.stayMinutes && parseInt(stop.stayMinutes) > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F1EFE9] text-[#7A746D] text-[10px] font-medium">⏱ {formatStayTime(stop.stayMinutes)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button type="button" onClick={() => moveStop(i, -1)} disabled={i === 0} className="p-1 text-[#A8A29E] hover:text-[#111] disabled:opacity-30 transition-colors" title="Move up"><ChevronLeft size={14} className="rotate-90" /></button>
                          <button type="button" onClick={() => moveStop(i, 1)} disabled={i === data.itinerary.length - 1} className="p-1 text-[#A8A29E] hover:text-[#111] disabled:opacity-30 transition-colors" title="Move down"><ChevronRight size={14} className="rotate-90" /></button>
                          {data.itinerary.length > 1 && (
                            <button type="button" onClick={() => removeStop(i)} className="p-1 text-[#A8A29E] hover:text-[#DC2626] transition-colors ml-1"><X size={14} /></button>
                          )}
                        </div>
                      </div>

                      {/* Fields */}
                      <div>
                        <label className={labelCls}>Stop Name</label>
                        <input className={inputCls} value={stop.title} onChange={(e) => updateStop(i, "title", e.target.value)} placeholder="e.g. Senso-ji Temple, Tsukiji Fish Market" />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea className={textareaCls} rows={2} value={stop.description} onChange={(e) => updateStop(i, "description", e.target.value)} placeholder="What will visitors see or do at this stop?" />
                      </div>

                      {/* Stay time + Optional toggle */}
                      <div className="flex items-end gap-4 flex-wrap">
                        <div className="w-40">
                          <label className={labelCls}>Stay Time (minutes)</label>
                          <input type="number" min="0" step="5" className={inputCls} value={stop.stayMinutes} onChange={(e) => updateStop(i, "stayMinutes", e.target.value)} placeholder="30" />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateStop(i, "isOptional", !stop.isOptional)}
                          className={`h-10 px-3.5 rounded-lg text-xs font-medium border transition-colors ${
                            stop.isOptional
                              ? 'bg-[#FEF3C7] text-[#B45309] border-[#E8DFC0]'
                              : 'bg-white text-[#7A746D] border-[#E4E0D9] hover:border-[#C8A84B] hover:text-[#B45309]'
                          }`}
                        >
                          {stop.isOptional ? '✦ Optional stop' : 'Mark as optional'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={addStop} className="flex items-center gap-1.5 text-sm text-[#C41230] font-medium hover:underline">
              <Plus size={14} /> Add Stop {data.itinerary.length + 1}
            </button>
          </div>
        );

      // ─── LOGISTICS ────────────────────
      case "logistics":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelCls}>Meeting Point <span className="text-[#C41230]">*</span></label>
              <input className={inputCls} value={data.meetingPoint} onChange={(e) => update("meetingPoint", e.target.value)} placeholder="e.g. Shinjuku Station South Exit, in front of the clock tower" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>End Point <span className="text-[#A8A29E] font-normal">(optional — leave blank if same as meeting point)</span></label>
              <input className={inputCls} value={data.endPoint} onChange={(e) => update("endPoint", e.target.value)} placeholder="e.g. Shibuya Station Hachiko Exit" />
            </div>
            <div>
              <label className={labelCls}>Total Duration <span className="text-[#C41230]">*</span></label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" step="0.5" className={inputCls} style={{ flex: '1 1 auto', minWidth: '80px' }} value={data.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 4" />
                <select className={inputCls} style={{ width: '100px', flex: '0 0 100px' }} value={data.durationType} onChange={(e) => update("durationType", e.target.value)}>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-[10px] text-[#A8A29E] mt-1">Total tour length — e.g. &quot;4 hours&quot; or &quot;3 days&quot;</p>
            </div>
            <div>
              <label className={labelCls}>Max Group Size</label>
              <input type="number" min="1" className={inputCls} value={data.maxGroupSize} onChange={(e) => update("maxGroupSize", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Min Group Size</label>
              <input type="number" min="1" className={inputCls} value={data.minGroupSize} onChange={(e) => update("minGroupSize", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Daily Booking Capacity</label>
              <input type="number" min="1" className={inputCls} placeholder="Max total bookings per day" value={data.dailyCapacity} onChange={(e) => update("dailyCapacity", e.target.value)} />
              <p className={hintCls}>How many bookings available for one day?</p>
            </div>
            <div className="md:col-span-2 pt-4 border-t border-[#E4E0D9]">
              <label className={labelCls}>Service Provider <span className="text-[#A8A29E] font-normal">(optional)</span></label>
              <input className={inputCls} value={data.serviceProvider} onChange={(e) => update("serviceProvider", e.target.value)} placeholder="e.g. Sakura Tours Co." />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Guide Languages</label>
              <div className="border border-[#E4E0D9] rounded-lg p-2 flex flex-wrap gap-2 items-center bg-white transition-colors focus-within:border-[#C41230] focus-within:ring-2 focus-within:ring-[#C41230]/20">
                {data.languages.map((lang) => (
                  <span
                    key={lang}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1EFE9] text-[#111]"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="text-[#A8A29E] hover:text-[#DC2626] transition-colors p-0.5 rounded-full hover:bg-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-30 h-7 text-sm text-[#111] placeholder:text-[#A8A29E] focus:outline-none bg-transparent"
                  placeholder={data.languages.length === 0 ? "Type a language (e.g. English) and press Enter" : "Add another..."}
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={handleAddLanguage}
                />
              </div>
              <p className={hintCls}>Press Enter to add a language</p>
            </div>
            
            <div className="md:col-span-2 pt-6 border-t border-[#E4E0D9]">
              <label className={labelCls}>Important Information (Know Before You Go)</label>
              <div className="space-y-3 mt-2">
                {data.importantInfo.map((info, i) => (
                  <div key={`info-${i}`} className="flex items-start gap-2">
                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#1B2847] shrink-0" />
                    <input
                      className={inputCls}
                      placeholder="E.g., Passport required, Dress code, Physical exertion..."
                      value={info}
                      onChange={(e) => updateList("importantInfo", i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeListItem("importantInfo", i)} className="p-2 text-[#A8A29E] hover:text-[#C41230] hover:bg-[#FEE2E2] rounded-lg transition-colors" title="Remove">
                      <X className="size-5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem("importantInfo")} className="text-sm font-semibold text-[#1B2847] hover:text-[#C41230] flex items-center gap-1 mt-2">
                  <Plus className="size-4" /> Add information point
                </button>
              </div>
            </div>

          </div>
        );

      // ─── PRICING ──────────────────────
      case "pricing":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  {data.tourType === "SOLO" ? "Price (USD)" : "Base Group Price (USD)"}
                  {" "}<span className="text-[#C41230]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] text-sm">$</span>
                  <input type="number" step="0.01" min="0" className={inputCls + " pl-7"} value={data.basePrice} onChange={(e) => update("basePrice", e.target.value)} placeholder="0.00" />
                </div>
                <p className={hintCls}>
                  {data.tourType === "SOLO"
                    ? "Fixed price per booking (one person)"
                    : `Price for up to ${data.baseGroupSize || "N"} guests — increases per group unit above that`}
                </p>
              </div>

              {data.tourType === "SOLO" && (
                <div>
                  <label className={labelCls}>Child Price (USD) <span className="text-[#A8A29E] font-normal">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] text-sm">$</span>
                    <input type="number" step="0.01" min="0" className={inputCls + " pl-7"} value={data.childPrice} onChange={(e) => update("childPrice", e.target.value)} placeholder="0.00" />
                  </div>
                  <p className={hintCls}>Leave blank to use the same price</p>
                </div>
              )}
            </div>

            {/* Group Pricing Section */}
            {data.tourType === "GROUP" && (
              <div className="pt-4 border-t border-[#E4E0D9]">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#111]">Group Pricing Settings</h3>
                  <p className="text-xs text-[#A8A29E] mt-0.5">
                    Set the base group size. Guests up to this size pay the base price. Every additional group unit adds one more base price.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Base Group Size <span className="text-[#C41230]">*</span></label>
                    <input
                      type="number" min="1" max="50"
                      className={inputCls}
                      value={data.baseGroupSize}
                      onChange={(e) => update("baseGroupSize", e.target.value)}
                      placeholder="4"
                    />
                    <p className={hintCls}>Groups of 1–{data.baseGroupSize || "N"} pay the base price</p>
                  </div>

                  {/* Live pricing preview */}
                  {data.basePrice && data.baseGroupSize && (
                    <div className="bg-[#F8F7F5] rounded-xl border border-[#E4E0D9] p-4">
                      <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">Price Preview</p>
                      <div className="space-y-1.5 text-sm">
                        {Array.from({ length: 3 }, (_, i) => {
                          const n = Number(data.baseGroupSize);
                          const p = Number(data.basePrice);
                          const guests = i === 0 ? 1 : i === 1 ? n + 1 : n * 2 + 1;
                          const total  = Math.ceil(guests / n) * p;
                          return (
                            <div key={i} className="flex justify-between">
                              <span className="text-[#545454]">
                                {i === 0 ? `1–${n}` : i === 1 ? `${n + 1}–${n * 2}` : `${n * 2 + 1}–${n * 3}`} guests
                              </span>
                              <span className="font-semibold text-[#111]">${total.toFixed(0)}</span>
                            </div>
                          );
                        })}
                        <p className="text-[10px] text-[#A8A29E] pt-1 border-t border-[#E4E0D9]">Pattern continues: +${Number(data.basePrice).toFixed(0)} per {data.baseGroupSize} guests</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#E4E0D9]">
              <label className={labelCls}>What&apos;s Included</label>
              <div className="space-y-2">
                {data.includes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#15803D] shrink-0 text-sm">✓</span>
                    <input className={inputCls} value={item} onChange={(e) => updateList("includes", i, e.target.value)} placeholder="e.g. Professional English-speaking guide" />
                    {data.includes.length > 1 && (
                      <button type="button" onClick={() => removeListItem("includes", i)} className="p-1.5 text-[#A8A29E] hover:text-[#DC2626]"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem("includes")} className="mt-2 flex items-center gap-1.5 text-xs text-[#C41230] font-medium hover:underline"><Plus size={12} /> Add item</button>
            </div>
            <div>
              <label className={labelCls}>What&apos;s Not Included</label>
              <div className="space-y-2">
                {data.excludes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#DC2626] shrink-0 text-sm">✕</span>
                    <input className={inputCls} value={item} onChange={(e) => updateList("excludes", i, e.target.value)} placeholder="e.g. Hotel pickup and drop-off" />
                    {data.excludes.length > 1 && (
                      <button type="button" onClick={() => removeListItem("excludes", i)} className="p-1.5 text-[#A8A29E] hover:text-[#DC2626]"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem("excludes")} className="mt-2 flex items-center gap-1.5 text-xs text-[#C41230] font-medium hover:underline"><Plus size={12} /> Add item</button>
            </div>
          </div>
        );

      // ─── SEO & STATUS ─────────────────
      case "seo":
        return (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Meta Title <span className="text-[#A8A29E] font-normal">(defaults to tour title)</span></label>
              <input className={inputCls} value={data.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} placeholder={data.title || "Tour title for search engines"} />
              <p className={hintCls}>{(data.metaTitle || data.title).length}/60 characters — recommended max is 60</p>
            </div>
            <div>
              <label className={labelCls}>Meta Description</label>
              <textarea className={textareaCls} rows={3} value={data.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} placeholder="A compelling description for search engine results (max 160 chars)" />
              <p className={hintCls}>{(data.metaDescription || data.shortDescription).length}/160 characters</p>
            </div>
            <div className="bg-[#F8F7F5] rounded-xl p-4 border border-[#E4E0D9]">
              <p className="text-xs font-semibold text-[#7A746D] uppercase tracking-wide mb-3">Search Preview</p>
              <div className="space-y-0.5">
                <p className="text-[#1a0dab] text-base font-medium truncate">{data.metaTitle || data.title || "Tour Title"} | GoTripJapan</p>
                <p className="text-[#006621] text-xs truncate">gotripjapan.com/tours/{data.slug || "tour-slug"}</p>
                <p className="text-[#545454] text-xs line-clamp-2">{data.metaDescription || data.shortDescription || "Tour description will appear here…"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 py-3 border-t border-[#E4E0D9]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => update("featured", !data.featured)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${data.featured ? "bg-[#C41230]" : "bg-[#E4E0D9]"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.featured ? "left-4.5" : "left-0.5"}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-[#111]">Featured Tour</p>
                  <p className="text-xs text-[#7A746D]">Show this tour prominently on the homepage</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => update("likelyToSellOut", !data.likelyToSellOut)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${data.likelyToSellOut ? "bg-[#C41230]" : "bg-[#E4E0D9]"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.likelyToSellOut ? "left-4.5" : "left-0.5"}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-[#111]">Likely to Sell Out Badge</p>
                  <p className="text-xs text-[#7A746D]">Manually display a high demand tag on this tour</p>
                </div>
              </div>
            </div>



            <div>
              <label className={labelCls}>Initial Status</label>
              <select className={inputCls} value={data.status} onChange={(e) => update("status", e.target.value)}>
                <option value="DRAFT">Draft — not visible to customers</option>
                <option value="PUBLISHED">Published — live on the website</option>
              </select>
            </div>
          </div>
        );
    }
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) p-4 mb-5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#1B2847] text-white"
                    : isComplete
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : "text-[#7A746D] hover:bg-[#F8F7F5]"
                }`}
              >
                {isComplete ? <Check size={14} /> : <Icon size={14} />}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-xl border border-[#E4E0D9] shadow-(--shadow-card) p-6">
        {/* Error / success */}
        {result.error && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626] text-sm animate-fade-in">
            <AlertCircle size={16} /> {result.error}
          </div>
        )}

        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E4E0D9] text-sm font-medium text-[#7A746D] hover:bg-[#F8F7F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div className="flex items-center gap-3">
          {/* Save as draft anytime */}
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E4E0D9] text-sm font-medium text-[#7A746D] hover:bg-[#F8F7F5] disabled:opacity-50 transition-colors"
          >
            <Save size={14} /> {isPending ? "Saving…" : "Save Draft"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 h-10 px-5 rounded-lg bg-[#1B2847] text-white text-sm font-semibold hover:bg-[#162240] active:scale-[0.98] transition-all"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="flex items-center gap-1.5 h-10 px-5 rounded-lg bg-[#C41230] text-white text-sm font-semibold hover:bg-[#A00E25] active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {isPending ? "Saving…" : data.status === "PUBLISHED" ? "Publish Tour" : "Create Tour"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
