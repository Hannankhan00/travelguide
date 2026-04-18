import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    default: "GoTripJapan",
    template: "%s | GoTripJapan",
  },
  description:
    "GoTripJapan offers handcrafted, expert-guided tours across Japan. Explore Tokyo, Kyoto, Osaka and beyond with local guides. Book your perfect Japan experience today.",
  keywords: [
    "GoTripJapan", "Japan tours", "Japan travel", "guided tours Japan",
    "Tokyo tours", "Kyoto tours", "Osaka tours", "Japan holiday", "Japan trip",
    "private Japan tours", "cultural Japan tours", "Japan adventure tours",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GoTripJapan",
    title: "GoTripJapan",
    description:
      "GoTripJapan offers handcrafted, expert-guided tours across Japan. Explore Tokyo, Kyoto, Osaka and beyond with local guides.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gotripjapan",
    title: "GoTripJapan",
    description:
      "Handcrafted Japan tours led by expert local guides. Book your perfect Japan experience with GoTripJapan.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#C41230",
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
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
