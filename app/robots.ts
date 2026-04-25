import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.gotripjapan.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Application routes that must not be indexed
          "/admin/",
          "/api/",
          "/auth/",
          "/booking/",
          "/bookings/",
          // Common WordPress/PHP probe paths.
          // Well-behaved crawlers will respect this; poorly-behaved ones are
          // handled by the middleware returning 410 Gone regardless.
          "/wp-admin/",
          "/wp-login.php",
          "/wp-content/",
          "/xmlrpc.php",
          "/.env",
          "/.git/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
