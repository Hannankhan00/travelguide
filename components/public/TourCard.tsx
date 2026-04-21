import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { WishlistButton } from "./WishlistButton";
import { cldUrl, CLD_CARD } from "@/lib/cloudinary";

interface TourCardProps {
  id:             string;
  slug:           string;
  title:          string;
  location:       string;
  duration:       number;          // days
  price:          number;
  currency?:      string;
  rating?:        number;
  reviewCount?:   number;
  maxGroupSize?:  number;
  category:       string;
  gradient:       string;          // CSS gradient string for placeholder image
  featured?:      boolean;
  likelyToSellOut?: boolean;
  coverImage?:    string;
  durationType?:  string;
  isWishlisted?:  boolean;
}

export function TourCard({
  id,
  slug,
  title,
  location,
  duration,
  price,
  currency    = "USD",
  rating      = 5,
  reviewCount = 0,
  maxGroupSize,
  category,
  gradient,
  featured,
  likelyToSellOut,
  coverImage,
  durationType = "days",
  isWishlisted = false,
}: TourCardProps) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-background border border-border
                 shadow-(--shadow-card) hover:shadow-lg hover:-translate-y-1
                 transition-all duration-300">
      
      {/* Wishlist Button Overlay - Absolutely positioned above the link */}
      <div className="absolute top-3 right-3 z-20">
        <WishlistButton 
          tourId={id} 
          isWishlistedInitial={isWishlisted} 
          className="shadow-md"
        />
      </div>

      <Link
        href={`/tours/${slug}`}
        className="block"
      >
        {/* Image area */}
        <div className="relative h-56 overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={cldUrl(coverImage, CLD_CARD)}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="absolute inset-0 group-hover:scale-105 transition-transform duration-500"
              style={{ background: gradient }}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-secondary/70 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-[#1B2847] shadow-sm backdrop-blur-sm tracking-wide">
              {category.replace(/_/g, " ")}
            </span>
          </div>

          {/* Featured / Likely to sell out badges */}
          <div className="absolute top-12 left-3 flex flex-col gap-1.5 items-start">
            {featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B2847]/90 text-white shadow-sm backdrop-blur-sm">
                <Star className="size-3 fill-white" />
                Featured
              </span>
            )}
            {likelyToSellOut && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#C41230]/90 text-white shadow-sm backdrop-blur-sm">
                Likely to Sell Out
              </span>
            )}
          </div>

        {/* Location on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium">
          <MapPin className="size-3.5 shrink-0" />
          <span>{location}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg text-foreground leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-sm text-muted mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{duration} {durationType}</span>
          </div>
          {maxGroupSize && (
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              <span>Up to {maxGroupSize}</span>
            </div>
          )}
        </div>

        {/* Rating + Price row */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Stars */}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < Math.floor(rating)
                      ? "text-accent fill-accent"
                      : "text-border fill-border"
                  }`}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-muted">({reviewCount})</span>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="text-xs text-muted block">from</span>
            <span className="text-primary font-bold text-lg leading-tight">
              {formatPrice(price, currency)}
            </span>
          </div>
        </div>
      </div>
      </Link>
    </div>
  );
}
