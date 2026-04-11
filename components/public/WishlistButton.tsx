"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  tourId: string;
  isWishlistedInitial: boolean;
  className?: string;
  showText?: boolean;
}

export function WishlistButton({ 
  tourId, 
  isWishlistedInitial, 
  className,
  showText = false 
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleWishlistAction(tourId);
      
      if (result.error) {
        if (result.error.includes("logged in")) {
          // Open auth modal via URL search param
          router.push("?auth=login");
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (result.success) {
        setIsWishlisted(result.added!);
        toast.success(result.added ? "Added to wishlist" : "Removed from wishlist");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "group flex items-center gap-2 transition-all duration-200",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <div className={cn(
        "p-2.5 rounded-full transition-all duration-300",
        isWishlisted 
          ? "bg-red-50 text-red-500" 
          : "bg-white/80 backdrop-blur-sm text-[#111] hover:bg-white shadow-sm ring-1 ring-black/5"
      )}>
        <Heart 
          className={cn(
            "size-5 transition-transform duration-300 group-hover:scale-110",
            isWishlisted && "fill-current"
          )} 
        />
      </div>
      {showText && (
        <span className="text-sm font-semibold text-[#111]">
          {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
        </span>
      )}
    </button>
  );
}
