/** ─── Company ─────────────────────────────────────────────────────────────
 *  Company name is sourced from env so the client can confirm it later.
 *  Set NEXT_PUBLIC_COMPANY_NAME in .env to override the placeholder.
 * ─────────────────────────────────────────────────────────────────────────── */
export const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME ?? "GoTripJapan";

export const COMPANY_EMAIL =
  process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "contact@gotripjapan.com";

export const COMPANY_PHONE =
  process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "";

export const COMPANY_CURRENCY =
  process.env.NEXT_PUBLIC_CURRENCY ?? "USD";

export const COMPANY_LOCALE =
  process.env.NEXT_PUBLIC_LOCALE ?? "en-US";

// ─── Bank Transfer Details ────────────────────────────────────────────────
export const BANK_NAME        = process.env.BANK_NAME        ?? "";
export const BANK_ACCOUNT_NO  = process.env.BANK_ACCOUNT_NO  ?? "";
export const BANK_ROUTING_NO  = process.env.BANK_ROUTING_NO  ?? "";
export const BANK_SWIFT       = process.env.BANK_SWIFT       ?? "";
export const BANK_BENEFICIARY = process.env.BANK_BENEFICIARY ?? COMPANY_NAME;

// ─── Navigation ───────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: "Tours",     href: "/tours"          },
  { label: "About",     href: "/about"          },
  { label: "Contact",   href: "/contact"        },
] as const;

// ─── Tour Categories (matches Prisma enum) ────────────────────────────────
export const TOUR_CATEGORIES = [
  { value: "CULTURAL",       label: "Cultural"       },
  { value: "ADVENTURE",      label: "Adventure"      },
  { value: "FOOD_AND_DRINK", label: "Food & Drink"   },
  { value: "NATURE",         label: "Nature"         },
  { value: "CITY_TOUR",      label: "City Tour"      },
  { value: "DAY_TRIP",       label: "Day Trip"       },
  { value: "MULTI_DAY",      label: "Multi-Day"      },
  { value: "PRIVATE",        label: "Private"        },
  { value: "GROUP",          label: "Group"          },
] as const;

// ─── Japan Prefectures ────────────────────────────────────────────────────
export const JAPAN_PREFECTURES = [
  "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano",
  "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo",
  "Nara", "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima",
  "Yamaguchi", "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka",
  "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
] as const;

// ─── Booking ──────────────────────────────────────────────────────────────
export const MAX_PASSENGERS_PER_BOOKING = 20;
export const BOOKING_DEPOSIT_PERCENT    = 30; // % deposit for bank transfer

// ─── Payment ──────────────────────────────────────────────────────────────
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD"] as const;

// ─── Pagination ───────────────────────────────────────────────────────────
export const TOURS_PER_PAGE = 12;
export const BOOKINGS_PER_PAGE = 20;
