"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { submitReviewAction } from "@/app/(public)/tours/actions";

export function ReviewFormClient({ tourId, bookingId }: { tourId: string; bookingId: string }) {
  const router = useRouter();
  const [rating,    setRating]    = useState(0);
  const [hover,     setHover]     = useState(0);
  const [message,   setMessage]   = useState("");
  const [result,    setResult]    = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  void bookingId;

  function handleSubmit() {
    const fd = new FormData();
    fd.set("tourId",  tourId);
    fd.set("rating",  rating.toString());
    fd.set("message", message);
    startTransition(async () => {
      const res = await submitReviewAction(fd);
      setResult(res);
      if (res.success) {
        setTimeout(() => router.push("/bookings"), 1800);
      }
    });
  }

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="space-y-6">

      {/* Star rating */}
      <div>
        <label className="text-sm font-semibold text-[#111] block mb-3">
          Your Rating <span className="text-[#C41230]">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`size-9 transition-colors ${
                  s <= (hover || rating)
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : "text-[#E4E0D9] hover:text-[#F59E0B]/50"
                }`}
              />
            </button>
          ))}
          {(hover || rating) > 0 && (
            <span className="text-sm font-semibold text-[#7A746D] ml-1">
              {labels[hover || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Review text */}
      <div>
        <label className="text-sm font-semibold text-[#111] block mb-2">
          Your Review <span className="text-[#C41230]">*</span>
        </label>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did you enjoy most? How was your guide? Would you recommend this tour?"
          className="w-full px-4 py-3 border border-[#E4E0D9] rounded-xl text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1B2847]/15 focus:border-[#1B2847] transition-all resize-none text-sm"
        />
        <p className="text-xs text-[#A8A29E] mt-1">{message.length} characters (minimum 10)</p>
      </div>

      {/* Feedback */}
      {result?.error && (
        <div className="bg-[#FEE2E2] text-[#DC2626] text-sm px-4 py-3 rounded-lg">
          {result.error}
        </div>
      )}
      {result?.success && (
        <div className="bg-[#DCFCE7] text-[#15803D] text-sm px-4 py-3 rounded-lg font-medium">
          {result.success} Redirecting you back...
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || rating === 0 || message.length < 10 || !!result?.success}
        className="w-full bg-[#1B2847] hover:bg-[#243560] disabled:bg-[#E4E0D9] disabled:text-[#A8A29E] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {isPending ? <><Loader2 className="size-4 animate-spin" /> Submitting...</> : "Submit Review"}
      </button>

      <p className="text-xs text-[#A8A29E] text-center">
        Reviews help other travelers make better decisions. Thank you for sharing.
      </p>
    </div>
  );
}
