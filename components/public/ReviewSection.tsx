"use client";

import { useState, useTransition } from "react";
import { Star, Camera, Loader2, LogIn } from "lucide-react";
import { submitReviewAction } from "@/app/(public)/tours/actions";
import Link from "next/link";

interface ReviewSectionProps {
  tourId: string;
  reviews: {
    id: string;
    rating: number;
    message: string;
    photoUrl: string | null;
    createdAt: string;
    user: { name: string | null; image: string | null };
  }[];
  currentUserId?: string | null;
  averageRating: number;
  reviewCount: number;
}

export function ReviewSection({ tourId, reviews, currentUserId, averageRating, reviewCount }: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);

  const hasReviewed = reviews.some((r) => r.user && currentUserId);

  function handleSubmit() {
    if (!currentUserId) return;
    const fd = new FormData();
    fd.set("tourId", tourId);
    fd.set("rating", rating.toString());
    fd.set("message", message);
    startTransition(async () => {
      const res = await submitReviewAction(fd);
      setResult(res);
      if (res.success) {
        setRating(0);
        setMessage("");
      }
    });
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#111]">Reviews</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-5 ${s <= Math.round(averageRating) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E4E0D9]"}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-[#111]">{averageRating.toFixed(1)}</span>
            <span className="text-[#7A746D]">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
          </div>
        </div>
      </div>

      {/* Write a review */}
      {!currentUserId ? (
        <div className="bg-[#F8F7F5] border border-[#E4E0D9] rounded-2xl p-8 text-center mb-10">
          <LogIn className="mx-auto size-10 text-[#A8A29E] mb-4" />
          <h3 className="text-lg font-bold text-[#111] mb-2">Want to share your experience?</h3>
          <p className="text-[#7A746D] mb-5">Sign in or create an account to write a review.</p>
          <Link
            href="?auth=login"
            className="inline-flex items-center gap-2 bg-[#0C447C] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#08315E] transition-colors"
          >
            <LogIn className="size-4" /> Sign In to Review
          </Link>
        </div>
      ) : hasReviewed ? (
        <div className="bg-[#F0FFF4] border border-[#BBF7D0] rounded-2xl p-6 text-center mb-10">
          <p className="text-[#15803D] font-medium">✓ You&apos;ve already submitted a review for this tour. Thank you!</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E4E0D9] rounded-2xl p-6 md:p-8 mb-10 shadow-sm">
          <h3 className="text-lg font-bold text-[#111] mb-5">Write a Review</h3>

          {/* Star rating */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#111] block mb-2">Your Rating <span className="text-[#185FA5]">*</span></label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-8 transition-colors ${
                      s <= (hover || rating)
                        ? "fill-[#F59E0B] text-[#F59E0B]"
                        : "text-[#E4E0D9] hover:text-[#F59E0B]/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-[#111] block mb-2">Your Review <span className="text-[#185FA5]">*</span></label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your experience — what did you enjoy? What stood out? Would you recommend this tour?"
              className="w-full px-4 py-3 border border-[#E4E0D9] rounded-xl text-[#111] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] transition-all resize-none"
            />
            <p className="text-xs text-[#A8A29E] mt-1">{message.length} characters (minimum 10)</p>
          </div>

          {/* Photo upload placeholder */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-[#111] block mb-2">Add a Photo <span className="text-[#A8A29E] font-normal">(optional)</span></label>
            <div className="border-2 border-dashed border-[#E4E0D9] rounded-xl p-4 text-center hover:bg-[#FAFAFA] transition-colors cursor-pointer relative">
              <Camera className="mx-auto text-[#A8A29E] mb-2" size={24} />
              <p className="text-xs text-[#7A746D]">Click to upload a photo from your experience</p>
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
            </div>
          </div>

          {/* Feedback */}
          {result?.error && (
            <div className="bg-[#FEE2E2] text-[#185FA5] text-sm px-4 py-3 rounded-lg mb-4">{result.error}</div>
          )}
          {result?.success && (
            <div className="bg-[#F0FFF4] text-[#15803D] text-sm px-4 py-3 rounded-lg mb-4">{result.success}</div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || rating === 0 || message.length < 10}
            className="w-full bg-[#185FA5] hover:bg-[#12487F] disabled:bg-[#E4E0D9] disabled:text-[#A8A29E] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : "Submit Review"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-[#E4E0D9] rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0C447C] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {review.user.image ? (
                    <img src={review.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (review.user.name || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-[#111]">{review.user.name || "Anonymous"}</h4>
                    <span className="text-xs text-[#A8A29E]">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-4 ${s <= review.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E4E0D9]"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[#545454] leading-relaxed">{review.message}</p>
                  {review.photoUrl && (
                    <div className="mt-4">
                      <img
                        src={review.photoUrl}
                        alt="Review photo"
                        className="w-40 h-28 object-cover rounded-xl border border-[#E4E0D9]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#A8A29E]">
          <Star className="mx-auto size-10 mb-3 text-[#E4E0D9]" />
          <p className="text-lg font-medium text-[#7A746D]">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience!</p>
        </div>
      )}
    </section>
  );
}
