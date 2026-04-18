"use client";

import { useState, useTransition, useRef } from "react";
import {
  Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown,
  Globe, Image as ImageIcon, ExternalLink, EyeOff, Upload, Loader2,
} from "lucide-react";
import {
  createDestination, updateDestination, deleteDestination, reorderDestination,
  createPlace, updatePlace, deletePlace,
} from "./actions";

type PlaceRow = {
  id: string; name: string; subtitle: string | null;
  imageUrl: string | null; linkQuery: string | null;
  order: number; isActive: boolean;
};
type DestRow = {
  id: string; name: string; slug: string; order: number; isActive: boolean;
  places: PlaceRow[];
};

interface Props { destinations: DestRow[] }

const inputCls = "w-full h-9 rounded-lg border border-[#E4E0D9] px-3 text-sm text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#C41230]/20 focus:border-[#C41230]";
const labelCls = "text-xs font-semibold text-[#545454] block mb-1";

export function DestinationsClient({ destinations: init }: Props) {
  const [destinations] = useState<DestRow[]>(init);
  const [selected,     setSelected]     = useState<string | null>(init[0]?.id ?? null);
  const [isPending,    startTransition]  = useTransition();

  // ── Destination add ──
  const [newDestName, setNewDestName] = useState("");
  const [addingDest,  setAddingDest]  = useState(false);

  // ── Destination edit ──
  const [editDestId,   setEditDestId]   = useState<string | null>(null);
  const [editDestName, setEditDestName] = useState("");

  // ── Place form ──
  const [showPlaceForm,   setShowPlaceForm]   = useState(false);
  const [editPlaceId,     setEditPlaceId]     = useState<string | null>(null);
  const [placeForm,       setPlaceForm]       = useState({
    name: "", subtitle: "", imageUrl: "", linkQuery: "", isActive: true,
  });
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  async function uploadPlaceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { alert(json.error ?? "Upload failed."); return; }
      setPlaceForm((f) => ({ ...f, imageUrl: json.url }));
    } catch {
      alert("Upload failed: network error.");
    } finally {
      setUploadingImg(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }

  const refresh = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      // Re-fetch data by reloading the page data (server action revalidates)
      window.location.reload();
    });
  };

  const activeDest = destinations.find((d) => d.id === selected);

  // ── Helpers ──
  const openEditDest = (d: DestRow) => {
    setEditDestId(d.id);
    setEditDestName(d.name);
  };

  const openAddPlace = () => {
    setEditPlaceId(null);
    setPlaceForm({ name: "", subtitle: "", imageUrl: "", linkQuery: "", isActive: true });
    setShowPlaceForm(true);
  };

  const openEditPlace = (p: PlaceRow) => {
    setEditPlaceId(p.id);
    setPlaceForm({
      name: p.name, subtitle: p.subtitle ?? "", imageUrl: p.imageUrl ?? "",
      linkQuery: p.linkQuery ?? "", isActive: p.isActive,
    });
    setShowPlaceForm(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── LEFT: Countries/Destinations ── */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-[#E4E0D9] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E0D9] flex items-center justify-between">
            <h2 className="font-bold text-[#111] text-sm">Countries / Regions</h2>
            <button
              onClick={() => setAddingDest(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#C41230] hover:text-[#A00F27]"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>

          {/* Add destination inline */}
          {addingDest && (
            <div className="px-4 py-3 border-b border-[#E4E0D9] bg-[#F8F7F5]">
              <input
                autoFocus
                value={newDestName}
                onChange={(e) => setNewDestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDestName.trim()) {
                    refresh(async () => { await createDestination(newDestName.trim()); });
                    setNewDestName(""); setAddingDest(false);
                  }
                  if (e.key === "Escape") { setAddingDest(false); setNewDestName(""); }
                }}
                placeholder="Country / Region name"
                className={inputCls + " h-8 text-xs"}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (!newDestName.trim()) return;
                    refresh(async () => { await createDestination(newDestName.trim()); });
                    setNewDestName(""); setAddingDest(false);
                  }}
                  className="text-xs font-bold bg-[#C41230] text-white px-3 py-1.5 rounded-lg"
                >Save</button>
                <button onClick={() => { setAddingDest(false); setNewDestName(""); }} className="text-xs text-[#7A746D] px-2">Cancel</button>
              </div>
            </div>
          )}

          {/* Destination list */}
          <ul className="divide-y divide-[#E4E0D9] max-h-130 overflow-y-auto">
            {destinations.map((d) => (
              <li
                key={d.id}
                className={`group flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors ${
                  selected === d.id ? "bg-[#FFF0F2]" : "hover:bg-[#F8F7F5]"
                }`}
                onClick={() => setSelected(d.id)}
              >
                {editDestId === d.id ? (
                  <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editDestName}
                      onChange={(e) => setEditDestName(e.target.value)}
                      className={inputCls + " h-7 text-xs flex-1"}
                    />
                    <button onClick={() => {
                      refresh(async () => { await updateDestination(d.id, editDestName.trim(), d.isActive); });
                      setEditDestId(null);
                    }} className="text-[#15803D]"><Check className="size-4" /></button>
                    <button onClick={() => setEditDestId(null)} className="text-[#7A746D]"><X className="size-4" /></button>
                  </div>
                ) : (
                  <>
                    <Globe className={`size-4 shrink-0 ${selected === d.id ? "text-[#C41230]" : "text-[#A8A29E]"}`} />
                    <span className={`flex-1 text-sm font-semibold truncate ${d.isActive ? "text-[#111]" : "text-[#A8A29E] line-through"}`}>
                      {d.name}
                    </span>
                    <span className="text-[10px] text-[#A8A29E] shrink-0">{d.places.length}</span>

                    <div className="hidden group-hover:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => refresh(async () => reorderDestination(d.id, "up"))} className="p-0.5 hover:text-[#1B2847]"><ChevronUp className="size-3" /></button>
                      <button onClick={() => refresh(async () => reorderDestination(d.id, "down"))} className="p-0.5 hover:text-[#1B2847]"><ChevronDown className="size-3" /></button>
                      <button onClick={() => openEditDest(d)} className="p-0.5 hover:text-[#1B2847]"><Pencil className="size-3" /></button>
                      <button onClick={() => {
                        if (confirm(`Delete "${d.name}" and all its places?`))
                          refresh(async () => deleteDestination(d.id));
                      }} className="p-0.5 hover:text-[#C41230]"><Trash2 className="size-3" /></button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {destinations.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-[#A8A29E]">No destinations yet.</li>
            )}
          </ul>
        </div>
      </div>

      {/* ── RIGHT: Places in selected destination ── */}
      <div className="lg:col-span-2">
        {!activeDest ? (
          <div className="bg-white rounded-2xl border border-[#E4E0D9] h-40 flex items-center justify-center text-sm text-[#A8A29E]">
            Select a country on the left to manage its places.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E4E0D9] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E0D9] flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-[#111]">{activeDest.name}</h2>
                <p className="text-xs text-[#7A746D]">{activeDest.places.length} place{activeDest.places.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    refresh(async () => updateDestination(activeDest.id, activeDest.name, !activeDest.isActive));
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    activeDest.isActive
                      ? "border-[#E4E0D9] text-[#545454] hover:border-[#C41230] hover:text-[#C41230]"
                      : "border-[#22C55E] text-[#15803D] hover:bg-[#F0FDF4]"
                  }`}
                >
                  {activeDest.isActive ? <><EyeOff className="size-3 inline mr-1" />Hide</>  : <><Check className="size-3 inline mr-1" />Show</>}
                </button>
                <button
                  onClick={openAddPlace}
                  className="flex items-center gap-1.5 text-sm font-bold bg-[#C41230] hover:bg-[#A00F27] text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="size-4" /> Add Place
                </button>
              </div>
            </div>

            {/* Place form */}
            {showPlaceForm && (
              <div className="px-5 py-4 border-b border-[#E4E0D9] bg-[#F8F7F5]">
                <h3 className="font-bold text-sm text-[#111] mb-3">{editPlaceId ? "Edit Place" : "New Place"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input value={placeForm.name} onChange={(e) => setPlaceForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Tokyo" />
                  </div>
                  <div>
                    <label className={labelCls}>Subtitle</label>
                    <input value={placeForm.subtitle} onChange={(e) => setPlaceForm(f => ({ ...f, subtitle: e.target.value }))} className={inputCls} placeholder="Attraction in Tokyo, Japan" />
                  </div>
                  <div>
                    <label className={labelCls}>Image</label>
                    <div className="flex items-center gap-2">
                      {placeForm.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={placeForm.imageUrl} alt="" className="h-9 w-14 object-cover rounded-lg border border-[#E4E0D9] shrink-0" />
                      ) : (
                        <div className="h-9 w-14 rounded-lg border border-dashed border-[#E4E0D9] flex items-center justify-center shrink-0">
                          <ImageIcon className="size-4 text-[#D6D3CF]" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => imgInputRef.current?.click()}
                        disabled={uploadingImg}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E4E0D9] text-xs font-semibold text-[#545454] hover:bg-[#F8F7F5] disabled:opacity-50 transition-colors"
                      >
                        {uploadingImg ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                        {uploadingImg ? "Uploading…" : placeForm.imageUrl ? "Replace" : "Upload"}
                      </button>
                      {placeForm.imageUrl && (
                        <button type="button" onClick={() => setPlaceForm(f => ({ ...f, imageUrl: "" }))} className="p-1.5 text-[#A8A29E] hover:text-[#C41230]">
                          <X className="size-3.5" />
                        </button>
                      )}
                      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={uploadPlaceImage} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tours link query (default: name)</label>
                    <input value={placeForm.linkQuery} onChange={(e) => setPlaceForm(f => ({ ...f, linkQuery: e.target.value }))} className={inputCls} placeholder="Tokyo" />
                  </div>
                  {editPlaceId && (
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="placeActive" checked={placeForm.isActive}
                        onChange={(e) => setPlaceForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                      <label htmlFor="placeActive" className="text-sm text-[#545454] cursor-pointer">Visible on site</label>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    disabled={!placeForm.name.trim() || isPending}
                    onClick={() => {
                      if (!placeForm.name.trim()) return;
                      refresh(async () => {
                        if (editPlaceId) {
                          await updatePlace(editPlaceId, { ...placeForm, isActive: placeForm.isActive });
                        } else {
                          await createPlace(activeDest.id, placeForm);
                        }
                      });
                      setShowPlaceForm(false);
                    }}
                    className="bg-[#C41230] hover:bg-[#A00F27] disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setShowPlaceForm(false)} className="text-sm text-[#7A746D] border border-[#E4E0D9] px-4 py-2 rounded-lg hover:bg-white">Cancel</button>
                </div>
              </div>
            )}

            {/* Places grid */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeDest.places.map((p) => (
                <div
                  key={p.id}
                  className={`group relative rounded-xl border overflow-hidden transition-all ${
                    p.isActive ? "border-[#E4E0D9]" : "border-dashed border-[#E4E0D9] opacity-50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-20 bg-[#F8F7F5] flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="size-7 text-[#D6D3CF]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm text-[#111] truncate">{p.name}</p>
                    {p.subtitle && <p className="text-xs text-[#7A746D] truncate mt-0.5">{p.subtitle}</p>}
                    {p.linkQuery && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#A8A29E] mt-1">
                        <ExternalLink className="size-3" /> /tours?q={p.linkQuery}
                      </span>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => openEditPlace(p)} className="bg-white text-[#111] p-2 rounded-lg hover:bg-[#F8F7F5]">
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) refresh(async () => deletePlace(p.id));
                    }} className="bg-white text-[#C41230] p-2 rounded-lg hover:bg-[#FEE2E2]">
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {!p.isActive && (
                    <div className="absolute top-2 right-2 bg-white/80 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-[#A8A29E] uppercase">Hidden</div>
                  )}
                </div>
              ))}

              {activeDest.places.length === 0 && !showPlaceForm && (
                <div className="col-span-3 py-10 text-center text-sm text-[#A8A29E]">
                  No places yet.{" "}
                  <button onClick={openAddPlace} className="text-[#C41230] font-semibold hover:underline">Add the first one.</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
