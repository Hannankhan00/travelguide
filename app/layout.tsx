import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://gotripjapan.com"),
  title: {
    default: "GoTripJapan — Your Japan Journey Starts Here",
    template: "%s | GoTripJapan",
  },
  description:
    "GoTripJapan offers expertly crafted Japan tour packages for 2026. Explore Tokyo, Kyoto, Osaka, Hiroshima and beyond with local guides. Custom itineraries, group & private tours. Book your perfect Japan trip today.",
  keywords: [
    "GoTripJapan",
    "Japan tour packages 2026",
    "Japan travel itinerary",
    "best Japan travel agency",
    "custom Japan trip planner",
    "guided tours Japan",
    "Tokyo tours",
    "Kyoto tours",
    "Osaka tours",
    "Japan holiday packages",
    "private Japan tours",
    "cultural Japan tours",
    "Japan adventure tours",
    "Japan trip cost",
    "first time visiting Japan",
    "cherry blossom Japan tour",
    "Japan golden week travel",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GoTripJapan",
    title: "GoTripJapan — Your Japan Journey Starts Here",
    description:
      "Expertly crafted Japan tour packages for 2026. Custom itineraries, group & private tours to Tokyo, Kyoto, Osaka and beyond. Book with GoTripJapan today.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gotripjapan",
    title: "GoTripJapan — Your Japan Journey Starts Here",
    description:
      "Japan tour packages 2026 — custom itineraries, local guides, group & private tours. Your Japan journey starts at GoTripJapan.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#185FA5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${playfair.variable} h-full`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
