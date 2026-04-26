import type { NextConfig } from "next";

const CANONICAL_DOMAIN = "gotripjapan.com";

const nextConfig: NextConfig = {
  images: {
    // Delegate all Cloudinary image optimization to Cloudinary's CDN.
    // The loader returns Cloudinary-transformed URLs directly — /_next/image
    // never fetches or re-encodes Cloudinary images, eliminating the server
    // CPU/memory load that was causing 500/503 errors under heavy traffic.
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",

    // Kept for <Image src> domain validation (security) and for local assets
    // that still go through the browser fetch path.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    // Reduced to the sizes that actually appear in the UI.
    // Fewer buckets = fewer variant cache entries, less disk churn.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Client-router cache for RSC responses.
  // Default since Next 15: dynamic=0 (not cached) — every client-side
  // navigation re-fetches from the server even for pages the user just visited.
  // Raising dynamic to 30 s means a user clicking back/forward or revisiting a
  // tour page within 30 s uses the cached RSC payload instead of spawning a
  // new server request, directly reducing concurrent process load on Hostinger.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },

  // Allow Turbopack (default in Next 16) to handle these packages
  serverExternalPackages: ["bcryptjs", "nodemailer"],

  // Replace Next.js polyfill-module with a no-op — our browserslist (Chrome 111+,
  // Safari 16.4+) natively supports every API it patches, so the bytes are wasted.
  turbopack: {
    resolveAlias: {
      "next/dist/build/polyfills/polyfill-module": "./lib/noop.js",
    },
  },

  async redirects() {
    return [
      // Single canonical domain — strip www. Hostinger panel must NOT also do this redirect.
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${CANONICAL_DOMAIN}` }],
        destination: `https://${CANONICAL_DOMAIN}/:path*`,
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Disable nginx proxy buffering (required for streaming on Hostinger)
          { key: "X-Accel-Buffering", value: "no" },

          // Prevent the site from being embedded in any iframe
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          // Belt-and-suspenders: CSP frame-ancestors overrides X-Frame-Options in modern browsers
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },

          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Strict referrer — avoids leaking the path in cross-origin navigations
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Force HTTPS for 1 year — only effective once the first HTTPS response is received.
          // DO NOT enable this if Hostinger panel "Force HTTPS" is off — pick one layer, not both.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },

          // Restrict access to sensitive browser APIs not used by this app.
          // payment=(self) is required for the Stripe embedded checkout.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
        ],
      },
      // Prevent Hostinger's CDN from caching HTML pages.
      // ISR sets s-maxage on HTML responses which the CDN caches. After a new deployment
      // the CDN serves stale HTML referencing old chunk hashes → ChunkLoadError 404s.
      // Static assets under /_next/static/ are excluded — they keep their immutable headers.
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
