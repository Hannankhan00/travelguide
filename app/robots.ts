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
        disallow: ["/admin/", "/api/", "/auth/", "/booking/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
