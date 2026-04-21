/**
 * Injects Cloudinary transformation parameters into a Cloudinary upload URL.
 * Safe no-op for non-Cloudinary URLs.
 *
 * @example
 * cldUrl(url, "f_auto,q_auto:good,w_1200,c_fill,g_auto")
 */
export function cldUrl(url: string | null | undefined, transform: string): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  // Avoid double-injecting transforms
  if (url.includes(`/upload/${transform}/`)) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// Preset transforms ---------------------------------------------------------

/** Full-width hero / gallery main image (~1200px wide) */
export const CLD_GALLERY_MAIN = "f_auto,q_auto:good,w_1200,c_fill,g_auto";

/** Gallery side panel / secondary images (~600px) */
export const CLD_GALLERY_SIDE = "f_auto,q_auto:good,w_600,c_fill,g_auto";

/** Lightbox full-screen view (~1600px) */
export const CLD_LIGHTBOX = "f_auto,q_auto:good,w_1600";

/** Lightbox strip thumbnails (128×96) */
export const CLD_LIGHTBOX_THUMB = "f_auto,q_auto,w_128,h_96,c_fill";

/** Tour card / row section cover (~800px) */
export const CLD_CARD = "f_auto,q_auto:good,w_800,c_fill,g_auto";

/** Small thumbnail — nav / destination chips (~96px) */
export const CLD_THUMB = "f_auto,q_auto,w_96,h_96,c_fill";
