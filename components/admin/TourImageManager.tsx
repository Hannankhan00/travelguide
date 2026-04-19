"use client";

import { useState, useRef, useTransition } from "react";
import { Trash2, Star, Upload, Loader2, ImageIcon, Plus } from "lucide-react";
import { deleteTourImageAction, setPrimaryImageAction, addTourImageAction } from "@/app/(admin)/admin/tours/actions";

interface TourImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText: string | null;
}

interface Props {
  tourId: string;
  initialImages: TourImage[];
}

async function uploadFile(file: File): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) { alert(json.error ?? "Upload failed."); return null; }
    return json.url as string;
  } catch {
    alert("Upload failed. Please try again.");
    return null;
  }
}

export function TourImageManager({ tourId, initialImages }: Props) {
  const [images, setImages] = useState<TourImage[]>(initialImages);
  const [loadingId, setLoadingId]   = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [isPending, startTransition]   = useTransition();
  const addInputRef  = useRef<HTMLInputElement>(null);
  const replaceRefs  = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Delete ───────────────────────────────
  function handleDelete(img: TourImage) {
    if (!confirm("Delete this photo permanently?")) return;
    setLoadingId(img.id);
    startTransition(async () => {
      const res = await deleteTourImageAction(img.id, tourId);
      if (res.success) {
        setImages(prev => {
          const next = prev.filter(i => i.id !== img.id);
          // If deleted was primary, promote first remaining
          if (img.isPrimary && next.length > 0) next[0] = { ...next[0], isPrimary: true };
          return next;
        });
      } else {
        alert(res.error ?? "Delete failed.");
      }
      setLoadingId(null);
    });
  }

  // ── Set primary ──────────────────────────
  function handleSetPrimary(img: TourImage) {
    if (img.isPrimary) return;
    setLoadingId(img.id);
    startTransition(async () => {
      const res = await setPrimaryImageAction(img.id, tourId);
      if (res.success) {
        setImages(prev => prev.map(i => ({ ...i, isPrimary: i.id === img.id })));
      } else {
        alert(res.error ?? "Failed.");
      }
      setLoadingId(null);
    });
  }

  // ── Replace ──────────────────────────────
  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>, oldImg: TourImage) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingId(oldImg.id);
    const newUrl = await uploadFile(file);
    if (!newUrl) { setLoadingId(null); return; }

    startTransition(async () => {
      const addRes = await addTourImageAction(tourId, newUrl, oldImg.altText ?? "", oldImg.isPrimary);
      if (!addRes.success) { alert(addRes.error ?? "Failed to add."); setLoadingId(null); return; }

      // Fetch newly created image id by refreshing — we'll just add optimistically
      const delRes = await deleteTourImageAction(oldImg.id, tourId);
      if (delRes.success) {
        setImages(prev => prev.map(i =>
          i.id === oldImg.id
            ? { ...i, url: newUrl, id: "pending-" + Date.now() }
            : i
        ));
      }
      setLoadingId(null);
    });
  }

  // ── Add new photos ───────────────────────
  async function handleAddNew(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingNew(true);
    for (const file of files) {
      const url = await uploadFile(file);
      if (!url) continue;
      const isPrimary = images.length === 0;
      startTransition(async () => {
        const res = await addTourImageAction(tourId, url, "", isPrimary);
        if (res.success) {
          setImages(prev => [...prev, { id: "new-" + Date.now() + Math.random(), url, isPrimary: isPrimary && prev.length === 0, altText: null }]);
        }
      });
    }
    setUploadingNew(false);
    if (addInputRef.current) addInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#111]">Tour Photos</p>
          <p className="text-xs text-[#7A746D] mt-0.5">{images.length} photo{images.length !== 1 ? "s" : ""} · changes save instantly</p>
        </div>
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#1B2847] hover:bg-[#243560] text-white px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add photos
        </button>
        <input ref={addInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddNew} />
      </div>

      {images.length === 0 ? (
        <div
          onClick={() => addInputRef.current?.click()}
          className="border-2 border-dashed border-[#E4E0D9] rounded-xl p-10 text-center cursor-pointer hover:bg-[#FAFAFA] transition-colors"
        >
          <ImageIcon className="mx-auto text-[#A8A29E] mb-2" size={28} />
          <p className="text-sm font-medium text-[#111]">No photos yet</p>
          <p className="text-xs text-[#A8A29E] mt-1">Click to upload</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-[#E4E0D9] aspect-video bg-[#F4F4F4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} fill="white" /> Cover
                </div>
              )}

              {/* Loading overlay */}
              {loadingId === img.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={22} />
                </div>
              )}

              {/* Actions overlay */}
              {loadingId !== img.id && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1.5">
                    {/* Replace */}
                    <button
                      type="button"
                      onClick={() => replaceRefs.current[img.id]?.click()}
                      className="bg-white/90 hover:bg-white text-[#111] p-1.5 rounded-lg transition-colors"
                      title="Replace photo"
                    >
                      <Upload size={13} />
                    </button>
                    <input
                      ref={el => { replaceRefs.current[img.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReplace(e, img)}
                    />

                    {/* Set as cover */}
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        className="bg-white/90 hover:bg-white text-[#D4AF37] p-1.5 rounded-lg transition-colors"
                        title="Set as cover photo"
                      >
                        <Star size={13} />
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="bg-white/90 hover:bg-[#FEE2E2] text-[#C41230] p-1.5 rounded-lg transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add more tile */}
          {images.length < 15 && (
            <div
              onClick={() => addInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-[#E4E0D9] aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAFAFA] transition-colors group"
            >
              {uploadingNew ? (
                <Loader2 className="text-[#C41230] animate-spin" size={22} />
              ) : (
                <>
                  <Plus className="text-[#A8A29E] group-hover:text-[#1B2847] transition-colors" size={22} />
                  <p className="text-[11px] text-[#A8A29E] mt-1">Add more</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
