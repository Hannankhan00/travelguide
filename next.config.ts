import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth avatars
      },
    ],
  },

  // Allow Turbopack (default in Next 16) to handle these packages
  serverExternalPackages: ["bcryptjs", "nodemailer"],

  // Disable streaming buffering for proxied environments (Hostinger / nginx)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
