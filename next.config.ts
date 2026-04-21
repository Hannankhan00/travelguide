import type { NextConfig } from "next";

const CANONICAL_DOMAIN = "gotripjapan.com";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
        ],
      },
    ];
  },
};

export default nextConfig;
